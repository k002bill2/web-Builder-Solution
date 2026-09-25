# V2-2a PROGRESS — 앱 셸 · 카탈로그 칩 줄·정렬·탭 · 필터 레일 r2

브리프: `docs/06-handoff/V2-2a_DEVELOPER_BRIEF.md` · 브랜치 `k002bill2/v2-2a-shell-catalog` (분기점 `fbc6803`, 로컬 커밋만)
설계: `docs/design/v2/SPEC.md` 개정 r2 (4.1 · 4.2 · 4.5 · 5 · 6.2 · 6.3, Q5·Q6·Q8 결정)
기준선(분기점 fresh 실행): 테스트 **431 passed (38 파일)** · 번들 공통 89.47 · `/catalog` 98.56 / 100.94 · `/references/:id` 96.19 / 98.57 · `/compare` 99.19 / 121.55 · 자리표시 89.93 / 92.31 (KB gzip, 첫 화면 / 진입 직후)

## 단계 현황
| # | 묶음 | 상태 |
|---|---|---|
| 1 | 셸 — 52px 헤더 · 모바일 주 메뉴 줄 · 아바타 톤 | 완료 |
| 2 | 칩 줄 · 정렬 · 탭 삭제 · 1280 상한 | 대기 |
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
