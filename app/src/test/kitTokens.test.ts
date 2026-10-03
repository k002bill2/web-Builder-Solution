import { ON_PRIMARY } from "../domain/contrast";
import { effectiveProfile } from "../domain/effectiveProfile";
import type { DesignProfileInput } from "../domain/compareBoard";
import { compactSectionGap, SITE_ON_PRIMARY } from "../kit/tokens";

/** 킷(렌더 문서)은 domain을 import하지 않는다(kitGuard) — 같은 값·같은 규칙인지 여기서 대조 (M2A-2a K1) */
describe("킷 토큰 ↔ 도메인 정본 대조", () => {
  it("on-primary = contrast.ts ON_PRIMARY(흰색, 게이트 C-1 글자색)", () => {
    const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(ON_PRIMARY.slice(i, i + 2), 16));
    expect(SITE_ON_PRIMARY).toBe(`rgb(${r} ${g} ${b})`);
  });

  it.each([96, 80, 64, 120, 40, 8])("촘촘 섹션 간격(%i) = effectiveProfile 규칙", (gap) => {
    const base = { spacing_tokens: { grid: "8pt", sectionGap: gap } } as DesignProfileInput;
    expect(compactSectionGap(gap)).toBe(effectiveProfile(base, { density: "compact" }).spacing_tokens.sectionGap);
  });
});
