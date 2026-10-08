# FLAKY-TESTS REPORT — 부하 시 흔들리는 테스트 안정화

## 결론

- 공통 원인 1개: 테스트 헬퍼 `app/src/test/renderApp.tsx`는 라우트 페이지 6개만 미리 로드했다. 렌더·조작 뒤에 처음 지나는 **2단계 지연 청크**(`import()`/`React.lazy`)는 각 파일에서 처음 쓰는 테스트 안에서 콜드 변환되고, 부하가 걸리면 이 시간이 `findBy`/`waitFor` 3초 대기나 테스트 5초 타임아웃을 넘긴다.
- 수정: 같은 헬퍼의 기존 미리 로드 패턴(정적 side-effect import)에 2단계 청크 17개를 추가했다. 변환은 파일 수집 단계로 옮겨져 테스트 대기 창 밖에서 일어난다.
- 앱 코드 변경 0, 단언·timeout·retry·skip 변경 0, vitest 설정 변경 0, 새 의존성 0. `ImportProjectFileDialog.tsx`와 그 테스트 수정 0.

## 재현

| 라운드 | 조건 | 결과 |
|---|---|---|
| 1·2 (수정 전) | `/tmp/flaky/load.sh N` = `npx vitest --run` ×2 동시 + `npm run build` 동시 | 둘 다 exit 0 (재현 안 됨) |
| 3 (수정 전) | 같음 | **vitest a exit 1** — `MoreMenu.test.tsx:74` `Unable to find role="menu" and name "더보기"` (lazy `MoreMenuBody` 첫 열기), b exit 0 |

- 이전 실패 로그(`~/.hermes/.../p1d-l3-final-gates/vitest-2.txt`)는 통과 로그로 덮여 있었다. 브리프에 적힌 8개 실패는 이번 3라운드에서 재현되지 않았다.
- 재현된 것은 같은 계열의 다른 1건(MoreMenu)이다. 3라운드에서 6번 실행해 1번 실패했다.
- 그래서 8개 대상은 아래 표처럼 정적 경로 분석으로 원인을 연결했다. 재현 기반 증거는 MoreMenu 1건뿐이라는 점을 함께 적어 둔다.

## 원인별 표

| 대상 (관찰된 실패) | 파일:줄 (대기 지점) | 원인 (첫 콜드 import) | 수정 | 근거 |
|---|---|---|---|---|
| StudioPage "문서 있음 → 편집 틀" ("불러오는 중…"에 머묾) | `src/pages/StudioPage.test.tsx:39` `h1()` | `src/pages/StudioPage.tsx:12-13` `lazy(loadLayout)` → `StudioLayout` 모듈 그래프 전체. Suspense fallback = `LoadingState`("불러오는 중…") | `renderApp.tsx`에 `StudioLayout` 미리 로드 | stub `getDoc`은 바로 resolve되므로 "불러오는 중…"이 오래 남는 경로는 lazy fallback뿐이다(정적). `renderApp`은 `StudioPage`만 미리 로드했고 `StudioPage`는 `StudioLayout`을 정적 import하지 않는다 |
| SectionMove 2 · SectionVariant · StudioLayoutImages 2 · SectionAdd 포커스 · 편집 FAQ heading | `openStudio.tsx:74` h1 findBy · `SectionMove.test.tsx:32` findByText · `SectionVariant.test.tsx:30` findByRole radiogroup · `SectionAdd.test.tsx:56-62` | `StudioLayout`(진입) · `features/studio/docOps.ts:39` `loadDocEngine`(연산 본문·꼬리) · `VariantSwitch.tsx:5` `VariantOptions` · `EditFields.tsx:14-16` `ImageSlotPanel`·`ContactOwnerNote` · `StudioLayout.tsx:51` `AddSectionDialog` · `useGateReport.ts:9` `gateCheck` | 위 청크 미리 로드 | 정적: 각 대기가 위 첫 import 뒤에 있다. SectionAdd 연산 경로(`useSectionOps.ts:123-125` → `StudioLayout.tsx:187` `afterAdd`)는 선택·알림·포커스를 한 배치로 설정하고 transition·deferred는 0건이다(grep). 그래서 앱 쪽 경쟁이 아니라 대기 창 안의 콜드 로드가 원인이다 |
| MoreMenu (이번 재현) | `src/components/studio/MoreMenu.test.tsx:74` `openMenu()` findBy | `MoreMenu.tsx:5` `lazy(() => import("./MoreMenuBody"))` | `MoreMenuBody` 미리 로드 (+ 같은 계열 `SnapshotLayer`·`ThemeDialog`) | **실측 재현** (3라운드 a) |
| ProfileGenerateLoad "받는 동안 aria-busy" (5000ms 테스트 타임아웃) | `src/pages/ProfileGenerateLoad.test.tsx:84-98` | `writeBodyLoader.ts` `loadGenerate` → `memoryGenerate`(테스트 안 `actual()`) · `candidateResultsLoader.ts:8` `CandidateResults` · `useProfileDetail.ts:61` `profileEngine` — 한 테스트 안에서 연달아 콜드 | `memoryGenerate`·`CandidateResults`·`profileEngine`·`CompareDialog` 미리 로드 | 정적: `findBy` 실패가 아니라 테스트 전체 5초 초과다. 콜드 import 3개가 직렬로 한 테스트 안에 있다. 로더 목(`loads.generate`)은 호출 수를 세므로 모듈 미리 로드와 무관하다 |
| trayBoard 3 | `src/features/compare/trayBoard.test.tsx:21·30·42` waitFor | 트레이 조작 → `writeBodyLoader.ts` `loadBoardInput`(`domain/boardInput`, zod) · `loadBoardConfirm`(`memoryBoardConfirm`) (`carryOverPanel`은 같은 계열 예방) | `boardInput`·`memoryBoardConfirm`·`carryOverPanel` 미리 로드 | 정적 (재현 안 됨). 트레이 컨텍스트(`CompareTrayContext.tsx`)에는 lazy·타이머가 없다. 저장 경로의 청크 로더만 콜드다 |

### 넣지 않은 청크와 이유

- `boardEngine`, `ExportAfter`, `exportFlow(Loader)`, `staticHtml`은 미리 로드하지 않았다.
- `CompareBoardEngineLoading.test.tsx:20`(게이트로 붙잡기), `CompareBoardEngineUi.test.tsx:17`(throw), `ExportChunkFailure.test.tsx:25`, `exportFlow.test.ts:7`이 이 모듈들을 팩토리 목으로 바꿔 **첫 import 시점 자체**를 테스트한다. 정적 미리 로드를 넣으면 그 테스트의 의미가 바뀐다.

## 수정 파일

- `app/src/test/renderApp.tsx` — 정적 미리 로드 import 17줄과 주석 2줄 (커밋 `74330be`, `e4370f4`)

## 검증

`PROGRESS.md` 검증 절 참조.

## 주의 / 가정

- 브리프의 8개 대상 실패는 재현하지 못했다. 원인 연결은 정적 분석(L2)이고, 같은 계열 1건(MoreMenu)만 실측 재현(L1)이다.
- Ego Lite는 생략했다. UI 변경이 0이고 테스트 헬퍼만 바꿨다.
- Codex 리뷰는 브리프에 따라 Jarvis가 맡는다.
- 지연 청크가 새로 생기면 같은 위험이 다시 생긴다. 앞으로는 렌더 경로에 lazy를 추가할 때 `renderApp.tsx` 목록에도 함께 넣어야 한다(후속 권고).
