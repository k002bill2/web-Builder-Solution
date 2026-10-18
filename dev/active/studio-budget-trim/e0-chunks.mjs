// E0 진단 — /studio·복원 진입 집합 청크별 정규화 gzip 기여(check-bundle-size.mjs와 같은 규칙). 사용: node e0-chunks.mjs <app/dist>
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const DIST = process.argv[2];
const m = JSON.parse(readFileSync(join(DIST, ".vite/manifest.json"), "utf8"));
const norm = (c) => c.replace(/-[A-Za-z0-9_-]{8}(\.(?:js|css))/g, "$1");
const kb = (f) => gzipSync(norm(readFileSync(join(DIST, f), "utf8"))).length / 1000;
const closure = (k, s) => { if (!m[k] || s.has(m[k].file)) return s; s.add(m[k].file); for (const d of m[k].imports ?? []) closure(d, s); return s; };
const base = ["index.html", "src/pages/StudioPage.tsx", "src/fixtures/references.ts", "src/fixtures/referenceDetails.ts", "src/data/deferredStudio.ts", "src/data/memoryProjectRepository.ts", "src/components/studio/StudioLayout.tsx", "src/features/studio/gateCheck.ts"];
const fileToKey = Object.fromEntries(Object.entries(m).map(([k, v]) => [v.file, k]));
for (const [name, keys] of [["/studio", base], ["복원", [...base, "src/data/persistence/imageRestore.ts"]]]) {
  const files = new Set(); for (const k of keys) closure(k, files);
  const rows = [...files].map((f) => [kb(f), f, fileToKey[f]]).sort((a, b) => b[0] - a[0]);
  console.log(`== ${name} 합계 ${rows.reduce((t, r) => t + r[0], 0).toFixed(2)}KB · ${rows.length}청크`);
  for (const [s, f, k] of rows) console.log(`${s.toFixed(2).padStart(7)}  ${f}  ${k}`);
}
