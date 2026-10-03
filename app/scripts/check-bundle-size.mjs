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
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { checkBundle } from "./bundleBudget.mjs";

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
 */
const STUDIO_AFTER_ACTION = ["src/features/studio/docEngine.ts", "src/components/studio/AddSectionDialog.tsx", "src/components/studio/VariantOptions.tsx", "src/components/studio/ContactOwnerNote.tsx"];
/** 렌더 문서 진입 직후 자동 dynamic import — 지금은 없다(폴백만, M2A-1). 킷 지연 로드가 생기면 넣는다(조작 뒤 코드는 넣지 않고 크기만 출력 대상) */
const RENDER_AUTO = [];
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
 *  - eagerBudgetKb: 진입 직후 한도(없으면 125 — ADR-004 개정 1). 지금은 /studio/:projectId만 127(개정 3)
 */
const SCENARIOS = [
  { name: "/catalog", page: "src/pages/CatalogPage.tsx", auto: EAGER_DYNAMIC },
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
    afterAction: ["src/data/memoryProfileAdjust.ts", "src/data/memoryGenerate.ts", "src/data/memoryProjectRepository.ts"],
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
    eagerBudgetKb: 127,
  },
];

// 앱 manifest + 렌더 문서 manifest(`vite build --mode render`) — 합친 뒤 엔트리 이름으로 판정한다. 렌더 manifest가 없으면 render.html 없음 = 실패
const readManifest = (name) => (existsSync(join(DIST, name)) ? JSON.parse(readFileSync(join(DIST, name), "utf8")) : {});
const manifest = { ...readManifest(".vite/manifest.json"), ...readManifest(".vite/render-manifest.json") };
const sizeOf = (file) => gzipSync(readFileSync(join(DIST, file))).length / 1000;

const { lines, failures } = checkBundle({ manifest, sizeOf, scenarios: SCENARIOS, renderAuto: RENDER_AUTO });
for (const line of lines) console.log(line);
if (failures.length > 0) {
  for (const failure of failures) console.error(`[bundle] 예산 검사 실패 — ${failure}`);
  process.exit(1);
}
