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

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // scripts/check-bundle-size.mjs가 초기 청크를 manifest로 계산한다
  server: { cors },
  preview: { cors },
  build: {
    manifest: true,
    // 앱(index.html) + 렌더 문서(render.html, 편집기 캔버스 iframe — ADR-004 개정 2). 엔트리 이름은 번들 검사 스크립트가 고정한다
    rollupOptions: { input: { index: "index.html", render: "render.html" } },
    // 파일로 둘 아이콘 목록·근거: src/build/notInlinedIcons.ts
    assetsInlineLimit: notInlinedIconLimit,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
