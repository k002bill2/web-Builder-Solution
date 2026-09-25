import { describe, expect, it } from "vitest";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { boardOf, catalogWithdrawing, resultsOf } from "../test/compareFixtures";
import { pickAllFrom } from "./boardPicks";
import { PICKABLE_ROW_IDS, type CompareBoard } from "./compareBoard";
import { derivePalette } from "./palette";
import { buildProfileDraft, type ReadyDraft } from "./profileDraft";
import { SECTION_LIBRARY } from "./sectionLibrary";

const IDS = ["ref-a", "ref-b", "ref-c"];
const results = resultsOf(IDS);
const LIB = SECTION_LIBRARY.version;
const comparisonOf = (id: string) => results.find((r) => r.referenceId === id)!.comparison!;

function ready(board: CompareBoard, rs = results): ReadyDraft {
  const draft = buildProfileDraft(board, rs, LIB);
  if (draft.status !== "ready") throw new Error("Hero가 선택된 초안이어야 합니다");
  return draft;
}

describe("Hero 전 (S-10·AC-06 데이터)", () => {
  it("Hero가 없으면 기본값을 계산하지 않고 고른 항목만 출처를 보인다", () => {
    const draft = buildProfileDraft(boardOf(IDS, { card: "ref-b" }), results, LIB);
    expect(draft.status).toBe("needs-hero");
    expect(draft.items.find((i) => i.rowId === "card")?.source).toMatchObject({ kind: "pick", columnLabel: "B" });
    expect(draft.items.find((i) => i.rowId === "menu")).toMatchObject({ source: { kind: "pending" }, valueLabel: "Hero를 먼저 고르세요" });
  });

  it("Hero를 고른 열이 회수됐으면 Hero 전과 같다", () => {
    const draft = buildProfileDraft(boardOf(IDS, { hero: "ref-b" }), resultsOf(IDS, catalogWithdrawing("ref-b")), LIB);
    expect(draft.status).toBe("needs-hero");
  });
});

describe("기준 레퍼런스와 기본값 (SPEC 3.2)", () => {
  it("AC-09: Hero=A만 선택하면 나머지 9개 항목이 A 값 + 기본값 출처다", () => {
    const draft = ready(boardOf(IDS, { hero: "ref-a" }));
    expect(draft.baseReferenceId).toBe("ref-a");
    expect(draft.items.map((i) => i.rowId)).toEqual(PICKABLE_ROW_IDS);
    const [hero, ...rest] = draft.items;
    expect(hero!.source).toEqual({ kind: "pick", referenceId: "ref-a", columnLabel: "A", title: "모던 카페 브랜드" });
    expect(rest).toHaveLength(9);
    for (const item of rest) {
      expect(item.source, item.rowId).toEqual({ kind: "default", referenceId: "ref-a", columnLabel: "A", title: "모던 카페 브랜드" });
      expect(item.valueLabel, item.rowId).toBe(comparisonOf("ref-a").cells[item.rowId].label);
    }
  });

  it("AC-07: A로 전부 선택하면 section_plan이 A의 sectionPlan과 같고 template 모드다", () => {
    const board = boardOf(IDS);
    const { profile } = ready({ ...board, picks: pickAllFrom(board, results, "ref-a").picks });
    expect(profile.section_plan).toEqual(comparisonOf("ref-a").sectionPlan);
    expect(profile.selection_mode).toBe("template");
    expect(profile.source_reference_ids).toEqual(["ref-a"]);
  });

  it("조합: header·hero·footer 변형만 선택값으로 바뀌고 섹션 순서는 기준 레퍼런스를 따른다", () => {
    const { profile } = ready(boardOf(IDS, { hero: "ref-a", menu: "ref-b", footer: "ref-c", card: "ref-b" }));
    const plan = profile.section_plan;
    expect(plan.map((s) => s.type)).toEqual(comparisonOf("ref-a").sectionPlan.map((s) => s.type));
    expect(plan[0]).toEqual({ type: "header", variant: "sticky-hamburger" });
    expect(plan.at(-1)).toEqual({ type: "footer", variant: "biz-extended-map" });
    expect(profile.selection_mode).toBe("mix");
    expect(profile.source_reference_ids).toEqual(["ref-a", "ref-b", "ref-c"]);
    expect(profile.component_choices).toEqual({
      hero: { section: "hero", variant: "fullbleed-left" },
      header: { section: "header", variant: "sticky-hamburger" },
      footer: { section: "footer", variant: "biz-extended-map" },
      cta_placement: "hero-inline",
      card_style: { style: "elevated", surfaceTone: "dark" },
      media_ratio: "16:9",
      mobile_pattern: "single-column-bottom-cta",
    });
  });

  it("기준 레퍼런스에 Footer가 없으면 기본 footer/biz-extended를 끝에 붙인다 (R-01)", () => {
    const noFooter = results.map((r) =>
      r.referenceId === "ref-b" && r.comparison
        ? { ...r, comparison: { ...r.comparison, sectionPlan: r.comparison.sectionPlan.filter((s) => s.type !== "footer"), cells: { ...r.comparison.cells, footer: { label: "없음", binding: null } } } }
        : r,
    );
    const draft = ready(boardOf(IDS, { hero: "ref-b" }), noFooter);
    expect(draft.profile.section_plan.at(-1)).toEqual({ type: "footer", variant: "biz-extended" });
    expect(draft.items.find((i) => i.rowId === "footer")?.source).toEqual({ kind: "fallback" });
  });

  it("공통 필드: 기준 레퍼런스의 방향·spacing, 라이브러리 버전은 인자 값", () => {
    const { profile } = ready(boardOf(IDS, { hero: "ref-c" }));
    expect(profile.visual_direction).toBe("trust");
    expect(profile.layout_direction).toBe("center");
    expect(profile.spacing_tokens).toEqual({ grid: "8pt", sectionGap: 88 });
    expect(ready(boardOf(IDS, { hero: "ref-c" }), results).profile.library_version).toBe("1.4");
    const other = buildProfileDraft(boardOf(IDS, { hero: "ref-c" }), results, "2.0");
    expect(other.status === "ready" && other.profile.library_version).toBe("2.0");
  });
});

describe("모션 상한 (R-07)", () => {
  it("AC-11: 모션 '높음'(D)을 고르면 motion_preset은 L2이고 상한 적용 표시가 있다", () => {
    const ids = ["ref-a", "ref-d"];
    const draft = ready(boardOf(ids, { hero: "ref-a", motion: "ref-d" }), resultsOf(ids));
    expect(draft.profile.motion_preset).toBe("L2");
    expect(draft.notices.motionCapped).toBe(true);
  });

  it("낮음→L1, 중간→L2 (상한 표시 없음)", () => {
    expect(ready(boardOf(IDS, { hero: "ref-a" })).profile.motion_preset).toBe("L1");
    const mid = ready(boardOf(IDS, { hero: "ref-b" }));
    expect(mid.profile.motion_preset).toBe("L2");
    expect(mid.notices.motionCapped).toBe(false);
  });
});

describe("사용자 스타일 (SPEC 3.5·8.3)", () => {
  it("대표색은 derivePalette 결과 전체를 DTCG 역할 팔레트로, 원값은 $extensions.seed에 둔다", () => {
    const draft = ready(boardOf(IDS, { hero: "ref-a" }, { custom: { primaryColor: "#C9A96E" } }));
    expect(draft.palette).toEqual(derivePalette("#C9A96E", referenceDetailFixtures["ref-a"]!.palette));
    expect(draft.profile.color_tokens.primary).toEqual({ $type: "color", $value: "#C9A96E" });
    expect(draft.profile.color_tokens.ink).toEqual({ $type: "color", $value: "#2C2C2C" });
    expect(draft.profile.color_tokens.$extensions).toEqual({ seed: "#C9A96E" });
    expect(draft.items.find((i) => i.rowId === "palette")?.source).toEqual({ kind: "custom" });
    expect(draft.profile.selection_mode).toBe("mix");
  });

  it("폰트는 사용자 폰트 > 폰트 행", () => {
    const draft = ready(boardOf(IDS, { hero: "ref-a", font: "ref-b" }, { custom: { fontFamily: "pretendard" } }));
    expect(draft.profile.typography_tokens.family).toBe("Pretendard");
    expect(draft.profile.typography_tokens.scale).toBe(1.2);
  });

  it("R-15: 서로 다른 레퍼런스에서 2개 이상 골랐을 때만 재바인딩 안내", () => {
    expect(ready(boardOf(IDS, { hero: "ref-a", card: "ref-a" })).notices.rebinding).toBe(false);
    expect(ready(boardOf(IDS, { hero: "ref-a", card: "ref-b" })).notices.rebinding).toBe(true);
  });
});

describe("결정성 (AC-10)", () => {
  it("AC-10: 같은 picks·custom·열이면 결과와 seed가 같다", () => {
    const board = boardOf(IDS, { hero: "ref-a", card: "ref-b" }, { custom: { primaryColor: "#123456" } });
    expect(buildProfileDraft(board, results, LIB)).toEqual(buildProfileDraft(board, results, LIB));
  });

  it("AC-10: picks 키 삽입 순서가 달라도 seed가 같고, 선택이 다르면 seed가 다르다", () => {
    const a = ready(boardOf(IDS, { hero: "ref-a", card: "ref-b" })).profile.seed;
    const b = ready(boardOf(IDS, { card: "ref-b", hero: "ref-a" })).profile.seed;
    const c = ready(boardOf(IDS, { hero: "ref-a", card: "ref-c" })).profile.seed;
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });

  it("revision·updatedAt은 seed에 영향이 없다", () => {
    const board = boardOf(IDS, { hero: "ref-a" });
    const later = { ...board, revision: 9, updatedAt: "2026-09-26T00:00:00.000Z" };
    expect(ready(board).profile.seed).toBe(ready(later).profile.seed);
  });
});
