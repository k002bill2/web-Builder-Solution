// 전 시나리오 정규화 합계(첫 화면 · 진입 직후) + 렌더 JS — 감량 전후 diff로 "다른 라우트 증분 0" 확인. 사용: node e0-scenarios.mjs <app/dist>
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
const DIST = process.argv[2];
const read = (n) => JSON.parse(readFileSync(join(DIST, n), "utf8"));
const m = { ...read(".vite/manifest.json"), ...read(".vite/render-manifest.json") };
const norm = (c) => c.replace(/-[A-Za-z0-9_-]{8}(\.(?:js|css))/g, "$1");
const kb = (f) => gzipSync(norm(readFileSync(join(DIST, f), "utf8"))).length / 1000;
const cl = (k, s) => { if (!m[k] || s.has(m[k].file)) return s; s.add(m[k].file); for (const d of m[k].imports ?? []) cl(d, s); return s; };
const sum = (keys) => { const s = new Set(); for (const k of keys) cl(k, s); return [...s].reduce((t, f) => t + kb(f), 0); };
const E = ["src/fixtures/references.ts", "src/fixtures/referenceDetails.ts"];
const PA = ["src/data/deferredStudio.ts", "src/data/memoryProjectRepository.ts"];
const ST = [...E, ...PA, "src/components/studio/StudioLayout.tsx", "src/features/studio/gateCheck.ts"];
const S = [
  ["/catalog", "src/pages/CatalogPage.tsx", E],
  ["/catalog (추천)", "src/pages/CatalogPage.tsx", [...E, "src/fixtures/generatedReferences.ts", "src/components/reco/RecoView.tsx"]],
  ["/references/:id", "src/pages/ReferenceDetailPage.tsx", E],
  ["/compare", "src/pages/CompareBoardPage.tsx", [...E, "src/features/compare/boardEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryCompareBoardRepository.ts", "src/fixtures/referenceComparisons.ts"]],
  ["/profile", "src/pages/ProfilePage.tsx", [...E, "src/features/profile/profileEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryGenerationRepository.ts"]],
  ["/profile (3안 있음)", "src/pages/ProfilePage.tsx", [...E, "src/features/profile/profileEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryGenerationRepository.ts", "src/features/profile/CandidateResults.tsx"]],
  ["/projects", "src/pages/ProjectsRoute.tsx", [...E, ...PA, "src/features/projects/pendingRows.ts"]],
  ["/studio", "src/pages/StudioPage.tsx", ST],
  ["/studio 복원", "src/pages/StudioPage.tsx", [...ST, "src/data/persistence/imageRestore.ts"]],
];
for (const [name, page, auto] of S) console.log(`${name.padEnd(22)} 첫 화면 ${sum(["index.html", page]).toFixed(2)} · 진입 직후 ${sum(["index.html", page, ...auto]).toFixed(2)}`);
console.log(`${"render.html".padEnd(22)} JS ${sum(["render.html"]).toFixed(2)}`);
