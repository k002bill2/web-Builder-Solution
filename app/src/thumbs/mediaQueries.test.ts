// @vitest-environment node
import { resolveMedia } from "./mediaQueries";

describe("resolveMedia — 1280 기준 @media 해소 (M3P-AC-G6)", () => {
  it("맞는 블록은 펼치고 안 맞는 블록은 지운다 — @layer 안 중첩 포함", () => {
    const css = "a{x:1}@layer u{@media (width>=48rem){b{x:2}}@media (width>=96rem){c{x:3}}}@media (48rem <= width < 64rem){d{x:4}}@media (width>=48rem) and ((width<64rem)){e{x:5}}@media (width>=80rem){f{x:6}}";
    expect(resolveMedia(css, 1280)).toBe("a{x:1}@layer u{b{x:2}}f{x:6}");
  });
  it("prefers-reduced-motion:no-preference = 거짓(모션 최종 상태) · screen = 참 · 쉼표 = 또는", () => {
    expect(resolveMedia("@media screen and (prefers-reduced-motion:no-preference){a{x:1}}", 1280)).toBe("");
    expect(resolveMedia("@media print, (width>=40rem){a{x:1}}", 1280)).toBe("a{x:1}");
    expect(resolveMedia("@media (min-width: 768px){a{x:1}}@media (max-width: 767px){b{x:1}}", 1280)).toBe("a{x:1}");
  });
  it("모르는 조건은 throw — 조용히 남기거나 지우지 않는다", () => {
    expect(() => resolveMedia("@media (hover:hover){a{x:1}}", 1280)).toThrow(/hover/);
  });
  it("결과에 @media 0", () => {
    expect(resolveMedia("@media (width>=48rem){@media (width>=64rem){a{x:1}}}", 1280)).toBe("a{x:1}");
  });
});
