/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { notInlinedIconLimit } from "./src/build/notInlinedIcons";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // scripts/check-bundle-size.mjs가 초기 청크를 manifest로 계산한다
  build: {
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
});
