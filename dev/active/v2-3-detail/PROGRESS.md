# V2-3 PROGRESS — 상세 `/references/:id` v2 (2a-02)

- 브리프: `docs/06-handoff/V2-3_DEVELOPER_BRIEF.md` · 설계: `docs/design/v2/SPEC.md` 4.3, 4.5 C-07·C-11, 5 B-3·B-4, 6.2 V2-AC-27~31·38·39, 6.3
- 브랜치 `k002bill2/v2-3-detail` · 분기점 `8981da3` · 로컬 커밋만

## 기준선 (`8981da3`, fresh)
- test: 41 files · **478 passed** (`logs/baseline-test.log`)
- 번들(gzip KB, 첫 화면 / 진입 직후): 공통 89.58 · `/catalog` 99.07 / 101.45 · `/references/:id` 96.10 / 98.49 · `/compare` 99.30 / 121.73 · 자리표시 90.04 / 92.42
- 청크(gzip KB): `index` 86.26 · `CatalogPage` 6.96 · `ReferenceDetailPage` 4.42 · `useThrowToBoundary`(카탈로그+상세 공유) 0.16
- `SegmentedControl`은 `CatalogPage` 청크에만 있었다(`radiogroup` 문자열 index 0회·CatalogPage 1회). `rovingFocus`는 `referenceDisplay` 공유 청크(카탈로그·상세·비교).

## 착수 전 확인
- `Tabs` 사용처: `pages/ReferenceDetailPage.tsx` 하나(grep). `Tabs.tsx` 전용 테스트 파일은 없다 — "그 테스트"는 `keyboardA11y`의 "상세 탭 tablist (A02)"와 `ReferenceDetailPage.test`의 tablist 단언(둘 다 6.3 행).
- 6.3 밖 상세 경로 테스트(`routeScroll`·`trayBoard`·`AppHeader`·`RouteErrorBoundary`)는 region "유사 레퍼런스"·버튼 "비교 추가"·h1만 쓴다 → 이름을 유지하면 무수정.
- "비교 중" 버튼은 V2-1에서 이미 `outline` + `check`(SPEC 4.3이 적은 `assistive`는 과거 상태).

## RED (`logs/red.txt`)
- 새·수정 테스트 41건 중 **22 failed / 19 passed**.
  - 실패: Tabs 가드 2, 정보 패널(V2-AC-27) 2, 점수 3칸 1, 태그 1(정보 패널 region이 없어서 — 태그 자체는 기준선에서도 `span`), DOM 순서 1, 아래 영역 1, 미리보기 폭·view URL·`tab=mobile` 호환 10, 유사 이동 후 데스크톱 1, D-QA06 3(가득 참 링크·성공 알림·보드 열기 이동), 키보드 radiogroup 1. `previewView.test.ts`는 모듈이 없어 파일 단위 실패.
  - **기준선에서 이미 통과(특성화)**: "'비교 중'도 outline 유지 + check + 글자" — V2-1이 이미 outline으로 바꿨다. 억지 RED를 만들지 않고 회귀 가드로 둔다.

## GREEN (`d0912c4`)
- 삭제: `components/ds/Tabs.tsx`, `features/detail/detailTabs.ts`
- 추가: `features/detail/previewView.ts`(`parsePreviewView`: 유효 `view` → `tab=mobile`이면 mobile → desktop / `toPreviewViewParams`: desktop 생략, 옛 `tab` 버림) + 단위 테스트 4, `test/tabsRemoved.test.ts`(파일 부재·`/Tabs` import 0·`role="tab*"` 0)
- `ReferenceDetailPage.tsx`: 2단 `lg:grid-cols-[minmax(0,1fr)_--spacing(95)]`(380px) — 왼쪽 muted 패널(뒤로 + "미리보기 폭" radiogroup sm → 미리보기 → 모바일이면 "모바일 구조"), 오른쪽 `section "레퍼런스 정보"`(h1·메타 → 점수 3칸 → 태그 → 섹션 구성 → 토큰 요약 → 액션·알림), 아래 전폭(유사 레퍼런스 → 점수 이력). 폭 변경은 `replace: true`.
- `ReferencePreview`: 무대 16:9(`lg` 4:3) 안에 폭별 프레임(데스크톱 전폭·태블릿 3:4·모바일 9:16, 카드 3·2·1열, 모바일은 햄버거 + 하단 CTA 띠). 접근 이름 "<제목> 미리보기 · <폭> (자체 렌더 와이어프레임)".
- `DetailPanels`: `SectionsList`(순번 `text-label-alternative`), `TokenSummary`(견본 4칸 = role primary·surface·ink·bg, hex 목록, 한 줄 "Pretendard 700/400 · 스케일 1.25 · 8pt · 섹션 간격 96px · 페이드 200ms · 본문 대비 7.2:1"), `MobileStructure`, `ScoreHistory`
- `DetailSidebar`: `ScoreTiles`(접근성·성능 `status-*-text` + 모션, `ds-title2 font-bold`), `DetailActions`(알림 종류 `template|added|limit|removed`, `role=status` 항상 렌더·`empty:hidden` 제거, "보드 열기" 형제 링크는 added·limit에만, `text-primary-text underline`), `SimilarReferences`(md 3그룹 가로)
- fresh: test **499 passed**(43 files, +21) · typecheck 0 · lint 0 · build 0

## 번들 (`logs/green1-build.log`)
- 공통 89.58 → **89.58**(`index` 86.26 → 86.25, 변화 없음) · `/compare` 99.30 → **99.30** / 121.73
- `/references/:id` 96.10 → **96.74** / 98.49 → 99.13
- `/catalog` 99.07 → **99.41** / 101.45 → 101.80 (**+0.34**) — 카탈로그 코드는 무수정. 상세가 `SegmentedControl`을 import하자 빌드가 이 모듈을 `CatalogPage` 청크(6.96 → 6.66)에서 카탈로그+상세 공유 청크 `useThrowToBoundary`(0.16 → 0.80)로 옮겼다. 파일이 나뉘며 gzip 사전을 따로 쓰는 손실이 +0.34. 공통 청크는 그대로라 브리프의 "공통 청크를 늘리지 않는다"는 지킴. `/catalog` 여유 0.93 → 0.59.
- 상쇄하지 않은 이유: 상쇄하려면 카탈로그 코드를 바꾸거나(금지), 상세에 radiogroup을 복제해야 한다(DS 일관성·DRY 위반, 상세 청크 +α). 예산 안이라 기록으로 남긴다.

## 브라우저 실측 (ego-browser, 127.0.0.1:4317 `vite preview`, 12:22 KST 종료 · `lsof` exit 1)
- `logs/browser-r1.txt` — 4폭 × 4 URL(`""`·`?view=tablet`·`?view=mobile`·`?tab=mobile`) 16조합 전부 가로 넘침 0
  - 1280·1024: 2단(정보 패널 x=885 / 629, 폭 380), 768·390: 한 열
  - h1 하단: 1280·1024 110 · 768 606(모바일 684) / 900 · **390 444(모바일 560) / 844** → 모든 조합 첫 화면 안
  - 미리보기 프레임(desktop/tablet/mobile): 1280 829×622 / 466×622 / 350×622 · 390 343×193 / 145×193 / 109×193(16:9 무대)
  - `?tab=mobile` → "모바일" 선택 + 모바일 구조(URL은 누르기 전까지 그대로)
- 키보드(1280): 선택된 radio 포커스 → → 태블릿(`?view=tablet`) → → 모바일(모바일 구조 표시) → Home 데스크톱(`""`). 포커스 링 `:focus-visible` true, 2중 링(흰 2px + 링 4px)
- D-QA06: "비교 추가" 클릭 → status "비교 보드에 담았습니다", 링크 "보드 열기" `/compare`, 포커스 "비교 중, 비교에서 빼기" 유지, 버튼 outline 클래스 유지
- 캡처: `screens/detail-1280.png`·`detail-1024-tablet.png`·`detail-768.png`·`detail-390-mobile.png`·`detail-1280-compare-added.png`

## 목업 차이 (ADR-003)
- **C-07** 탭·유사 레퍼런스·점수 이력·모바일 구조 없음 → 미리보기 폭 전환 + 아래 전폭 영역(유사 3그룹·점수 이력) + 모바일 구조 설명
- **C-11** 태그 FilterChip → 비대화형 `Tag`(콘셉트 tint, 목적·모션 outline)
- **C-12** 점수 22px 800 → `ds-title2` 700
- 새 사유: 목업의 "반응형" 칩은 데이터 필드가 아니라 넣지 않고 기존 "모션 낮음" 태그 유지 · 브레드크럼 링크(ghost 버튼 모양 대신 기존 링크, nav "브레드크럼" 계약) · 토큰 한 줄에 "섹션 간격 96px · 페이드 200ms" 추가(SPEC 4.3 "간격·모션 값은 한 줄에 합친다") · hex 목록 줄 추가(SPEC) · 알림 + "보드 열기" 줄(D-QA06) · 목업 SegTabs 영문 라벨 → 데스크톱·태블릿·모바일(SPEC)
