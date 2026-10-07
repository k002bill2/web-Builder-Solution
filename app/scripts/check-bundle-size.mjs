// 번들 예산 검사 — 판정은 bundleBudget.mjs(부작용 없음, bundleBudget.test.mjs), 이 파일은 dist를 읽어 넘기고 출력·종료 코드만 맡는다.
// ADR-004: Design Studio 앱은 라우트별 첫 화면 JS 합계 gzip ≤ 100KB, 2026-09-26 개정 1: 진입 직후 자동 로드 포함 합계 ≤ 125KB도 실패 조건.
// `vite build`가 만든 dist/.vite/manifest.json + `vite build --mode render`가 만든 dist/.vite/render-manifest.json을 합쳐 읽는다. 엔트리는 이름으로 고정한다: 앱 = index.html · 렌더 문서 = render.html, 그 밖 엔트리 = 실패(개정 2 결정 5).
//  - 공통 JS: index.html 엔트리 청크 + 그 정적 import 전부(= <script type=module> + <link rel=modulepreload>). 참고 출력.
//  - 라우트별 첫 화면 합계: 공통 JS + 해당 페이지 lazy 청크와 그 정적 import. **예산 판정 대상** (≤ 100KB).
//  - 라우트별 진입 직후 자동 로드 포함 합계: 첫 화면 합계 + 사용자 조작 없이 바로 받는 dynamic import. **예산 판정 대상** (≤ 125KB).
//  - 렌더 문서(render.html, 편집기 캔버스 iframe — 2026-10-03 개정 2): 렌더 엔트리 정적 닫힘 + RENDER_AUTO의 JS 합계 ≤ 90KB · 같은 범위 CSS 합계 ≤ 30KB.
//    생성 홈페이지 예산(TRD 8절)으로 앱과 **별도 판정**한다. 앱과 공유하는 청크(react 등)는 양쪽에 다 세고 목록을 참고 출력한다(결정 3).
//    render.html이 manifest에 없으면 실패. 실제 내보낸 사이트(정적 HTML·zip)의 예산은 내보내기 단계에서 따로 판정한다(결정 4 — 이 스크립트 밖).
// gzip 크기는 Node zlib 기본 레벨, KB = 1000 bytes (Vite 빌드 출력 표기와 같은 단위).
// Vite 8 빌드 출력의 gzip 값은 네이티브 리포터라 이 값보다 약 1% 크게 나온다(예: 86.58 vs 87.47). 둘 다 예산 안에 두도록 여유를 둔다.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { BASELINE_FILE, checkBundle } from "./bundleBudget.mjs";
import { thumbsVersion } from "./thumbsVersion.mjs";

const DIST = fileURLToPath(new URL("../dist/", import.meta.url));

/*
 * dynamic import 분류 규칙 (FIX-2A04b1 BUNDLE-03 · FIX2 P-S25 r6) — 새 import()를 더하면 호출 지점을 보고 둘 중 하나로 넣는다.
 *  - 자동: 사용자 조작 없이 렌더·effect·로더에서 실행된다 → 진입 직후 합계에 포함.
 *    조건부여도 예산 밖이 아니다 — 그 조건이 참인 시나리오를 SCENARIOS에 따로 두고 125KB로 판정한다.
 *  - 조작 뒤: 클릭·펼치기·저장 등 사용자 조작 핸들러 안에서만 실행되거나, **사용자 조작으로만 참이 되는 조건의 effect**에서 실행된다
 *    (예: 펼침 상태 && 초안 ready — DS-2A-04 10.0.2 Q-F4-1) → 예산 밖, 크기만 출력(`afterAction`).
 *  - 호출 지점을 확인하지 못하면 자동으로 분류한다.
 */
/** 진입 직후 사용자 조작 없이 불러오는 dynamic import (main.tsx 레퍼런스 픽스처) — 모든 시나리오에 자동 */
const EAGER_DYNAMIC = ["src/fixtures/references.ts", "src/fixtures/referenceDetails.ts"];
/** /compare 진입 직후 자동 — 보드 엔진(선택 규칙·초안) + main의 deferred 로더가 받는 공유 store·프로필(deferredStudio)과 그 보드 로더가 받는 보드 메모리 구현·비교 픽스처 (ADR-005 D3 · DS-2A-04 6.3 · STUDIO-SLIM) */
const COMPARE_AUTO = ["src/features/compare/boardEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryCompareBoardRepository.ts", "src/fixtures/referenceComparisons.ts"];
/**
 * 조작 뒤 — /compare:
 *  - P-S25 판정·목록(carryOverPanel): carryOverLoader ← CarryOverCaption load ← 펼침(details onToggle → open) + 초안 ready(Hero 선택) 둘 다일 때
 *    effect(FIX4)·"다시 시도" onClick. "이어받기 확인"을 펼치는 조작 뒤에만 실행된다(r6). 진입 직후 자동은 개수 캡션(boardScreen carryOverCount 인라인)뿐
 *  - 보드 확정 본문(memoryBoardConfirm, FIX3 1안): writeBodyLoader loadBoardConfirm ← memoryCompareBoardRepository confirmerFor ← confirmProfile·
 *    createProfileVersion ← useCompareBoard.confirm(확정 버튼 onClick, 실패 뒤 "다시 시도" onClick — boardMessages confirmFailure)
 *  - 재확정 이어받기 규칙(memoryBoardConfirm loadCarryOver ← prepare ← 위 확정 본문, 계열 최신에 조정이 있을 때만)
 *  - 프로필 쓰기 본문(memoryProfileAdjust = 조정 저장 + 되돌리기, FIX3 1안): writeBodyLoader loadProfileWrites ← memoryProfileRepository
 *    saveAdjustments·revertTo ← 프로필 화면 "조정 저장"·"다시 시도"(AdjustmentPanel onClick → useProfileDetail.save)·"이 버전으로 되돌리기"
 *    (ProfilePage onRevert) onClick. 보드 화면은 부르지 않는다. getAdjustmentRange는 본문을 받지 않는다(기본 범위 상수 domain/profile, 2a-04b2)
 *  - 보드 입력 검증(boardInput = zod, BUNDLE-HEADROOM): ① writeBodyLoader loadBoardInput ← memoryCompareBoardRepository savePicks ←
 *    picksSaver.save·retry ← useCompareBoard toggle·pickAll·clear·undoLast·changeCustom·applyFix·removeColumn·retrySave(모두 onClick·onChange)
 *    ② boardInputLoader ← boardEngine checkPrimaryColor(대표색 blur·Enter)·prepare(대표색 onFocus). 진입(getBoard·getComparison·엔진·입력 틀)은
 *    부르지 않는다 — BoardInputLoad.test "번들 분류 근거"가 요청 0을 확인한다
 */
/** /projects·/studio/:projectId 진입 직후 자동 — 프로젝트 저장소 로더(S-B3)가 받는 공유 store·프로필(deferredStudio)과 프로젝트 메모리 구현. 보드·생성 구현은 받지 않는다(STUDIO-SLIM — deferredStudio.test) */
const PROJECT_AUTO = ["src/data/deferredStudio.ts", "src/data/memoryProjectRepository.ts"];
/**
 * 조작 뒤 — /studio/:projectId (EDITOR-A3-1 S-B5): 연산 본문 · 섹션 추가 대화상자 · 변형 교체 목록
 *  + 문의 폼 주인용 안내(M2A-2b B6): EditFields lazy ← contact/form 섹션 선택(섹션 줄·캔버스 누름 onClick — 첫 선택은 Hero)
 *  + 내보내기(M2A-3a S-B5): exportFlow(requestExport 호출 · 잡 조회 · 결과 처리) ← useExportFlow.request ← 내보내기 버튼 onClick(·확인 대화상자 "내보내기"·"다시 시도")
 *    · ExportAfter(경고 확인 대화상자 · 결과 Callout) lazy ← confirming·result 상태 ← 같은 onClick
 */
const STUDIO_AFTER_ACTION = [
  "src/features/studio/docEngine.ts",
  "src/components/studio/AddSectionDialog.tsx",
  "src/components/studio/VariantOptions.tsx",
  "src/components/studio/ContactOwnerNote.tsx",
  "src/features/studio/exportFlow.ts",
  "src/components/studio/ExportAfter.tsx",
  // PNG 캡처(m2a 3.3 — M2A-3c): PngSave "PNG 내려받기" onClick → loadPng
  "src/features/studio/png/pngCapture.ts",
  // 이미지 슬롯 패널(SPEC m2c 2.1 — B-M2C-02, 보고용): ImageSlotPanel lazy ← "이미지 편집" details 펼침(onToggle) · 정적 import로 imageStore 공유 청크
  //  · 변환기(ingest) ← 패널 "이미지 고르기" 파일 onChange. exportImages(+imageStore) 공유 청크는 위 exportFlow 닫힘에 집계된다(소스 키 없음)
  "src/components/studio/ImageSlotPanel.tsx",
  "src/features/studio/images/ingest/index.ts",
];
/** 렌더 문서 진입 직후 자동 dynamic import — 지금은 없다(폴백만, M2A-1). 킷 지연 로드가 생기면 넣는다(조작 뒤 코드는 넣지 않고 크기만 출력 대상) */
const RENDER_AUTO = [];
/**
 * 조작 뒤 — /profile 두 시나리오 공통(아래 "/profile" 주석의 호출 지점) +
 *  3안 실렌더 비교(M2B-5 SPEC 1.1·3.1): CompareDialog(대화상자·프레임 다리·변환 writeStartDoc·docKitTokens) ← compareLoader loadCompare ←
 *  CandidatesSection "3안 실제 화면으로 비교"·실패 뒤 "다시 시도" onClick. 진입은 받지 않는다 — ProfileCompare.test "번들 분류 근거"가 요청 0을 확인한다
 */
const PROFILE_AFTER_ACTION = ["src/data/memoryProfileAdjust.ts", "src/data/memoryGenerate.ts", "src/data/memoryProjectRepository.ts", "src/features/profile/CompareDialog.tsx"];
const COMPARE_AFTER_ACTION = [
  "src/features/compare/carryOverPanel.tsx",
  "src/data/memoryBoardConfirm.ts",
  "src/domain/profileAdjustments.ts",
  "src/data/memoryProfileAdjust.ts",
  "src/domain/boardInput.ts",
];

/**
 * 판정 대상 시나리오 — 라우트를 추가하면 여기에도 추가한다 (src/app/routes.tsx). 목록 키가 manifest에 없으면 실패.
 *  - page: 라우트 페이지 모듈(첫 화면 = 공통 + 이 청크의 정적 import, ≤ 100KB)
 *  - auto: 자동 dynamic import(진입 직후 = 첫 화면 + 이 목록의 정적 closure, ≤ 125KB)
 *  - afterAction: 조작 뒤 dynamic import(진입 직후 합계에 없는 파일 크기만 출력)
 *  - eagerBudgetKb: 진입 직후 한도(없으면 125 — ADR-004 개정 1). 지금은 /studio/:projectId만 130(개정 9)
 *  - routeBudgetKb: 첫 화면 한도(없으면 100). 지금은 /catalog만 101(개정 7)
 */
const SCENARIOS = [
  // ADR-004 개정 7 결정 2·3 — 카드 실렌더 썸네일(img·실패 복귀·생성 조합 Tag 공존)이 고정 경로 상쇄 뒤에도 99.90을 넘어(100.05) 이 라우트 첫 화면 한도만 101(멈춤선 100.90).
  // 늘어난 몫은 썸네일 연결에만. 다시 올리자는 요청은 첫 화면 청크 구조 점검(공용 셸·트레이·필터 분해) 결과와 함께만(결정 4)
  { name: "/catalog", page: "src/pages/CatalogPage.tsx", auto: EAGER_DYNAMIC, routeBudgetKb: 101 },
  { name: "/references/:id", page: "src/pages/ReferenceDetailPage.tsx", auto: EAGER_DYNAMIC },
  { name: "/compare", page: "src/pages/CompareBoardPage.tsx", auto: [...EAGER_DYNAMIC, ...COMPARE_AUTO], afterAction: COMPARE_AFTER_ACTION },
  // 확정한 프로필의 최신 버전에 조정이 있을 때 — 자동으로 더 받는 dynamic import가 없다(캡션은 인라인 계산, CarryOverCaption은 엔진 청크).
  // 판정·목록은 펼칠 때(조작 뒤). 자동 조건부 import가 다시 생기면 이 시나리오의 auto에 넣는다
  { name: "/compare (조정 있음)", page: "src/pages/CompareBoardPage.tsx", auto: [...EAGER_DYNAMIC, ...COMPARE_AUTO], afterAction: COMPARE_AFTER_ACTION },
  // 프로필 엔진(대비·비교·문구·조정 패널, P-B6) + 같은 로더가 받는 공유 store·프로필(deferredStudio)·생성 메모리 구현(useGeneration 진입 findJob). 보드 구현·비교 픽스처는 받지 않는다(STUDIO-SLIM).
  // 진입 때 자동: useProfileDetail load → getProfile·getAdjustmentRange(2a-04b2). 범위 조회는 쓰기 본문을 받지 않으므로
  // memoryProfileAdjust는 조작 뒤("조정 저장"·"다시 시도"·"이 버전으로 되돌리기" onClick) — WriteBodyLoad.test "번들 분류 근거"가 요청 0을 확인한다.
  // boardInput(zod)은 보드 저장소 savePicks 뒤 — 프로필 화면은 부르지 않으므로 조작 뒤 목록에도 넣지 않는다(BoardInputLoad.test "번들 분류 근거")
  {
    name: "/profile",
    page: "src/pages/ProfilePage.tsx",
    auto: [...EAGER_DYNAMIC, "src/features/profile/profileEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryGenerationRepository.ts"],
    // 3안 계산 본문(memoryGenerate = composeCandidates·lintPlan, 2a-04c): writeBodyLoader loadGenerate ← memoryGenerationRepository requestGeneration·
    // retryFailed ← useGeneration request·retry ← CandidatesSection "3안 만들기"·"다시 시도" onClick. 진입 findJob·getJob 폴링·selectCandidate는 받지 않는다
    // (store 조회만 — GenerationLoad.test "번들 분류 근거"가 요청 0을 확인한다). 기존 잡 표시·폴링 코드는 profileEngine·memoryGenerationRepository(자동 — useGeneration 로더)에 든다.
    // 프로젝트 메모리 구현: CandidatesSection loadProjects().startDoc ← "편집 시작" onClick(STUDIO-SLIM — 진입은 받지 않는다)
    afterAction: PROFILE_AFTER_ACTION,
  },
  // 3안이 있는 채 들어올 때(M2B-5 SPEC 0.1 G1) — CandidatesSection effect가 잡이 있으면 조작 없이 카드·표 청크(CandidateResults ← candidateResultsLoader)를 받는다 → 자동.
  // 잡 없는 진입은 위 "/profile"이 잰다. 조작 뒤 목록은 같다
  {
    name: "/profile (3안 있음)",
    page: "src/pages/ProfilePage.tsx",
    auto: [...EAGER_DYNAMIC, "src/features/profile/profileEngine.ts", "src/data/deferredStudio.ts", "src/data/memoryGenerationRepository.ts", "src/features/profile/CandidateResults.tsx"],
    afterAction: PROFILE_AFTER_ACTION,
  },
  // 프로젝트 목록·편집기(2a-05 S-B11): 진입 때 자동 — useProjectRepository → main loadStudio(deferredStudio) → projects()(memoryProjectRepository)
  { name: "/projects", page: "src/pages/ProjectsRoute.tsx", auto: [...EAGER_DYNAMIC, ...PROJECT_AUTO] },
  // 편집 틀(StudioLayout — 배치·필드·자동 저장 훅)은 문서가 있으면 렌더에서 자동 lazy(EDITOR-A2-SHELL S7) → 진입 직후 합계
  // 게이트 엔진(gateCheck = runGate·대비 판정, M2A-3a S-B4): useGateReport effect가 문서를 그린 직후 조작 없이 받는다 → 자동
  // 조작 뒤(EDITOR-A3-1): 구조 연산 본문(docEngine = sectionOps·normalizeDoc) ← docOps.applyDocOp ← useSectionOps.run ← 위로·아래로·삭제·추가·변형 onClick
  //  · 섹션 추가 대화상자(AddSectionDialog lazy) ← adding 상태 ← "섹션 추가" onClick(본문 9개 미만일 때만)
  //  · 변형 교체 목록(VariantOptions lazy = diffSlots 캡션) ← VariantSwitch open 상태 ← "변형 바꾸기" details 펼침(onToggle)
  {
    name: "/studio/:projectId",
    page: "src/pages/StudioPage.tsx",
    auto: [...EAGER_DYNAMIC, ...PROJECT_AUTO, "src/components/studio/StudioLayout.tsx", "src/features/studio/gateCheck.ts"],
    afterAction: STUDIO_AFTER_ACTION,
    // ADR-004 개정 3 결정 2 — M2A-3a가 SPEC대로(게이트 펼침 · runGate 진입 자동) 넣고 125를 넘어 이 라우트 진입 한도만 127(멈춤선 126.70). 다른 라우트는 125
    // ADR-004 개정 4 결정 1 — m2a SPEC 3.3 PNG 묶음(진입 때부터 보임)으로 127 → 128(멈춤선 127.70). 다음 상향 전 진입 청크 구조 점검 필수(결정 3)
    // ADR-004 개정 5 결정 1 — ER-2 테마 바꾸기 첫 화면 진입점(+0.59)·ER-3b·ER-4 몫으로 128 → 129(멈춤선 128.70). 구조 점검은 ER-OFF가 이행. 129에서도 넘으면 멈춤(결정 5)
    // ADR-004 개정 9 결정 1 — 영속 진입(ADR-007 P1) 몫으로 129 → 130(멈춤선 129.70). 영속 진입 몫 기준선 상한 129.60(개정 10)
    eagerBudgetKb: 130,
  },
];

// 앱 manifest + 렌더 문서 manifest(`vite build --mode render`) — 합친 뒤 엔트리 이름으로 판정한다. 렌더 manifest가 없으면 render.html 없음 = 실패
const readManifest = (name) => (existsSync(join(DIST, name)) ? JSON.parse(readFileSync(join(DIST, name), "utf8")) : {});
const manifest = { ...readManifest(".vite/manifest.json"), ...readManifest(".vite/render-manifest.json") };
const sizeOf = (file) => gzipSync(readFileSync(join(DIST, file))).length / 1000;

// M2c 기준선(SPEC m2c 7절 · IMG-AC-29) — 시작 실측 고정 파일. 없거나 읽지 못하면 null = 실패(조용히 건너뛰지 않는다)
const baselinePath = fileURLToPath(new URL(`../${BASELINE_FILE}`, import.meta.url));
const readBaseline = () => {
  try {
    return JSON.parse(readFileSync(baselinePath, "utf8"));
  } catch {
    return null;
  }
};

const { lines, failures: budgetFailures } = checkBundle({ manifest, sizeOf, scenarios: SCENARIOS, renderAuto: RENDER_AUTO, baseline: readBaseline() });
for (const line of lines) console.log(line);

/**
 * 썸네일(M3P-2 · ADR-004 개정 7 결정 1) — 예산 판정 밖, 크기 출력 + 가드만:
 * ① meta.json id 목록 ↔ dist/thumbs/{id}.svg 정확 일치(빠진 id·목록 밖 파일 0 — 카드는 id별로 유무를 모르므로 빌드 보장)
 * ② 버전 = dist 파일을 다시 해시한 값(scripts/thumbsVersion.mjs) ③ /catalog 첫 화면 JS에 `.svg?v=버전`이 실제로 있다(버전이 비어 img 분기가 접힌 채 통과하지 않는다)
 * ④ 썸네일에 넣은 렌더 CSS = 배포 dist 렌더 CSS(바이트 sha256 동일 — build-thumbs가 따로 빌드했으므로) ⑤ 앱·렌더 manifest에 SSR 도구(src/thumbs)·react-dom/server 0 (M3P-AC-G3)
 */
function checkThumbnails() {
  const stage = fileURLToPath(new URL("../node_modules/.thumbs/out/", import.meta.url));
  if (!existsSync(join(stage, "meta.json"))) return ["썸네일 산출물(node_modules/.thumbs/out) 없음 — scripts/build-thumbs.mjs"];
  const { ids, version, renderCssSha256 } = JSON.parse(readFileSync(join(stage, "meta.json"), "utf8"));
  const shipped = existsSync(join(DIST, "thumbs")) ? readdirSync(join(DIST, "thumbs")) : [];
  const issues = [];
  if (!Array.isArray(ids) || ids.length === 0) issues.push("썸네일 id 목록이 비었습니다");
  const present = [];
  for (const id of ids ?? []) {
    const file = `thumbs/${id}.svg`;
    if (!shipped.includes(`${id}.svg`)) issues.push(`${file} 없음`);
    else {
      present.push({ id, svg: readFileSync(join(DIST, file), "utf8") });
      console.log(`[bundle] 썸네일 ${file} ${(readFileSync(join(DIST, file)).length / 1000).toFixed(2)}KB · gzip ${sizeOf(file).toFixed(2)}KB (판정 밖)`);
    }
  }
  const extra = shipped.filter((name) => !(ids ?? []).some((id) => `${id}.svg` === name));
  if (extra.length > 0) issues.push(`id 목록 밖 썸네일 파일 ${extra.join(", ")}`);
  if (present.length > 0 && thumbsVersion(present) !== version) issues.push(`썸네일 버전 ${version} ≠ dist 파일 해시 ${thumbsVersion(present)}`);
  const closure = (key, seen = new Set()) => {
    if (!manifest[key] || seen.has(manifest[key].file)) return seen;
    seen.add(manifest[key].file);
    for (const dep of manifest[key].imports ?? []) closure(dep, seen);
    return seen;
  };
  const catalogJs = [...closure("src/pages/CatalogPage.tsx", closure("index.html"))].map((file) => readFileSync(join(DIST, file), "utf8"));
  if (!catalogJs.some((code) => code.includes(`.svg?v=${version}`))) issues.push(`/catalog 첫 화면 JS에 썸네일 경로 .svg?v=${version} 없음`);
  const renderCss = (manifest["render.html"]?.css ?? []).map((file) => readFileSync(join(DIST, file), "utf8")).join("\n");
  if (createHash("sha256").update(renderCss).digest("hex") !== renderCssSha256) issues.push("썸네일 CSS ≠ 배포 렌더 문서 CSS");
  const tools = Object.keys(manifest).filter((src) => src.startsWith("src/thumbs/") || src.includes("react-dom/server"));
  if (tools.length > 0) issues.push(`manifest에 썸네일 빌드 도구 ${tools.join(", ")}`);
  console.log(`[bundle] 썸네일 ${(ids ?? []).length}장 · 버전 ${version} · 가드 ${issues.length === 0 ? "통과" : "실패"}`);
  return issues;
}
const failures = [...budgetFailures, ...checkThumbnails()];
if (failures.length > 0) {
  for (const failure of failures) console.error(`[bundle] 예산 검사 실패 — ${failure}`);
  process.exit(1);
}
