/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { notInlinedIconLimit } from "./src/build/notInlinedIcons";

/**
 * 렌더 문서(render.html)는 `<iframe sandbox="allow-scripts">` 안에서 불투명 출처(Origin: null)로 모듈 스크립트·CSS를 받는다(M2A-1 R1 PoC).
 * 모듈 스크립트는 CORS 요청이라 서버가 `Access-Control-Allow-Origin: null`을 돌려줘야 실행된다 — dev·preview 둘 다.
 * 정적 호스팅 요구사항: 앱 JS·CSS 응답에 같은 헤더(REPORT). 그 밖 출처는 Vite 기본(로컬 호스트만)과 같다.
 */
const cors = { origin: ["null", /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/] };

/**
 * 빌드 2회(package.json build): 앱 = `vite build`(index.html) → 렌더 문서 = `vite build --mode render`(render.html, 같은 dist에 덧쓰기).
 * 한 번에 두 엔트리를 빌드하면 react·번들러 런타임이 공유 청크로 갈라져 앱 모든 화면에 청크 오버헤드가 붙는다(R3 실측 공통 +0.14~0.28KB, REPORT).
 * 불투명 출처 iframe은 부모와 HTTP 캐시를 나누지 않으므로 공유 청크로 얻는 내려받기 이득도 없다. 번들 검사는 두 manifest를 합쳐 엔트리 이름으로 판정한다.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: { cors },
  preview: { cors },
  build:
    mode === "render"
      ? { manifest: ".vite/render-manifest.json", emptyOutDir: false, rollupOptions: { input: { render: "render.html" } } }
      : {
          // scripts/check-bundle-size.mjs가 초기 청크를 manifest로 계산한다
          manifest: true,
          // 파일로 둘 아이콘 목록·근거: src/build/notInlinedIcons.ts
          assetsInlineLimit: notInlinedIconLimit,
        },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
}));
