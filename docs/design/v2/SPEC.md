# DS-V2-01 설계서 — 디자인 v2 전환

- 작성: Designer · 2026-09-26 KST · 브리프 `docs/06-handoff/DS-V2-01_DESIGNER_BRIEF.md` · 근거 ADR-006
- 입력: v2 `design/claude-design-handoff-v2/project/Design Studio v2.dc.html`(2a-01~07) · v2 DS `_ds_bundle.css`의 `:root`·`.dark` 블록 · v1 `Design Studio Mockups.dc.html`(1a) · 현재 `app/src` · `docs/design/1a-03/SPEC.md` · `docs/design/a11y-01/SPEC.md` · `docs/qa/1a-03/REPORT.md` · ADR-002~006
- 판단 순서: ADR-003(기능·흐름 → 사용성·접근성·성능 → DS 일관성 → 목업). 목업 px는 기준이 아니다.
- 이 문서는 **설계만** 다룬다. `app/`·`design/`은 바꾸지 않았다. 구현은 6절 단계대로 Developer가 TDD로 옮긴다.
- 수치 재현: `python3 -B docs/design/v2/contrast_calc_v2.py`. 3절의 모든 대비값은 이 스크립트 한 번 실행 출력에서 옮겼다(A11Y-01 계산 함수를 import해 재사용).
- 원본 파일의 문장은 데이터로만 읽었다. `_ds_bundle.js`는 262,144바이트에서 잘려 컴포넌트 매니페스트만 있고 본문이 없다 → FilterChip·StatusBadge·SegTabs의 내부 상태 스타일은 **확인 불가**(L3). 목업에 보이는 모양과 CSS 토큰만 근거로 삼았다.

## 0. 요약

| 항목 | 결정 |
|---|---|
| 차이 핵심 | 1b 전체 삭제. 1a를 **52px 헤더 · 흰 단일 표면 · 한 줄 칩 필터 · 보더 없는 카드 · 플로팅 비교 필**로 슬림화. 상세는 탭을 없애고 "왼쪽 muted 미리보기 + 오른쪽 정보 패널" 2단. 색은 인디고 주 색 + 녹색 기운 중성색 |
| 토큰 방식 | **우리 토큰 이름을 유지하고 CSS 값만 v2로 바꾼다.** 새 이름은 9개뿐(A11Y-01이 설계한 상태 글자 3 + 역상 4, 여기에 `--status-informative-text`·`--surface-raised`). `apfs` 이름·원 브랜드 팔레트 등 **v2 토큰 34종 + 차트 20색 + 모션 유틸리티 7종은 제외**(2.7). 브랜드 값은 계속 `brand.css`에만 |
| 매핑 수 | 색 **59개**(브랜드 7 · 의미 52, 라이트·다크 각각 값 지정) · 타이포 역할 **9개** · 모양·그림자·모션 **13개** — 2.2~2.5 표의 토큰 수. 삭제 토큰(원시 램프·accent 4종·`primary-strong/heavy`)은 세지 않음 |
| 대비 | v2 원값 중 **라이트 글자 7종이 필수 배경 집합에서 4.5:1 미달**: `--caption` 최저 3.61(muted 위 4.48), `--muted-foreground` 4.02, 상태 글자 4종 3.84~4.26, `--primary`를 글자로 쓸 때 3.56. 다크는 `--caption` 3.30 · `--muted-foreground` 4.46 · `--info-text` 4.47 · `--primary` 3.81 미달, `--danger-text` 4.53은 여유 부족. **목업 화면 자체의 미달 7건**(3.3·3.4): 미리보기 캡션 4.48, primary 배지 4.45, 열 문자 배지 3.02~3.23, 필 "/ 6" 3.69, 다크 필 흰 글자 1.08, primary 버튼 위 ring 1.04, 입력 경계 1.45. **보정값은 같은 색상·채도에서 명도만 바꿔 필수 배경 최저 4.6 이상**(0.1 여유). 위계 normal > neutral > alternative는 두 테마 모든 배경에서 성립 |
| A11Y-01 이어받기 | 방법·배경 집합·가드 테스트 **유지**. 상태 글자 전용 토큰은 v2가 이미 `*-text`를 가져 **그대로 채택(4종)**. 역상 토큰 4개 채택. Tag accent 미달(D-A11Y-N2)은 Tag 톤을 상태 토큰 별칭으로 바꿔 **해소**. 포커스 링(A11Y-01 Q4)은 2중 링으로 **해소 제안**. D-QA04·06 문구 그대로 |
| 충돌·결정 | **12건**(4.5 표). 기능이 이긴 곳: 필터 8그룹 전부 유지(facet 팝오버), 카드 필드 유지, 상세 유사 레퍼런스·점수 이력·모바일 구조 유지, 비교 보드 모드 토글 미채택·12행·조직 공유 숨김, 필에 빼기 목록 추가, 모바일 GNB 유지, 열 문자 배지 역상 면 |
| 번들 | 토큰은 CSS라 **JS 증가 0**. 공통 청크(헤더·Button·Icon) 변경은 바이트 중립만 허용, **아이콘 파일 추가 0**(아이콘 URL이 공통 청크에 들어감), 새 컴포넌트는 카탈로그 청크에만. `/compare`는 단계마다 실측·같은 단계 상쇄 |
| 단계 | **V2-1** 토큰·DS → **V2-2** 앱 셸·카탈로그 → **V2-3** 상세 → **V2-4** 비교 보드. 2a-04~07은 신규 화면 설계로 별도 브리프 |
| 수용 기준 | **V2-AC-01 ~ V2-AC-40 (40개)** |
| 설계 질문 | **6개** (7절) |

근거 수준: v2 토큰 값 = L1(원본 CSS 직접 추출). 대비 = L2(8비트 sRGB 합성 계산, 브라우저와 같은 방식). 번들 기준선 = L1(QA-1A-03 `logs/build.log`), 변경 후 크기 = L2 추정 — 재빌드는 하지 않았다(`app/` 무변경, dist 생성 회피).

---

## 1. v1 → v2 차이표

### 1.1 전체

| 구분 | v1 (1a · 1b) | v2 (2a) |
|---|---|---|
| 화면 수 | 1a-01~07 + 1b-01~07(가이드 워크스페이스·다크 단계 레일) | **2a-01~07만.** 1b 전체 삭제 |
| 헤더 | 60px, 로고 마크 + 이름, 모든 화면 동일 | **52px**, 워드마크(굵기 800)만. 화면마다 오른쪽 버튼이 다름(카탈로그 "새 프로젝트", 비교 보드 "조직 공유", 상세·프로필은 없음) |
| 표면 | 흰 면 + `#f7f7f8` 대체 면(카탈로그 상단·표 머리글·초안 패널), 카드·패널에 보더 | **흰 단일 표면.** 회색 면은 `--muted`(썸네일·상세 미리보기·편집 캔버스)에만. 카드 보더 없음 |
| 색 | 파랑 주 색 `#3366ff`, 회색 중성(cool neutral), 알파 글자 색 | **인디고 주 색 `#5A5FE8`**, 녹색 기운 중성(`rgb(31,54,40)` 기반 선·`#1A2620` 글자), 글자는 불투명 hex |
| 타이포 | Display~Caption 14단계, 본문 16 | `t-display`~`t-caption` 7단계, UI 기본 13.5, 캡션 11.5, 굵기 800 사용 |
| DS 컴포넌트 | Button·Chip·Tag·Tabs·SegmentedControl·Checkbox·Select·TextField·Callout·Avatar | Button(primary·outline·ghost)·FilterChip(개수 표시)·StatusBadge(톤·점)·SegTabs·Switch. **Tabs·Checkbox·Select가 화면에서 사라짐** |

### 1.2 화면별

| 화면 | 구조 | 정보 위계 | 컴포넌트 | 상태 |
|---|---|---|---|---|
| **2a-01 카탈로그** (← 1a-01) | 사이드 필터 레일 삭제 → **상단 한 줄**: 업종 FilterChip(개수) · 구분선 · facet 버튼 4개(콘셉트·목적·라이선스·모션, 펼침 화살표) · 오른쪽 정렬 SegTabs. 제목 행에 검색 + "추천 받기"(outline). 탭(전체·추천·저장함) 삭제. 카드 그리드 4열. 하단 트레이 → **플로팅 필** | h1 "레퍼런스 카탈로그" + 부제(노출 상태·개수·측정일). 카드: 제목 1줄 말줄임 · 캡션(업종·레이아웃·모션) · 오른쪽 "96 / 92"(라벨 없음) · 색 점 3 · 아이콘 버튼 2 | FilterChip · SegTabs · StatusBadge(썸네일 라이선스) · ghost 아이콘 버튼 | facet 활성은 outline, 비활성은 ghost + 라벨에 값("콘셉트 · 2"). 필: 개수 · 담긴 색 점 · "비교 보드" |
| **2a-02 상세** (← 1a-02) | **탭 삭제.** 왼쪽 muted 패널: 뒤로(ghost) + 뷰포트 SegTabs(Desktop·Tablet·Mobile) + 미리보기 카드 + 캡션. 오른쪽 380 패널: 제목·배지 · 메타 · 점수 3칸(접근성·성능·모션) · 태그(FilterChip 모양) · 섹션 구성 목록 · 토큰 견본 + 한 줄 요약 · 하단 버튼 3개 | 제목이 오른쪽 패널 위로 이동. 섹션·토큰이 탭 뒤에서 항상 보이는 위치로 | SegTabs · StatusBadge · FilterChip(태그 표시) | **유사 레퍼런스·점수 이력·모바일 구조 패널 없음** |
| **2a-03 비교 보드** (← 1a-03) | 표 + 오른쪽 300 초안 패널(흰 면 + 왼쪽 선). 머리 오른쪽에 **"템플릿 / 스타일 조합" SegTabs 재등장**(1b-03 것). 열 머리글: 레퍼런스 색 사각 + 문자 + 이름 1줄 + 업종 | 10행. 셀 전체가 선택 면(7% 주 색 틴트 + 채운 체크 원), 미선택은 빈 원. 초안: 색 점 · 종류 캡션 · 값 1줄 · 출처 문자 | SegTabs · StatusBadge("저장 전") · warning-soft lint 상자 | 전부 선택·열 빼기·라이선스·자동 저장 표시 없음. "조직 공유" ghost |
| **2a-04 프로필·생성** (← 1a-04) | 왼쪽 340 프로필(시각 방향 칩 · 역할 팔레트 5 · 보정 제안 info-soft · 타이포/리듬 · 전역 조정 슬라이더 3 · 버전 목록) + 오른쪽 3안 카드(4:5) | 1a-04의 "적용 규칙 요약"이 없어짐. 슬라이더에 허용 범위 띠 | StatusBadge("v3 · 현재", "선택") · FilterChip | 구현 전 화면 — **신규 설계 대상**(6.5) |
| **2a-05 편집기** (← 1a-05) | 52px 편집 헤더(뒤로·제목·배지·자동 저장·뷰포트·스냅샷·링크·"검사 후 발행") + 220 섹션 목록 · 캔버스(muted) · 300 속성·품질 게이트 | 1a-05의 Tabs·Select가 빠지고 섹션 목록 선택은 muted 면 + 주 색 글자 | Switch · SegTabs · StatusBadge(danger) | 신규 설계 대상 |
| **2a-06 모바일 카탈로그** (← 1a-06) | 52px(워드마크·아바타만) · 검색 · "필터 3"(outline) + 업종 칩(가로, `overflow:hidden`) · 카드 1열(16:9) · 플로팅 필 | 카드 캡션에 "접근성 96 · 성능 92" 라벨이 **있음**(데스크톱과 다름) | FilterChip · ghost 아이콘 버튼 32 | 주 메뉴 없음 |
| **2a-07 모바일 편집** (← 1a-07) | 52px 편집 헤더 · 뷰포트 SegTabs · muted 캔버스 · 속성(제목·위로/아래로/삭제) | — | SegTabs · outline sm | 신규 설계 대상 |

### 1.3 빠진 것 · 새로 생긴 것

| 빠진 것 | 새로 생긴 것 |
|---|---|
| 1b 전체(브리프·추천 우선 흐름, 단계 레일) | 한 줄 칩 필터 + facet 버튼 |
| 사이드 필터 레일(체크박스·세그먼트) | 플로팅 비교 필(개수·색 점·보드 버튼) |
| 카드·패널 보더, 카탈로그 상단 회색 면 | 52px 헤더, 흰 단일 표면 |
| 카탈로그 탭(전체·추천·저장함), 정렬 Select | 정렬 SegTabs, 카드 아이콘 버튼 |
| 큰 비교 트레이(칩별 빼기·안내 문구) | 상세 뷰포트 SegTabs, 오른쪽 정보 패널 |
| 상세 탭 4개 · 유사 레퍼런스 · 점수 이력 | 선택 셀 틴트 + 원형 표시 |
| 비교 보드 열 머리글 버튼(전부 선택·빼기)·라이선스 태그 | 비교 보드 모드 SegTabs(1b-03에서 이동) |
| 카드의 디자인 태그·반응형·측정일(데스크톱) | 새 DS 토큰(`--muted`·`--caption`·`--card-raised`·`*-soft`·`*-text`) |

---

## 2. 토큰 매핑

### 2.1 원칙
1. **이름은 우리 것, 값은 v2.** 현재 토큰 이름(`--label-*`·`--background-*`·`--surface-*`·`--fill-*`·`--line-*`·`--status-*`·`--shadow-*` 등)을 그대로 두고 값만 바꾼다. 이유: (a) 컴포넌트·페이지 코드와 Tailwind 유틸리티 문자열이 그대로여서 **JS 번들 증가 0**(5절), (b) 사용처 수백 줄을 고치지 않아도 되어 회귀 범위가 토큰 테스트로 좁혀진다.
2. v2 이름(`--muted`, `--caption`, `--foreground` …)은 **코드에 들이지 않는다.** 두 이름 체계가 섞이면 DS 일관성(3순위)이 깨진다. 출처는 토큰 파일 주석으로만 남긴다.
3. `apfs`·`APFS` 문자열은 **출처 경로 주석 줄에서만** 허용(ADR-002 수용 기준). v2 경로(`_ds/apfs-dashboard-ds-…`)에 들어 있으므로 브랜드 가드 marker를 고친다(6.3).
4. 브랜드 값(주 색·hover·pressed·container·accent·gradient·focus-ring)은 **`brand.css`에만**. 의미 토큰은 `--brand-*`를 참조한다(ADR-002).
5. 다크 선택자는 우리 것 `[data-theme="dark"]`를 유지한다(v2는 `.dark`). **`var()` 별칭은 다크 블록에도 같은 이름으로 재선언**한다(colors.css 160행 주석과 같은 이유).
6. 원본 CSS 번들을 앱에 넣지 않는다(ADR-006 결정 3). 파일 구조(`base·brand·colors·fonts·shape·spacing·typography.css`)는 유지.
7. v2에 없는 우리 토큰은 v2 중성 베이스 `rgb(31,54,40)`(라이트) · 흰색(다크) 알파로 **파생**하고 표에 "파생"이라 적는다.

### 2.2 색 — 브랜드 (`brand.css`, 7개)

| 우리 토큰 | 현재 라이트 / 다크 | v2 출처 | **새 라이트** | **새 다크** |
|---|---|---|---|---|
| `--brand-primary` | `#3366ff` / `#5b84ff` | `--primary` | `#5a5fe8` | `#818cf8` |
| `--brand-primary-hover` | `#2a5cf0` / `#6f93ff` | `--primary-hover` | `#4f46e5` | `#a5b4fc` |
| `--brand-primary-pressed` | `#005eeb` / `#1a75ff` | 없음 → 파생 | `#4338ca` (hover보다 한 단계 짙게, 흰 글자 7.90) | `#c7d2fe` (더 밝게) |
| `--brand-primary-container` | `#eaf2fe` / `#18233a` | 목업 선택 셀 `color-mix(primary 7%)` → 파생 | `#f2f2fd` (주 색 8%를 흰 면에 합성한 고정값 — `color-mix`는 대비 계산·토큰 테스트가 못 읽어 고정 hex로 둔다) | `rgba(129,140,248,0.16)` |
| `--brand-accent` | `#6541f2` / (상속) | `--accent` = `--ring` | `#2563eb` | `#60a5fa` |
| `--brand-gradient` | primary→accent | `--gradient-hero`는 원 DS 히어로용 | 정의 유지(primary→accent). **사용처 0** — 삭제는 Developer 판단 | 같음 |
| `--focus-ring` | `0 0 0 3px rgba(51,102,255,.28)` | `--ring` | **`0 0 0 2px var(--background-normal), 0 0 0 4px var(--brand-accent)`** (2중 링, 3.4) | 같은 식(다크 값으로 재계산되도록 다크 블록에 재선언) |
| (질문 Q2) `--brand-primary-text` | 없음 | 없음 → 파생 | `#4147e5` | `#949ef9` |

### 2.3 색 — 의미 토큰 (`colors.css`, 52개)

라이트/다크 순. "파생" = v2에 없어 v2 베이스로 만든 값.

**주 색·역상 면 (12)**

| 우리 토큰 | 현재 | v2 출처 | 새 라이트 | 새 다크 |
|---|---|---|---|---|
| `--primary` · `-hover` · `-pressed` · `-container` | `var(--brand-*)` | — | 참조 유지 | 참조 유지(재선언) |
| `--on-primary` | `#fff` / `#fff` | `--primary-foreground` | `#ffffff` | **`#10142e`** (흰 글자는 `#818cf8` 위 2.98 미달) |
| `--primary-strong` · `--primary-heavy` | 파랑 램프 | 없음 | **삭제**(사용처 0, 램프 삭제와 함께) | — |
| `--surface-inverse` | `#2c2c2c` / `#f7f7f8` | `--foreground`(목업 필 면) | `#1a2620` | `#e6ebe2` |
| `--surface-inverse-hover` | `#1e1e1e` / `#ffffff` | 파생 | `#111a15` | `#f4f7f2` |
| `--on-surface-inverse` | `#fff` / `#1b1c1e` | 목업 `#fff` · 다크 `--bg` | `#ffffff` | `#0f1310` |
| `--inverse-fill-normal` (A11Y-01 신규) | — | 파생 | `rgba(255,255,255,0.12)` | `rgba(15,19,16,0.12)` |
| `--inverse-fill-strong` (A11Y-01 신규) | — | 파생 | `rgba(255,255,255,0.16)` | `rgba(15,19,16,0.16)` |
| `--inverse-label-alternative` (A11Y-01 신규) | — | 목업 `opacity:.5` 대체 | `rgba(255,255,255,0.72)` | `rgba(15,19,16,0.72)` |
| `--inverse-label-disable` (A11Y-01 신규) | — | 파생 | `rgba(255,255,255,0.40)` | `rgba(15,19,16,0.40)` |

**글자 (6)**

| 우리 토큰 | 현재 | v2 출처 | 새 라이트 | 새 다크 |
|---|---|---|---|---|
| `--label-normal` | `#171719` / `#f7f7f7` | `--foreground` | `#1a2620` | `#e6ebe2` |
| `--label-strong` | `#000` / `#fff` | 없음(v2 전경 1단계) | `#1a2620` (normal과 같게. 사용 5곳이 같은 색으로 보인다) | `#e6ebe2` |
| `--label-neutral` | `rgba(46,47,51,.88)` / `rgba(194,196,200,.88)` | `--muted-foreground` **보정** | **`#4c574e`** (v2 `#5e6b60` 최저 4.02) | **`#acb6a7`** (v2 `#9aa694` 최저 4.46) |
| `--label-alternative` | `rgba(55,56,60,.61)` / `rgba(174,176,182,.61)` | `--caption` **보정** | **`#56615a`** (v2 `#66726a` 최저 3.61) | **`#9fa89b`** (v2 `#828e7d` 최저 3.30) |
| `--label-assistive` | `rgba(55,56,60,.28)` / … | 없음 → 파생 | `rgba(31,54,40,0.28)` — **글자 금지 유지**(A11Y-01) | `rgba(230,235,226,0.28)` |
| `--label-disable` | `rgba(55,56,60,.16)` / … | 없음 → 파생 | `rgba(31,54,40,0.16)` (1.4.3 비활성 예외, v1과 같은 알파) | `rgba(230,235,226,0.16)` |

- 글자 값은 v2처럼 **불투명 hex**로 둔다. A11Y-01 5.1의 "알파 over 중립 베이스" 결정은 v1 DS의 방식이었고, v2 DS는 글자를 hex로 정의한다 → DS 일관성은 v2를 따른다. 알파는 선·면(fill·line)에만 남는다.

**면 (8)**

| 우리 토큰 | 현재 | v2 출처 | 새 라이트 | 새 다크 |
|---|---|---|---|---|
| `--background-normal` | `#fff` / `#1b1c1e` | `--bg` | `#ffffff` | `#0f1310` |
| `--background-alternative` | `#f7f7f8` / `#0f0f10` | `--muted` | `#f0f3ee` | `#1f261d` |
| `--surface-elevated` | `#fff` / `#26282b` | `--card` | `#ffffff` | `#181d17` |
| `--surface-sunken` | `#f7f7f8` / `#141416` | `--muted` | `#f0f3ee` | `#1f261d` |
| **`--surface-raised`** (신규) | — | `--card-raised` · `--popover` | `#ffffff` | `#1d231c` (facet 팝오버·필 목록) |
| `--fill-normal` | `rgba(112,115,124,.08)` / `.22` | 없음 → 파생 | `rgba(31,54,40,0.06)` | `rgba(255,255,255,0.06)` |
| `--fill-strong` | `.16` / `.28` | 파생 | `rgba(31,54,40,0.12)` | `rgba(255,255,255,0.10)` |
| `--fill-alternative` | `.05` / `.12` | 파생 | `rgba(31,54,40,0.04)` | `rgba(255,255,255,0.04)` |

- fill 알파 근거: `fill-normal`을 흰 면에 합성하면 `#f2f3f2`로 **v2 `--muted`(`#f0f3ee`)와 거의 같은 명도**가 된다 — 목업의 "회색 면 = muted" 톤을 컨트롤(SegTabs 트랙·ghost hover)에도 그대로 쓰기 위해서다. `fill-strong`은 그 두 배(0.12, 합성 `#e4e7e5`). 이 선택이 3절 보정 폭을 정한다(최저값 대부분이 `fill-strong` 합성 면에서 나온다).

**선 (4)**

| 우리 토큰 | 현재 | v2 출처 | 새 라이트 | 새 다크 |
|---|---|---|---|---|
| `--line-alternative` | `rgba(112,115,124,.08)` | 파생 | `rgba(31,54,40,0.08)` | `rgba(255,255,255,0.06)` |
| `--line-neutral` | `.16` | `--border` | `rgba(31,54,40,0.12)` | `rgba(255,255,255,0.10)` |
| `--line-normal` | `.22` | `--border-strong` | `rgba(31,54,40,0.20)` | `rgba(255,255,255,0.16)` |
| `--line-strong` | `.52` | 파생 — 컨트롤 경계 3:1 최소값 | `rgba(31,54,40,0.54)` | `rgba(255,255,255,0.35)` |

- v2 `--input`(`.16`)은 `--line-normal`과 차이가 작아 별도 이름을 두지 않는다. 입력 경계에 무엇을 쓸지는 질문 Q4.

**상태 (16)** — v2가 이미 "아이콘·면용 색"과 "글자용 `*-text`"를 나눠 가진다 = A11Y-01 6절 결정과 같다. 이름은 A11Y-01대로 `--status-*-text`.

| 우리 토큰 | 현재 라이트 | v2 출처 | 새 라이트 | 새 다크 |
|---|---|---|---|---|
| `--status-positive` | `#00bf40` | `--success` | `#32d1af` | `#33ddb8` |
| `--status-positive-bg` | `#ebffee` | `--success-soft` | `#def7f0` | `rgba(51,221,184,0.16)` |
| `--status-positive-text` (A11Y-01 신규) | — | `--success-text` **보정** | **`#066b5a`** (v2 `#067562` 최저 4.04) | `#33ddb8` (그대로 6.59) |
| `--status-cautionary` | `#ff9200` | `--warning` | `#fbb424` | `#fbc04a` |
| `--status-cautionary-bg` | `#fff3e0` | `--warning-soft` | `#fef3da` | `rgba(251,180,36,0.16)` |
| `--status-cautionary-text` (A11Y-01 신규) | — | `--warning-text` **보정** | **`#825500`** (v2 `#8a5a00` 최저 4.26) | `#fbc04a` (그대로 6.89) |
| `--status-negative` | `#ff4242` | `--danger` | `#ff6b42` | `#ff7e59` |
| `--status-negative-bg` | `#ffecec` | `--danger-soft` | `#ffe7df` | `rgba(255,107,66,0.18)` |
| `--status-negative-text` (A11Y-01 신규) | — | `--danger-text` **보정** | **`#af2e0d`** (v2 `#c7340f` 최저 3.84) | **`#ff825e`** (v2 `#ff7e59` 4.53 — 여유 부족) |
| `--status-informative` | `var(--primary)` | `--info` | `#3b82f6` (주 색과 분리) | `#60a5fa` |
| `--status-informative-bg` | `#eaf2fe` | `--info-soft` | `#f0f7ff` | `rgba(96,165,250,0.16)` |
| **`--status-informative-text`** (신규) | — | `--info-text` **보정** | **`#1b58c8`** (v2 `#1d5fd8` 최저 4.10) | **`#65a8fa`** (v2 `#60a5fa` 4.47) |

**Tag 톤 별칭 (10)** — v2에는 accent 램프가 없고 배지는 StatusBadge 톤(success·info·warning·danger·primary)만 쓴다. Tag 톤을 상태 토큰의 별칭으로 바꾼다 → **A11Y-01 D-A11Y-N2(Tag 글자 미달) 해소**.

| 우리 토큰 | 새 값 (라이트·다크 모두 별칭, 다크 블록 재선언) |
|---|---|
| `--accent-green` / `-bg` | `var(--status-positive-text)` / `var(--status-positive-bg)` |
| `--accent-orange` / `-bg` | `var(--status-cautionary-text)` / `var(--status-cautionary-bg)` |
| `--accent-red` / `-bg` | `var(--status-negative-text)` / `var(--status-negative-bg)` |
| `--accent-blue` / `-bg` | `var(--status-informative-text)` / `var(--status-informative-bg)` |
| `--accent-violet` / `-bg` | `var(--primary-text)`(Q2 채택 시, 미채택이면 `var(--primary-hover)`) / `var(--primary-container)` |

- `--accent-purple`·`pink`·`cyan`·`lime`(+`-bg`)은 theme.css에 연결돼 있지 않고 사용처 0 → **삭제**.

**원시 램프 · 기타**
- `--common-*`·`--cool-neutral-*`·`--blue-*`·`--green-*`·`--red-*`·`--orange-*`·`--violet-*`·`--purple-*`·`--pink-*`·`--cyan-*`·`--lime-*` 램프는 의미 토큰이 hex를 직접 갖게 되면서 참조 0 → **삭제**. 컴포넌트가 원시 색을 직접 쓰던 3곳은 의미 토큰으로 바꾼다: 썸네일 막대 `bg-cool-neutral-90` → `bg-line-normal`(목업도 `--border-strong`), 썸네일 칸 `bg-common-100` → `bg-surface-elevated`, 트레이 개수 `text-blue-70` → 필 규칙(4.2 C-05). theme.css의 `--color-common-100`·`--color-cool-neutral-90`·`--color-blue-70` 연결 삭제(A11Y-01 Q6 해소).
- `--overlay-*`·`--interaction-overlay`: v2에 없음. 사용처 0이지만 모달·스크림이 생길 2a-04~07을 위해 값 유지(범위 밖).
- theme.css 추가 연결: `--color-status-{positive,cautionary,negative,informative}-text`, `--color-inverse-{fill-normal,fill-strong,label-alternative,label-disable}`, `--color-surface-raised`, (Q2) `--color-primary-text`.

### 2.4 타이포 (역할 9개)

v2 크기를 px 그대로 옮기지 않는다(ADR-003). **역할을 우리 유틸리티에 대응**시키고, 위계가 실제로 바뀌는 곳만 값을 바꾼다.

| v2 역할 | v2 값 | 우리 유틸리티 | 조치 |
|---|---|---|---|
| `t-display` | 34 / 1.08 / 800 | `ds-display1` (36/48/700) | 2a 화면에서 쓰지 않음. 값 유지 |
| `t-h1` 페이지 제목 | 23 / 1.3 / 700 / -.02em | `ds-title1` (24/32/700) | 유지 (차이 1px) |
| `t-h2` 패널 제목 | 18 / 1.4 / 700 | `ds-heading1` (18/26/**600**) | **굵기 600 → 700** — v2는 패널 제목("프로필 초안"·"디자인 프로필")을 본문 라벨과 굵기로 확실히 가른다 |
| `t-cardtitle` 카드 제목 | 15 / 1.4 / 600 | `ds-body2` + `font-semibold` | 카드 제목을 `ds-heading2`(17) → 15 semibold. 카드 4열에서 제목이 h1과 두 단계 이상 떨어진다 |
| `t-body` | 14 / 1.6 / 400 | `ds-body3` (14/22) | 같음 |
| `t-label` 항목 라벨 | 12.5 / 1.4 / 600 / `--muted-foreground` | `ds-caption1` (13/18) + `font-semibold` + `text-label-neutral` | 13 유지 |
| `t-caption` 캡션 | 11.5 / 1.4 / 500 / `--caption` | `ds-caption2` (12/16/500) + `text-label-alternative` | **12px 하한 유지** — 11.5px 한글 캡션은 가독성(2순위) 미달 |
| UI 기본 13.5 (메뉴·입력) | 13.5 | 메뉴 `text-body3`(14) · Button sm `text-caption1`(13) | 유지 |
| 굵기 800 (워드마크·점수·display) | 800 | `font-bold`(700) | **800 → 700.** 자체 호스팅 Pretendard 서브셋이 400·500·600·700 네 개뿐이다(`fonts.css`). 800 파일 추가 없음 |

- 숫자 정렬 `.tabular` → Tailwind `tabular-nums`(토큰 불필요).
- `--font-sans`는 우리 값 유지(자체 호스팅 Pretendard + 시스템 폴백). v2 `fonts.css`의 jsDelivr CDN은 쓰지 않는다.

### 2.5 모양 · 그림자 · 모션 (13)

| 우리 토큰 | 현재 | v2 | 새 값 |
|---|---|---|---|
| `--radius-sm` · `--radius-md` · `--radius-lg` · `--radius-2xl` | 8 · 12 · 16 · 28px | `--radius-sm` 8 · `--radius` 12 · `--radius-lg` 16 · `--radius-2xl` 28 | **같음** (확인만) |
| `--shadow-1` | 중성 회색 | `--shadow-sm` | `0 1px 2px rgba(20,40,28,.06), 0 1px 1px rgba(20,40,28,.04)` / 다크 `0 1px 2px rgba(0,0,0,.4)` |
| `--shadow-2` · `--shadow-3` | 〃 | `--shadow-md` | 둘 다 `0 4px 14px rgba(20,40,28,.08), 0 1px 3px rgba(20,40,28,.05)` / 다크 `0 4px 14px rgba(0,0,0,.45)` (사용처 0·0 — 이름만 유지, 팝오버는 `--shadow-3`) |
| `--shadow-4` | 〃 | `--shadow-lg` | `0 12px 34px rgba(20,40,28,.14), 0 4px 10px rgba(20,40,28,.07)` / 다크 `0 14px 38px rgba(0,0,0,.55)` (필·요약 바) |
| `--ease-standard` | `cubic-bezier(.4,0,.2,1)` | `--ease` 같음 | 같음 |
| `--duration-fast` | 120ms | `--dur-fast` .12s | 같음 |
| `--duration-normal` | 200ms | `--dur` .18s | **180ms** |
| `--duration-slow` | 320ms | `--dur-slow` .28s | **280ms** |
| `--layout-max-width` | 1060px | 목업 캔버스 1280 전폭 | **1280px** — 필터 레일이 빠지고 카드가 4열이 되므로 콘텐츠 폭 상한을 넓힌다(px 복제가 아니라 4열 × 최소 카드 폭 기준) |

- 다크 그림자는 `[data-theme="dark"]`에 재선언(현재는 다크 그림자 없음 — 신규).
- 목업 인라인 반경(카드 10px, 필 99px, 셀 6px)은 따르지 않고 `rounded-lg`·`rounded-full`·`rounded-sm`로 대응한다.

### 2.6 파일·출처 주석
- 각 토큰 파일 머리 주석을 `/* source: design/claude-design-handoff-v2/project/_ds/<dashboard-ds 폴더>/_ds_bundle.css (:root · .dark) */`로 바꾼다. v2에는 파일별 `tokens/*.css`가 없어 번들 한 파일이 출처다.
- 이 주석 줄에 `apfs` 문자열이 들어간다 → 6.3의 브랜드 가드 marker 수정 필수.

### 2.7 제외한 v2 토큰 (34종 + 차트 20색 + 모션 유틸리티 7종)

| v2 토큰 | 제외 사유 |
|---|---|
| `--chart-*` 20색 | 차트 없음(대시보드 DS용). 번들·CSS 크기만 늘림 |
| `--fs-agri` · `--fs-fish` · `--fs-ops` · `--fs-etc` | 원 기관 사업 분류 색 — 우리 도메인과 무관, ADR-002 명칭 흔적 |
| `--brand` (oklch) · `--brand-blue` · `--brand-cyan` · `--brand-forest` · `--brand-lime` · `--brand-gray` | 원 DS의 브랜드 팔레트 — ADR-002 교체 대상. 우리 브랜드는 `brand.css` |
| `--gradient-hero` · `--on-gradient-mint` · `--on-gradient-sky` · `--on-gradient-danger` · `--on-chart-fill` | 원 DS 대시보드 히어로·차트용. 2a 화면에 없음 |
| `--bg-deep` | 목업 **캔버스 배경**(문서 `body`). 앱 화면은 흰 단일 표면이라 쓰는 곳이 없다 |
| `--frame-bg` · `--background` · `--card-foreground` · `--popover` · `--popover-foreground` · `--accent-surface` · `--accent-surface-foreground` | 다른 토큰의 별칭 — 우리 쪽 대응 토큰 하나로 흡수(각각 background-normal · label-normal · surface-raised · background-alternative) |
| `--destructive` · `--destructive-foreground` | `--status-negative` · `--on-primary`와 중복 |
| `--secondary` · `--secondary-foreground` · `--cyan` | 민트 보조 색 = `--success`와 같은 값. 2a 화면에서 보조 색으로 쓰지 않음 |
| `--accent-foreground` · `--brand-solid` · `--on-brand-solid` | `--brand-accent`·`--primary-hover`·`--on-primary`로 흡수 |
| `--grid-header` · `--row-selected` · `--input` | 데이터 그리드용 / `--line-normal`과 사실상 같음 |
| `t-page`·`t-toast`·`t-digit`·`t-stagger`·`t-clear`·`t-icon-swap`·`t-success-check` 모션 유틸리티 | 2a 화면에서 쓰지 않음. 필요 시 화면 단위로 도입 |

(첫 줄 `--chart-*` 20색과 마지막 줄 모션 유틸리티 7종을 빼고 표 셀의 이름을 하나씩 세면 34종. Tailwind 유틸리티 클래스 전체와 `fonts.css` CDN은 토큰이 아니라 "원본 번들 미포함" 원칙으로 제외)

---

## 3. 대비 재계산 (A11Y-01 방법)

### 3.1 필수 배경 집합 (A11Y-01 1절 → v2 표면)

원칙 그대로: 토큰은 **"이 토큰이 놓일 수 있는 모든 면"**에서 통과해야 한다.

| 테마 | 면 | 값(합성 결과) | 출처 | 실제 사용처 |
|---|---|---|---|---|
| 라이트 | 흰 면 | `#ffffff` | v2 `--bg`·`--card` | 페이지, 카드 아래, 정보 패널, 초안 패널, 표 |
| 라이트 | muted | `#f0f3ee` | v2 `--muted` | 썸네일, 상세 미리보기 패널, 아바타, 편집 캔버스 |
| 라이트 | fill-normal / 흰 면 · muted | `#f2f3f2` · `#e3e8e2` | 우리 파생(2.3) | SegTabs 트랙(상세 미리보기 패널 = muted 위), ghost hover, Chip hover |
| 라이트 | fill-strong / 흰 면 · muted | `#e4e7e5` · `#d7dcd6`(최악) | 우리 파생 | Tag neutral, hover·눌림 |
| 라이트 | 상태 면 4종 | `#def7f0` `#fef3da` `#ffe7df` `#f0f7ff` | v2 `*-soft` | Callout·lint 상자·배지 |
| 라이트 | primary-container | `#f2f2fd` | 우리 파생(주 색 8%) | 선택 셀, primary 배지 |
| 다크 | bg · card · raised · muted + 각 면 위 fill 2종 | 12종 | v2 `.dark` + 파생 fill | 다크 토큰 테스트로만 검증(아래 주의) |
| 다크 | card 위 상태 면 4종 + primary-container | 5종 | v2 `.dark` `*-soft` | 〃 |
| 역상 | `#1a2620` · hover `#111a15` · 흰 .12/.16 합성 | 4종 / 다크 4종 | v2 `--foreground` + 파생 | 플로팅 필, 요약 바, 열 문자 배지, 건너뛰기 링크 |

주의: `app/src`에 `data-theme="dark"`를 켜는 코드는 여전히 없다(A11Y-01 1절). 다크 기준은 토큰 단위 테스트로만 검증한다.

### 3.2 글자 토큰 결과 (최저값, 전체 행은 스크립트 출력)

| 토큰 | v2 원값 → 최저 | **제안** → 흰 면 / 최저 | 판정 |
|---|---|---|---|
| label-normal | `#1a2620` → 11.24 | 그대로 15.64 / 11.24 | 통과 |
| label-neutral | `#5e6b60` → **4.02** (fill-strong 4.49, muted 5.00) | **`#4c574e`** → 7.55 / 5.42 | 보정 |
| label-alternative | `#66726a` → **3.61** (**muted 4.48**, soft·fill 4.03~4.55) | **`#56615a`** → 6.45 / 4.64 | 보정 |
| status-positive-text | `#067562` → **4.04** | **`#066b5a`** → 6.44 / 4.63 | 보정 |
| status-cautionary-text | `#8a5a00` → **4.26** | **`#825500`** → 6.46 / 4.64 | 보정 |
| status-negative-text | `#c7340f` → **3.84** | **`#af2e0d`** → 6.52 / 4.68 | 보정 |
| status-informative-text | `#1d5fd8` → **4.10** | **`#1b58c8`** → 6.40 / 4.60 | 보정 |
| (Q2) primary를 글자로 | `#5a5fe8` → **3.56** (흰 면 4.95, muted 4.42) | `#4147e5` → 6.44 / 4.63 | 질문 |
| 다크 label-normal | `#e6ebe2` → 9.38 | 그대로 | 통과 |
| 다크 label-neutral | `#9aa694` → **4.46** | **`#acb6a7`** → 8.92 / 5.41 | 보정 |
| 다크 label-alternative | `#828e7d` → **3.30** | **`#9fa89b`** → 7.62 / 4.62 | 보정 |
| 다크 상태 글자 | success 6.59 · warning 6.89 · danger **4.53** · info **4.47** | danger **`#ff825e`** 4.65 · info **`#65a8fa`** 4.62 | 2개 보정 |
| 다크 (Q2) primary 글자 | `#818cf8` → **3.81** | `#949ef9` → 4.61 | 질문 |

- 보정 방법: 같은 색상·채도(HLS)에서 명도만 0.5%씩 움직여 **배경 집합 최저 ≥ 4.6**이 되는 첫 값(`darken_to`). 톤(녹색 기운 중성·상태 색상)은 유지된다.
- **위계**: 두 테마 모든 배경에서 normal > neutral > alternative ≥ 4.5 성립(스크립트 "위계" 줄). 흰 면 사다리 15.64 → 7.55 → 6.45, 다크 bg 15.47 → 8.92 → 7.62. neutral은 alternative보다 최저 5.4를 목표로 한 단계 위에 둔다.
- 관찰: neutral/alternative 비율은 두 테마 모두 1.17로, A11Y-01 Q1이 걱정한 "약한 위계"가 남는다. 그러나 **v2 원값 자체가 1.12**(5.60/5.02) — v2는 두 단계를 색보다 **크기·굵기**(라벨 13 semibold vs 캡션 12 medium)로 가른다. 이 설계도 그 방식을 따른다(2.4).
- 톤 변화: 캡션이 `#66726a` → `#56615a`로 짙어진다. ADR-003 2순위(접근성) > 4순위(목업). PROGRESS에 기록.

### 3.3 역상 면 (플로팅 필·요약 바)

| 전경 \ 면 | `#1a2620` | hover `#111a15` | 흰 .12 | 흰 .16 | 최저 |
|---|---|---|---|---|---|
| on-surface-inverse `#fff` | 15.64 | 17.76 | 10.78 | 9.34 | **9.34** |
| inverse-label-alternative 흰 .72 | 8.71 | 9.57 | 6.51 | 5.77 | **5.77** |
| 목업 `opacity:.5` ("/ 6") | 4.93 | 5.21 | 4.05 | 3.69 | **3.69 미달** → `inverse-label-alternative`로 |
| 다크: on-surface-inverse `#0f1310` on `#e6ebe2` 계열 | 15.47 | 17.33 | 12.07 | 11.03 | **11.03** |
| 다크: inverse-label-alternative | 6.88 | 7.24 | 5.99 | 5.66 | **5.66** |
| 다크: 목업 그대로 흰 글자 | 1.21 | 1.08 | 1.55 | 1.69 | **1.08 미달** → 토큰 쌍으로 |

A11Y-01 4.2 규칙(역상 면 안의 자식은 `on-surface-inverse`·`inverse-*`만, opacity 금지, primary 버튼은 예외) 그대로.

### 3.4 UI 3:1 · 목업 자체 미달

| 대상 | 값 | 기준 | 판정·조치 |
|---|---|---|---|
| primary `#5a5fe8` vs 흰 면 / muted (체크박스·선택 원·활성 경계) | 4.95 / 4.42 | 3 | 통과 |
| primary 버튼 면 vs 필 `#1a2620` | 3.15 | 3 | 통과(글자로 식별되어 필수 아님) |
| 라이트 on-primary 흰 글자 vs primary / hover / pressed | 4.95 / 6.28 / 7.90 | 4.5 | 통과 |
| **다크 on-primary**: 흰 글자 vs `#818cf8` | **2.98** | 4.5 | **미달** → `#10142e`(6.06, hover 위 9.06) |
| 현재 포커스 링(주 색 28% 합성) vs 흰 면 | **1.46** | 3 | 미달(A11Y-01 Q4) |
| v2 `--ring #2563eb` 단독 vs 흰 면 · muted · 필 · **primary 버튼** | 5.16 · 4.61 · 3.02 · **1.04** | 3 | 버튼 위 미달 → **2중 링**: 안쪽 2px `--background-normal` 간격 + 바깥 2px ring. 링은 항상 자기 간격 색과 맞닿으므로 라이트 5.16, 다크(`#60a5fa` vs `#0f1310`) 7.36으로 어느 면에서든 3:1 이상. 역상 필 위에서도 흰 간격이 생겨 판별된다 |
| 상태 아이콘 success · warning · danger vs 흰 면 | 1.93 · 1.80 · 2.82 | 3 | **미달** — A11Y-01 6.4 규칙 유지: 글자와 함께 나오는 장식 아이콘·점만 `--status-*`, **상태를 혼자 알리는 아이콘·테두리는 `--status-*-text`** (2a-05 품질 게이트 점·경고 테두리가 여기에 해당 — 해당 화면 설계에서 적용) |
| 컨트롤 경계 `--border` · `--input` · `--border-strong` vs 흰 면 | 1.24 · 1.34 · 1.45 | 3 | 미달 — v1도 같은 상태(`line-normal` 1.32). 범위를 넓히지 않고 **질문 Q4** |
| 목업 열 문자 배지: 흰 글자 on 레퍼런스 대표색 `#d47800` · `#00a884` | **3.23 · 3.02** | 4.5 | 미달 → 역상 배지 유지(C-10) |
| 목업 Tag primary(`#5a5fe8` on 7% 틴트) · Tag neutral(`#5e6b60` on fill-strong) | **4.45 · 4.49** | 4.5 | 미달 → primary 배지 글자는 Q2 토큰(5.80), neutral은 보정값(6.06) |
| 목업 상세 미리보기 캡션(`t-caption` on muted) | **4.48** | 4.5 | 미달 → 보정 캡션 5.76 |

### 3.5 A11Y-01 이어받기 결정

| A11Y-01 항목 | v2에서 |
|---|---|
| 방법·배경 집합·0.1 여유·Red-Green 토큰 테스트(9.1) | **유지.** 배경 목록만 3.1 표로 교체 |
| `--label-alternative` 제안값 `rgba(55,56,60,.76)` | **폐기**(v1 베이스). 같은 방법으로 `#56615a` / `#9fa89b` |
| 상태 글자 전용 토큰(6절, 3종) | **채택 + 1종 추가**(`--status-informative-text`). 값은 v2 `*-text` 보정 |
| `--label-assistive` 글자 금지 + 8곳 교체(3절) | **유지.** 사용처 8곳은 v2 화면에서도 캡션 역할 → `text-label-alternative` |
| 역상 토큰 4개 + Button 역상 변형(4절) | **채택.** 변형은 새로 만들지 않고 `secondary`를 재정의(5절 번들) |
| D-QA04 접근 이름 `이 레퍼런스로 전부 선택: <열 문자> <제목>` | **유지** — v2 열 머리글에도 전부 선택 버튼을 둔다(C-10) |
| D-QA06 "비교 보드에 담았습니다" + 형제 링크 "보드 열기", 알림 영역 `display:none` 금지 | **유지** — v2 정보 패널 하단 버튼 아래 |
| D-A11Y-N1 ScoreTile 점수 색 | **유지** — v2 상세 점수(`--success-text` 계열) = `text-status-*-text` |
| D-A11Y-N2 Tag accent 글자 미달(Q5) | **해소** — Tag 톤을 상태 별칭으로(2.3), 6종 모두 5.5+ |
| Q1 다크 위계 | 3.2 관찰 참고. v2 방식(크기·굵기 구분)으로 종결 |
| Q2 `--label-assistive` 삭제 여부 | 유지 + 가드(A11Y-01 권고 그대로) |
| Q4 포커스 링 | **2중 링으로 해소 제안**(brand.css 안에서 끝남) |
| Q6 `text-blue-70` 원시 토큰 | **해소** — 원시 램프 삭제, 필 개수는 `on-surface-inverse` |
| Q7 "비교 보드에서 뺐습니다" | 유지(권고) |

---

## 4. 구현 화면 영향 · 목업 충돌 결정

### 4.1 앱 셸 (모든 라우트)

| 요소 | v2 적용 | 유지하는 기능 |
|---|---|---|
| 헤더 높이 | `h-15` → `h-13`(52px) | — |
| 로고 | `brand.Logo` + 이름 유지(워드마크만 쓰는 목업과 다름 — 브랜드 레이어 ADR-002가 로고를 결정) | 브랜드 교체 = 2파일 |
| 오른쪽 | "새 프로젝트"(primary sm) + 아바타(muted 면, `label-neutral` 글자) — **모든 화면 동일** | 화면마다 버튼이 바뀌는 목업은 DS 일관성(3순위)으로 통일 |
| 조직 공유 | 표시 안 함 | 1a-03 D-1(FR-CMP-04 P1, 권한 모델 없음) |
| 모바일(<768) | 헤더 아래 **주 메뉴 한 줄**(4개, 가로 스크롤 허용) | 목업 2a-06은 메뉴가 없지만, 탭을 없애면 보관함·비교 보드로 갈 길이 사라진다(기능 1순위). 현재도 `hidden md:flex`라 모바일 메뉴가 없던 결함을 함께 닫는다 |
| 건너뛰기 링크·라우트 포커스·제목 | 그대로 | A-7 |

### 4.2 카탈로그 `/catalog` (1a-01 → 2a-01·2a-06)

| 기능 | v2 레이아웃에서 |
|---|---|
| URL 동기화 필터 9종(업종·타깃·콘셉트·레이아웃·목적·라이선스·색상·디바이스·모션) | 업종 = 칩 한 줄(단일 선택, "전체" 포함). 칩 개수 표시(v2 FilterChip count)는 선택 사항 — 넣는다면 현재 결과에서 계산하고 칩 접근 이름에 포함. 나머지 8종 = **facet 버튼 5개**: `콘셉트` · `목적` · `라이선스` · `모션` · `필터 더보기`(타깃·레이아웃·색상·디바이스). 선택은 즉시 URL에 반영(기존 `toCatalogParams` 그대로), 새로고침 복원 |
| facet 라벨 | 선택 상태를 **글자로**: 없음 "콘셉트", 1개 "목적 · 예약", 2개 이상 "콘셉트 · 2". 활성 = outline, 비활성 = ghost(v2). 색만으로 상태를 알리지 않는다 |
| facet 패널 | **공개(disclosure) 패턴**: `button[aria-expanded][aria-controls]` → 패널(`surface-raised` + `shadow-3`) 안에 기존 `fieldset` + 체크박스(접근 이름 그대로), 모션은 기존 SegmentedControl(radiogroup "모션 강도"). 모달 아님·포커스 가두지 않음. Esc = 닫고 버튼으로 포커스 복귀, 바깥 클릭·다른 facet 열기 = 닫힘, 한 번에 하나 |
| 필터 초기화 | 필터가 1개 이상일 때 칩 줄 끝에 "필터 초기화"(기존 접근 이름) |
| 정렬 | Select → **SegmentedControl** radiogroup "정렬"(점수순·최신순), URL `sort` 그대로 |
| 탭 전체·추천·저장함 | **삭제.** URL `tab` 값은 유지: `saved` = GNB "보관함"으로 진입, h1 "보관함" + 부제 "저장한 레퍼런스 N개" / `rec` = "추천 받기" 버튼, h1 "추천" + 기존 안내 + "전체 보기" 링크 / 기본 h1 "레퍼런스 카탈로그" + 부제 "internal · licensed 레퍼런스 N개" |
| 검색 | 제목 행 오른쪽 TextField(`type=search`, 접근 이름 "레퍼런스 검색") + "추천 받기"(**outline**, 아이콘은 기존 `sparkle` — 새 아이콘 추가 없음) |
| 카드 FR-CAT-02 (12필드) | 보더 삭제, 썸네일만 muted(4:3, 모바일 16:9). 제목 **2줄까지**(`line-clamp-2`, B-DET-02) · 캡션 1 "업종 · 레이아웃 · 모션 낮음" · 캡션 2 "태그 · 태그 · 반응형 지원" · 점수 줄 "접근성 96 · 성능 92 · 09.20 측정"(**라벨 표시** — 목업 "96 / 92"는 라벨이 없어 무엇의 점수인지 모른다. 목업 2a-06 모바일은 라벨이 있다) · 대표색 점 3개(`role=img` + 이름) · 아이콘 버튼 2개 |
| 카드 버튼 | ghost 아이콘 버튼 `size-8`(32px, WCAG 2.5.8 최소 24 이상). 저장: 이름 "<제목> 저장" + `aria-pressed`, 저장됨 = `bookmark-fill` + primary. 비교: 이름 "<제목> 비교 추가" / "<제목> 비교 중, 비교에서 빼기"(기존), 담김 = `check` 아이콘 + primary. 둘 다 기존 아이콘 |
| 6개 제한 | 7번째 → 담지 않고 필의 알림 영역에 `COMPARE_LIMIT_NOTICE` |
| 비교 트레이 | **플로팅 필**(C-05) |
| 반응형 | ≥1280 4열 · ≥1024 3열 · ≥640 2열 · <640 1열. <768: 검색 전폭 + "필터 N"(N = 업종 제외 선택 수) + 업종 칩 **가로 스크롤**(목업 `overflow:hidden`은 칩을 잘라 정보 손실) → "필터 N" 패널에 8그룹 + 정렬 |
| 접근성 1a-01 | 저장·비교 이름, 칩 `aria-pressed`, 트레이 D07, 건너뛰기 링크(결과 목록) 유지 |

### 4.3 상세 `/references/:id` (1a-02 → 2a-02)

| 기능 (FR-CAT-03) | v2 레이아웃에서 |
|---|---|
| 섹션 구성(순서) | 오른쪽 정보 패널 목록(v2). 순번 "01"은 `label-alternative`(A11Y-01 3절 #7) |
| 토큰 요약(팔레트·폰트·간격) | 정보 패널 견본 4칸(`role=img` + hex 목록) + 한 줄 "Pretendard 700/400 · 스케일 1.25 · 8pt · 본문 대비 7.2:1". 기존 TokensPanel의 간격·모션 값은 이 한 줄에 합친다 |
| 모바일 구조 | **미리보기 폭 전환**(SegmentedControl radiogroup "미리보기 폭": 데스크톱·태블릿·모바일). 모바일을 고르면 모바일 와이어프레임 + 그 아래 기존 모바일 구조 설명. URL `view`(기본 desktop 생략), **옛 `?tab=mobile`은 `view=mobile`로 해석**(북마크 호환) |
| 유사 업종·콘셉트·레이아웃 추천(각 ≤6) | **유지.** 2단 아래 전폭 영역 "유사 레퍼런스" 3그룹(목업에 없음 — FR-CAT-03 P0) |
| 점수 이력 | **유지.** 같은 아래 영역 "점수 이력" |
| 점수 | 정보 패널 3칸(접근성·성능·모션). 숫자 색 `text-status-*-text`(D-A11Y-N1), 굵기 700 |
| 태그 | 목업은 FilterChip 모양(눌리는 것처럼 보임) → **비대화형 Tag**. 거짓 행동 유도 방지 |
| 저장·비교·템플릿 | 정보 패널 하단(v2). D-QA06 알림 + "보드 열기" 형제 링크를 버튼 아래 |
| 순서·반응형 | DOM 순서 = 보이는 순서: 뒤로 → 미리보기 폭 → 미리보기 → 정보 패널(h1…) → 아래 영역. <1024 한 열로 쌓임. 390에서 h1이 첫 화면 안에 들도록 모바일 미리보기는 16:9 |

### 4.4 비교 보드 `/compare` (1a-03 → 2a-03)

1a-03 SPEC의 흐름·상태(S-01~S-18)·접근성(A-1~A-12)·AC-01~26은 **그대로**. 바뀌는 것은 표면·밀도·표시 방식뿐이다.

| 요소 | v2 적용 | 유지 |
|---|---|---|
| 표 | 머리글 회색 면 삭제(흰 면 + `line-neutral` 선), 행 라벨 `t-label` 대응 | `<table>`·caption·`th scope`(A-1), 12행(D-3), 5열 이상 가로 스크롤·행 머리글 고정 |
| 선택 셀 | 고른 셀 전체에 `primary-container` 면 + 채운 체크 원(주 색) + **"선택됨"**. 안 고른 셀은 빈 원 + **"이 요소 선택"**(FR-CMP-03 문구) | 네이티브 `button[aria-pressed]`, 접근 이름 A-2, 행 roving(A-5). A-3의 "굵은 테두리"는 **셀 면 + 원 모양(채움/빈 원) + 글자**로 대체 — 색 외 단서 2개 유지 |
| 열 머리글 | 목업 "레퍼런스 색 면 + 흰 문자" 배지 → **역상 면 배지 유지**(C-10) + 대표색 견본 별도. 제목 2줄(S-18) · 업종 · 라이선스 Tag(StatusBadge 톤) · "전부 선택"(ghost sm, D-QA04 이름) · 빼기(×) | FR-SEL-01, D-14, S-08 "사용 불가" |
| 초안 패널 | 회색 면 → 흰 면 + 왼쪽 `line-neutral`. 항목 앞 출처 색 점(`aria-hidden`), 종류 캡션 + 값 + 출처 | "기본값 · A"(D-8), 값 줄바꿈(D-9), sticky |
| 상태 태그 | v2 "저장 전"(warning) 하나 → 우리 두 축 유지(D-10): 자동 저장 캡션 + 확정 태그. 톤: 확정 전 = neutral, v1 확정됨 = positive, v1 이후 변경됨 = cautionary | S-12·S-15·S-16 |
| 버튼 | "초안 비우기" outline → ghost(`assistive` 재정의) | 되돌리기(S-17) |
| 요약 바(768·390) | 역상 면 v2 값(`#1a2620`), "초안 보기" = `secondary`(역상 변형) | D-QA01 해결(9.34+) |
| 모드 SegTabs | **두지 않음**(C-08) | ADR-005 / D-2 |

### 4.5 목업 충돌과 결정 (ADR-003)

| # | v2 목업 | 충돌하는 결정·요구 | 결정 | 순위 근거 |
|---|---|---|---|---|
| C-01 | facet 4개(콘셉트·목적·라이선스·모션) | FR-CAT-01 필터 9종 · URL 동기화 | facet 5개(4 + "필터 더보기"), 8그룹 전부 선택 가능 | 1 기능 |
| C-02 | 카탈로그 탭 없음 · 모바일 메뉴 없음 | FR-CMP-01 보관함 접근 · 추천 진입 | GNB "보관함" + h1 보기 이름, 모바일 메뉴 한 줄 | 1 기능 |
| C-03 | 카드 제목 1줄 말줄임 | B-DET-02(이름 식별), S-18 | 2줄 + 링크 이름 전체 | 2 사용성 |
| C-04 | 카드 태그·반응형·측정일 없음, "96 / 92" 라벨 없음 | FR-CAT-02 필드 누락 0 | 캡션 2줄 + 라벨 있는 점수 줄 | 1 기능 |
| C-05 | 플로팅 필에 빼기 없음, 안내 없음 | 트레이 빼기 · D07 포커스 · 한도 알림 | 필의 "비교 N / 6"이 **펼침 버튼**: 위로 담긴 목록(제목 + 빼기, 이름 "<제목> 비교에서 제거") 표시. 빼면 다음 → 이전 → 펼침 버튼으로 포커스(D07 변형). 알림 `role=status`는 필 위 말풍선. 0개여도 필 유지("비교 0 / 6"). 필은 `section aria-label="비교 트레이"`, "비교 보드" 버튼 이름 "비교 보드 열기"(보이는 글자 포함 2.5.3). **포커스 가림 방지(2.4.11)**: 문서 `scroll-padding-bottom` = 필 높이 + 간격, 목록 하단 여백 동일 | 1 기능 · 2 접근성 |
| C-06 | 화면마다 헤더 오른쪽이 다름 | DS 일관성 | 모든 화면 "새 프로젝트" + 아바타 | 3 일관성 |
| C-07 | 상세 탭·유사 레퍼런스·점수 이력·모바일 구조 없음 | FR-CAT-03 P0 | 미리보기 폭 전환 + 아래 영역(4.3) | 1 기능 |
| C-08 | 비교 보드 "템플릿 / 스타일 조합" SegTabs | ADR-005 / 1a-03 D-2 | 두지 않음 — 열의 "이 레퍼런스로 전부 선택"이 같은 결과를 1개 열에서도 낸다 | ADR-006 결정 2 |
| C-09 | 비교 보드 10행, 조직 공유, 선택 표시 `span` | D-3(FR-CMP-02 접근성·성능) · D-1 · D-6 | 12행 · 숨김 · `button[aria-pressed]` | ADR-006 결정 2 |
| C-10 | 열 문자 배지 = 레퍼런스 대표색 면 + 흰 글자, 전부 선택·빼기 없음 | 대비(3.02~3.23) · FR-SEL-01 · D-14 | 역상 배지 + 견본 별도, 버튼 2개 유지 | 2 접근성 · 1 기능 |
| C-11 | 상세 태그를 FilterChip으로 표시 | 거짓 행동 유도 | 비대화형 Tag | 2 사용성 |
| C-12 | 굵기 800, 캡션 11.5px, 목업 `opacity .5` 글자 | 폰트 자체 호스팅 · 가독성 · A11Y-01 역상 규칙 | 700 · 12px · 토큰 | 2 성능·가독성·접근성 |

---

## 5. 번들 영향

기준선(QA-1A-03 `logs/build.log`, gzip): 공통 88.96KB · `/catalog` 97.98 / 100.36 · `/references/:id` 95.64 / 98.02 · **`/compare` 99.98 / 120.64** · 자리표시 89.40 / 91.79 (첫 화면 / 진입 직후, 예산 100 / 125).

`check-bundle-size.mjs`는 **JS만** 더한다. CSS는 예산 대상이 아니다.

| # | 규칙 | 효과 |
|---|---|---|
| B-1 | **토큰 이름 유지, CSS 값만 교체**(2.1) | 토큰 전환의 JS 증가 **0** |
| B-2 | **공통 청크 변경은 바이트 중립 이하.** 공통 청크에는 AppHeader·Button·Icon 등 전 라우트 공용 모듈이 들어 있다(L2 추정 — V2-1 첫 빌드에서 manifest로 확인). 여기 1바이트가 늘면 `/compare`(여유 0.02KB)가 바로 넘친다 | 헤더: `h-15`→`h-13` 같은 길이 교체만. Button: `secondary` 문자열을 역상 변형으로 **재정의**(v2에서 `secondary` 사용처 "추천 받기"가 outline이 되어 비게 됨), `assistive`를 ghost로 **재정의**(현재보다 짧은 문자열). 새 변형 키를 추가하지 않는다 |
| B-3 | **아이콘 파일 추가 0.** `Icon.tsx`가 `import.meta.glob(eager)`로 `assets/icons/*.svg` URL 맵을 공통 청크에 넣는다 → 파일 하나마다 공통 청크가 커진다 | v2 목업 아이콘 중 `star`·`filter`·`external`은 쓰지 않는다: 추천 = `sparkle`, 필터 N = 아이콘 없음(또는 `chevron-down`), 조직 공유 = 숨김 |
| B-4 | **새 컴포넌트는 카탈로그 청크에만**: facet 팝오버, 플로팅 필(= `CompareTrayBar` 교체) | `/catalog` 여유 2.02KB 안. `FilterRail` 레이아웃 코드 제거, **`Tabs.tsx`는 카탈로그·상세 모두에서 빠져 삭제**(두 라우트 감소) |
| B-5 | `/compare`는 클래스 문자열 교체 위주. 감소분(표 머리글 면 클래스 삭제, 초안 패널 면 클래스 삭제)으로 증가분(초안 색 점, 태그 톤 매핑)을 상쇄 | 단계 V2-4에서 **첫 화면 ≤ 100KB 실측**. 넘치면 같은 단계에서 첫 화면 밖으로 옮길 후보(예: 확정 오류 문구 표 — 진입 직후 합계 여유 4.36KB)를 manifest로 확인해 이동 |
| B-6 | 폰트 800 미추가(2.4) | 네트워크 증가 0 |
| B-7 | CSS 크기는 예산 밖이지만 **참고로 보고**: 원시 램프·accent 4종 삭제로 감소, 다크 그림자·새 토큰 9개로 증가 | 단계별 CSS gzip 전후 기록 |

---

## 6. 단계 구현 계획

### 6.1 순서

| 단계 | 범위 | 선행 | 예상 규모(추정) |
|---|---|---|---|
| **V2-1** 토큰·DS | `brand.css`·`colors.css`·`shape.css`·`typography.css`(굵기)·`spacing.css`(max-width)·theme.css 연결 · 원시 램프 삭제 · Button `secondary`/`assistive` 재정의 · Tag 톤 별칭 · `tokenContrast.test.ts`(A11Y-01 9.1, 배경 3.1) · 가드(assistive 글자 0, 접미사 없는 status 글자 0, 브랜드 marker) · A11Y-01 사용처 교체(assistive 8곳, 상태 글자 3곳, 역상 자식) | 없음 | 턴 1회 분량. 화면 레이아웃 변경 없음 — 이 단계만 끝나도 앱 전체가 v2 색·대비로 바뀐다 |
| **V2-2** 셸·카탈로그 | 52px 헤더 · 모바일 메뉴 줄 · 흰 단일 표면 · 칩 줄 + facet 팝오버 · 정렬 SegmentedControl · 탭 삭제(보기 = URL `tab`) · 카드 v2 · 플로팅 필 · `Tabs` 사용 제거 | V2-1 | 가장 큼. 턴 예산이 부족하면 V2-2a(셸·필터·정렬·탭) / V2-2b(카드·필)로 나눈다 |
| **V2-3** 상세 | 탭 삭제 · 2단(미리보기 패널 + 정보 패널) · 미리보기 폭 + `view` URL(옛 `tab=mobile` 호환) · 아래 영역(유사·점수 이력) · 태그 비대화형 · D-QA06 | V2-1 (V2-2와 병렬 가능하나 `Tabs` 삭제는 둘 다 끝난 뒤) | 중간 |
| **V2-4** 비교 보드 | 표면·선택 셀·열 머리글·초안 패널·요약 바 v2화, D-QA01~04 해결 확인 | V2-1 | 중간. 번들 실측 필수 |
| 이후 | 2a-04 프로필·생성, 2a-05·07 편집기, 2a-06은 V2-2에 포함 | — | **Designer 신규 화면 설계 먼저**(ADR-003 적용 규칙) |

### 6.2 수용 기준

태그: **[V]** Vitest · **[Q]** QA 브라우저(ego-browser 뷰포트 캡처) · **[B]** 빌드 출력.

| ID | 단계 | 기준 | 검증 |
|---|---|---|---|
| V2-AC-01 | V2-1 | 라이트 의미 토큰 값이 2.3 표와 같다(글자·면·fill·선·상태·역상) | [V] tokens 테스트 |
| V2-AC-02 | V2-1 | 다크 값이 2.3 표와 같고, `var()` 별칭(주 색·Tag 톤·focus-ring)이 `[data-theme="dark"]`에 재선언돼 다크에서 다크 값으로 해석된다 | [V] |
| V2-AC-03 | V2-1 | `brand.css` 값이 2.2 표와 같다. `--primary`는 여전히 `var(--brand-primary)`. `--brand-*` 정의는 `brand.css`에만 | [V] tokens · brandIsolation |
| V2-AC-04 | V2-1 | `tokenContrast.test.ts`: 3.1 배경 집합에서 글자 토큰(label 3종·status-text 4종·on-surface-inverse·inverse-label-alternative·on-primary) 모두 ≥ 4.5. 현재 값으로 먼저 RED | [V] Red-Green 로그 |
| V2-AC-05 | V2-1 | 두 테마 모든 배경에서 normal > neutral > alternative | [V] |
| V2-AC-06 | V2-1 | 다크 `--on-primary` = `#10142e`, primary·hover 위 ≥ 4.5 | [V] |
| V2-AC-07 | V2-1 | `--status-*-text` 4개, `--inverse-*` 4개, `--surface-raised`가 theme.css에 연결 | [V] |
| V2-AC-08 | V2-1 | Tag 6톤 글자 대비 ≥ 4.5 (accent 별칭) | [V] |
| V2-AC-09 | V2-1 | `.tsx`에서 `label-assistive` 글자 사용 0 (A11Y-AC-04·05 이어받음) | [V] 가드 |
| V2-AC-10 | V2-1 | 접미사 없는 `text-status-*`는 아이콘 줄에만 (A11Y-AC-11) | [V] 가드 |
| V2-AC-11 | V2-1 | Button `secondary` = 역상 변형(`bg-inverse-fill-normal text-on-surface-inverse` …, aria-disabled 쌍 포함), `assistive` = ghost(투명 면, hover `fill-normal`). 새 변형 키 없음 | [V] Button 테스트 |
| V2-AC-12 | V2-1 | 원시 램프·accent 4종·`primary-strong/heavy` 삭제, `components`·`pages`에서 원시 색 유틸리티(`cool-neutral-*`·`common-*`·`blue-*`) 사용 0 | [V] 가드 |
| V2-AC-13 | V2-1 | 토큰 파일 출처 주석이 v2 번들 경로. `apfs` 문자열은 출처 경로 주석 줄 외 0 | [V] brandIsolation(개정) |
| V2-AC-14 | V2-1 | 폰트 파일·아이콘 파일 추가 0, `font-extrabold`/800 사용 0 | [V] 가드 또는 [B] |
| V2-AC-15 | V2-2 | 헤더 52px 구성이 모든 라우트에서 같다(브랜드·메뉴 4·새 프로젝트·아바타), "조직 공유" 없음 | [V] |
| V2-AC-16 | V2-2 | <768에서 주 메뉴 4개에 도달 가능, 문서 가로 넘침 0 | [V] 존재 · [Q] 390 |
| V2-AC-17 | V2-2 | 업종 칩 + facet 5개. 8그룹 모든 옵션을 facet 패널에서 고를 수 있고 URL 동기화·새로고침 복원(FR-CAT-01) | [V] |
| V2-AC-18 | V2-2 | facet 버튼 `aria-expanded`·`aria-controls`, Esc로 닫히고 포커스가 버튼으로, 한 번에 하나만 열림, 라벨이 선택 상태를 글자로 표시 | [V] |
| V2-AC-19 | V2-2 | 390: "필터 N" 패널에 8그룹 + 정렬, 업종 칩은 가로 스크롤로 전부 도달(잘림 없음) | [V] · [Q] |
| V2-AC-20 | V2-2 | 정렬 radiogroup "정렬"(점수순·최신순), URL `sort` 유지 | [V] |
| V2-AC-21 | V2-2 | 탭 없음. `?tab=saved` → h1 "보관함" + 저장 목록, `?tab=rec` → h1 "추천" + 안내 + "전체 보기", GNB 보관함 `aria-current` | [V] |
| V2-AC-22 | V2-2 | 카드 보더 없음, 썸네일 muted. FR-CAT-02 12필드 누락 0, 점수에 라벨·측정일 | [V] |
| V2-AC-23 | V2-2 | 카드 아이콘 버튼 이름·`aria-pressed` 기존과 같고 타깃 ≥ 32px | [V] 이름 · [Q] 크기 |
| V2-AC-24 | V2-2 | 필 "비교 N / 6" 펼침 → 목록 빼기, 포커스 다음 → 이전 → 펼침 버튼(D07), 한도 알림 `role=status`, "/ 6"이 `inverse-label-alternative` | [V] |
| V2-AC-25 | V2-2 | 필이 포커스를 가리지 않는다(2.4.11) — 마지막 줄 카드 버튼에 Tab하면 버튼 전체가 필 위에 보인다 | [Q] 1280·390 |
| V2-AC-26 | V2-2 | 1280 4열 · 768 · 390 가로 넘침 0, 카드 제목 2줄 | [Q] |
| V2-AC-27 | V2-3 | 상세에 탭 없음, 섹션 구성·토큰 요약이 정보 패널에 항상 보인다 | [V] |
| V2-AC-28 | V2-3 | 미리보기 폭 radiogroup, URL `view`, `?tab=mobile` → 모바일 선택 상태 + 모바일 구조 설명 | [V] |
| V2-AC-29 | V2-3 | 유사 레퍼런스 3그룹(각 ≤ 6)·점수 이력 유지, 이름 2줄(B-DET-02) | [V] |
| V2-AC-30 | V2-3 | 점수 색 `status-*-text`(D-A11Y-N1), D-QA06 알림 + 형제 링크(A11Y-AC-17) | [V] |
| V2-AC-31 | V2-3 | 콘셉트·목적 태그는 버튼이 아니다(비대화형) | [V] |
| V2-AC-32 | V2-4 | 1a-03 AC-01~26 전부 통과(회귀) | [V] |
| V2-AC-33 | V2-4 | 모드 토글 없음, 12행, 조직 공유 없음 | [V] |
| V2-AC-34 | V2-4 | 고른 셀: `primary-container` 면 + 채운 원 + "선택됨"; 안 고른 셀: 빈 원 + "이 요소 선택"; 접근 이름 A-2 그대로 | [V] |
| V2-AC-35 | V2-4 | 열 머리글: 역상 문자 배지(대비 ≥ 4.5) + 견본 + 제목 2줄 + 라이선스 Tag + 전부 선택(D-QA04 이름) + 빼기 | [V] |
| V2-AC-36 | V2-4 | 초안 패널 흰 면 + 왼쪽 선, 요약 바 "초안 보기"가 `secondary` 역상 변형(대비 ≥ 4.5, D-QA01) | [V] · [Q] 768·390 |
| V2-AC-37 | V2-4 | D-QA02·03: "기본값" 라벨·열 업종·대표색 오류 문구 대비 ≥ 4.5 (흰 면 계산 6.45~6.52, muted 위라도 5.76 이상) | [V] · [Q] 재측정 |
| V2-AC-38 | 전 단계 | 단계마다 라우트별 첫 화면 ≤ 100KB · 진입 직후 ≤ 125KB **실측값 보고**. 공통 청크가 늘면 같은 단계에서 상쇄 내역 기록 | [B] |
| V2-AC-39 | 전 단계 | 검증 4종(typecheck·lint·test·build) 통과. 깨진 기존 테스트는 6.3 목록 안에서만, 테스트 수 변화 보고 | [B] |
| V2-AC-40 | V2-1 | 포커스 링이 2중 링이고 흰 면·muted·역상 필·primary 버튼 위에서 ≥ 3:1 (계산 5.16 / 다크 7.36) | [V] 계산 · [Q] 확인 |

### 6.3 깨질 기존 테스트 (예상)

| 파일 | 깨지는 단언 | 단계 | 처리 |
|---|---|---|---|
| `styles/tokens.test.ts` | `--primary` `#3366ff` / 다크 `#5b84ff` | V2-1 | `#5a5fe8` / `#818cf8` |
| `styles/tokens.test.ts` | 출처 주석 정규식 `design/claude-design-handoff/project/_ds/[\w-]+/tokens/<file>.css` | V2-1 | v2 번들 경로 정규식으로(2.6) |
| `test/brandIsolation.test.ts` | `SOURCE_PATH_MARKER = "design/claude-design-handoff/"` — v2 경로(`…-v2/project/_ds/apfs-dashboard-ds-…`)와 맞지 않아 출처 주석이 FORBIDDEN에 걸림 | V2-1 | marker를 `"design/claude-design-handoff"`(끝 `/` 없이 두 경로 모두) 또는 두 값 목록으로 |
| `components/ds/Button.test.tsx` | 변형별 테두리 클래스(`border-transparent`) — `assistive` 재정의 시 | V2-1 | 새 정의 기준 |
| `pages/CatalogPage.test.tsx` | `checkbox` "미니멀"·"대담한"·"따뜻한 계열"·"데스크톱" 등 직접 클릭, `radio` "낮음", `combobox` "정렬", `tab` "저장함" | V2-2 | facet 열기 → 선택, `radio` "점수순/최신순", URL `?tab=saved` |
| `app/routeScroll.test.tsx` | `checkbox` "미니멀" 직접 클릭 | V2-2 | facet 열기 추가 |
| `pages/keyboardA11y.test.tsx` | `tablist` "카탈로그 보기", `radiogroup` "모션 강도"(facet 안), D07 트레이 칩 포커스, `tablist` "상세 보기" | V2-2·V2-3 | 필 목록 D07, 미리보기 폭 radiogroup 키보드 |
| `components/catalog/ReferenceCard.test.tsx` | "비교 중" **보이는 글자**(아이콘 버튼이 되면 사라짐), Tag로 그린 태그 | V2-2 | 접근 이름·`aria-pressed` 단언으로, 태그는 캡션 글자 |
| `pages/ReferenceDetailPage.test.tsx` | `tablist`·`tab`·`tabpanel`, `?tab=` URL | V2-3 | 정보 패널 섹션·`view` URL·호환 |
| `components/compare/ComparisonTable.test.tsx`·`DraftPanel.test.tsx`·`pages/CompareBoardPage.test.tsx` | 표시 방식만 바뀌므로 **깨지지 않아야 한다**("이 요소 선택"·"선택됨"·접근 이름 유지). 상태 태그 톤을 단언하는 곳이 있으면 그 줄만 | V2-4 | 깨지면 설계 위반 신호 — Designer 확인 |

### 6.4 단계별 목업 차이 기록
각 단계 PROGRESS에 4.5 표의 C-번호를 한 줄씩 인용한다(ADR-003 적용 규칙).

### 6.5 2a-04~07
구현 전 화면이다. v2 목업은 Designer의 **입력 자료**다. 프로필·생성(2a-04), 편집기(2a-05·07)는 상태·흐름·수용 기준을 먼저 설계한다(별도 브리프). 이 설계서의 토큰·대비·C-12 규칙은 그대로 적용된다. 참고로 이미 보이는 쟁점: 2a-05 품질 게이트 상태 점은 혼자 상태를 알리므로 `status-*-text` 대상(3.4), 2a-04 전역 조정 슬라이더는 키보드·값 텍스트 필요.

---

## 7. 설계 질문 (영환님 결정 필요)

| # | 질문 | 추천안 |
|---|---|---|
| Q1 | **브랜드 주 색 교체**: ADR-002 임시 브랜드 값(`#3366ff` 파랑)을 v2 인디고(`#5a5fe8` / 다크 `#818cf8`)로 바꿀까? `brand.css` 두 파일 교체 범위다 | **교체.** ADR-006이 v2 DS 전체를 채택했고, 파랑을 남기면 녹색 기운 중성색과 톤이 섞인다. 제품 브랜드 확정 전까지 임시값 |
| Q2 | **주 색 글자 토큰 신설**: `--primary`를 글자로 쓰면 muted 위 4.42, primary 배지 4.45로 미달. `brand.css`에 `--brand-primary-text`(`#4147e5` / 다크 `#949ef9`)를 추가해 링크·primary 배지 글자에 쓸까? (ADR-002 브랜드 토큰 목록에 1개 추가) | **추가.** 대안(주 색 글자를 흰 면에서만 쓰기)은 규칙이 늘고 상세 미리보기 패널·선택 셀에서 깨진다 |
| Q3 | **글자 색이 v2보다 짙어짐**: 캡션 `#66726a` → `#56615a`, 보조 글자 `#5e6b60` → `#4c574e`, 상태 글자 4종도 한 단계씩. 필수 배경 최저 4.6 기준(A11Y-01 방법)을 v2에도 그대로 적용해도 될까? | **적용.** 대안은 fill 알파를 낮춰 배경 집합을 가볍게 하는 것인데, 그러면 hover·눌림 면이 목업보다 흐려져 상태 구분이 약해진다 |
| Q4 | **입력 경계 3:1**: 입력칸·선택 상자·체크박스 테두리(v2 `--border-strong` 1.45)를 WCAG 1.4.11 3:1(`--line-strong` `rgba(31,54,40,.54)`)로 올릴까? v1부터 있던 문제이고, 올리면 입력 테두리가 목업보다 확실히 진해진다 | **컨트롤 3종에만 적용**(구분선·카드 선은 v2 그대로). 원하시면 별도 A11Y 작업으로 분리 |
| Q5 | **모바일 주 메뉴**: v2 모바일(2a-06)은 메뉴가 없다. 탭을 없애면 모바일에서 보관함·비교 보드 진입로가 사라져 헤더 아래 메뉴 한 줄을 두려 한다. 괜찮을까? | **두기**(C-02). 대안은 햄버거 메뉴 — 대화상자·포커스 가둠이 필요해 번들·구현이 커진다 |
| Q6 | **V2-2 분할**: 카탈로그 단계가 가장 크다. Developer 한 턴 예산에 넘치면 V2-2a(셸·필터·정렬·탭) / V2-2b(카드·필)로 나눠도 될까? | **미리 나누기** — 각 단계에서 번들 실측(V2-AC-38)을 따로 하려면 작을수록 좋다 |
