/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * 비교 보드(03b)에서만 쓰는 아이콘은 data URI로 인라인하지 않는다. Icon의 eager glob이 인라인 아이콘을
 * 공통 청크에 넣어 모든 라우트의 첫 화면 JS를 키우기 때문이다(ADR-004). 파일로 두면 공통 청크엔 URL만 남는다.
 */
const NOT_INLINED_ICONS = ["check", "circle-check", "warning", "circle-info", "chevron-down"].map((name) => `/assets/icons/${name}.svg`);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // scripts/check-bundle-size.mjs가 초기 청크를 manifest로 계산한다
  build: {
    manifest: true,
    assetsInlineLimit: (filePath: string) => (NOT_INLINED_ICONS.some((icon) => filePath.endsWith(icon)) ? false : undefined),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
