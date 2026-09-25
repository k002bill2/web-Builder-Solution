# DS-A11Y-01 설계서 — 글자·상태 토큰 대비 정정

- 작성: Designer · 2026-09-26 KST · 브리프 `docs/06-handoff/DS-A11Y-01_DESIGNER_BRIEF.md`
- 대상 결함: QA-1A-03 `docs/qa/1a-03/REPORT.md` D-QA01~03(P2), D-QA04·06(P3)
- 판단 기준: ADR-003(기능 → 사용성·접근성 → DS 일관성 → 목업), WCAG 2.2 AA — 본문 4.5:1, 큰 글자(24px, 또는 18.66px bold) 3:1, 비텍스트(UI·아이콘) 3:1
- 범위 밖: 브랜드 색(`app/src/brand/`, `brand.css`), `--primary` 계열. 관련 발견은 12절 질문으로만 올린다
- 수치 재현: `python3 docs/design/a11y-01/contrast_calc.py` (이 문서의 모든 계산값은 이 스크립트 한 번 실행 출력에서 옮겼다)

## 0. 요약

| 항목 | 결정 |
|---|---|
| `--label-alternative` (라이트) | `rgba(55,56,60,0.61)` → **`rgba(55,56,60,0.76)`** · 필수 배경 10종 최저 3.30 → **4.77**, 흰 면 3.64 → **5.57** |
| `--label-alternative` (다크) | `rgba(174,176,182,0.61)` → **`rgba(194,196,200,0.80)`** · 다크 배경 16종 최저 2.86 → **4.61** |
| 상태 글자 | 값 조정이 아니라 **글자 전용 토큰 3개 추가**: `--status-negative-text` `#c90000`(최저 4.65), `--status-positive-text` `#007326`(4.65), `--status-cautionary-text` `#915300`(4.70). 기존 `--status-*`는 아이콘·테두리·면 전용 |
| `--label-assistive` | 사용처 8곳이 전부 정보 전달 글자(placeholder 포함) → **글자에 쓰지 않는다**. 8곳 모두 `--label-alternative`로 교체. **브리프 전제 정정**: placeholder도 1.4.3 대상(3절) |
| 역상 면 | 역상 전용 토큰 4개(`--inverse-fill-normal`·`-strong`, `--inverse-label-alternative`, `--inverse-label-disable`) + Button 역상 변형. 역상 면 안에서 밝은 면용 `label-*`·`fill-*` 금지(D-QA01 1.39 → **9.58**) |
| D-QA04 | 접근 이름 `이 레퍼런스로 전부 선택: <열 문자> <제목>` — 보이는 문구로 시작(WCAG 2.5.3) |
| D-QA06 | 상세 사이드바 알림 문장 "비교 보드에 담았습니다" + 형제 링크 "보드 열기" |
| 신규 발견 | ScoreTile 점수(24px bold) 초록 2.30·주황 2.09 — 큰 글자 3:1도 미달 → **D-A11Y-N1**(범위 포함). Tag accent 글자 3종 미달 → **D-A11Y-N2**(질문) |
| 수용 기준 | **A11Y-AC-01 ~ A11Y-AC-18 (18개)** |

근거 수준: 토큰 합성 계산 = **L2**(8비트 sRGB 알파 합성, 브라우저와 같은 방식). QA 실측 = **L1**. 현재 값 흰 면 대비가 QA 3.67 / 계산 3.64로 0.03 차이 — 캔버스 반올림 차이. 그래서 제안 값은 최악 배경에서도 4.5에 붙이지 않고 **0.1 이상 여유(4.6+)** 를 두었다.

## 1. 필수 배경 집합

토큰은 사용처 하나하나가 아니라 **"이 토큰이 놓일 수 있는 모든 면"** 에서 통과해야 한다. 새 화면이 추가돼도 다시 계산하지 않기 위해서다.

| 테마 | 배경 | 값 | 실제 사용 예 |
|---|---|---|---|
| 라이트 | `--background-normal` · `--surface-elevated` | `#ffffff` | 페이지, 카드, 초안 항목, 상세 사이드바 |
| 라이트 | `--background-alternative` · `--surface-sunken` | `#f7f7f8` | 비교 표 머리글·행 머리글, 아코디언 셀, 초안 패널, ScoreTile, 카탈로그 Hero |
| 라이트 | `--fill-normal` 합성 (흰 면 / `#f7f7f8`) | `#f4f4f5` / `#ececee` | SegmentedControl 비활성, 상세 섹션 칩, Chip |
| 라이트 | `--fill-strong` 합성 (흰 면 / `#f7f7f8`) | `#e8e9ea` / `#e1e2e4`(최악) | Avatar 머리글자, Tag neutral, 비활성 버튼 면 |
| 라이트 | `--status-*-bg` 4종 | `#eaf2fe` `#ffecec` `#fff3e0` `#ebffee` | Callout 본문, "선택됨" 버튼 |
| 다크 | `#1b1c1e` `#0f0f10` `#26282b` `#141416` + 각 면 위 `fill-normal`·`fill-strong` 합성 + `#26282b` 위 `--status-*-bg`(rgba) 합성 4종 | 16종 | 토큰 단위 테스트로만 검증(아래 주의) |
| 역상 | `--surface-inverse`(`#2c2c2c` / 다크 `#f7f7f8`), `-hover`, 역상 fill 합성 | 5종 / 4종 | 비교 트레이 바, 초안 요약 바, 열 문자 배지, 건너뛰기 링크 |

주의: `app/src`에 `data-theme="dark"`를 적용하는 코드가 없다(`grep -rn "data-theme" app/src` 0건, 제품 코드 기준). 다크 수용 기준은 **토큰 단위 테스트로만** 검증된다. 브라우저 검증 대상 아님.

## 2. 토큰 인벤토리

### 2.1 글자·상태 토큰 현재 값

| 토큰 | 라이트 | 다크 | 용도(주석) |
|---|---|---|---|
| `--label-normal` | `#171719` | `#f7f7f7` | 본문 |
| `--label-strong` | `#000000` | `#ffffff` | 최대 강조 |
| `--label-neutral` | `rgba(46,47,51,.88)` | `rgba(194,196,200,.88)` | 부드러운 본문 |
| `--label-alternative` | `rgba(55,56,60,.61)` | `rgba(174,176,182,.61)` | 보조·캡션 |
| `--label-assistive` | `rgba(55,56,60,.28)` | `rgba(174,176,182,.28)` | placeholder·힌트 |
| `--label-disable` | `rgba(55,56,60,.16)` | `rgba(152,155,162,.16)` | 비활성(1.4.3 예외) |
| `--on-color` · `--on-primary` | `#ffffff` | `#ffffff` | 색 면 위 글자 |
| `--on-surface-inverse` | `#ffffff` | `#1b1c1e` | 역상 면 위 글자 |
| `--status-negative` | `--red-50 #ff4242` | (라이트 상속) | 오류 |
| `--status-positive` | `--green-50 #00bf40` | (상속) | 성공 |
| `--status-cautionary` | `--orange-50 #ff9200` | (상속) | 주의 |
| `--status-informative` | `--primary` | `--primary` | 범위 밖 |

### 2.2 사용처 (비테스트 `.tsx`, 2026-09-26 `grep -rnE` 기준)

**`text-label-alternative` — 45줄 · 파일 20개 (아이콘 5줄: TextField·Select·ReferenceCard 저장·ColumnHeader 빼기·Accordion 펼침, 나머지 글자)**

| 화면 | 파일:줄 | 요소 | 배경 | 현재 대비(L2) |
|---|---|---|---|---|
| 공통 | `components/layout/AppHeader.tsx:32` | GNB 메뉴(비활성) | 흰 면 | 3.64 |
| 공통 | `components/layout/LoadingState.tsx:5` | 로딩 문구 | 흰 면 | 3.64 |
| 공통 | `components/layout/RouteErrorBoundary.tsx:38` | 오류 안내 | 흰 면 | 3.64 |
| 공통 | `components/ds/Avatar.tsx:21` | 머리글자 | fill-strong / 흰 면 | 3.38 |
| 공통 | `components/ds/Tabs.tsx:69` | 비활성 탭 | 흰 면 | 3.64 |
| 공통 | `components/ds/SegmentedControl.tsx:68` | 비활성 항목 | fill-normal 합성 | 3.43~3.53 |
| 공통 | `components/ds/TextField.tsx:23`, `Select.tsx:60` | 선행 아이콘·펼침 아이콘 | 흰 면 | 3.64 (비텍스트 3:1 통과) |
| 카탈로그 | `components/catalog/ReferenceCard.tsx:72,99` | 업종·메타 캡션 | 흰 카드 | 3.64 |
| 카탈로그 | `components/catalog/ReferenceCard.tsx:84` | 저장 아이콘(미저장) | 흰 카드 | 3.64 (아이콘) |
| 카탈로그 | `pages/CatalogPage.tsx:88,100,106` | URL 안내, 빈 결과 | 흰 면 | 3.64 |
| 상세 | `pages/ReferenceDetailPage.tsx:37,56,77,79` | 뒤로가기, 메타, 404 | 흰 면 | 3.64 |
| 상세 | `components/detail/DetailSidebar.tsx:20` | ScoreTile 라벨 | `#f7f7f8` | 3.57 |
| 상세 | `components/detail/DetailSidebar.tsx:78,95` | 알림 문구, 유사 그룹 제목 | 흰 면 | 3.64 |
| 상세 | `components/detail/DetailPanels.tsx:29,40,63,69,77,109` | 섹션 변형·라벨·표 머리글 | 흰 면 / 칩 | 3.53~3.64 |
| 비교 보드 | `components/compare/ColumnHeader.tsx:61` | 업종 (D-QA02) | `#f7f7f8` | 3.57 |
| 비교 보드 | `components/compare/ColumnHeader.tsx:54` | 빼기 × 아이콘 | `#f7f7f8` | 3.57 (아이콘 통과) |
| 비교 보드 | `components/compare/ComparisonTable.tsx:33,75` | "모두 같음", 흐린 셀 (D-QA02) | `#f7f7f8` / 흰 표 | 3.57~3.64 |
| 비교 보드 | `components/compare/ComparisonAccordion.tsx:41,49` | 요약·흐린 셀 (D-QA02) | 흰 면 / `#f7f7f8` | 3.57~3.64 |
| 비교 보드 | `components/compare/ComparisonAccordion.tsx:43` | 펼침 아이콘 | 흰 면 | 3.64 (아이콘) |
| 비교 보드 | `components/compare/DraftItem.tsx:38,42` | "기본값"(D-QA02), 미정 값 | 흰 초안 항목 | 3.64 (QA L1 3.67) |
| 비교 보드 | `components/compare/DraftPanel.tsx:144,186` | 패널 안내, 빈 안내 | `#f7f7f8` / 흰 면 | 3.57~3.64 |
| 비교 보드 | `pages/CompareBoardPage.tsx:25,28,83,123,149` | 저장 상태, 안내 | 흰 면 | 3.64 |
| 자리표시 | `pages/PlaceholderPage.tsx:7,9` | 시안 번호, 안내 | 흰 면 | 3.64 |

→ 한 토큰 값만 고치면 45줄 모두 해결된다. 사용처 코드는 바꾸지 않는다.

**`text-label-assistive` — 8곳** (3절에서 분류)

**`text-status-*` — 7곳**

| 파일:줄 | 요소 | 글자/아이콘 | 배경 | 현재 |
|---|---|---|---|---|
| `components/compare/CustomStyleFields.tsx:88` | 대표색 오류 문구 13px (D-QA03) | 글자 | `#f7f7f8`(초안 패널) | 3.21 |
| `pages/CompareBoardPage.tsx:36` | "저장하지 못했습니다" alert 13px | 글자 | 흰 면 | 3.43 |
| `components/detail/DetailSidebar.tsx:15` | ScoreTile 점수 24px bold (큰 글자) | 글자 | `#f7f7f8` | 초록 2.30 · 주황 2.09 · 빨강 3.21 |
| `pages/CompareBoardPage.tsx:29` | "저장됨" 체크 아이콘 | 아이콘(글자 "저장됨" 동반) | 흰 면 | 2.46 |
| `components/ds/Callout.tsx:8-10` | Callout 아이콘 | 아이콘(제목 글자 동반) | 각 tint | info 4.15 · negative 3.02 · warning 2.04 |

**역상 면(`bg-surface-inverse`) 위 자식** — 4절 표.

## 3. `--label-assistive` 점검 · 브리프 정정

**브리프 정정.** 브리프 과제 4는 "placeholder 자체는 WCAG 필수 아님"을 명시하라고 했으나 W3C 해설은 반대다.

> "This success criterion applies to text in the page, including placeholder text and text that is shown when a pointer is hovering over an object or when an object has keyboard focus."
> — Understanding SC 1.4.3 Contrast (Minimum), https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html

따라서 placeholder도 4.5:1 대상이다. 1.4.3의 예외는 비활성 UI·순수 장식·보이지 않는 글자·그림 일부·로고뿐이다.

| # | 파일:줄 | 문구 | 정보 전달? | 현재(L2) | 조치 |
|---|---|---|---|---|---|
| 1 | `components/ds/TextField.tsx:25` | placeholder(예: `#RRGGBB`) | 예 — 입력 형식 안내 | 1.68 | `placeholder:text-label-alternative` |
| 2 | `components/ds/Tabs.tsx:74` | 비활성 탭 개수 | 예 — 결과 수 | 1.68 | `text-label-alternative` |
| 3 | `components/catalog/ReferenceCard.tsx:112` | "점수 측정 <날짜> · 반응형 지원" | 예 | 1.68 | `text-label-alternative` |
| 4 | `components/detail/ReferencePreview.tsx:30` | 미리보기 캡션 | 예 | 1.68 | `text-label-alternative` |
| 5 | `components/detail/DetailSidebar.tsx:52` | "측정 <날짜> · <도구>" | 예 | 1.68 | `text-label-alternative` |
| 6 | `components/detail/DetailSidebar.tsx:97` | "추천할 레퍼런스가 없습니다" | 예 — 빈 상태 | 1.68 | `text-label-alternative` |
| 7 | `components/detail/DetailPanels.tsx:27` | 섹션 순번 "01" | 예 — 순서 | 1.68 | `text-label-alternative` |
| 8 | `components/detail/DetailPanels.tsx:126` | "이전 측정 기록이 없습니다." | 예 — 빈 상태 | 1.68 | `text-label-alternative` |

- 입력값(`label-normal` 17.90)과 placeholder(`label-alternative` 5.57)는 대비 차이 3배 이상으로 구분된다.
- `--label-assistive` 값은 **바꾸지 않는다**. 글자 용도로 쓰지 않는다는 규칙만 둔다(A11Y-AC-05, 가드 테스트). 토큰 삭제 여부는 질문 Q2.

## 4. 역상 면 규칙 (D-QA01 재발 방지)

### 4.1 원인
`--surface-inverse`는 다크 테마에서 밝은 면(`#f7f7f8`)으로 뒤집힌다. 그런데 `Button variant="assistive"`(`bg-fill-normal text-label-normal`)는 **밝은 면 전제**다. 어두운 바 안에 넣자 글자 `#171719`가 `#313232` 면 위에 놓여 1.39가 됐다.

### 4.2 규칙
1. `bg-surface-inverse` 면 **안의 모든 자식**은 `--on-surface-inverse` 계열과 `--inverse-*` 토큰만 쓴다. `label-*`, `fill-*`, `line-*`, `label-disable`(밝은 면용)은 금지.
2. 예외: `primary` 버튼(`bg-primary text-on-primary`, 4.68)은 어느 면에서나 쓴다.
3. 흐리게 할 때 `opacity-*` 대신 토큰을 쓴다. opacity는 아이콘·자식까지 흐려 대비 계산이 따로 필요해진다.
4. 역상 토큰은 `--on-surface-inverse` 기준 알파로 정의한다. **`[data-theme="dark"]` 블록에도 같은 이름으로 재선언**한다. 이유는 `colors.css` 160행 주석과 같다: `:root`에서 `var()`로 계산된 값은 하위 요소에 `data-theme`을 붙여도 다시 계산되지 않는다.

### 4.3 새 토큰 (`colors.css` "Inverse surface" 절에 추가)

| 토큰 | 라이트 | 다크 | 용도 |
|---|---|---|---|
| `--inverse-fill-normal` | `rgba(255,255,255,0.12)` | `rgba(27,28,30,0.12)` | 역상 면 위 보조 버튼·칩 면 |
| `--inverse-fill-strong` | `rgba(255,255,255,0.16)` | `rgba(27,28,30,0.16)` | 위 요소 hover |
| `--inverse-label-alternative` | `rgba(255,255,255,0.72)` | `rgba(27,28,30,0.72)` | 역상 면 보조 글자·아이콘 |
| `--inverse-label-disable` | `rgba(255,255,255,0.40)` | `rgba(27,28,30,0.40)` | 역상 면 비활성 글자(1.4.3 예외, 식별용) |

theme.css에 `--color-inverse-fill-normal` 등 4개를 연결한다.

### 4.4 대비 (L2)

| 전경 \ 배경 | 라이트 `#2c2c2c` | hover `#1e1e1e` | 흰 .12 합성 | 흰 .16 합성 | 최저 |
|---|---|---|---|---|---|
| `--on-surface-inverse` `#fff` | 13.96 | 16.67 | **9.58** | 8.32 | **8.32** |
| `--inverse-label-alternative` | 8.00 | 9.16 | 5.90 | 5.23 | **5.23** |
| `--inverse-label-disable` (예외) | 3.53 | 3.77 | 2.96 | 2.77 | 2.77 |
| (현재) `label-normal` `#171719` | 1.28 | 1.07 | 1.86 | 2.15 | 1.07 |

| 전경 \ 배경 | 다크 `#f7f7f8` | hover `#fff` | .12 합성 | .16 합성 | 최저 |
|---|---|---|---|---|---|
| `--on-surface-inverse` `#1b1c1e` | 15.92 | 17.05 | 12.56 | 11.51 | **11.51** |
| `--inverse-label-alternative` | 6.52 | 6.70 | 5.76 | 5.45 | **5.45** |

### 4.5 Button 역상 변형
`components/ds/Button.tsx`에 변형 `inverse`를 추가한다(이름은 Developer 재량, 의미만 고정):
`border-transparent bg-inverse-fill-normal text-on-surface-inverse enabled:hover:bg-inverse-fill-strong disabled:bg-inverse-fill-normal disabled:text-inverse-label-disable`
- aria-disabled 상태도 같은 쌍: `aria-disabled:bg-inverse-fill-normal aria-disabled:text-inverse-label-disable`

### 4.6 역상 면 자식 인벤토리

| 파일:줄 | 자식 | 현재 | 판정 | 조치 |
|---|---|---|---|---|
| `components/compare/DraftSummaryBar.tsx:34` | "초안 보기" | `assistive`(밝은 면용) | **1.39 미달 (D-QA01)** | `inverse` 변형 → 9.58 |
| `components/compare/DraftSummaryBar.tsx:44` | aria-disabled "프로필 확정" | `bg-fill-strong` + `label-disable`(밝은 면용) | 비활성 예외지만 어두운 바에서 거의 안 보임 | `aria-disabled:bg-inverse-fill-normal aria-disabled:text-inverse-label-disable` |
| `components/compare/DraftSummaryBar.tsx:30` | "초안 n/10" | 상속 `on-surface-inverse` | 13.96 통과 | 유지 |
| `components/catalog/CompareTrayBar.tsx:63` | 담긴 칩 | `bg-on-surface-inverse/10` | 글자 흰색 ≈10 통과 | `bg-inverse-fill-normal`로 교체(값 규칙 통일) |
| `components/catalog/CompareTrayBar.tsx:75,83` | 칩 빼기 아이콘, 안내 문구 | `opacity-70` | 7.67(칩 위 5.67) 통과 | 규칙 3: `text-inverse-label-alternative`로 교체(값 거의 같음) |
| `components/catalog/CompareTrayBar.tsx:56` | 개수 강조 | `text-blue-70`(원시 토큰 직접 사용) | 5.60 통과 | 관찰 — 시맨틱 층을 건너뜀. 질문 Q5 |
| `components/catalog/CompareTrayBar.tsx:87` | "비교 보드 열기" | `primary` | 글자 4.68 통과 | 유지(규칙 2) |
| `components/compare/ColumnHeader.tsx:39` | 열 문자 배지 | `bg-surface-inverse text-on-surface-inverse` | 13.96 통과 | 유지 |
| `components/layout/SkipLinks.tsx:9` | 본문 건너뛰기 | 같은 쌍 | 13.96 통과 | 유지 |


## 5. `--label-alternative` 새 값과 위계

### 5.1 제안
- 라이트 `rgba(55,56,60,0.76)` (흰 면 합성 `#67686b`, `#f7f7f8` 합성 `#656669`)
- 다크 `rgba(194,196,200,0.80)` — 다크 `--label-neutral`과 같은 베이스로 바꾼다. 기존 베이스(174,176,182)로는 alpha 0.92에서야 최저 4.51이 되어 0절의 여유 규칙(4.6+)에 못 미치고, 거의 불투명해져 알파 방식의 의미가 없어진다(스크립트 출력 "다크 기존 베이스 alpha .92").
- 알파 방식은 유지한다(DS 일관성: 모든 `label-*`가 "알파 over 중립 베이스").

### 5.2 배경별 대비 (L2, `contrast_calc.py`)

라이트:

| 전경 | 흰 | fill-n/흰 | fill-s/흰 | `#f7f7f8` | fill-n/`f7` | fill-s/`f7` | info-bg | neg-bg | caut-bg | pos-bg | 최저 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| normal | 17.90 | 16.28 | 14.72 | 16.72 | 15.17 | 13.81 | 15.88 | 15.73 | 16.32 | 17.11 | 13.81 |
| neutral | 9.14 | 8.45 | 7.87 | 8.66 | 7.99 | 7.50 | 8.35 | 8.24 | 8.46 | 8.81 | 7.50 |
| alternative 현재 .61 | 3.64 | 3.53 | 3.38 | 3.57 | 3.43 | 3.30 | 3.47 | 3.48 | 3.52 | 3.58 | 3.30 |
| **alternative 제안 .76** | **5.57** | 5.30 | 5.01 | **5.36** | 5.08 | **4.77** | 5.18 | 5.19 | 5.29 | 5.43 | **4.77** |
| assistive (글자 금지) | 1.68 | 1.67 | 1.65 | 1.66 | 1.64 | 1.63 | 1.65 | 1.65 | 1.66 | 1.67 | 1.63 |

다크 (표는 기본 12종. `#26282b` 위 status-bg 합성 4종은 스크립트 출력에 있고 최저값을 바꾸지 않는다 — alternative 4.68~5.18):

| 전경 | `1b1c1e` | fill-n | fill-s | `0f0f10` | fill-n | fill-s | `26282b` | fill-n | fill-s | `141416` | fill-n | fill-s | 최저 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| normal | 15.91 | 12.48 | 11.60 | 17.88 | 14.30 | 13.21 | 13.79 | 10.95 | 10.14 | 17.17 | 13.57 | 12.48 | 10.14 |
| neutral | 7.85 | 6.29 | 5.92 | 8.64 | 7.13 | 6.66 | 6.88 | 5.58 | 5.23 | 8.37 | 6.78 | 6.29 | 5.23 |
| alternative 현재 | 3.76 | 3.29 | 3.14 | 3.93 | 3.56 | 3.39 | 3.48 | 3.01 | 2.86 | 3.88 | 3.44 | 3.29 | 2.86 |
| **alternative 제안** | **6.68** | 5.48 | 5.15 | 7.30 | 6.13 | 5.75 | 5.99 | 4.92 | **4.61** | 7.10 | 5.89 | 5.48 | **4.61** |

### 5.3 위계 근거
- 모든 배경에서 **normal > neutral > alternative ≥ 4.5 > assistive** 순서가 유지된다(위 두 표, 같은 열 비교).
- 라이트 흰 면 사다리: 17.90 → 9.14 → 5.57. 단계 비율 1.96 · 1.64 — 목업의 3단 위계(본문·부드러운 본문·캡션)가 눈으로 구분된다. 캡션은 크기(12~13px)·굵기(500)로도 구분된다.
- 다크 `#1b1c1e` 사다리: 15.91 → 7.85 → 6.68. neutral/alternative 비율 1.18로 **라이트보다 약하다**. 다크는 현재 쓰이지 않으므로 이번에는 두고 질문 Q1로 올린다.
- 톤: 목업 캡션 회색(현재 값 흰 면 합성 `#858688`)보다 짙어진다(`#67686b`). 여전히 neutral(흰 면 합성 `#47484b`)보다 확실히 밝은 회색이다. ADR-003 2순위(접근성) > 4순위(목업) 적용. PROGRESS에 사유 기록.

## 6. 오류·상태 글자

### 6.1 결정: 값 조정이 아니라 글자 전용 토큰 분리
- `--status-negative` 등을 어둡게 바꾸면 Callout 면·아이콘·(향후) 테두리 색까지 모두 탁해진다. 아이콘·테두리는 3:1이면 충분하다.
- 글자는 4.5:1이 필요하다. **기준이 다른 두 용도를 한 토큰에 묶지 않는다.**

### 6.2 새 토큰
새 원시값은 같은 색상(hue)·채도에서 명도만 내렸다(HSL). 이름은 기존 램프에 맞춘다.

| 원시(신규) | 값 | 시맨틱(신규) | 라이트 | 다크 |
|---|---|---|---|---|
| `--red-30` | `#c90000` | `--status-negative-text` | `var(--red-30)` | `#ff8585` (신규 `--red-70`) |
| `--green-30` | `#007326` | `--status-positive-text` | `var(--green-30)` | `#00cc44` (신규 `--green-60`) |
| `--orange-30` | `#915300` | `--status-cautionary-text` | `var(--orange-30)` | `var(--orange-50)` `#ff9200` (이미 통과) |

theme.css에 `--color-status-negative-text` 등 3개 연결.

### 6.3 대비 (L2)

| 전경 | 흰 | fill-s/흰 | `#f7f7f8` | fill-s/`f7` | 자기 tint | 최저(라이트 10종) | 최저(다크 16종) |
|---|---|---|---|---|---|---|---|
| negative 현재 `#ff4242` | 3.43 | 2.82 | **3.21** | 2.65 | 3.02 | 2.65 | 3.16 |
| **negative-text** | 6.02 | 4.95 | **5.63** | 4.65 | 5.29 | **4.65** | **4.62** |
| positive 현재 `#00bf40` | 2.46 | 2.02 | 2.30 | 1.90 | 2.35 | 1.90 | 4.41 |
| **positive-text** | 6.03 | 4.96 | 5.63 | 4.65 | 5.76 | **4.65** | **5.03** |
| cautionary 현재 `#ff9200` | 2.24 | 1.84 | 2.09 | 1.73 | 2.04 | 1.73 | 4.84 |
| **cautionary-text** | 6.10 | 5.01 | 5.69 | 4.70 | 5.56 | **4.70** | **4.84** |

### 6.4 용도 규칙

| 용도 | 기준 | 토큰 |
|---|---|---|
| 글자(오류 문구·점수·상태 문장) | 4.5:1 (큰 글자도 같은 토큰 — 규칙 단순화) | `--status-*-text` |
| 상태를 **혼자** 알리는 아이콘·테두리(예: 입력칸 오류 테두리) | 3:1 | `--status-*-text` 권장(3:1 이상 보장). `--status-*`는 흰 면에서 2.24~3.43이라 단독 신호로 쓰지 않는다 |
| 글자와 함께 나오는 장식 아이콘(Callout 아이콘, "저장됨" 체크) | 1.4.11 필수 아님(정보는 글자가 전달) | `--status-*` 유지 가능 |
| 면 | — | `--status-*-bg` |

### 6.5 적용 위치
- D-QA03: `CustomStyleFields.tsx:88` → `text-status-negative-text` (3.21 → **5.63**)
- 같은 문제: `CompareBoardPage.tsx:36` 저장 실패 alert → `text-status-negative-text` (3.43 → **6.02**)
- **신규 D-A11Y-N1**: `DetailSidebar.tsx:15` ScoreTile 점수 → `text-status-{positive|cautionary|negative}-text` (`#f7f7f8` 위 2.30/2.09/3.21 → **5.63/5.69/5.63**). 24px bold 큰 글자 기준 3:1에도 초록·주황이 미달이었다. QA-1A-03은 비교 보드 대상이라 측정하지 않았다
- `TextField`에 `aria-invalid` 테두리가 생기면 `border-status-negative-text` (현재 테두리 오류 스타일은 없음 — 관찰)

## 7. D-QA04 — "이 레퍼런스로 전부 선택" 접근 이름

- 형식: **`이 레퍼런스로 전부 선택: <열 문자> <제목>`** — 예: "이 레퍼런스로 전부 선택: A 동네 치과 클리닉"
- 1열 변형: **`이 레퍼런스로 프로필 만들기: <열 문자> <제목>`**
- 보이는 글자는 그대로("이 레퍼런스로 전부 선택"). 구현은 `aria-label`로 전체 문자열을 준다.
- **브리프 예시와 다른 이유**: 브리프 예시 "<열 문자> <제목>의 요소로 전부 선택"은 보이는 글자 "이 레퍼런스로 전부 선택"을 포함하지 않는다. 음성 제어 사용자가 보이는 글자를 말해 누를 수 없게 되어 WCAG 2.5.3(Label in Name, A)을 깬다. 보이는 문구로 시작하고 문맥을 뒤에 붙인다.
- 옆 빼기 버튼("<제목> 비교에서 빼기")은 아이콘 버튼이라 보이는 글자가 없어 기존 형식 유지.
- 회수·삭제 열은 전부 선택 버튼이 없으므로 해당 없음.
- 선택 뒤 알림("기존 선택 1개를 B로 바꿨습니다")은 변경 없음.

## 8. D-QA06 — 상세 "비교 추가" 뒤 안내

기준: 1a-03 SPEC 1.1 "상세 사이드바의 안내 문구가 '비교 보드에 담았습니다 · 보드 열기' 링크를 보여준다".

| 상황 | 알림 영역(`role="status"`, `DetailSidebar.tsx:78`)의 문장 | 문장 옆 링크 | 포커스 |
|---|---|---|---|
| 추가 성공 | **"비교 보드에 담았습니다"** | **"보드 열기"** → `/compare` | "비교 중" 버튼에 그대로 |
| 가득 참(6/6) | 기존 `COMPARE_LIMIT_NOTICE` 그대로 | **"보드 열기"** (빼야 할 열을 보드에서 고르게) | 버튼에 그대로 |
| 비교에서 빼기 | "비교 보드에서 뺐습니다" (권장, 선택) | 없음 | 버튼에 그대로 |
| 상세 첫 진입 · 이미 담긴 상태로 진입 | 비움 | 없음 | — |

- **링크는 라이브 영역 밖 형제 요소**로 둔다. 라이브 영역 안에 링크를 넣으면 스크린리더가 "보드 열기"를 링크가 아닌 평문으로 읽고, 내용이 바뀔 때마다 링크 문구까지 다시 읽는다.
- 보이는 배치: 한 줄에 `문장 · 보드 열기`. 가운뎃점은 `aria-hidden="true"`. 좁은 폭에서는 줄바꿈 허용.
- 스타일: 문장 `ds-caption1 text-label-alternative`(새 값 5.57), 링크 `ds-caption1 text-primary underline`(흰 면 4.68, 범위 밖 토큰 그대로). React Router `Link`로 SPA 이동.
- 링크 표시 조건: 알림 문장이 있을 때만(성공·가득 참). 새로고침 뒤에는 비운다(상태 저장 없음).
- 알림 영역은 **비었을 때도 접근성 트리에 남긴다.** 지금 `DetailSidebar.tsx:78`의 `empty:hidden`(`display:none`)은 숨었던 라이브 영역이 나타나는 순간이라 스크린리더가 첫 알림을 놓치기 쉽다 → `empty:hidden` 제거, 빈 상태 여백이 문제면 시각 숨김(`sr-only`) 또는 높이 0으로 처리.

## 9. 회귀 방지 테스트 제안 (구현은 Developer)

### 9.1 `app/src/test/tokenContrast.test.ts` — 토큰 쌍 대비
- 입력: 기존 `test/cssTokens.ts`의 `loadTokens(dir, "light" | "dark")`. `var(--x)` 참조는 재귀 해석하는 작은 `resolveToken`을 추가(`--status-negative: var(--red-50)` 등).
- 합성: `rgba()`는 배경 위 8비트 sRGB 알파 합성 후 hex로 → 기존 `domain/contrast.ts`의 `contrastRatio` 재사용(계산 로직 중복 금지).
- 쌍 표(데이터 주도, 테스트 하나당 `it.each` 한 줄):

```ts
const NEUTRAL_SURFACES = ["--background-normal", "--background-alternative", "--surface-elevated", "--surface-sunken"];
const OVERLAYS = [null, "--fill-normal", "--fill-strong"]; // 면 위 합성
const PAIRS = [
  { fg: "--label-normal",       min: 4.5, on: "neutral" },
  { fg: "--label-neutral",      min: 4.5, on: "neutral" },
  { fg: "--label-alternative",  min: 4.5, on: "neutral+status-bg" },
  { fg: "--status-negative-text",    min: 4.5, on: "neutral+status-bg" },
  { fg: "--status-positive-text",    min: 4.5, on: "neutral+status-bg" },
  { fg: "--status-cautionary-text",  min: 4.5, on: "neutral+status-bg" },
  { fg: "--on-surface-inverse",        min: 4.5, on: "inverse" }, // inverse = surface-inverse(-hover) + inverse-fill-*
  { fg: "--inverse-label-alternative", min: 4.5, on: "inverse" },
  { fg: "--on-primary",                min: 4.5, on: ["--primary"] },
] as const;
```
- 위계 단언: 같은 배경에서 `ratio(normal) > ratio(neutral) > ratio(alternative)`.
- light·dark 두 테마 모두 실행.
- **Red-Green 확인**: 현재 `colors.css`로 돌리면 `--label-alternative`(3.30)·라이트 `status-*-text`(토큰 없음)·`inverse-*`(토큰 없음)가 실패해야 한다.

### 9.2 가드 테스트 (기존 `noHardcodedStyle.test.ts`와 같은 방식, `.tsx` 소스 스캔)
1. `text-label-assistive`·`placeholder:text-label-assistive` 0건.
2. `/text-status-(negative|positive|cautionary)(?![\w-])/`(접미사 `-text` 없음 — `\b`는 `-` 앞에서도 성립해 `-text`까지 잡으므로 쓰지 않는다)는 `<Icon` 이 있는 줄 또는 `icon:` 키 줄에만 허용.
3. 역상 면 컴포넌트 렌더 테스트: `DraftSummaryBar`의 "초안 보기"·aria-disabled "프로필 확정"이 역상 쌍 클래스(`bg-inverse-fill-*`, `text-on-surface-inverse`/`text-inverse-label-disable`)를 갖고 `text-label-normal`·`bg-fill-normal`을 갖지 않는다. 파일 단위 금지 규칙은 `ColumnHeader`(배지만 역상)에서 오탐이 나므로 쓰지 않는다.

### 9.3 컴포넌트 테스트
- `ColumnHeader`: 전부 선택 버튼 접근 이름 = `이 레퍼런스로 전부 선택: A <제목>` (6개 서로 다름), 1열 = `이 레퍼런스로 프로필 만들기: A <제목>`.
- `ReferenceDetailPage`: "비교 추가" → `role=status` 텍스트 "비교 보드에 담았습니다", `link {name: "보드 열기"}` href `/compare`, 링크가 status 요소 **밖**에 있음. 가득 참 → 한도 문구 + 링크. 빼기 → 링크 없음.

## 10. 영향 받는 화면

| 화면 | 바뀌는 것 |
|---|---|
| 공통 레이아웃 | GNB 비활성 메뉴, 로딩·오류 문구, Avatar, Tabs(비활성·개수), SegmentedControl 비활성, TextField placeholder — 모두 짙어짐 |
| 카탈로그 `/catalog` | 카드 업종·메타·측정일 캡션, 빈 결과 안내, URL 안내, 비교 트레이 바(칩 면·흐린 글자 토큰화) |
| 상세 `/references/:id` | 메타·뒤로가기·404, 사이드바 ScoreTile(라벨·점수 색), 측정 캡션, 유사 레퍼런스, 패널 캡션·표 머리글·섹션 순번, 미리보기 캡션, **비교 추가 안내 + 보드 열기 링크(신규)** |
| 비교 보드 `/compare` | 열 머리글 업종, "모두 같음", 흐린 셀, 아코디언 요약, "기본값"·미정 값, 패널 안내, 저장 상태, **대표색 오류 문구·저장 실패 alert 색**, **요약 바 "초안 보기"·비활성 "프로필 확정"**, **전부 선택 접근 이름** |
| 자리표시 | 시안 번호·안내 |

## 11. 수용 기준 (A11Y-AC)

| ID | 기준 | 검증 |
|---|---|---|
| A11Y-AC-01 | 라이트 `--label-alternative` = `rgba(55,56,60,0.76)`, 1절 라이트 배경 10종 모두 ≥ 4.5 (최저 4.77) | 9.1 단위 테스트 |
| A11Y-AC-02 | 다크 `--label-alternative` = `rgba(194,196,200,0.80)`, 다크 배경 16종 모두 ≥ 4.5 (최저 4.61) | 9.1 |
| A11Y-AC-03 | 두 테마 모든 필수 배경에서 normal > neutral > alternative, alternative ≥ 4.5 | 9.1 위계 단언 |
| A11Y-AC-04 | 3절 8곳이 `label-alternative`로 교체(placeholder 포함) | 9.2-1 가드 |
| A11Y-AC-05 | `.tsx`에서 `label-assistive`를 글자에 쓰지 않는다 | 9.2-1 가드 |
| A11Y-AC-06 | `--red-30`·`--green-30`·`--orange-30`(라이트), `--red-70`·`--green-60`(다크) 원시값과 `--status-{negative,positive,cautionary}-text` 3개 추가, theme.css 연결 | 9.1 |
| A11Y-AC-07 | `--status-*-text` 3개가 라이트 10종(최저 4.65)·다크 16종(최저 4.62) 모두 ≥ 4.5 | 9.1 |
| A11Y-AC-08 | D-QA03: 대표색 오류 문구가 `status-negative-text` — 초안 패널 `#f7f7f8` 위 ≥ 4.5 (계산 5.63) | 단위 + 브라우저 재측정 |
| A11Y-AC-09 | 저장 실패 alert가 `status-negative-text` (흰 면 6.02) | 9.2-2 가드 |
| A11Y-AC-10 | D-A11Y-N1: ScoreTile 점수 3구간이 `status-*-text` — `#f7f7f8` 위 ≥ 4.5 | 단위 + 브라우저 재측정 |
| A11Y-AC-11 | 접미사 없는 `text-status-*`는 아이콘에만 쓰인다 | 9.2-2 가드 |
| A11Y-AC-12 | `--inverse-fill-normal`·`-strong`·`--inverse-label-alternative`·`--inverse-label-disable`이 `:root`와 `[data-theme="dark"]` 두 곳에 선언되고 theme.css 연결. `on-surface-inverse`·`inverse-label-alternative`가 역상 배경 전부에서 ≥ 4.5 | 9.1 |
| A11Y-AC-13 | Button 역상 변형 추가. D-QA01: "초안 보기" 글자 대비 ≥ 4.5 (계산 9.58) | 9.2-3 + 브라우저 재측정(768·390) |
| A11Y-AC-14 | 요약 바 aria-disabled "프로필 확정"이 역상 비활성 쌍을 쓴다(밝은 면용 `fill-strong`/`label-disable` 없음) | 9.2-3 |
| A11Y-AC-15 | 트레이 바의 `opacity-70` 글자·아이콘과 `bg-on-surface-inverse/10` 칩이 역상 토큰으로 교체, 대비 ≥ 4.5 유지 | 코드 확인 + 9.1 |
| A11Y-AC-16 | D-QA04: 전부 선택 버튼 접근 이름이 `이 레퍼런스로 전부 선택: <열 문자> <제목>`(1열: `이 레퍼런스로 프로필 만들기: …`)이고 보드 안에서 서로 다르다 | 9.3 |
| A11Y-AC-17 | D-QA06: 상세 "비교 추가" 성공 시 status "비교 보드에 담았습니다" + status 밖 형제 링크 "보드 열기"(`/compare`), 가득 참에도 링크, 포커스는 버튼 유지. 알림 영역은 비었을 때도 `display:none`이 아니다 | 9.3 + 브라우저 |
| A11Y-AC-18 | `tokenContrast.test.ts`가 현재 `colors.css`에서 RED(실패)를 먼저 보이고 새 값으로 GREEN. 검증 4종(typecheck·lint·test·build) 통과 | Red-Green 로그 |

## 12. 설계 질문

| # | 질문 | Designer 권고 |
|---|---|---|
| Q1 | 다크 위계: neutral 7.85 / alternative 6.68(비율 1.18)로 라이트(1.64)보다 약하다. 다크 `--label-neutral`을 `rgba(194,196,200,0.96)`(9.06)로 올릴까? | 다크 적용 시점까지 보류. 지금은 다크를 쓰는 화면이 없다 |
| Q2 | `--label-assistive`는 글자 사용처 0이 된다. 토큰을 지울까, 두고 가드만 둘까? | 두고 가드만(목업 DS 이름 체계 유지, 향후 비텍스트 장식 용도) |
| Q3 | 브리프 전제 정정(placeholder도 4.5:1) 수용 여부 | 수용. W3C 해설 원문 3절 |
| Q4 | **범위 밖 발견(brand)**: `--focus-ring` 합성색이 흰 면 1.47, 역상 바 1.30. 포커스 표시는 1.4.11(3:1) 대상. 역상 면에서 `primary` 버튼 면 대 바 2.98(버튼은 글자로 식별되므로 필수 아님). 브랜드 작업으로 넘길까? | 별도 브랜드·포커스 작업으로 분리 |
| Q5 | **신규 D-A11Y-N2 (범위 밖 토큰 `--accent-*`)**: Tag 글자(12~13px)가 tint 위에서 red 4.02 · green 3.71 · orange 2.95로 4.5 미달(blue 4.90·violet 5.64·neutral 7.87 통과). 비교 보드 열 머리글 라이선스 Tag·"사용 불가" red Tag, 카탈로그 카드에서 쓴다. 이번 A11Y-01에 넣을까? | 같은 원인·같은 방식이라 **A11Y-01에 넣는 것을 권고**하되 승인 필요. 넣으면 accent 글자 3개를 6절과 같은 방식(-30 원시값)으로 정한다 |
| Q6 | 트레이 개수 강조 `text-blue-70`이 원시 토큰을 직접 쓴다(대비 5.60 통과). 시맨틱 토큰으로 바꿀까? | 통과이므로 이번엔 관찰만 |
| Q7 | D-QA06 "비교 보드에서 뺐습니다" 알림(빼기 시)을 넣을까? | 넣기(A-4 알림 패턴과 일관). 선택 사항 |

## 13. 결정 기록 (브리프·목업과 다르게 한 부분)
- placeholder 1.4.3 적용 — 브리프 전제 정정(3절, W3C 원문)
- D-QA04 이름 형식 — 브리프 예시 대신 보이는 문구로 시작(WCAG 2.5.3)
- `--label-alternative`가 목업보다 짙어짐 — ADR-003 2순위(접근성) 우선
- 상태 글자 토큰 분리 — 값 조정 대신 용도 분리(아이콘·면 톤 유지)
