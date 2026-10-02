# DS-M2A-0 설계서 — VS-1 섹션 킷 명세 (실렌더 7변형 · 문의 폼 정적 동작 · 폴백 표식 · 내보내기 차단 문구 · PNG 버튼)

- 책임 Designer · 브리프 `docs/06-handoff/M2A-0_KIT-SPEC_DESIGNER_BRIEF.md` · 시작 커밋 `72fe57f` · 2026-10-03
- 입력이 되는 다음 단계: **M2A-2**(Developer 킷 구현) · M2A-3(PNG·정적 HTML·`UNRENDERED_SECTIONS`) · M2a Designer 시각 QA
- 근거 수준 표기: L1 = 코드·문서 직접 확인 · L2 = 스크립트 계산 · L3 = 추정·제안

## 0. 공통 규약 (7변형 모두에 적용)

### 0.1 이 명세가 다루는 것과 아닌 것
- **킷 = 사용자 사이트의 디자인**이다(ADR-002). 앱 DS 토큰(`--label-*`·`--fill-*`·`ds-*` 클래스)과 킷 토큰을 섞지 않는다. 앱 브랜드·APFS 명칭·`--apfs-*` 0.
- 색·크기는 **역할·단계 이름**으로만 적는다. 실제 값은 프로필 버전에서 킷 토큰 생성기가 만든다(Opus B-2 "프로필마다 달라지는 것은 토큰 값뿐"). hex는 부록 A(대비 계산 근거)에만 있다.
- 모션 없음(VS-1, M2b). 모든 변형은 **정적 상태 하나**만 가진다 → `prefers-reduced-motion`과 충돌할 것이 없다. 킷 CSS에 `transition`·`animation`·`scroll-behavior: smooth` 0.
- 엔진 계약 변경 0: 슬롯 키는 `boundSections.ts`·`bodySections.ts` 그대로. 새 슬롯 0. 슬롯이 없는 글자(폼 필드 이름표 등)는 **킷 고정 문구**로 두고 해당 절에 전부 적는다.

### 0.2 킷 토큰 입력 (렌더 문서가 받아야 하는 값)
M2A-1 브리프의 메시지는 `render{doc, palette}`뿐이다. 킷은 팔레트 밖의 프로필 값도 쓴다 → **M2A-2에서 렌더 메시지에 "킷 토큰 입력"을 더해야 한다(MQ-1)**. 문서가 가리키는 프로필 버전의 적용값(`effectiveProfile`)에서 꺼낸다.

| 입력 | 출처 (L1) | 킷에서 쓰는 곳 |
|---|---|---|
| 팔레트 5역할 `primary · surface · ink · muted · bg` | `color_tokens` (`PaletteRole`, `referenceDetail.ts:4`) | 면·글자·경계 (0.3) |
| 카드 면 톤 `light \| dark` | `component_choices.card_style.surfaceTone` | services 카드 면 (K1-4) |
| 카드 모양 `bordered-lg · bordered-md · elevated · flat` | `component_choices.card_style.style` (`elementLibrary.ts:25`) | 카드 radius·경계 (0.5) |
| 글꼴 계열 | `typography_tokens.family` (허용 목록 3종, `fonts.ts`) | 글꼴 스택 (0.4) |
| 제목·본문 굵기 | `typography_tokens.headingWeight · bodyWeight` | 제목·본문 굵기 |
| 타입 비율 | `typography_tokens.scale` | 타입 단계 (0.4) |
| 섹션 간격 | `spacing_tokens.sectionGap` · 밀도 `adjustments.density` | 간격 단계 (0.5) |
| 이미지 비율 | `component_choices.media_ratio` (`16:9 · 4:5 · 1:1`) | about 이미지 비율 (K1-3) |

- 값이 없으면(조회 전·실패) 킷은 **그리지 않고** 렌더 문서가 `error` 를 보낸다 — 앱 중립색으로 사용자 사이트를 그리면 PNG·HTML에 앱 색이 섞인다. 지금 와이어프레임의 "중립 토큰(앱 색)" 대체(`canvasLayouts.ts` `NEUTRAL`)는 폴백 전용으로 남는다(L3 제안, MQ-1에 포함).

### 0.3 색 역할 · 허용 조합 (대비 = 게이트 "대비 AA" C-1~C-5만)
사용자 사이트 글자 대비는 게이트 R-08이 `checkProfileContrast`(`profileContrast.ts`)의 **C-1~C-5**로만 판정한다(SPEC 2a-05 5.12 · 5.7 마지막 줄). 그러므로 킷은 **이 다섯 조합(과 그 뒤집기 — 대비는 대칭) 밖의 글자/면 조합을 쓰지 않는다.** 이 규칙이 "게이트 통과 = 킷 글자 전부 AA"를 보장한다.

| 검사 | 글자 | 면 | 킷에서 허용되는 쓰임 |
|---|---|---|---|
| C-1 | `on-primary`(고정 흰색 — 팔레트 역할 아님, `contrast.ts` `ON_PRIMARY`) | `primary` | primary 면 위 글자 · **뒤집기**: `on-primary` 면 위 `primary` 글자 |
| C-2 | `ink` | `bg` | 기본 본문 · **뒤집기**: `ink` 면 위 `bg` 글자(footer) |
| C-3 | `ink` | `primary` | **카드 면 톤 `dark`일 때만**(검사가 그때만 돈다) — 어두운 카드 |
| C-4 | `ink` | `surface` | `alt` 톤 섹션 · 밝은 카드 |
| C-5 | `muted` | `bg` | 보조 글자 — **`bg` 면 위에서만** |

**금지 조합 (검사 밖 — 쓰면 게이트를 통과해도 미달일 수 있음)**
- `bg` 글자 on `primary` 면 — 지금 와이어프레임 `ON_PRIMARY = "bg-(--canvas-primary) text-(--canvas-bg)"`(`canvasLayouts.ts`)는 C-1 밖이다. 킷은 따르지 않는다(REPORT "다르게 한 곳").
- `muted` 글자 on `surface`·`primary`·`ink` 면 — `alt` 섹션·카드·footer의 보조 글자는 `ink`(또는 footer는 `bg`)로 두고 위계는 **크기·굵기 단계**로 만든다.
- `primary` 글자 on `bg`·`surface` 면 — 링크·강조 글자 색으로 `primary`를 쓰지 않는다(검사 밖). 링크는 글자색 `ink` + 밑줄(색 하나로 알리지 않기).
- 불투명도 글자(`opacity`·반투명 색) 0 (2a-05 7.2 · C-12 이어받음). 목업 footer `rgba(255,255,255,.6)`는 쓰지 않는다.

**섹션 면 (톤)** — `SectionInstance.tone`은 R-05로 엔진이 정한다(`pageDoc.ts:31`). `base` = `bg` 면, `alt` = `surface` 면(지금 캔버스와 같음, `StructureCanvas.tsx:79` L1). 본문 4변형(about·services·faq·contact)은 **두 톤 모두**의 조합 표를 가진다(각 절 3).

**비글자 경계(WCAG 1.4.11 3:1)** — 입력칸 경계·포커스 링처럼 **알아보는 데 필요한** 경계는 그 면 위 글자와 같은 역할을 쓴다(`bg`·`surface` 위 = `ink`, `ink` 면 위 = `bg`, `primary` 면 위 = `on-primary`) → 위 글자 검사 4.5 이상이 3.0 이상을 보장한다. 장식 구분선(카드 테두리·목록 구분선)은 `muted`도 허용한다(정보 없음 — `bg` 위에서는 C-5로 3.0 이상, `surface` 위는 판정 대상 아님).

**포커스 링(킷 공통)** — `:focus-visible`에 2단 링: 안쪽 간격 = 그 요소가 놓인 면 색, 바깥 = 위 "알아보는 경계" 역할. 두께 = 경계 단계 `stroke-2`(0.5). 링이 `outline`이라 레이아웃이 움직이지 않는다.

### 0.4 글자 단계 (타입 스케일)
- 기준 단계 `t0` = 사용자 브라우저 기본 글자 크기(root). 단계 `tN` = `t0 × scale^N`(scale = 프로필 `typography_tokens.scale`). 값은 킷 토큰 생성기가 계산해 `--site-t*` 변수로 낸다(L3 이름 제안 — M2A-2가 확정).
- 쓰는 단계(7변형 전부 이 안에서):

| 단계 이름 | 넓은 폭(`md` 이상) | 좁은 폭(`md` 미만) | 굵기 | 쓰임 |
|---|---|---|---|---|
| `display` | `t5` | `t3` | 제목 굵기 | hero `h1` |
| `title` | `t3` | `t2` | 제목 굵기 | 본문 섹션 `h2` |
| `subtitle` | `t1` | `t1` | 제목 굵기 | 카드 `h3` · 브랜드 이름 |
| `lead` | `t1` | `t0` | 본문 굵기 | hero 부제 · 섹션 소개 문장 |
| `body` | `t0` | `t0` | 본문 굵기 | 본문 · 답변 · 메뉴 · 버튼 |
| `small` | `t-1` | `t-1` | 본문 굵기 | 사업자정보 · 저작권 · 동의 문구 · 폼 안내 |

- 줄 간격: 제목 단계 = `leading-tight`, 본문 단계 = `leading-normal`(두 이름만). 자간 조정 없음.
- `small`은 `t-1` 아래로 내리지 않는다(읽힘 하한). 사용자 브라우저 확대(텍스트 200%)에서 가로 넘침 0(K-AC-02).
- 글꼴: `font-family` = 프로필 계열 이름 + 시스템 대체(sans 계열은 시스템 sans, serif 계열은 시스템 serif). **VS-1 킷은 `@font-face`·웹폰트 파일을 싣지 않는다**(자체 호스팅 = M2c 제외 범위 · 폰트 RFN 문제 Opus B-2 · TRD 8절 "폰트 ≤ 2계열"). 같은 기기에서 캔버스·PNG·정적 HTML은 같은 스택을 쓰므로 서로 같다. 계열 1개만 쓴다(제목·본문 같은 계열, 굵기로 구분).

### 0.5 간격 · radius · 경계 단계
- 간격 단계 `s1`~`s6` — 기준 = 프로필 `spacing_tokens.grid`(지금 픽스처는 모두 `8pt`)의 배수 단계. 섹션 위아래 안쪽 여백 = `section-gap` = 프로필 `sectionGap` 값 그대로(넓은 폭) · 좁은 폭은 그 절반 단계. 밀도 `compact`면 `section-gap`과 카드 안쪽 여백을 한 단계씩 줄인다(`comfortable` 기본).

| 단계 | 쓰임 |
|---|---|
| `s1` | 아이콘 없는 글자 간 미세 간격(메뉴 항목 사이 구분자 여백) |
| `s2` | 제목 ↔ 부제 · 질문 ↔ 답변 |
| `s3` | 폼 이름표 ↔ 입력칸 · 카드 제목 ↔ 설명 |
| `s4` | 카드 안쪽 여백(좁은 폭) · 폼 필드 사이 · 버튼 안쪽 가로 |
| `s5` | 카드 안쪽 여백(넓은 폭) · 카드 사이 간격 · 머리(제목+소개) ↔ 내용 |
| `s6` | 2단 배치의 열 사이 |
| `section-gap` | 섹션 위아래 안쪽 여백 |
| `gutter` | 페이지 좌우 여백 — 좁은 폭 `s4` · 넓은 폭 `s6` |
| `content-max` | 본문 최대 폭 단계 — 넓은 화면에서 글줄이 너무 길어지지 않게(1280 폭에서 좌우 `gutter`보다 넓을 때만 작동) |

- radius 단계: `r0`(0) · `r1`(작게) · `r2`(크게) · `r-pill`. 카드 모양 → `bordered-lg` = `r2` + 경계 `stroke-1` · `bordered-md` = `r1` + `stroke-1` · `elevated` = `r1` + 그림자 단계 `shadow-1`(경계 없음) · `flat` = `r0` + 위 구분선만. 버튼·입력칸 radius = 카드 모양이 `bordered-lg`면 `r2`, 그 밖 `r1`. 칩·표식 = `r1`.
- 경계 두께 단계: `stroke-1`(가는 선) · `stroke-2`(포커스 링·강조). 그림자 단계 `shadow-1` 하나뿐(색 = `ink` 역할을 옅게 쓴 그림자 — 글자가 아니라 대비 대상 아님).

### 0.6 폭 · 브레이크포인트
- 렌더 문서는 iframe이고 iframe 폭이 미리보기 폭이다(M2A-1 R4) → 킷은 **뷰포트 미디어 쿼리**로 반응한다(컨테이너 쿼리 불필요).
- 이름 2개(TRD 4.4 `supportedBreakpoints` 이름을 따름, 값은 단계 이름으로):
  - `md` = 앱 미리보기 "태블릿" 프레임 폭과 같은 경계(`previewFrame.ts` `FRAME_REM.tablet`). 390 폭은 `md` 미만, 1280·1024 폭은 `md` 이상.
  - `lg` = 편집기 1024 배치 경계와 같은 값. header 메뉴 접힘과 2단↔1단 전환이 여기서 갈린다.
- 검수 폭: **1280**(데스크톱 미리보기 = `lg` 이상) · **390**(모바일 = `md` 미만). **1024**는 `lg` 이상이라 1280 규칙을 그대로 쓰고 `content-max`가 작동하지 않는 폭이다 — 줄바꿈·열 폭만 줄어든다. 768(태블릿)은 `md`~`lg` 사이 규칙(각 절 2).
- 모든 폭에서 가로 넘침 0(`scrollWidth − clientWidth = 0`).

### 0.7 글자 넘침 공통 규칙
- **말줄임(`text-overflow: ellipsis`·`line-clamp`) 금지** — 사용자 사이트에서 글자가 잘리면 정보가 사라지고, PNG·HTML에 잘린 채 나간다. 권장 글자 수 초과는 편집기·게이트가 경고한다(R-13, 2a-05 5.12) — 킷은 **다 보이게 줄바꿈**한다.
- 모든 글자 요소 `overflow-wrap: anywhere`(긴 영문·URL·숫자열이 열을 밀지 않게). `word-break: keep-all`(한글 어절 단위 줄바꿈).
- 상한(`maxLength`)까지 넣어도 레이아웃이 깨지지 않아야 한다(K-AC-03) — 각 절 4의 "상한 글자" 줄이 검사 대상.

### 0.8 빈 슬롯 공통 규칙
- **선택(`required: false`) 슬롯이 비면 그 요소를 DOM에서 뺀다**(빈 `<p>`·빈 칸 0). 남은 요소의 간격은 그대로 이어진다(사이 간격이 두 번 생기지 않게 — 형제 간격 = 부모의 `gap`).
- **필수 슬롯이 비면** 게이트 R-13이 차단한다(2a-05 E-S21). 킷은 편집 중에도 깨지지 않게 그 자리에 **빈 요소를 남기지 않고 생략**한다. 편집기 자리표시 글자("제목을 입력하세요")는 렌더 문서에 넣지 않는다(편집기 UI 0 — 2a-05 5.7 r4.8). 대신 부모 오버레이의 문제 표시가 그 섹션을 가리킨다. [L3 — 2a-05 E-S21의 캔버스 자리표시는 와이어프레임 시절 규칙. M2a에서 자리표시가 사라지는 것은 MQ-4]
- 이미지 슬롯이 꺼짐(`enabled: false`)이면 이미지 칸을 빼고 해당 절의 "이미지 없음" 배치를 쓴다.

### 0.9 이미지 슬롯 공통 규칙
- 출처 우선순위(Fable A-1 · Opus B-3): ① 사용자 로컬 이미지(`LocalImageId`) → 그 이미지 ② 없으면 **토큰 그라디언트 1종**(VS-1 자체 그래픽 최소안, Fable A-4). 대각 줄무늬는 폴백 전용으로 남는다.
- **토큰 그라디언트(VS-1 1종)**: `primary` → `ink` 방향 선형 그라디언트, 각도 = 왼쪽 위 → 오른쪽 아래 한 방향 고정. 두 역할만 쓴다(결정적, FR-GEN-03). 위에 글자를 올리지 않는다(글자 대비 판정 밖이므로). CSS 배경으로 그리고 파일·SVG 0.
- 마크업: 사용자 이미지 = `<img>`(`alt` = 슬롯 `alt`, 장식이면 `alt=""`) + `object-fit: cover` + 비율 상자. 그라디언트 = 비율 상자 `div` + `aria-hidden="true"`(자체 그래픽은 정보 없음 — 슬롯 `alt`가 있어도 읽지 않는다. 사용자가 적은 대체텍스트는 실제 이미지를 넣었을 때 쓰인다). [L3 — MQ-5: 그라디언트일 때 `alt`를 읽힐지]
- 이미지 크기 속성: `<img>`에 `width`·`height` 속성(비율값)을 넣어 자리 이동(CLS) 0. `loading`: hero = 기본(즉시), 그 밖 = `lazy`.
- `srcset`·AVIF/WebP 파생은 M2c(브라우저 재인코딩) — VS-1은 고른 원본 1장.

### 0.10 링크 대상 규칙 (빈 링크 0)
- 킷 출력에 `href="#"`·빈 `href`·`javascript:` 0(K-AC-05). 대상이 없는 항목은 **링크가 아닌 글자**로 그린다.
- 섹션 앵커: 각 섹션 루트에 `id="s-<instanceId>"`(문서 안에서 유일, 엔진 id 그대로 — 개인정보 아님).
- 메뉴(header `nav` 슬롯)·하단 링크(footer `links` 슬롯) 나누기: 슬롯 글자를 가운뎃점 `·` 로 나눈 뒤 각 조각 앞뒤 공백 제거, 빈 조각 버림, 순서 유지. 항목이 1개뿐이어도 목록(`ul`)이다.
- 메뉴 항목 대상: 조각 글자가 문서 안 **본문 섹션의 `heading` 슬롯 글자와 정확히 같으면**(앞뒤 공백 제거 후 비교, 첫 일치) 그 섹션 앵커로 링크. 아니면 링크 아닌 글자. [L3 — 슬롯에 대상이 없어서 생긴 규칙. MQ-2]
- CTA(header `cta` · hero `cta`) 대상: 문서의 **첫 `contact` 섹션** 앵커. 없으면 footer 앵커(`id="s-<footer instanceId>"`). footer도 없으면(게이트 R-01 차단 상태) 링크 아닌 버튼 모양 글자.
- footer 하단 링크 조각: 대상 슬롯이 없으므로 **VS-1은 전부 글자 항목**(약관 페이지가 아직 없다). [MQ-2]

### 0.11 킷 상호작용 (B-1-9)
- 킷 파일에 `useState`·`useReducer`·`useEffect`·이벤트 핸들러 prop(`onClick` 등) 0. 상호작용은 **네이티브 HTML만**: `details/summary`(faq) · `popover` 속성 + `popovertarget`(header 모바일 메뉴) · `fieldset disabled`(contact). 공용 바닐라 스크립트는 VS-1에서 **조작 1개**만 둔다 — header 메뉴 시트 안 앵커를 누르면 시트를 닫는다(K1-1 6). 스크립트가 없어도 기능은 유지된다.
- 정적 HTML에서 같은 동작이 나야 한다(FR-PUB-03): 위 셋은 스크립트 없이 동작한다.
- 캡처·내보내기 때 상태: `details` = 닫힘(마크업에 `open` 0), `popover` = 닫힘. 캔버스에서 사용자가 연 상태는 PNG·HTML 결과를 바꾸지 않는다 — 캡처·직렬화는 렌더 문서를 **새로 그린 마크업**에서 뜬다(M2A-3 구현 조건, K-AC-06).

### 0.12 섹션 루트 공통
- 문서 뼈대: `<body>` 바로 아래 `<header>`(banner) · `<main>`(hero·본문 섹션·폴백 섹션 전부) · `<footer>`(contentinfo) — 랜드마크가 `main`·`section` 안에 들어가지 않게.
- 루트 요소: header → `<header>`, footer → `<footer>`, 본문·hero → `<section aria-labelledby="<제목 id>">`. 루트에 `id="s-<instanceId>"`, `data-section="<type>/<variant>"`(검사·QA용 — 편집기 UI 아님).
- 내용 폭: 루트는 전체 폭(면 색), 안쪽 래퍼가 `content-max` + 좌우 `gutter`.
- 헤딩 수준은 섹션 정의(`a11y.headingLevel`)를 따른다: hero `h1` · 본문 `h2` · header/footer 헤딩 없음. 카드 제목은 `h3`(섹션 정의 밖 하위 제목 — R-10 대상 아님, 건너뛰기 없음).

## 1. K1 — 실렌더 7변형

(각 절: 1 구조 · 2 반응형 · 3 토큰 대응 · 4 빈 슬롯·긴 글자 · 5 이미지 · 6 상호작용 · 7 모션)

### K1-1. `header/sticky-right-cta` — 상단 고정 · 오른쪽 CTA
슬롯(L1 `boundSections.ts`): `brand`(short 24, 필수) · `nav`(link 80, 필수, 권장 60) · `cta`(link 16, 필수, 권장 10). 헤딩 없음(`HEADING.header = null`).

**1. 구조**
```
<header id="s-<id>" data-section="header/sticky-right-cta">     ← position: sticky, 맨 위
  <div 바>                                                      ← content-max + gutter
    <p 브랜드>{brand}</p>                                       ← 링크 아님(0.10 — 대상 없음)
    <nav aria-label="주 메뉴" 넓은폭용>  <ul><li>{항목}</li>…</ul>  </nav>   ← lg 이상만 보임
    <a CTA href="#s-<첫 contact>">{cta}</a>                     ← md 이상 바에 보임
    <button type="button" popovertarget="m-<id>">메뉴</button>  ← lg 미만만 보임
  </div>
  <div id="m-<id>" popover>                                    ← lg 미만 메뉴 시트
    <button type="button" popovertarget="m-<id>" popovertargetaction="hide">닫기</button>
    <nav aria-label="주 메뉴" 좁은폭용>  <ul><li>{항목}</li>…</ul>  </nav>
    <a CTA>{cta}</a>                                            ← md 미만에서만(바에서 빠진 CTA)
  </div>
</header>
```
- 메뉴 목록을 **두 벌**(바 안 · 시트 안) 둔다. 닫힌 `popover`는 UA 스타일로 `display: none`이라 한 `nav`를 넓은 폭 인라인과 좁은 폭 시트에 같이 쓸 수 없다. 폭마다 한 벌만 보이고 다른 벌은 `display: none` → **접근성 트리의 `nav` 랜드마크는 늘 1개 이하**(K-AC-10).
- 항목 = 0.10 나누기 규칙. 각 항목 = `<a href="#s-…">`(일치하는 본문 섹션 있음) 또는 `<span>`(없음).
- 킷 고정 문구: "메뉴" · "닫기" · `nav` 이름 "주 메뉴".
- 고정(sticky): 루트 `position: sticky; top: 0` + 쌓임 단계 `z-header`(킷 안 최상단 1개). 모든 섹션 루트에 `scroll-margin-top` = header 바 **두 줄 높이** 단계(메뉴가 넓은 폭에서 두 줄로 접혀도 앵커 이동한 제목이 가려지지 않게 — WCAG 2.4.11).

**2. 반응형**
| 폭 | 바 | 메뉴 | CTA |
|---|---|---|---|
| `lg` 이상 (1280·1024) | 한 줄: 브랜드(왼쪽) · 메뉴(가운데~오른쪽, 남는 폭 차지) · CTA(오른쪽 끝) | 인라인 목록, 항목 사이 `s4`. 넘치면 목록 안에서 줄바꿈(`flex-wrap`), 브랜드·CTA는 줄지 않음 | 바 오른쪽 끝 |
| `md`~`lg` (768) | 브랜드 · CTA · "메뉴" 버튼 | 시트(접힘) | 바 |
| `md` 미만 (390) | 브랜드(왼쪽) · "메뉴" 버튼(오른쪽) | 시트(접힘) | **시트 맨 아래**로 이동 — 브랜드 24자 + CTA + 버튼을 한 줄에 둘 수 없음 |
- 시트 배치: 화면 맨 위에 붙은 전체 폭 판(`position: fixed`, 위·좌·우 0) — 앵커 위치 지정(anchor positioning)에 기대지 않는다. 안쪽: "닫기"(오른쪽 위) → 메뉴 세로 목록(항목마다 한 줄, 누름 영역 높이 = 최소 조작 크기 단계 `hit-min`) → CTA(전체 폭).
- `hit-min` = WCAG 2.5.8 최소 크기 이상 단계(앱 6.6 조작 크기 규칙과 같은 기준 — 값은 킷 토큰). 메뉴 항목·버튼·CTA 모두 적용.

**3. 토큰 대응**
| 요소 | 면 | 글자 | 경계 | 단계 | 대비 검사 |
|---|---|---|---|---|---|
| 바 · 시트 | `bg` | — | 아래 구분선 `muted` `stroke-1`(장식) | — | — |
| 브랜드 | `bg` | `ink` · 제목 굵기 | — | `subtitle` | C-2 |
| 메뉴 항목(링크·글자) | `bg` | `ink` · 본문 굵기, 링크는 밑줄(hover·기본 모두) | — | `body` | C-2 |
| CTA | `primary` | `on-primary` · 제목 굵기 | 없음(면 색) | `body` · 안쪽 `s2`×`s4` · radius 0.5 | C-1 |
| "메뉴"·"닫기" 버튼 | `bg` | `ink` | `ink` `stroke-1`(알아보는 경계) | `body` | C-2 (경계 3:1도 C-2로 보장) |
| 시트 그림자 | — | — | `shadow-1` | — | — |
| 포커스 링 | 면 색 간격 | — | `bg` 위 = `ink` · CTA = 바깥 `ink`(링이 `bg`와 맞닿음) | `stroke-2` | C-2 |

**4. 빈 슬롯 · 긴 글자** (세 슬롯 모두 필수 — 빈 값 = 게이트 R-13 차단, 킷은 0.8대로 생략)
- `nav` 빈 값 → 넓은 폭 `nav`·"메뉴" 버튼·시트 메뉴 모두 생략(빈 랜드마크 0). 시트에 CTA만 남는 좁은 폭에서는 "메뉴" 버튼을 남기지 않고 CTA를 바에 둔다.
- `cta` 빈 값 → CTA 생략, 바 배치는 그대로.
- `brand` 상한 24자: 390에서 두 줄까지 줄바꿈(말줄임 금지, 0.7). "메뉴" 버튼은 줄지 않고 브랜드가 줄바꿈한다.
- `nav` 상한 80자: 1280·1024에서 메뉴가 두 줄 이상이면 바 높이가 늘어난다(허용) — 앵커 여백은 두 줄 기준(1 구조). 세 줄 이상은 권장 60자 초과 경고(R-13)로 사용자에게 알린다.
- `cta` 상한 16자: 버튼 안 줄바꿈 허용, 390 시트에서는 전체 폭이라 한 줄.

**5. 이미지 슬롯** — 해당 없음: 이 변형은 이미지 슬롯이 없다(`slots: [brand, nav, headerCta]`). 로고 이미지는 슬롯이 없어 VS-1 범위 밖(새 슬롯 금지).

**6. 상호작용 (네이티브 HTML)**
- **선택: `popover`(근거).** `details` 대비 ① Esc·바깥 누르기 닫힘이 공짜(light dismiss) ② 최상위 층(top layer)이라 sticky header의 쌓임·잘림 문제 0 ③ 열려도 문서 흐름을 밀지 않는다. `details`는 열면 sticky header 높이가 늘어 본문을 가리고 Esc 닫힘이 없다.
- 버튼 `popovertarget` → 브라우저가 `aria-expanded`·`aria-details` 연결을 자동으로 준다(React 상태 0). 열림 = 포커스는 버튼에 남고 Tab 다음이 시트 첫 요소("닫기")다(popover 기본 순서). 닫힘(Esc·"닫기"·바깥) = 포커스가 버튼으로 돌아온다(브라우저 기본).
- **시트 안 앵커 링크를 누르면 시트가 닫혀야 한다** — 네이티브만으로는 닫히지 않는다(링크는 `popovertarget`을 가질 수 없음). 그래서 **킷 공용 바닐라 스크립트 1개**(B-1-9 허용 범위)가 "시트 안 `a[href^="#"]` 누름 → 그 시트 `hidePopover()`" 한 가지만 한다(조작 1개, 상태 저장 0). 스크립트가 없어도(정적 HTML에서 막힘) 링크 이동은 되고 시트는 Esc·바깥 누르기로 닫힌다 — 기능 손실 없음.
- `popover` 미지원 브라우저: 시트의 `position: fixed`·숨김 규칙을 `:popover-open` 선택자 안에만 두고, "메뉴" 버튼은 `@supports selector(:popover-open)`일 때만 보인다 → 미지원이면 시트 목록이 바 아래 일반 흐름 목록으로 늘 보인다(기능 유지).
- 편집기 캔버스: 렌더 문서 안 링크 누름의 기본 이동은 렌더 문서 다리(킷 밖)가 막고 `click{instanceId}`로 바꾼다(M2A-1 R3) — 킷은 관여하지 않는다.

**7. 모션** — 없음. 시트 열림·닫힘 전환 효과 0, `scroll-behavior` 기본(즉시). 정적 상태 = 바 + 닫힌 시트.

### K1-2. `hero/fullbleed-left` — 풀블리드 이미지 + 왼쪽 카피
슬롯(L1): `title`(short 40, 필수, 권장 28) · `subtitle`(long 120, 권장 80) · `cta`(link 16, 필수, 권장 10) · `image`(이미지, 대체텍스트 120). `fullBleed: true` · 헤딩 `h1`.

**1. 구조**
```
<section id="s-<id>" data-section="hero/fullbleed-left" aria-labelledby="h-<id>">   ← 전체 폭, 한 칸 그리드(층 2개)
  <div 카피 래퍼>                                 ← content-max + gutter, 층 위
    <div 카피 패널>                               ← 단색 primary 면
      <h1 id="h-<id>">{title}</h1>
      <p 부제>{subtitle}</p>
      <a CTA href="#s-<첫 contact>">{cta}</a>
    </div>
  </div>
  <img | div 그라디언트 aria-hidden>             ← 미디어 층(섹션 전체를 덮음), DOM은 카피 뒤
</section>
```
- **글자는 늘 단색 패널 위에 있다** — 이미지·그라디언트 위에 글자를 직접 올리지 않는다. 사진 위 글자 대비는 게이트가 판정할 수 없기 때문이다(0.3). 목업(2a-05 캔버스 240~244행)은 색 면 위에 카피를 바로 올렸지만, 그 면이 이미지가 되면 판정이 불가능해진다 → 패널로 바꿈(REPORT "다르게 한 곳").
- DOM 순서 = 카피 → 미디어(제목이 먼저 읽힌다). 미디어는 포커스 요소가 없어 좁은 폭에서 위로 올려 보여도 Tab 순서가 바뀌지 않는다.
- 높이 단위에 `vh`·`dvh`·`svh` 0 — PNG 전체 길이 캡처 때 렌더 문서 높이를 콘텐츠 높이로 늘리면(Opus B-4) 뷰포트 단위 높이가 함께 커진다(K-AC-07). 높이는 비율(`aspect-ratio`)과 내용으로만 정한다.

**2. 반응형**
| 폭 | 배치 |
|---|---|
| `lg` 이상 (1280·1024) | 섹션 = 비율 16:9의 최소 높이(내용이 더 길면 늘어남). 미디어가 섹션 전체를 덮고, 카피 패널은 왼쪽 아래(목업 위계: 아래 정렬) · 폭 = 내용 폭의 절반 단계(12칸 중 6칸) · 섹션 위아래 `section-gap` 안쪽 |
| `md`~`lg` (768) | 같은 층 배치, 패널 폭 = 12칸 중 8칸 |
| `md` 미만 (390) | **두 단 쌓기**: 미디어 띠(비율 4:3, 전체 폭) 위 → 카피 패널(전체 폭, 가장자리까지 — 좌우 `gutter`는 패널 안쪽 여백) 아래 |

**3. 토큰 대응**
| 요소 | 면 | 글자 | 경계 | 단계 | 대비 검사 |
|---|---|---|---|---|---|
| 카피 패널 | `primary` | — | 없음 | 안쪽 `s5`(넓은 폭) · `s4`(좁은 폭) · radius `r0`(좁은 폭) / 0.5 버튼 radius와 같은 단계(넓은 폭) | — |
| 제목 `h1` | `primary` | `on-primary` · 제목 굵기 · `leading-tight` | — | `display` | C-1 |
| 부제 | `primary` | `on-primary` · 본문 굵기 | — | `lead` | C-1 |
| CTA | `on-primary` | `primary` · 제목 굵기 | 없음 | `body` · 안쪽 `s2`×`s4` | C-1 뒤집기 |
| 미디어(그라디언트) | `primary` → `ink` | — | — | — | 글자 없음 |
| 포커스 링(CTA) | 간격 `primary` | — | 바깥 `on-primary` `stroke-2` | — | C-1 |
- 섹션 톤(`base`/`alt`)은 hero 모양에 영향 없음(패널·미디어가 면을 다 덮는다).

**4. 빈 슬롯 · 긴 글자**
- `subtitle` 빈 값 → 부제 `<p>` 생략, 제목 ↔ CTA 간격 = `s4`.
- `image` 꺼짐(`enabled: false`) → 미디어 층 생략, 섹션 면 = `primary` 단색(패널과 같은 면 — 목업 모양과 같아진다). 좁은 폭의 미디어 띠도 생략.
- `title`·`cta` 빈 값 → 0.8 생략(게이트 R-13 차단).
- 상한 글자: `title` 40자 = `display`에서 넓은 폭 패널 3줄 안팎 · 좁은 폭 4줄 안팎 [L3] · `subtitle` 120자 = 줄바꿈. 말줄임 금지(0.7). 패널은 내용만큼 늘고, 섹션 최소 비율보다 길어지면 섹션이 늘어난다.

**5. 이미지 슬롯**
- 사용자 로컬 이미지 → `<img alt="{alt}">`(장식이면 `alt=""`) · `object-fit: cover` · 가운데 기준 자르기 · `fetchpriority="high"`, `loading` 기본(즉시 — 첫 화면 요소).
- 없음(플레이스홀더 출처) → 토큰 그라디언트(0.9), `aria-hidden="true"`.
- 비율: 넓은 폭 = 섹션 비율 16:9(이미지는 섹션을 덮도록 잘림) · 좁은 폭 = 4:3 띠. 프로필 `media_ratio`는 hero에 쓰지 않는다(풀블리드는 섹션 모양이 비율을 정한다).

**6. 상호작용** — CTA 앵커 링크 1개(0.10). 그 밖 없음. React 상태 0.

**7. 모션** — 없음(엔진 상한 L2지만 VS-1은 M2b 전 정적). 패럴랙스·확대 효과 0.

## 2. K2 — `contact/form` 정적 내보내기 동작

## 3. K3 — SPEC r4.8이 넘긴 항목

## 4. K4 — 수용 기준 · 시각 QA

## 부록 A. 대비 계산 근거 (L2)

## 변경 이력
| 판 | 내용 |
|---|---|
| r0 | 골격 + 0절 공통 규약 |
