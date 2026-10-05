# M2B-5 SPEC — 3안 실렌더 나란히 비교

- 작성: Designer(M2B-5 명세 레인, 코드 0) · 2026-10-05 · base `292e7b6`
- 다음 레인: M2B-5 Developer가 이 문서만으로 추측 없이 구현한다. 본문은 `MQ-M2B5.md`의 ★안 기준이다(★ 승인 시 본문 수정 0).
- 표기: [L1] 저장소 파일·이 worktree 실측 확인 · [L3 추정] 실측 전 · [확인 필요] Developer 시제품 실측 대상
- 상위 근거: `docs/04-plan/M2B_PLAN.md` 13·29행 · `docs/design/2a-04/SPEC.md` 4·5·7·10절 · ADR-004 개정 1~4 · `docs/design/m2b/SPEC-MOTION-FONT.md` 1.5·2.4

---

## 0. 코드가 강제하는 전제 (L1)

| # | 사실 | 근거 |
|---|---|---|
| F1 | 3안은 `/profile/:profileId` 오른쪽 열 `CandidatesSection`(엔진 청크 `profileEngine`, 진입 자동)이 그린다. 카드·표는 `CandidateResults` 청크(`candidateResultsLoader` — 잡이 있으면 effect 자동, "3안 만들기" onClick 미리 받기) | `CandidatesSection.tsx:60~66` · `candidateResultsLoader.ts` |
| F2 | 카드 썸네일 = `Wireframe`(SectionPlan을 프로필 팔레트로 칠한 블록, `aria-hidden`, 4:5) | `CandidateCard.tsx:48~58` |
| F3 | 실렌더 = 별도 엔트리 `render.html`(`src/render/main.tsx`) iframe, `sandbox="allow-scripts"`만 → 불투명 출처. 부모 → `render{doc, kitTokens?, images?, fonts?}`·`viewport`·`select`·`serialize`, 렌더 → `ready`·`rects`·`click`·`error{INVALID_DOC│NO_KIT_TOKENS}`. 양쪽 다 `event.source` + 모양 검사(`readParentMessage`/`readRenderMessage`) | `render/protocol.ts` · `RenderApp.tsx:36~66` · `StructureCanvas.tsx:58~110` |
| F4 | 캔버스 프레임 폭 = `FRAME_REM` 데스크톱 80rem(1280) · 태블릿 48rem · 모바일 24.375rem(390), 열보다 넓으면 `zoom` 축소(`previewScale`), 캡션 "축소 보기 · N%"(내림). 프레임 높이 = 섹션 사각형 맨 아래(렌더 문서 자체 스크롤 0) | `previewFrame.ts` · `StructureCanvas.tsx:185~270` |
| F5 | 모션: 렌더 문서는 `data-motion-play`를 쓰지 않는다 → 미리보기는 항상 최종 상태(재생 0) | `kit/motion.css:4` · `sectionMotion.ts` |
| F6 | 글꼴: 캔버스는 `kit/fonts.css` 면을 `document.fonts.load`, 상한 3000ms 넘으면 폴백 글꼴로 첫 `rects`, 늦은 로드 = 재측정 | `siteFontLoad.ts:5~` (M2B-4a 2.4) |
| F7 | 구조안 → 편집 문서 = `writeStartDoc`(`data/startDocWrite.ts`, 순수·동기): 대응표 `mapVariant`(표 밖 = `UNKNOWN_VARIANT`) → `createDocFromCandidate` → 예시 문구(`sampleCopy`). 엔진 예외 = `BAD_VALUE`. 바뀐 쌍 알림 `changeNotice` | `startDocWrite.ts:66~91` · `engineVariantMap.ts` |
| F8 | `data/`에서 엔진 import 허용 파일은 `startDocWrite.ts` 하나. `features/profile/**`는 엔진 import 금지. 허용: `pages/StudioPage.tsx`·`components/studio/**`·`features/studio/**`·`render/**`·`kit/**` | `engine/engineImportGuard.test.ts:27` |
| F9 | 킷 토큰 = `docKitTokens(series, profileVersion)`(type-only import 파일) — 팔레트(보정 반영)·글꼴·**base `scale`**·간격·카드·미디어 비율 | `features/studio/docPurpose.ts:42~57` |
| F10 | **3안 `axes.typeScale`(제목 비율 축)은 PageDoc에도 KitTokenInput에도 전달되지 않는다** — 편집 시작 뒤 B·C안도 프로필 비율로 그려진다 | `generation.ts:24` · `createDocFromCandidate.ts` · F9 → **MQ-M2B5-2** |
| F11 | 실렌더 변형 = `SECTION_DEFINITIONS` 전부(30/30) — 대응표를 통과한 섹션은 킷 토큰이 있으면 모두 킷으로 그린다 | `renderedVariants.ts:9` |
| F12 | 네이티브 `dialog` + `showModal()` 패턴이 이미 있다(Esc = 취소, 닫히면 연 버튼으로 포커스). jsdom에는 `showModal` 대체만 있고 바깥 inert는 흉내 내지 않는다 | `AddSectionDialog.tsx` · `ExportAfter.tsx` · `test/setup.ts:13~` |
| F13 | 정적 HTML 내보내기 숨은 iframe 상한 8000ms(`TIMEOUT_MS`) | `staticHtml/staticHtml.ts:18` |
| F14 | `inert` 사용처 0(src 전체 grep) | — |

### 0.1 예산 실측 (이 worktree, `npm run build` exit 0, gzip KB)

| 대상 | 첫 화면 / 한도 | 진입 직후 / 한도 |
|---|---|---|
| 공통 | 89.35 (참고) | — |
| `/catalog` | 99.66 / 100 (여유 0.34) | 102.05 / 125 |
| `/profile` | **99.61 / 100 (여유 0.39)** | 118.67 / 125 (스크립트 판정) |
| `/profile` 잡 있는 진입(아래 G1) | 99.61 | **≈121.11 / 125 (여유 ≈3.89)** [L1 계산] |
| `/compare` | 98.84 / 100 | 121.72 / 125 |
| `/studio/:projectId` | 91.78 / 100 | **127.34 / 128 (멈춤선 127.70 → 실여유 0.36)** |
| 렌더 문서 JS · CSS | 83.03 / 90 (멈춤선 89.70) · 8.75 / 30 | — |

manifest closure로 잰 `/profile` 진입 집합 대비 증가: `CandidateResults` **+2.44** · `memoryProjectRepository` +2.02 · `memoryDocBook`(= `writeStartDoc` + `runGate`·`issue`·`registry`·`sectionOps`) **+18.69** [L1].

- **G1 (기존 분류 공백, L1)**: `CandidateResults`는 잡이 있는 채 들어오면 effect가 조작 없이 받는다(자동). 그런데 `check-bundle-size.mjs` `/profile` 시나리오의 auto에 없고, `bundleBudget.mjs`는 목록 밖 dynamic import를 세지 않는다(`staticClosure`가 `imports`만 따라감) → 스크립트 118.67은 잡 없는 진입만 잰 값이다. 이 SPEC의 진입 기준선은 **121.11**로 둔다(Developer 0단계에서 시나리오로 고정 — 7.3).

---

## 1. 위치 · 진입

### 1.1 결정 (★MQ-M2B5-1 A)
**`/profile` 3안 영역의 "3안 실제 화면으로 비교" 버튼 → 전체 폭 모달 대화상자(네이티브 `dialog` + `showModal`)**. 와이어프레임 카드·비교 표·편집 시작은 그대로 둔다.

- 버튼 위치: `CandidatesSection` 안, 카드 목록 바로 아래 · "편집 시작" 위. 보이는 조건 = 잡이 끝났고(`isTerminal`) 성공한 안이 1개 이상이고 결과 청크가 왔을 때(지금 비교 표와 같은 조건 `!allFailed && typeof results === "object"`). 그 밖에는 DOM에 없다.
- 이름: "3안 실제 화면으로 비교" (secondary/outline, 아이콘 0 — P-B3 아이콘 추가 0).
- 누르면 비교 청크를 받는다(조작 뒤). 받는 동안 같은 버튼 `aria-busy` + 글자 "불러오는 중…". 청크 실패 = 버튼 아래 `role=alert` Callout "실제 화면 비교를 불러오지 못했습니다" + "다시 시도"(새 URL 재요청 — `candidateResultsLoader`와 같은 방식).
- 닫기: 머리 "닫기" 버튼 · Esc. 닫히면 연 버튼으로 포커스(F12 패턴). 바깥 클릭으로 닫지 않는다(AddSectionDialog와 같음).

### 1.2 근거 (대안 비교 — 상세 트레이드오프는 MQ-M2B5-1)

| 안 | 읽힘(1280 데스크톱 프레임 축소율) | 예산 | 흐름·키보드 |
|---|---|---|---|
| ★A 대화상자 | 열 폭 ≈389px → **약 30%** (1.3 계산) | 첫 화면 +0(버튼은 `profileEngine` 청크) · 비교 본문 조작 뒤 | 같은 화면 · 포커스 갇힘·복귀가 기존 패턴 · 선택이 3안 영역과 같은 상태 |
| B 카드 썸네일을 iframe으로 교체(인라인) | 카드 안쪽 ≈247px → **약 19%** — 와이어프레임과 정보량 차이가 작다 | 잡 있는 진입 때 iframe 3개 + 변환 청크가 **자동**(+18.69 수준이면 121.11 → ≈139.8 > 125) [L3 추정] | 페이지 Tab 순서에 3개 프레임 |
| C 새 라우트 `/profile/:id/candidates` | A와 같음 | `routes.tsx` 변경 → 공통 청크 증가 → `/catalog`(0.34)·`/profile`(0.39) 첫 화면이 먼저 깨질 위험 | 새로고침하면 메모리 store가 비어 "찾을 수 없음"(서버 연결 전) |
| D `/compare` 보드 안 | — | — | **다른 화면이다**: `/compare`는 레퍼런스 비교 보드(프로필 확정 전 단계). 3안은 프로필 확정 뒤 생성물이라 흐름이 거꾸로 간다 |

- 금지(이 기능 때문에): `pages/ProfilePage.tsx`·`app/routes.tsx`·`main.tsx`·공통 청크에 들어가는 파일 수정 0.

---

## 2. 표시

### 2.1 대화상자 구성 (DOM 순서 = 보이는 순서)
1. 머리: h2 "3안 실제 화면 비교"(접근 이름) · 캡션 2줄(2.4) · 미리보기 폭 라디오 그룹(2.3) · "닫기".
2. 본문(유일한 스크롤 영역): 안 열 3개(≥1280) 또는 1개(<1280, 2.2).
3. 안 열 = 머리(h3 "A안" · Tag "선택"(선택 시) · Tag "경고 N"(있을 때)) → 차이 요약 글자(2.5) → 상태 줄(3.3) → 미리보기 프레임 → "이 안 선택" 버튼.
   - 버튼을 프레임 **위**(요약 바로 아래)에 둔다 — 프레임 높이가 수천 px라 아래에 두면 안마다 버튼이 화면 밖으로 밀린다(목업 없음, 기능 우선).
4. 대화상자 안 `role=status` 1개(3.4) — `showModal` 동안 바깥 "프로필 알림"은 inert라 읽히지 않을 수 있다 [L3 추정, B 검증].

### 2.2 반응형 (뷰포트 기준, 대화상자 폭 = 뷰포트 − 좌우 여백 각 `--spacing(4)`, 안쪽 패딩 `--spacing(6)`)

| 뷰포트 | 배치 | 데스크톱 프레임(1280) 축소율 | 모바일 프레임(390) |
|---|---|---|---|
| 1920 | 3열, 대화상자 본문 최대 `--layout-max-width`의 1.5배까지(약 1840) | 약 47% | 100%(원 크기, 열 가운데) |
| 1280 | 3열 (열 ≈389px) | **약 30%** | 약 99% |
| 1024 | **1안씩** + 안 전환 라디오 "A안 · B안 · C안"(머리, 폭 선택 옆) | 약 73% | 100% |
| 768 | 1안씩 | 약 53% | 100% |
| 390 | 1안씩, 머리 컨트롤 줄바꿈(가로 넘침 0) | 약 26% | 약 87% |

- 축소율 = (열 안쪽 폭 ÷ 프레임 px) 내림, 표 값은 [L3 추정] — 구현 후 B 측정(CMP-AC-B3).
- 3열 경계를 1280으로 둔 이유: 1024에서 3열이면 약 23%로 1280 3열(30%)보다 작고 와이어프레임 카드(19~22%)와 차이가 작다. "나란히"는 ≥1280에서만 이득이 있고, 그 아래는 빠른 전환이 더 읽기 쉽다.
- 1안씩 모드: 안 전환 = 라디오 그룹(`SegmentedControl`, roving). 기본 = 선택한 안, 선택 없으면 A. 전환하면 본문 스크롤을 맨 위로(동기화 없음 — 다른 문서라 같은 오프셋이 같은 섹션이 아니다).
- 3열 모드: 열 3개가 **한 스크롤 영역**을 공유한다 → 맨 위 정렬은 자동, 별도 스크롤 동기화 코드 0. 섹션 단위 정렬(같은 섹션 높이 맞춤)은 하지 않는다 — 안마다 섹션 구성·높이가 달라 맞추면 실제 모양이 왜곡된다.
- 프레임 높이: 캔버스와 같다(섹션 사각형 맨 아래, F4) × 축소율. 고정 높이·프레임 안 스크롤 0. 첫 `rects` 전에는 프레임 자리 최소 높이 `min-h-40` + 상태 줄 "그리는 중…".

### 2.3 미리보기 폭 (★MQ-M2B5-3 A)
- 라디오 그룹 "미리보기 폭": 데스크톱(기본) · 모바일. 태블릿은 넣지 않는다(3안 비교의 축 — Hero·그리드 — 이 데스크톱과 모바일에서 가장 다르게 보인다, 조작 수 최소).
- 바꾸면 세 프레임 모두 폭 변경 + `viewport` 메시지(캔버스와 같은 다리). 문서는 다시 보내지 않는다.
- 폭 라벨은 `PREVIEW_WIDTH_OPTIONS`와 같은 글자를 쓰되 **값 import 금지**(공유 청크 분할로 `/studio`·`/references/:id`가 늘 수 있다 — `previewFrame.ts` 머리 주석의 S6 실측). 로컬 상수 + 같은 값인지 가드 테스트(CMP-AC-G3).

### 2.4 캡션 (대화상자 머리, 늘 보임)
1. "실제 화면 미리보기 — 3안 모두 예시 문구로 그렸습니다. 이 프로젝트에 편집 문서가 없으면 편집 시작이 이 문서로 시작합니다."
   - **동일성 보장 범위(Codex R1 P1)**: "미리보기 = 편집 시작 결과"는 **새 문서 생성**(`startDoc(..., "create")` 성공)에만 성립한다. 프로젝트에 이미 편집 문서가 있으면 `DOC_EXISTS` → 기존 문서(다른 안·이전 버전일 수 있음)를 그대로 연다 [L1 `CandidatesSection.tsx:75~80` · `memoryDocBook.ts:237~238` · `ProfileCandidates.test.tsx:294~301`].
   - 그래서 대화상자를 열 때 프로젝트에 편집 문서가 있음을 알 수 있으면 캡션 1 대신 "이 프로젝트에는 이미 편집 중인 문서가 있습니다 — 편집 시작은 그 문서를 엽니다(이 미리보기로 바뀌지 않음)."를 보인다. 알 수 있는 경로가 비교 청크 밖(프로젝트 저장소 로드 = `memoryProjectRepository` 조작 뒤 청크)이면 **조회하지 않고** 두 문장을 함께 보인다: 캡션 1 + "이미 편집 중인 문서가 있으면 편집 시작은 그 문서를 엽니다." (조회 추가 = 진입 예산 영향 → 하지 않는다). 선택한 안으로 기존 문서를 교체하는 restart(확인·스냅샷·revision)는 이번 범위 밖.
2. (★MQ-M2B5-2 A) "제목 비율 축은 아직 편집 문서에 반영되지 않아 3안 모두 프로필 비율 {scale}로 그렸습니다 — 비율 차이는 카드의 구조 미리보기에서 보세요."
- 3안 영역 상시 캡션 `CANDIDATE_TEXT.preview`("…실제 페이지는 생성기 연결 후(M2) 만들어집니다.")는 이제 사실과 다르다 → **"구조 미리보기 — 섹션 구성·비율·모션 배정입니다. 실제 화면은 '3안 실제 화면으로 비교'에서 봅니다."**로 바꾼다(`generationText.ts`, 같은 엔진 청크 — 증가 ±수 바이트).

### 2.5 안 이름 · 차이 축 · lint · 선택과의 관계
- 차이 요약 글자 = 카드와 **같은 함수**: `heroText(axes) · GRID_LABELS[grid] · scaleText(plan, profileScale)`(CandidateCard export). 비율은 MQ-M2B5-2 A에서 "비율 1.2 (구조안)"처럼 접미 "(구조안)"을 붙여 프레임과 다를 수 있음을 글자로 알린다.
- 바뀐 쌍: 변환 결과 `changeNotice`가 있으면 요약 아래 한 줄(편집기가 실제로 여는 변형 — F7). 예: "구조안의 섹션 2개를 편집기 변형으로 바꿔 열었습니다 — 소개 2단 소개 → story …".
- lint: Tag "경고 N"(카드와 같은 `severity === "block"` 수) — 상세 규칙 문장은 카드 `상세`에만(중복 0).
- 선택(★MQ-M2B5-4 A): 열마다 "이 안 선택"(`aria-pressed`, 접근 이름 "A안 선택") = 3안 영역과 **같은 핸들러** `gen.select(job.jobId, id)` · 같은 `busy`. 선택하면 카드·대화상자 양쪽이 같은 상태로 바뀐다(상태 1개).
  - **선택 결과 알림(Codex R1 P2)**: 기존 경로는 실패를 `gen.failure`(3안 영역 `role=alert`)에, 성공을 바깥 "프로필 알림"으로 보낸다 [L1 `useGeneration.ts:103~106·135`] — `showModal` 중에는 둘 다 inert·가려진다. 대화상자가 열려 있는 동안: `gen.failure`가 있으면 대화상자 머리 아래 `role=alert`(같은 문장, 3안 영역과 동시 표시 무방) · 선택 성공 문장은 대화상자 안 `role=status`(3.4)에도 1회 낸다(`announce` 래핑 — 열린 동안 대화상자 status로도 전달). 재시도 = 같은 "이 안 선택" 다시 누름. "편집 시작"은 대화상자에 두지 않는다(닫고 3안 영역에서 — 행동 1곳).
- 실패·만드는 중 안(`status !== "succeeded"`): 열은 두되 프레임 대신 `failureText(c)` 또는 "만드는 중"(카드와 같은 문장), 선택 버튼 0.

### 2.6 와이어프레임 처리 — **이번 범위 = 유지**
- 근거: M2B_PLAN 13행 "와이어프레임 모양표 폐기(30/30 뒤 별건)". 카드 와이어프레임은 진입 비용 0으로 3안을 한눈에 보이는 유일한 수단이고(실렌더 3개를 진입 때 그리면 예산 초과 — 1.2 B), 비율 축을 보이는 곳이기도 하다(F10).
- 실렌더 실패·변환 불가 안의 폴백은 대화상자 안에서 그 안의 `Wireframe`(같은 컴포넌트, 이미 받은 `CandidateResults` 청크)을 프레임 자리에 그리고 상태 줄로 이유를 말한다(3.3).

---

## 3. 로딩 · 성능

### 3.1 지연 생성 · 상한
- 아무것도 진입 때 받지 않는다. "3안 실제 화면으로 비교" onClick → (1) 비교 청크 import (2) 변환 3건(동기) (3) `showModal` (4) 프레임 마운트.
- 동시 iframe 상한: 3열 모드 **3**(열마다 1), 1안씩 모드 **1**(전환 = 이전 프레임 언마운트 → 새 프레임 마운트). 대화상자를 닫으면 전부 언마운트(렌더 문서 React 3벌·object URL 0 남김).
- `render.html` JS(83.03KB)는 같은 URL이라 두 번째 프레임부터 HTTP 캐시 [L3 추정]. 파싱·실행은 프레임마다.
- 문서 재전송 0: 폭 변경은 `viewport`만, 선택 변경은 프레임과 무관(`select` 메시지 보내지 않음 — 선택 테두리 오버레이 없음).

### 3.2 변환 (순수)
- 안마다 `writeStartDoc({ candidateId, sections: plan.sections, libraryVersion: job.libraryVersion, generatorVersion: job.generatorVersion, profileVersion: viewed.version, projectId: "preview", updatedAt: "1970-01-01T00:00:00.000Z" })`.
  - `"preview"`는 `LOOSE_ID`(`/^[A-Za-z0-9][A-Za-z0-9._:-]*$/`) 통과 [L1]. 시각 고정 = 결정성(같은 안 → 같은 해시).
  - 저장소 쓰기 0: `startDoc`·`loadProjects`를 부르지 않는다. 프로젝트가 없는 프로필(`series.project` 없음)도 동작.
- 킷 토큰 = `docKitTokens(series, viewed.version)` 1회(3안 공통). MQ-M2B5-2 A에서 `type.scale` 덮어쓰기 0.
  - `docKitTokens`는 `features/studio/docPurpose.ts`(type-only import)라 값 import 시 공유 청크 분할로 `/studio`가 늘 수 있다 → 비교 청크에서 import하고 `/studio` 진입을 단계마다 실측(멈춤선 127.70). 늘면 함수 복제 + `src/test/kitTokens.test.ts` 방식 대조 가드로 바꾼다(Developer 판단 → 보고).
- 변환 위치(Developer가 시제품 실측으로 선택, 둘 다 조작 뒤):
  - **(a) 기본**: 부모 비교 청크가 `data/startDocWrite.ts`를 import. 이 파일에 `judgeExport`(→ `runGate`)도 있어 같은 청크로 끌려올 수 있다 → 비교 청크 증가 [L3 추정 +10~19KB].
  - **(a′)** (a)가 멈춤선(6.2) 넘으면: `judgeExport`를 `data/exportJudge.ts`로 분리하고 `engineImportGuard` 허용 목록에 추가(가드 테스트 갱신) [L3 추정 +6~10KB].
  - (b) 렌더 문서 안에서 변환(새 메시지 `renderPlan`) — 프로토콜·`renderImportGuard`·렌더 JS(멈춤선 여유 6.67)를 바꾸므로 **이번에는 쓰지 않는다**.

### 3.3 상태 문구 (열마다 상태 줄, `ds-caption1`, 글자 — 색만으로 구분 0)

| 상태 | 조건 | 상태 줄 | 프레임 자리 |
|---|---|---|---|
| 그리는 중 | 마운트 ~ 첫 `rects` | "그리는 중…" | 빈 프레임(min-h-40) |
| 그림 | 첫 `rects` 수신 | "축소 보기 · N%"(N<100일 때만, `scaleCaption`과 같은 문형) | iframe |
| 킷 없이 그림 | `error{NO_KIT_TOKENS}` 뒤 `rects` | "프로필 색·글꼴이 없어 기본 모양으로 그렸습니다" | iframe(폴백 섹션) |
| 그리지 못함 | `error{INVALID_DOC}` | "이 안을 그리지 못했습니다 — 구조 미리보기로 표시합니다" | `Wireframe` |
| 시간 초과 | 마운트 후 **8000ms**(F13과 같은 값) 안에 첫 `rects` 없음 | "그리는 데 시간이 오래 걸립니다" + 버튼 "다시 그리기"(그 열 프레임만 재마운트) | 빈 프레임 유지 · 늦게 `rects`가 오면 "그림"으로 바뀐다 |
| 변환 불가 | `writeStartDoc` → `UNKNOWN_VARIANT`·`BAD_VALUE` | 그 `alert` 문장 그대로(F7) | `Wireframe`, iframe 마운트 0 |
| 만들지 못한 안 | `c.status === "failed"`/`"pending"` | `failureText(c)` / "만드는 중" | 없음 |

- 글꼴: 렌더 문서 규칙 그대로(F6) — 3000ms 넘으면 폴백 글꼴로 첫 `rects`, 늦은 로드는 재측정(높이 갱신). 부모는 `fonts` 바이트를 보내지 않는다(캔버스와 같음).
- 모션: 최종 상태(F5) — 부모가 할 일 0. 대화상자 열림·닫힘·열 전환에 전환 애니메이션 0.

### 3.4 알림 (대화상자 안 `role=status` 1개, `display:none` 금지)
- **종결 상태** = 그림 · 킷 없이 그림 · 그리지 못함 · 변환 불가 · 시간 초과 · **만들지 못한 안(failed)**. "만드는 중(pending)" 안은 버튼 조건(잡 종료)상 없다.
- 3열 모드: 세 열이 모두 종결 상태가 되면 **1회** "3안 중 N개를 그렸습니다" (+ " · M개는 구조 미리보기로 표시" · + " · K개는 만들지 못했습니다"). 중간 단계 낭독 0(2a-04 5.3 원칙). (Codex R1 P2 — failed 열을 집계에 포함)
- 1안씩 모드: **지금 보이는 안**이 종결되면 1회 "A안을 그렸습니다"/"A안을 그리지 못했습니다 — 구조 미리보기로 표시". 다른 안은 전환해서 보일 때 같은 규칙(안마다 첫 종결 1회). 방문하지 않은 안을 기다리지 않는다.
- 선택 성공 문장(2.5)도 같은 status로.
- 1안씩 모드 전환 때는 알리지 않는다(라디오 선택 자체가 읽힌다).

---

## 4. 접근성

- **미리보기는 비대화형**: 프레임 감싸개에 `inert`. 이유 — 렌더 문서 안에는 킷 header 메뉴 버튼·링크가 있어 `aria-hidden`/`tabindex=-1`만으로는 Tab이 iframe 안으로 들어간다 [L3 추정, B 검증]. 미리보기에서 조작할 것이 없고(링크 이동은 렌더 문서가 이미 막는다 — `RenderApp.tsx:89~97`), 정보는 iframe 밖 글자(2.5)가 모두 가진다.
  - iframe `title` = "A안 실제 화면 미리보기"(inert로 접근성 트리에서 빠지지만 검사 도구·inert 미지원 폴백용으로 둔다).
  - React 19는 `inert` 불리언 prop을 DOM 속성으로 낸다 [L3 추정 — Developer가 렌더 결과 `hasAttribute("inert")`로 확인, CMP-AC-U4]. jsdom은 inert 동작(포커스 제외)을 흉내 내지 않는다 → 동작은 [B]로만 검증.
  - 렌더 문서가 보내는 `click`은 무시한다(inert면 오지 않음, 와도 무시).
- 키보드 순서: (열 때 포커스) 미리보기 폭 라디오 → [1안씩: 안 전환 라디오] → "닫기" → 열마다 "이 안 선택" → [시간 초과 시 "다시 그리기"] → 본문 스크롤 영역(`tabIndex=0`, 접근 이름 "3안 미리보기 영역" — 키보드 스크롤, 캔버스 `scrollable` 규칙과 같음).
  - 열 때 포커스 = 첫 라디오(AddSectionDialog "첫 입력" 규칙). 닫힘(Esc·닫기) → "3안 실제 화면으로 비교" 버튼.
- 스크린리더 요약: 열마다 h3 "A안" → 요약 글자(Hero · 그리드 · 비율 · 바뀐 쌍) → 상태 줄. 색 외 단서: 선택 = Tag "선택" + 버튼 "선택됨"(카드와 같은 2개).
- reduced-motion: 렌더 문서는 감소 설정과 무관하게 재생 0(F5). 대화상자도 애니메이션 0 → 추가 규칙 없음.
- 대비: 화면 UI는 v2 토큰만(2a-04 5.5). 프로필 색은 iframe 안(사용자 사이트)에만.

---

## 5. 보안

- iframe은 캔버스와 같이 `sandbox="allow-scripts"`만. **`allow-same-origin`·`allow-popups`·`allow-forms`·`allow-top-navigation` 금지**(가드 CMP-AC-G2). `src` = `/render.html` 상수(캔버스 `RENDER_DOC_SRC`와 같은 값 — 값 import 금지, 로컬 상수 + 대조 가드).
- 메시지: 부모 수신은 **프레임별** `event.source === 그 프레임.contentWindow` + `readRenderMessage` 모양 검사. 다른 열의 메시지로 상태가 바뀌면 안 된다(CMP-AC-U3). 송신은 `postMessage(message, "*")`(불투명 출처라 대상 출처 지정 불가 — 기존 계약, `protocol.ts` 머리).
- 들어가는 데이터: 문서 = 구조안 섹션 + 기본 슬롯 + 고정 예시 문구(사용자 자유 글자 0). 킷 토큰 = 프로필 값(보드에서 사용자가 입력한 대표색 포함) → 렌더 쪽 `isKitTokens`/`isCssValue`(`; { } < > " ' \` 거부)·글꼴 이름 정규식이 막는다 — 새 경로 0, 검사 재사용. 이미지·글꼴 바이트 송신 0.
- 렌더 문서는 받은 문서를 `validatePageDoc`으로 다시 검증(F3) — 변경 0.
- 렌더 문서·프로토콜 변경 0(3.2 (b) 미사용) → `renderImportGuard`·`protocol.test` 변경 0.

---

## 6. 번들 계획

### 6.1 원칙
- **첫 화면 증가 0**(`/profile` 99.61, `/catalog` 99.66 그대로 ±0.00 — 공통·`ProfilePage` 청크 무변경).
- 진입 직후: 버튼·로더 호출·문구 = `profileEngine` 청크 [L3 추정 +0.10~0.25KB].
- 비교 대화상자·프레임 다리·변환 = **조작 뒤 청크**(`features/profile/compareFrames.tsx` 가칭 → `components/studio/` 아래 다리 파일 또는 `data/startDocWrite.ts` 경유 — F8 가드를 지키는 배치는 Developer가 정하고 보고). 예산 판정 밖, 크기만 출력(`afterAction`).

### 6.2 예상 증가와 멈춤선

| 대상 | 기준 | 예상 [L3 추정] | 멈춤선 (넘으면 멈추고 보고) |
|---|---|---|---|
| `/profile` 첫 화면 | 99.61 | +0.00 | **> 99.64** (다른 화면 ±0.03 규칙) |
| `/catalog`·`/references/:id`·`/compare` 첫 화면 | 99.66 · 97.00 · 98.84 | +0.00 | 각 기준 +0.03 |
| `/profile` 진입(잡 없음, 스크립트) | 118.67 | +0.10~0.25 | > 119.50 |
| `/profile (3안 있음)` 진입(0단계 신설) | ≈121.11 | +0.10~0.25 | **> 122.00** |
| `/studio/:projectId` 진입 | 127.34 | +0.00 | **> 127.37**(±0.03 — 공유 청크 분할 감지) · 절대 127.70 |
| 렌더 JS·CSS | 83.03 · 8.75 | +0.00 | 변화 있으면 멈춤(이번 범위 밖) |
| 비교 조작 뒤 청크(새 afterAction) | — | +10~19 | **> 25KB** → (a′) 분리 후 재측정, 그래도 넘으면 보고 |

- 예산 상향 필요 없음(첫 화면 0 · 진입 여유 ≈3.89 중 ≤0.25 사용) [L3 추정]. 멈춤선을 넘으면 상향이 아니라 배치 재검토 → 보고(ADR 개정은 사용자 결정).

### 6.3 측정 방법
1. `cd app && npm run build`(= tsc + vite build + render build + `check-bundle-size.mjs`) exit 0.
2. `check-bundle-size.mjs`에 (0단계) 시나리오 `/profile (3안 있음)` 추가: `auto` = `/profile` auto + `src/features/profile/CandidateResults.tsx`. (구현 단계) `/profile` 두 시나리오 `afterAction`에 비교 청크 키 추가. 주석에 호출 지점("3안 실제 화면으로 비교" onClick) 기록(파일 머리 분류 규칙).
3. 단계마다 표 6.2 전 행을 PROGRESS에 기록(기준 대비 ±).

---

## 7. 수용 기준 · QB · 깨질 테스트 · 단계 계획

### 7.1 CMP-AC — [U] 단위·컴포넌트(Vitest) · [G] 가드(정적 검사) · [B] 실제 브라우저(ego-browser, 1280·1024·768·390)

| # | 종류 | 기준 |
|---|---|---|
| CMP-AC-U1 | U | 버튼은 잡 종료 + 성공 1개 이상 + 결과 청크 있음일 때만 있다. 그 밖(잡 없음·진행 중·전부 실패) DOM에 없다 |
| CMP-AC-U2 | U | onClick 전에는 비교 청크 요청 0(로더 이음새 spy — `GenerationLoad.test` "번들 분류 근거"와 같은 방식). 청크 실패 → `role=alert` + "다시 시도" → 새 요청 |
| CMP-AC-U3 | U | 프레임별 `event.source` 대조: B열 프레임 메시지로 A열 상태가 바뀌지 않는다. 모양 틀린 메시지 무시. `click` 무시 |
| CMP-AC-U4 | U | 감싸개 `inert` 속성 · iframe `sandbox === "allow-scripts"` · `title` "X안 실제 화면 미리보기" · `src` `/render.html` |
| CMP-AC-U5 | U | 변환 결정성: 같은 안 2회 → 같은 `hash` · 저장소 쓰기 0(`startDoc` 호출 0) · 프로젝트 없는 프로필도 문서 생성 |
| CMP-AC-U6 | U | 상태 7종(3.3) 문구·프레임 자리 — 시간 초과는 가짜 타이머 8000ms · 늦은 `rects` → "그림" · "다시 그리기" = 그 열만 재마운트 |
| CMP-AC-U7 | U | `role=status`: 3열 = 모든 열 종결 시 1회(부분 성공 잡 — failed 열 포함 집계) · 1안씩 = 보이는 안 종결 시 1회, 방문 안 한 안을 기다리지 않음 · 중간 0 |
| CMP-AC-U8 | U | "이 안 선택" = `gen.select` 같은 핸들러 · 카드와 같은 `aria-pressed`·"선택됨"·Tag "선택" · 선택 실패 → 대화상자 안 `role=alert`(같은 문장) · 다시 누름 = 재시도 · 성공 → 대화상자 status 1회 |
| CMP-AC-U12 | U | 캡션 1 동일성 범위 문장(2.4) — 기존 문서 있는 프로젝트(`DOC_EXISTS`)에서 편집 시작이 기존 문서를 연다는 안내가 보인다 |
| CMP-AC-U9 | U | 폭 전환 = `viewport` 메시지만(문서 재전송 0) · <1280 1안씩 + 안 전환 라디오, 기본 = 선택한 안 |
| CMP-AC-U10 | U | 닫기·Esc → 연 버튼 포커스 · 닫으면 iframe 0 |
| CMP-AC-U11 | U | 캡션 2.4 문장 · `CANDIDATE_TEXT.preview` 새 문장 · MQ-2 A: 비율 접미 "(구조안)" |
| CMP-AC-G1 | G | `engineImportGuard` 통과(새 파일 배치가 허용 목록 안 — (a′)면 목록 갱신 테스트 포함) |
| CMP-AC-G2 | G | 소스 전체에서 `allow-same-origin` 0 · 비교 프레임 sandbox 리터럴 = `"allow-scripts"` |
| CMP-AC-G3 | G | 로컬 상수(`/render.html`·폭 rem·폭 라벨)가 `RENDER_DOC_SRC`·`FRAME_REM`·`PREVIEW_WIDTH_OPTIONS`와 같다(`previewFrame.test` E-AC-15 방식) |
| CMP-AC-G4 | G | `noHardcodedStyle`·`brandIsolation` 통과(hex·px 0) |
| CMP-AC-G5 | G | 번들: 6.2 표 멈춤선 전부 안(빌드 출력 첨부) · 새 시나리오 `/profile (3안 있음)` 존재 |
| CMP-AC-B1 | B | 1280에서 3열 실제 렌더(킷 섹션) — 세 열 Hero·그리드가 서로 다르게 보임(스크린샷) |
| CMP-AC-B2 | B | Tab이 iframe 안으로 들어가지 않는다(inert 실측) · 키보드 순서 4절대로 · Esc 복귀 |
| CMP-AC-B3 | B | 2.2 표 축소율 실측(±2%p) · 가로 넘침 0(4폭) |
| CMP-AC-B4 | B | `showModal` 중 대화상자 안 status 낭독 확인(접근성 트리 `role=status` 텍스트) |
| CMP-AC-B6 | B | 대화상자 열린 채 선택 실패(저장소 실패 주입)·성공 시 alert/status가 실제 접근성 트리에서 읽힘 |
| CMP-AC-B5 | B | 모션: 프레임 안 `[data-motion-play]` 0 · 애니메이션 0(최종 상태) — 감소 설정 on/off 둘 다 |

### 7.2 QB (M2B-6 QA 수동·시각 검수 목록)
1. 3안 실제 화면이 카드 와이어프레임의 축(Hero·그리드)과 같은 방향인지 육안 대조(대응표로 바뀐 쌍은 `changeNotice`와 일치).
2. 데스크톱 30% 축소에서 "구별 가능한가" 루브릭 판정 — 불가면 MQ-3 B(모바일 기본) 재검토 근거.
3. 1안씩 모드 전환 속도(체감) · 렌더 문서 3개 동시 메모리(DevTools) 기록.
4. 글꼴 3000ms 폴백 뒤 늦은 로드 시 열 높이 갱신·스크롤 튐 여부.
5. 편집 문서가 없는 프로젝트에서 편집 시작 후 편집기 캔버스와 대화상자 미리보기 동일성(같은 안·같은 폭 스크린샷 대조) — MQ-2 A 확인. 이미 문서가 있는 프로젝트는 기존 문서가 열리고 안내 문장이 맞는지 확인.
6. (G1) 잡 있는 `/profile` 진입 네트워크에 `CandidateResults` 자동 요청이 보이는지 — 시나리오 신설 근거 재확인.

### 7.3 깨질 기존 테스트 (예상, L1 grep 기준)
| 파일 | 이유 |
|---|---|
| `pages/ProfileCandidates.test.tsx:78` | 접두 정규식 `^구조 미리보기 — 섹션 구성·비율·모션 배정입니다`라 새 문장(2.4)도 통과 예상 — 문장 전체를 단언하는 테스트를 새로 쓰면 그쪽만 |
| `CandidatesSection` 관련 테스트(버튼 수·Tab 순서 단언이 있으면) | 버튼 1개 추가 |
| `scripts/bundleBudget.test.mjs` | 시나리오 추가 자체는 데이터라 무관 [L3 추정] — 깨지면 기대값만 |
| `engine/engineImportGuard.test.ts` | (a′) 선택 시 허용 목록 1줄 |
| `features/studio/previewFrame.test.ts` | 무변경 예상(대조 가드는 새 파일) |
| `render/renderImportGuard.test.ts`·`render/protocol.test.ts` | 무변경(렌더 쪽 0) |

### 7.4 Developer 단계 계획 (각 단계 = 커밋 1개 이상 · 끝마다 typecheck·lint·test·build 4개 + 6.2 표 기록)
- **S0 기준선(코드 0에 가까움)**: `check-bundle-size.mjs`에 `/profile (3안 있음)` 시나리오 추가 → 빌드 → 121.11 근처 실측 확인. 다르면 이 SPEC 0.1을 실측값으로 정정 기록.
- **S1 시제품 = 예산 실측 먼저**: 버튼(U1) + onClick 동적 import + 변환 3건 + 결과를 콘솔 대신 테스트로 확인(U2·U5), **iframe 0**. 빌드 → 6.2 전 행. 비교 청크 > 25KB면 (a′) 분리 후 재측정. `/studio` +0.03 넘으면 `docKitTokens` 복제 전환. 여기서 멈춤선 넘으면 **구현 중단·보고**.
- **S2 대화상자 + 프레임 다리**: `dialog`·3열/1안씩·폭 전환·프레임별 다리(U3·U4·U9·U10, G2·G3). 캔버스 `useRenderFrame`은 export되지 않았으므로 비교 전용 다리(ready → render → 첫 rects로 높이, select·click 없음)를 새로 쓴다 — `StructureCanvas` 수정 0(`/studio` 무변경).
- **S3 상태·알림·폴백**: 3.3 7종 · 3.4 · 와이어프레임 폴백 · 캡션(U6·U7·U11).
- **S4 선택 연동·접근성 마감**: U8 · 포커스 규칙 · 스크롤 영역 tabIndex.
- **S5 브라우저 검증**: ego-browser로 B1~B5(4폭), 스크린샷·수치 PROGRESS 기록. 메모리 store 함정 — 새로고침 금지, 앱 안 클릭으로만 이동(보드 확정 → 3안 만들기 → 비교).
- **S6 Codex 검증**(branch, base = 이 SPEC 머지 지점) 1~2라운드 → 반영 → REPORT.
- 시도 상한: 같은 멈춤선 초과를 배치 변경 2회로 못 풀면 멈추고 보고.

---

## 8. 위험
| 위험 | 대응 |
|---|---|
| 공유 청크 분할로 `/studio`(실여유 0.36)·`/catalog`(0.34)가 늘어남 | 값 import 금지 + 대조 가드(2.3·5) · 단계마다 전 라우트 실측 |
| `inert`가 iframe 내부 포커스까지 막지 못하는 브라우저 | B2 실측. 막지 못하면 대안: iframe `tabindex=-1` + 렌더 문서에 "비대화형" 메시지 추가는 프로토콜 변경이라 **보고 후 결정**(이번 범위 밖) |
| 30% 축소에서 차이가 안 읽힘 | QB2 → MQ-3 B 재검토 |
| 미리보기와 편집 결과 불일치(비율 축 · 기존 문서) | 비율 = MQ-2 A + 캡션, 축 전달(C)은 별건 · 기존 문서 = 동일성은 새 문서에만, 안내 문장(2.4) · restart 교체는 별건 |

## 9. 이 문서가 결정하지 않는 것
- `MQ-M2B5.md` 4건(위치 · 비율 축 · 기본 폭 · 대화상자 안 선택). 본문은 ★안 기준.
- 와이어프레임 모양표 폐기(M2B_PLAN 별건) · 비율 축을 편집 문서로 전달하는 엔진 계약 변경(MQ-2 C, 별건).

## 10. 기록
- r0 2026-10-05 Designer 초안(이 worktree 실측 0.1).
- r1 2026-10-05 Codex adversarial R1(needs-attention) 반영: P1 동일성 범위(2.4) · P2 종결 집계·1안 모드 알림(3.4) · P2 대화상자 안 선택 실패/성공 알림(2.5) · U7·U8·U12·B6. Codex 검토 결과는 `dev/active/m2b-5-spec/REPORT.md`.
