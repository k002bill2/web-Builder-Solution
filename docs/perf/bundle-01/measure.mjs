// BUNDLE-01 — app/scripts/check-bundle-size.mjs와 같은 규칙으로 임의 dist를 잰다 (실험 빌드를 --outDir로 따로 낸 뒤 비교용).
// 사용: node measure.mjs <dist 디렉터리> [라벨]   · 규칙·라우트 표는 check-bundle-size.mjs(main 878a749)와 같다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const [dist, label = dist] = process.argv.slice(2);
const ROUTE_PAGES = {
  "/catalog": "src/pages/CatalogPage.tsx",
  "/references/:id": "src/pages/ReferenceDetailPage.tsx",
  "/compare": "src/pages/CompareBoardPage.tsx",
  "자리표시": "src/pages/PlaceholderPage.tsx",
};
const EAGER_DYNAMIC = ["src/fixtures/references.ts", "src/fixtures/referenceDetails.ts"];
const ROUTE_EAGER_DYNAMIC = {
  "/compare": ["src/features/compare/boardEngine.ts", "src/data/memoryCompareBoardRepository.ts", "src/fixtures/referenceComparisons.ts"],
};
const manifest = JSON.parse(readFileSync(join(dist, ".vite/manifest.json"), "utf8"));
const gzipKb = (file) => gzipSync(readFileSync(join(dist, file))).length / 1000;
function staticClosure(key, seen = new Set()) {
  const chunk = manifest[key];
  if (!chunk || seen.has(chunk.file)) return seen;
  seen.add(chunk.file);
  for (const dep of chunk.imports ?? []) staticClosure(dep, seen);
  return seen;
}
const sumKb = (files) => [...files].reduce((total, file) => total + gzipKb(file), 0);
const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
const common = staticClosure(entryKey);
const cells = [`공통 ${sumKb(common).toFixed(2)} (${[...common].map((f) => `${f.replace(/^assets\/|-[\w-]{8}\.js$/g, "")} ${gzipKb(f).toFixed(2)}`).join(" + ")})`];
for (const [route, page] of Object.entries(ROUTE_PAGES)) {
  const routeFiles = staticClosure(page, new Set(common));
  const eager = [...EAGER_DYNAMIC, ...(ROUTE_EAGER_DYNAMIC[route] ?? [])];
  const eagerFiles = eager.reduce((files, key) => staticClosure(key, files), new Set(routeFiles));
  cells.push(`${route} ${sumKb(routeFiles).toFixed(2)} / ${sumKb(eagerFiles).toFixed(2)}`);
}
const jsCount = Object.values(manifest).filter((c) => c.file.endsWith(".js")).length;
console.log(`[${label}] JS 청크 ${jsCount}개 · ${cells.join(" · ")}`);
