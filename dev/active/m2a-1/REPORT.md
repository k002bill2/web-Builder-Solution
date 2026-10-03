# M2A-1 렌더 기반 — REPORT

- 브리프: `docs/06-handoff/M2A-1_RENDER-BASE_BRIEF.md` · 시작 커밋 `72fe57f` · 브랜치 `k002bill2/m2a-1` (로컬 커밋만, push·병합 없음)
- 렌더 문서 디렉터리: **`app/src/render/`** — `main.tsx`(엔트리) · `RenderApp.tsx`(수신기·사각형 보고) · `protocol.ts`(메시지 모양, 양쪽 공용·의존성 0) · `fallback/`(와이어프레임 폴백 · `canvasLayouts.ts`) · `render.css` · 가드 `renderImportGuard.test.ts`. 엔트리 HTML `app/render.html`.

## 1. 커밋 표
| 단계 | 커밋 | 내용 |
|---|---|---|
| R0 | 5d8e09a | 기준선(번들 표 · r0 스크린샷 · 캔버스 테스트 목록 `R0-BASELINE.md` · 게이트 스크립트) |
| R1 | 23bdd9b | render.html 엔트리 · ready · dev/preview CORS(Origin null) — PoC 통과 |
| R2 RED/GREEN | 391c1db / b023180 | 번들 판정 모듈 테스트 → `scripts/bundleBudget.mjs` + CLI 개정 |
| R3 RED/GREEN | be70e29 / 10d0cdd | 렌더 import 가드·수신기·폴백 테스트 → 렌더 문서 본체 · 별도 빌드 |
| R4 RED/GREEN | 88b5b69 / ff06fb5 | 부모 테스트를 iframe 흉내로 · 이관 → 호스트·다리·오버레이, 앱 폴백 제거 |
| R5 | 415867f + (R5 산출물 커밋) | 브라우저에서 찾은 회귀 2건 수정(이미 선택한 섹션의 배지 → 필드 포커스 · iframe 폭 = 미리보기 폭) · `r5.mjs` · `logs/r5-*.txt` · `shots/r5-*.png` |
| R6 | (R6 커밋) | 전체 vitest ×3 `logs/final-full-x3.txt` · Codex `logs/r6-codex-review.txt` · 렌더 모듈 크기 `logs/r6-render-modules.txt` · REPORT |

## 2. R1 PoC 결과 (`logs/r1-poc.txt`, `shots/r1-*.png`)
| 서버 | CORS 설정 | 결과 |
|---|---|---|
| vite dev | Vite 기본(로컬 호스트 출처만) | **ready 없음**(8초) — 불투명 출처 `Origin: null` 모듈 스크립트 CORS 거부 |
| vite dev | `server.cors.origin = ["null", 로컬 호스트]` | **ready 수신** `{origin:"null", source = iframe}` — 캐시 켠 채 재실행도 통과(Vary: Origin) |
| vite build && vite preview | `preview.cors` 같은 값 | **ready 수신** |

- `allow-same-origin` **불필요** → 멈춤 조건 해당 없음.
- **정적 호스팅 요구사항**: 앱이 배포될 때 렌더 문서의 JS·CSS·폰트 응답에 `Access-Control-Allow-Origin: null`(또는 `*`)이 있어야 한다. 없으면 iframe 안 모듈 스크립트가 실행되지 않는다. (참고: 설정 전 실행에서 브라우저 캐시에 ACAO 없는 응답이 남아 설정 뒤 첫 시도가 실패 → 캐시 비움 뒤 통과. 배포 시 헤더를 바꾸면 캐시 무효화 필요.)

## 3. 메시지 프로토콜 최종 모양 (`app/src/render/protocol.ts`)
| 방향 | 메시지 | 비고 |
|---|---|---|
| 부모 → 렌더 | `{type:"render", doc, palette?}` | doc 통째(편집마다). palette = 5역할 CSS 색 문자열. 렌더가 `validatePageDoc`으로 재검증 |
| 부모 → 렌더 | `{type:"viewport", width}` | iframe 폭(px) 변경 뒤 — 렌더가 사각형 다시 보고 |
| 부모 → 렌더 | `{type:"select", instanceId}` | 선택 변경 — 렌더가 사각형 다시 보고(렌더 DOM에 선택 표시 없음) |
| 렌더 → 부모 | `{type:"ready"}` | 탑재 직후 |
| 렌더 → 부모 | `{type:"rects", rects:[instanceId, slotKey \| null, x, y, w, h][]}` | 문서 좌표 CSS px. 섹션(slotKey null) + 글자 슬롯(`data-slot`). 그린 직후·ResizeObserver |
| 렌더 → 부모 | `{type:"click", instanceId}` | 섹션 누름 |
| 렌더 → 부모 | `{type:"error", code:"INVALID_DOC"}` | 재검증 실패 — 그리지 않음(이전 그림도 지움) |

- 양쪽 다 `event.source` 확인(부모: `iframe.contentWindow`, 렌더: `window.parent`) + 모양 검사(`readParentMessage`·`readRenderMessage`, rects ≤ 1024개). 보낼 때 targetOrigin `"*"`(불투명 출처라 지정 불가 — 내용은 사용자 자신의 문서).
- 브리프 B-1-6의 `tokens`·`images`·`captureMode`는 이 레인 범위 밖(M2A-2·3).
- 부모는 사각형을 "잰 문서"와 함께 보관하고 화면 문서와 다르면(다시 그리는 중) 오버레이 테두리·칩·배지를 그리지 않는다. 문제 문장은 늘 부모 DOM.
- iframe 높이 = 섹션 사각형 맨 아래(렌더 문서 자체 스크롤 없음). 다시 그리는 동안 마지막 높이 유지.

## 4. 옮긴 단언 표 (R0 목록 기준 — 삭제·약화·skip 0)
"동일" = 단언 코드 그대로(대상 DOM만 렌더 문서). "부모 대체" = 부모 쪽은 같은 사실을 메시지로 확인하고, DOM 단언 자체는 렌더 문서 테스트로 옮김.

| 원래 파일 · 테스트 | 새 위치 · 테스트 | 단언 동일 여부 |
|---|---|---|
| StructureCanvas.test "새 변형 3개를 슬롯 목록대로" — 블록 p 글자 순서 3건 | render/fallback/FallbackCanvas.test 같은 이름 | **동일** |
| 〃 — 칩 "Services · 카드 2열" · region | StructureCanvas.test(호스트) "cards-2 선택 → 칩 'Services · 카드 2열'" | **동일**(칩은 부모 오버레이 — SPEC 5.7 r4.8) |
| StructureCanvas.test "변형별 모양" — data-layout · data-cell · data-stripes · aria-hidden · 슬롯 글자 | FallbackCanvas.test 같은 이름 | **동일** |
| 〃 — 칩 "Hero · 스플릿 (카피 / 이미지)" | StructureCanvas.test "split 선택 → 칩 …" (+ 테두리 aria-hidden·border-primary 추가) | **동일 + 강화** |
| StructureCanvas.test "캔버스 루트 CSS 변수 = 팔레트 · 중립 토큰 · 블록이 변수 색" | FallbackCanvas.test 같은 이름 | **동일** |
| StructureCanvas.test "문제 표시는 데이터 색과 무관 — 흰 앱 면 안"(문제 **글자**가 bg-background-normal 안) | StructureCanvas.test "어두운 Footer 권장 초과 — 문장·배지는 흰 앱 면 위 …" | **SPEC r4.8로 대상 변경**: 문제 표시가 부모 오버레이로 가서 흰 면 위에 있는 것은 문장·배지(+ 2중 테두리 흰 간격 border-background-normal + outline 상태 토큰). 렌더 문서의 슬롯 글자는 프로필 색 그대로(5.7 B-12 — 게이트 대비 대상). 오버레이가 렌더 글자 아래에 흰 면을 깔 수 없다 |
| CanvasPalette.test "profileVersion 팔레트 → --canvas-* 변수" | 부모: 같은 테스트 — `frame.lastPalette().primary/bg` = 같은 값 · 변수 적용: FallbackCanvas.test "캔버스 루트 CSS 변수 = 팔레트 값" | **부모 대체** |
| CanvasPalette.test "프로필 없음 → 중립 토큰 · 편집 계속" | 부모: `lastPalette()` undefined · 편집 region 그대로 · 중립 토큰: FallbackCanvas.test "팔레트 없으면 중립 토큰 참조" | **부모 대체** |
| StudioLayout.test "권장 초과 → 캔버스 문제 문장 · describedby 맨 앞 · 경고 1" | 그대로(부모 오버레이) | **동일**(코드 무변경) |
| StudioLayout.test "필드 입력 → 캔버스 글자 반영 → 2초 뒤 저장 1회 …" — `within(canvas()).getByText("새 제목")` | 부모: `frame.lastDoc()` hero title = "새 제목"(나머지 저장 단언 무변경) · 그리기: FallbackCanvas.test "다시 채우면 실제 글자" | **부모 대체** |
| EmptySlot.test "글자를 모두 지우면 자리표시 '제목을 입력하세요'(label-alternative) …" — 캔버스 단언 3건 | 부모: lastDoc title "" → "새 제목"(aria-invalid·blur 단언 무변경) · 그리기: FallbackCanvas.test "글자를 모두 지우면 … label-alternative · 다시 채우면 실제 글자" | **부모 대체** |
| EmptySlot.test "선택 섹션이 아니어도 … '부제를 입력하세요'" | 부모: lastDoc subtitle "  " · 그리기: FallbackCanvas.test 같은 이름 | **부모 대체** |
| StudioShell.test "섹션 줄 선택 → 캔버스 라벨 칩" | 그대로(칩 = 부모 오버레이) | **동일**(코드 무변경) |
| StudioShell.test "캔버스 섹션은 Tab 정지가 아니다 · 포인터로 누르면 같은 선택" | 같은 테스트 — focusable 셀렉터 단언 무변경 · 클릭은 `frameSays({type:"click", instanceId:"s-about"})` · 렌더 쪽 click: RenderApp.test "섹션 누름 → click{instanceId}" | **동일**(트리거만 메시지) |
| StudioShell.test "라벨 = previewView … 전환 뒤 문서·선택 유지(canvas textContent 같음)" | 그대로 | **동일**(코드 무변경) |
| StudioShell.test "%i: 캡션 · 이미지·외부 URL 0 · 불투명도 0 · 칩 12px" — `img, iframe, [src]` 0 | 렌더 DOM: FallbackCanvas.test "이미지·iframe·src 0 · 외부 URL 0 · 불투명도 0"(같은 셀렉터·정규식) · 부모: img 0 + `iframe, [src]` = 정확히 `[IFRAME, /render.html, allow-scripts]` 1개 · 나머지(캡션·https·opacity·칩 클래스) 무변경 | **SPEC r4.8로 대상 변경**: 캔버스가 iframe이 되는 것이 SPEC 5.7 r4.8 자체. 부모 단언은 "iframe 0" 대신 "이 iframe 하나뿐 · 같은 출처 경로 · allow-scripts만"(더 좁음) |
| StudioShell.test 배치·순서(region "구조 미리보기") · "<1024는 캔버스 머리에" | 그대로 | **동일** |
| features/studio/canvasLayouts.test 4건 | render/fallback/canvasLayouts.test (git mv) | **동일** — 단, canvasVars 견본 hex → rgb() 문자열(noHardcodedStyle 검사 범위에 src/render 추가로 걸림, a3-2 V2 선례와 같은 처리, 단언 의미 불변) |
| features/studio/previewFrame.test 4건 | 그대로 | **동일** |

새로 더한 부모 테스트: StructureCanvas.test E-AC-49 4건(준비 전 문장 · 배지 → onIssue · render 메시지에 문서·팔레트만 · 미리보기 폭 = iframe 폭) · StudioLayout.test 배지 → 필드 포커스 2건(다른 섹션 · 이미 선택한 섹션 — 후자는 R5 브라우저에서 찾은 회귀).
새 렌더 문서 테스트: RenderApp.test 6건(ready · 재검증 → rects · INVALID_DOC · 출처·모양 무시 · click · viewport/select → 재측정) · FallbackCanvas.test 표식·편집기 UI 0 2건 · renderImportGuard.test 2건.

## 5. E-AC-49 판정 — **통과** (단위 테스트 + 실제 브라우저)
브라우저 증거 경로: `dev/active/m2a-1/r5.mjs`(ego-browser · vite dev 127.0.0.1:4337 · catalog → compare → 프로필 v1 → 3안 → B안 편집 시작 → /studio, 앱 안 클릭으로만 이동) → 출력 `logs/r5-browser.txt` · 프레임 포함 시맨틱 스냅샷 `logs/r5-ready-snapshot.txt`(준비 후) · `logs/r5-issue-snapshot.txt`(Hero 제목 34자 입력 뒤) · 스크린샷 `shots/r5-1280.png` · `shots/r5-390.png` · `shots/r5-1280-mobile-view.png`(R0 `shots/r0-*.png`와 나란히).

| E-AC-49 항목 | 브라우저 증거 | 단위 테스트 |
|---|---|---|
| 문제 문장 요소가 부모 문서에 있다 | `parent.sentence = "제목이 권장 28자를 넘었습니다 (34/28자)"` · `sentenceInCanvas: true`(부모 캔버스 region 안) | StudioLayout.test "권장 초과 → 캔버스 문제 문장 …" |
| iframe `contentDocument` 안에 0 | 렌더 문서는 불투명 출처 OOPIF라 `contentDocument === null`(`iframes: [["/render.html","allow-scripts",true]]`) → 스냅샷의 iframe 하위 트리(issue 스냅샷 93–189행)에서 `권장`·`경고`·라벨 칩 글자 **0건**, "구조 미리보기" 표식 9건(섹션 수) | FallbackCanvas.test "표식 · 편집기 UI 0" |
| `aria-describedby` id(문장·카운터)가 모두 부모에서 해석 | `describedby: [canvas-issue-hero-1-title, field-hero-1-title-count, field-hero-1-title-note]` · `resolved: [true,true,true]` | StudioLayout.test describedby 맨 앞 |
| 오버레이 테두리 `aria-hidden` | `rings: ["select","ring"]` = `[data-canvas-overlay] [aria-hidden=true]` 2개(선택 테두리 · 문제 2중 테두리) | StructureCanvas.test split 칩 + 테두리 aria-hidden |
| 배지 클릭 → 필드 포커스 | h1에 포커스를 둔 뒤 배지 클릭 → `active: INPUT`, describedby 맨 앞 = 문장 id (이미 선택한 섹션 경우 — R5에서 찾아 415867f에서 고친 회귀) | StudioLayout.test 배지 → 필드 포커스 2건 |
| 렌더 문서 준비 전에도 describedby 대상이 DOM에 있다 | (브라우저에서 준비 전 순간은 잡지 않음 — 단위 테스트로 판정) | StructureCanvas.test E-AC-49 "준비 전 문장" |
| 렌더 문서 DOM에 문제 문장·배지·라벨 칩 0 | 위 iframe 하위 트리 0건 | FallbackCanvas.test |
| (추가) 미리보기 폭 = iframe 폭 | 1280 뷰포트에서 "모바일" → `iframeWidth: 390, clientWidth: 390, wrapper: 24.375rem` | StructureCanvas.test "미리보기 폭 = iframe 폭" |

**390 폭 확인(M2A-1b F1, 10절)**: `shots/r5-390.png`의 빈 캔버스는 회귀가 아니라 캡처 도구 한계(판정 c) — 렌더 문서(불투명 출처 OOPIF)가 첫 뷰포트(900px) 밖(iframe y=1092)에 있을 때 fullPage 캡처가 iframe 안을 합성하지 못한다. 같은 상태를 뷰포트 캡처하면 섹션이 그려진다(`shots/f1-390.png` · 대조군 `shots/f1-390-fullpage.png`). `logs/r5-viewport.txt`의 15초 시간 초과는 재실행 2회에서 재현되지 않았다(고부하 중 준비 지연 추정).

## 6. 번들 표 (gzip KB, KB = 1000B, 첫 화면 / 진입 직후)
R0 = 시작 커밋 72fe57f(`logs/r0-baseline.txt`) · R3 = 폴백 이전 **전**(렌더 문서는 생겼고 앱 캔버스는 아직 앱에 있음, 10d0cdd `logs/r3-green.txt`) · R4 = 이전 직후(ff06fb5 `logs/r4-green.txt`) · **HEAD = 415867f**(`logs/r5-fix.txt`, Jarvis 실측과 같음).

| 화면 | R0 | R3 (이전 전) | R4 | **HEAD** | R0 대비 |
|---|---|---|---|---|---|
| 공통 JS | 89.34 | 89.34 | 89.34 | **89.34** | 0 |
| /catalog | 99.65 / 102.03 | 99.65 / 102.04 | 99.65 / 102.04 | **99.65 / 102.04** | 0 / +0.01 |
| /references/:id | 97.00 / 99.38 | 97.00 / 99.38 | 97.00 / 99.38 | **97.00 / 99.38** | 0 |
| /compare · (조정 있음) | 98.76 / 121.40 | 98.76 / 121.40 | 98.75 / 121.40 | **98.76 / 121.40** | 0 |
| /profile | 99.60 / 123.64 | 99.60 / 123.65 | 99.61 / 123.65 | **99.61 / 123.65** | +0.01 / +0.01 |
| /projects | 94.01 / 107.07 | 94.00 / 107.06 | 94.00 / 107.06 | **94.00 / 107.06** | −0.01 |
| **/studio/:projectId** | 91.72 / 124.31 | **91.72 / 124.31** | 91.72 / 123.85 | **91.72 / 123.88** | 0 / **−0.43** |
| **렌더 문서 JS / CSS** (예산 90 / 30) | — | 76.24 / 4.60 | 76.24 / 4.60 | **76.24 / 4.60** | 새 항목 |
| 렌더 문서 중 앱과 공유 청크 | — | 0 | 0 | **0 (없음)** | — |

- 폴백 이전 전후(결정 3): `/studio` 진입 직후 124.31 → 123.88(−0.43 — 앱 캔버스 그리기·`canvasLayouts`가 빠지고 iframe 호스트·오버레이·다리가 들어온 차). 렌더 문서 JS는 R3(폴백 복사)와 HEAD 같음 76.24.
- ±0.01 차는 해시·문자열 변화에 따른 gzip 흔들림(코드 무관 화면).
- 조작 뒤(판정 밖) `/studio`: docEngine +1.45 · AddSectionDialog +1.17 · VariantOptions +1.05 — R0와 같음.
- 참고(실패한 첫 시도, 커밋 안 함): 단일 빌드 두 엔트리 → 공통 89.48 · /catalog 99.89 · /studio 91.97/**125.31 = build FAIL**(7절 a).

## 7. SPEC·브리프 차이 (ADR-003)
**(a) 브리프 R1 "Vite 다중 페이지 입력" 대신 별도 빌드** — `vite build`(앱, `index.html`) 뒤 `vite build --mode render`(`render.html`, 같은 dist에 덧쓰기, `dist/.vite/render-manifest.json`). `package.json` build · `vite.config.ts` 머리 주석.
- 이유: 다중 페이지 입력(한 빌드 두 엔트리)으로 R3를 처음 빌드하자 react·jsx-runtime·rolldown 런타임·엔진 모듈이 두 엔트리 공유 청크로 갈라져 청크 오버헤드가 생기고 `/studio` 진입 직후 **125.31 > 125 = build 실패**. `codeSplitting.groups`로 react 계열을 묶어도 rolldown 런타임 분리가 남아 125.29. 또 렌더 문서는 `sandbox="allow-scripts"` 불투명 출처라 HTTP 캐시가 앱과 다른 파티션 → 공유 청크를 앱과 함께 받아도 다운로드 이득이 없다. 별도 빌드로 앱 수치가 R0와 같아졌다(±0.01).
- 결정 3(공유 청크 이중 계산): 스크립트가 두 manifest를 합쳐 렌더 엔트리 닫힘(정적 + RENDER_AUTO) 파일 중 앱 엔트리에서 닿는(정적 + dynamic) 파일과 **같은 파일명**을 "앱과 공유"로 양쪽 합계에 다 세고 목록을 출력한다(`scripts/bundleBudget.mjs` 91행~). 별도 빌드라 지금은 구조상 공유 0 — react-dom은 앱·렌더 문서에 **각각 한 벌씩** 들어가고, 렌더 문서 합계 76.24에 react-dom 전체가 이미 들어 있다(어느 쪽에서도 빼지 않음 = 결정 3의 취지 충족). 테스트: `bundleBudget.test.mjs` 공유 청크 픽스처.
- 결정 5(엔트리 이름 고정 · 제3 엔트리 실패): 합친 manifest에서 `isEntry`이면서 `index.html`·`render.html`이 아닌 키 = 실패, `index.html` 없음 = 실패, `render.html` 없음 = 실패, RENDER_AUTO 키 누락 = 실패. 테스트: `bundleBudget.test.mjs`(엔트리 2개 · 공유 청크 · 누락 · 제3 엔트리). 별도 빌드에서 제3 엔트리는 어느 manifest에 생겨도 합친 뒤 걸린다.
- dev 서버는 다중 페이지처럼 동작(`/render.html` 직접 서빙) — 차이는 production 빌드뿐.

**(b) noHardcodedStyle 범위 확장** — 검사 대상에 `src/render` 추가(`src/test/noHardcodedStyle.test.ts` "src/components·src/pages·src/render·src/styles …"). 렌더 문서도 컴포넌트 코드이므로 같은 규칙(CLAUDE.md 규칙 5)을 받게 했다. 그 결과 `canvasLayouts.test.ts`의 canvasVars 견본 hex를 rgb() 문자열로 바꿨다(단언 의미 불변, a3-2 V2 선례). 렌더 CSS(`render.css`)는 Tailwind 소스 스캔을 `src/render`로 좁혀 4.60KB.

**(c) 캔버스 테스트 이관 중 "SPEC r4.8로 대상 변경" 2건** (4절 표의 두 줄 — 삭제·약화·skip 0):
1. StructureCanvas.test "문제 표시는 데이터 색과 무관 — 흰 앱 면 안": 원래 단언은 문제 **글자**가 `bg-background-normal` 조상 안. SPEC 5.7 r4.8에서 문제 표시가 부모 오버레이로 가고 렌더 문서의 슬롯 글자는 프로필 색 그대로(B-12)라, 같은 단언을 "문장·배지가 흰 앱 면 위 + 2중 테두리 흰 간격 `border-background-normal` + outline 상태 토큰"으로 대상만 바꿨다. 오버레이가 iframe 글자 밑에 흰 면을 깔 수 없다.
2. StudioShell.test "이미지·외부 URL 0": 원래 `img, iframe, [src]` 0. 캔버스가 iframe이 되는 것이 r4.8 자체라 부모 단언을 "`iframe, [src]` = 정확히 `/render.html` · `allow-scripts`만인 iframe 1개"(더 좁은 조건)로 바꾸고, 원래 셀렉터·정규식 그대로의 0 단언은 렌더 DOM(FallbackCanvas.test)으로 옮겼다.

**그 밖**
- 메시지에 `tokens`·`images`·`captureMode` 없음(브리프 B-1-6 중 이 레인 범위 밖, M2A-2·3). 사용자 로컬 이미지는 렌더 문서로 넘기지 않고 지금과 같은 자체 플레이스홀더(브리프 R3 허용).
- 표식 "구조 미리보기"는 글자·위치 최소안(섹션 머리 오른쪽) — 시각 명세는 M2A-0 Designer 확정 대기.
- dev/preview 서버 CORS 설정 추가(R1, 2절) — 브리프 R1 허용 경로.

## 8. 남은 위험
1. **렌더 문서 JS 76.24 / 90KB — 여유 13.76KB, 그중 react-dom이 81%.** 모듈별(`logs/r6-render-modules.txt`, 소스맵 기준 gzip 비례 추정, 합 76.24):

   | 묶음 | gzip KB |
   |---|---|
   | react-dom | **62.03** |
   | react + scheduler | 2.98 + 1.47 = 4.45 |
   | src/engine/sections + validate (+contracts 등) | 2.82 + 2.70 + 0.22 = 5.74 |
   | src/render (RenderApp·protocol·main) + fallback | 1.02 + 1.81 = 2.83 |
   | domain · features/studio · 런타임 | 0.50 + 0.25 + 0.42 ≈ 1.2 |

   - 폴백(레이아웃 14종 + 기본 block · 변형 30개 매핑 전부)이 1.81KB. 실제 킷 변형은 모양별 JSX + 슬롯 처리라 변형당 대략 0.3~0.7KB gzip으로 **추정**(근거: 지금 fallback 1.81KB가 15 레이아웃 공용 그리기, 불확실성 Medium).
   - **M2A-2 킷 7변형**: +2~5KB(+ 이미지 Blob 전달·토큰 적용 1~2KB) → 약 79~83KB. 예산 안.
   - **M2b 30변형**: +9~21KB → 약 85~97KB. **90 초과 가능성 높음**. 대책 후보: (i) 변형별 dynamic import — 단 문서가 쓰는 변형은 조작 없이 바로 받으므로 결정 1 기준 합계에 들어갈 수 있어 "문서가 쓰는 변형만" 세는 판정 규칙이 필요(ADR 결정 사항) (ii) 렌더 문서에서 react-dom 대체(Preact 등 — 새 의존성·ADR 필요, ~55KB 절감 추정) (iii) 엔진 validate의 렌더 쪽 재검증을 경량화. M2A-2 시작 전에 결정 필요.
2. **정적 호스팅 CORS(Origin null) 요구**: 렌더 문서의 JS·CSS·폰트 응답에 `Access-Control-Allow-Origin: null`(또는 `*`)이 없으면 iframe 안 모듈 스크립트가 실행되지 않아 캔버스가 비고 "준비 전" 상태로 남는다. 지금은 vite dev/preview 설정(`vite.config.ts` cors)만 충족 — 배포 인프라 미정이라 호스팅 결정 때 요구사항으로 넘긴다. 헤더 변경 시 캐시 무효화 필요(R1에서 캐시된 무헤더 응답으로 1회 실패 관찰). 폰트 4종(woff2 각 ~270KB)도 렌더 문서가 따로 받는다(캐시 파티션 분리).
3. **문제 문장과 렌더 글자 겹침(시각)**: `shots/r5-1280.png`에서 부모 오버레이의 문제 문장("제목이 권장 28자를 넘었습니다")이 렌더 문서의 부제 줄 위에 겹쳐 그려진다. 오버레이는 렌더 레이아웃을 밀어낼 수 없어 생기는 구조적 결과 — 문장 위치(테두리 밖·섹션 아래 등)는 M2A-0 Designer 시각 명세에서 정할 항목. 기능(E-AC-49)은 통과. 이번 레인은 새 구현 금지라 기록만.
4. **manifest 합치기 키 충돌**: `check-bundle-size.mjs`는 `{...앱 manifest, ...렌더 manifest}`로 합친다. 지금 렌더 빌드는 청크 1개라 겹치는 키는 폰트 asset뿐(같은 해시 파일)이지만, 렌더 빌드가 청크를 나누면 같은 소스 키(예: `node_modules/react-dom/...`)가 앱 manifest 항목을 덮어써 앱 라우트 합계가 조용히 틀릴 수 있다. 렌더 쪽을 나눌 때 두 manifest를 따로 두고 각 빌드 닫힘을 따로 계산해야 한다. **Codex R6 [P2]가 같은 지적**(`check-bundle-size.mjs:103`, 아래 9절). HEAD 실측: 렌더 manifest 키 5개 중 앱과 겹치는 키 = 폰트 woff2 4개뿐, 4개 모두 같은 파일·imports 없음 → 지금 합계에는 영향 0.
5. 공유 청크 판정은 파일명 일치 기준 — 별도 빌드라 내용이 같아도 해시가 다르면 공유로 안 잡힌다(지금은 의도대로 양쪽 각자 계산이라 합계는 맞음).

## 9. R6 검증
- **Codex** `node codex-companion.mjs review --scope branch --base 72fe57f` 1회 — 원문 `logs/r6-codex-review.txt`. 지적 1건:
  - [P2] `app/scripts/check-bundle-size.mjs:103` — 두 manifest를 spread로 합쳐 같은 소스 키가 있으면 렌더 manifest가 앱 항목을 덮어써 앱 라우트 합계가 틀릴 수 있다. → **고치지 않음**(브리프: P1 이상만 수정). HEAD에서 겹치는 키는 폰트 4개(같은 파일·imports 없음)뿐이라 현재 수치 영향 0 — 8절 4번에 위험으로 기록. 렌더 빌드가 청크를 나누는 레인(M2A-2 이후)에서 manifest 분리 계산으로 고칠 것.
  - P1 이상 0건.
- **전체 vitest ×3** — `logs/final-full-x3.txt`(load 기록 포함). 레인 실행 6회(1차 ×3 + 재실행 ×3) 중 고부하(load 137~161, ego-browser 동시 실행) 2회에서 `StudioShell.test.tsx` "섹션 줄 선택 → aria-current · 편집 h2 · 캔버스 라벨 칩 …" 1건 실패(1446/1447, 1차 3회차는 이름 미기록), 나머지 4회 1447/1447. Jarvis 회수: 해당 테스트 단독 10/10 통과 · 전체 3회 1447/1447 → 부하 의존 타이밍 불안정(flaky)으로 분류, 단언 변경 없음. 8절 위험 목록 대상.

## 10. M2A-1b — 390 폭 캔버스 빈 화면 진단 (`docs/06-handoff/M2A-1B_FIX_BRIEF.md`)
- **판정 (c) 도구 한계 — 회귀 아님.** 원문 `logs/f1-diagnosis.txt` · `logs/f1-raw.txt` · 스크립트 `f1.mjs`(+`f1.json`).
- 방법: vite dev 127.0.0.1:4337, 실제 뷰포트 1280·1024·390(CDP `Emulation.setDeviceMetricsOverride`, 미리보기 토글은 데스크톱 그대로). 부모 `message` 리스너로 iframe 발 ready/rects 수 집계.
- 측정: 세 폭 모두 iframe zoom 1 · transform none · visible · block · 높이 = 섹션 사각형 맨 아래(1648 / 1648 / 1942px) · rects 44개 정상 · error 0 · 라벨 칩 표시. 시맨틱 스냅샷 iframe 하위 트리에 섹션 글자 있음.
- 원인: 렌더 문서는 `sandbox="allow-scripts"` 불투명 출처 → 별도 프로세스 프레임(OOPIF). `fullPage` 캡처는 첫 뷰포트 밖을 찍으려 뷰포트를 늘려 다시 그리며 이때 OOPIF 내용이 합성되지 않는다. 390은 iframe이 첫 뷰포트 밖(y=1092)이라 비고, 1280은 페이지 스크롤이 없고 iframe이 y=52라 정상으로 찍혔다.
- 증거: 뷰포트 캡처 `shots/f1-1280.png` · `shots/f1-1024.png` · `shots/f1-390.png`(섹션 보임) · 대조군 `shots/f1-390-fullpage.png`(같은 상태 fullPage — r5-390과 같은 빈 모양) · R0 `shots/r0-390.png`(앱 안 캔버스라 fullPage에도 찍힘).
- 수정: 없음(회귀 없음 → RED→GREEN 대상 없음). 이후 캔버스 캡처는 fullPage 대신 iframe `scrollIntoView` + 뷰포트 캡처(f1.mjs 방식).
- 게이트: `dev/active/m2a-1/gate.sh f1-gate` → `logs/f1-gate.txt`.
