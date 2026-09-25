# V2-2a PROGRESS — 앱 셸 · 카탈로그 칩 줄·정렬·탭 · 필터 레일 r2

브리프: `docs/06-handoff/V2-2a_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/v2-2a-shell-catalog` (분기점 `fbc6803`, 로컬 커밋만)
설계: `docs/design/v2/SPEC.md` 개정 r2 (4.1 · 4.2 · 4.5 · 5 · 6.2 · 6.3, Q5·Q6·Q8 결정)
기준선(분기점 fresh 실행): 테스트 **431 passed (38 파일)** · 번들 공통 89.47 · `/catalog` 98.56 / 100.94 · `/references/:id` 96.19 / 98.57 · `/compare` 99.19 / 121.55 · 자리표시 89.93 / 92.31 (KB gzip, 첫 화면 / 진입 직후)

## 단계 현황
| # | 묶음 | 상태 |
|---|---|---|
| 1 | 셸 — 52px 헤더 · 모바일 주 메뉴 줄 · 아바타 톤 | 완료 |
| 2 | 칩 줄 · 정렬 · 탭 삭제 · 1280 상한 | 완료 |
| 3 | 레일 — 개수 · 초기화 · N · <1024 접힘 | 대기 |

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
