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

---

## 2. 폰트 — 결정 요약

1. **사이트 1개 = 프로필 계열 1개만 싣는다**(C-10). TRD "≤ 2계열"은 상한이고, 지금 데이터 모델(계열 1개)로는 1계열이다. 제목/본문 계열 분리 필드는 **만들지 않는다**(YAGNI — 두 번째 계열 자리는 상한으로만 남김).
2. **프로필이 고르지 않은 계열은 절대 싣지 않는다** — 허용 3종 파일이 저장소에 다 있어도 그 사이트가 쓰는 계열·굵기의 파일만 내려받거나 인라인한다. 폴백 와이어프레임 글자·고정 표식 글자 = 같은 `--site-font` 스택(웹폰트 추가 0).
3. **굵기 파일 = 최대 2개**(`headingWeight`·`bodyWeight`). 커밋하는 굵기는 **400 · 700 두 개**뿐이고, 프로필 값은 가장 가까운 쪽으로 맞춘다(2.2).
4. **서브셋 = KS X 1001 한글 2,350자 + 기본 라틴·숫자 + 고정 기호 목록**(2.3, MQ-M2B3-2 ★A). 목록 밖 글자는 같은 스택의 시스템 글꼴로 글자 단위 대체.
5. **woff2 · `font-display: swap` · `local()` 0**(로컬 설치 폰트가 파일 누락을 가리지 않게 — 앱 `fonts.css`와 같은 규칙).
6. **RFN**: 우리가 서브셋한 파일(Noto 2종)은 **새 이름**(`Kit Sans KR` · `Kit Serif KR`), Pretendard는 **업스트림 공식 서브셋을 무수정**으로 써서 원래 이름 유지(MQ-M2B3-4 ★A). OFL 1.1 전문·저작권 고지를 파일 옆과 내보낸 HTML 안에 동봉.

### 2.1 허용 3종 → 사이트 파일 대응표

| 프로필 `family`(fonts.ts) | 사이트 CSS 별칭(`@font-face` family) | 파일 출처 | 수정 여부 | 커밋 위치(제안) |
|---|---|---|---|---|
| `Pretendard` | `"Pretendard"` | 업스트림 Pretendard v1.3.9 공식 `woff2-subset`(KS X 1001 + 라틴 — 저장소 `app/src/styles/tokens/fonts.css` 머리말 [L1]) | **무수정 = Original Version** → RFN 이름 유지 가능 | **새 파일 0** — 이미 커밋된 `app/src/assets/fonts/Pretendard-{Regular,Bold}.subset.woff2`를 그대로 참조(Vite가 같은 해시 자산 1개로 합친다 [추정]) |
| `Noto Sans KR` | `"Kit Sans KR"` | google/fonts `ofl/notosanskr/` 변수 폰트(`NotoSansKR[wght].ttf` [확인 필요 — 파일명은 고정 커밋에서 확인]) → 굵기 고정 → 서브셋 | **수정본** → RFN `Source` 사용 금지 · "Noto"도 보수적으로 쓰지 않음 | `app/src/assets/site-fonts/kit-sans-kr/KitSansKR-{400,700}.woff2` |
| `Noto Serif KR` | `"Kit Serif KR"` | google/fonts `ofl/notoserifkr/NotoSerifKR[wght].ttf`(FONT-01 3.3 METADATA 기록 [L2]) → 굵기 고정 → 서브셋 | **수정본** → RFN은 확인되지 않았지만 일관성 위해 새 이름 | `app/src/assets/site-fonts/kit-serif-kr/KitSerifKR-{400,700}.woff2` |

- 별칭 이름 규칙: RFN 문자열(`Pretendard`·`Source`·`Inter`·`M PLUS 1`)·`Noto`·제품 브랜드명·`apfs` 포함 0(ADR-002). `Kit`은 내부 섹션 킷 용어라 브랜드 아님. 대소문자 무시 검사(MF-AC-G5).
- 렌더가 쓰는 스택(`kit/tokens.ts` `fontStack`)은 **프로필 계열 이름 대신 별칭**을 맨 앞에 둔다. 지금처럼 `"Noto Sans KR"`을 그대로 쓰면 사용자 컴퓨터에 설치된 원본이 잡히거나(미리보기마다 다름) 아무것도 안 잡힌다.
  - sans: `"<별칭>", system-ui, -apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
  - serif: `"Kit Serif KR", "AppleMyungjo", "Batang", serif`
  - 시스템 글꼴 이름은 폴백 이름일 뿐 파일을 싣지 않는다(라이선스 대상 아님).
- 각 계열 폴더에 `OFL.txt`(업스트림 원문 그대로) + `SOURCE.md`(2.6 형식). Pretendard는 이미 저장소 루트 `LICENSES.md`에 원문이 있다 [L1] — `SOURCE.md`만 `app/src/assets/fonts/`에 추가하거나 `LICENSES.md` 표에 업스트림 체크섬 열을 더한다(M2B-4 판단, 둘 중 하나).

### 2.2 굵기

- 커밋 = **400 · 700**(계열당 2파일, Noto 2종 → 새 바이너리 4개). 픽스처·레퍼런스 값이 700/400뿐이다 [L1 — `headingWeight: 700` 8건 · `bodyWeight: 400` 8건].
- 프로필 값 대응(프로토콜은 100~900 허용 — `render/protocol.ts:62`): `≤ 550 → 400` · `> 550 → 700`. 대응 결과로 `--site-weight-*`도 같은 값을 쓴다(파일 없는 굵기를 브라우저가 가짜 굵게 만드는 것 방지 · `font-synthesis: none`을 사이트 루트에).
- 제목·본문이 같은 굵기로 대응되면 파일 1개만 싣는다.
- 가변(variable) woff2를 그대로 쓰지 않는 이유: 한글 가변 폰트는 굵기 축 데이터 때문에 정적 1굵기보다 크다 [추정] · 우리는 2굵기만 쓴다.

### 2.3 서브셋 문자 범위 (MQ-M2B3-2)

| 후보 | 한글 | 그 밖 | 굵기당 woff2 크기 | 근거 |
|---|---|---|---|---|
| **A ★ KS X 1001** | 2,350자(EUC-KR 0xB0A1~0xC8FE — 로컬 계산으로 2,350 확인 [L1]) | 아래 고정 목록 | Pretendard **267~271KB**(저장소 파일 실측 [L1] `ls -l app/src/assets/fonts`) · Noto Sans KR **약 250~300KB** [추정 — Pretendard 한글이 Source Han Sans = Noto Sans CJK 계열이라 비슷하다고 봄] · Noto Serif KR **약 330~450KB** [추정 — 명조 윤곽 점이 더 많음] | 일상 한국어 문장의 대부분을 덮는다 [추정 — 상용 한글 2,350자 통념, 공식 통계 미확인] |
| B 완성형 전체 | 11,172자(U+AC00~D7A3) | 같은 목록 | A의 약 3~4배 → 굵기당 **약 0.8~1.2MB** [추정] | 드문 음절(이름·의성어 예: 똠·햏·뷁)도 같은 글꼴 |
| C 사이트 글자만 동적 서브셋 | 사용된 글자만 | — | 수십 KB [추정] | 내보내기 때 서브셋 도구가 필요 → 새 의존성·런타임 — **이번 범위 밖**(M4 이후 후보) |

- **추천 A 근거**: (1) 단일 정적 HTML은 base64 인라인(C-1)이라 크기가 ×1.33으로 부풀어 B는 HTML 1개가 2~3MB대 [추정] (2) 목록 밖 글자는 같은 스택의 시스템 고딕/명조로 대체되어 **글자가 사라지지 않는다**(두부 □ 0) — 모양만 섞인다 (3) Pretendard는 업스트림 공식 서브셋이 정확히 A라 무수정으로 쓸 수 있다.
- A의 위험: 상호·인명에 2,350자 밖 음절이 있으면 그 글자만 다른 글꼴로 보인다. 감지 기능(문제 목록 안내)은 이번 범위에 넣지 않는다 — 앱 쪽 검사 코드가 `/studio` 진입(여유 0.50)이나 조작 뒤 청크를 늘린다. M2B-6 QA가 샘플로 확인(QB-MF-07).
- **고정 기호 목록**(Noto 2종 서브셋에 넣을 것 — Pretendard 업스트림 서브셋의 실제 cmap과는 M2B-4가 비교해 차이를 REPORT에 기록 [확인 필요]):
  - U+0020–007E(기본 라틴·숫자·ASCII 기호) · U+00A0 · U+00A9 © · U+00AE ® · U+00B0 ° · U+00B7 · · U+00D7 ×
  - U+2013 – · U+2014 — · U+2018 ‘ · U+2019 ’ · U+201C “ · U+201D ” · U+2022 • · U+2026 … · U+203B ※
  - U+20A9 ₩ · U+2192 → · U+2122 ™
  - U+3001–3003 · U+3008–3011(〈〉《》「」『』【】) · U+301C 〜
  - U+3131–318E 한글 호환 자모(ㄱ~ㅣ 94자 — "ㅋㅋ", "ㅇㅇ" 같은 입력)
  - U+FF5E ～(전각 물결)

### 2.4 로드 방식 — 앱 미리보기(렌더 문서) · 정적 HTML · PNG

| 경로 | 방식 | 이유·조건 |
|---|---|---|
| **렌더 문서**(편집 캔버스 · 숨은 내보내기 iframe) | **1안**: `kit/fonts.css`(새 파일)의 `@font-face` 6규칙(3계열 × 400·700)이 같은 서버 woff2 `url()` 참조. 브라우저는 실제로 쓰는 계열·굵기만 받는다(`@font-face` 지연 로드) → CSS 증가 ≈ 0.4KB gzip [추정], 폰트 바이트는 예산 밖. **2안**(1안이 CORS로 막힐 때): 부모가 같은 출처에서 woff2 바이트를 받아 `postMessage`로 `ArrayBuffer` 전달 → 렌더 문서가 `new FontFace(별칭, buffer, {weight})` + `document.fonts.add` — 렌더 JS +0.1~0.2KB [추정] | C-5: 불투명 출처 iframe의 폰트 요청은 `Origin: null` CORS. Vite dev 서버·운영 정적 호스팅이 이를 허용하는지 [확인 필요 — M2B-4 E0 첫 실측]. 1안 통과 시 1안 |
| 렌더 문서 사각형·serialize 시점 | 그 사이트의 폰트 로드가 끝난 뒤(`document.fonts.ready` 또는 해당 `FontFace.load()`) 첫 `rects`를 보낸다. 실패·3초 초과 시 폴백 글꼴로 계속(오류 아님) + 콘솔 0 | 폰트가 늦게 바뀌면 줄바꿈이 달라져 사각형·PNG 높이가 어긋난다 |
| **정적 HTML** | 그 사이트가 쓰는 1계열 × ≤2굵기만 `@font-face { src: url(data:font/woff2;base64,…) format("woff2"); font-display: swap; }`로 `<style>` 안에 인라인. 렌더 문서의 `url()` 6규칙은 빼고 이것으로 바꾼다 | C-1(외부 요청 0 유지) · MQ-M2B3-3 ★A |
| 정적 HTML 라이선스 고지 | `<head>`에 고정 주석 1개: 사용 계열의 저작권 줄 + "Modified from …"(Noto 2종) + **OFL 1.1 전문**. 사용자 글자 0(문서마다 계열별로 바이트 동일) | OFL 조건 2 "each copy contains the above copyright notice and this license". 전문 약 4.4KB[추정] — 폰트 수백 KB 대비 무시. 이름 테이블 13·14만으로는 전문이 아님 |
| **PNG** | 캡처 CSS(`buildCaptureSvg`의 `<style>`)에 정적 HTML과 **같은** `data:` `@font-face`를 넣는다. 그린 뒤 캔버스 전에 `img.decode()` | C-4. SVG 이미지 안 `data:` 폰트가 첫 그리기에 반영되는지 브라우저별 [확인 필요 — 위험 R-3]. PNG는 글자를 그림으로 바꾼 결과라 폰트 재배포가 아니다 → 라이선스 고지 불필요 [L2 — OFL FAQ 문서·이미지 항목, 법률 자문 아님] |
| 앱 UI(`/studio` 등) | 변경 0. 앱 `fonts.css`(Pretendard 4굵기)는 그대로 | 앱 예산 영향 0 |

### 2.5 RFN 준수 방법 (Noto 2종 수정본)

1. **이름 테이블 교체**(fontTools, 저장소 밖에서): nameID **1·4·6·16**(계열·전체 이름·PostScript·타이포 계열) = 새 이름(`Kit Sans KR` · `Kit Sans KR Regular`/`Bold` · `KitSansKR-Regular`/`-Bold`), nameID **2·17** = `Regular`/`Bold`, nameID **3**(고유 ID) = `KitSansKR-Regular;subset-ksx1001;<원본 sha256 앞 12자>`. nameID **5**(버전) = 원본 값 + `; subset KS X 1001 (Design Studio M2B-4)`.
2. **보존**: nameID **0**(저작권) · **13**(라이선스 설명) · **14**(라이선스 URL) 원문 그대로. `pyftsubset`은 기본값이 일부 name ID만 남기므로(기본 `--name-IDs`가 13·14를 빼는지 [확인 필요 — fontTools 문서]) **`--name-IDs='*'`로 전부 남긴 뒤** 1번 교체를 스크립트로 한다.
3. **사후 검사**(재현 명령에 포함 · 결과를 `SOURCE.md`에 붙임): 모든 name 레코드(플랫폼 전부)에서 `source`·`pretendard`·`inter`·`m plus 1`·`noto`를 대소문자 무시로 찾아 **0건** — 단 nameID 0·13·14(원문 고지)와 nameID 5의 "Modified from" 설명은 검사 제외 목록으로 명시.
4. **OFL 동봉**: 각 계열 폴더 `OFL.txt` = google/fonts 고정 커밋의 원문 그대로(바이트 동일, sha256 기록).
5. **고지 문구**(`SOURCE.md`·정적 HTML 주석 공통): `Kit Sans KR is a Modified Version of Noto Sans KR (Copyright 2014-2021 Adobe, with Reserved Font Name 'Source'), subset and renamed. Licensed under the SIL Open Font License 1.1.`
6. 순수 woff2 압축 예외(FONT-01 2절 FAQ 2.2.1)는 **쓰지 않는다** — 서브셋은 무조건 수정본으로 다룬다(보수적 기본값, FONT-01 9절 1).

### 2.6 원본 출처 · 버전 고정 · 체크섬 · 재현 명령

- **출처**(FONT-01 3절 공식 URL만):
  - Pretendard: `https://github.com/orioncactus/pretendard/releases/tag/v1.3.9` — 저장소에 이미 있는 2파일을 업스트림 릴리스 ZIP 안 같은 이름 파일과 **sha256 대조만** 한다(바이트가 다르면 멈춤 보고 — 출처가 npm 복사본이라 [L1 `LICENSES.md`] 공식 ZIP과 같은지 미확인).
  - Noto Sans KR / Serif KR: `https://github.com/google/fonts` **고정 커밋 해시**의 `ofl/notosanskr/` · `ofl/notoserifkr/`(시맨틱 버전 없음 — FONT-01 3.2) + `METADATA.pb`의 upstream 버전(Sans 2.004 · Serif 2.003)을 함께 기록.
  - 내려받기 URL 형식: `https://raw.githubusercontent.com/google/fonts/<commit>/ofl/notosanskr/<파일>` — `main` 같은 움직이는 참조 금지.
- **`SOURCE.md` 형식**(계열 폴더마다):

```
| 항목 | 값 |
| 원본 URL | <commit 고정 URL> |
| 원본 sha256 | <64자> |
| upstream 버전 | Noto Sans CJK 2.004 (METADATA.pb) |
| 도구 | Python <x.y.z> · fonttools==<pin> · brotli==<pin> (저장소 밖 임시 venv) |
| 결과 파일 sha256 | KitSansKR-400.woff2 <64자> · KitSansKR-700.woff2 <64자> |
| 글자 수 | cmap 항목 수 <n> (한글 2,350 + 기호 <m>) |
| RFN 사후 검사 | 0건 (명령 출력 붙임) |
| 재현 명령 | 아래 블록 |
```

- **재현 명령**(M2B-4가 저장소 밖 `/tmp`에서 실행 · 신규 의존성 0 · 결과물만 커밋 — 아래는 형식이며 실제 플래그는 실행 결과로 확정 [확인 필요]):

```bash
python3 -m venv /tmp/m2b4-fonts && . /tmp/m2b4-fonts/bin/activate
pip install 'fonttools==<pin>' 'brotli==<pin>'
# 1) 문자 목록 — KS X 1001 한글 2,350 + 2.3 고정 기호
python3 - > /tmp/m2b4-fonts/chars.txt <<'PY'
print(''.join(bytes([h, l]).decode('euc-kr') for h in range(0xB0, 0xC9) for l in range(0xA1, 0xFF)))
PY
# 기호는 --unicodes 로 따로 준다 (2.3 목록)
# 2) 굵기 고정 (변수 → 정적)
fonttools varLib.instancer 'NotoSansKR[wght].ttf' wght=400 -o /tmp/m2b4-fonts/s400.ttf
# 3) 서브셋 + woff2 (name 전부 보존 후 4에서 교체)
pyftsubset /tmp/m2b4-fonts/s400.ttf --text-file=/tmp/m2b4-fonts/chars.txt \
  --unicodes='U+0020-007E,U+00A0,U+00A9,U+00AE,U+00B0,U+00B7,U+00D7,U+2013,U+2014,U+2018,U+2019,U+201C,U+201D,U+2022,U+2026,U+203B,U+20A9,U+2122,U+2192,U+3001-3003,U+3008-3011,U+301C,U+3131-318E,U+FF5E' \
  --name-IDs='*' --layout-features='*' --flavor=woff2 --output-file=/tmp/m2b4-fonts/tmp400.woff2
# 4) 이름 교체 + 5) RFN 사후 검사 — fontTools TTFont로 2.5의 1·3을 수행하는 짧은 스크립트(저장소 밖)
sha256sum <원본> <결과>   # macOS: shasum -a 256
```

- 커밋 대상: 결과 `.woff2` · `OFL.txt` · `SOURCE.md`만. venv·중간 파일·스크립트 파일은 커밋 0(재현 명령은 `SOURCE.md` 안 텍스트로만).

---

## 3. 예산

### 3.1 렌더 문서 (ADR-004 개정 2 — JS 멈춤선 89.70 · CSS 30)

| 항목 | 지금 [L1] | M2B-4 증가 [추정] | 끝 예상 [추정] |
|---|---|---|---|
| JS | 82.28 | 모션 속성 +0~0.15 · 폰트 1안 +0 / 2안 +0.1~0.2 · 폰트 대기(`fonts.ready`) +0.05 | **약 82.3 ~ 82.7** (여유 ≥ 7) |
| CSS | 7.82 | 모션 +1.2~2.0 · `@font-face` 6규칙 +0.4 | **약 9.4 ~ 10.2** / 30 |

- 폰트 woff2 바이트는 JS·CSS 판정 밖(M2B_PLAN 3절) — 크기만 출력.
- `/studio` 진입(127.20 / 128): 증가 0이 원칙. 정적 HTML·PNG 생성기 변경은 조작 뒤 청크(판정 밖, 크기만 출력). 폰트 `data:` 인라인 코드도 그 청크 안.

### 3.2 내보낸 사이트 폰트 예산 (제안 — TRD 8절 "폰트 ≤ 2계열 서브셋"을 수치로)

| 기준 | 값 | 근거 |
|---|---|---|
| 계열 수 | **≤ 1**(현 모델) · 절대 상한 2 | C-10 · TRD |
| 파일 수 | **≤ 2**(굵기 2) | 2.2 |
| woff2 합계(정적 HTML 인라인 전 바이트) | **≤ 900KB** [추정 기반 — M2B-4 실측 후 재확정] | Pretendard 2굵기 = 538KB 실측 [L1] · Noto Serif KR 2굵기 = 약 660~900KB [추정]. 900을 넘는 계열이 나오면 M2B-4가 멈춰 보고(굵기 1개로 줄이기 vs 예산 조정은 영환님 결정) |
| 정적 HTML 1개 크기(참고 출력) | base64 = woff2 × 약 1.33 → Pretendard 사이트 약 0.72MB + 마크업·CSS [추정] | 판정 아님 — 참고 출력 |

---

## 4. 수용 기준 (MF-AC) — [U] 단위·컴포넌트 · [G] 가드(정적 검사) · [B] 실제 브라우저

| ID | 기준 | 형식 |
|---|---|---|
| MF-AC-U1 | 렌더 문서가 그린 사이트 루트에 `data-motion-play` 0 · 섹션 `data-motion` = `min(section.motion, maxMotion)`이고 L0이면 속성 없음 · footer·`faq`·`contact` 3종 = 속성 없음 · hero 뒤 3번째 이후 본문 = 속성 없음 · header = `L1`(L0 프리셋이면 없음) | [U] |
| MF-AC-U2 | `kit/motion.css`의 모든 모션 규칙이 `@media screen and (prefers-reduced-motion: no-preference)` 안 · `[data-motion-play]` 조상 조건 포함 · `animation-iteration-count` 1 · `infinite` 0 · 애니메이션·전환 속성이 `transform`·`opacity`(+ 시트의 `overlay`·`display` allow-discrete)뿐 · `translateX` 0 | [G] |
| MF-AC-U3 | 토큰 합 `3 × stagger + dur-zoom` ≤ 1초 · 각 `dur` ≤ 720ms | [U] |
| MF-AC-U4 | 정적 HTML: 사이트 루트 `data-motion-play` 1 · `data-motion` 남음(KEPT_DATA) · 스크립트 = `STATIC_MENU_SCRIPT` 1개 **바이트 동일** · CSS `url()` 전부 `data:` | [U]·[G] |
| MF-AC-U5 | PNG 캡처 SVG `<style>` 끝에 모션 정지 방어 규칙 · `data-motion-play` 0 | [U] |
| MF-AC-U6 | 굵기 대응: 300→400 · 550→400 · 551→700 · 900→700 · 제목=본문 대응이면 `@font-face` 1개 | [U] |
| MF-AC-U7 | 정적 HTML·PNG의 `@font-face`는 프로필 계열 1개 · ≤ 2규칙 · 다른 2계열 0 · `font-display: swap` · `local(` 0 | [U] |
| MF-AC-U8 | `fontStack` 맨 앞 = 별칭(`Pretendard`·`Kit Sans KR`·`Kit Serif KR`) · `"Noto Sans KR"`·`"Noto Serif KR"` 문자열 0 · 사이트 루트 `font-synthesis: none` | [U] |
| MF-AC-G1 | `kitGuard` 모션 0 가드가 `kit/motion.css` **하나만** 예외로 두고 나머지 킷 파일은 그대로 0 | [G] |
| MF-AC-G2 | `renderFonts.test.ts`(B8) 개정: render.css·kit.css의 `@font-face` 출처 = `kit/fonts.css` 1곳 · `url()` 대상 = 허용 6파일만 · 외부 URL 0 · 앱 `fonts.css` 미포함 유지 | [G] |
| MF-AC-G3 | 라이선스 파일 존재: `site-fonts/kit-sans-kr/{OFL.txt,SOURCE.md}` · `site-fonts/kit-serif-kr/{OFL.txt,SOURCE.md}` · Pretendard 출처·체크섬 기록 · 각 `SOURCE.md`에 원본 URL(커밋 해시 고정 — `/main/` 0)·sha256 64자 2개 이상 | [G] |
| MF-AC-G4 | 정적 HTML 고지 주석: 사용 계열 저작권 줄 + OFL 1.1 전문(`SIL OPEN FONT LICENSE Version 1.1` 머리 문구 포함) · 사용자 글자 0 | [U]·[G] |
| MF-AC-G5 | RFN: 커밋된 Noto 서브셋 woff2의 name 레코드(0·13·14·5 설명 제외)에 `source`·`pretendard`·`inter`·`m plus 1`·`noto` 0건(대소문자 무시) · nameID 0·13·14 존재 — M2B-4가 fontTools로 검사한 출력을 `SOURCE.md`에 붙이고, 저장소 테스트는 `SOURCE.md`의 "RFN 사후 검사 0건" 행 존재를 본다(바이너리 파서 의존성 0) | [G] |
| MF-AC-G6 | `package.json`·`package-lock.json` 폰트 관련 의존성 추가 0 · 저장소에 venv·서브셋 스크립트 파일 0 | [G] |
| MF-AC-B1 | 편집 캔버스(1280): L2 프로필 문서를 연 직후·슬롯 편집 직후 모두 첫 화면 섹션의 계산 `opacity` = 1 · `transform` = none(등장 출발 상태 0) | [B] |
| MF-AC-B2 | PNG(1280·768·390): L2 문서 캡처에서 hero 카피·첫 본문 카드가 보인다(L0 문서 캡처와 픽셀 비교 — 차이 0 또는 폰트 렌더 차이 범위) | [B] |
| MF-AC-B3 | 정적 HTML을 연 뒤 1.0초 시점: 첫 화면 섹션 대상 `opacity` = 1 · `transform` = 항등 / 감소 설정(`prefers-reduced-motion: reduce` 에뮬레이션) 시 0초 시점부터 같음 / 인쇄 미리보기 = 같음 | [B] |
| MF-AC-B4 | 3폭(1280·768·390): 모션 재생 중·후 모두 `document.scrollingElement.scrollWidth` ≤ 뷰포트 폭(가로 넘침 0) · hero 이미지 확대가 칸 밖으로 0 | [B] |
| MF-AC-B5 | 200% 글자(루트 글자 크기 2배): 모션 이동 거리가 rem이라 비례 · 넘침 0 · 시트 열림 후 메뉴 전부 보이고 키보드로 닫힘(Esc) | [B] |
| MF-AC-B6 | 폰트: 렌더 문서·정적 HTML·PNG에서 각 계열 문서의 `h1` 계산 글꼴이 별칭과 일치(`document.fonts.check('700 1em "<별칭>"')` true · 정적 HTML 네트워크 폰트 요청 0) | [B] |
| MF-AC-B7 | 렌더 문서 사각형: 폰트 로드 전후 첫 `rects`의 섹션 높이 변화 0(로드 뒤에 보냄) · 폰트 로드 실패 시에도 그리기 계속 | [B] |
| MF-AC-B8 | 예산: 렌더 JS ≤ 89.70 · CSS ≤ 30 · `/studio` 진입 증가 0 · 내보낸 사이트 woff2 합계 ≤ 3.2 기준(계열별 실측 표) | [G](check-bundle-size)·[B] |

### 4.1 QB 목록 (M2B-6 QA 시각·수동 검수)

| ID | 확인 | 폭 |
|---|---|---|
| QB-MF-01 | L0 · L1 · L2 같은 문서 정적 HTML 3벌 — 최종 화면이 픽셀 수준으로 같다(모션은 과정만 다름) | 1280·768·390 |
| QB-MF-02 | L2 정적 HTML 첫 0.96초 녹화(또는 0·200·500·1000ms 캡처 4장): 등장이 hero + 본문 2개에만 · 3번째 본문 이후 정지 | 1280·390 |
| QB-MF-03 | 감소 설정 OS/에뮬레이션에서 정적 HTML·시트 열림 즉시 | 1280·390 |
| QB-MF-04 | 시트 열림 모션: 열림 0.2초 · 닫힘 즉시 · 앵커 누르면 고정 스크립트로 닫히고 이동 정상 | 768·390 |
| QB-MF-05 | 3계열 × 프로필 문서: 미리보기(캔버스) · 정적 HTML · PNG 세 경로의 글자 모양이 같다(같은 별칭) | 1280 |
| QB-MF-06 | 200% 글자 + L2: 겹침·잘림 0 · 이동 중에도 글자 읽힘 | 390 |
| QB-MF-07 | 서브셋 밖 글자 샘플("똠방각하 햏 뷁")이 □ 없이 시스템 글꼴로 보인다 · 같은 줄 다른 글자는 웹폰트 | 1280 |
| QB-MF-08 | 정적 HTML 소스: 고지 주석 · OFL 전문 · `data:` 폰트 ≤ 2 · 외부 요청 0(네트워크 탭) | — |

---

## 5. 위험

| ID | 위험 | 영향 | 대응 | 근거 수준 |
|---|---|---|---|---|
| R-1 | 불투명 출처 렌더 iframe의 `@font-face` CORS 거부(C-5) | 캔버스에 웹폰트 안 보임 | M2B-4 E0 첫 실측 → 막히면 2.4 2안(ArrayBuffer `FontFace`) | [확인 필요] |
| R-2 | Noto 2,350자 서브셋 크기가 추정(250~450KB)보다 큼 | 3.2 예산 초과 · 정적 HTML 비대 | 실측 후 멈춤 보고 — 굵기 1개(400) + 제목도 400 대안 vs 예산 상향은 영환님 | [추정] |
| R-3 | SVG `foreignObject` 이미지 안 `data:` 폰트가 첫 그리기에 미반영(브라우저별) | PNG만 폴백 글꼴 | `img.decode()` 후 그리기 · 그래도 다르면 부모 문서에 같은 `FontFace` 선등록 후 재시도 · 실측 기록 | [확인 필요] |
| R-4 | `@starting-style`·`transition-behavior: allow-discrete` 미지원 브라우저 | 시트가 즉시 열림(기능 영향 0) | 의도된 점진 향상 — 문제 아님 | [L2 사양 · 지원판 확인 필요] |
| R-5 | 저장소 Pretendard 파일(npm 복사본)이 공식 릴리스 ZIP과 바이트가 다름 | "무수정 Original" 전제 흔들림 | sha256 대조 · 다르면 공식 ZIP 파일로 교체(같은 이름·같은 경로) 후 앱 영향 실측, 또는 MQ-4 B안 | [확인 필요] |
| R-6 | 2,350자 밖 음절(상호·인명) | 글자 모양 섞임 | QB-MF-07 · 감지 안내는 후속 후보(앱 예산 영향 실측 필요) | [추정] |
| R-7 | 정적 HTML 단일 파일이 0.7~1.2MB [추정] | 메일 첨부·업로드 제한에 걸릴 수 있음 | 참고 출력 · zip 내보내기는 M4 | [추정] |

## 6. 이 문서가 결정하지 않는 것 (MQ-M2B3.md)
- MQ-M2B3-1 등장 모션 정책 · MQ-M2B3-2 서브셋 범위 · MQ-M2B3-3 정적 HTML 폰트 탑재 · MQ-M2B3-4 Pretendard 원본 사용 방식 · MQ-M2B3-5 캔버스 모션 미리보기. 각 ★안을 기준으로 위 본문을 썼으므로 ★ 승인 시 본문 수정 0.

## 7. 기록
- v1 2026-10-05 Designer(M2B-3). 코드·바이너리·`docs/decisions/` 변경 0, 다운로드·서브셋 실행 0(KS X 1001 2,350자 수는 로컬 Python 계산).
