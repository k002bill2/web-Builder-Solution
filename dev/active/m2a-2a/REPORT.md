# M2A-2a 킷 기반 + header·hero·footer 실렌더 — REPORT

- 브리프 `docs/06-handoff/M2A-2A_KIT-BASE_BRIEF.md` · 시작 커밋 `f0fdb2b` · 브랜치 `k002bill2/m2a-2a`(로컬 커밋만, push·병합 없음) · 2026-10-03
- 킷 디렉터리 **`app/src/kit/`**: `tokens.ts`(생성기) · `registry.ts` · `types.ts` · `text.ts`(슬롯·링크 대상) · `Media.tsx` · `HeaderStickyRightCta.tsx` · `HeroFullbleedLeft.tsx` · `FooterBizExtended.tsx` · `kit.css`
- 렌더 문서 쪽 추가: `render/PageDocument.tsx`(섹션 분기·뼈대) · `render/objectUrls.ts`(이미지 URL) · `RenderApp.tsx`(kitTokens·images·링크 다리) · `protocol.ts`(모양 검사)
- 부모 쪽 추가: `features/studio/docPurpose.ts` `docKitTokens` · `StructureCanvas`(kitTokens·images prop, NO_KIT_TOKENS 처리) · `StudioLayout`(docKitTokens 전달)

## 1. 커밋 표
| 단계 | RED | GREEN | 내용 |
|---|---|---|---|
| K0 | — | ee36db2 | 기준선 `K0-BASELINE.md` · `shots/k0-*` · `gate.sh` · `shots.mjs` |
| K1 | bde8cf5 | c235799 | 킷 토큰 입력 `docKitTokens` · 생성기 `kitVars`/`kitCssText` |
| K2 | cf72d9b | 0df2bcb | `render{doc, kitTokens}` · `error NO_KIT_TOKENS` + 폴백 계속 |
| K3 | 4c1baf4 | 8918874 | 킷 가드 · 레지스트리 · 뼈대 · 표식 `data-kit-marker` |
| K4 | 3a01c3b | 51f64aa | 이미지 Blob 전달 · object URL 생성·해제 |
| K5 | 88fbdef | 0e7d072 | header/sticky-right-cta · 링크 다리 |
| K6 | 0044bd3 | bd46950 | hero/fullbleed-left · `Media` |
| K7 | edd5ca3 | 98e5348 | footer/biz-extended |
| K8 | c35fb65 | 0c30361 | 공통 K-AC [U] — **폴백 섹션 앵커 id 결함 발견·수정** |
| K9 | — | c60edd3 | 앱 흐름 캡처 `shots/k9-*` · [B] 실측 `k9b.mjs` → `logs/k9b.txt` |
| K10 | — | 4e5e4cb (+ REPORT 보정 커밋) | 전체 vitest ×3 · Codex 1회 · REPORT · K-AC-15 폴백 칩 실측 `logs/k9-chip.txt` |

RED 로그: `logs/k1-red.txt` … `k8-red.txt`. 게이트 로그: `logs/k*-green.txt`(표적 test + `src/test` + engineImportGuard + renderImportGuard + typecheck + lint + build).

## 2. 킷 토큰 — 변수 이름 · 생성 규칙 (`app/src/kit/tokens.ts`)
입력(`KitTokenInput`, `render/protocol.ts`) = `palette`(5역할) · `card{tone, style}` · `type{family, headingWeight, bodyWeight, scale}` · `space{grid, sectionGap, density}` · `mediaRatio`.
부모 `docKitTokens(series, profileVersion)`: 문서가 가리키는 버전의 base + 조정. 팔레트 = `docPalette`(보정 반영, 같은 조회 결과 재사용 — 조회 추가 0). 버전 없음·팔레트 없음·글꼴 없음 = `undefined`. 모르는 카드 모양 → `bordered-md`, 톤 → `light`, 비율 → `4:5`, grid 파싱 실패 → 8.

| 변수 | 규칙 |
|---|---|
| `--site-primary·surface·ink·muted·bg` | 팔레트 값 그대로 |
| `--site-on-primary` | `rgb(255 255 255)` 고정(= `contrast.ts` ON_PRIMARY, `src/test/kitTokens.test.ts` 대조) |
| `--site-font` | `"<계열>", system-ui, sans-serif` · serif 계열이면 `"<계열>", serif` |
| `--site-weight-heading·body` | 굵기 숫자 |
| `--site-t-1 … --site-t5` | `scale^N rem`(소수 4자리) |
| `--site-s1 … --site-s6` | grid/16 rem × 0.5·1·1.5·2·3·4 |
| `--site-section-gap` · `-narrow` | sectionGap/16 rem · 절반. 촘촘이면 먼저 `floor(gap×0.75/8)×8`(effectiveProfile `compactGap`과 같은 규칙, 대조 테스트) |
| `--site-card-pad` · `-narrow` | s5·s4(촘촘 s4·s3) |
| `--site-r1·r2` · `--site-radius-card·control` | r1 = grid, r2 = 2×grid · 카드: lg = r2 · md·elevated = r1 · flat = 0 · 버튼: bordered-lg = r2, 그 밖 r1 |
| `--site-stroke-1·2` · `--site-card-stroke` | 0.0625rem · 0.125rem · 카드 경계(bordered만) |
| `--site-shadow-1` · `--site-card-shadow` | ink 16% 그림자 · elevated만 |
| `--site-hit-min` · `--site-prose-max` · `--site-content-max` | 2.75rem · 60ch · 72rem |
| `--site-header-offset` | `2 × (hit-min + 2×s2)` — 모든 킷 섹션 `scroll-margin-top` |
| `--site-media-ratio` | `"16 / 9"` 등 |

결정성: 같은 입력 = 같은 문자열(키 순서 고정, `kitCssText`) — `kit/tokens.test.ts`. 생성 결과에 px·hex·vh 0.
생성기는 **렌더 문서 쪽**(브리프 기본안). 부모 쪽은 입력 함수만.

## 3. 메시지 최종 모양 (`app/src/render/protocol.ts`)
| 방향 | 메시지 | 비고 |
|---|---|---|
| 부모 → 렌더 | `{type:"render", doc, kitTokens?, images?}` | `palette` 단독 필드 제거(kitTokens 안). kitTokens 모양 검사: 역할 5개 · CSS 값에 `; { } < > 따옴표 \` 0 · 글꼴 `[\w -]` · 굵기 100~900 · scale 1~2 · grid 1~64 · sectionGap 0~512 · 카드·비율 목록. images = 로컬 이미지 id(UUID v4) → `Blob`, ≤ 64개. 하나라도 틀리면 메시지 전체 버림 |
| 렌더 → 부모 | `{type:"error", code:"INVALID_DOC" \| "NO_KIT_TOKENS"}` | NO_KIT_TOKENS = 킷 섹션은 그리지 않고 **모든 섹션을 폴백(중립 토큰)으로** 그린 뒤 rects 보고 계속 → 부모는 INVALID_DOC에서만 사각형을 지운다 |
| 그 밖 | ready · rects · click · viewport · select | M2A-1 그대로 |

## 4. K-AC 판정
표기: [U] 단위 · [G] 가드 · [B] 브라우저(`logs/k9b.txt`) · 캡처 `shots/`.

**[B] 방법**: 편집기 안 렌더 문서는 불투명 출처 OOPIF라 `contentDocument`로 잴 수 없다. 그래서 `k9b.mjs`가 **render.html을 최상위 페이지로 열고**(같은 출처라 평가 가능) 페이지 스스로 `render{doc, kitTokens}`를 보내 실제 뷰포트 1280·1024·721·390·351에서 쟀다. 문서 = `sampleDoc`(header sticky-right-cta · hero fullbleed-left · 본문 폴백 5 · footer biz-extended). **킷 3변형 + 폴백 혼합은 A안과 같고 본문 구성은 다르다**(A안 = about·services·portfolio·testimonials·faq·contact, sampleDoc = about·services·faq·contact·cta-band). 앱 흐름 A안은 `shots/k9-*`로 따로 확인(error 0, 킷 3 + 폴백 섹션).

| K-AC | 판정 | 근거 |
|---|---|---|
| 01 (가드) | **PASS** | `src/test/kitGuard.test.ts` — import(react·킷 내부만) · 상태·효과·`on[A-Z]` · 모션 · hex·px · 앱 DS 토큰·테마 유틸리티 0, 탐지기 자체 검사 포함 · `noHardcodedStyle` 범위에 `src/kit` 추가 |
| 07 | **PASS** | [G] 가드 vh·dvh·svh·lvh·`h-screen` 0 · [B] 뷰포트 높이 900 → 2400에서 hero 높이/폭 = 0.5625 그대로(폭 변화는 스크롤바 유무 1265↔1280) |
| 02 | **PASS** | [B] 3변형 상한 글자 + root 글자 200% → 1280·390 `scrollWidth − clientWidth = 0`, 말줄임 계산 스타일 0 · `shots/k9b-*-long200.png` |
| 03 | **PASS** | [U] 변형별 상한 글자 textContent 그대로(Header·Hero·Footer test · kitCommon) |
| 04 (해당 슬롯) | **PASS** | [U] hero subtitle · footer links · copyright 빈 값 → 요소 0, 빈 p·li·ul 0 |
| 05 | **PASS** | [U] kitCommon — `#`·빈·없는 href·`javascript:` 0, 모든 `#s-` 대상 존재. **K8에서 폴백 섹션에 앵커 id가 없던 결함을 찾아 고침**(0c30361) |
| 09 | **PASS (명세 차이 1)** | [U] 사이트 루트 아래 header·main·footer 형제, main 안 header·footer·nav 0, h1 = 1. `body >` 직계는 아님 — 아래 7절 |
| 10 | **PASS** | [B] 1280: 보이는 nav 1 · 메뉴 버튼 none / 390: 보이는 nav 0(시트 닫힘) · 버튼 flex |
| 11 | **PASS (킷 섹션 범위)** | 측정 범위 = `[data-kit]` 안 글자 전부(폴백은 0.3상 킷 밖 — 와이어프레임 `ON_PRIMARY`(bg 글자/primary 면 = X-1)와 표식 고정 색이 섞여 명세 문장 "렌더 문서의 모든 글자"를 그대로 돌리면 폴백에서 실패한다, 8절 8). [B] 킷 글자 전 요소 쌍 = `ink/bg` · `on-primary/primary` · `primary/on-primary` · `bg/ink`(허용 5쌍 안), 불투명도 1 · [U] kit.css 글자색 4역할만·muted 0 |
| 12 | **PARTIAL** | [B] 390 "메뉴" → `:popover-open` · Tab → "닫기" · Esc → 닫힘 + 포커스 "메뉴" · 시트 안 앵커 → 닫힘. **"대상 섹션 이동"은 편집 캔버스에서 렌더 다리가 링크 이동을 막아(명세 K1-1 6 마지막 줄) 판정 불가** — 정적 HTML(M2A-3)에서 판정 |
| 13 | **PASS** | [U] href = 첫 contact → footer → 글자 · [B] 390 바 CTA none + 시트 맨 아래 / 1280 바 오른쪽 끝(바 오른쪽 여백 32 = s6) |
| 14 | **PASS** | [U] `" 소개 ·· 서비스 · 회사 "` → 3항목, 제목 일치만 a |
| 15 | **PASS** | [B] **선택된 폴백 섹션**(앱 흐름 A안에서 Testimonials·Portfolio 선택, `logs/k9-chip.txt`) 라벨 칩(섹션 기준) x 0~138, y 0~20 (iframe 721·351 모두) · 표식 사각형(섹션 기준, `logs/k9b.txt`) 721 폭 x 609~690 · 351 폭 x 239~320, y 12~32 → x 구간이 겹치지 않아 교차 넓이 0 · 캡처 `shots/k9-chip-390.png`(Portfolio 선택, 칩 왼쪽 위 · 표식 오른쪽 위) |
| 16 | **PASS** | [U] 폴백 섹션마다 표식 1개 "구조 미리보기" · 킷 섹션 0 · 오버레이 칩과 속성 공유 없음 |
| 20 | **PASS** | [U] 글자 3요소의 가장 가까운 면 = 패널(primary) · 이미지 끔 → 미디어 0, 섹션 면 primary · [B] 색 쌍 on-primary/primary |
| 21 | **PASS** | [B] 390: 미디어 y 61 < 패널 y 342 · h1이 DOM에서 미디어 앞 |
| 22 (hero) | **PASS** | [U] 로컬 URL → `img[alt]`·width·height·fetchpriority high · 장식 alt="" · 플레이스홀더/Blob 미도착 → 그라디언트 aria-hidden, img 0 |
| 31 | **PASS** | [U] ink 면 · address 1 · 링크 = li 글자(a 0) · copyright 빈 값 → 저작권·구분선 0 · [B] footer 글자 쌍 bg/ink |
| 35 | **PASS** | [B] 시트 연 채 390 → 1024: 보이는 nav 1 · 시트 display none(열림 유지) · 버튼 none / 다시 390: 시트 flex · 보이는 nav 1 |
| 36 | **PASS (킷 섹션 범위 — 11과 같음)** | [B] 시험 프로필 2벌 게이트 통과 먼저 확인(light: C-1 8.09·C-2 16.82·C-4 15.31·C-5 4.93 / dark 카드: C-1 4.61·C-2 20.08·C-3 4.56·C-4 17.62·C-5 6.06) → 킷 글자 실측 최소 대비 8.09 / 4.61 ≥ 4.5. 3변형은 섹션 톤(base/alt)과 무관한 면(header bg · hero primary · footer ink)이라 톤 축은 해당 없음 |

수용 기준 1(A안 문서 header·hero·footer 킷, 나머지 폴백 + 표식): `shots/k9-1280-top.png` · `k9-390-top.png` · `k9-390-bottom.png` — K0(`k0-*`)과 나란히.

## 5. 번들 표 (gzip KB, 첫 화면 / 진입 직후)
| 화면 | K0 | K1 | K2 | K3 | K4 | K5 | K6 | K7 | **K8 = HEAD** | 예산·멈춤선 |
|---|---|---|---|---|---|---|---|---|---|---|
| 공통 JS | 89.34 | 89.34 | 89.34 | 89.35 | 89.34 | 89.34 | 89.34 | 89.34 | **89.34** | — |
| /catalog | 99.65/102.04 | 99.65/102.03 | 99.64/102.02 | 99.65/102.04 | 99.64/102.03 | = | = | = | **99.64/102.03** | ±0.03 |
| /references/:id | 97.00/99.38 | = | 96.99/99.37 | 97.00/99.39 | 96.99/99.38 | = | = | = | **96.99/99.38** | ±0.03 |
| /compare (·조정) | 98.76/121.40 | 98.75/121.40 | 98.75/121.38 | 98.76/121.41 | 98.75/121.39 | = | = | = | **98.75/121.39** | ±0.03 |
| /profile | 99.61/123.65 | = | 99.60/123.63 | 99.61/123.66 | 99.60/123.64 | = | = | = | **99.60/123.64** | ±0.03 |
| /projects | 94.00/107.06 | = | 93.99/107.05 | 94.00/107.07 | 94.00/107.05 | = | = | = | **94.00/107.05** | ±0.03 |
| **/studio/:projectId** | 91.72/123.88 | 91.72/123.88 | 91.71/124.20 | 91.73/124.22 | 91.72/124.23 | = | = | = | **91.72/124.23** | 첫 ≤ 99.40 · 진입 ≤ 124.70 |
| **렌더 문서 JS / CSS** | 76.24/4.60 | 76.24/4.60 | 77.26/4.60 | 77.61/4.81 | 77.89/4.81 | 78.37/5.29 | 78.69/5.58 | 78.86/5.76 | **78.86/5.76** | JS 멈춤선 89.70 · CSS ≤ 30 |
| 렌더 문서 중 앱과 공유 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | **0** | — |

- `/studio` 진입 +0.35(123.88 → 124.23): `docKitTokens`(+ 프로토콜 모양 검사 확장) · images 전달. K2 첫 시도에서 `effectiveProfile`을 부모에서 import하자 124.64(여유 0.06)라 되돌리고, 촘촘 환산을 렌더 문서 생성기로 옮겨 124.20이 됐다(로그 `k2-green.txt`는 최종값).
- 렌더 문서 +2.62KB(킷 3변형 + 토큰 + 이미지 + 다리) — 브리프 추정 +2~4 안. 렌더 빌드는 청크를 나누지 않음 → Codex P2(manifest 병합 키 충돌) **손대지 않음**(브리프 조건).

## 6. 검증
- 체크포인트 게이트: 매 GREEN 커밋 전 `gate.sh` — 표적 test · `src/test` + engineImportGuard + renderImportGuard · typecheck · lint · build 모두 exit 0(`logs/k*-green.txt`).
- 전체 vitest ×3: `logs/final-full-x3.txt` — 결과는 9절.
- Codex `review --scope branch --base f0fdb2b` 1회: `logs/k10-codex-review.txt` — 결과는 9절.

## 7. 명세(m2a SPEC)·브리프와 다르게 한 곳 (ADR-003)
1. **K-AC-09 `body >` 직계 → 사이트 루트 직계**: React가 `#root` 안에 그리고 클릭 다리 div가 있어 `body > header`가 구조상 불가. 랜드마크가 main·section 밖 형제라는 본질(banner·contentinfo 역할)은 지킴. 정적 HTML(M2A-3)에서 직계로 직렬화 가능.
2. **토큰 없음(NO_KIT_TOKENS) = 킷 대상 섹션도 폴백으로 그림**: "킷은 그리지 않는다"를 "킷 모양으로 그리지 않는다"로 읽고, 섹션을 비우는 대신 와이어프레임(중립 토큰 + 표식)으로 둠 — 편집 중 섹션 선택·오버레이가 끊기지 않게(사용성). 프로필 조회 전 첫 그림이 이 상태다.
3. **촘촘 환산 위치**: 브리프 "프로필 적용값 → 입력"이지만 sectionGap은 base 값 + density를 보내고 환산은 생성기가 함(`/studio` 진입 예산, 5절). 규칙 동일성은 `src/test/kitTokens.test.ts`가 effectiveProfile과 대조.
4. **링크 이동 막기**: 렌더 다리(`RenderApp`)가 모든 킷 링크의 기본 이동을 막고 click{instanceId}로 바꾼다(명세 K1-1 6 마지막 줄). 시트 안 앵커 → `hidePopover()`도 같은 곳(킷 공용 바닐라 스크립트 대신 — 킷 파일은 상태·효과 0). 정적 HTML용 스크립트 1개는 M2A-3.
5. **사각형 보고**: 메뉴 두 벌 중 숨은 벌의 `data-slot`은 보고하지 않음(`checkVisibility()` false 제외) — 오버레이 문제 테두리가 (0,0)에 그려지지 않게.
6. **폴백 표식 시각**: 3.1대로 위·오른쪽 · 고정 색 자기 면(`rgb(26 26 26)`/`rgb(255 255 255)`, render.css `--marker-*`) · `data-kit-marker="fallback"`(기존 `data-fallback-mark` 대체, FallbackCanvas.test 선택자 이동) · 폴백 루트 `data-fallback="true"` · 앵커 id.
7. **테스트 대상 이동(약화 아님)**: CanvasPalette.test `lastPalette()` → `lastKitTokens().palette`(+ 글꼴 단언 추가, 시험 시리즈에 글꼴·간격 추가) · StructureCanvas.test "render 메시지에는 문서·팔레트만" → "문서·킷 토큰만"(토큰 있을 때 키 `doc·kitTokens·type` 단언 추가) · RenderApp.test INVALID_DOC 테스트 첫 render에 kitTokens 포함(error 목록 단언 그대로) · engineImportGuard 허용 목록 `kit/**`(엔진은 `import type`만, 값 import는 kitGuard가 막음).
8. **[B] 판정 장소**: 브리프 K9는 "A안 문서를 앱 흐름으로 만들고 [B] 판정"이지만, 편집기 캔버스의 렌더 문서는 불투명 출처 OOPIF라 `contentDocument`·계산 스타일을 잴 수 없다. 그래서 [B] 수치는 render.html 최상위 + sampleDoc(`k9b.mjs`)에서 쟀고, 앱 흐름 A안은 캡처(`shots/k9-*`)·메시지(error 0)·라벨 칩 사각형(K-AC-15)만 잰다.
9. **웹폰트**: 명세 0.4 "킷은 @font-face를 싣지 않는다" — render.css는 M2A-1부터 앱 `fonts.css`를 import한다. 이 레인은 바꾸지 않음(남은 위험 4).

## 8. 남은 위험 · M2A-2b에 넘길 것
1. **편집기 데스크톱 미리보기 폭 721 < md(48rem)**: 1280 창에서 캔버스 열 폭이 721이라 렌더 문서는 **md 미만 배치**(메뉴 버튼만 · CTA 시트 · hero 두 단)로 그린다(`shots/k9-1280-top.png`). 명세 0.6은 "1280 = lg 이상"을 전제. 캔버스가 실제 1280을 보이려면 미리보기 폭 프레임(축소 보기) 결정이 필요 — Designer 시각 QA·2b 판단.
2. **이미지 보관소 없음**: Blob 전달 경로(프로토콜·렌더 URL 생성·해제·부모 prop)는 있으나 앱에 로컬 이미지 업로드·보관소가 없어 호출처 0(편집 패널 "이미지 슬롯 1개는 다음 단계에서"). 보관소가 생기면 `StructureCanvas images`로 넘기면 된다.
3. **오버레이 문제 문장 겹침**(M2A-1 8절 3): 바꾸지 않음. K9 캡처는 문제 없는 문서라 이번에는 보이지 않음.
4. **웹폰트·CORS**: 렌더 문서가 앱 폰트 4종을 계속 싣는다(7절 9) — 명세 0.4와 다름, M2A-3 정적 HTML 전에 정리 필요.
5. **K-AC-12 이동 판정**: 편집 캔버스는 이동을 막으므로 정적 HTML(M2A-3)에서 "앵커 이동 + header에 가려지지 않음"을 판정.
6. **카드 톤 변수 미생성**: 카드 톤(light/dark)은 입력에만 있고 `--site-*` 변수는 2b services가 섹션 톤과 함께 정할 것(K-AC-26).
8. **폴백 섹션 글자 색 조합**: 와이어프레임 폴백은 M2A-1 그대로 `ON_PRIMARY = bg 글자/primary 면`(0.3 금지 조합 X-1, 예: cta-band)을 쓴다. 편집 캔버스에서는 "구조 미리보기" 표식이 붙은 비실렌더 섹션이지만, PNG·정적 HTML(M2A-3)에 폴백이 섞여 나가면 X-1 글자가 그대로 나간다 — M2A-3 내보내기 차단(`UNRENDERED_SECTIONS`)이 막는지 확인 필요.
9. 렌더 문서 JS 78.86 / 89.70 — 남은 여유 10.84KB로 본문 4변형(2b) 예상 +2~3KB. 30변형(M2b)은 M2A-1 8절 1 대책 필요.

## 9. K10 검증 결과
- **전체 vitest ×3** (`logs/final-full-x3.txt`): 1회 153 files · **1513/1513** (load 17) · 2회 **1513/1513** (load 69) · 3회 **1513/1513** (load 117). 실패 0.
- **Codex** `node codex-companion.mjs review --scope branch --base f0fdb2b` 1회 (`logs/k10-codex-review.txt`) — P1 이상 0건, P2 1건:
  - [P2] `app/src/kit/tokens.ts:61` `--site-media-ratio`가 생성되지만 킷 CSS가 쓰지 않는다 → **반영하지 않음**. 명세 K1-2 5 "프로필 `media_ratio`는 hero에 쓰지 않는다(풀블리드는 섹션 모양이 비율을 정한다)" — 이 변수의 소비처는 about/story 이미지(K1-3 · K-AC-24, M2A-2b)다. 이 레인 3변형에는 쓰는 곳이 없는 것이 명세대로.
  - Codex 쪽 vitest 실행은 샌드박스 쓰기 거부로 실패(Codex 환경 문제 — 로컬 3회 통과가 정본).
- **서버**: vite dev 127.0.0.1:4337 PID 28707(`logs/vite.pid`) 종료 — 종료 확인은 PROGRESS.
