// E0 진단 — 진입 집합 청크의 모듈별 기여(소스맵 빌드 `vite build --sourcemap --outDir <dir>` 산출물에서). gzip은 모듈 조각 단독 gzip(근사 — 청크 안 문맥 압축 미반영)
// 사용: node e0-modules.mjs <sourcemap dist> [복원]  (모듈 해석: app/node_modules/source-map-js)
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { createRequire } from "node:module";
const require = createRequire(new URL("../../../app/package.json", import.meta.url));
const { SourceMapConsumer } = require("source-map-js");
const DIST = process.argv[2];
const m = JSON.parse(readFileSync(join(DIST, ".vite/manifest.json"), "utf8"));
const closure = (k, s) => { if (!m[k] || s.has(m[k].file)) return s; s.add(m[k].file); for (const d of m[k].imports ?? []) closure(d, s); return s; };
const keys = ["index.html", "src/pages/StudioPage.tsx", "src/fixtures/references.ts", "src/fixtures/referenceDetails.ts", "src/data/deferredStudio.ts", "src/data/memoryProjectRepository.ts", "src/components/studio/StudioLayout.tsx", "src/features/studio/gateCheck.ts", ...(process.argv[3] ? ["src/data/persistence/imageRestore.ts"] : [])];
const files = new Set(); for (const k of keys) closure(k, files);
const per = new Map();
for (const f of files) {
  const code = readFileSync(join(DIST, f), "utf8");
  let smc; try { smc = new SourceMapConsumer(JSON.parse(readFileSync(join(DIST, f + ".map"), "utf8"))); } catch { per.set(`(맵 없음) [${f}]`, code); continue; }
  const lines = code.split("\n");
  const segs = [];
  smc.eachMapping((x) => segs.push(x));
  segs.sort((a, b) => a.generatedLine - b.generatedLine || a.generatedColumn - b.generatedColumn);
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i], n = segs[i + 1];
    const line = lines[s.generatedLine - 1] ?? "";
    const end = n && n.generatedLine === s.generatedLine ? n.generatedColumn : line.length;
    const src = (s.source ?? "?").replace(/^.*\/app\//, "").replace(/^.*node_modules\//, "nm/");
    const key = `${src}  [${f.replace("assets/", "").replace(/-[A-Za-z0-9_-]{8}\.js$/, "")}]`;
    per.set(key, (per.get(key) ?? "") + line.slice(s.generatedColumn, end));
  }
}
const rows = [...per].map(([k, t]) => [t.length / 1000, gzipSync(t).length / 1000, k]).sort((a, b) => b[0] - a[0]);
for (const [raw, gz, k] of rows.slice(0, Number(process.env.TOP ?? 40))) console.log(`${raw.toFixed(2).padStart(7)} raw ${gz.toFixed(2).padStart(6)} gz  ${k}`);
