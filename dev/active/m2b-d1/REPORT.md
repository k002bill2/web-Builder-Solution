# M2B-D1 REPORT — PNG 높이 비결정(D-1) 원인 판정·수정

**결론: (b) 그렸지만 잘못된 배치 폭에서 잰 rects를 받아들임 → 수정 완료.** PNG 높이는 이제 캡처 폭(1280 등) 배치의 rects로만 정한다. D-1을 관측한 Ego Lite에서 옛 조건이 받아들였을 `[폭 0, 바닥 8314]` 보고가 실제로 나왔고, 수정본은 그것을 건너뛰고 1280×3479로 그렸다.

## meta
- worktree `m2b-d1` · branch `k002bill2/m2b-d1` · base `a121f31` · 2026-10-05 · 역할 Developer(Claude Code, Opus 5.5) · 서브에이전트 0.
- 커밋: `1fcdcff` BRIEF·PROGRESS(P0) → `bf32bf9` 판정·RED 전 예측(3) → `7f90b94` 수정+테스트 → `8b6e157` 결정성 증거 → (REPORT·Codex 커밋).
- 브라우저: Chrome headless(`/Applications/Google Chrome.app`, CDP·의존성 0) · Ego Lite(ego-browser space 69). Safari·Firefox 미검증.
- 서버: 4337 = 이 worktree vite dev(127.0.0.1) 1개. 종료: cwd = `m2b-d1/app` 확인 후 자기 PID만 kill → `lsof -iTCP:4337 -iTCP:4339 -sTCP:LISTEN` 0줄, headless Chrome 0개. main 5480 무접촉. push/merge/삭제 0.
- package*.json/lock·CLAUDE.md·docs·design 수정 0(`npm ci`로 lock 그대로 설치). 렌더 문서·정적 HTML 코드 0줄 변경.

## 분류와 근거
| 근거 | 내용 | 수준 |
|---|---|---|
| 코드 경로 | `pngCapture.ts` 옛 101행 settled = `pageBottom(r) > 0`만. 높이 = 그 rects 바닥, SVG·캔버스 폭 = 캡처 폭 고정 → 내용은 1280 배치(3537), 캔버스는 다른 배치 높이(10492) — QA의 "높이만 커지고 내용 같음"과 일치 | L1 |
| 렌더 문서가 캡처 폭 전 배치를 보고 | Ego Lite 프로브(`logs/probe-ego.txt`) 3/5회 첫 rects 섹션 폭 0 → 뒤에 1280. RenderApp은 글꼴 준비 직후 1회 + ResizeObserver마다 보고 — iframe 뷰포트가 아직 캡처 폭이 아닐 수 있다 | L2 |
| 좁은 폭 배치는 바닥 > 0 | headless 폭별 바닥(`logs/width-heights*.txt`, sampleDoc): 0·1·16px → 8313 · 50px 8168 · 100px 4374 · 1280px 3479 | L2 |
| **결정적 관측** | 수정본 capturePng를 Ego Lite에서 5회(`logs/capture-ego.txt`) — 5회차 rects `[0,0] → [0,8314] → [1280,3479]`. 옛 조건이면 두 번째(바닥 8314 > 0)로 1280×8314를 그려 아래 ≈4835px가 빈 캔버스 = D-1과 같은 모양 | L2 |
| 정상 rAF 환경 | headless 프로브 5/5 첫 rects부터 1280(`logs/probe-headless-x1.txt`) — 드물게만 나는 경쟁 | L2 |

- (c)가 아닌 이유: 캡처 도구가 아니라 제품 `draw` 경로가 만든 높이이고, 잘못된 높이는 제품 코드가 검증 없이 받은 측정값에서 왔다. 프레임 정지 환경은 확률을 높일 뿐 원인이 아니다.
- 한계: QA의 정확한 10492를 만든 문서·뷰포트 상태는 재현하지 않았다(다른 문서 — 비율 2.97 vs 2.39는 근거로 쓰지 않음). 같은 기전(폭 0·바닥 > 0 보고)은 직접 관측.

## 수정 (최소)
- `app/src/features/studio/png/pngCapture.ts`: `settledAt(width)` = 바닥 > 0 **그리고** (가장 넓은 섹션 폭 = 캡처 폭 ±1px **또는** 바닥 > 16384). 
  - 가장 넓은 섹션(모든 섹션 아님): 폭이 좁은 변형이 있어도 시간 초과로 바뀌지 않게.
  - 바닥 > 상한 예외: 상한 넘는 문서는 1024rem iframe에 세로 스크롤바가 생겨 폭이 줄 수 있다 → 기존처럼 CANVAS_TOO_TALL.
- 실패 정책 불변: 캡처 폭 rects가 끝내 안 오면 기존 8초 상한 → RENDER_TIMEOUT. 글꼴 5초·FONT_FAILED 경로 그대로.
- 정적 HTML 불변: `renderAndSerialize`의 settled 기본값(`() => true`) 그대로, 정적 HTML 호출부 0줄 변경.
- SPEC 문구: docs에서 "바닥 > 0" 문구 grep 0건 — 코드 주석(M2A-3c C4)만의 판정이라 SPEC 이탈 없음.

## RED / GREEN
- 예측(`bf32bf9`, RED 전 커밋): 새 테스트 3개, ①② RED · ③ GREEN, 전체 1873 → 1876.
- RED: `pngCapture.test.ts` 2 failed | 19 passed (21) — ① `expected [1280, 8313] to deeply equal [1280, 3479]` ② `promise resolved instead of rejecting`. ③ 통과(정책 고정).
- GREEN: 21/21.
- 픽스처: `fakeChannel` 섹션 폭 = 열린 폭(rem × 루트 px) — 실제 렌더 문서와 같게. 기존 단언 변경·skip 0.

## 전후 높이
| | 환경 | 결과 |
|---|---|---|
| 전 (QA) | Ego Lite /studio 3회 | 1280×10492 ×2(SHA 동일) · 1280×3537 ×1 |
| 후 | Chrome headless 5회 (`logs/capture-headless-x1.txt`) | 5/5 1280×3479 · SHA 7dab0a8e54e8 |
| 후 | Ego Lite 5회 (`logs/capture-ego.txt`) | 5/5 1280×3479 · SHA 7dab0a8e54e8 (4·5회차는 폭 0 보고를 건너뜀) |
- 하네스: dev 서버에서 제품 `capturePng`·`openCaptureFrame` 그대로, `fetchText`만 이번 build의 render CSS를 `/@fs`로 주는 심(dev render.html엔 스타일시트 링크가 없음), `draw` = 제품 drawPng와 같은 Image→canvas→toBlob + SHA. 문서 = sampleDoc(8섹션) · 킷 = SAMPLE_KIT_TOKENS — /studio 앱 안 클릭 E2E는 아님.

## 게이트
| 명령 | 결과 | 로그 |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/typecheck.txt` |
| `npm run lint` | exit 0 | `logs/lint.txt` |
| `npm run build` | exit 0 · /studio 진입 127.36KB(멈춤선 127.37) · 렌더 JS 83.03KB(멈춤선 89.70) · CSS 8.75KB | `logs/build.txt` |
| `npx vitest --run` (기본) | **exit 0 · 216 files · 1876/1876 · Errors 0** | `logs/vitest-3.txt` |
- 앞선 2회 전체 실행은 부하(load avg 40~52/10코어, 다른 세션의 main 저장소 vitest 동시 실행)로 무관 페이지 테스트 5초 타임아웃(28·5건) — 실패 5파일 단독 37/37 통과(`logs/vitest-2-failed-isolated.txt`). 세 번째 기본 실행 exit 0. 코드 변경은 그 사이 0.

## Codex
- (아래 갱신)

## 책임 / 환경
- 책임: 제품 코드(PNG settled 판정). 렌더 문서의 보고 시점은 설계대로(ResizeObserver로 최종값을 다시 보냄) — 받는 쪽이 폭을 확인하지 않은 것이 결함.
- 환경: 프레임 정지에 가까운 브라우저(Ego Lite, 백그라운드 탭 등)에서 발현 확률이 높다. 정상 rAF headless에선 0/10.
