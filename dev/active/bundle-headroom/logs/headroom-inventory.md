# BUNDLE-HEADROOM 인벤토리 — `/compare`·`/profile` 진입 직후 closure (코드 변경 0)

- 기준: `3c4d5c7`(= main `ae115b1` + 브리프) · `npx vite build` → `node scripts/check-bundle-size.mjs` · 2026-09-27
- 합계(gzip KB, 첫 화면 / 진입 직후 · 예산 100 / 125): `/compare`·`(조정 있음)` 99.60 / **124.59 (여유 0.41)** · `/profile` 99.36 / **124.68 (0.32)** · 공통 JS 89.06
- 측정 방법
  - **청크 gzip** = `check-bundle-size.mjs`와 같은 방식(zlib 기본 레벨, 청크 파일 전체). 합계는 이 값의 합.
  - **모듈 gz(단독)** = 빌드 중 임시 플러그인(`generateBundle`의 `chunk.modules[id].code`, 저장소에 넣지 않음)으로 모듈 렌더 코드 하나만 gzip한 값.
    같은 청크 안 모듈끼리 압축 사전을 나누지 못해 **청크 gzip보다 크게 나온다**(합이 청크보다 큼) — 순위·후보 고르기용이고, 절감은 이동 후 빌드로 다시 잰다.
- 열: **첫 렌더 필요** = 진입 직후 화면(제목·목록·캡션·상태 문장·입력 틀)을 그리는 데 쓰는가 · **미룰 수 있나** = 조작 핸들러 또는 조작으로만 참이 되는 조건 뒤로 옮길 수 있는가(P-B9 · Q-F4-1) · **미루면 사용자가 보는 변화**

## 1. `/compare` — 첫 화면(공통 + 라우트 청크) 뒤에 자동으로 받는 것 (+24.99)

| 청크 (gzip) | 모듈 | 모듈 gz(단독) | 첫 렌더 필요 | 미룰 수 있나 | 미루면 보이는 변화 |
|---|---|---:|---|---|---|
| `profileDraft` (9.79) | `zod/v4/core/schemas`·`util`·`core`·`parse`·`checks`·`errors`·`api`·`regexes`·`versions` + `zod/v4/mini/schemas` | 10.42 | 아니오 | **예** — 쓰는 곳은 `boardInput` 둘뿐: `parseBoardInput`(`savePicks` ← 선택·전부 선택·비우기·되돌리기·대표색/폰트 변경·열 빼기·다시 시도, 모두 조작 핸들러) · `parseCustomStyle`(`checkPrimaryColor` ← 대표색 blur·Enter) | 대표색 첫 확인이 청크 로드만큼 늦을 수 있음(포커스 때 미리 받으면 체감 0) · **로드 실패 경로가 새로 생김** |
| | `domain/boardInput` | 0.84 | 아니오 | **예** (위와 같음) | 위와 같음 |
| | `domain/profileDraft` | 2.48 | 예 — 진입 때 `evaluate`(초안 패널·Hero 안내) | 아니오 | — |
| | `domain/comparisonCells` | 1.51 | 예 — `getComparison`(비교표 값) | 아니오 | — |
| | `domain/boardPicks` | 1.10 | 예 — `getBoard`의 `releaseUnavailablePicks`(회수 안내) | 일부(`togglePick`은 조작) — 같은 모듈이라 이득 없음 | — |
| | `domain/fonts`·`palette`·`data/compareBoardRepository` | 0.93 | 예 — 초안·`CompareBoardError` 판정 | 아니오 | — |
| `boardEngine` (5.84) | `domain/boardWarnings` | 1.76 | 예 — 초안 ready면 진입 때 경고 | 아니오 | — |
| | `CustomStyleFields`·`ds/Select` (+`TextField` 청크 0.43) | 2.10 | 예 — 보드 준비 뒤 입력 틀 | 아니오 | — |
| | `boardMessages` | 1.57 | 일부 — `releasedNotices`·`unchangedSinceConfirm`은 진입, `confirmErrorPlan`은 확정 실패 뒤 | 부분만(추정 ≤ 0.4, 분할 비용 상쇄) | — |
| | `CarryOverCaption` | 0.99 | 예 — `(조정 있음)` 개수 캡션 | 아니오 | — |
| | `picksSaver`·`boardView`·`draftView`·`confirmGate`·`boardEngine`·`carryOverLoader` | 3.26 | 예 — 보드 로드 때 saver 생성·화면 모델·확정 버튼 상태 | 아니오 | — |
| `memoryStudio` (2.60) | `memoryCompareBoardRepository`·`studioStore`·`memoryStudio`·`writeBodyLoader`·`domain/profile` | 3.21 | 예 — `getBoard`·`getComparison` | 아니오 | — |
| | `memoryProfileRepository` | 0.93 | 아니오(`/compare`는 부르지 않음) | 구조 변경(`createMemoryStudio` store 이음새, ADR-005 D3) — 후보 아님 | — |
| 픽스처 (`references` 0.98 · `referenceDetails` 1.41 · `referenceComparisons` 1.02) | | 3.70 | 예 — 비교표 값 | 아니오 | — |
| `sectionLibrary` 0.64 · `contrast` 0.89 · `catalogFilters` 1.16 · `profileEvents` 0.10 · `profileRepository` 0.14 | | 3.39 | 예 — 초안 섹션·대비·열 라벨(`boardView`)·이벤트 | 아니오 | — |

## 2. `/profile` — 첫 화면 뒤에 자동으로 받는 것 (+25.32)

| 청크 (gzip) | 모듈 | 모듈 gz(단독) | 첫 렌더 필요 | 미룰 수 있나 | 미루면 보이는 변화 |
|---|---|---:|---|---|---|
| `profileDraft` (9.79) | zod 10개 모듈 + `boardInput` | 11.26 | 아니오 | **예** — `/profile`에서는 호출 0. `memoryStudio` → `memoryCompareBoardRepository`의 정적 import(`savePicks`)로만 끌려온다 | 없음 |
| | `profileDraft`·`comparisonCells`·`boardPicks`·`fonts`·`palette`·`compareBoardRepository` | 6.02 | 아니오(보드 저장소 모듈 정적 import) | 구조 변경(보드 저장소 전체를 지연) — 후보 아님 | — |
| `profileEngine` (5.63) | `AdjustmentPanel`·`PaletteContrast`·`ProfilePanel`·`adjustmentDraft`·`profileDiff`·`elementLibrary`·`profileEngine` | 7.42 | 예 — 조정 컨트롤·대비 표·버전 비교(P-B6 진입 직후 엔진) | 아니오 | — |
| | `profileMessages` | 1.73 | 일부(실패 문구는 조작 뒤) | 부분만(추정 ≤ 0.5) | — |
| `effectiveProfile` 0.34 · `profileContrast` 0.72 · `adjustmentText` 0.72 · `SegmentedControl` 1.02 · `rovingFocus` 0.19 · `contrast` 0.89 | | 4.19 | 예 — 조정 값 표시·대비 | 아니오 | — |
| `memoryStudio` (2.60) | 위 1절과 같음 | 4.14 | 예 — `getProfile`·`getAdjustmentRange` | 아니오 | — |
| 픽스처 3개 | | 3.70 | 예(`loadStudio`가 함께 받음) | 구조 변경 — 후보 아님 | — |

## 3. 결론 — 후보

1. **zod(+`boardInput`)를 조작 뒤로** — 두 라우트 공통 최대 후보. 두 호출 지점(`savePicks`, `checkPrimaryColor`)을 **둘 다** 옮겨야 `/compare`에서 빠진다.
   - 실험(스텁, 커밋 안 함): 둘 다 옮기면 `/compare` 124.59 → 118.55 · `/profile` 124.68 → 118.63(각 약 −6.0).
   - `savePicks`만 옮기면 `/compare` 125.21(**예산 초과**) — zod가 `boardEngine` 경로로 남은 채 청크만 갈라져 오버헤드가 늘어난다.
   - 함정: `boardInput`이 `compareBoard`(공통 청크 모듈)를 **런타임 import**(값 `PICKABLE_ROW_IDS`, 또는 `verbatimModuleSyntax`로 남는 `import { type … }`)하면 rolldown이 `compareBoard`를 공통 청크 밖 별도 청크로 떼어 **공통 JS 89.06 → 89.34, 모든 라우트 첫 화면 +0.26~0.29**(규칙 ③ 위반, `/compare` 첫 화면 99.89). 행 id를 호출자가 넘기고 `import type`만 쓰면 공통 89.06 그대로.
2. `boardMessages`·`profileMessages`의 실패 문구 분할 — 각 ≤ 0.5 추정, 새 청크 오버헤드로 상쇄 가능성. 1번으로 목표를 채우면 하지 않는다.
3. 후보 아님: 보드·프로필 저장소 구조(ADR-005 D3 store 이음새)·픽스처·첫 렌더 UI·`zod` 제거/교체(의존성 변경, 규칙 ④).
