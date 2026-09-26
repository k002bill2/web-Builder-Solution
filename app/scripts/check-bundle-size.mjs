// 앱 첫 화면 JS 예산 검사 (ADR-004: Design Studio 앱은 라우트별 첫 화면 JS 합계 gzip ≤ 100KB,
// 2026-09-26 개정: 진입 직후 자동 로드 포함 합계 ≤ 125KB도 실패 조건).
// `vite build`가 만든 dist/.vite/manifest.json을 읽는다.
//  - 공통 JS: index.html 엔트리 청크 + 그 정적 import 전부(= <script type=module> + <link rel=modulepreload>). 참고 출력.
//  - 라우트별 첫 화면 합계: 공통 JS + 해당 페이지 lazy 청크와 그 정적 import. **예산 판정 대상** (≤ 100KB).
//  - 라우트별 진입 직후 자동 로드 포함 합계: 첫 화면 합계 + 사용자 조작 없이 바로 받는 dynamic import. **예산 판정 대상** (≤ 125KB).
// gzip 크기는 Node zlib 기본 레벨, KB = 1000 bytes (Vite 빌드 출력 표기와 같은 단위).
// Vite 8 빌드 출력의 gzip 값은 네이티브 리포터라 이 값보다 약 1% 크게 나온다(예: 86.58 vs 87.47). 둘 다 예산 안에 두도록 여유를 둔다.
// 생성 홈페이지(export)의 초기 JS ≤ 90KB(TRD 8절)는 이 스크립트의 대상이 아니다.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const ROUTE_BUDGET_KB = 100;
const ROUTE_EAGER_BUDGET_KB = 125;
const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
/** 라우트 → 페이지 모듈. 라우트를 추가하면 여기에도 추가한다 (src/app/routes.tsx). */
const ROUTE_PAGES = {
  "/catalog": "src/pages/CatalogPage.tsx",
  "/references/:id": "src/pages/ReferenceDetailPage.tsx",
  "/compare": "src/pages/CompareBoardPage.tsx",
  "/profile · /studio (자리표시)": "src/pages/PlaceholderPage.tsx",
};

/** 진입 직후 사용자 조작 없이 불러오는 dynamic import (main.tsx 레퍼런스 픽스처). 진입 직후 합계(≤ 125KB)에 더한다. */
const EAGER_DYNAMIC = ["src/fixtures/references.ts", "src/fixtures/referenceDetails.ts"];
/**
 * 라우트별 진입 직후 자동 로드 — /compare는 보드 엔진(선택 규칙·초안·zod)을 보드 저장소·비교 픽스처와 함께 받는다
 * (ADR-005 D3 · M1-UI-03b). 사용자가 실제로 받는 합계를 숨기지 않도록 진입 직후 합계에 더한다.
 */
const ROUTE_EAGER_DYNAMIC = {
  // memoryStudio = 보드·프로필 메모리 구현 + 공유 store (main의 deferred 로더 하나, DS-2A-04 6.3)
  "/compare": ["src/features/compare/boardEngine.ts", "src/data/memoryStudio.ts", "src/fixtures/referenceComparisons.ts"],
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

const common = staticClosure(entryKey);
console.log(`[bundle] 공통 JS (gzip, 참고): ${format(sumKb(common))}`);
for (const file of common) console.log(`  - ${file} ${format(gzipKb(file))}`);

const failures = [];
for (const [route, page] of Object.entries(ROUTE_PAGES)) {
  // 설정한 페이지가 manifest에 없으면 검사가 조용히 빠지므로 실패로 본다
  if (!manifest[page]) {
    failures.push(`${route}: manifest에 ${page}가 없습니다 (경로 변경 시 ROUTE_PAGES를 고치세요)`);
    continue;
  }
  const routeFiles = staticClosure(page, new Set(common));
  const routeKb = sumKb(routeFiles);
  const eager = [...EAGER_DYNAMIC, ...(ROUTE_EAGER_DYNAMIC[route] ?? [])];
  // 진입 직후 목록의 모듈이 다른 청크에 합쳐져 manifest 키가 없어지면 합계가 조용히 줄어든다 — 실패로 본다
  const missing = eager.filter((key) => !manifest[key]);
  if (missing.length > 0) failures.push(`${route}: 진입 직후 목록 ${missing.join(", ")}가 manifest에 없습니다`);
  const eagerKb = sumKb(eager.reduce((files, key) => staticClosure(key, files), new Set(routeFiles)));
  console.log(`[bundle] ${route} 첫 화면 합계: ${format(routeKb)} / 예산 ${ROUTE_BUDGET_KB}KB · 진입 직후 자동 로드 포함: ${format(eagerKb)} / 예산 ${ROUTE_EAGER_BUDGET_KB}KB`);
  if (routeKb > ROUTE_BUDGET_KB) failures.push(`${route}: 첫 화면 ${format(routeKb)} > ${ROUTE_BUDGET_KB}KB`);
  if (eagerKb > ROUTE_EAGER_BUDGET_KB) failures.push(`${route}: 진입 직후 자동 로드 포함 ${format(eagerKb)} > ${ROUTE_EAGER_BUDGET_KB}KB`);
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`[bundle] 예산 검사 실패 — ${failure}`);
  process.exit(1);
}
