import { describe, expect, it } from "vitest";
import { FIXTURE_CATALOG, UNLISTED_FONT, catalogWithFont } from "../test/compareFixtures";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FONT_LICENSE_PENDING_LABEL, buildReferenceComparison, isRowUniform, resolveComparisons, type ComparisonSource } from "./comparisonCells";
import { SECTION_LIBRARY, type SectionLibrary } from "./sectionLibrary";

const sourceOf = (id: string): ComparisonSource => ({
  reference: referenceFixtures.find((r) => r.id === id)!,
  detail: referenceDetailFixtures[id]!,
  attributes: referenceComparisonAttributes[id]!,
});
const build = (id: string, library: SectionLibrary = SECTION_LIBRARY) => buildReferenceComparison(sourceOf(id), library);

describe("레퍼런스 → 12행 셀 값 (SPEC 2.3·8.1)", () => {
  it("픽스처 6개 모두 비교 데이터가 있다", () => {
    for (const ref of referenceFixtures) expect(referenceComparisonAttributes[ref.id], ref.id).toBeDefined();
  });

  it("A: Hero·메뉴·CTA 셀은 표시 문자열과 우리 쪽 바인딩을 분리해 갖는다 (FR-SEL-02)", () => {
    const { cells } = build("ref-a");
    expect(cells.hero).toEqual({
      label: "풀블리드 이미지 + 좌측 카피",
      binding: { kind: "section", sectionType: "hero", variant: "fullbleed-left" },
    });
    expect(cells.menu.label).toBe("5개 · 우측 CTA");
    expect(cells.menu.binding).toEqual({ kind: "section", sectionType: "header", variant: "sticky-right-cta" });
    expect(cells.cta).toEqual({ label: "히어로 좌측 하단", binding: { kind: "choice", field: "cta_placement", value: "hero-inline" } });
  });

  it("A: 팔레트·폰트·모션은 상세·레퍼런스 값에서 계산한다", () => {
    const { cells } = build("ref-a");
    expect(cells.palette.label).toBe("#8B5E3C · 크림");
    expect(cells.palette.binding).toEqual({ kind: "palette", palette: referenceDetailFixtures["ref-a"]!.palette });
    expect(cells.font).toEqual({
      label: "Pretendard 700 / 400",
      binding: { kind: "typography", family: "Pretendard", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
    });
    expect(cells.motion).toEqual({ label: "낮음", binding: { kind: "motion", level: "low" } });
  });

  it("B: 카드는 스타일·표면 톤으로 바인딩된다", () => {
    expect(build("ref-b").cells.card).toEqual({
      label: "엘리베이티드 · 다크",
      binding: { kind: "card", style: "elevated", surfaceTone: "dark" },
    });
  });

  it("info 행(섹션 수·접근성·성능)은 바인딩이 없다", () => {
    const { cells } = build("ref-c");
    expect(cells.sectionCount).toEqual({ label: "8개", binding: null }); // M3P-7 ★A: 의료진(about 중복) 행을 뺀 8개
    expect(cells.quality).toEqual({ label: "접근성 98 · 성능 95 (측정일 2026-09-20)", binding: null });
  });

  it("A의 sectionPlan 끝에 footer/biz-extended가 있다 (SPEC 8.5 — M3P-7 ★A: 상세도 렌더 1:1로 Footer 포함 9개)", () => {
    const a = build("ref-a");
    expect(a.sectionPlan.at(-1)).toEqual({ type: "footer", variant: "biz-extended" });
    expect(referenceDetailFixtures["ref-a"]!.sections).toHaveLength(9);
    expect(a.cells.sectionCount.label).toBe("9개");
  });

  it("Footer 셀은 사업자정보 여부를 meta로 갖는다 (R-12)", () => {
    expect(build("ref-a").cells.footer.meta).toEqual({ hasBusinessInfo: true });
    expect(build("ref-b").cells.footer).toEqual({
      label: "미니멀 · 링크만",
      binding: { kind: "section", sectionType: "footer", variant: "minimal" },
      meta: { hasBusinessInfo: false },
    });
    expect(build("ref-c").cells.footer.label).toBe("확장형 + 지도");
  });

  it("레퍼런스에 해당 섹션이 없으면 '없음' + 바인딩 null (P-4)", () => {
    const source = sourceOf("ref-b");
    const noFooter = {
      ...source,
      attributes: { ...source.attributes, sectionPlan: source.attributes.sectionPlan.filter((s) => s.type !== "footer") },
    };
    expect(buildReferenceComparison(noFooter, SECTION_LIBRARY).cells.footer).toEqual({ label: "없음", binding: null });
  });
});

describe("AC-26 라이브러리 호환 (SPEC 8.2)", () => {
  const withoutMinimal: SectionLibrary = {
    ...SECTION_LIBRARY,
    version: "1.5",
    sections: {
      ...SECTION_LIBRARY.sections,
      footer: Object.fromEntries(Object.entries(SECTION_LIBRARY.sections.footer).filter(([v]) => v !== "minimal")),
    },
  };

  it("AC-26: 현재 라이브러리에 없고 대응표도 없으면 '현재 라이브러리에 없는 변형' + 선택 불가", () => {
    expect(build("ref-b", withoutMinimal).cells.footer).toEqual({
      label: "현재 라이브러리에 없는 변형",
      binding: null,
      unavailableReason: "library",
    });
  });

  it("AC-26: 대응표(variantMigrations)가 있으면 새 변형으로 바꿔 바인딩한다", () => {
    const migrated: SectionLibrary = { ...withoutMinimal, variantMigrations: { footer: { minimal: "minimal-links" } } };
    const footer = build("ref-b", {
      ...migrated,
      sections: { ...migrated.sections, footer: { ...migrated.sections.footer, "minimal-links": { label: "미니멀 · 링크", hasBusinessInfo: false, businessInfoVariant: "biz-compact" } } },
    }).cells.footer;
    expect(footer.binding).toEqual({ kind: "section", sectionType: "footer", variant: "minimal-links" });
    expect(footer.unavailableReason).toBeUndefined();
  });
});

describe("모두 같음 (SPEC 2.3)", () => {
  it("모든 열 값이 같으면 true, 하나라도 다르면 false", () => {
    const [a, c, f] = [build("ref-a"), build("ref-c"), build("ref-f")];
    expect(isRowUniform("font", [a, c, f])).toBe(true);
    expect(isRowUniform("hero", [a, c, f])).toBe(false);
    expect(isRowUniform("hero", [])).toBe(false);
  });
});

describe("D1 폰트 라이선스 (ADR-005 D1-갱신)", () => {
  it("허용 목록 3종(Noto Serif KR 포함)은 선택할 수 있다", () => {
    const b = resolveComparisons(["ref-b"], FIXTURE_CATALOG, SECTION_LIBRARY)[0]!.comparison!;
    expect(b.cells.font.binding).toMatchObject({ kind: "typography", family: "Noto Serif KR" });
  });

  it("목록 밖 폰트 셀은 '라이선스 확인 중' + 선택 불가(바인딩 null)", () => {
    const a = resolveComparisons(["ref-a"], catalogWithFont("ref-a"), SECTION_LIBRARY)[0]!.comparison!;
    expect(a.cells.font).toMatchObject({ binding: null, unavailableReason: "license" });
    expect(a.cells.font.label).toContain(UNLISTED_FONT);
    expect(a.cells.font.label).toContain(FONT_LICENSE_PENDING_LABEL);
  });
});
