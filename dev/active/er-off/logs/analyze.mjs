import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const DIST = process.argv[2];
const m = JSON.parse(readFileSync(DIST + "/.vite/manifest.json", "utf8"));
const gz = (f) => gzipSync(readFileSync(DIST + "/" + f)).length / 1000;
const closure = (keys, seen = new Set()) => { for (const k of keys) { if (seen.has(k)) continue; seen.add(k); closure(m[k].imports ?? [], seen); } return seen; };
const first = closure(["index.html", "src/pages/StudioPage.tsx"]);
const auto = ["src/fixtures/references.ts","src/fixtures/referenceDetails.ts","src/data/deferredStudio.ts","src/data/memoryProjectRepository.ts","src/components/studio/StudioLayout.tsx","src/features/studio/gateCheck.ts"];
const all = closure(auto, new Set(first));
let tot = 0; const rows = [];
for (const k of all) { const s = gz(m[k].file); tot += s; rows.push([first.has(k) ? "F" : "A", s.toFixed(2), m[k].file, k]); }
rows.sort((a,b)=>b[1]-a[1]); for (const r of rows) console.log(r.join("\t"));
console.log("total", tot.toFixed(2));
