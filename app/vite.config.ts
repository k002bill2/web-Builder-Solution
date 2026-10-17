/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { notInlinedIconLimit } from "./src/build/notInlinedIcons";
import { createPreloadDedup } from "./src/build/preloadDedup";
import { sharedDataChunkGroups } from "./src/build/sharedDataChunks";
import { studioEngineChunk } from "./src/build/studioEngineChunk";
import { thumbnailsPlugin } from "./src/thumbs/vitePlugin";

/**
 * 렌더 문서(render.html)는 `<iframe sandbox="allow-scripts">` 안에서 불투명 출처(Origin: null)로 모듈 스크립트·CSS를 받는다(M2A-1 R1 PoC).
 * 모듈 스크립트는 CORS 요청이라 서버가 `Access-Control-Allow-Origin: null`을 돌려줘야 실행된다 — dev·preview 둘 다.
 * 정적 호스팅 요구사항: 앱 JS·CSS 응답에 같은 헤더(REPORT). 그 밖 출처는 Vite 기본(로컬 호스트만)과 같다.
 */
/**
 * preload 목록 줄이기(STUDIO-PRELOAD-SLIM · REPORT-M2 후보 1·2 — 동작 변화 0):
 *  - resolveDependencies: dynamic import preload 목록에서 호스트·엔트리 정적 닫힘(이미 받은 청크)을 뺀다. index.html 링크는 그대로.
 *    번들은 preloadDedup.plugin이 generateBundle(pre)에서 잡는다 — Vite 내부 순서 의존·근거: src/build/preloadDedup.ts
 *  - polyfill: false — 기본 target(baseline-widely-available) 중 modulepreload 미지원(Firefox 114 · Safari 16.4~16.x)은
 *    index.html 정적 청크 미리 받기만 빠진다(받는 순서만 모듈 그래프 순). 동적 import preload는 헬퍼가 relList.supports로 따로 처리.
 *  산출물 가드: scripts/preloadGuard.mjs(check-bundle-size.mjs가 부른다). 앱 빌드에만 — 렌더 문서 빌드는 그대로.
 */
const preloadDedup = createPreloadDedup();

const cors = { origin: ["null", /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/] };

/**
 * 빌드 2회(package.json build): 앱 = `vite build`(index.html) → 렌더 문서 = `vite build --mode render`(render.html, 같은 dist에 덧쓰기).
 * 한 번에 두 엔트리를 빌드하면 react·번들러 런타임이 공유 청크로 갈라져 앱 모든 화면에 청크 오버헤드가 붙는다(R3 실측 공통 +0.14~0.28KB, REPORT).
 * 불투명 출처 iframe은 부모와 HTTP 캐시를 나누지 않으므로 공유 청크로 얻는 내려받기 이득도 없다. 번들 검사는 두 manifest를 합쳐 엔트리 이름으로 판정한다.
 */
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), thumbnailsPlugin(), preloadDedup.plugin],
  server: { cors },
  preview: { cors },
  build:
    mode === "render"
      ? { manifest: ".vite/render-manifest.json", emptyOutDir: false, rollupOptions: { input: { render: "render.html" } } }
      : mode === "thumbs"
        ? // 썸네일 SSR 빌드 도구(M3P-2 — scripts/build-thumbs.mjs가 부른다). 배포 산출물 아님: node_modules/.thumbs/ssr
          { ssr: "src/thumbs/entry.tsx", outDir: "node_modules/.thumbs/ssr", emptyOutDir: true, copyPublicDir: false, rollupOptions: { output: { entryFileNames: "entry.mjs" } } }
        : {
          // scripts/check-bundle-size.mjs가 초기 청크를 manifest로 계산한다
          manifest: true,
          modulePreload: { resolveDependencies: preloadDedup.resolveDependencies, polyfill: false },
          // 파일로 둘 아이콘 목록·근거: src/build/notInlinedIcons.ts
          assetsInlineLimit: notInlinedIconLimit,
          // 편집기 엔진 공유 청크 1개(issue + runGate) — 목록·근거: src/build/studioEngineChunk.ts · 작은 공유 모듈 짝 합침 — src/build/sharedDataChunks.ts
          rollupOptions: { output: { codeSplitting: { groups: [{ name: "issue", test: studioEngineChunk, includeDependenciesRecursively: false }, ...sharedDataChunkGroups()] } } },
        },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
}));
