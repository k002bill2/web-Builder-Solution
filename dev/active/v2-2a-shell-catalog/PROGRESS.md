# V2-2a PROGRESS — 앱 셸 · 카탈로그 칩 줄·정렬·탭 · 필터 레일 r2

브리프: `docs/06-handoff/V2-2a_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/v2-2a-shell-catalog` (분기점 `fbc6803`, 로컬 커밋만)
설계: `docs/design/v2/SPEC.md` 개정 r2 (4.1 · 4.2 · 4.5 · 5 · 6.2 · 6.3, Q5·Q6·Q8 결정)
기준선(분기점 fresh 실행): 테스트 **431 passed (38 파일)** · 번들 공통 89.47 · `/catalog` 98.56 / 100.94 · `/references/:id` 96.19 / 98.57 · `/compare` 99.19 / 121.55 · 자리표시 89.93 / 92.31 (KB gzip, 첫 화면 / 진입 직후)

## 단계 현황
| # | 묶음 | 상태 |
|---|---|---|
| 1 | 셸 — 52px 헤더 · 모바일 주 메뉴 줄 · 아바타 톤 | 완료 |
| 2 | 칩 줄 · 정렬 · 탭 삭제 · 1280 상한 | 완료 |
| 3 | 레일 — 개수 · 초기화 · N · <1024 접힘 | 완료 |

## 1. 셸 (V2-AC-15 · 16)

### RED
- 새 `components/layout/AppHeader.test.tsx`(7건) → **2 failed | 5 passed**: `h-15`(52px 아님), 주 메뉴 `hidden`(<768 메뉴 없음). 구성·조직 공유 없음 5라우트는 이미 통과(기존 셸이 이미 모든 라우트 동일).
- 테스트 선택자 수정 1건: `/compare` 본문에 `<header>`가 있어 banner가 2개 → "문서 첫 banner"로 좁힘(구현 문제 아님).

### GREEN
- `AppHeader`: `h-15` → 첫 줄 `h-13`(md 이상 헤더 `md:h-13`, 모바일은 브랜드 링크 `h-13`이 첫 줄 높이), `flex-wrap`. 주 메뉴는 **한 벌**, <768 `order-last w-full overflow-x-auto whitespace-nowrap` → 헤더 아래 한 줄 가로 스크롤, md 이상 `md:order-none md:flex-1`로 기존 자리.
- `Avatar`: `bg-fill-strong`·`label-alternative` → muted 면(`bg-background-alternative`) + `text-label-neutral`(SPEC 4.1).
- 결과: 32 passed (`components/layout` + `CatalogPage.test`).

### 번들
- 공통 `index` 86.14 → **86.19KB (+0.05)**, 모든 라우트 +0.04~0.05. `/compare` 99.23(여유 0.77). 상쇄는 묶음 2에서(탭 삭제로 안 쓰이게 되는 `brand.tagline` 문자열이 공통 청크에 있음).

### 목업과 다른 곳
- **C-02**: 목업 2a-06은 모바일 메뉴가 없음 → 헤더 아래 주 메뉴 한 줄(Q5).
- **C-06**: 화면마다 헤더 오른쪽이 다름 → 모든 화면 "새 프로젝트" + 아바타(기존 구현이 이미 동일, 유지).
- 모바일(<768)에서 주 메뉴는 DOM상 브랜드 다음이지만 화면상 둘째 줄(첫 줄 = 브랜드·새 프로젝트·아바타). 메뉴를 두 벌 두지 않기 위한 선택 — 키보드 순서 브랜드 → 메뉴 → 새 프로젝트(남은 위험으로 REPORT에 기록).

## 2. 칩 줄 · 정렬 · 탭 삭제 · 1280 상한 (V2-AC-20 · 21, 26r2 일부)

### RED
- `CatalogPage.test.tsx`: 6.3 V2-2a 행 2건 개정(정렬 `combobox` → `radio "최신순"`, 저장함 `tab` 클릭 → GNB "보관함" 링크 + h1 "보관함" + "저장한 레퍼런스 1개" + `aria-current`) + 새 describe "카탈로그 상단 v2" 6건(탭 없음·기본 h1/부제, `?tab=rec` h1·안내·"전체 보기"(tab만 지움), 추천 받기, 정렬 radiogroup 한 벌·복원, DOM 순서 칩 → 정렬 → 레일 → 결과 + `--layout-max-width` 상한, 칩 줄 `overflow-x-auto lg:flex-wrap` + 그리드 클래스 불변).
- `keyboardA11y.test.tsx`(6.3 V2-2 행): 카탈로그 `tablist "카탈로그 보기"` 테스트 → 정렬 radiogroup roving 테스트로 대체. 결과로 건너뛰기 뒤 "다음 Tab = 결과 탭" 단언 → "첫 카드 안"(원인 동일: 탭 삭제). 상세 tablist 테스트는 그대로(V2-3).
- 실행 → **10 failed | 26 passed (36)**.

### GREEN
- `CatalogHero` → 제목 행(h1 = 보기 이름 · 부제 · 검색 · 추천 받기). 회색 면(`bg-background-alternative`) 삭제 → 흰 단일 표면. 업종 칩은 새 `CatalogToolbar`로 이동.
- 새 `components/catalog/CatalogToolbar.tsx`: 업종 칩 줄(`overflow-x-auto`, `lg:flex-wrap`, 포커스 링이 잘리지 않게 `-m-1 p-1`) + 정렬 `SegmentedControl` radiogroup "정렬"(한 벌) + 아래 `line-neutral` 선.
- `CatalogPage`: `Tabs`·`Select` import 삭제(`Tabs.tsx` 파일은 상세가 써서 유지 — V2-3). h1: 기본 "레퍼런스 카탈로그" + "internal · licensed 레퍼런스 N개" / saved "보관함" + "저장한 레퍼런스 N개" / rec "추천" + 기존 안내 + "전체 보기"(`tab`만 지운 URL). 부제는 첫 응답 뒤에만(0개 깜빡임 방지). 본문 전체(제목 행 + 칩 줄 + 레일 + 결과)를 `mx-auto max-w-(--layout-max-width)`로 감쌈. 카드 그리드 클래스 불변.
- 중간 실패 1건(6.3 밖): `styles/textWrap.test.tsx`가 결과 머리 줄의 캡션 "필터 상태는 URL로 유지됩니다"를 찾음 → 테스트는 두고 캡션을 칩 줄 정렬 왼쪽에 유지(`hidden sm:inline` 그대로). 내 구현 실수(캡션 삭제).
- `brand.tagline`은 h1에서 빠졌지만 ADR-002가 브랜드 설정 항목으로 명시해 **삭제하지 않음**(공통 청크 상쇄 후보에서 제외).
- 결과: typecheck 0 · lint 0 · **444 passed (39 파일)**.

### 번들 (묶음 1 대비)
| 라우트 | 묶음 1 후 | 묶음 2 후 |
|---|---|---|
| 공통 | 89.52 | 89.51 |
| `/catalog` | 98.60 / 100.99 | **97.71** / 100.09 |
| `/references/:id` | 96.23 / 98.62 | 96.03 / 98.41 |
| `/compare` | 99.23 / 121.60 | 99.22 / 121.65 |
| 자리표시 | 89.97 / 92.36 | 89.97 / 92.35 |
- `/catalog` −0.89: `Tabs`(카탈로그·상세 공유 청크에서 빠짐)·`Select` 제거. `/compare` 진입 직후 +0.05는 `Select`가 `boardEngine` 쪽 공유 청크로 재배치된 결과(첫 화면 아님).

### 목업과 다른 곳
- **C-02**: 탭 없음 → GNB "보관함" + h1 보기 이름("보관함"·"추천"), "전체 보기" 링크.
- **C-13**: 2a-06 모바일 정렬 없음·칩 `overflow:hidden` → <1024에서도 정렬 한 벌(칩 줄 2행), 칩 가로 스크롤.
- 캡션 "필터 상태는 URL로 유지됩니다"는 목업에 없지만 기존 기능 문구·테스트 대상이라 정렬 옆에 유지.

## 3. 레일 — 개수 · "초기화 · N" · <1024 접힘 (V2-AC-17r2 · 19r2 · 41 · 42 · 43)

### RED
- 새 `features/catalog/facetCounts.test.ts`(8건, 모듈 없음으로 실패) + `CatalogPage.test.tsx` 새 describe "필터 레일 r2" 7건 + 6.3 V2-2a 행 초기화 테스트 단언 변경(`industry=beauty&audience=b2b` 초기화 후 `""` → `?industry=beauty` + 헤어살롱 1장, Q8).
- 실행 → **7 failed | 27 passed** + facetCounts 파일 해석 실패. AC-17r2 테스트(모든 옵션 선택·URL 복원·레일 한 벌)는 기존 레일이 이미 한 벌이라 처음부터 통과 — 회귀 방지용으로 둠.
- AC-41 판별 단언: `concept=minimal,warm`에서 "대담한" = **1**(콘셉트를 뺀 결과 중 대담한 = 헤어살롱). "현재 결과 중"으로 세면 0.

### GREEN
- 새 `features/catalog/facetCounts.ts`(순수): `facetValues`(업종·audience·visualTags·layoutType·purpose·licenseStatus·`colorFamilyOf(primary)`·devices), `selectedFacets`(모션 제외), `withoutFacet`(입력 불변), `countFacets(current, excluded, scope)` + `industryTotal`.
- 새 `features/catalog/useFacetCounts.ts`: 선택 있는 그룹마다 `repository.list(그 그룹을 뺀 조건)` 1회(`Promise.all`), 선택 없으면 추가 조회 0, 응답 전 이전 값 유지, 취소 플래그, 실패는 `useThrowToBoundary`. 보관함이면 저장 id로 한정.
- `catalogSearchParams.ts`: `railSelectionCount`(체크 수 + 모션 1, 업종 제외) · `clearRailFilters`(업종만 남김, Q8). "초기화 · N"과 "필터 N"이 같은 함수를 씀.
- `Checkbox`: 선택형 `count` — 보이는 숫자 `aria-hidden`(`ds-caption2 text-label-alternative tabular-nums`, 라벨 오른쪽 끝), 설명은 `<label>` **밖**의 `hidden` span "N개" + `aria-describedby`(이름은 옵션명 그대로 — 기존 테스트 이름 불변). 0개도 비활성화하지 않음.
- 업종 칩: `Chip.tsx` 무변경, 개수는 children(`aria-hidden`) + 칩 밖 `hidden` 설명. 선택된 칩의 숫자는 글자색 상속(primary 면 위 `label-alternative` 대비 미달 회피).
- `FilterRail`: `id`·`open`·`counts`·`selectionCount` prop. 접힘은 `hidden lg:flex` 클래스만(한 벌). 초기화 = `Button assistive sm`, 보이는 글자 "초기화 · N" / "초기화" + `disabled`, 이름 "필터 초기화"(aria-label 유지) + 설명 "선택 N개".
- `CatalogToolbar`: 맨 앞 "필터 N" `Button outline sm lg:hidden`(아이콘 없음, B-3), 이름 "필터" + 설명 "선택 N개" + `aria-expanded` + `aria-controls`(레일 id). 펼침 상태는 `useState`(URL 아님), 선택해도 닫지 않음.
- 빈 결과: 레일 선택 0 + 업종 선택이면 둘째 줄 "업종을 '전체'로 바꿔 보세요."
- 결과: typecheck 0 · lint 0 · **459 passed (40 파일)** · build 0(예산 통과).

### 번들 (V2-AC-38 · 43)
| 라우트 | 기준 `fbc6803` | 묶음 2 후 | 묶음 3 후(최종) |
|---|---|---|---|
| 공통 | 89.47 | 89.51 | 89.51 |
| `/catalog` | 98.56 / 100.94 | 97.71 / 100.09 | **98.53 / 100.91** |
| `/references/:id` | 96.19 / 98.57 | 96.03 / 98.41 | 96.03 / 98.41 |
| `/compare` | 99.19 / 121.55 | 99.22 / 121.65 | **99.23 / 121.65** |
| 자리표시 | 89.93 / 92.31 | 89.97 / 92.35 | 89.97 / 92.35 |
- AC-43(L1, 묶음 2 커밋을 임시 worktree에서 빌드해 같은 조건 비교): 공통 `index` raw 272,807 → 272,815(+8), gzip 86,180 → 86,185(**+5바이트**), export 수 28 → 29(`colorFamilyOf` 교차 청크 바인딩 1개). `industryTotal`(facet 코드)은 `CatalogPage-*.js`에만. `CatalogPage` 청크 gzip 5,630 → 6,451(+0.82KB). `referenceRepository.ts`·`Chip.tsx` 무변경(`git diff --stat` 0).

### 목업과 다른 곳
- **C-01r2**: 목업 레일 = 체크박스 5그룹 + 모션 → 색상·디바이스를 모션 다음 체크박스 그룹으로 유지, 업종은 칩 줄.
- 레일 폭 232px(`--spacing(58)`) 유지(목업 220 — px는 기준 아님, SPEC 4.2).
- "필터 N" 버튼 아이콘 없음(목업 `filter` 아이콘 — 아이콘 파일 추가 0, B-3).
