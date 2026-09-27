import type { PlannedSection } from "../domain/generation";
import { hashDoc } from "../engine/ops/hash";
import { validatePageDoc } from "../engine/validate/validatePageDoc";
import { checkSaveDoc, writeStartDoc, type StartDocInput } from "./startDocWrite";

const s = (type: PlannedSection["type"], variant: string, motion: PlannedSection["motion"] = "L1"): PlannedSection => ({ type, variant, motion });
const SECTIONS: readonly PlannedSection[] = [
  s("header", "sticky-right-cta"),
  s("hero", "split", "L2"),
  s("about", "split", "L2"),
  s("services", "grid-2", "L2"),
  s("portfolio", "masonry"),
  s("contact", "form"),
  s("footer", "biz-extended"),
];
const input = (sections: readonly PlannedSection[] = SECTIONS): StartDocInput =>
  Object.freeze({ candidateId: "B", sections, libraryVersion: "1.4", generatorVersion: "preview-1", profileVersion: 2, projectId: "project-1", updatedAt: "2026-09-27T01:02:03.000Z" });

describe("startDoc 어댑터 (SPEC 8.2.1 ①~④)", () => {
  it("표로 매핑 · motion 전달(정의 상한) · updatedAt = 주입값 · 바뀐 쌍 목록과 알림 1문장", () => {
    const result = writeStartDoc(input());
    if (!result.ok) throw new Error(result.alert);
    const { doc } = result;
    expect(validatePageDoc(doc).ok).toBe(true);
    expect(doc.hash).toBe(hashDoc(doc));
    expect(doc).toMatchObject({ projectId: "project-1", revision: 1, candidateId: "B", profileVersion: 2, updatedAt: "2026-09-27T01:02:03.000Z" });
    expect(doc.sections.map((x) => `${x.type}/${x.variant}/${x.motion}`)).toEqual([
      "header/sticky-right-cta/L1",
      "hero/split/L2",
      "about/story/L2",
      "services/cards-3/L2",
      "portfolio/grid-3/L1",
      "contact/form/L1",
      "footer/biz-extended/L0",
    ]);
    expect(result.changes).toEqual([
      { type: "about", from: "split", to: "story" },
      { type: "services", from: "grid-2", to: "cards-3" },
      { type: "portfolio", from: "masonry", to: "grid-3" },
    ]);
    expect(result.changeNotice).toBe(
      "구조안의 섹션 3개를 편집기 변형으로 바꿔 열었습니다 — About 2단 소개 → 이야기 + 이미지 · Services 2열 → 카드 3개 · Portfolio 마소니 → 이미지 그리드 3칸",
    );
  });

  it("바뀐 쌍 0개면 알림 없음 · 같은 쌍 여러 섹션은 한 번만 적는다", () => {
    const same = writeStartDoc(input([s("header", "sticky-right-cta"), s("hero", "split"), s("about", "story"), s("services", "list"), s("portfolio", "grid-3"), s("contact", "form"), s("footer", "biz-extended")]));
    expect(same.ok && same.changes).toEqual([]);
    expect(same.ok && same.changeNotice).toBeUndefined();
    const twice = writeStartDoc(input([s("header", "sticky-right-cta"), s("hero", "split"), s("about", "story"), s("services", "grid-3"), s("services", "grid-3"), s("portfolio", "grid-3"), s("contact", "form"), s("footer", "biz-extended")]));
    expect(twice.ok && twice.changes).toEqual([{ type: "services", from: "grid-3", to: "cards-3" }]);
    expect(twice.ok && twice.changeNotice).toBe("구조안의 섹션 2개를 편집기 변형으로 바꿔 열었습니다 — Services 3열 → 카드 3개");
  });

  it("표 밖 쌍 → UNKNOWN_VARIANT (b) 문장 · 엔진 호출 전 거부", () => {
    expect(writeStartDoc(input([...SECTIONS.slice(0, 3), s("about", "gallery"), ...SECTIONS.slice(3)]))).toEqual({
      ok: false,
      reason: "UNKNOWN_VARIANT",
      alert: "이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다(About · gallery) — 다른 안을 고르세요",
    });
    const unknownType = writeStartDoc(input([...SECTIONS, { type: "gallery", variant: "grid", motion: "L1" } as unknown as PlannedSection]));
    expect(unknownType).toMatchObject({ ok: false, reason: "UNKNOWN_VARIANT", alert: expect.stringContaining("(gallery · grid)") });
  });

  it("엔진 예외(BAD_VALUE — 구조 R-01·R-02·검증) → 쓰기 대신 (b) 다른 문장", () => {
    expect(writeStartDoc(input(SECTIONS.filter((x) => x.type !== "footer")))).toEqual({
      ok: false,
      reason: "BAD_VALUE",
      alert: "이 안으로 편집 문서를 만들 수 없습니다 — 다른 안을 고르세요",
    });
    expect(writeStartDoc({ ...input(), updatedAt: "어제" })).toMatchObject({ ok: false, reason: "BAD_VALUE" });
  });
});

describe("saveDoc 모양 검사 (8.3 판정 1 — L4 검증 함수)", () => {
  const made = writeStartDoc(input());
  const doc = made.ok ? made.doc : undefined!;
  it("통과 · 다른 프로젝트 id · 해시 불일치 · 모양 오류는 거부", () => {
    expect(checkSaveDoc("project-1", doc)).toEqual({ ok: true, doc });
    expect(checkSaveDoc("project-2", doc)).toMatchObject({ ok: false });
    expect(checkSaveDoc("project-1", { ...doc, meta: { title: "바뀜", description: "" } })).toMatchObject({ ok: false, message: expect.stringContaining("hash") });
    expect(checkSaveDoc("project-1", { ...doc, sections: "x" })).toMatchObject({ ok: false });
    expect(checkSaveDoc("project-1", null)).toMatchObject({ ok: false });
  });
});
