# M2B-6 QA REPORT — M2b 최종 독립 QA

## 판정 의견: **조건부 Go**
- 근거: 30/30 실렌더·폴백 0, 3폭 기준선 결정성(90/90 픽셀 차 0), 비교→편집→내보내기 E2E 통과, vitest 1873/1873·build·번들 예산 통과.
- 조건: **D-1(PNG 하단 검은 빈 영역, P1 잠정)** 원인 판정 1건. 실제 Chrome(포그라운드)에서 재현되면 수정 후 Go, Ego Lite 프레임 정지에서만 나면 환경 한계로 닫고 Go.

## 실제 meta
- worktree `m2b-6-qa` · branch `k002bill2/m2b-6-qa` · base `e972fd9` · 2026-10-05 · 역할 QA(Claude Code, Opus 5.5) · 서브에이전트 0.
- 브라우저: Ego Lite(Chromium, ego-browser space 68) · Chrome headless(macOS `/Applications/Google Chrome.app`) — **Safari·Firefox 미검증**.
- 서버: 4337 = vite dev(1·5단계 사본 생성) → vite preview(E2E, 이번 build 산출물) · 4339 = python http.server(static/). 모두 127.0.0.1. 종료 후 `lsof -iTCP:4337 -iTCP:4339 -sTCP:LISTEN` 0줄, cwd 확인 후 자기 PID만 종료. main 5480 무접촉. push/merge/삭제 0.
- 앱·docs·design·package*·CLAUDE.md 수정 0: `git status --porcelain app docs design CLAUDE.md` = 0줄.

## 단계별 결과
| # | 단계 | 결과 | 증거 |
|---|---|---|---|
| 1 | 실렌더 30/30 | **PASS** — 엔진 `SECTION_DEFINITIONS` 30쌍 모두 `[data-kit]` · `[data-fallback]` 0 · 표식 0 · error 0. 음성 대조(킷 토큰 없음)에서 표식 3/3 검출 → 검출기 유효 | `s1-render30.mjs`, `logs/s1-render30.json`, `logs/s1-run.txt` |
| 2 | 3폭 기준선 | **PASS** — 90장(30×1280·768·390), 2회 캡처 픽셀 차 **0/90**. 3폭 가로 넘침 0(정적 사본 실측), 글꼴 loaded 2면 전부 | `baseline/`, `shots.sh`, `pdiff.mjs`, `logs/s2-determinism.txt`, `logs/s2-heights.json`, `sheets/` |
| 3 | 루브릭 TR-POL-04 | 통과 18 · 주의 12(시각·근거 5 + m2a K1 루브릭 원기록 없음 7) · 실패 0 | 아래 표 |
| 4 | E2E 앱 안 클릭 | **PASS(D-1 제외)** — 카탈로그 → 비교 추가 3 → 보드 B 전부 선택 → 프로필 확정 v1 → 3안 만들기(4.1초) → 비교 대화상자(1280 3열·축소율 29.58%, 1024/768/390 1안씩 71.25/51.25/21.72%, 4폭 넘침 0, 모바일 폭 0.971) → B안 선택 status "B안을 선택했습니다" → Esc 닫힘·포커스 = 트리거 버튼 → "B안으로 편집 시작" → /studio(캔버스 iframe sandbox=allow-scripts, 변경 안내 3건) → SEO 차단 2 해소 → 정적 HTML(1,009,614B, Kit Serif KR 400/700 data:, OFL 고지, script 1 = 고정 메뉴) · PNG 3회 | `logs/s4-*.json`, `logs/s4-*-run*.txt`, `exports/` |
| 5 | 이관 항목 | 아래 분류표 | `logs/s5-carry.json` |
| 6 | 회귀 게이트 | **PASS** — `npm test -- --run` 216파일 1873/1873 exit0(Errors 0) · `npm run build` exit0 | `logs/vitest.txt`, `logs/build.txt` |

### 6. 번들 표(이번 build)
| 대상 | 첫 화면 | 진입(자동 로드 포함) | 예산 |
|---|---|---|---|
| 렌더 문서 JS / CSS | 83.03KB / 8.75KB | — | ≤89.70 / ≤30 ✓ |
| /catalog | 99.65 | 102.04 | 100/125 ✓ |
| /references/:id | 97.00 | 99.38 | ✓ |
| /compare | 98.84 | 121.70 | ✓ |
| /profile · (3안 있음) | 99.62 | 119.13 · 121.59 | ✓ |
| /projects | 94.02 | 100.32 | ✓ |
| /studio/:projectId | 91.78 | 127.35 | 100/128 ✓ (여유 0.65) |
- 비교 청크(CompareDialog) +21.19KB 조작 뒤(예산 판정 밖).

## 결함 목록 (고치지 않음)
| ID | 심각도 | 내용 | 재현 | 증거 |
|---|---|---|---|---|
| D-1 | **P1(잠정)** | /studio "PNG 내려받기" 결과 높이가 실행마다 다름: 같은 문서·같은 r2에서 1·2회차 1280×10492(SHA 동일 244d16d5b0, 하단 ≈6,955px 검은 빈 영역), 3회차 1280×3537(정상). 내용 영역은 같음 | preview 빌드 → 위 E2E → /studio에서 PNG 내려받기 3회 연속(앱 안 클릭). Ego Lite(rAF ≈2회/초로 정지에 가까움) | `exports/site-{1,2,3}.png`, `logs/png-run1-vs-run3.png`, `logs/s4-export.json` |
- D-1 판정 한계: 실행 환경에서 프레임이 거의 안 나와(rAF 2/s, 전환 currentTime 정지) 사각형 보고 시점이 늦거나 배치 전 높이가 쓰였을 가능성. 포그라운드 Chrome 재현 확인 전까지 P1 잠정. 첫 의심 지점(추정, L3): PNG 경로 `settled(rects)` 판정이 "바닥 > 0"이라 글꼴 로드 전 rects 높이를 받아들일 수 있음.

## 이관 항목 분류
| 출처 | 항목 | 분류 | 근거 |
|---|---|---|---|
| M2B-5 | 비교 대화상자 캡처(QB1·QB2) | **환경 한계** | CDP `captureScreenshot` 4회 시간 초과(대화상자 2·CTA 2), `screencapture -x`는 바탕화면만(창 미노출). 수치 대체: 1280 3열 zoom 0.2958(SPEC 29%와 ±2%p 안), 열 머리 A/B/C안, status 낭독 텍스트 |
| M2B-5 | 1280 29% 판독성 | **환경 한계(육안 불가)** · 수치 PASS | 위와 같음 |
| M2B-5 | 열기 직후 축소 전 프레임 노출 | **환경 한계 + 위험 관찰** | Ego Lite에서 열기 후 ~6초간 wrapper zoom 1·iframe 1280px(열 379px 넘침, 대화상자 overflow로 잘림 추정) 기록 — ResizeObserver가 렌더링 단계에서만 전달되는데 프레임 정지 환경이라 과장됨. 실기 노출 시간은 미검증 |
| M2B-5 | 키보드 순서(스크롤 영역 → 이 안 선택) | **사양 결정 필요** | 실측 순서: 닫기 → 미리보기 영역(div tabindex 0) → A/B/C안 선택 → (브라우저 UI) → 데스크톱 → 닫기. iframe 진입 0(inert). 스크롤 영역 정지는 키보드 스크롤(WCAG 2.1.1)에 필요 → **SPEC 2.1·4를 실제 순서로 정정 권고**. 데스크톱/모바일 중 하나만 Tab 정지(로빙) |
| M2B-5 | 프레임 안 모션 최종 상태(B5) | **환경 한계** | sandbox 교차 출처 iframe 내부 DOM 접근 불가. 렌더 문서 경로는 data-motion-play 없음(정적 HTML만, 소스 규칙) |
| M2B-5 | 선택 실패 경로(B6) | **미검증** | 저장소 실패 주입 경로가 앱 안 클릭으로 없음. 성공 경로 status만 실측 |
| M2B-4b | 정적 HTML 등장 모션 재생·1초 내·감소 | **PASS** | L2 사본: 실행 직후 애니메이션 9개(1280)/7개(390) 재생, endTime 최대 580ms ≤ 1000, 감소 설정 시 0개(0초부터 최종). 표본 시각은 rAF 정지로 ~1.1초 단위 |
| M2B-4b | grid 타일 A 확대 제외 시각 영향 | **PASS(경미)** | 등장 대상 = 카피 + 타일 B·C(rise)만, A 정지. 최종 상태 동일·390은 A만 |
| M2B-4b | 시트 열림 0.2초 | **환경 한계** | 열린 시트 opacity 0이 1.5초 유지 후 3초에 1 — 전환 currentTime 0 고정(프레임 정지). 감소 설정 시 +50ms에 1 |
| M2B-4a | 정적 HTML·PNG 폰트 | **PASS(HTML)** | 결과 HTML에 Kit Serif KR 400/700 data: 2면·고지. 기준선 사본 Pretendard 2면 loaded. PNG 글자 육안: 명조 계열 보임(축소 판독) |
| M2B-4a | B9 PNG 4.9초 경계 | **측정 여유 문제로 판정(미확정)** | 이번 PNG 3회 7.0·8.1·16.9초(캡처 포함 전체, 프레임 정지 환경) — 글꼴 단계만의 시간은 분리 측정 못 함. 환경 속도 편차가 커서 4.9초 경계 측정은 여유 없음 |
| M2B-4a | 정적 HTML 크기 | 기록 | Serif 결과 1,009,614B(≈1.01MB) — 4a 기록 1.00MB와 일치 |
| M2B-2c | 비활성 예약 폼이 활성처럼 보임 | **사양 결정 필요(P3 UX)** | booking·form 둘 다 fieldset disabled, 입력·버튼 opacity 1·ink 글자·primary 버튼, cursor not-allowed, 안내 문구 존재. 사양(QB-11 "흐리지 않음")대로 |
| M2B-2c | CTA Tab 링 | **PASS** | 실제 Tab 2회: header CTA 링 2px ink, band CTA 링 2px 흰색 offset 2px, `:focus-visible` true. 이미지 캡처는 CDP 2회 실패(환경) |
| M2B-2a/2b | masonry 2종·grid-2 4:5 | **PASS / grid-2 주의** | 3폭 기준선 판독: 엇갈림·잘림 없음. grid-2 1280 칸 ≈530×660 |
| M2B-2a/2b | 실제 로컬 이미지 갤러리 | **환경 한계** | 이번 흐름에 이미지 넣는 앱 경로를 사용하지 못함(그라디언트 표본만) |
| M2B-1b | header 4변형 Esc 직후 visibility | **PASS** | 390, 메뉴 열기 → Esc 직후 `:popover-open` false · display none(즉시) · 포커스 메뉴 버튼 복귀 — 4변형 동일 |
| 이전 | 390 데스크톱 축소 판독성 | **환경 한계(육안) · 수치 기록** | 390 데스크톱 폭 zoom 0.217 |
| 이전 | 폴백 표식 판독성 | 해당 축소 | 30/30 이후 폴백은 킷 토큰 없음/unknown뿐. 음성 대조에서 표식 DOM 존재만 확인 |
| 이전 | 390 첫 그리기 빈 상자 | **관찰(관련 위험)** | 모션 켠 정적 HTML을 4병렬 headless로 찍으면 6/90장이 등장 시작 프레임(빈 칸)으로 찍힘(`logs/motion-nondeterm/`). 제품 결함 아님(캡처 도구 타이밍) |
| 이전 | 자기 슬롯 배지 끝 1자 덮음 | **미검증** | 편집기 배지 캡처 불가(CDP 실패) |

## 루브릭 TR-POL-04 (30행 · O = 실렌더 통과)
- 판정 근거: ① 기능·② 위계·③ 3폭 = 기준선 3장 육안 + 넘침 0 실측 · ④ 접근성 = 이번 실측(Tab 링·Esc·inert)과 vitest 가드 · ⑤ 토큰 = `noHardcodedStyle` 가드 통과 · ⑥ 예산 = 번들 표 · ⑦ 독자성 = 자체 그라디언트·고정 문구만 · ⑧ 근거 = SPEC 원기록.
| 변형 | 렌더 | 루브릭 원기록 | 판정 | 근거 캡처 |
|---|---|---|---|---|
| about/story | O | m2a K1(루브릭 기록 없음) | 주의 — 루브릭 원기록 없음 → 8항 최소 기준으로 QA 판정 · 사양 결정 필요 | `baseline/about--story-{1280,768,390}.png` |
| about/text | O | SPEC-BODY | 통과 | `baseline/about--text-{1280,768,390}.png` |
| contact/booking | O | SPEC-BODY | 주의 — ① 비활성 입력·버튼 opacity 1·cursor not-allowed, 활성처럼 보임(안내 문구 있음, 사양 QB-11대로) | `baseline/contact--booking-{1280,768,390}.png` |
| contact/form | O | m2a K1(루브릭 기록 없음) | 주의 — 루브릭 원기록 없음 → 8항 최소 기준으로 QA 판정 · 사양 결정 필요 | `baseline/contact--form-{1280,768,390}.png` |
| cta-band/banner | O | SPEC-BODY | 주의 — ⑧ 내부 태그 근거 없음(MQ-B7) · Tab 링 흰 2px/offset 2 실측 | `baseline/cta-band--banner-{1280,768,390}.png` |
| faq/accordion | O | m2a K1(루브릭 기록 없음) | 주의 — 루브릭 원기록 없음 → 8항 최소 기준으로 QA 판정 · 사양 결정 필요 | `baseline/faq--accordion-{1280,768,390}.png` |
| footer/biz-extended | O | m2a K1(루브릭 기록 없음) | 주의 — 루브릭 원기록 없음 → 8항 최소 기준으로 QA 판정 · 사양 결정 필요 | `baseline/footer--biz-extended-{1280,768,390}.png` |
| footer/biz-extended-map | O | SPEC-BOUND | 통과 | `baseline/footer--biz-extended-map-{1280,768,390}.png` |
| footer/minimal | O | SPEC-BOUND | 통과 | `baseline/footer--minimal-{1280,768,390}.png` |
| footer/minimal-biz | O | SPEC-BOUND | 통과 | `baseline/footer--minimal-biz-{1280,768,390}.png` |
| header/sticky-hamburger | O | SPEC-BOUND | 통과 | `baseline/header--sticky-hamburger-{1280,768,390}.png` |
| header/sticky-right-cta | O | m2a K1(루브릭 기록 없음) | 주의 — 루브릭 원기록 없음 → 8항 최소 기준으로 QA 판정 · 사양 결정 필요 | `baseline/header--sticky-right-cta-{1280,768,390}.png` |
| header/sticky-two-tier | O | SPEC-BOUND | 통과 | `baseline/header--sticky-two-tier-{1280,768,390}.png` |
| header/transparent | O | SPEC-BOUND | 통과 | `baseline/header--transparent-{1280,768,390}.png` |
| hero/center | O | SPEC-BOUND | 통과 | `baseline/hero--center-{1280,768,390}.png` |
| hero/fullbleed-left | O | m2a K1(루브릭 기록 없음) | 주의 — 루브릭 원기록 없음 → 8항 최소 기준으로 QA 판정 · 사양 결정 필요 | `baseline/hero--fullbleed-left-{1280,768,390}.png` |
| hero/grid | O | SPEC-BOUND | 주의 — 모션 타일 A 확대 제외(SPEC 1.4 편차, M2B-4b 기록) · 시각 영향 경미(정적 최종 상태 동일) | `baseline/hero--grid-{1280,768,390}.png` |
| hero/image | O | SPEC-BOUND | 통과 | `baseline/hero--image-{1280,768,390}.png` |
| hero/split | O | SPEC-BOUND | 통과 | `baseline/hero--split-{1280,768,390}.png` |
| hero/text | O | SPEC-BOUND | 통과 | `baseline/hero--text-{1280,768,390}.png` |
| portfolio/grid-2 | O | SPEC-BODY | 주의 — ③ 1280에서 4:5 칸 높이 ≈660px(뷰포트 900의 73%) — QB-6 "과하지 않은지"는 MQ 판단 영역 | `baseline/portfolio--grid-2-{1280,768,390}.png` |
| portfolio/grid-3 | O | SPEC-BODY | 통과 | `baseline/portfolio--grid-3-{1280,768,390}.png` |
| portfolio/masonry | O | SPEC-BODY | 통과 | `baseline/portfolio--masonry-{1280,768,390}.png` |
| pricing/tiers-2 | O | SPEC-BODY | 통과 | `baseline/pricing--tiers-2-{1280,768,390}.png` |
| services/cards-2 | O | SPEC-BODY | 통과 | `baseline/services--cards-2-{1280,768,390}.png` |
| services/cards-3 | O | m2a K1(루브릭 기록 없음) | 주의 — 루브릭 원기록 없음 → 8항 최소 기준으로 QA 판정 · 사양 결정 필요 | `baseline/services--cards-3-{1280,768,390}.png` |
| services/cards-masonry | O | SPEC-BODY | 통과 | `baseline/services--cards-masonry-{1280,768,390}.png` |
| services/list | O | SPEC-BODY | 통과 | `baseline/services--list-{1280,768,390}.png` |
| statistics/stats-3 | O | SPEC-BODY | 주의 — ⑧ 내부 레퍼런스 태그 근거 없음(SPEC-BODY MQ-B7) · 렌더·3폭 정상 | `baseline/statistics--stats-3-{1280,768,390}.png` |
| testimonials/quotes-2 | O | SPEC-BODY | 통과 | `baseline/testimonials--quotes-2-{1280,768,390}.png` |
## 3폭 시각 회귀 기준선 사용법
1. `cd dev/active/m2b-6-qa && python3 -m http.server 4339 --bind 127.0.0.1 -d static &`
2. `./shots.sh run-new` — 90장, Chrome headless · `--force-prefers-reduced-motion` · 창 높이 = `logs/s2-heights.json`
3. `node pdiff.mjs baseline run-new` → `TOTAL 90 pixelDiffFiles 0`이면 회귀 없음. 다른 파일은 bbox가 나온다.
4. 서버를 종료한다. 킷 변경 뒤 사본을 새로 만들려면 vite dev 4337 + `ego-browser nodejs < s1-render30.mjs`(사본 재생성) → `s2-measure.mjs`(높이) → 2·3.
- 고정 조건: 문서 틀 = header sticky-right-cta + 대상 + footer minimal(header 변형은 뒤에 hero center alt), SAMPLE_KIT_TOKENS(Pretendard 700/400), 모션 L1.
- 제품 출력과의 차이 1건: 글꼴 data: 규칙을 `static/_fonts.css` 하나로 공유해 `<link>`로 연결(사본 크기 절감). 내용은 제품 `loadSiteFonts` 결과 그대로.
- 모션 켠 캡처는 비결정(6/90) → 기준선은 감소 설정 최종 상태.

## 환경 한계 요약
- Ego Lite 창이 화면에 그려지지 않는 상태: rAF ≈2회/초, CSS 전환 정지, `Page.captureScreenshot` 시간 초과(4/4), `screencapture`로 창 캡처 불가.
- Safari·Firefox·실기기 미검증. 실제 이미지 갤러리 미검증.

## 책임/환경
- QA 실행·판정: Claude Code(Opus 5.5) 단독, 구현 레인 판정 재사용 0(스크립트 형식만 참고). Codex 검토는 이 레인 범위 밖(코드 diff 0).
