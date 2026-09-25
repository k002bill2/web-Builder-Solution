# DS-1A-03 SPEC — 비교 보드 + 프로필 초안

- 작성: Designer (Hermes) · 2026-09-25 · 브랜치 `k002bill2/ds-1a-03`
- 브리프: `docs/06-handoff/DS-1A-03_DESIGNER_BRIEF.md` · 판단 기준: ADR-003 (기능·흐름 → 사용성 → DS 일관성 → 목업)
- 입력: PRD FR-CMP-01~04·FR-SEL-01·02·06·FR-PRF-01~04 · TRD 4.3·4.4·5·7 · 목업 1a-03(184~229행)·1b-03(459~490행)·`rowDefs`/`cmpCols`/`draft`(612~691행) · 현재 `app/src` · ADR-002·004
- 이 문서는 **설계만** 다룬다. 구현은 Developer가 TDD로 옮긴다. 목업 px는 기준이 아니다.

---

## 0. 한눈에 보기

| 항목 | 결정 |
|---|---|
| 화면 | `/compare` 한 화면. 왼쪽 비교 표, 오른쪽 프로필 초안 패널 (≥1280) |
| 행 | **12행** = FR-CMP-02 10항목 + 카드 스타일 + Footer. 행마다 역할이 `pick`·`global`·`info` 중 하나 |
| 선택 단위 | 표시 문자열이 아니라 **우리 섹션 변형(`type+variant`) 또는 토큰 묶음**에 바인딩 (FR-SEL-02) |
| 템플릿 모드 (FR-SEL-01) | 모드 토글을 두지 않는다. 열 머리글의 **"이 레퍼런스로 전부 선택"** 한 번으로 모든 행을 그 레퍼런스에서 고른다 |
| 확정 최소 조건 | **Hero 1개 선택**. 고르지 않은 행은 Hero를 고른 레퍼런스(기준 레퍼런스)의 값으로 채우고, 초안에 "기본값"으로 보여준다 |
| 저장 | 선택은 바뀔 때마다 자동 저장(`PUT …/picks`). **프로필 확정**은 별도 행동(`POST /profiles` → v1 → `/profile`) |
| 경고 | 보드에서 미리 알리는 규칙은 R-07·R-08·R-12 세 가지. 구조로 보장되는 규칙(R-01·R-02·R-06·R-15)은 경고하지 않는다 |
| 반응형 | ≥1280 표 + 옆 패널 · 768~1279 표(가로 스크롤) + 하단 요약 바 · <768 **항목 아코디언** |
| 새 컴포넌트 | ComparisonTable · ColumnHeader · PickButton · ComparisonAccordion · DraftPanel · DraftItem · CustomStyleFields · DS `Callout` |

---

## 1. 사용자 흐름

### 1.1 진입

| 진입 경로 | 동작 | 도착 상태 |
|---|---|---|
| 카탈로그 하단 트레이 "비교 보드 열기" | `/compare`로 이동 | 트레이에 담긴 순서대로 열이 생긴다 |
| GNB "비교 보드" | `/compare`로 이동 | 현재 보드. 비어 있으면 빈 상태(S-03) |
| 상세의 "비교 추가" | 보드에 추가만 한다(이동하지 않음). 기존 동작 유지 | 상세 사이드바의 안내 문구가 "비교 보드에 담았습니다 · 보드 열기" 링크를 보여준다 |
| 보드의 "레퍼런스 추가" | `/catalog`로 이동 (보관함에 저장한 게 있으면 `/catalog?tab=saved`) | 카탈로그 트레이가 보드와 같은 상태를 보여준다 |

- **트레이 = 보드의 열 목록**이다. 두 개의 상태를 두지 않는다. 지금의 `CompareTrayContext`(id 배열)는 `CompareBoard`의 `columns`로 흡수한다(8절).
- 보드에는 URL 입력·"이 사이트처럼" 기능이 없다(FR-SEL-06). 추가는 항상 카탈로그를 거친다.

### 1.2 보드 안 흐름

```
열 확인 ─▶ 행마다 "이 요소 선택" (또는 열의 "이 레퍼런스로 전부 선택")
        ─▶ 초안 패널에 즉시 반영 · 경고(Callout) 확인 · 대체안 적용
        ─▶ (선택) 사용자 대표색·폰트 입력
        ─▶ "프로필 확정 (v1)" ─▶ /profile/:profileId (1a-04)
```

### 1.3 이탈·복귀

- 선택은 자동 저장되므로 다른 화면으로 가도 잃지 않는다. 돌아오면 같은 선택·같은 열 문자로 복원한다.
- 카탈로그에서 열을 빼거나 더하면 보드에 그대로 반영된다. 뺀 열에서 고른 선택은 해제되고, 돌아왔을 때 초안 패널 상단에 "B를 빼서 Hero·카드 선택이 해제됐습니다" 안내가 한 번 나온다.
- 자동 저장이 실패한 상태에서 이탈하려 하면 막지 않는다. 대신 저장 실패 표시를 남기고, 돌아오면 서버 값 기준으로 복원한 뒤 "저장하지 못한 선택 N개가 있었습니다" 안내를 보여준다. (브라우저 `beforeunload` 대화상자는 쓰지 않는다 — 세션 메모리 단계에서는 효과가 없고, 백엔드 연결 후 재검토.)

### 1.4 다음 단계(1a-04) 연결

- 확정 성공 → `POST /profiles` 응답의 `profileId`로 `/profile/:profileId` 이동. 1a-04는 v1을 연다.
- 확정 뒤에도 보드는 계속 편집할 수 있다. 확정 이후 선택이 바뀌면 초안 태그가 "v1 이후 변경됨"이 되고 버튼이 **"새 버전으로 확정 (v2)"**가 된다(질문 Q3).
- GNB "프로젝트"·"새 프로젝트"와의 관계는 1a-04 범위. 이 화면은 확정 결과 id만 넘긴다.

---

## 2. 정보 구조

### 2.1 화면 영역

| 영역 | 내용 |
|---|---|
| 머리 | `h1` 보드 제목(프로젝트 이름이 있으면 "<이름> · 비교 보드", 없으면 "비교 보드") · 부제 "N / 6개 비교 중 · 항목마다 원하는 요소를 고르면 프로필 초안에 담깁니다" · "레퍼런스 추가" 버튼 · 자동 저장 상태 |
| 비교 표 | 열 = 레퍼런스(최대 6), 행 = 비교 항목 12개 |
| 초안 패널 | 초안 목록 · 사용자 스타일 입력 · 경고 · 확정/비우기 |

### 2.2 열 머리글 (레퍼런스)

`[열 문자] · 제목(2줄까지, 넘치면 말줄임 + title 속성·접근 이름에 전체 제목)` · 업종 · 라이선스 태그 · 대표색 견본 · 버튼 2개:
- **"이 레퍼런스로 전부 선택"** (FR-SEL-01 템플릿)
- **보드에서 빼기** (×, 접근 이름 "<제목> 비교에서 빼기")

**열 문자(A~F)는 보드가 붙인다.** 추가할 때 비어 있는 가장 앞 문자를 준다. 열을 빼도 다른 열의 문자는 바뀌지 않는다. 초안의 "B에서"가 가리키는 대상이 흔들리지 않게 하기 위해서다. 지금 레퍼런스에 고정된 `DesignReference.key`는 보드 표기에 쓰지 않는다(8절).

### 2.3 행 (비교 항목) — 12행

역할:
- `pick` — 열 하나를 고른다. 섹션 변형 또는 컴포넌트 선택값에 바인딩
- `global` — 열 하나를 고르되, 결과가 **테마 전체**에 한 값으로 적용된다(R-06·R-15). 사용자 입력이 있으면 사용자 입력이 우선
- `info` — 비교만 한다. 선택 버튼이 없다. 행 머리글에 "비교 정보" 태그

| # | 행 | 역할 | 셀 표시 예 | 바인딩 → DesignProfile (TRD 4.3) | 근거 |
|---|---|---|---|---|---|
| 1 | Hero 구성 | pick (**필수**) | 풀블리드 이미지 + 좌측 카피 | `component_choices.hero = {section:'hero', variant}` · 기준 레퍼런스 결정 | FR-CMP-02, FR-SEL-02 |
| 2 | 메뉴 구조 | pick | 5개 · 우측 CTA | `component_choices.header = {section:'header', variant}` | FR-CMP-02 |
| 3 | CTA 위치 | pick | 헤더 우측 고정 | `component_choices.cta_placement` (`hero-inline` · `hero-center` · `header-fixed` · `sticky-bottom`) | FR-CMP-02 |
| 4 | 섹션 수 | info | 8개 (펼치면 섹션 순서) | 없음 — `section_plan`은 기준 레퍼런스에서 계산(4.4절) | FR-CMP-02. 섹션 수만 따로 고르면 `section_plan`이 결정되지 않아 선택에서 뺀다 |
| 5 | 팔레트 | global | 견본 5개 + "#8B5E3C · 크림" | `color_tokens` (그 레퍼런스의 역할 팔레트) · 사용자 대표색이 있으면 그것이 우선 | FR-CMP-02, R-06·R-15 |
| 6 | 폰트 | global | Pretendard 700 / 400 | `typography_tokens` (family·weight·scale) · 사용자 폰트가 있으면 우선 | FR-CMP-02, R-06 |
| 7 | 카드 스타일 | pick | 엘리베이티드 · 다크 | `component_choices.card_style = {style, surfaceTone:'light'|'dark'}` | FR-SEL-02 "B의 카드", 시나리오 4단계 |
| 8 | 이미지 비율 | pick | 4:5 | `component_choices.media_ratio` | FR-CMP-02 |
| 9 | 모션 | pick | 중간 | `motion_preset` (매핑: 낮음→L1 · 중간→L2 · 높음→L3를 **L2로 상한 적용**) | FR-CMP-02, TRD 4.3 상한 L2 |
| 10 | 모바일 구조 | pick | 단일 컬럼 · 스티키 CTA | `component_choices.mobile_pattern` | FR-CMP-02 |
| 11 | Footer | pick | 확장형 + 지도 | `component_choices.footer = {section:'footer', variant}` | FR-SEL-02 "C의 Footer", FR-KOR-01 |
| 12 | 접근성·성능 | info | 접근성 96 · 성능 92 (측정일 2026-09-xx) | 없음 | FR-CMP-02 (목업에 없던 항목) |

- 행 순서는 목업을 따르되 **접근성·성능을 맨 끝**에 둔다(선택 행 사이에 정보 행이 끼면 키보드 흐름이 끊긴다. 섹션 수는 목업 위치 유지 — Hero·메뉴·CTA 다음에 구조 요약으로 읽히기 때문).
- 한 행에서 모든 열 값이 같으면 행 머리글 옆에 "모두 같음" 캡션을 붙인다(비교 가치가 낮은 행을 빨리 건너뛰게). 선택은 그대로 가능.
- 값이 없는 셀(레퍼런스에 해당 섹션이 없음)은 "없음"으로 적고 선택 버튼을 보이지 않는다. 빈칸으로 두지 않는다.

### 2.4 초안 패널

위에서 아래로:
1. 제목 "프로필 초안" + 상태 태그(확정 전 · v1 확정됨 · v1 이후 변경됨)
2. 안내 한 줄 + `role="status"` 알림 영역(선택 변경 안내, 시각적으로는 숨김)
3. **초안 목록** — pick·global 행 10개를 행 순서대로. 항목마다 `DraftItem`
   - 고른 항목: 행 이름 · 값 · 출처("A · 모던 카페 브랜드")
   - 고르지 않은 항목: 값 · "기본값 · A" (보조 라벨 색 + "기본값" 텍스트. 색만으로 구분하지 않음)
   - Hero를 고르기 전에는 기본값을 계산할 수 없으므로 "Hero를 먼저 고르세요"
4. **사용자 스타일** (`CustomStyleFields`) — 대표색(hex) · 폰트(허용 목록 Select). 입력이 있으면 팔레트/폰트 항목의 출처가 "사용자"가 된다
5. **경고** — Callout 목록(3절)
6. 버튼 — "프로필 확정 (v1)"(primary, lg) · "초안 비우기"(outline)
   - 확정이 불가능하면 버튼 아래에 이유를 텍스트로 쓴다("Hero를 하나 고르면 확정할 수 있습니다"). `disabled` 대신 `aria-disabled` + 이유 연결(`aria-describedby`)로 포커스 가능하게 둔다

---

## 3. 요소 선택 규칙

### 3.1 기본 규칙

| # | 규칙 |
|---|---|
| P-1 | `pick`·`global` 행마다 **최대 1개**. 같은 행의 다른 열을 누르면 이전 선택이 풀리고 새 선택이 된다 |
| P-2 | 선택된 버튼을 다시 누르면 **해제**된다 |
| P-3 | `info` 행에는 선택 버튼이 없다 |
| P-4 | 값이 "없음"인 셀은 선택할 수 없다 |
| P-5 | "이 레퍼런스로 전부 선택"은 그 열에서 선택 가능한 모든 행을 고른다. 기존 선택을 덮어쓰므로, 이미 다른 열 선택이 1개 이상 있으면 실행 후 "기존 선택 N개를 A로 바꿨습니다 · 되돌리기" 안내를 준다(확인 대화상자 대신 되돌리기) |
| P-6 | 선택은 **레퍼런스 id**로 저장한다(열 문자 아님). 열 문자는 표시용 |
| P-7 | 열을 빼면 그 열에서 고른 선택은 모두 해제되고 알림 영역에 "B를 빼서 Hero·카드 선택이 해제됐습니다"가 나온다 |
| P-8 | 확정 가능 조건은 **Hero 선택 1개**뿐이다(나머지는 3.2 기본값). 경고(3.3)는 확정을 막지 않는다 |

### 3.2 기준 레퍼런스와 기본값 (결정성)

- **기준 레퍼런스 = Hero를 고른 열.** 고르지 않은 `pick`·`global` 행은 기준 레퍼런스의 값으로 채운다.
- 이유: TRD R-02(hero 첫 본문, 1개)와 `section_plan` 계산이 Hero에서 시작하고, "같은 선택 → 같은 프로필"(결정성 원칙)을 지키려면 빈 행의 값이 입력 순서에 따라 달라지면 안 된다.
- 초안에는 기본값 행도 모두 보여준다. 사용자는 확정 전에 적용될 값을 전부 본다(설명 가능성).

### 3.3 조합 규칙 — 보드에서 할 일 (TRD 7절)

| 규칙 | 보드 처리 | 이유 |
|---|---|---|
| R-01 header1·본문5~9·footer1 | **경고 없음 (구조로 보장)** — header·hero·footer가 행당 1개. 본문 수는 기준 레퍼런스 섹션 구성에서 오고, Footer가 기준 레퍼런스에 없으면 선택한 Footer(없으면 기본 `footer/biz-extended`)를 끝에 붙인다 | 한 행 1선택 구조 |
| R-02 hero 첫 본문·1개 | 경고 없음 (구조로 보장) | Hero 행 1선택 |
| R-03·R-04 목적별 필수 섹션 | **보드에서 하지 않음.** 프로젝트 목적 입력이 이 화면에 없다 → 1a-04 lint | 질문 Q2 |
| R-05 인접 배경·풀블리드 연속 | 보드에서 하지 않음 (생성 시 자동 보정) | 자동 보정 규칙 |
| R-06 타입 스케일·radius 테마 단일 | 경고 없음 — 팔레트·폰트를 `global` 행으로 둔 것이 곧 이 규칙 | 구조 |
| **R-07 모션 상한** | **정보 Callout** — 모션 "높음"(L3)을 고르면 "생성 상한이 L2라 '중간'으로 적용됩니다". 확정 가능 | MVP 상한 L2 |
| **R-08 대비 AA** | **경고 Callout + 대체안** (아래 3.4) — 확정은 막지 않는다. 미해결 경고는 1a-04로 넘어가 FR-PRF-02 보정 제안에서 다시 보인다 | FR-SEL-02 "원인·대체안 표시" |
| R-09~R-11·R-13 | 1a-05(편집·게이트) | 콘텐츠가 아직 없다 |
| **R-12 푸터 사업자정보** | **경고 Callout + 대체안** — 고른 Footer에 사업자정보가 없으면 "발행 전에 사업자정보가 있는 푸터가 필요합니다". 대체안: 보드에 사업자정보 Footer가 있는 열이 있으면 "C의 Footer로 바꾸기" 버튼, 없으면 "확정 시 같은 모양의 사업자정보 확장 변형으로 바꿉니다" 안내 | FR-KOR-01, 발행 차단 규칙을 미리 알림 |
| R-14 | 해당 없음 (개발 lint) | |
| R-15 테마 재바인딩 | **정보 한 줄** — 서로 다른 레퍼런스에서 2개 이상 골랐을 때 초안 안내문에 "고른 요소는 모두 초안의 팔레트·폰트로 다시 칠해집니다" | 자동 규칙이라 경고가 아니라 설명 |

### 3.4 대비 검사 (R-08) — 보드에서 계산하는 것

적용될 팔레트(사용자 대표색 또는 팔레트 행의 선택/기본값)로 다음 3가지만 계산한다. WCAG 상대 휘도 공식, 본문 기준 4.5:1.

| ID | 검사 | 대체안 |
|---|---|---|
| C-1 | `on-primary`(흰색) 글자 vs 대표색 — 버튼·CTA·어두운 카드 | "대표색을 대비 4.5:1이 되는 가장 가까운 명도로 보정" 제안(보정값 미리보기 견본 + "보정값 쓰기" 버튼 → 사용자 대표색에 채움) |
| C-2 | 잉크 vs 배경 — 본문 | 1a-04 보정으로 넘김(안내만) |
| C-3 | 카드 스타일이 `surfaceTone:'dark'`이면 카드 글자 vs 카드 표면(재바인딩 후 대표색/잉크) | "밝은 카드로 바꾸기" — 보드에 밝은 카드 열이 있으면 그 열 선택 버튼, 없으면 C-1 보정 제안 |

- Callout 문구 형식: **원인 · 수치 · 대체안**. 예: "F 팔레트 대표색 위 흰 글자 대비가 3.2:1로 기준 4.5:1보다 낮습니다(버튼·어두운 카드). 대체안: 대표색을 4.5:1이 되는 가장 가까운 명도로 보정" + 보정 전·후 견본. (픽스처 실측: F `#D47800` 3.24:1, D `#00A884` 3.03:1, A `#8B5E3C` 5.58:1) 목업처럼 hex만 던지지 않고 **역할 이름 + 견본**을 함께 보여준다.
- 계산 함수는 순수 함수로 둔다(`domain/contrast.ts`) — Vitest로 검증.

### 3.5 사용자 지정 색·폰트

- 위치: **초안 패널 안**(`CustomStyleFields`). 두 값 모두 `global`이라 특정 열에 속하지 않기 때문이다.
- 대표색: `TextField` + 견본. `#RRGGBB`만 허용(zod 검증). 잘못된 값은 저장하지 않고 필드 아래 오류 텍스트(`aria-invalid`, `aria-describedby`). 역할 팔레트 변환은 1a-04(FR-PRF-02). 보드는 대표색 하나만 받는다.
- 폰트: **허용 목록 `Select`** (자유 입력 금지 — TR-POL-05 라이선스, TRD 8절 "폰트 ≤ 2 계열"). 목록 초안: Pretendard · Noto Sans KR · Noto Serif KR (질문 Q4).
- "지우기"로 사용자 값을 빼면 팔레트/폰트 행 선택(또는 기본값)으로 돌아간다.

---

## 4. 상태

| ID | 상태 | 표시 | 가능한 행동 |
|---|---|---|---|
| S-01 | 불러오는 중 | 기존 `LoadingState`("비교 보드를 불러오는 중…", `role=status`). 표 골격(열 수만큼 빈 머리글)은 레이아웃 이동을 막기 위해 선택 | — |
| S-02 | 불러오기 오류 | `RouteErrorBoundary`와 같은 형태(`role=alert`) + "다시 시도" | 다시 시도 · 카탈로그로 |
| S-03 | **빈 보드 (0개)** | 표·초안 패널 없음. 빈 상태 블록: 제목 "비교할 레퍼런스가 없습니다" · 설명 "카탈로그에서 '비교 추가'로 2~6개를 담으면 항목별로 비교할 수 있습니다" | "카탈로그에서 고르기"(primary) · 저장한 게 있으면 "저장한 레퍼런스 N개 보기"(outline, `/catalog?tab=saved`) |
| S-04 | **1개만** | 열 1개짜리 표(값 확인용). 행별 선택 버튼은 숨김. 정보 Callout "하나 더 담으면 항목별로 골라 조합할 수 있습니다" | "레퍼런스 추가" · 열의 **"이 레퍼런스로 프로필 만들기"**(= 전부 선택 + 확정 가능. 템플릿 경로는 1개로도 유효) |
| S-05 | 2~6개 | 기본 화면 | 선택 전부 |
| S-06 | **6개 (가득 참)** | 부제 "6 / 6개 · 가득 참". "레퍼런스 추가"는 `aria-disabled` 상태로 두고 누르면 `COMPARE_LIMIT_NOTICE`를 알림 영역에 표시(기존 문구 재사용) | 열 빼기 |
| S-07 | 7개째 추가 시도 (카탈로그·상세) | 기존 동작 유지 — 추가하지 않고 `COMPARE_LIMIT_NOTICE` | — |
| S-08 | **회수됨** (라이선스 변경·비공개 전환) | 열 머리글에 `Tag tone=red` "사용 불가" + 사유 캡션("라이선스가 바뀌어 더 이상 쓸 수 없습니다"). 셀 값은 흐리게 두되 읽을 수 있게(대비 AA 유지), 선택 버튼 없음. 그 열의 선택은 **자동 해제**되고 경고 Callout "B가 회수되어 Hero·카드 선택을 해제했습니다" | "보드에서 빼기". 회수된 열은 6개 한도에 계속 포함되므로 빼기를 권한다 |
| S-09 | 없는 레퍼런스(삭제됨) | S-08과 같은 모양, 사유 "찾을 수 없는 레퍼런스입니다" | 빼기 |
| S-10 | 선택 없음 | 초안 목록 대신 안내 "항목에서 '이 요소 선택'을 누르면 여기에 담깁니다". 확정 `aria-disabled` + 이유 | 선택 |
| S-11 | 선택 충돌·대비 경고 | 3.3·3.4의 Callout. 경고가 있어도 확정 가능 | 대체안 적용 |
| S-12 | 자동 저장 중 / 저장됨 / 저장 실패 | 머리 오른쪽 캡션: "저장 중…" → "저장됨" → 실패 시 "저장하지 못했습니다 · 다시 시도"(`role=alert`는 실패일 때만) | 다시 시도 |
| S-13 | 확정 중 | 확정 버튼 `aria-busy`, 문구 "확정 중…", 중복 클릭 무시 | — |
| S-14 | 확정 오류 | 패널 상단 `Callout tone=negative`. 코드별 문구: `UNSUPPORTED_COMBINATION` → 원인·대체안, `LICENSE_BLOCKED` → 해당 열을 S-08로 바꿈, `SCHEMA_INVALID`·기타 → "확정하지 못했습니다. 선택은 저장돼 있습니다 · 다시 시도" | 다시 시도 |
| S-15 | 확정됨 (v1) | 성공 즉시 `/profile/:id` 이동. 돌아오면 태그 "v1 확정됨" | 계속 편집 |
| S-16 | 확정 이후 변경됨 | 태그 "v1 이후 변경됨", 버튼 "새 버전으로 확정 (v2)" | 새 버전 확정 |
| S-17 | 초안 비우기 직후 | 모든 선택·사용자 값 해제. 패널에 "선택 N개를 비웠습니다 · 되돌리기"(포커스가 되돌리기로 이동). 다음 선택을 하거나 화면을 떠나면 되돌리기 사라짐 | 되돌리기 |
| S-18 | 긴 이름·긴 값 | 열 제목 2줄 말줄임 + `title`·접근 이름에 전체. **셀 값과 초안 값은 자르지 않고 줄바꿈**(`keep-all` + `overflow-wrap:anywhere` 기존 규칙) | — |

---

## 5. 반응형 (정보 손실 없이)

기준 폭: Tailwind `md`=768, `xl`=1280. 390은 `md` 미만.

### 5.1 ≥1280 — 표 + 옆 패널

```
┌ AppHeader ───────────────────────────────────────────────────────────────┐
├──────────────────────────────────────────────────────┬───────────────────┤
│ h1 비교 보드            [저장됨]      [+ 레퍼런스 추가] │ 프로필 초안 [확정 전]│
│ 3 / 6개 비교 중 · 항목마다 …                          │ ─ Hero  풀블리드… A│
│ ┌──────────┬─────────────┬─────────────┬───────────┐ │ ─ 메뉴  5개…  기본·A│
│ │          │A 모던 카페 ×│B 헤어살롱  ×│C 치과    ×│ │ ─ …               │
│ │          │[전부 선택]  │[전부 선택]  │[전부 선택]│ │ 대표색 [#______]  │
│ ├──────────┼─────────────┼─────────────┼───────────┤ │ 폰트   [Select ▾] │
│ │Hero 구성 │풀블리드…    │스플릿…      │센터…      │ │ ⚠ Callout(대비)   │
│ │          │[✓ 선택됨]   │[이 요소 선택]│[이 요소…] │ │                   │
│ │섹션 수 ⓘ │8            │7            │9          │ │ [프로필 확정 (v1)]│
│ │ …        │             │             │           │ │ [초안 비우기]     │
│ └──────────┴─────────────┴─────────────┴───────────┘ │  (sticky)         │
└──────────────────────────────────────────────────────┴───────────────────┘
```
- 초안 패널은 화면 안에서 `sticky`(표가 길어도 확정 버튼이 보이게).
- 열이 **5개 이상**이면 표 영역만 가로 스크롤. 행 머리글 열은 `sticky left-0`. 스크롤 컨테이너는 `tabIndex=0` + `aria-label="비교 표 (가로로 스크롤)"`(axe `scrollable-region-focusable`), 오른쪽 끝에 넘침 그림자로 더 있음을 알린다.
- 열 최소 폭은 토큰 간격(`--space-*`) 조합으로 정하고, px 목업 값은 따르지 않는다.

### 5.2 768~1279 — 표 + 하단 요약 바

- 표는 같은 구조. 열 3개 이상부터 가로 스크롤 + 고정 행 머리글.
- 초안 패널은 표 **아래**에 전체 폭으로 놓는다. 화면 하단에 `sticky` **요약 바**: "초안 7/10 · 경고 1 · [초안 보기] [프로필 확정]". "초안 보기"는 패널로 스크롤 + 패널 제목에 포커스.

### 5.3 <768 (390) — 항목 아코디언

```
┌ h1 비교 보드 · 3/6 ───────────┐
│ [+ 레퍼런스 추가]              │
│ 열: A 모던 카페 · B 헤어… · C … │ ← 열 목록(가로 스크롤 칩, 빼기·전부 선택은 칩의 메뉴 대신 각 칩 아래 버튼)
│ ▾ Hero 구성 · A 선택됨         │ ← h3 > button[aria-expanded]
│   ┌───────────────────────┐   │
│   │ A 모던 카페 브랜드       │   │
│   │ 풀블리드 + 좌측 카피     │   │
│   │ [✓ 선택됨]              │   │
│   ├───────────────────────┤   │
│   │ B 프리미엄 헤어살롱      │   │
│   │ 스플릿 (카피/이미지)     │   │
│   │ [이 요소 선택]           │   │
│   └───────────────────────┘   │
│ ▸ 메뉴 구조 · 선택 안 함        │
│ ▸ 섹션 수 (비교 정보)           │
│ …                             │
│ ── 프로필 초안 (패널 전체) ──   │
├───────────────────────────────┤
│ 초안 7/10 · 경고 1 [보기][확정]│ ← sticky 요약 바
└───────────────────────────────┘
```
- 표가 아니므로 **표 의미를 쓰지 않는다.** 항목마다 `h3` 안의 펼침 버튼(`aria-expanded`, `aria-controls`) + 펼친 영역 안에 레퍼런스별 선택지 목록(`ul`). 선택 버튼은 표와 같은 `PickButton`.
- 여러 항목을 동시에 펼칠 수 있다. 처음에는 **Hero 구성**만 펼친다(필수 항목). 접힌 머리글에 현재 선택("A 선택됨"/"선택 안 함")을 보여줘 펼치지 않아도 상태를 안다.
- 모든 값은 펼치면 전부 보인다 — 열을 숨기거나 값을 자르지 않는다(정보 손실 0).
- 가로 넘침 0(기존 QA 기준).

---

## 6. 접근성

| # | 요구 |
|---|---|
| A-1 | ≥768에서 비교 표는 `<table>`. `<caption>`(시각적으로 숨김 가능) "레퍼런스 3개, 비교 항목 12개". 레퍼런스 머리글은 `<th scope="col">`, 항목 머리글은 `<th scope="row">` |
| A-2 | 선택 버튼은 네이티브 `<button aria-pressed>`. **접근 이름에 항목과 레퍼런스를 모두 넣는다**: "Hero 구성: A 모던 카페 브랜드의 요소 선택". 표 머리글 읽기에 기대지 않는다(Tab으로 버튼만 이동하는 사용자) |
| A-3 | 선택 표시는 **색만으로 하지 않는다**: 체크 아이콘 + "선택됨" 텍스트 + 굵은 테두리 + 배경(`--status-informative-bg`). 선택 안 된 버튼은 "이 요소 선택" 텍스트 |
| A-4 | 선택·해제·교체·열 빼기·초안 비우기는 초안 패널의 `role="status"`(polite) 영역에 한 문장으로 알린다: "Hero 구성: A → C", "Hero 구성 선택 해제", "B를 빼서 Hero·카드 선택 해제" |
| A-5 | **키보드**: 표의 한 행을 하나의 Tab 정지점으로 둔다(roving tabindex). 행 안에서 ←/→로 열 이동, Home/End로 처음·끝, Space/Enter로 선택. 12행 × 6열 = 72회 Tab을 12회로 줄인다. 행에 들어올 때는 선택된 버튼, 없으면 첫 선택 가능 버튼에 포커스. 기존 `rovingTargetIndex`는 ↑/↓도 이전/다음으로 처리하므로 **가로 전용 변형**(↑/↓ 무시 — 스크린리더 표 탐색과 충돌 방지)을 추가한다 |
| A-6 | 열 머리글 버튼 2개("전부 선택", "빼기")는 일반 Tab 순서. 열을 빼면 포커스는 다음 열의 빼기 버튼 → 이전 열 → "레퍼런스 추가" 버튼 순(트레이 D07과 같은 규칙) |
| A-7 | `/compare` 진입 시 `document.title = "비교 보드 · <브랜드명>"`, 포커스는 `h1`(`tabIndex=-1`). (현재 앱 공통 결함 — 라우트 전환 포커스·제목 미처리 — 을 이 화면에서는 반드시 처리) |
| A-8 | 확정 불가 시 `disabled` 대신 `aria-disabled="true"` + `aria-describedby`로 이유 텍스트 연결. 누르면 이유를 알림 영역에 다시 읽힌다 |
| A-9 | Callout은 `role`을 주지 않은 정적 영역(제목 `h3` 포함). 새로 생긴 경고는 A-4 알림 문장에 "경고 1개 추가"로 함께 알린다. 저장 실패·확정 실패만 `role="alert"` |
| A-10 | 대비: 흐린 셀(회수됨)·보조 라벨·"기본값" 표시도 본문 4.5:1 이상. 포커스 링은 기존 `--focus-ring` |
| A-11 | 아코디언(<768): `h3 > button[aria-expanded][aria-controls]`. 펼친 영역은 `role="region"` + `aria-labelledby` |
| A-12 | 대표색 견본은 장식(`aria-hidden`). 옆에 hex 또는 역할 이름 텍스트가 항상 있다 |

---

## 7. 컴포넌트

### 7.1 재사용 (기존 `app/src/components`)

| 컴포넌트 | 쓰는 곳 |
|---|---|
| `Button` | 레퍼런스 추가 · 전부 선택 · 확정 · 비우기 · 되돌리기 · 다시 시도 |
| `Chip` | `PickButton`이 `aria-pressed` 토글 패턴을 그대로 따른다. 다만 Chip의 선택 스타일(채운 primary 알약)은 표 셀 안에서 너무 무거워 `PickButton`은 자체 스타일(7.2)을 쓴다 |
| `Tag` | 라이선스 · 초안 상태 · "사용 불가" · "비교 정보" · "모두 같음" |
| `Icon` | + 새 아이콘 `check` · `circle-check` · `warning` · `circle-info` · `chevron-down` (핸드오프 번들 `assets/icons/`에 있음, 복사만) |
| `TextField` · `Select` | 사용자 대표색 · 폰트 |
| `LoadingState` · `RouteErrorBoundary` | S-01 · S-02 |
| `rovingFocus.ts` | 가로 전용 변형 추가(A-5) |

### 7.2 새 컴포넌트

| 컴포넌트 | 위치(제안) | props | 상태·토큰 |
|---|---|---|---|
| `Callout` (DS) | `components/ds/Callout.tsx` | `tone: 'info'\|'warning'\|'negative'`, `title: string`, `children`, `action?: ReactNode` | 배경 `--status-*-bg`, 아이콘 색 `--status-*`, 본문 `--label-normal`, 모서리 `--radius-md`. 핸드오프 DS에 있던 컴포넌트를 브랜드 없이 옮김 |
| `CompareBoardPage` | `pages/CompareBoardPage.tsx` | — | 상태 S-01~S-18 분기, 반응형 레이아웃 선택, `React.lazy` 라우트 |
| `ComparisonTable` | `components/compare/ComparisonTable.tsx` | `columns: readonly BoardColumnView[]`, `rows: readonly ComparisonRowView[]`, `picks: Picks`, `onToggle(rowId, referenceId)`, `onRemoveColumn(referenceId)`, `onPickAll(referenceId)` | 행 roving 포커스, 5열 이상 가로 스크롤 컨테이너, 머리글 `--background-alternative`, 선 `--line-neutral`/`--line-alternative` |
| `ColumnHeader` | 같은 폴더 | `column: BoardColumnView`, `canPick: boolean`, `onRemove`, `onPickAll` | 회수됨이면 `Tag tone=red` + 사유. 견본은 데이터 인라인 스타일(`CompareTrayBar`과 같은 방식) |
| `PickButton` | 같은 폴더 | `rowLabel`, `columnLabel`, `referenceTitle`, `pressed: boolean`, `onToggle`, `tabIndex` | 눌림: `--primary` 테두리 2단(`--border-thick`) + `--status-informative-bg` + `check` 아이콘 + "선택됨". 기본: `--line-normal` 테두리 + "이 요소 선택" |
| `ComparisonAccordion` | 같은 폴더 | `ComparisonTable`과 같은 props | <768 전용. A-11 |
| `DraftPanel` | `components/compare/DraftPanel.tsx` | `items: readonly DraftItemView[]`, `status: DraftStatus`, `warnings: readonly BoardWarning[]`, `custom: CustomStyle`, `canConfirm: {ok:true}\|{ok:false, reason:string}`, `onConfirm`, `onClear`, `onUndo?`, `onCustomChange`, `announcement: string` | 배경 `--background-alternative`, 항목 카드 `--surface-elevated`(목업의 `#fff` 대신 토큰). ≥1280 sticky |
| `DraftItem` | 같은 폴더 | `rowLabel`, `valueLabel`, `source: {kind:'pick'\|'default', columnLabel, title} \| {kind:'custom'}`, `swatch?: string` | "기본값" 텍스트 + `--label-alternative`. 값은 줄바꿈(말줄임 금지) |
| `CustomStyleFields` | 같은 폴더 | `value: CustomStyle`, `fonts: readonly FontOption[]`, `onChange`, `error?: string` | zod 검증 결과를 `aria-invalid`로 |
| `DraftSummaryBar` | 같은 폴더 | `pickedCount`, `total`, `warningCount`, `canConfirm`, `onShowDraft`, `onConfirm` | <1280 sticky 하단. 기존 트레이 바와 같은 표면 토큰(`--surface-inverse`) |

- 모든 새 컴포넌트는 hex·px 하드코딩 금지(`noHardcodedStyle.test.ts`). 레퍼런스 색 견본만 데이터 값 인라인 스타일 허용(기존 선례).
- 성능: `/compare` 첫 화면 JS(공통 + 라우트 청크) **≤ 100KB gzip**(ADR-004). 대비 계산·zod 스키마는 이 라우트 청크에만.

---

## 8. 데이터 계약 초안

### 8.1 타입 (TS, `domain/compareBoard.ts` 제안)

```ts
export type ComparisonRowId =
  | "hero" | "menu" | "cta" | "sectionCount" | "palette" | "font"
  | "card" | "imageRatio" | "motion" | "mobile" | "footer" | "quality";
export type RowRole = "pick" | "global" | "info";
export type PickableRowId = Exclude<ComparisonRowId, "sectionCount" | "quality">;

export interface ComparisonRowDef {
  readonly id: ComparisonRowId;
  readonly label: string;          // "Hero 구성"
  readonly role: RowRole;
  readonly required?: boolean;     // hero만 true
}
/** 행 순서·역할의 단일 정의. 화면·검증·프로필 매핑이 함께 쓴다. */
export const COMPARISON_ROWS: readonly ComparisonRowDef[];

/** 셀이 가리키는 우리 쪽 실체. 표시 문자열(label)과 분리한다 (FR-SEL-02). */
export type CellBinding =
  | { readonly kind: "section"; readonly sectionType: "header" | "hero" | "footer"; readonly variant: string }
  | { readonly kind: "choice"; readonly field: "cta_placement" | "media_ratio" | "mobile_pattern"; readonly value: string }
  | { readonly kind: "card"; readonly style: string; readonly surfaceTone: "light" | "dark" }
  | { readonly kind: "palette"; readonly palette: readonly PaletteEntry[] }
  | { readonly kind: "typography"; readonly family: string; readonly headingWeight: number; readonly bodyWeight: number; readonly scale: number }
  | { readonly kind: "motion"; readonly level: MotionLevel };

export interface ComparisonCell {
  readonly label: string;                 // "스플릿 (카피 / 이미지)" · 없으면 "없음"
  readonly binding: CellBinding | null;   // null = 선택 불가(없음·info 행)
  readonly meta?: { readonly hasBusinessInfo?: boolean }; // footer만
}

/** 레퍼런스 1개의 비교 데이터. internal은 composition(PageDoc)에서 계산, licensed는 큐레이터 입력. */
export interface ReferenceComparison {
  readonly referenceId: string;
  readonly cells: Readonly<Record<ComparisonRowId, ComparisonCell>>;
  readonly sectionPlan: readonly { readonly type: SectionType; readonly variant: string }[];
}

export type ColumnLabel = "A" | "B" | "C" | "D" | "E" | "F";
export type ColumnStatus = "available" | "withdrawn" | "missing";

export interface BoardColumn {
  readonly referenceId: string;
  readonly label: ColumnLabel;      // 보드가 부여, 빼도 다른 열은 불변
}
/** 행 → 레퍼런스 id. 열 문자가 아니라 id로 저장 (P-6). */
export type Picks = Readonly<Partial<Record<PickableRowId, string>>>;

export interface CustomStyle {
  readonly primaryColor?: string;   // /^#[0-9A-F]{6}$/i
  readonly fontFamily?: AllowedFontId;
}

export interface CompareBoard {
  readonly id: string;
  readonly projectId?: string;      // Q1
  readonly columns: readonly BoardColumn[];   // ≤ COMPARE_LIMIT, 추가 순서
  readonly picks: Picks;
  readonly custom: CustomStyle;
  readonly confirmed?: { readonly profileId: string; readonly version: number; readonly picksHash: string };
  readonly updatedAt: string;
}
```

- `DesignReference.key`(A~F 고정)는 보드 표기에 쓰지 않는다. 카탈로그 1,000개 규모에서 고정 문자는 성립하지 않는다. 필드 삭제 여부는 Developer 판단(다른 사용처 확인).
- 지금 `CompareTrayContext`의 `tray: string[]`은 `board.columns.map(c => c.referenceId)`로 대체한다. 카탈로그·상세의 `add`/`remove`는 보드 저장소를 호출한다. `addToTray` 한도·중복 규칙과 `COMPARE_LIMIT_NOTICE`는 그대로 쓴다.

### 8.2 저장소 (`data/compareBoardRepository.ts` 제안 — 메모리 구현 먼저, API는 TRD 5절)

| 메서드 | 대응 API | 설명 |
|---|---|---|
| `getBoard(): Promise<CompareBoard>` | (신규) `GET /compare-boards/current` | 현재 사용자 보드. 없으면 빈 보드 |
| `addReference(refId): Promise<AddResult>` | (신규) `POST /compare-boards/{id}/references` | 한도 `COMPARE_LIMIT`·중복·비노출 거부. 비어 있는 가장 앞 문자 부여 |
| `removeReference(refId): Promise<CompareBoard>` | (신규) `DELETE …/references/{refId}` | 그 id의 picks 제거까지 **한 번에**(서버가 정본) |
| `savePicks(picks, custom): Promise<CompareBoard>` | `PUT /compare-boards/{id}/picks` | zod 검증: 행 id·레퍼런스 id가 보드 열에 있는지, 회수된 열 참조 금지, hex 형식 |
| `getComparison(refIds): Promise<readonly ComparisonResult[]>` | `POST /compare` | `ComparisonResult = {referenceId, status: ColumnStatus, reference?: DesignReference, comparison?: ReferenceComparison}` — **회수·없음을 `undefined`로 버리지 않고 상태로 돌려준다** (지금 `getById`+`filter`는 조용히 사라지게 함) |
| `confirmProfile(boardId): Promise<{profileId, version}>` | `POST /profiles` | 서버가 8.3 매핑을 다시 계산·검증. 오류 `UNSUPPORTED_COMBINATION`·`SCHEMA_INVALID`·`LICENSE_BLOCKED` |

### 8.3 초안 → DesignProfile 매핑 (TRD 4.3)

순수 함수 `buildProfileDraft(board, comparisons, rows) → DesignProfileInput`. 같은 입력이면 같은 출력(결정성).

| DesignProfile 필드 | 값 |
|---|---|
| `source_reference_ids` | 선택(기본값 제외)에 쓰인 레퍼런스 id + 기준 레퍼런스, **열 문자 순** 정렬 |
| `visual_direction` · `layout_direction` | 기준 레퍼런스의 `visualTags[0]` · `layoutType` (1a-04에서 수정 가능) |
| `color_tokens` | 사용자 대표색이 있으면 `{ seed: primaryColor }`(역할 팔레트 변환은 1a-04, FR-PRF-02), 없으면 팔레트 행 바인딩의 역할 팔레트 |
| `typography_tokens` | 사용자 폰트 > 폰트 행 바인딩 |
| `spacing_tokens` | 기준 레퍼런스 상세의 `spacing` |
| `motion_preset` | 모션 행: low→L1, mid→L2, high→**L2(상한)** |
| `component_choices` | `hero` · `header` · `footer`(section 바인딩) · `cta_placement` · `card_style` · `media_ratio` · `mobile_pattern` |
| `section_plan` | 기준 레퍼런스의 `sectionPlan`에서 header·hero·footer의 variant를 선택값으로 바꾼다. footer가 없으면 끝에 추가(R-01). **모든 선택이 한 레퍼런스이고 사용자 값이 없으면 그 레퍼런스 `sectionPlan` 그대로**(FR-SEL-01 "같은 섹션 구성") |
| `library_version` | 기준 레퍼런스의 값 |
| `seed` | `picks`·`custom`·열 id 정규화 JSON의 해시(같은 선택 → 같은 seed) |
| (제안) `selection_mode` | `'template' \| 'mix'` — TRD 4.3에 없음. 계측·1a-04 표시용(Q5) |

### 8.4 계측 (PRD 9절)

- `compare_added`(기존) · `element_picked(kind=rowId)` · 추가 제안: `element_unpicked(kind)`, `compare_pick_all`, `profile_saved(version)`는 1a-04와 공유.
- 이벤트에 레퍼런스 제목·사용자 입력 색 외 개인정보 없음(대표색 hex는 넣지 않는다).

### 8.5 데이터 공백 (Developer 확인)

- 지금 `DesignReference`·`ReferenceDetail`에는 메뉴 구조·CTA 위치·카드 스타일·이미지 비율·Footer 변형 속성이 없다. 픽스처 `ReferenceComparison`을 새로 만들어야 한다. 값은 목업 `rowDefs`(A·B·C)를 따르고 D·E·F는 임시값으로 표시.
- 픽스처 `ref-a.sections`에 Footer가 없다(목업 1a-02가 8개만 보여준 탓). 목업 `rowDefs`는 A Footer를 "확장형 사업자정보"로 적고 있다 → `sectionPlan`에 `footer/biz-extended`를 넣는 게 맞다.

---

## 9. 수용 기준 (Given / When / Then)

태그: **[V]** Vitest(DOM·상태·순수 함수) · **[Q]** QA(ego-browser 뷰포트 캡처). jsdom은 레이아웃을 재지 못하므로 폭·스크롤은 [Q].

| # | Given | When | Then | 태그 |
|---|---|---|---|---|
| AC-01 | 보드에 레퍼런스 0개 | `/compare` 진입 | 빈 상태 제목과 "카탈로그에서 고르기" 버튼이 보이고, 표·확정 버튼은 없다 | V |
| AC-02 | 보드에 1개 | 진입 | 표에 열 1개, 행 선택 버튼 0개, "하나 더 담으면" 안내, "이 레퍼런스로 프로필 만들기" 버튼이 있다 | V |
| AC-03 | 보드에 3개 | 진입 | `columnheader` 3개 + 행 머리글 12개(`rowheader`), `info` 행(섹션 수·접근성·성능)에는 선택 버튼이 없다 | V |
| AC-04 | 3개, Hero 미선택 | B 열 Hero 버튼 클릭 | 그 버튼 `aria-pressed=true`, 텍스트 "선택됨", 초안 Hero 항목 출처 "B", 알림 영역 "Hero 구성: B 선택" | V |
| AC-05 | Hero가 B로 선택됨 | C 열 Hero 버튼 클릭 | B 버튼 `aria-pressed=false`, C `true`, 알림 "Hero 구성: B → C" | V |
| AC-06 | Hero가 C로 선택됨 | C 버튼 다시 클릭 | 해제(`false`), 초안 Hero가 "Hero를 먼저 고르세요", 확정 `aria-disabled=true` + 이유 텍스트 | V |
| AC-07 | 3개, 선택 없음 | A 열 "이 레퍼런스로 전부 선택" | 선택 가능한 10행이 모두 A, `buildProfileDraft`의 `section_plan`이 A의 `sectionPlan`과 같다 | V |
| AC-08 | Hero=A, 카드=B | B 열 빼기 | 카드 선택 해제, 알림 "B를 빼서 카드 선택 해제", A·C 열 문자는 그대로 | V |
| AC-09 | Hero=A만 선택 | 초안 확인 | 나머지 9개 항목이 A 값 + "기본값" 텍스트로 표시 | V |
| AC-10 | 같은 `picks`·`custom`·열 | `buildProfileDraft`를 2번 호출 | 두 결과가 깊은 비교로 같고 `seed`도 같다 | V |
| AC-11 | 모션 "높음" 선택 | 초안 매핑 | `motion_preset = 'L2'`이고 정보 Callout "생성 상한이 L2라 '중간'으로 적용됩니다" | V |
| AC-12 | 대표색 `#C9A96E`(흰 글자 대비 4.5 미만) | 사용자 대표색 입력 | 경고 Callout에 수치(`x.x:1`)와 대체안(보정 hex + "보정값 쓰기")이 보이고 확정은 가능 | V |
| AC-13 | Footer를 "미니멀 · 링크만"(사업자정보 없음)으로 선택, C에 사업자정보 Footer 있음 | — | R-12 경고와 "C의 Footer로 바꾸기" 버튼, 누르면 Footer가 C로 바뀜 | V |
| AC-14 | 사용자 대표색에 `abc` 입력 | 포커스 이동 | 저장되지 않고 필드 `aria-invalid=true` + 오류 텍스트 | V |
| AC-15 | 보드 열 B가 저장소에서 `withdrawn` | 진입 | B 머리글에 "사용 불가", B 선택 버튼 0개, B에서 고른 선택이 해제되고 경고 Callout 표시 | V |
| AC-16 | 보드에 6개 | "레퍼런스 추가" 클릭 | 이동하지 않고 알림 영역에 `COMPARE_LIMIT_NOTICE` | V |
| AC-17 | Hero 선택됨 | "프로필 확정 (v1)" | `confirmProfile` 1회 호출(연타해도 1회), 성공 시 `/profile/:id`로 이동 | V |
| AC-18 | 선택 5개 | "초안 비우기" → "되돌리기" | 비운 직후 선택 0 + 포커스가 되돌리기, 되돌리면 5개 복원 | V |
| AC-19 | 3개, 키보드 사용 | Hero 행에 Tab 진입 후 → 두 번, Space | 포커스가 A→B→C, C가 선택됨. 다음 Tab은 다음 행으로(행당 Tab 1회) | V |
| AC-20 | `/compare` 진입 | — | `document.title`이 "비교 보드 · …"이고 포커스가 `h1` | V |
| AC-21 | 6개 · 1280 / 3개 · 768 / 3개 · 390 | 캡처 | 1280: 표 가로 스크롤 + 행 머리글 고정 + 초안 패널 보임. 768: 하단 요약 바. 390: 아코디언, **문서 가로 넘침 0**, 모든 값이 펼침으로 확인 가능 | Q |
| AC-22 | 보드 화면 | DOM 검사 | URL 입력 필드 0개, "레퍼런스 추가"는 `/catalog`로만 간다 (FR-SEL-06) | V |

(22개 — 브리프 10~20 권고보다 2개 많다. AC-21·AC-22는 QA·권리 경계 확인용이라 유지.)

---

## 10. 목업과 다르게 설계한 부분 (ADR-003)

| # | 목업 | 이 설계 | 사유 |
|---|---|---|---|
| D-1 | GNB 옆 "조직 공유" 버튼 | 숨김 | FR-CMP-04는 P1. 권한 모델 없이 버튼만 두면 막다른 길 |
| D-2 | 1b-03의 "템플릿 / 스타일 조합" 세그먼트 | 열 머리글 "이 레퍼런스로 전부 선택" | 모드를 바꾸지 않아도 같은 결과. 1개만 있을 때도 동작(FR-SEL-01) |
| D-3 | 11행(접근성·성능 없음) | 12행, 접근성·성능 `info` 행 추가 | FR-CMP-02가 요구하는 비교 항목 |
| D-4 | 팔레트 선택 불가(`picked=-2`), 사용자 색만 | 팔레트·폰트는 `global` 선택 + 사용자 입력이 우선 | 브랜드 색이 없는 1인 사업자(1차 사용자)도 고를 수 있어야 함. R-06·R-15와 일치 |
| D-5 | 섹션 수·이미지 비율 등 모두 선택 가능 | 섹션 수는 `info` | 섹션 수만 고르면 `section_plan`이 정해지지 않음(결정성) |
| D-6 | 선택 버튼이 `span` | 네이티브 `button[aria-pressed]` + 항목·레퍼런스가 든 접근 이름 | 키보드·스크린리더 |
| D-7 | 선택 표시: 배경 + 아이콘 + "선택됨" | + 굵은 테두리 | 색 의존 줄이기(A-3) |
| D-8 | 초안에 고른 항목만 | 기본값 항목까지 "기본값 · A"로 전부 | 확정 전에 적용될 값을 모두 보여줌(설명 가능성) |
| D-9 | 초안 값 한 줄 말줄임 | 줄바꿈 | 값 식별(B-DET-02와 같은 판단) |
| D-10 | 태그 "저장 전" | 자동 저장 상태와 "확정 전/v1 확정됨/변경됨" 분리 | 선택 저장과 프로필 확정은 다른 행동 |
| D-11 | Callout 1개, "#FFFFFF로 보정" hex 문구 | 규칙별 Callout, 원인·수치·대체안 + 역할 이름·견본, 적용 버튼 | FR-SEL-02 "원인·대체안 표시", 사용자가 hex를 해석하지 않게 |
| D-12 | "초안 비우기" 즉시 실행 | 실행 + 되돌리기 | 파괴적 행동. DS에 대화상자가 없어 되돌리기가 가볍다 |
| D-13 | 레퍼런스 고정 문자(A~F) | 보드가 붙이는 열 문자 | 카탈로그 규모에서 고정 문자 불가, 열을 빼도 출처 표기 유지 |
| D-14 | 1a 표에 열 빼기 없음 | 열 머리글에 빼기(1b-03의 ×를 채용) | 보드 안에서 정리 가능해야 함 |
| D-15 | 사용자 색·폰트 입력 위치 없음(초안 항목만) | 초안 패널 안 입력 영역 | 입력할 곳이 필요. 두 값 모두 전역 |
| D-16 | 1280만 | 768·390 정의(표 가로 스크롤 / 아코디언) | ADR-003 사용성 — 반응형 |
| D-17 | 초안 카드 배경 `#fff`, 선택 셀 `#fff` | `--surface-elevated` · `--background-normal` 토큰 | 하드코딩 금지 |

---

## 11. 질문 (결정 필요)

| # | 질문 | 제안 |
|---|---|---|
| Q1 | 보드의 소유: TRD는 `compare_board.project_id`인데, 비교 시점에는 프로젝트가 없을 수 있다 | MVP는 **사용자당 현재 보드 1개**. 확정할 때 프로젝트를 만들거나 고르고 `project_id`를 붙인다 |
| Q2 | R-03·R-04(목적별 필수 섹션)의 목적 입력은 어디서 받나 | 보드에서는 하지 않는다. 1a-04(또는 1b 브리프 입력)에서 lint |
| Q3 | 확정(v1) 이후 보드 재선택 | 허용하고 "새 버전으로 확정 (v2)". FR-PRF-03 버전 관리와 일치 |
| Q4 | 폰트 허용 목록 | Pretendard · Noto Sans KR · Noto Serif KR (모두 OFL). 법무·라이선스 확인 필요 |
| Q5 | `selection_mode`를 TRD 4.3에 추가할지 | 추가 제안(템플릿/조합 구분이 계측·1a-04 표시에 필요) |
| Q6 | 회수된 레퍼런스로 이미 확정한 프로필(v1)은 | 이 화면 범위 밖. 1a-04에서 "출처 회수됨" 표시 제안 |
