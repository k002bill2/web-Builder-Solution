// 썸네일 빌드 단계 (M3P-2 · SPEC 3절 A · package.json build의 tsc 다음) — 새 의존성 0(vite·react-dom/server·jsdom 기존).
// 1) 렌더 문서 CSS = `vite build --mode render`를 산출 폴더(node_modules/.thumbs/render)에 한 번 더(배포 dist와 바이트 동일은 check-bundle-size 가드)
// 2) `vite build --mode thumbs`(SSR 엔트리 src/thumbs/entry.tsx) → 3) jsdom 창을 전역에 두고 레퍼런스마다 SVG → 가드(U8·G2·G6) 위반이면 실패
// 4) node_modules/.thumbs/out/{id}.svg · meta.json(ids · 버전 · 렌더 CSS 해시) — 앱 `vite build`의 thumbnailsPlugin이 dist/thumbs/{id}.svg로 내보내고 버전을 정의한다(ADR-004 개정 7 결정 1).
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { JSDOM } from "jsdom";
import { build } from "vite";
import { thumbsVersion } from "./thumbsVersion.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const STAGE = join(ROOT, "node_modules/.thumbs");
const configFile = join(ROOT, "vite.config.ts");
rmSync(STAGE, { recursive: true, force: true });

await build({ configFile, mode: "render", logLevel: "warn", build: { outDir: join(STAGE, "render"), emptyOutDir: true } });
const renderManifest = JSON.parse(readFileSync(join(STAGE, "render/.vite/render-manifest.json"), "utf8"));
const cssFiles = renderManifest["render.html"]?.css ?? [];
if (cssFiles.length === 0) throw new Error("[thumbs] 렌더 문서 CSS가 없습니다");
const renderCss = cssFiles.map((file) => readFileSync(join(STAGE, "render", file), "utf8")).join("\n");

await build({ configFile, mode: "thumbs", logLevel: "warn" });
const { window } = new JSDOM("");
Object.assign(globalThis, { document: window.document, XMLSerializer: window.XMLSerializer, DOMParser: window.DOMParser });
const { buildThumbnails, thumbnailIssues } = await import(pathToFileURL(join(STAGE, "ssr/entry.mjs")).href);

const thumbs = buildThumbnails(renderCss);
const failures = thumbs.flatMap((t) => thumbnailIssues(t.svg).map((issue) => `${t.id}: ${issue}`));
if (thumbs.length === 0) failures.push("썸네일 0장");
if (failures.length > 0) {
  for (const failure of failures) console.error(`[thumbs] 가드 실패 — ${failure}`);
  process.exit(1);
}
const out = join(STAGE, "out");
mkdirSync(out, { recursive: true });
for (const t of thumbs) {
  writeFileSync(join(out, `${t.id}.svg`), t.svg);
  console.log(`[thumbs] ${t.id}.svg ${(Buffer.byteLength(t.svg) / 1000).toFixed(2)}KB · gzip ${(gzipSync(t.svg).length / 1000).toFixed(2)}KB`);
}
const version = thumbsVersion(thumbs);
const meta = { ids: thumbs.map((t) => t.id), version, renderCssSha256: createHash("sha256").update(renderCss).digest("hex") };
writeFileSync(join(out, "meta.json"), JSON.stringify(meta, null, 2));
console.log(`[thumbs] ${thumbs.length}장 · 버전 ${version} · 가드 통과(U8·G2·G6)`);
