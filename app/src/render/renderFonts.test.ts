// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * 렌더 문서 웹폰트 (M2A-2b B8 → M2B-4a MF-AC-G2 개정: "웹폰트 0" → "허용 파일만·허용 경로만").
 * `@font-face` 출처 = `kit/fonts.css` 1곳(사이트 허용 3계열 × 400·700 = 6파일) · 앱 `styles/tokens/fonts.css`(Pretendard 4굵기)는 싣지 않는다.
 * 킷 글꼴 = 별칭 + 시스템 대체 스택(--site-font) · 폴백 와이어프레임 글자도 같은 스택(앱 DS 클래스가 쓰는 --font-sans를 사이트 루트에서 덮는다).
 */
const css = (path: string) => readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const ALLOWED = [
  "../assets/fonts/Pretendard-Regular.subset.woff2",
  "../assets/fonts/Pretendard-Bold.subset.woff2",
  "../assets/site-fonts/kit-sans-kr/KitSansKR-400.woff2",
  "../assets/site-fonts/kit-sans-kr/KitSansKR-700.woff2",
  "../assets/site-fonts/kit-serif-kr/KitSerifKR-400.woff2",
  "../assets/site-fonts/kit-serif-kr/KitSerifKR-700.woff2",
];

describe("렌더 문서 웹폰트 = 허용 파일만 (B8 → G2)", () => {
  it("render.css·kit.css: 앱 fonts.css 미포함 · @font-face·woff 0 — @font-face 출처는 render.css가 싣는 kit/fonts.css 1곳", () => {
    for (const path of ["src/render/render.css", "src/kit/kit.css"]) {
      expect(css(path)).not.toMatch(/tokens\/fonts\.css|@font-face|\.woff2?\b/);
    }
    expect(css("src/render/render.css").match(/@import\s+"[^"]*fonts\.css"/g)).toEqual(['@import "../kit/fonts.css"']);
  });

  it("kit/fonts.css: @font-face 6규칙 · url() = 허용 6파일(실재)만 · 외부 URL 0 · swap · local() 0 · 사이트 루트 font-synthesis: none", () => {
    const text = css("src/kit/fonts.css");
    const faces = text.match(/@font-face\s*\{[^}]*\}/g) ?? [];
    expect(faces).toHaveLength(6);
    const urls = [...text.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]);
    expect(urls).toEqual(ALLOWED);
    for (const url of urls) expect(existsSync(resolve("src/kit", url!))).toBe(true);
    for (const face of faces) expect(face).toMatch(/font-display:\s*swap/);
    expect(text).not.toMatch(/local\(|https?:|\/\//);
    expect(text).toMatch(/\[data-site-root\]\s*\{[^}]*font-synthesis:\s*none/);
  });

  it("폴백 글자 스택 = 킷 스택: 사이트 루트에서 --font-sans = --site-font(없으면 시스템 sans) · 루트 기본도 시스템 sans(웹폰트 이름 없음)", () => {
    const render = css("src/render/render.css");
    expect(render).toMatch(/\[data-site-root\]\s*\{[^}]*--font-sans:\s*var\(--site-font,\s*system-ui,\s*sans-serif\)/);
    expect(render).toMatch(/:root\s*\{[^}]*--font-sans:\s*system-ui,\s*sans-serif/);
  });
});
