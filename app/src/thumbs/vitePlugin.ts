/**
 * 썸네일 파일·버전 플러그인 (M3P-2 · ADR-004 개정 7 결정 1) — 앱 `vite build`에서만 scripts/build-thumbs.mjs 산출(node_modules/.thumbs/out)을
 * 고정 경로 `dist/thumbs/{id}.svg`로 내보내고 `__THUMBS_VERSION__`(21장 내용 해시)을 정의한다.
 * render·thumbs 모드·SSR·dev·preview·vitest = 빈 값 + 파일 0(카드는 와이어 유지 — SPEC 3절 dev 서버). 그때는 산출물을 읽지 않는다(build-thumbs가 지운 뒤 render 빌드를 부른다).
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

export const THUMBS_OUT = "node_modules/.thumbs/out";

interface ThumbsMeta {
  readonly ids: readonly string[];
  readonly version: string;
}

export function thumbnailsPlugin(): Plugin {
  let meta: ThumbsMeta | undefined;
  let out = "";
  return {
    name: "thumbnails",
    config(config, env) {
      const active = env.command === "build" && !env.isSsrBuild && !config.build?.ssr && env.mode !== "render" && env.mode !== "thumbs";
      out = join(config.root ?? process.cwd(), THUMBS_OUT);
      if (!active) return { define: { __THUMBS_VERSION__: JSON.stringify("") } };
      const file = join(out, "meta.json");
      // 앱 빌드에서 버전이 비면 카드 img 분기가 통째로 접혀 예산이 거짓으로 통과한다 — 산출물이 없으면 실패
      if (!existsSync(file)) throw new Error(`썸네일 산출물이 없습니다(${file}) — scripts/build-thumbs.mjs를 먼저 실행하세요`);
      meta = JSON.parse(readFileSync(file, "utf8")) as ThumbsMeta;
      if (!/^[0-9a-f]{8}$/.test(meta.version) || meta.ids.length === 0) throw new Error(`썸네일 meta.json 형식이 틀립니다(${file})`);
      return { define: { __THUMBS_VERSION__: JSON.stringify(meta.version) } };
    },
    generateBundle() {
      for (const id of meta?.ids ?? []) this.emitFile({ type: "asset", fileName: `thumbs/${id}.svg`, source: readFileSync(join(out, `${id}.svg`), "utf8") });
    },
  };
}
