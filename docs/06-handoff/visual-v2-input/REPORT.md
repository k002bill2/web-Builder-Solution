# DESIGN-APPLY-CHECK REPORT — v2 원본 ↔ 현재 화면 직접 대조 · 편집기 병렬 파일지도

- 작성: design-apply-check 레인 · 2026-09-27 · 브리프 `docs/06-handoff/DESIGN-APPLY-CHECK_BRIEF.md` · 보고 대상 Jarvis
- 기준: HEAD 3b8002b = main 9bcf0d2 + 브리프 커밋. 앱·design·기존 SPEC 수정 0.
- 근거 수준: L1 = 이번 실행 측정·캡처·메인 코드 확인 / L2 = 서브에이전트 조사(메인 미재확인) / 추정은 명시.

## 0. 실측 사실 (메인, L1)
- 빌드: `cd app && npm run build` exit 0 (`logs/build.txt`). 전체 test suite는 실행하지 않음(Developer 전담).
- 서버: `npx vite --host 127.0.0.1 --port 4345 --strictPort` (npx PID 56433, listener node PID 56453). 로그 `logs/server-4345.txt`.
- 목업 직접 렌더: **불가**. `support.js:1143` 이 React UMD를 `https://unpkg.com/react@18.3.1/...` 에서 받는다. 외부 접근 금지라 렌더하지 않았고, dc.html 마크업·인라인 CSS와 `_ds/*/styles.css` 토큰 값을 읽어 대조했다.
- 캡처(이번 실행, `shots/`): catalog·detail·compare(빈/채움)·profile(빈/v1) × 1280·390, compare·profile 채움 × 768·320, catalog 하단 × 1280·390.
- 가로 넘침(scrollWidth−clientWidth): 4화면 × 4폭, 채운 비교·프로필 768·320 전부 0 (`logs/capture-metrics.json`, `logs/measure-tokens-widths.json`).
- 비교 트레이(고정)가 카탈로그 마지막 행 저장/비교 추가 버튼을 가리는지: 1280·390 모두 겹침 0.

## 요약 (결론 3줄)
1. **v2 토큰(색·폰트·반경)은 이미 연결돼 있다** — 실측 computed: 주 색 `#5a5fe8`, 글자 `#1a2620`, muted `#f0f3ee`, 선 `rgba(31,54,40,.2)`, 폰트 Pretendard (`logs/measure-tokens-widths.json`). 목업의 회색 바탕 `#ECEFEA`(`--bg-deep`)는 아트보드 캔버스라 앱 배경 기준이 아니다(목업 17행 body, 화면 카드는 `--card` 흰색). 그래서 "디자인 미적용" 체감의 원인은 색이 아니다.
2. **체감 차이의 실제 원인 = 밀도·타이포 스케일이 v1 그대로**: 본문 기본 16px(목업 13.5, SPEC 2.4 → 14), 메뉴 `text-body2` 15, Button lg 52px(목업 40), TextField 48px(목업 38), 체크박스 20px(목업 16), 카드 제목 17px(목업 15/600). 이게 화면을 "크고 성긴 v1"처럼 보이게 한다. 여기에 SPEC 미이행 몇 건(링크 `text-primary`, 패널 h2 크기, 태그 톤, 표 바깥 테두리)이 더해진다.
3. **즉시 구현 가능한 5묶음**(2절) 중 1~4는 engine·PageDoc·ui-2a04c와 파일이 겹치지 않는다. 5(프로필)는 ui-2a04c 병합 뒤. 편집기는 a1-α(새 파일)만 지금 병렬 가능(3절).

## 1. 목업 / 명세 / 현재 / 최소수정 / 대상파일 / 수용기준 대조표

판정: **미적용** = SPEC과 코드가 다름 · **공백** = SPEC에 규정 없음(목업만 있음) · **의도** = SPEC이 승인한 차이(바꾸려면 결정 변경) · **반영** = 이미 맞음.
근거 수준: 코드 줄은 서브에이전트 A 조사 후 메인이 핵심 줄을 다시 읽어 확인(L1: AppHeader:38, Button:31, TextField:17, ReferenceCard:103, ComparisonTable:113, CatalogHero:29, ProfilePage:191, CompareBoardPage:163, `text-primary` 링크 12곳). 나머지는 A 보고(L2).

### 1.1 전역 셸·DS 컨트롤 (모든 화면에 영향 — 우선순위 최상)
| 항목 | 목업 (dc.html 행) | 명세 | 현재 (`app/src/`) | 판정 | 최소수정 | 수용기준 |
|---|---|---|---|---|---|---|
| 본문 기본 크기 | body 13.5 (17) | v2 SPEC 2.4 "UI 기본 → 14" | `styles/tokens/base.css` body에 font-size 없음 → 16px (computed 16px) | 공백/미이행 | body `font-size: var(--font-size-body3)` | 클래스 없는 글자 14px |
| GNB 메뉴 | 13.5/500 (51) | 2.4 메뉴 `text-body3` | `components/layout/AppHeader.tsx:38` `text-body2` | **미적용** | `text-body3` | 메뉴 14px |
| Button lg | 40 (hint-size) | 규정 없음 | `components/ds/Button.tsx:31` `h-13 … text-body1` (52px) | 공백 | `h-10 … text-body3` | lg 40px, 터치 최소 24 유지 |
| TextField | 38, 13.5 | 2.3 Q4 경계 `line-strong`(반영) | `components/ds/TextField.tsx:17` `h-12` (48px) | 공백 | `h-10`, `text-body3` | 40px |
| Checkbox | 16 상자·13 글자 | 규정 없음 | `components/ds/Checkbox.tsx` `size-5`·`text-body2` | 공백 | `size-4`, `text-body3` | 상자 16, 행 높이 ≥24 |
| Chip | 28 | v2 SPEC B-4 "Chip.tsx는 바꾸지 않는다" | `components/ds/Chip.tsx` `h-9` | **의도** | 결정 변경 승인 시만 `h-8 text-caption1` | — |
| 헤더 52px·새 프로젝트 | 49~54 | 4.1·C-06 | `AppHeader.tsx` | 반영 | — | — |
| 링크 글자 색 | — | Q2 `--primary-text`(`#4147e5`, brand.css "필수 배경 최저 4.6") | `text-primary` 링크 12곳: `pages/ReferenceDetailPage.tsx:82`, `pages/PlaceholderPage.tsx:10`, `components/catalog/ReferenceCard.tsx:104`(hover), `pages/ProfilePage.tsx:28·164·175`, `components/profile/{ProfileList:20·36, ProfileValues:24, PaletteContrast:79}` | **미적용** (흰 면 4.95로 통과, muted 4.42·다크 3.81 미달) | 링크만 `text-primary-text`/`hover:text-primary-hover` 유지. 아이콘(`PickButton:61`, `ReferenceCard:83`) 제외 | 링크에 `text-primary` 0건 + 가드 테스트 |

### 1.2 2a-01 카탈로그 (`shots/catalog-1280.png`·`-390.png`·`catalog-bottom-*`)
| 항목 | 목업 | 명세 | 현재 | 판정 | 최소수정 | 수용기준 |
|---|---|---|---|---|---|---|
| 카드 제목 | t-cardtitle 15/600 (83) | 2.4 `ds-body2`+semibold, 2줄(C-03) | `components/catalog/ReferenceCard.tsx:103` `ds-heading2`(17) | **미적용** | `ds-body2 font-semibold` | 15px/600, `line-clamp-2` 유지 |
| 추천 받기 | outline md 38 (57) | 4.2 outline | `components/catalog/CatalogHero.tsx:29` `size="lg"` | 미적용(밀도) | `size="md"` | 검색창과 높이 같음 |
| 툴바 캡션 "필터 상태는 URL로 유지됩니다" | 없음 | 없음 | `CatalogToolbar.tsx:114` (`textWrap.test.tsx:29`가 고정) | 결정 필요 | 유지 권장(기능 안내) | — |
| 비교 필 글자 | "비교 3 / 6" (96) | C-05 "비교 N / 6" | `CompareTrayBar.tsx:91` "비교 보드 N / 6" (테스트 3곳 고정) | 미적용(문구) | 결정 후 문구·테스트 동시 | — |
| 카드 간격 | gap 24/20 | 4.2 "그리드 그대로" | `CatalogPage.tsx:123` `gap-4` | 의도 | — | — |
| 레일·칩 줄·빈 상태·트레이 | 59~72 | 4.2 | `FilterRail`·`CatalogToolbar`·`CompareTrayBar` | 반영 | — | 트레이가 마지막 행 버튼을 가리는 곳 0 (실측) |

### 1.3 2a-02 상세 (`shots/detail-*.png`)
| 항목 | 목업 | 명세 | 현재 | 판정 | 최소수정 | 수용기준 |
|---|---|---|---|---|---|---|
| 2단: muted 미리보기 + 380 패널 | 110~122 | 4.3 | `ReferenceDetailPage.tsx:123-140` | 반영 | — | — |
| 주요 행동 위치 | 패널 바닥 고정(`margin-top:auto`, 135) | 규정 없음 | `components/detail/DetailSidebar.tsx:74` 흐름 배치 | 공백 | 1280 이상에서 버튼 묶음 `mt-auto` + 패널 최소 높이 | 1280에서 버튼이 패널 바닥 |
| 가져오기 버튼 | lg 40 | — | `DetailSidebar.tsx:75` lg 52 | 공백 | 묶음 1에서 해결 | — |
| 태그 톤 | 중립 칩 (129) | C-11 비대화형 Tag | `ReferenceDetailPage.tsx:26,62` 파랑·주황 | 미적용(톤) | 중립, 앞 둘만 violet | 색 단독 의미 0 |
| 404 링크 | — | Q2 | `:82` `text-primary` | 미적용 | `text-primary-text` | — |

### 1.4 2a-03 비교 보드 (`shots/compare-filled-*.png`)
| 항목 | 목업 | 명세 | 현재 | 판정 | 최소수정 | 수용기준 |
|---|---|---|---|---|---|---|
| 표 바깥 테두리 | 없음, 행 윗선만 (160) | 4.4 흰 면 + line-neutral 선 | `components/compare/ComparisonTable.tsx:113` `rounded-lg border` | 미적용 | 바깥 테두리·반경 제거(포커스 링 유지) | 표 바깥 선 0 |
| 선택 셀 밀도 | 값 + 18px 원, 여백 9/14 (162~165) | 4.4 원 + "선택됨" 글자(의도) | `PickButton.tsx:50-58` 테두리 버튼 36px, 셀 `p-3` | 의도(글자) + 공백(밀도) | 버튼 테두리 제거·`h-8`, 셀 `py-2.5 px-3.5` | `aria-pressed`·접근 이름 유지 |
| 초안 패널 폭 | 300 + 왼쪽 선 (171) | 4.4 | `pages/CompareBoardPage.tsx:163` `xl:` 360 | 공백 | `--spacing(75)` | 1280 표 열 폭 증가 |
| 확정 버튼 | lg 40 | — | `DraftPanel.tsx:203` lg 52 | 공백 | 묶음 1 | — |
| h1 = 프로젝트 이름 · 모드 탭 | 151·152 | C-08·C-09, A-01 | "비교 보드" | 의도(프로젝트 개념은 a1) | — | — |
| 390 아코디언·하단 초안 바 | 2a-06 | 4.4 | 캡처 `compare-filled-390.png` | 반영 | — | 넘침 0 (768·320 실측) |

### 1.5 2a-04 프로필 (프로필 부분만, `shots/profile-filled-*.png`)
| 항목 | 목업 | 명세 | 현재 | 판정 | 최소수정 | 수용기준 |
|---|---|---|---|---|---|---|
| 2단 폭 | 340 + 나머지 (189) | 5.1 2단 | `pages/ProfilePage.tsx:191` `5fr/7fr` (왼쪽 ≈500) | 공백 | `xl:grid-cols-[--spacing(85)_minmax(0,1fr)]` | 왼쪽 340±20 |
| 패널 h2 | t-h2 18/700 (191) | 2.4 `ds-heading1` | `ds-heading2`: `ProfileValues:55`·`PaletteContrast:38`·`AdjustmentPanel:91`·`ProfilePage:203·233` | **미적용** | `ds-heading1` | — |
| 현재 버전 배지 | 보라 | M-04 글자 "현재" | 파랑 톤 (`ProfilePage:159`, `VersionList:35`, `ProfileValues:61`) | 미적용(톤) | `violet` | — |
| 3안 영역 | 카드 3 (202~222) | 2a-04c | "준비 중" 한 줄 (`ProfilePage:232-235`) | ui-2a04c 진행 중 | 손대지 않음 | — |
| 슬라이더 등 | 198·205·222 | M-02·M-03·M-10 | 라디오 | 의도 | — | — |

### 1.6 빈 상태 (`shots/compare-1280.png`, `profile-1280.png`)
- 비교 보드 빈 상태: 제목·설명·"카탈로그에서 고르기" 주 버튼 — 반영.
- 프로필 빈 상태: 설명 + "비교 보드로"·"카탈로그에서 고르기" — 반영. 단 헤더 "프로젝트"가 `/profile`에서 활성(`aria-current`, 실측) = ds-check A-01 **여전히 열림** → 편집기 a1(프로젝트 IA)에서 해결.

## 2. 구현 묶음 (최대 5, 제품 흐름 순)
공통 수용: `npm run build` exit 0 + check-bundle-size 통과(여유 /compare 0.41KB · /profile 0.61KB · /catalog 0.64KB — Button·AppHeader는 공통 청크라 클래스 문자열 증가도 계산), 표적 테스트(`tokenUsage.test.ts`, `AppHeader.test.tsx` 등 고정 단언은 같은 커밋에서 갱신 근거 기록), 1280·390 캡처 1회.

| # | 묶음 | 대상 파일 | 수용기준 | ui-2a04c·편집기 충돌 |
|---|---|---|---|---|
| 1 | **밀도·타이포 기반** (체감 효과 최대) | `styles/tokens/base.css` · `components/ds/{Button,TextField,Checkbox}.tsx` · `components/layout/AppHeader.tsx`(38행 클래스만) | 본문 14 · 메뉴 body3 · Button lg 40 · TextField 40 · 체크박스 16 · 대화형 최소 24 · Chip 불변 | 없음. 단 `AppHeader.tsx`는 a1-β도 수정 → **묶음 1을 a1-β보다 먼저 병합** |
| 2 | **카탈로그** | `components/catalog/{ReferenceCard,CatalogHero}.tsx` (+결정 시 `CompareTrayBar.tsx`) | 카드 제목 15/600·2줄 · 추천 받기 md · 링크 hover `primary-hover` 유지 | 없음 |
| 3 | **상세** | `pages/ReferenceDetailPage.tsx` · `components/detail/DetailSidebar.tsx` | 1280 버튼 패널 바닥 · 태그 중립/보라 · 404 링크 `text-primary-text` | 없음 |
| 4 | **비교 보드** | `components/compare/{ComparisonTable,PickButton}.tsx` · `pages/CompareBoardPage.tsx`(163행) | 표 바깥 선 0 · 선택 셀 ≤36 · 패널 300 · /compare 여유 ≥0.3KB | `features/compare/useCompareBoard.ts`·`data/memoryBoardConfirm.ts`는 **건드리지 않음**(a1-β·PARALLEL_LANES 규칙 2) |
| 5 | **프로필 + 링크 대비 가드** | `pages/ProfilePage.tsx` · `components/profile/{ProfileValues,PaletteContrast,AdjustmentPanel,VersionList,ProfileList}.tsx` · `test/`에 링크 `text-primary` 가드 | h2 `ds-heading1` · 왼쪽 340±20 · 현재 배지 보라 · 링크 `text-primary` 0건 | **ui-2a04c 병합 뒤**(같은 ProfilePage). `routes.tsx:29` "1a-05"→"2a-05"는 ui-2a04c 브리프 범위라 여기서 하지 않음. `PlaceholderPage.tsx:10`은 a1-β에서 삭제 예정이라 제외 |

- 묶음 1~4는 서로 파일이 겹치지 않아 **병렬 가능**(쓰기 worktree 격리). 단 공통 청크 번들 여유가 좁으므로 병합은 1 → 2 → 3 → 4 순으로 하고 병합마다 build 재실측.
- 결정 필요(막지 않음): Chip 28px(B-4 변경), 비교 필 문구 "비교 N / 6"(C-05 이행 vs 현행), 툴바 캡션 유지.

## 3. 편집기 2a-05a1~a4 병렬 파일지도 (서브에이전트 B 조사 + 메인 검증)

전제 (L1, 메인이 직접 확인):
- **PageDoc 계약·엔진 연산·게이트는 이미 main에 있다** (`app/src/engine/**`, L4a·L4b). 병렬을 막는 것은 계약 부재가 아니라 두 가지다.
  1. `app/src/engine/engineImportGuard.test.ts:32-40` — engine/ 밖 비테스트 파일이 engine을 import하면 실패(`import type`·동적 import 포함). 편집기 UI가 `PageDoc` 타입만 써도 걸린다. **가드 개정 소유자가 없다.**
  2. 렌더러(2a-04c 와이어프레임)가 아직 없다. `docs/04-plan/PARALLEL_LANES.md` 규칙 3 · 2a-05 SPEC 13.1: a2 이상은 SPEC + PageDoc 계약 + 렌더러 준비 전 시작하지 않는다.
- ui-2a04c 레인 스냅샷(`logs/ui-2a04c-diff.txt`, 1cb1fec): 현재 커밋 변경은 `domain/generation.ts`·`domain/profileDraft.ts`뿐. 브리프 선언 범위는 `ProfilePage` 3안 영역·`GenerationRepository`·공유 store factory·`routes.tsx:29` 자리표시 번호. **아래 충돌 판정은 선언 범위 기준(L2)** — 레인 시작 직전 `git diff --name-only main...k002bill2/ui-2a04c` 재확인 필수.

### 3.1 묶음별 판정

| 묶음 | SPEC | 선행 조건 | 지금 병렬? | 정확한 쓰기 경로 (`app/src/` 아래, 전부 새 파일) | 수용 기준 |
|---|---|---|---|---|---|
| (a) 프로젝트 IA·목록 **a1-α** | 2.1~2.5, 8.3, J-S01~S11 | 없음(엔진 import 안 함) | **가능** | `data/projectRepository.ts`(인터페이스·오류 코드만, 문서는 제네릭/`unknown`) · `domain/projectName.ts` · `features/projects/{projectListView,useProjectList,renameDraft}.ts` · `components/projects/{ProjectList,ProjectRow,RenameField}.tsx` · `pages/ProjectsPage.tsx` + 각 `*.test.ts(x)`(목 저장소 주입) | J-AC-02·03·08·10 (목 저장소, 라우트 미연결) |
| (a) **a1-β** 라우트·보드 확정 연결 | 2.2, 12.1·12.2, 12.4 | **ui-2a04c 병합 뒤** (PARALLEL_LANES 규칙 1·2, `routes.tsx:29` 같은 줄) | 불가(순차) | 수정: `app/routes.tsx` · `components/layout/{AppHeader,AppLayout}.tsx` · `data/studioStore.ts`·`data/memoryStudio.ts` · `app/AppProviders.tsx` · `features/compare/useCompareBoard.ts` · `data/memoryBoardConfirm.ts` · `engine/engineImportGuard.test.ts`(가드 개정) · `test/renderApp.tsx` | J-AC-01~10, E-AC-01·02, 번들 재실측 |
| (b) 집중모드 셸 부품 | 3.1, 4.1~4.3, E-S01~S04 | 없음 | **부분 가능** | `components/studio/StudioEmptyStates.tsx` · `features/studio/saveStatusText.ts` | E-AC-01·02 (부품 단위) |
| (d) 저장 실패·오프라인·경쟁 | 5.10, E-S06~S10, 8.3.1 | 스케줄러는 없음 / `saveDoc`·`STALE_DOC`는 가드·a2 | **부분 가능** | `features/studio/useAutosaveScheduler.ts`(2초 디바운스·최대 30초·저장 중 변경 합치기·online/offline·beforeunload, 문서 `T` 제네릭) + 테스트(가짜 타이머) | E-AC-07·09·12 |
| (c) 섹션 목록·캔버스·속성 **a2** | 3.1, 5.1·5.6·5.7 | a1-β + 가드 개정 + 2a-04c 와이어프레임 | 불가 | 예정: `pages/StudioPage.tsx` · `features/studio/{useStudioDoc,layout,selection}.ts` · `components/studio/{Toolbar,SectionList,Canvas,EditPanel,FieldCounter}.tsx` | E-AC-03~16 |
| (e) 섹션 연산 **a3** | 5.2~5.5·5.8·5.9, 8.2 | a2 + Q-19·addSection 5인자 반영 | 불가 | 예정: `features/studio/{ops,undoStack,imageStore}.ts` · `components/studio/{AddSectionDialog,VariantPicker,ThemeDialog,ImageSlot}.tsx` | E-AC-17~24·45~47 |
| (f) 게이트·스냅샷·내보내기 **a4** | 5.11~5.14, 8.3.2 | a3 + Q-19 | 불가 | 예정: `features/studio/{gateView,exportFlow,snapshots}.ts` · `components/studio/{GatePanel,ExportActions,SnapshotDialog,WarnConfirmDialog}.tsx` · `data/memoryProjectRepository.ts`(`requestExport`·스냅샷) | E-AC-25~32·43·44 |

- 모든 묶음 공통 금지: `engine/**`(L4 소유) · `pages/ProfilePage.tsx`·`features/profile/*`·`components/profile/*`·`domain/generation.ts`·`domain/profileDraft.ts`(ui-2a04c) · 위 a1-β 공통 파일(순서 전).
- 권장 순서: ① ui-2a04c 병합 ∥ a1-α·(b)·(d) 새 파일 → ② a1-β(번들 실측 → 가드 개정 → store → routes/AppHeader/AppLayout → 보드 확정 → 12.4 테스트) → ③ a2 → ④ a3 → ⑤ a4.

### 3.2 Q-17~24 (미승인 — 제안만, 영향 단계만 명시)
정의: `dev/active/l4-engine-b/REPORT.md` 12절. 메인이 직접 대조한 3건은 [L1].

| Q | 드리프트 | 영향 단계 | 제안 |
|---|---|---|---|
| **Q-17 DocStart 인자** [L1] | SPEC `2a-05/SPEC.md:506` `createDocFromCandidate(plan, profileVersion)` 2인자 ↔ 코드 `engine/doc/createDocFromCandidate.ts:52` 3인자 `(plan, profileVersion, start: DocStart{projectId, updatedAt})`, `CandidatePlan`에 `libraryVersion`·`generatorVersion` 필수(`:21-26`) | a2 `startDoc`, 2a-04c 편집 시작 경계. a1 무관 | 코드 모양을 채택해 SPEC 8.2 개정. `startDoc` 어댑터가 생성 잡 결과 → 엔진 `CandidatePlan` 변환, `updatedAt`은 저장소 `now` 주입 재사용 |
| Q-18 새 문서 모션 | SPEC 미기술 | a2·a4 | Q-17과 함께 결정 |
| **Q-19 theme.purpose** [L1] | SPEC `:268` 목적=`adjustments.purpose`(프로필 소유) ↔ 엔진 `contracts/pending.ts:9-13` `GateTheme.purpose`를 부르는 쪽이 넘김, `gate/runGate.ts:22`가 그 값만 읽음. `GateIssue.severity`는 코드에만 있음 | a3(`canRemove`·`swapVariant`)·a4(게이트) | severity 추가 승인. 목적은 **문서의 `profileVersion` 버전**의 `adjustments.purpose ?? "none"`에서만 파생하는 함수 1개를 연산·게이트가 공유 |
| Q-20·22·23 | R-03 계산식·모르는 변형 R-01·R-07 기준 | a4 | 현재 구현 유지 |
| **Q-21 fixture 변형 ↔ engine 변형** [L1] | `fixtures/referenceComparisons.ts`의 `grid-3` 7회(services 등) ↔ 엔진 `engine/sections/bodySections.ts:48-62` services는 `cards-3`/`list`만, `grid-3`는 portfolio에만. `about/split`·`portfolio/masonry`·`contact/map-form` 등은 엔진에 없음 → `createDocFromCandidate.ts:34-37` `UNKNOWN_VARIANT` | **2a-04c composer + a2 startDoc**. a1 무관 | 매핑 표(픽스처→엔진 변형)를 composer 또는 `startDoc` 어댑터 한 곳에만. ui-2a04c와 합의 필요 |
| Q-24 Tailwind가 engine 스캔 | 현재 발현 0 | 전 단계 빌드 | `@source not "./engine"`를 a1-β 가드 개정과 함께 |
| (목록 밖) addSection 5인자 | `engine/ops/sectionOps.ts:52-59` 5번째 인자 `{instanceId, motionPreset}` ↔ SPEC `:507` 4인자 | a3 (E-AC-18) | SPEC 8.2에 반영 |

- 이 드리프트들은 **화면 시각 적용(4절 묶음)을 막지 않는다** — 묶음 1~5는 engine·PageDoc을 건드리지 않는다.

## 4. 과거 지적(ds-check-01, 0c09cb9 기준)의 현재 상태 — 재등록하지 않음
- **해소**: A-07(2단 배치), A-08(전역 조정), A-09(보정값 쓰기), A-10(이름표 + 키 캡션) — `shots/profile-filled-1280.png`에서 확인. A-03~05(버전 비교 좁은 폭)는 A 보고상 `9754c7e`로 수정됨(L2) — 이번 실행에서는 v2 재확정 상태를 재현하지 않아 **재검증 안 함**.
- **여전히 열림**(L1): A-01 헤더 "프로젝트"·"새 프로젝트" → `/profile` (`AppHeader.tsx:53·58`, `/profile`에서 "프로젝트" `aria-current` 실측) → 편집기 a1-β. A-12 `routes.tsx:29` `screen="1a-05"` → ui-2a04c 브리프 범위. A-02·A-06은 L2(A 보고).
- 캡처 주의: full-page 캡처에서 고정 비교 트레이가 페이지 중간에 찍히는 것, 390 캡처 오른쪽 여백이 좁아 보이는 것은 캡처 방식 탓(스크롤바 15px 폭·고정 요소 합성)이며 결함으로 등록하지 않았다. 실제 겹침·넘침은 수치로 0.

## 5. 실행 기록
- 서브에이전트 실제 분담: **읽기전용 2개**(Explore). (A) v2 원본 ↔ 현재 시각 차이 → 1·2절의 코드 줄·목업 행. (B) 편집기 계약·파일 충돌 지도·Q-17~24 → 3절. 쓰기 서브에이전트 0, worktree 생성 0. ultracode·workflow 미사용(활성화 주장 없음).
- 메인이 직접 한 것: 브리프·SPEC 읽기, 4345 서버·캡처·토큰/폭/트레이 측정, `npm run build`, B의 Q-17·Q-19·Q-21 드리프트와 A의 핵심 코드 줄 재확인, ui-2a04c diff 스냅샷, 통합.
- B가 "ui-2a04c diff = 브리프 1파일"이라고 보고했으나 메인 재확인 시 1cb1fec 기준 5파일(`logs/ui-2a04c-diff.txt`) — 레인이 조사 중 진행된 것. 메인 값을 채택.
- 목업 렌더: React를 unpkg에서, Pretendard를 jsDelivr에서 받고 `_ds_bundle.js`가 262,144바이트에서 잘려 있어(A 보고, v2 SPEC 9행과 일치) **직접 렌더 불가**. 인라인 스타일·hint-size·`_ds/*/styles.css` 토큰 값으로 대조.
- 전체 test suite 미실행(브리프: Developer 전담). Codex 리뷰 미실행 — 산출물이 문서뿐이고 코드 diff가 없으며, 판정 근거는 캡처·측정 로그로 남김.
- 서버 종료 증거: `logs/server-shutdown.txt`.