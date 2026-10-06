// usage: node modules.mjs <distDir(sourcemap build)> [realDist]
// /studio/:projectId 진입 closure(check-bundle-size와 같은 규칙: index.html + StudioPage 정적 닫힘 + auto 목록 정적 닫힘)
// 모듈 기여 = sourcemap으로 생성 코드 문자를 소스별로 세고, 청크 gzip을 문자 비율로 나눈 추정치(gzip은 가산이 아니므로 근사)
import { readFileSync, existsSync } from "node:fs";
import { gzipSync } from "node:zlib";
const [DIST, REAL = DIST] = process.argv.slice(2);
const m = JSON.parse(readFileSync(DIST + "/.vite/manifest.json", "utf8"));
const realM = JSON.parse(readFileSync(REAL + "/.vite/manifest.json", "utf8"));
const closure = (keys, seen = new Set()) => { for (const k of keys) { if (seen.has(k) || !m[k]) continue; seen.add(k); closure(m[k].imports ?? [], seen); } return seen; };
const first = closure(["index.html", "src/pages/StudioPage.tsx"]);
const AUTO = ["src/fixtures/references.ts","src/fixtures/referenceDetails.ts","src/data/deferredStudio.ts","src/data/memoryProjectRepository.ts","src/components/studio/StudioLayout.tsx","src/features/studio/gateCheck.ts"];
const all = closure(AUTO, new Set(first));
// 다른 라우트 첫 화면·진입 closure (공유 여부)
const OTHERS = {
  catalog: closure(["src/fixtures/references.ts","src/fixtures/referenceDetails.ts"], closure(["index.html","src/pages/CatalogPage.tsx"])),
  compare: closure(["src/fixtures/references.ts","src/fixtures/referenceDetails.ts","src/features/compare/boardEngine.ts","src/data/deferredStudio.ts","src/data/memoryCompareBoardRepository.ts","src/fixtures/referenceComparisons.ts"], closure(["index.html","src/pages/CompareBoardPage.tsx"])),
  profile: closure(["src/fixtures/references.ts","src/fixtures/referenceDetails.ts","src/features/profile/profileEngine.ts","src/data/deferredStudio.ts","src/data/memoryGenerationRepository.ts","src/features/profile/CandidateResults.tsx"], closure(["index.html","src/pages/ProfilePage.tsx"])),
  projects: closure(["src/fixtures/references.ts","src/fixtures/referenceDetails.ts","src/data/deferredStudio.ts","src/data/memoryProjectRepository.ts"], closure(["index.html","src/pages/ProjectsRoute.tsx"])),
};
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
const decodeVLQ = (str) => { const out = []; let v = 0, shift = 0; for (const ch of str) { let d = B64.indexOf(ch); const cont = d & 32; d &= 31; v += d << shift; if (cont) { shift += 5; } else { const neg = v & 1; v >>= 1; out.push(neg ? -v : v); v = 0; shift = 0; } } return out; };
const chunkRows = []; const modRows = [];
let total = 0;
for (const k of all) {
  const file = m[k].file; const realFile = realM[k]?.file ?? file;
  const gz = gzipSync(readFileSync(REAL + "/" + realFile)).length / 1000; total += gz;
  const shared = Object.entries(OTHERS).filter(([, s]) => s.has(k)).map(([n]) => n);
  chunkRows.push({ k, file: realFile, gz, phase: first.has(k) ? "첫화면" : "자동", shared });
  const mapPath = DIST + "/" + file + ".map";
  if (!existsSync(mapPath)) continue;
  const map = JSON.parse(readFileSync(mapPath, "utf8"));
  const code = readFileSync(DIST + "/" + file, "utf8").split("\n");
  const counts = new Map(); let src = 0;
  map.mappings.split(";").forEach((line, li) => {
    const segs = line ? line.split(",").map(decodeVLQ) : []; let col = 0; const pts = [];
    for (const s of segs) { col += s[0]; if (s.length > 1) { src += s[1]; pts.push([col, src]); } else pts.push([col, -1]); }
    const len = (code[li] ?? "").length;
    pts.forEach(([c, s], i) => { const end = i + 1 < pts.length ? pts[i + 1][0] : len; if (s >= 0) counts.set(s, (counts.get(s) ?? 0) + (end - c)); });
  });
  const sum = [...counts.values()].reduce((a, b) => a + b, 0) || 1;
  const rawTotal = readFileSync(DIST + "/" + file).length;
  for (const [s, n] of counts) modRows.push({ chunk: realFile, mod: map.sources[s].replace(/^.*?\/app\//, "").replace(/^(\.\.\/)+/, ""), chars: n, gzEst: gz * n / sum, phase: first.has(k) ? "첫화면" : "자동", shared });
}
chunkRows.sort((a, b) => b.gz - a.gz);
console.log("## 청크 (gzip KB, Node zlib)\n| 청크 | src | 구간 | gz | 공유(다른 라우트 진입) |\n|---|---|---|---|---|");
for (const r of chunkRows) console.log(`| ${r.file} | ${r.k} | ${r.phase} | ${r.gz.toFixed(2)} | ${r.shared.join(",") || "studio 전용"} |`);
console.log(`| **합** | | | **${total.toFixed(2)}** | |`);
const studioOnly = chunkRows.filter((r) => r.shared.length === 0).reduce((a, r) => a + r.gz, 0);
console.log(`studio 전용 청크 합: ${studioOnly.toFixed(2)}`);
modRows.sort((a, b) => b.gzEst - a.gzEst);
console.log("\n## 모듈 상위 (gzip 추정 = 청크 gzip × 생성 문자 비율)\n| # | 모듈 | 청크 | 구간 | 문자 | gz추정 | 공유 |\n|---|---|---|---|---|---|---|");
modRows.slice(0, Number(process.env.TOP ?? 40)).forEach((r, i) => console.log(`| ${i + 1} | ${r.mod} | ${r.chunk.replace("assets/", "")} | ${r.phase} | ${r.chars} | ${r.gzEst.toFixed(2)} | ${r.shared.join(",") || "studio 전용"} |`));
