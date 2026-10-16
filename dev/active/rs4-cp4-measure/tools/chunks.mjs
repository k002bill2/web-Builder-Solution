// 측정 보조(읽기 전용): /studio 진입 closure 청크별 gzip(raw·정규화). 사용: node chunks.mjs <app dir> [extra auto src...]
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const app = process.argv[2];
const { normalizeHashes } = await import(join(app, "scripts/bundleBudget.mjs"));
const DIST = join(app, "dist");
const rd = (n) => JSON.parse(readFileSync(join(DIST, n), "utf8"));
const m = { ...rd(".vite/manifest.json") };
const raw = (f) => gzipSync(readFileSync(join(DIST, f))).length;
const norm = (f) => gzipSync(normalizeHashes(readFileSync(join(DIST, f), "utf8"))).length;
const closure = (key, seen) => { const e = m[key]; if (!e) { if (key) console.log("MISSING", key); return seen; } if (seen.has(e.file)) return seen; seen.set(e.file, key); for (const d of e.imports ?? []) closure(d, seen); return seen; };
const base = ["src/fixtures/references.ts", "src/fixtures/referenceDetails.ts", "src/data/deferredStudio.ts", "src/data/memoryProjectRepository.ts", "src/components/studio/StudioLayout.tsx", "src/features/studio/gateCheck.ts"];
const extra = process.argv.slice(3);
const seen = new Map();
closure("index.html", seen); const common = new Set(seen.keys());
closure("src/pages/StudioPage.tsx", seen); const first = new Set(seen.keys());
for (const k of [...base, ...extra]) closure(k, seen);
let tr = 0, tn = 0; const rows = [];
for (const [f, k] of seen) { const r = raw(f), n = norm(f); tr += r; tn += n; rows.push([f, k, r, n, common.has(f) ? "common" : first.has(f) ? "first" : "auto"]); }
rows.sort((a, b) => b[2] - a[2]);
for (const [f, k, r, n, g] of rows) console.log(`${String(r).padStart(7)} ${String(n).padStart(7)} ${g.padEnd(6)} ${f.replace(/-[A-Za-z0-9_-]{8}\.js$/, "")}  <- ${k}`);
console.log(`TOTAL raw ${(tr / 1000).toFixed(2)}KB norm ${(tn / 1000).toFixed(2)}KB chunks ${rows.length}`);
