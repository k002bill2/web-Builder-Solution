// 초기 JS 번들 예산 검사 (M1-UI-01-FIX 그룹 C, TRD 8절 "초기 JS ≤ 90KB gzip").
// `vite build`가 만든 dist/.vite/manifest.json을 읽는다.
//  - 초기 JS: index.html 엔트리 청크 + 그 정적 import 전부(= <script type=module> + <link rel=modulepreload>).
//  - 라우트별 합계: 초기 JS + 해당 페이지 lazy 청크와 그 정적 import (참고용, 예산 판정에는 쓰지 않는다).
// gzip 크기는 Node zlib 기본 레벨, KB = 1000 bytes (Vite 빌드 출력 표기와 같은 단위).
// Vite 8 빌드 출력의 gzip 값은 네이티브 리포터라 이 값보다 약 1% 크게 나온다(예: 86.58 vs 87.47). 둘 다 예산 안에 두도록 여유를 둔다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const BUDGET_KB = 90;
const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const ROUTE_PAGES = {
  "/catalog": "src/pages/CatalogPage.tsx",
  "/references/:id": "src/pages/ReferenceDetailPage.tsx",
};

const manifest = JSON.parse(readFileSync(join(DIST, ".vite/manifest.json"), "utf8"));
const gzipKb = (file) => gzipSync(readFileSync(join(DIST, file))).length / 1000;

/** 청크 키에서 정적 import를 따라간 JS 파일 집합. */
function staticClosure(key, seen = new Set()) {
  const chunk = manifest[key];
  if (!chunk || seen.has(chunk.file)) return seen;
  seen.add(chunk.file);
  for (const dep of chunk.imports ?? []) staticClosure(dep, seen);
  return seen;
}

const sumKb = (files) => [...files].reduce((total, file) => total + gzipKb(file), 0);
const format = (kb) => `${kb.toFixed(2)}KB`;

const entryKey = Object.keys(manifest).find((key) => manifest[key].isEntry);
if (!entryKey) throw new Error("manifest에 엔트리 청크가 없습니다. vite build --manifest 설정을 확인하세요.");

const initial = staticClosure(entryKey);
const initialKb = sumKb(initial);

console.log(`[bundle] 초기 JS (gzip): ${format(initialKb)} / 예산 ${BUDGET_KB}KB`);
for (const file of initial) console.log(`  - ${file} ${format(gzipKb(file))}`);
for (const [route, page] of Object.entries(ROUTE_PAGES)) {
  if (!manifest[page]) continue;
  const routeFiles = staticClosure(page, new Set(initial));
  console.log(`[bundle] ${route} 첫 화면 합계 (참고): ${format(sumKb(routeFiles))}`);
}

if (initialKb > BUDGET_KB) {
  console.error(`[bundle] 예산 초과: 초기 JS ${format(initialKb)} > ${BUDGET_KB}KB`);
  process.exit(1);
}
