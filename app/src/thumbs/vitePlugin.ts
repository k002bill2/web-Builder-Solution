/**
 * 썸네일 키·파일 플러그인 (M3P-2) — 앱 `vite build`에서만 scripts/build-thumbs.mjs 산출(node_modules/.thumbs/out)을 `dist/thumbs/{key}.svg`로 내보내고
 * `virtual:thumbnail-keys`(id → 키)를 채운다. render·thumbs 모드·dev·vitest = 빈 맵 + 파일 0(카드는 와이어 유지 — SPEC 3절 dev 서버).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

export const THUMBS_OUT = "node_modules/.thumbs/out";
const VIRTUAL = "virtual:thumbnail-keys";

export function thumbnailsPlugin(): Plugin {
  let keys: Readonly<Record<string, string>> = {};
  let out = "";
  let active = false;
  return {
    name: "thumbnail-keys",
    configResolved(config) {
      active = config.command === "build" && !config.build.ssr && config.mode !== "render" && config.mode !== "thumbs";
      out = join(config.root, THUMBS_OUT);
    },
    buildStart() {
      if (!active) return;
      const file = join(out, "keys.json");
      if (!existsSync(file)) this.error(`썸네일 산출물이 없습니다(${file}) — scripts/build-thumbs.mjs를 먼저 실행하세요`);
      keys = JSON.parse(readFileSync(file, "utf8")) as Record<string, string>;
    },
    resolveId: (id) => (id === VIRTUAL ? `\0${VIRTUAL}` : undefined),
    load: (id) => (id === `\0${VIRTUAL}` ? `export default ${JSON.stringify(keys)};` : undefined),
    generateBundle() {
      if (!active) return;
      for (const key of Object.values(keys)) this.emitFile({ type: "asset", fileName: `thumbs/${key}.svg`, source: readFileSync(join(out, `${key}.svg`), "utf8") });
    },
  };
}
