// @vitest-environment node
import { readFileSync } from "node:fs";

/**
 * 렌더 문서 웹폰트 0 (M2A-2b B8 · m2a 0.4 "VS-1 킷은 @font-face·웹폰트 파일을 싣지 않는다" · M2A-2a 8절 4).
 * 킷 글꼴 = 프로필 계열 이름 + 시스템 대체 스택(--site-font) · 폴백 와이어프레임 글자도 같은 스택(앱 DS 클래스가 쓰는 --font-sans를 사이트 루트에서 덮는다).
 */
const css = (path: string) => readFileSync(path, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("렌더 문서 웹폰트 0 (B8)", () => {
  it("render.css는 앱 fonts.css를 싣지 않는다 · @font-face·woff 0 (render.css · kit.css)", () => {
    for (const path of ["src/render/render.css", "src/kit/kit.css"]) {
      expect(css(path)).not.toMatch(/fonts\.css|@font-face|\.woff2?\b/);
    }
  });

  it("폴백 글자 스택 = 킷 스택: 사이트 루트에서 --font-sans = --site-font(없으면 시스템 sans) · 루트 기본도 시스템 sans(웹폰트 이름 없음)", () => {
    const render = css("src/render/render.css");
    expect(render).toMatch(/\[data-site-root\]\s*\{[^}]*--font-sans:\s*var\(--site-font,\s*system-ui,\s*sans-serif\)/);
    expect(render).toMatch(/:root\s*\{[^}]*--font-sans:\s*system-ui,\s*sans-serif/);
  });
});
