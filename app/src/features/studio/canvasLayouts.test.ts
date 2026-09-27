import { SECTION_DEFINITIONS } from "../../engine/sections/registry";
import { canvasLayout, canvasVars } from "./canvasLayouts";

describe("캔버스 변형별 모양 표 (SPEC r4.7 A3-Q7 · 5.7)", () => {
  it("엔진 레지스트리의 모든 변형이 표에 있다(기본 블록 아님)", () => {
    const missing = SECTION_DEFINITIONS.filter((d) => canvasLayout(d.type, d.variant) === "block").map((d) => `${d.type}/${d.variant}`);
    expect(missing).toEqual([]);
  });

  it("대표 모양 — Header 바 · Hero 6종 · 카드 N열/벽돌형/목록 · 이미지 그리드 · 어두운 Footer · 띠", () => {
    expect(canvasLayout("header", "transparent")).toBe("bar");
    expect(["fullbleed-left", "center", "split", "grid", "text", "image"].map((v) => canvasLayout("hero", v))).toEqual(["cover", "center", "split", "tiles", "text", "image"]);
    expect(["cards-3", "cards-2", "cards-masonry", "list"].map((v) => canvasLayout("services", v))).toEqual(["cols3", "cols2", "masonry", "list"]);
    expect(["grid-3", "grid-2", "masonry"].map((v) => canvasLayout("portfolio", v))).toEqual(["cols3", "cols2", "masonry"]);
    expect(canvasLayout("footer", "minimal")).toBe("dark");
    expect(canvasLayout("cta-band", "banner")).toBe("band");
  });

  it("모르는 변형·유형 = 기본 블록(예외 0)", () => {
    expect(canvasLayout("services", "carousel")).toBe("block");
    expect(canvasLayout("gallery" as never, "grid")).toBe("block");
  });

  it("CSS 변수 --canvas-* — 팔레트 값 그대로, 없으면(조회 전·실패) 중립 토큰 참조", () => {
    const palette = { primary: "#123456", surface: "#eeeeee", ink: "#111111", muted: "#999999", bg: "#ffffff" };
    expect(canvasVars(palette)).toEqual({ "--canvas-primary": "#123456", "--canvas-surface": "#eeeeee", "--canvas-ink": "#111111", "--canvas-muted": "#999999", "--canvas-bg": "#ffffff" });
    const neutral = canvasVars(undefined);
    expect(Object.keys(neutral)).toEqual(["--canvas-primary", "--canvas-surface", "--canvas-ink", "--canvas-muted", "--canvas-bg"]);
    for (const value of Object.values(neutral)) expect(value).toMatch(/^var\(--[a-z-]+\)$/);
  });
});
