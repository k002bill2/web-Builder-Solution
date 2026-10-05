# M2B-3 SPEC — 모션 프리셋 L0~L2 · reduced-motion · 폰트 ≤ 2계열 서브셋

- 작성: Designer(M2B-3) · 2026-10-05 · base `0bede09` · 브랜치 `k002bill2/m2b-3`
- 입력: `docs/04-plan/M2B_PLAN.md`(결정 2) · TRD 4.3·7(R-07)·8절 277행 · ADR-004 개정 2·4 · ADR-005 D1-갱신 · `docs/00-research/FONT_LICENSE_CHECK.md` · SPEC-BOUND/BODY 각 절 7 "모션 후보"
- 다음 단계: **M2B-4**(Developer — 모션·폰트 구현) · **M2B-6**(QA — 30/30·3폭·MF-AC)
- 영환님 결정 ★A(2026-10-05): 폰트 파일 = **원본 OFL 서브셋 woff2 + 라이선스 파일을 저장소에 커밋**. npm 폰트 패키지 의존성 0. 이 문서는 명세만 — 바이너리·코드는 M2B-4.
- 표기: **[사실]** 저장소·공식 원문에서 확인 · **[추정]** 공개 수치·유추(실측은 M2B-4) · **[확인 필요]** M2B-4 E0에서 먼저 실측할 것. 근거 수준 L1(코드 직접 확인)/L2(문서)/L3(추정).

---

## 0. 코드가 강제하는 전제 (M2B-4가 먼저 알아야 할 것)

| # | 사실 [L1] | 위치 | 이 명세에 주는 제약 |
|---|---|---|---|
| C-1 | 정적 HTML 생성기는 CSS의 `url()`이 `data:`가 아니면 실패한다 | `features/studio/staticHtml/staticMarkup.ts` `assertNoExternalCss` | 내보낸 정적 HTML의 폰트는 **`data:` 인라인**만 가능(외부 파일 0). 폴더·zip 내보내기는 M4 범위 |
| C-2 | 정적 HTML은 `KEPT_DATA` 밖의 `data-*`를 지운다 | 같은 파일 `clean()` | 모션 선택자에 쓰는 `data-motion`·`data-motion-play`를 `KEPT_DATA`에 **추가해야** 정적 HTML에 남는다 |
| C-3 | 정적 HTML의 스크립트는 고정 `STATIC_MENU_SCRIPT` 1개뿐(문서마다 바이트 동일) | 같은 파일 | 모션·폰트 때문에 **스크립트 추가·변경 0**. 바이트 불변을 [G]로 유지 |
| C-4 | PNG = 사이트 마크업 + 킷 CSS → SVG `foreignObject` → `data:` Image → canvas | `features/studio/png/pngCapture.ts` `buildCaptureSvg` | SVG 이미지 안에서는 하위 자원을 받지 않는다 → 폰트는 `data:`만. CSS 애니메이션은 t≈0 프레임이 찍힐 수 있다 → **캡처 CSS에서 모션 강제 정지** |
| C-5 | 렌더 문서 iframe = `sandbox="allow-scripts"`(불투명 출처) | `staticHtml.ts` `openFrame` · 캔버스 | `@font-face` 요청은 CORS 모드라 출처 `null`에서 같은 서버 파일이 거부될 수 있다 [확인 필요] → 5.3 |
| C-6 | 렌더 문서 웹폰트 0 가드 | `render/renderFonts.test.ts`(B8) | 이 명세로 **의도적으로 대체**한다(MF-AC-G2). 지우지 말고 "허용 파일만·허용 경로만"으로 바꾼다 |
| C-7 | 킷 모션 0 가드 `transition|animation|animate-|scroll-behavior` | `test/kitGuard.test.ts:29` · `kit/bodyVariants2c.test.tsx`(KD-AC-01) | 모션 CSS는 **전용 파일 1개**(`kit/motion.css` 제안)에만 허용, 나머지 킷 파일은 계속 0 |
| C-8 | 킷 토큰은 앱 DS 토큰 참조 0(`--site-*`만) | `kit/tokens.ts` 머리말 · `test/kitTokens.test.ts` | 모션 토큰 이름 = `--site-motion-*`. 앱 `--duration-*`·`--ease-*`(shape.css) 재사용 금지 |
| C-9 | 모션 값의 출처가 이미 있다: `profile.motion_preset`(L0~L2) → `withMotion`이 섹션마다 `motion` 배정(L2면 hero + 앞 본문 2개만 L2, R-07) → 변형 상한 `maxMotion`(header L1 · hero L2 · footer L0 · 본문 변형별) | `domain/composeCandidates.ts:181` · `engine/sections/{bound,body}Sections.ts` · `engine/contracts/pageDoc.ts:69` | **새 필드 0.** 렌더가 `min(section.motion, maxMotion)`을 속성으로 쓰기만 한다 |
| C-10 | 프로필 글꼴 = **계열 1개** + 굵기 2개(`typography_tokens.family · headingWeight · bodyWeight`), 픽스처 값은 700/400뿐 | `domain/profileDraft.ts:170` · `kit/tokens.ts` `--site-font` | 사이트 1개가 싣는 계열은 지금 **1개**. 굵기 파일은 최대 2개 |
| C-11 | 현재 렌더 문서 JS 82.28KB(멈춤선 89.70) · CSS 7.82KB(상한 30) | `dev/active/m2b-2c/REPORT.md:54-55` | 모션 = CSS만 → JS +0 목표 |

---

## 1. 모션 — 결정 요약

1. **CSS만**. 내보낸 사이트 JS 0 추가, 스크롤 연동(JS·CSS `animation-timeline` 모두) 0, 무한 반복 0(`animation-iteration-count: 1`), 자동 재생은 첫 화면 1회뿐.
2. **기본 상태 = 최종 상태.** 모든 규칙은 "움직이지 않아도 이미 완성된 모양"을 기본 스타일로 두고, 모션은 `@keyframes`의 `from`만 정의해 거기서 출발한다. 모션이 안 돌면(미지원·감소 설정·인쇄·캡처·캔버스) 그대로 최종 상태다.
3. **재생 스위치는 정적 HTML에만.** 모션 규칙은 사이트 루트에 `data-motion-play`가 있을 때만 걸린다. 렌더 문서(편집 캔버스·숨은 내보내기 iframe)는 이 속성을 **쓰지 않고**, 정적 HTML 생성기가 조립할 때 사이트 루트에 붙인다. → 캔버스 첫 그리기·사각형 측정·PNG는 항상 최종 상태(MQ-M2B3-5).
4. **`prefers-reduced-motion: reduce` = L0.** 모션 규칙 전체를 `@media screen and (prefers-reduced-motion: no-preference)` 안에만 둔다(옵트인). 감소 설정·인쇄에서는 규칙 자체가 없다.
5. **속성은 `transform`·`opacity`만**(예외 0). 이동은 **세로(translateY)·rem 단위만** — 가로 이동은 390 폭 가로 넘침 위험. 섹션 루트(`[data-kit]`)는 움직이지 않는다 — 섹션 사각형이 선택 오버레이·PNG 높이(`pageBottom`)의 기준이다.
6. **등장은 첫 화면만.** 스크롤 연동이 없으므로 화면 밖 섹션의 시간 기반 등장은 사용자가 볼 수 없다(바이트만 쓴다). 등장 대상 = 문서 순서상 **hero + 그 뒤 본문 2개**(= `withMotion`이 L2를 주는 자리와 같다). 그 밖의 본문은 L1/L2여도 등장 0.

### 1.1 레벨 정의

| 레벨 | UI 표기(TRD 4.1) | 내용 |
|---|---|---|
| **L0** | 없음 | 모션 규칙 0. 모든 상태 변화는 즉시. 감소 설정·인쇄·캔버스·PNG의 실제 상태 |
| **L1** | 약함 | ① 메뉴 시트(`[popover]`) 열림: 투명도 + 짧은 위에서 내려옴 ② 첫 화면 섹션 등장: **투명도만**(이동 0) — 섹션당 대상 1~2개 |
| **L2** | 중간 | L1 + ③ 첫 화면 등장에 짧은 이동(rise) 추가 ④ 순차 지연(stagger, 최대 3단) ⑤ hero 이미지 칸 안쪽 약한 확대에서 원래 크기로(1회) ⑥ hero/text 강조선 길이 늘어남 |
| L3 | 강함 | **생성 0**(R-07 · MVP 상한 L2). 레퍼런스 표기용으로만 남는다 |

- 섹션의 실효 레벨 = `min(section.motion, 변형 maxMotion)`(C-9). 감소 설정이면 CSS에서 L0.
- L1/L2 차이를 "느낌"이 아니라 **대상 수와 속성**으로 정의했다 — [U]로 검사 가능.

### 1.2 모션 토큰 (`--site-motion-*`, 프로필과 무관한 고정값 — `kit/motion.css`의 `[data-site-root]` 안에 둔다)

| 토큰 | 값 | 쓰는 곳 | 근거 |
|---|---|---|---|
| `--site-motion-dur-sheet` | `200ms` | 메뉴 시트 열림 | 조작 응답은 짧게(앱 `--duration-normal` 180 근처, 앱 토큰은 참조 금지 C-8) |
| `--site-motion-dur-enter` | `420ms` | 첫 화면 등장 | 0.5초 미만 — 첫 화면이 늦게 읽히지 않게 |
| `--site-motion-dur-zoom` | `720ms` | hero 이미지 확대→원래 | 가장 긴 1회 모션. 1초 미만 |
| `--site-motion-stagger` | `80ms` | 순차 지연 1단 | 3단 상한 → 최대 지연 240ms |
| `--site-motion-ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | 등장·확대 | 감속(들어와서 멈춤) |
| `--site-motion-ease-std` | `cubic-bezier(0.4, 0, 0.2, 1)` | 시트 | 표준 |
| `--site-motion-rise` | `0.75rem` | L2 등장 이동 거리(translateY 양수 → 0) | 글자 크기에 비례(rem) · 200% 글자에서도 비율 유지 |
| `--site-motion-drop` | `-0.5rem` | 시트 열림 출발 위치 | 위에서 내려옴 |
| `--site-motion-zoom` | `1.04` | hero 이미지 출발 배율 → 1 | 칸 밖으로 넘치지 않게 칸에 `overflow: clip` |

- **모든 모션이 끝나는 최대 시각 = 240ms(지연) + 720ms = 0.96초** < 5초(WCAG 2.2.2 "자동 움직임 5초" 미만 → 멈춤 장치 불필요). [U]: 토큰 합으로 검사(MF-AC-U3).
- `animation-fill-mode: backwards`(지연 동안 `from` 유지, 끝나면 기본 스타일 = 최종) · `animation-iteration-count: 1` 고정.
- 숫자 값(ms·배율·cubic-bezier)은 `kit/motion.css` 한 파일에만 둔다. 다른 킷 CSS는 계속 모션 0(C-7). `noHardcodedStyle` 가드는 px·hex만 보므로 ms 값과 충돌 없음 [L1 — 가드 대상 확인은 M2B-4가 실행으로 재확인].

### 1.3 선택자 계약

```
[data-site-root][data-motion-play] … [data-kit][data-motion="L1"|"L2"] …   ← 재생 조건
@media screen and (prefers-reduced-motion: no-preference) { … }          ← 감소 설정 = 규칙 없음
```
- `data-motion` = 섹션 루트(`[data-kit]`)에 렌더가 쓰는 실효 레벨. **L0이면 속성을 쓰지 않는다**(바이트 절약 · 정적 HTML 흔적 최소).
- `data-motion-play` = 정적 HTML 생성기만 사이트 루트에 붙인다(렌더 문서·PNG 0). 두 속성 모두 `KEPT_DATA`에 추가(C-2).
- 첫 화면 범위(hero + 뒤 본문 2개) 판정은 **렌더가 데이터로** 한다: 그 밖 본문 섹션은 `data-motion`을 쓰지 않는다(=등장 0). header는 시트 열림만 있으므로 위치와 무관하게 `data-motion="L1"`을 쓴다. CSS 위치 선택자(`:nth-child`)는 쓰지 않는다 — 래퍼 구조가 바뀌면 조용히 틀린다.
- PNG 캡처 CSS(`buildCaptureSvg`가 넣는 `<style>`) 끝에 **방어 규칙** `[data-site-root] *, [data-site-root] *::before, [data-site-root] *::after { animation: none !important; transition: none !important; }`를 덧붙인다(재생 스위치가 없어도 이중 방어 · C-4).

### 1.4 30변형 대상표

열: 상한 = 엔진 `maxMotion` · L1 = 실효 L1일 때 · L2 = 실효 L2일 때(L1 포함). 대상은 SPEC-BOUND/BODY 절 7 후보에서 골랐고, 뺀 후보는 "제외" 열에 사유.

**header (상한 L1 — 4변형)**

| 변형 | L1 | L2 | 제외(사유) |
|---|---|---|---|
| `sticky-right-cta` | 메뉴 시트 열림: `opacity 0→1` + `translateY(var(--site-motion-drop))→0`, `dur-sheet` · `ease-std`. `@starting-style` + `transition`(`overlay`·`display` `allow-discrete`) | (상한 L1) | — |
| `sticky-hamburger` | = `sticky-right-cta` 시트 | — | — |
| `sticky-two-tier` | = 시트(390 폭에서 시트가 있을 때) | — | 스크롤 시 보조 줄 접힘(스크롤 연동 — MQ-B6 결정 "CSS만", 시간 기반으로 불가) |
| `transparent` | = 시트(시트가 있는 폭) | — | 스크롤하면 면이 생기는 효과(스크롤 연동·고정 필요) · 메뉴 hover 밑줄 굵기(속성 원칙 밖) |

- `@starting-style` 미지원 브라우저 = 즉시 열림(최종 상태) — 기능 영향 0. 지원 범위 [확인 필요 — M2B-4가 Chrome·Safari·Firefox 현재판에서 실측].
- 시트 **닫힘** 모션 0(즉시) — 닫힘은 앵커 이동과 겹치면(고정 스크립트 `hidePopover`) 이동이 늦어 보인다.

**hero (상한 L2 — 6변형) · 첫 화면 등장 대상**

| 변형 | L1 (투명도만) | L2 (L1 + 이동·순차·확대) | 제외 |
|---|---|---|---|
| `fullbleed-left` | 카피 묶음(제목·부제·CTA를 감싼 블록 1개) `opacity 0→1` `dur-enter` | 카피 묶음 + `translateY(rise)→0` · 배경 이미지(있을 때) 확대 `scale(zoom)→1` `dur-zoom` | 면 색 변화(대비 판정 흔들림) |
| `split` | 카피 묶음 투명도 | 카피 묶음 이동 + 이미지 칸 안쪽 확대(칸 `overflow: clip`) · 순차 1단(이미지 = stagger×1) | — |
| `center` | 제목 블록 투명도 | 제목 이동 · 부제 = stagger×1 · CTA 묶음 = stagger×2 | 면 명도 변화(SPEC-BOUND 금지 후보) |
| `grid` | 카피 묶음 투명도 | 카피 이동 · 타일 B = stagger×1 · 타일 C = stagger×2(투명도+이동) · 타일 A 안쪽 확대 | — |
| `text` | 제목 블록 투명도 | 제목 이동 · 강조선 `scaleX(0)→1`(`transform-origin` = 글 시작 쪽) `dur-enter` stagger×1 | 제목 줄 단위 등장(줄 나눔 마크업이 필요 — 폭마다 줄이 달라 CSS로 불가) |
| `image` | 카피 띠 투명도 | 카피 띠 이동 · 이미지 확대 | 패럴랙스(스크롤 연동 — MQ-B6) |

- **CTA·링크 자체는 투명도 출발값이 0이어도 누름 영역은 그대로**다(opacity는 hit-test를 바꾸지 않음). 단 등장 중 `pointer-events`를 바꾸지 않는다.
- 이미지 확대는 `img`/플레이스홀더 요소에만 걸고 그 칸(`figure` 등)은 `overflow: clip` — 확대가 칸 밖·가로 넘침을 만들지 않는다(MF-AC-B4).

**footer (상한 L0 — 4변형)** — `biz-extended` · `biz-extended-map` · `minimal` · `minimal-biz`: 모션 0. 속성도 쓰지 않는다.

**본문 (16변형) — 첫 화면(hero 뒤 2개)일 때만 등장. 그 밖 위치 = 0**

| 변형 | 상한 | L1 (투명도만) | L2 | 제외 |
|---|---|---|---|---|
| `about/story` | L2 | 글 묶음 | 글 묶음 이동 · 이미지 칸 = stagger×1(투명도+이동, 확대 0) | — |
| `about/text` | L1 | 글 묶음 | (상한 L1) | — |
| `services/cards-3` | L2 | 카드 목록 전체 1블록 | 카드 1·2·3 = stagger×0·1·2(투명도+이동) | hover 들림(조작 요소 아님) |
| `services/list` | L1 | 목록 블록 1개 | (상한 L1) | 항목 순차(항목 수 가변 — L1은 순차 0) |
| `services/cards-2` | L2 | 카드 목록 1블록 | 카드 1·2 = stagger×0·1 | hover 들림 |
| `services/cards-masonry` | L2 | 카드 목록 1블록 | 카드 stagger(투명도만 — **이동 0**) | 이동(폭 전환 때 단 균형이 바뀌어 겹쳐 보임 — SPEC-BODY 후보 판단) |
| `portfolio/grid-3` | L2 | 칸 목록 1블록 | 칸 1·2·3 stagger(투명도+이동) | hover 확대(조작 요소 아님) |
| `portfolio/masonry` | L2 | 칸 목록 1블록 | 칸 stagger(투명도만, 이동 0 — masonry와 같은 이유) | — |
| `portfolio/grid-2` | L2 | 칸 목록 1블록 | 칸 1·2 stagger(투명도+이동) | — |
| `statistics/stats-3` | L2 | 수치 목록 1블록 | 수치 1·2·3 stagger(투명도+이동) | 숫자 세기(count-up — JS 필요·글자 변경) |
| `testimonials/quotes-2` | L1 | 후기 목록 1블록 | (상한 L1) | — |
| `pricing/tiers-2` | L1 | 요금 목록 1블록 | (상한 L1) | — |
| `faq/accordion` | L1 | **0**(펼침 목록 — 열림 모션 0, K-AC-03 유지) | — | 펼침 높이 애니메이션(height = 속성 원칙 밖) |
| `contact/form` | L1 | **0**(폼은 움직이지 않는다 — 읽기·입력 우선) | — | 등장 전체 |
| `contact/booking` | L1 | **0**(같은 이유) | — | 등장 전체 |
| `cta-band/banner` | L2 | 글 묶음(제목·본문) | 글 묶음 이동 · **CTA 버튼은 움직이지 않음** | CTA 등장(누를 요소가 움직이면 누르기 어려움 — SPEC-BODY) |

- **순차(stagger) 상한 3단**: 4번째 이후 항목은 3단과 같은 지연. CSS는 `:nth-child(1~3)`만 적고 `:nth-child(n+4)`는 3단 값을 공유(항목 수 가변에도 규칙 수 고정).
- 등장 대상은 섹션 **안쪽 블록**이다. 섹션 루트·섹션 배경 면은 움직이지 않는다(1절 5).
- 등장 0인 변형(`faq` · `contact` · footer)은 첫 화면 자리에 와도 속성을 쓰지 않는다(렌더 표 1곳에서 판정).

### 1.5 최종 상태 보장 규칙 (첫 그리기 · PNG · 정적 HTML)

| 경로 | 보장 방법 | 검증 |
|---|---|---|
| 편집 캔버스 첫 그리기·재그리기 | `data-motion-play` 없음 → 규칙 미적용 → 기본 스타일 = 최종. 편집할 때마다 다시 마운트돼도 등장이 반복되지 않는다 · 슬롯 사각형이 이동 중 값으로 잡히지 않는다 | MF-AC-B1 |
| 숨은 내보내기 iframe(serialize·rects) | 같음(렌더 문서는 스위치를 쓰지 않음) | MF-AC-U1 |
| PNG | 스위치 없음 + 캡처 CSS 방어 규칙(1.3) → t≈0 프레임이어도 최종 | MF-AC-B2 |
| 정적 HTML — 모션 지원 브라우저 | 첫 화면 섹션만 최대 0.96초 안에 최종 도달 · 그 밖 섹션은 처음부터 최종 | MF-AC-B3 |
| 정적 HTML — 감소 설정 · 인쇄 · CSS 애니메이션 미지원 · `@starting-style` 미지원 | 규칙 없음 → 처음부터 최종 | MF-AC-B3 · MF-AC-U2 |

- "첫 그리기에서 등장 출발 상태(투명)가 보이는 것"은 **정적 HTML을 모션 켠 브라우저로 열 때 첫 0.96초 안**에만 생긴다 — 이것이 L1/L2를 고른 사용자가 기대하는 동작이다. 이것도 원하지 않으면 MQ-M2B3-1 B안(등장 0).

### 1.6 사용자 선택 위치 · 기본값

- **위치 = 프로필 값 `motion_preset`**(TRD 4.3, 이미 존재). 비교 보드 "모션" 행에서 레퍼런스 모션을 고르면 `MOTION_PRESET`(low → L1 · mid/high → L2)으로 들어가고, 프로필 조정의 `motion` 키(`adjustmentSchema` L0~L2)로 바꾼다. **새 UI·필드 0.**
- **기본값**: 레퍼런스에서 고르지 않은 초안 = 지금 코드의 기본값을 그대로 쓴다(바꾸지 않음). 이 명세가 바꾸는 것은 L1/L2가 **실제로 무엇을 움직이는지**뿐이다.
- 편집 캔버스에서 모션을 미리 재생하는 기능은 만들지 않는다(MQ-M2B3-5 ★A) — 캔버스 = 최종 상태, 확인은 내보낸 정적 HTML.

### 1.7 모션 구현 예산 (렌더 문서 · ADR-004 개정 2·4)

| 항목 | 추정 | 근거 |
|---|---|---|
| 렌더 문서 JS | **+0 ~ +0.15KB**(속성 1개 쓰기 + 첫 화면 판정 함수) [추정] | 모션 로직 0 · 속성 계산만. 멈춤선 89.70 대비 여유 7.42(82.28 기준) |
| 렌더 문서 CSS | **+1.2 ~ +2.0KB gzip** → 약 9.0 ~ 9.8 / 30 [추정] | 규칙 약 40블록(header 1 · hero 6 · 본문 12 · 공통 토큰·keyframes 4) × 평균 40~50B gzip |
| 내보낸 사이트 JS | **+0**(고정 스크립트 바이트 불변) | C-3 |
| `/studio` 진입(128 · 여유 0.50) | **+0**(앱 쪽 변경은 조작 뒤 청크인 정적 HTML·PNG 생성기만) | 생성기는 이미 조작 뒤 청크 |

- M2B-4는 시작 때 hero 1변형 시제품으로 CSS 증가량을 실측하고, 30변형 합 예상이 CSS 30 · JS 89.70을 넘으면 구현 전에 멈춘다(M2B_PLAN 3절 규칙).
