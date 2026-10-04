# DS-M2B-0A 설계서 — 킷 명세: 바깥 11변형 (header 3 · hero 5 · footer 3) + 루브릭

- 책임 Designer · 브리프 `docs/06-handoff/M2B-0A_KIT-SPEC-BOUND_DESIGNER_BRIEF.md` · 계획 `docs/04-plan/M2B_PLAN.md` · 시작 커밋 `a3bd614` · 2026-10-04
- 입력이 되는 다음 단계: **M2B-1**(Developer 바깥 11변형 구현) · M2B-6(QA 루브릭 대조)
- 근거 수준: L1 = 코드·문서 직접 확인 · L2 = 스크립트 계산 · L3 = 추정·제안
- 병렬 레인 M2B-0B(본문 12변형)는 `SPEC-BODY.md`가 맡는다. 이 문서는 그 파일을 참조하지 않는다.

## 0. 상속 · 이 문서의 표기

### 0.1 상속 (다시 쓰지 않는다)
- **`docs/design/m2a/SPEC.md` 0절 공통 규약 0.1~0.12 전체를 그대로 따른다.** 색 허용 조합 C-1~C-5(0.3) · 글자 단계(0.4) · 간격·radius·경계 단계(0.5) · `md`·`lg` 경계(0.6) · 말줄임 금지(0.7) · 빈 슬롯 생략(0.8) · 이미지 출처·그라디언트 1종(0.9) · 링크 대상(0.10) · 네이티브 상호작용(0.11) · 섹션 루트(0.12).
- 정적 HTML 스크립트는 **2a-05 SPEC r4.12 고정 인라인 스크립트 1개만**(메뉴 시트 `[popover]` 안 같은 문서 앵커 → `hidePopover()`). 이 문서의 11변형은 **그 스크립트를 바꾸지 않고** 동작한다 — 새 변형의 시트도 `[popover]` 안 `a[href^="#"]` 구조를 지킨다.
- 같은 유형의 구현된 변형(L1 `app/src/kit/`)을 기준으로 **차이만** 적는다: header 기준 = K1-1 `sticky-right-cta` · hero 기준 = K1-2 `fullbleed-left` · footer 기준 = K1-7 `biz-extended`. "K1-x와 같음"은 그 절의 규칙을 그대로 쓴다는 뜻이다.
- m2a MQ-1~5는 m2a 번호 그대로 인용한다("m2a MQ-2"). 이 문서의 새 질문은 **MQ-B1…** 로 구분한다.
- 이 문서의 수용 기준 번호는 **KB-AC-01…**(빈 번호 없음). m2a `K-AC-01~36`의 공통 기준(01~07 · 09 · 11 · 36)은 11변형에도 그대로 적용한다(4.1).
- 폭은 "1280 폭"처럼 적는다. 값(hex·길이 단위)은 쓰지 않는다 — 대비 근거는 부록 A가 m2a 부록 A를 인용한다.

### 0.2 M2B-1이 함께 바꿀 킷 내부 (엔진 계약 변경 0 · 새 슬롯 0)
| # | 바꿀 곳 | 내용 | 쓰는 변형 |
|---|---|---|---|
| D-1 | `kit/types.ts` `KitLinks` · `kit/text.ts` `kitLinks(doc)` | **`heroTop` 추가** — 문서의 첫 본문 섹션이 hero이면 그 변형·이미지 켜짐·톤에서 "hero 맨 위 면"(`primary` · `bg` · `surface` · `media`)을 계산해 넘긴다(B-3 표). hero가 아니거나 폴백이면 값 없음. 문서 데이터만 읽는다(DOM 탐색·`:has()` 0 → [U] 검증 가능, 캔버스·정적 HTML 같은 결과) | header `transparent` |
| D-2 | `kit.css` header 규칙 | 기존 `.kit-menu-button`·`.kit-sheet` 의 `lg` 이상 숨김(K-AC-35)은 `sticky-right-cta` 전용으로 남기고, 새 변형은 **변형 범위 선택자**(`[data-section="header/…"]` 또는 변형 클래스)로 덮어쓴다 | header 3 |
| D-3 | `kit.css` 문서 수준 1줄 | `sticky-two-tier`가 있을 때 섹션 루트 `scroll-margin-top`을 한 단계 키운다(B-2 1) | header `sticky-two-tier` |
| D-4 | `kit/registry.ts` | 11쌍 등록. 등록 전 쌍은 지금처럼 폴백 + 표식 | 전부 |
- D-1은 킷 내부 props 확장이라 m2a 0절 위반이 아니다. M2B-1 REPORT 변경 목록에 한 줄 남긴다.

### 0.3 루브릭(B2) 형식 — TR-POL-04
- 표마다 ①~⑧(Jarvis 최소 기준) + ⑨ **데이터 계약**(엔진 슬롯 그대로 · 새 슬롯 0) + ⑩ **내보내기 동일성**(캔버스 = PNG = 정적 HTML, r4.12 밖 스크립트 0). 판정 = PASS / 주의 + 한 줄 근거.
- ⑦ 독자성: 이 문서는 외부 사이트를 보지 않고 썼다(GDWEB·dbcut 접속 0). 모든 배치는 일반 레이아웃 원칙에서 나왔고 외부 이미지·문구·구체 수치 0.
- ⑧ 근거 3개는 일반 근거만 쓴다: (가) 교과서적 레이아웃 원칙(시선 흐름·근접·정렬·위계), (나) WCAG 2.2 성공 기준 번호 · HTML 명세 요소 의미, (다) 내부 카탈로그 필드(L1 `domain/reference.ts`: `layoutType` = `fullbleed · split · center · grid · text · image` — hero 6변형과 같은 어휘 · `purpose` = `booking · inquiry · sales` · `industry` 7종 · `visualTags`)와 섹션 라이브러리 이름표(L1 `domain/sectionLibrary.ts`).

### 0.4 톤 사실 (L1 — 표를 줄이는 근거)
- 엔진은 섹션을 모두 `base`로 만든 뒤 `normalizeDoc`(R-05)이 **앞 섹션과 같은 톤만 뒤집는다**(`engine/doc/createDocFromCandidate.ts` · `engine/ops/normalize.ts`). header가 첫 섹션이면 hero는 보통 `alt`(면 `surface`)다. 사용자가 섹션을 지우거나 옮기면 `base`도 된다 → **섹션 톤을 따르는 hero 변형은 두 톤 표를 모두 가진다.**
- header·footer 킷은 섹션 톤을 쓰지 않는다(K1-1 · K1-7과 같음).

---

## 1. header — 3변형 (기준 K1-1)

### B-1. `header/sticky-hamburger` — 고정 헤더 · 햄버거 메뉴
슬롯(L1 `boundSections.ts`): `brand`(short 24, 필수) · `nav`(link 80, 필수, 권장 60). **CTA 슬롯 없음.** 헤딩 없음.

**1. 구조**
```
<header id="s-<id>" data-section="header/sticky-hamburger">      ← sticky, 맨 위 (K1-1과 같음)
  <div 바>                                                       ← content-max + gutter
    <p 브랜드>{brand}</p>
    <button type="button" popovertarget="m-<id>">메뉴</button>   ← 모든 폭에서 보임
  </div>
  <div id="m-<id>" popover>                                      ← 모든 폭의 메뉴 시트
    <button type="button" popovertarget="m-<id>" popovertargetaction="hide">닫기</button>
    <nav aria-label="주 메뉴">  <ul role="list"><li>{항목}</li>…</ul>  </nav>
  </div>
</header>
```
- K1-1과 달리 **메뉴 목록은 한 벌**(시트 안)뿐이다. 바에 인라인 메뉴가 없으므로 닫힌 상태의 `navigation` 랜드마크 = 0, 열린 상태 = 1.
- 고정 문구·항목 나누기·sticky·`scroll-margin-top`은 K1-1과 같다(바가 한 줄이라 두 줄 여백은 넉넉한 쪽).
- 시트는 기존 `kit-sheet`·`kit-menu-button`·`kit-close` 모양을 재사용하되, `lg` 이상 숨김 규칙을 **이 변형에서 덮어쓴다**(0.2 D-2).

**2. 반응형**
| 폭 | 바 | 시트(열렸을 때) |
|---|---|---|
| `lg` 이상 (1280) | 브랜드(왼쪽) · "메뉴"(오른쪽 끝) | **오른쪽 위 판** — 위·오른쪽 0, 폭 = 12칸 중 4칸, 높이 = 내용만큼. 항목 세로 목록(`hit-min`) |
| `md`~`lg` (768) | 같음 | 오른쪽 위 판, 폭 = 12칸 중 6칸 |
| `md` 미만 (390) | 같음(브랜드 2줄까지 줄바꿈, 버튼은 줄지 않음) | 위·좌·우 0 전체 폭 판(K1-1과 같음) |
- 폭 전환: 시트를 연 채 폭을 바꿔도 시트는 열린 채 판 모양만 바뀐다(어느 폭이든 메뉴는 시트 한 벌 — K-AC-35 같은 숨김 전환이 필요 없다).

**3. 토큰 대응** — K1-1 3과 같음(바·시트 `bg` · 브랜드 `ink` C-2 · 메뉴 항목 `ink` + 링크 밑줄 C-2 · 버튼 경계 `ink` · 시트 `shadow-1` · 포커스 링 `ink`). CTA 행 없음. 새 조합 0.

**4. 빈 슬롯 · 상한 글자**
- `nav` 빈 값(필수, R-13) → "메뉴" 버튼·시트 모두 생략, 바에 브랜드만(빈 랜드마크 0).
- `brand` 빈 값 → 0.8 생략, 버튼은 오른쪽 끝 그대로.
- `brand` 24자: 390에서 2줄까지 · `nav` 80자: 시트 세로 목록이라 항목 수만큼 늘어난다(시트 높이 > 화면이면 시트 안 세로 스크롤 — `overflow-y: auto`, 높이 상한 = 화면 높이. 이 상한은 `vh`가 아니라 `inset`(위·아래 0 고정 후 `height: auto` + `max-block-size: 100%`)으로 둔다 — K-AC-07).

**5. 이미지 슬롯** — 해당 없음(슬롯 없음).

**6. 상호작용** — K1-1 6과 같음(`popover` · Esc/바깥 닫힘 · 닫힘 시 포커스 버튼 복귀 · r4.12 스크립트가 시트 안 앵커 누름 → 닫힘 · `popover` 미지원 = 버튼 숨김 + 시트 목록 일반 흐름). 차이: **`lg` 이상에서도 버튼·시트가 동작**한다. React 상태 0 · 새 스크립트 0.

**7. 모션** — 이 단계 정적. 모션 후보(M2B-3, 상한 L1): 시트 열림 시 판의 나타남(L1) 1곳.

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 메뉴가 적고 브랜드 인상을 앞세우는 업종(뷰티·카페·포트폴리오형)에 맞는 "숨긴 메뉴" — `visualTags` minimal·restrained 계열과 맞는다 |
| ② 정보 위계 | 주의 | 메뉴가 늘 숨어 있어 1280에서 탐색 발견성이 낮다 — CTA 슬롯도 없어 hero CTA가 주 행동을 맡는다(라벨대로, 항목 수가 많은 업종에는 `sticky-right-cta` 권장을 M2B-6 카탈로그 설명에) |
| ③ 3폭 반응형 | PASS | 바 모양 3폭 동일 · 시트만 폭별 판 크기 |
| ④ 접근성 | PASS | `banner` 1 · 열린 시트에만 `navigation` 1 · 버튼 이름 "메뉴" · 브라우저 `aria-expanded` 자동 · 포커스 복귀 · `hit-min` |
| ⑤ 토큰 준수 | PASS | K1-1 역할·단계 그대로, 새 조합 0 |
| ⑥ 예산 감각 | PASS | JS 0(r4.12 고정 스크립트 재사용) · CSS = 시트 판 위치 덮어쓰기만(4.3) |
| ⑦ 독자성 | PASS | 일반 패턴(메뉴 버튼 + 판) · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 점진적 공개(progressive disclosure) (나) WCAG 2.4.3 포커스 순서 · 2.5.8 조작 크기 · HTML `popover` 명세의 light dismiss (다) 라이브러리 이름표 "고정 헤더 · 햄버거 메뉴" |
| ⑨ 데이터 계약 | PASS | `brand`·`nav`만 · 새 슬롯 0 |
| ⑩ 내보내기 동일성 | PASS | 정적 HTML에서 `popover` 네이티브 동작 · 시트 닫힘 상태로 직렬화(K-AC-06) |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-01 | 1280·768·390 모두 "메뉴" 버튼 보임 · 바 안 `nav` 0 · 닫힌 상태 `navigation` 랜드마크 0 / 버튼 누름 → 시트 열림 · `navigation` 1 | [B] |
| KB-AC-02 | 1280: 열린 시트 오른쪽 끝이 화면 오른쪽 끝과 같고 폭 < 화면 폭의 절반 / 390: 시트 폭 = 화면 폭 | [B] |
| KB-AC-03 | `nav` 빈 값 → `button[popovertarget]` 0 · `[popover]` 0 · `nav` 0 | [U] |

### B-2. `header/sticky-two-tier` — 고정 헤더 · 2단 메뉴
슬롯(L1): `brand`(24, 필수) · `nav`(80, 필수, 권장 60) · `utility`(link 40, 선택 — 기본 글자 "로그인 · 고객센터"). CTA 슬롯 없음.

**1. 구조**
```
<header id="s-<id>" data-section="header/sticky-two-tier">          ← sticky, 맨 위
  <div 보조 줄>  <ul role="list" 보조 목록 넓은폭용><li>{조각}</li>…</ul>  </div>   ← md 이상만
  <div 바>
    <p 브랜드>{brand}</p>
    <nav aria-label="주 메뉴" 넓은폭용> <ul role="list"><li>{항목}</li>…</ul> </nav>  ← lg 이상만
    <button type="button" popovertarget="m-<id>">메뉴</button>      ← lg 미만만
  </div>
  <div id="m-<id>" popover>
    <button … popovertargetaction="hide">닫기</button>
    <nav aria-label="주 메뉴" 좁은폭용> <ul role="list">…</ul> </nav>
    <ul role="list" 보조 목록 좁은폭용>…</ul>                         ← md 미만에서만
  </div>
</header>
```
- 보조 목록(`utility`)은 0.10 나누기 규칙 + 메뉴 항목 대상 규칙(본문 섹션 제목과 같으면 앵커, 아니면 글자) 그대로. 기본 글자("로그인"·"고객센터")는 대상 섹션이 없어 **글자 항목**이 된다(m2a MQ-2 — 페이지 링크 슬롯 없음).
- **보조 목록은 랜드마크가 아니다**(`nav` 아님, `div` 안 `ul`). 이유: VS-1에서 항목 대부분이 링크가 아닌 글자라 빈 탐색 랜드마크가 되고, K-AC-10 "`navigation` ≤ 1" 규칙을 header 전체에서 지킨다. 보조 링크가 대상 슬롯을 갖게 되면 `nav aria-label="보조 메뉴"`로 올린다(MQ-B2).
- 주 메뉴 두 벌·보조 목록 두 벌 모두 **폭마다 한 벌만 보인다**(K1-1과 같은 방식).
- **앵커 여백(0.2 D-3)**: header가 보조 줄만큼 높으므로, 문서에 이 변형이 있을 때 모든 섹션 루트의 `scroll-margin-top` = 기존 header 여백 + `hit-min` 한 단계. 방식 = 사이트 루트 기준 문서 수준 선택자 1줄(`[data-site-root]:has(> [data-section="header/sticky-two-tier"]) [data-kit]`) — `:has()` 미지원 브라우저에서는 기존 두 줄 여백으로 떨어진다(제목 위 일부가 가려질 수 있음, 기능 손실 없음). 대안 = D-1처럼 `KitLinks`에 header 높이 단계를 넣어 섹션 루트 속성으로 내기(M2B-1 선택, REPORT 기록).

**2. 반응형** (특이점: 2단 메뉴 390 접힘)
| 폭 | 보조 줄 | 바 | 시트 |
|---|---|---|---|
| `lg` 이상 (1280) | **보임** — 바 위 얇은 줄, 오른쪽 정렬, `small` | 브랜드(왼쪽) · 주 메뉴 인라인(오른쪽, 넘치면 줄바꿈) | 없음(버튼·시트 `display:none`, 열림과 무관 — K-AC-35 방식) |
| `md`~`lg` (768) | **보임**(같은 얇은 줄) | 브랜드 · "메뉴" 버튼 | 주 메뉴만 |
| `md` 미만 (390) | **숨김** | 브랜드 · "메뉴" 버튼 | 주 메뉴 → 구분선(`muted` 장식) → 보조 목록(`small`) |
- 390에서 2단이 **1단 바 + 시트 안 2구역**으로 접힌다. 시트 안 순서 = 위계 순서(주 → 보조).

**3. 토큰 대응** — K1-1 3과 같음 + 아래 행.
| 요소 | 면 | 글자 | 경계 | 단계 | 대비 검사 |
|---|---|---|---|---|---|
| 보조 줄 | `bg` | — | 아래 구분선 없음(바와 한 덩어리 · 바 아래 구분선 하나만) | 위아래 `s1` | — |
| 보조 항목 | `bg` | `ink` · 본문 굵기 (링크면 밑줄) | — | `small` · 줄 높이 `hit-min`(링크일 때만 — 글자 항목은 조작 대상 아님) | C-2 |
| 시트 안 보조 구분선 | — | — | `muted` `stroke-1`(장식) | — | — |
- 보조 항목을 `muted`로 낮추지 않아도 되지만(`bg` 위 C-5 허용), **위계는 단계(`small`)로** 만들고 색은 `ink` 유지 — 시트 안에서도 같은 색이어야 폭 사이 일관(시트는 늘 `bg`라 C-5도 가능하나 단순화).

**4. 빈 슬롯 · 상한 글자**
- `utility` 빈 값(선택) → 보조 줄 · 시트 보조 구역 · 그 구분선 모두 생략. 이때 header는 K1-1(CTA 없는) 모양이 되고 앵커 여백 확대(D-3)는 남아도 무해.
- `nav` 빈 값 → 주 메뉴 두 벌·"메뉴" 버튼 생략. `utility`가 있으면 390에서 보조 목록을 시트 대신 **바 아래 보조 줄로 보인다**(시트를 메뉴 없이 열게 하지 않는다).
- `utility` 40자: 1280 보조 줄 한 줄 안팎 · 768에서 줄바꿈 허용(보조 줄 높이 늘어남). `nav` 80자 = K1-1과 같음.

**5. 이미지 슬롯** — 해당 없음.

**6. 상호작용** — K1-1 6과 같음(시트 = 주 메뉴 + 390 보조 목록). r4.12 스크립트가 시트 안 앵커(주·보조 모두)를 닫는다 — 구조가 `[popover] a[href^="#"]`이므로 스크립트 변경 0. React 상태 0.

**7. 모션** — 정적. 후보(L1): 스크롤 시 보조 줄 접힘(L1) — 스크롤 연동이라 스크립트가 필요하면 MQ로(M2B-3).

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 계정·고객센터 같은 보조 동선이 있는 업종(`retail`·`education`·`medical`, 목적 `sales`·`booking`)에 맞는 2단 |
| ② 정보 위계 | PASS | 주 메뉴(본문 단계) > 보조(작은 단계) — 크기·위치로 위계, 색은 같음 |
| ③ 3폭 반응형 | PASS | 1280 2단 → 768 보조 줄 + 시트 → 390 1단 + 시트 2구역 |
| ④ 접근성 | 주의 | `navigation` ≤ 1 유지 · 보조 목록은 랜드마크 아님(글자 항목 위주). 보조 링크가 생기면 랜드마크 승격 필요(MQ-B2). 앵커 여백은 `:has()` 미지원 시 축소 |
| ⑤ 토큰 준수 | PASS | 새 조합 0(C-2만) |
| ⑥ 예산 감각 | PASS | JS 0 · CSS = 보조 줄 + 시트 구역(4.3) |
| ⑦ 독자성 | PASS | 일반 2단 헤더 패턴 · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 위계 = 크기·위치(근접 원칙으로 보조/주 분리) (나) WCAG 1.3.1 정보와 관계 · 2.4.11 포커스 가려짐 안 됨(앵커 여백) (다) 라이브러리 이름표 "고정 헤더 · 2단 메뉴" · 슬롯 기본 글자 "로그인 · 고객센터" |
| ⑨ 데이터 계약 | PASS | `brand`·`nav`·`utility` 그대로 |
| ⑩ 내보내기 동일성 | PASS | 시트 닫힘 직렬화 · r4.12 스크립트 그대로 |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-04 | 1280: 보조 줄 보임 · 바 `nav` 보임 · 버튼 `display:none` / 768: 보조 줄 보임 · 버튼 보임 / 390: 보조 줄 `display:none` · 시트를 열면 주 메뉴 다음에 보조 목록. 어느 폭·상태든 `navigation` ≤ 1 | [B] |
| KB-AC-05 | `utility` 빈 값 → 보조 목록 `ul` 0(두 벌 모두) · 시트 구분선 0 / `utility` "로그인 · 고객센터"(대상 섹션 없음) → `li > span` 2 · `a` 0 | [U] |
| KB-AC-06 | 이 변형이 있는 문서에서 390·1280 각각 앵커 이동 뒤 대상 제목의 위쪽 끝 y ≥ header 아래쪽 끝 y | [B] |

### B-3. `header/transparent` — 투명 헤더 (면 이어짐)
슬롯(L1): `brand`(24, 필수) · `nav`(80, 필수, 권장 60). CTA 없음.

**핵심 결정 — 겹치지 않고 "면을 이어 붙인다"** (특이점: hero 위 겹침 · 면 없는 글자 대비)
- 그림 위에 면 없는 글자를 올리면 대비를 게이트가 판정할 수 없다(m2a 0.3 · K1-2 "글자는 늘 단색 패널 위"와 같은 이유). 그래서 이 변형은 **hero 위에 절대 위치로 겹치지 않는다.** header는 일반 흐름(in-flow)에 있고, **header 면 = 바로 아래 hero 맨 위의 면**과 같은 색으로 칠해 경계선·그림자 없이 이어 보이게 한다 → 눈에는 "hero가 header 뒤까지 올라온" 모양, 글자는 늘 불투명 단색 면 위.
- 따라서 **sticky가 아니다**(스크롤하면 사라짐). 고정하면 다른 섹션 위를 지날 때 면이 이어지지 않고, 그 아래 면과 대비 판정도 섞인다.
- header 면은 문서 데이터에서 정한다(0.2 D-1 `heroTop`). DOM 탐색·`:has()`를 쓰지 않으므로 캔버스·정적 HTML·jsdom이 같은 결과를 낸다.

**hero 맨 위 면(`heroTop`) → header 면·글자 (L1 변형 + 이 문서 hero 명세)**
| 첫 본문 섹션 | `heroTop` | header 면 | header 글자 | 대비 검사 |
|---|---|---|---|---|
| `hero/fullbleed-left` 이미지 켬 | `media` (390 미디어 띠가 맨 위 · `md` 이상 미디어가 섹션을 덮음) | `bg` | `ink` | C-2 |
| `hero/fullbleed-left` 이미지 끔 | `primary` | `primary` | `on-primary` | C-1 |
| `hero/split` · `hero/grid` · `hero/text` | 섹션 톤 면(`base`→`bg` · `alt`→`surface`) | 같은 면 | `ink` | C-2 · C-4 |
| `hero/center` | `primary` | `primary` | `on-primary` | C-1 |
| `hero/image` 이미지 켬 | `media` (이미지가 맨 위) | `bg` | `ink` | C-2 |
| `hero/image` 이미지 끔 | 섹션 톤 면 | 같은 면 | `ink` | C-2 · C-4 |
| hero 아님 · hero가 폴백(킷 없음) · 겹칠 hero 없음 | 값 없음 | `bg` + 아래 구분선 `muted`(장식) | `ink` | C-2 |
- `media`일 때 `bg`로 칠하는 이유: 이미지와 이어 붙일 단색이 없다 — 이미지 위 글자 0 원칙이 이음보다 우선(ADR-003 사용성 > 목업). 이때 header는 평범한 `bg` 바처럼 보인다(REPORT "다르게 한 곳").
- R-05(인접 톤 다름)는 섹션 `tone` 값의 규칙이고 header 킷은 톤을 쓰지 않으므로(0.4) 충돌 없다.

**1. 구조**
```
<header id="s-<id>" data-section="header/transparent" data-surface="{primary|bg|surface}">   ← 일반 흐름 (sticky 아님)
  <div 바>
    <p 브랜드>{brand}</p>
    <nav aria-label="주 메뉴" 넓은폭용> <ul role="list">…</ul> </nav>         ← lg 이상
    <button type="button" popovertarget="m-<id>">메뉴</button>              ← lg 미만
  </div>
  <div id="m-<id>" popover> 닫기 · <nav aria-label="주 메뉴"> … </nav> </div>   ← 시트는 늘 bg 면
</header>
```
- `data-surface` = 위 표의 header 면(m2a [B] 대비 판정이 면을 찾는 표시와 같은 속성).

**2. 반응형** — 바·시트 규칙은 K1-1 2에서 CTA를 뺀 것과 같다: `lg` 이상 = 브랜드 + 인라인 메뉴 · `lg` 미만 = 브랜드 + "메뉴" 버튼 + 시트(390 전체 폭 판, 768도 전체 폭 판). header 면은 폭과 무관하게 `heroTop`이 정한다 — 단, `fullbleed-left`·`image`는 모든 폭에서 이미지가 맨 위라 폭별 차이 없음.

**3. 토큰 대응**
| 요소 | header 면 `primary` | header 면 `bg` | header 면 `surface` | 단계 |
|---|---|---|---|---|
| 바 | `primary`, 경계 없음 | `bg`, 경계 없음(`heroTop` 없음일 때만 아래 구분선 `muted`) | `surface`, 경계 없음 | — |
| 브랜드 | `on-primary` C-1 | `ink` C-2 | `ink` C-4 | `subtitle` |
| 메뉴 항목 | `on-primary` + 밑줄 C-1 | `ink` C-2 | `ink` C-4 | `body` |
| "메뉴" 버튼 | 면 `primary` · 글자·경계 `on-primary` C-1 | `bg`·`ink` C-2 | 면 `surface` · `ink` C-4 | `body` |
| 포커스 링 | 바깥 `on-primary` | `ink` | `ink` | `stroke-2` |
| 시트 | 늘 `bg` · `ink` (K1-1) | 같음 | 같음 | — |
- 새 조합 0 — 세 면 모두 C-1·C-2·C-4 안.

**4. 빈 슬롯 · 상한 글자** — K1-1 4에서 CTA 줄을 뺀 것과 같다. `nav` 빈 값 → 버튼·시트·바 `nav` 생략, 바에 브랜드만.

**5. 이미지 슬롯** — 해당 없음(header는 이미지 없음 · hero 이미지 위에 겹치지 않는다).

**6. 상호작용** — K1-1 6과 같음(`lg` 이상 숨김 전환 K-AC-35 방식 포함). React 상태 0 · 새 스크립트 0.

**7. 모션** — 정적. 후보(L1): 없음 권장 — "스크롤하면 면이 생기는" 전형 효과는 스크립트·고정이 필요해 이 변형 결정(비고정)과 맞지 않는다. 굳이 준다면 메뉴 항목 hover 밑줄 굵기(L1).

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 첫 화면 인상이 중요한 업종(`cafe-fnb`·`beauty`, `visualTags` bold·sophisticated)에서 hero와 한 덩어리로 보이는 머리 |
| ② 정보 위계 | PASS | header가 hero 면과 이어져 hero 제목이 첫 위계가 된다 |
| ③ 3폭 반응형 | PASS | K1-1 메뉴 접힘 규칙 그대로 |
| ④ 접근성 | PASS | 글자는 늘 불투명 단색 면 위(C-1·C-2·C-4) · `banner` 1 · `navigation` ≤ 1 |
| ⑤ 토큰 준수 | PASS | 면 3종 모두 허용 조합 |
| ⑥ 예산 감각 | PASS | JS = `heroTop` 계산 몇 줄(문서 데이터) · CSS = 면 3종 변수 바꿈 |
| ⑦ 독자성 | PASS | 일반 패턴 · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 연속성(같은 면 = 한 덩어리, 게슈탈트 공통 영역) (나) WCAG 1.4.3 대비(최소) — 이미지 위 글자는 판정 불가라 배제 (다) 카탈로그 `layoutType` `fullbleed`·`image`와 맞물리는 머리 · 라이브러리 이름표 "투명 헤더" |
| ⑨ 데이터 계약 | PASS | `brand`·`nav` 그대로 · 킷 내부 `KitLinks.heroTop` 추가(D-1, 엔진 0) |
| ⑩ 내보내기 동일성 | PASS | 면을 문서 데이터로 정해 캔버스 = PNG = 정적 HTML |
| ⑪ 라벨 충실도 | 주의 | "투명"을 겹침이 아닌 면 이음으로 구현 — 이미지 hero 앞에서는 평범한 `bg` 바(MQ-B1) |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-07 | `heroTop` 표 7행 각각의 문서 → header `data-surface`가 표와 같다(`hero/center` → `primary` · `hero/split` `alt` → `surface` · `hero/image` 이미지 켬 → `bg` · 첫 본문이 about → `bg` + 구분선) | [U] |
| KB-AC-08 | header 계산 스타일 `position` ≠ `sticky`·`fixed`·`absolute` · header 아래쪽 끝 y ≤ hero 위쪽 끝 y(겹침 넓이 0) — 1280·768·390 | [B] |
| KB-AC-09 | header 면 `primary`일 때 브랜드·메뉴 항목·버튼 글자색 = `on-primary`, 면 `surface`일 때 `ink` — 계산 색이 허용 쌍(K-AC-11 방식) | [B] |

---

## 2. hero — 5변형 (기준 K1-2)
공통 차이(5변형):
- 헤딩 `h1`(섹션 정의) · `aria-labelledby` · DOM 순서 = 카피(제목 → 부제 → CTA) → 미디어 · CTA 대상 = 0.10 · 높이에 뷰포트 단위 0(K-AC-07) — K1-2와 같음.
- **루트에 `data-surface`** = 카피가 놓인 면(대비 판정용) · 첫 본문일 때 header `transparent`가 쓸 "맨 위 면"은 `KitLinks.heroTop`이 데이터로 계산한다(DOM 속성에 기대지 않음, D-1).
- 섹션 톤을 따르는 변형(split·grid·text·image)의 글자: 제목·CTA는 두 톤 공통, **부제는 `base` = `muted`(C-5) · `alt` = `ink`(C-4)** — m2a K1-4 머리 소개와 같은 규칙(`muted`/`surface` 검사 밖).
- CTA(섹션 톤 면 위): 면 `primary` · 글자 `on-primary` · 제목 굵기(C-1) — K1-1 CTA 모양과 같음. 포커스 링 바깥 `ink`(링이 `bg`·`surface`와 맞닿음 — C-2·C-4).

### B-4. `hero/split` — 스플릿 (카피 / 이미지)
슬롯(L1): `title`(short 40, 필수, 권장 28) · `subtitle`(long 120, 권장 80) · `cta`(link 16, 필수, 권장 10) · `image`(이미지). `fullBleed: false`.

**1. 구조**
```
<section id="s-<id>" data-section="hero/split" data-surface="{bg|surface}" aria-labelledby="h-<id>">
  <div 래퍼 2단 그리드>                         ← content-max + gutter
    <div 카피>  <h1 id="h-<id>">{title}</h1>  <p 부제>{subtitle}</p>  <a CTA>{cta}</a>  </div>
    <figure 이미지 칸>  <img | div 그라디언트 aria-hidden>  </figure>
  </div>
</section>
```
- 글자는 섹션 면 위, 이미지는 옆 칸 — 겹침 0. K1-2의 단색 패널이 필요 없다.

**2. 반응형**
| 폭 | 배치 |
|---|---|
| `lg` 이상 (1280) | 2단 같은 폭(6 : 6) · 카피 세로 가운데 · 열 사이 `s6` · 위아래 `section-gap` |
| `md`~`lg` (768) | 2단(7 : 5) — 카피 폭을 넓혀 제목 줄 수를 줄인다 |
| `md` 미만 (390) | 1단: 카피 → 이미지(DOM 순서 = 보이는 순서) |

**3. 토큰 대응**
| 요소 | `base` 톤 (면 `bg`) | `alt` 톤 (면 `surface`) | 단계 |
|---|---|---|---|
| 제목 `h1` | `ink` C-2 | `ink` C-4 | `display` · `leading-tight` |
| 부제 | `muted` C-5 | `ink` C-4 | `lead` |
| CTA | `primary` / `on-primary` C-1 | 같음 | `body` · 안쪽 `s2`×`s4` · 버튼 radius |
| 이미지 칸 | radius = 카드 radius 단계(`--site-radius-card` — 카드 모양 `flat`이면 `r0`) | 같음 | — |

**4. 빈 슬롯 · 상한 글자**
- `subtitle` 빈 값 → 생략, 제목 ↔ CTA `s4`. `image` 꺼짐 → 이미지 칸 생략, **1단 · 카피 폭 `prose-max` · 왼쪽 정렬**(= `hero/text`와 비슷한 모양, 강조선 없음).
- `title` 40자 `display`: 1280 6칸에서 3줄 안팎 · 390 4줄 안팎 [L3] · 말줄임 금지.

**5. 이미지 슬롯** — 비율 = 넓은 폭 프로필 `media_ratio`(없으면 4:5 — 옆 칸이 카피 높이와 맞음), 390 = **4:3 띠**(전체 폭 세로형은 첫 화면을 다 차지 — 사용성 우선). 사용자 이미지 → `img`(`fetchpriority="high"`, 즉시 로드 — 첫 화면) · 없음 → 그라디언트 `aria-hidden`.

**6. 상호작용** — CTA 앵커 1개. React 상태 0.

**7. 모션** — 정적. 후보(L2 상한): 카피 묶음 나타남(L1) · 이미지 칸 약한 확대(L2) — M2B-3.

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 사진 1장 + 설명이 핵심인 업종 전반(`professional`·`medical`·`education`) · 목적 `inquiry`에 맞는 가장 범용 hero |
| ② 정보 위계 | PASS | 왼쪽 카피 → 오른쪽 그림(시선이 제목부터) |
| ③ 3폭 반응형 | PASS | 6:6 → 7:5 → 1단 |
| ④ 접근성 | PASS | `h1` 1 · 이미지 위 글자 0 · `alt` 슬롯 · CTA `hit-min` |
| ⑤ 토큰 준수 | PASS | C-1·C-2·C-4·C-5만, 톤별 표 |
| ⑥ 예산 감각 | PASS | JS 0 추가(Media 재사용) · CSS 2단 그리드 |
| ⑦ 독자성 | PASS | 교과서적 2단 · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 좌→우 읽기 흐름의 Z 패턴 (나) WCAG 1.1.1 대체 텍스트 · 1.4.10 리플로(390 1단) (다) 카탈로그 `layoutType: split` |
| ⑨ 데이터 계약 | PASS | 4슬롯 그대로 |
| ⑩ 내보내기 동일성 | PASS | 스크립트 0 |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-10 | 1280·768: 카피와 이미지 칸이 같은 행(박스 y 범위 겹침) · 카피가 왼쪽 / 390: 카피 박스 아래쪽 끝 ≤ 이미지 위쪽 끝 | [B] |
| KB-AC-11 | `alt` 톤 → 부제 글자색 = `ink` · `base` 톤 → `muted` · 두 톤 모두 `h1`·부제의 가장 가까운 불투명 배경 = 섹션 면 | [U]·[B] |
| KB-AC-12 | `image` 꺼짐 → `figure` 0 · 카피 폭 ≤ `prose-max` · 1열 | [U]·[B] |

### B-5. `hero/center` — 센터 정렬 카피
슬롯(L1): `title`(40, 필수, 권장 28) · `subtitle`(120, 권장 80) · `cta`(16, 필수, 권장 10). **이미지 슬롯 없음.**

**1. 구조**
```
<section id="s-<id>" data-section="hero/center" data-surface="primary" aria-labelledby="h-<id>">   ← 전체 폭 primary 면
  <div 래퍼 가운데 정렬>                     ← content-max + gutter, 카피 폭 prose-max
    <h1 id="h-<id>">{title}</h1>  <p 부제>{subtitle}</p>  <a CTA>{cta}</a>
  </div>
</section>
```
- 면 = **`primary` 단색**(섹션 톤과 무관 — K1-2 패널과 같은 면을 섹션 전체로). 이미지가 없으므로 색 면이 첫 화면 인상을 맡는다. `hero/text`(섹션 톤 면 · 왼쪽 정렬 · 글자 중심)와 구분되는 핵심.
- 글자 가운데 정렬(`text-align: center`) · 블록도 가운데. 긴 부제가 가운데 정렬로 여러 줄이 되면 읽기 어렵다 → 카피 폭 상한 `prose-max`.

**2. 반응형**
| 폭 | 배치 |
|---|---|
| `lg` 이상 (1280) | 가운데 한 묶음 · 위아래 `section-gap`의 **1.5배 단계**(`section-gap` + `s6` — 이미지 없는 hero의 무게를 여백으로) |
| `md`~`lg` (768) | 같음, 위아래 `section-gap` |
| `md` 미만 (390) | 가운데 정렬 유지 · 위아래 `section-gap-narrow` · CTA는 내용 폭(전체 폭 아님 — 가운데 묶음 유지) |

**3. 토큰 대응** — K1-2 패널 행과 같은 조합을 섹션 면으로.
| 요소 | 면 | 글자 | 단계 | 대비 검사 |
|---|---|---|---|---|
| 섹션 | `primary` | — | — | — |
| 제목 `h1` | `primary` | `on-primary` · 제목 굵기 | `display` | C-1 |
| 부제 | `primary` | `on-primary` · 본문 굵기 | `lead` | C-1 |
| CTA | `on-primary` | `primary` · 제목 굵기 | `body` · 안쪽 `s2`×`s4` | C-1 뒤집기 |
| 포커스 링(CTA) | 간격 `primary` | 바깥 `on-primary` `stroke-2` | — | C-1 |
- 섹션 톤 `base`/`alt`는 모양에 영향 없음(전체 `primary`). 다음 섹션과 면이 달라 R-05 취지(인접 구분)도 지켜진다.

**4. 빈 슬롯 · 상한 글자** — `subtitle` 빈 값 → 생략, 제목 ↔ CTA `s4`. `title` 40자 `display` 가운데 정렬: 1280 `prose-max` 폭에서 2줄 안팎 · 390 4줄 안팎 [L3]. 말줄임 금지.

**5. 이미지 슬롯** — 해당 없음(슬롯 없음). 장식 그래픽도 넣지 않는다(자체 그래픽 본편은 M2c 밖 범위).

**6. 상호작용** — CTA 앵커 1개. React 상태 0.

**7. 모션** — 정적. 후보(L2 상한): 제목 나타남(L1) · 면에 아주 느린 명도 변화는 대비 판정을 흔들어 **금지 후보**.

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 사진이 없거나 메시지 하나가 핵심인 경우(신규 사업 · 이벤트형 · 목적 `inquiry`/`booking`) |
| ② 정보 위계 | PASS | 가운데 한 축 — 제목 → 부제 → CTA 세로 한 줄 |
| ③ 3폭 반응형 | PASS | 같은 축, 여백만 단계 변경 |
| ④ 접근성 | PASS | C-1만 · `h1` 1 · 가운데 정렬 폭 상한(1.4.8 읽기 폭 취지) |
| ⑤ 토큰 준수 | PASS | K1-2 패널 조합 재사용 |
| ⑥ 예산 감각 | PASS | JS 최소(슬롯 3) · CSS 가장 작음 |
| ⑦ 독자성 | PASS | 일반 패턴 · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 대칭 배치 = 단일 메시지 강조 (나) WCAG 1.4.3 · 1.4.8 시각적 표현(줄 길이) (다) 카탈로그 `layoutType: center` |
| ⑨ 데이터 계약 | PASS | 3슬롯 그대로 |
| ⑩ 내보내기 동일성 | PASS | 스크립트 0 |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-13 | 섹션 배경 = `primary` · `h1`·부제 글자 = `on-primary` · CTA 면 `on-primary`/글자 `primary` — 톤 `base`·`alt` 두 문서에서 같다 | [U]·[B] |
| KB-AC-14 | 1280·390: `h1` 박스 가로 중심과 섹션 가로 중심 차이 ≤ 1 CSS 단위 · 카피 폭 ≤ `prose-max` | [B] |

### B-6. `hero/grid` — 그리드 (이미지 타일 + 카피)
슬롯(L1): `title` · `subtitle` · `cta`(B-4와 같음) · `image`(이미지 **1개**). `fullBleed: false`.

**타일 규칙 — 슬롯 1개로 타일을 만드는 방법** (특이점)
- **사용자 이미지는 큰 타일 1칸에 한 번만** 쓴다(`img` 1개 · `alt` 1회). 나머지 타일은 **토큰 색 타일**(장식, `aria-hidden="true"`, 글자 0).
- 같은 사진을 잘라 여러 칸에 반복하지 않는 이유: ① 반복 사진은 "일부러 만든 모자이크"로 읽혀 내용이 흐려진다 ② 스크린리더가 같은 `alt`를 여러 번 읽거나, 한쪽을 숨기면 규칙이 갈린다 ③ 정적 HTML·PNG에서 같은 이미지 바이트가 여러 번 그려져도 정보는 늘지 않는다.
- 타일 수(폭별) 와 면:

| 폭 | 타일 | 배치 |
|---|---|---|
| `lg` 이상 (1280) | **3칸** — 큰 타일 A(이미지) + 작은 타일 B·C | 2열 × 2행 격자: A가 왼쪽 열 2행 차지, B 오른쪽 위, C 오른쪽 아래 · 타일 사이 `s3` |
| `md`~`lg` (768) | 3칸 | 같은 격자 |
| `md` 미만 (390) | **1칸** — A만 | B·C `display:none`(장식이라 정보 손실 0) |

- 타일 면: A = 사용자 이미지 또는 토큰 그라디언트(0.9) · B = `primary` 단색 · C = `ink` 단색 — 그라디언트 두 끝 색과 같은 두 역할만(결정적). 타일 radius = 카드 radius 단계(`flat`이면 `r0`).

**1. 구조**
```
<section id="s-<id>" data-section="hero/grid" data-surface="{bg|surface}" aria-labelledby="h-<id>">
  <div 래퍼 2단>                                   ← content-max + gutter
    <div 카피> h1 · 부제 · CTA </div>
    <div 타일 격자>
      <img | div 그라디언트 aria-hidden  타일 A>
      <div 타일 B aria-hidden></div>  <div 타일 C aria-hidden></div>
    </div>
  </div>
</section>
```

**2. 반응형**
| 폭 | 배치 |
|---|---|
| `lg` 이상 (1280) | 2단: 카피(5칸, 세로 가운데) · 타일 격자(7칸) · 열 사이 `s6` |
| `md`~`lg` (768) | 1단: 카피(위, `prose-max`) → 타일 격자(아래, 전체 폭, 3칸) |
| `md` 미만 (390) | 1단: 카피 → 타일 A 하나(4:3) |
- 격자 높이: 타일 A 비율 = 4:5(세로형, 2행 높이) · B·C는 남는 높이를 반씩(격자 행 `1fr 1fr`) — 높이는 A의 비율이 정한다(뷰포트 단위 0).

**3. 토큰 대응** — 글자는 B-4 표와 같다(섹션 톤 면 · 제목 `ink` · 부제 `base` `muted`/`alt` `ink` · CTA C-1). 타일은 글자가 없어 대비 대상 아님. 타일 B·C는 비글자 장식이라 1.4.11(3:1) 대상도 아님(정보 없음).

**4. 빈 슬롯 · 상한 글자**
- `image` 꺼짐 → **타일 격자 전체 생략**(B·C만 남기면 의미 없는 색 블록) → 카피 1단 `prose-max` 왼쪽 정렬.
- `subtitle` 빈 값 → 생략. 상한 글자는 B-4와 같음(1280 카피 5칸이라 제목 3~4줄 안팎 [L3]).

**5. 이미지 슬롯** — 타일 A 비율 4:5(넓은 폭) · 4:3(390). 프로필 `media_ratio`는 쓰지 않는다(격자 모양이 비율을 정한다 — K1-2 풀블리드와 같은 이유). 사용자 이미지 `fetchpriority="high"`.

**6. 상호작용** — CTA 앵커 1개. 타일은 링크·버튼 아님(포커스 0). React 상태 0.

**7. 모션** — 정적. 후보(L2): 타일 B·C 순차 나타남(L1) · 타일 A 약한 확대(L2).

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 시각 요소로 분위기를 보여 주는 업종(`retail`·`cafe-fnb`·`beauty`, `visualTags` lively·bright) — 사진 1장으로도 구성감 |
| ② 정보 위계 | PASS | 카피 5 : 타일 7 — 큰 타일 A가 시각 중심, 색 타일은 보조 |
| ③ 3폭 반응형 | PASS | 3칸 → 3칸(카피 위) → 1칸 |
| ④ 접근성 | PASS | `img` 1 · `alt` 1회 · 장식 타일 `aria-hidden` · 글자 섹션 면 위 |
| ⑤ 토큰 준수 | PASS | 타일 면 = `primary`·`ink`(그라디언트와 같은 두 역할) |
| ⑥ 예산 감각 | PASS | JS 0 추가 · CSS 격자 정의 |
| ⑦ 독자성 | PASS | 일반 비대칭 격자 · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 비대칭 격자의 초점(큰 칸 1 + 보조 칸) (나) WCAG 1.1.1(장식 = 빈 대체) · 4.1.2 (다) 카탈로그 `layoutType: grid` · 라이브러리 이름표 "그리드 (이미지 타일 + 카피)" |
| ⑨ 데이터 계약 | PASS | 이미지 슬롯 1개로 규칙화 · 새 슬롯 0 |
| ⑩ 내보내기 동일성 | PASS | 스크립트 0 |
| ⑪ 라벨 충실도 | 주의 | "이미지 타일"이 사진 여러 장을 기대하게 할 수 있음 — 슬롯 1개 한계, 여러 장은 새 슬롯이 필요(MQ-B3) |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-15 | 사용자 이미지 문서: `img` 정확히 1 · 타일 B·C `aria-hidden="true"` · 타일 안 글자 0 / 플레이스홀더: `img` 0 · 그라디언트 타일 1 | [U] |
| KB-AC-16 | 1280·768: 보이는 타일 3 · A 높이 ≈ B + C + 사이 간격 / 390: 보이는 타일 1(A) | [B] |
| KB-AC-17 | `image` 꺼짐 → 타일 격자 요소 0 · 카피 1열 | [U] |

### B-7. `hero/text` — 텍스트 중심 카피
슬롯(L1): `title` · `subtitle` · `cta`(B-4와 같음). **이미지 슬롯 없음.**

**1. 구조**
```
<section id="s-<id>" data-section="hero/text" data-surface="{bg|surface}" aria-labelledby="h-<id>">
  <div 래퍼>                                  ← content-max + gutter, 왼쪽 정렬
    <span 강조선 aria-hidden></span>          ← 장식 짧은 가로선
    <h1 id="h-<id>">{title}</h1>  <p 부제>{subtitle}</p>  <a CTA>{cta}</a>
  </div>
</section>
```
- 글자가 주인공: 제목 단계를 한 단계 키운다 — `lg` 이상에서 `display` 대신 **`t5` 위 한 단계가 없으므로** `display`(`t5`) 그대로 두고, 대신 **제목 폭 상한을 12칸 중 9칸**으로 넓혀 큰 글자가 2줄 안에 들어가게 한다(새 타입 단계 0 — 0.4 상속).
- 강조선 = `primary` 면의 짧은 가로 막대(두께 `stroke-2` · 길이 `s6`) — 장식(`aria-hidden`, 정보 없음). 글자 대비 대상 아님.
- `hero/center`와 차이: 면 = 섹션 톤(`bg`/`surface`) · 왼쪽 정렬 · 강조선.

**2. 반응형**
| 폭 | 배치 |
|---|---|
| `lg` 이상 (1280) | 왼쪽 정렬 한 열 · 제목 폭 9칸 · 부제 폭 `prose-max` · 위아래 `section-gap` + `s6` |
| `md`~`lg` (768) | 제목 폭 전체(내용 폭) · 위아래 `section-gap` |
| `md` 미만 (390) | 같음 · 위아래 `section-gap-narrow` · CTA 내용 폭 |

**3. 토큰 대응** — B-4 표(섹션 톤 두 벌)와 같음 + 강조선 `primary`(장식). 새 조합 0.

**4. 빈 슬롯 · 상한 글자** — `subtitle` 빈 값 → 생략. 제목 40자 `display` 9칸: 1280 2줄 안팎 · 390 4줄 안팎 [L3]. 말줄임 금지.

**5. 이미지 슬롯** — 해당 없음(슬롯 없음).

**6. 상호작용** — CTA 앵커 1개. React 상태 0.

**7. 모션** — 정적. 후보(L2): 제목 줄 단위 나타남(L1) · 강조선 길이 늘어남(L1).

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 전문 서비스·교육처럼 신뢰와 말이 핵심인 업종(`professional`·`education`, `visualTags` trust·formal·minimal) |
| ② 정보 위계 | PASS | 큰 제목 하나가 첫 위계 · 강조선이 시작점 표시 |
| ③ 3폭 반응형 | PASS | 한 열 · 폭 상한만 변경 |
| ④ 접근성 | PASS | 섹션 면 위 글자(C-2·C-4·C-5) · 장식 `aria-hidden` |
| ⑤ 토큰 준수 | PASS | 새 단계 0(제목 폭으로 무게 조절) |
| ⑥ 예산 감각 | PASS | JS 최소 · CSS 작음 |
| ⑦ 독자성 | PASS | 일반 타이포 중심 패턴 · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 타이포 위계(크기 대비) · 왼쪽 정렬 읽기 시작점 (나) WCAG 1.4.12 글자 간격 · 1.4.4 글자 크기 조정(200%) (다) 카탈로그 `layoutType: text` |
| ⑨ 데이터 계약 | PASS | 3슬롯 그대로 |
| ⑩ 내보내기 동일성 | PASS | 스크립트 0 |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-18 | 섹션 면 = 톤 면(`base` → `bg` · `alt` → `surface`) · 강조선 요소 `aria-hidden="true"` 글자 0 · `h1` 왼쪽 끝 = 래퍼 왼쪽 안쪽 끝 | [U]·[B] |
| KB-AC-19 | 1280: `h1` 폭 ≤ 내용 폭 × 9/12 / 390: 상한 글자 + 글자 200%에서 가로 넘침 0 | [B] |

### B-8. `hero/image` — 대형 이미지 + 하단 카피
슬롯(L1): `title` · `subtitle` · `cta` · `image`. `fullBleed: true`.

**1. 구조**
```
<section id="s-<id>" data-section="hero/image" data-surface="{bg|surface}" aria-labelledby="h-<id>">   ← 전체 폭
  <div 카피 띠>                                  ← content-max + gutter, 섹션 톤 면
    <h1 id="h-<id>">{title}</h1>  <p 부제>{subtitle}</p>  <a CTA>{cta}</a>
  </div>
  <img | div 그라디언트 aria-hidden  미디어>     ← 전체 폭 띠, DOM은 카피 뒤
</section>
```
- **보이는 순서 = 미디어(위) → 카피(아래)**, DOM 순서 = 카피 → 미디어(제목이 먼저 읽힘 — K1-2와 같은 원칙, 미디어는 포커스 요소 없음). 시각 순서는 그리드 영역 이름으로만 바꾼다(`order`·절대 위치 0).
- 글자는 이미지 위에 올리지 않는다 — 카피는 이미지 **아래** 섹션 톤 면 띠에 있다.
- `fullbleed-left`와 차이: 이미지가 섹션 전체를 덮지 않고 위 띠 · 카피는 패널 없이 섹션 면 위.

**2. 반응형**
| 폭 | 미디어 | 카피 띠 |
|---|---|---|
| `lg` 이상 (1280) | 전체 폭 · 비율 **21:9** | 2단: 제목(7칸, 왼쪽) · 부제 + CTA(5칸, 오른쪽, 제목 첫 줄 높이에 맞춤) · 위아래 `section-gap` |
| `md`~`lg` (768) | 전체 폭 · 16:9 | 1단: 제목 → 부제 → CTA |
| `md` 미만 (390) | 전체 폭 · 4:3 | 1단 · 위아래 `section-gap-narrow` |
- 높이는 비율만(뷰포트 단위 0, K-AC-07). 21:9는 1280에서 첫 화면 안에 카피 첫 줄이 보이게 하려는 선택 [L3 — QA에서 확인].

**3. 토큰 대응** — 카피 글자는 B-4 표와 같음(섹션 톤 두 벌). 미디어 그라디언트 = 0.9. 새 조합 0.

**4. 빈 슬롯 · 상한 글자**
- `image` 꺼짐 → 미디어 생략, 카피 띠만(1단 `prose-max` 왼쪽 정렬 — `hero/text`에서 강조선만 없는 모양).
- `subtitle` 빈 값 → 1280 오른쪽 칸에 CTA만(위 정렬).
- 제목 40자 1280 7칸에서 2줄 안팎 [L3].

**5. 이미지 슬롯** — 사용자 이미지 `img` · `object-fit: cover` · 가운데 자르기 · `fetchpriority="high"` · 즉시 로드. 프로필 `media_ratio`는 쓰지 않는다(풀블리드 띠 — 섹션 모양이 비율을 정함, K1-2와 같은 이유). 없음 → 그라디언트 `aria-hidden`.

**6. 상호작용** — CTA 앵커 1개. React 상태 0.

**7. 모션** — 정적. 후보(L2): 이미지 약한 확대(L2) · 카피 띠 나타남(L1). 패럴랙스는 스크롤 스크립트 필요 → MQ(M2B-3).

**B2 루브릭**
| 항목 | 판정 | 근거 |
|---|---|---|
| ① 기능 적합 | PASS | 공간·제품 사진이 결정 요소인 업종(`cafe-fnb`·`fitness`·`retail`, 목적 `booking`·`sales`) |
| ② 정보 위계 | PASS | 큰 그림으로 인상 → 바로 아래 제목 · CTA |
| ③ 3폭 반응형 | PASS | 21:9 → 16:9 → 4:3 · 카피 2단 → 1단 |
| ④ 접근성 | PASS | 이미지 위 글자 0 · DOM 순서 제목 먼저 · `alt` 슬롯 |
| ⑤ 토큰 준수 | PASS | 섹션 톤 표 재사용 |
| ⑥ 예산 감각 | PASS | JS 0 추가(Media 재사용) |
| ⑦ 독자성 | PASS | 일반 "큰 사진 + 아래 카피" · 외부 자원 0 |
| ⑧ 근거 3 | PASS | (가) 그림 → 글 순서의 시각 흐름(그림 우위 효과) (나) WCAG 1.3.2 의미 있는 순서(DOM 제목 먼저) · 1.1.1 (다) 카탈로그 `layoutType: image` · 라이브러리 이름표 "대형 이미지 + 하단 카피" |
| ⑨ 데이터 계약 | PASS | 4슬롯 · `fullBleed: true` 그대로 |
| ⑩ 내보내기 동일성 | PASS | 스크립트 0 |
| ⑪ 첫 화면 | 주의 | 1280에서 21:9 미디어 + header 높이 때문에 CTA가 첫 화면 아래로 갈 수 있음 [L3] — M2B-1 1280 캡처로 확인, 넘치면 21:9 유지하고 카피 띠 위 여백을 `section-gap-narrow`로 |

**B3 수용 기준**
| ID | 수용 기준 | 방법 |
|---|---|---|
| KB-AC-20 | 1280·768·390: 미디어 박스 아래쪽 끝 ≤ `h1` 위쪽 끝 · DOM에서 `h1`이 미디어보다 앞 · 미디어 위 글자 0 | [U]·[B] |
| KB-AC-21 | 미디어 상자 폭/높이 비 = 1280 21:9 · 768 16:9 · 390 4:3 (±1%) · 미디어 폭 = 섹션 폭 | [B] |
| KB-AC-22 | `image` 꺼짐 → 미디어 요소 0 · 카피 1열 | [U] |
