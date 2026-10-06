// usage: node routes.mjs <dist> — check-bundle-size SCENARIOS와 같은 page·auto 목록으로 첫 화면·진입 직후 합계(gzip Node zlib, KB=1000B)
import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
const DIST = process.argv[2];
const m = JSON.parse(readFileSync(DIST + "/.vite/manifest.json", "utf8"));
const gz = (f) => gzipSync(readFileSync(DIST + "/" + f)).length / 1000;
const closure = (keys, seen = new Set()) => { for (const k of keys) { if (!m[k]) throw new Error("manifest 키 없음 " + k); if (seen.has(k)) continue; seen.add(k); closure(m[k].imports ?? [], seen); } return seen; };
const E = ["src/fixtures/references.ts", "src/fixtures/referenceDetails.ts"];
const CA = ["src/features/compare/boardEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryCompareBoardRepository.ts", "src/fixtures/referenceComparisons.ts"];
const PA = ["src/data/deferredStudio.ts", "src/data/memoryProjectRepository.ts"];
const PR = [...E, "src/features/profile/profileEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryGenerationRepository.ts"];
const S = [
  ["/catalog", "src/pages/CatalogPage.tsx", E], ["/references/:id", "src/pages/ReferenceDetailPage.tsx", E],
  ["/compare", "src/pages/CompareBoardPage.tsx", [...E, ...CA]], ["/profile", "src/pages/ProfilePage.tsx", PR],
  ["/profile (3안 있음)", "src/pages/ProfilePage.tsx", [...PR, "src/features/profile/CandidateResults.tsx"]],
  ["/projects", "src/pages/ProjectsRoute.tsx", [...E, ...PA]],
  ["/studio/:projectId", "src/pages/StudioPage.tsx", [...E, ...PA, "src/components/studio/StudioLayout.tsx", "src/features/studio/gateCheck.ts"]],
];
const sum = (s) => [...s].reduce((a, k) => a + gz(m[k].file), 0);
for (const [name, page, auto] of S) { const f = closure(["index.html", page]); const a = closure(auto, new Set(f)); console.log(`${name}\t${sum(f).toFixed(2)}\t${sum(a).toFixed(2)}`); }
