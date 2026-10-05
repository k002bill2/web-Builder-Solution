# M2C-5b REPORT — M2c 조건부 Go 조건 해소 QA

## meta
- 역할 QA / Orca managed Claude Code / worktree m2c-5b-qa / base `2e90e8f` / P0 `0819b76` · 2026-10-06
- 서브에이전트 0 · 앱/테스트/docs/design/lock/scripts·다른 레인 폴더 수정 0 · 쓰기는 `dev/active/m2c-5b-qa/`만 · push/merge/삭제 0
- 서버: dev 4337(PID 3163, cwd = 이 worktree `app`)·정적 4339(PID 4118, python http.server, cwd = 이 폴더) 모두 127.0.0.1 → PID·cwd 확인 후 종료 → 4337/4339 리슨 0. main 5480(PID 82062)은 리슨 확인만, 무접촉
- Ego Lite: 시작 전 `listTaskSpaces()` = `[]`. space 76("m2c-5b qa")을 만들었으나 s1 사본이 env `SPACE`를 받지 못해(ego-browser가 env 미전달) 스스로 space 77("m2b-6 qa" — 원본 스크립트의 기본 이름)을 만들었다. 76은 빈 채로 즉시 `finish({keep:[]})` → `closedSpace:true`. 이후 전부 77/p1. 끝에 `finish({keep:[]})` → `{"closedSpace":true,"closedManagedLabels":["p1"],"preservedUnmanagedCount":0}` · **`listTaskSpaces()` = `[]`** (`logs/ego-finish.txt`)
- 이동은 앱 안 클릭만, **새로고침 0**. 폭 변경은 CDP `Emulation.setDeviceMetricsOverride`. 앱 첫 진입은 `/`(goto 1회, 빈 store에서 시작)
- 턴: 1단계 약 17턴(30턴 안) · 측정 종료 약 52턴(60턴 전)
- 판정 등급: PASS / 결함 / 환경 한계 / 미검증. N/A를 PASS로 쓰지 않음. Safari·Firefox·실기기 미검증

## 1. 결론 — **M2c = Go** (의견)
| 조건(M2C-5 REPORT 1절) | 이번 판정 |
|---|---|
| 1 시각 회귀 기준선 30×3 + 결정성 | **해소** — 90장 재생성, 2회 픽셀 차 0/90, m2b-6 대비 차이 27장은 전부 `kit-art` 자리 안(밖 0) |
| 2 M2C-3 이관 768·390 패널 판정 | **해소** — 두 폭 모두 "편집" 탭 안에서 도달·조작 가능, 이미지 지우기 실제 실행(1280 포함) 캔버스 반영 PASS |
| 3 QB-10 경로 결정 | 이 레인 범위 밖(BRIEF: 사양 결정 B-M2C-03으로 분리) — Go 판정의 게이트로 보지 않음 |
| F2 캡션 육안 | **PASS** — 1280·768·390 화면에 보임 |

P0·P1 결함 0. 새 결함 P3 2건(E-1 포커스 유실, E-2 상태 문구 잔존) + D-3 재현. 모두 사용 흐름을 막지 않는다 → **Go**. 단 B-M2C-03(QB-10) 사양 결정과 P3 백로그는 M2d 전에 처리 권고. 조건부 Go로 남겨야 한다고 보는 경우의 근거는 E-1(키보드 사용자 포커스 유실)뿐이다.

## 2. 시각 회귀 기준선 (조건 1)
### 방법
- `dev/active/m2b-6-qa/{s1-render30.mjs,s2-measure.mjs,shots.sh,pdiff.mjs}` 사본. 원본 변경 0(`git status` 깨끗). 사본 변경: s1·s2 `DIR`, s2 `taskSpace(68)` → `taskSpace(77)`(68은 m2b-6 레인 space라 없음 · env 미전달). shots.sh·pdiff.mjs 변경 0
- s1: render.html 최상위 → 변형마다 render → 판정 → 제품 serialize + buildStaticHtml(CSS 원문). sandbox iframe fullPage 캡처 안 함
- 캡처: Chrome headless `--screenshot`(shots.sh 그대로, `--force-prefers-reduced-motion`·`--hide-scrollbars`) — CDP 캡처 아님
- 분류 도구(이 레인 추가): `s3-art-rects.mjs`(정적 사본에서 `[class*=kit-art]` 최상위 rect, 캡처와 같은 창 높이·스크롤바 숨김) + `pclassify.mjs`(차이 픽셀을 rect 안/밖으로 셈)

### 결과
| 항목 | 결과 | 증거 |
|---|---|---|
| 실렌더 30/30 | **PASS** — 30변형 모두 `data-kit`·폴백 0·표식 0·에러 0. 음성 대조(킷 토큰 없음): 폴백 3·표식 3 검출 | `logs/s1-run.txt` · `logs/s1-render30.json` |
| 폭별 높이·넘침 | 90칸 모두 가로 넘침 0 · 글꼴 loaded 2면(Pretendard 400/700) · 실행 중 애니메이션 0. m2b-6 대비 높이 변화 1칸: portfolio--masonry 1280 **1277 → 1278**(+1px) | `logs/s2-heights.json` · `logs/s2-run.txt` |
| 기준선 | 90장(30×1280·768·390) `baseline/` · **2.5MB** 커밋 | `baseline/` |
| 결정성 | 2회 캡처(`baseline/` 대 `run2/`) **diffPx 0 / 90** | `logs/determinism.txt` |
| m2b-6 대비 | 차이 27/90장 = 아래 9변형 × 3폭. 차이 없음 63장 | `logs/vs-m2b6.txt` |

### m2b-6 대비 분류표
| 변형 | 폭 | 차이 픽셀(kit-art 안) | kit-art 밖 | 분류 |
|---|---|---|---|---|
| about--story | 1280·768·390 | 348,448 · 97,968 · 160,352 | 0 | 의도된 변경(SVG) |
| footer--biz-extended-map | 1280·768·390 | 144,078 · 92,026 · 95,028 | 0 | 의도된 변경(SVG) |
| hero--fullbleed-left | 1280·768·390 | 775,900 · 227,680 · 114,270 | 0 | 의도된 변경(SVG) |
| hero--grid | 1280·768·390 | 114,124 · 149,786 · 96,270 | 0 | 의도된 변경(SVG) |
| hero--image | 1280·768·390 | 702,720 · 331,776 · 114,270 | 0 | 의도된 변경(SVG) |
| hero--split | 1280·768·390 | 348,448 · 97,968 · 96,270 | 0 | 의도된 변경(SVG) |
| portfolio--grid-2 | 1280·768·390 | 707,496 · 295,776 · 320,344 | 0 | 의도된 변경(SVG) |
| portfolio--grid-3 | 1280·768·390 | 450,224 · 188,064 · 480,698 | 0 | 의도된 변경(SVG) |
| portfolio--masonry | 1280·768·390 | 795,776(공통 1277행) · 332,896 · 360,410 | 0 | 의도된 변경(SVG) + 1280 높이 +1px(관찰 O-1) |
- 근거: m2b-6 정적 사본에서 `kit-gradient`가 2회 나오는 파일 = 정확히 이 9개(나머지 21개는 CSS 규칙 1회뿐), 새 사본에서 `kit-art`가 나오는 파일도 이 9개. **결함 후보 0.**
- 측정 주의: 처음 rect 측정은 Ego Lite 스크롤바(15px) 때문에 폭이 줄어 3장(hero--image 1280, portfolio 390 3종)에서 "밖" 픽셀이 나왔다. 스크롤바 숨김(`Emulation.setScrollbarsHidden`)으로 재측정해 0이 됐다 — 측정 오차였고 결함 아님.

### 기준선 사용법(다음 레인)
1. `app/`에서 `npx vite --host 127.0.0.1 --port 4337 --strictPort`
2. `s1-render30.mjs`의 `DIR`을 실행 폴더로, space는 `taskSpace(<id>)`로 직접 적기(ego-browser는 env를 넘기지 않음) → `ego-browser nodejs < s1-render30.mjs` → `static/` 30개(+`_fonts.css`)
3. `python3 -m http.server 4339 --bind 127.0.0.1 -d static` → `s2-measure.mjs`(같은 수정) → `logs/s2-heights.json`
4. `./shots.sh <출력폴더>` 2회 → `node pdiff.mjs <폴더1> <폴더2>`로 0/90 확인
5. `node pdiff.mjs <이 레인>/baseline <새 폴더>` — 차이가 있으면 `s3-art-rects.mjs` + `pclassify.mjs`로 의도된 자리 안/밖을 나눈다. 밖이 0이 아니면 결함 후보
- `static/`·`run2/`·fixture 바이너리는 `.gitignore`(재생성 가능)

## 3. 768·390 이미지 패널 (조건 2 · M2C-3 이관)
흐름: 카탈로그 → 비교 추가(헤어살롱·카페) → 비교 보드 "B 모던 카페 전부 선택" → 프로필 확정 v1 → 3안 만들기 → A안 → 편집 시작 → `/studio/project-1` (모두 앱 안 클릭)

| 폭 | 판정 | 실측 | 증거 |
|---|---|---|---|
| 1280 | **PASS** | 펼침 → 형식 위장 PNG(f06) → "JPEG·PNG·WebP 이미지만 쓸 수 있습니다" + 파일 버튼 `aria-invalid=true` → 3:2 JPEG → "1500 × 1000 · WebP 28KB" + 캔버스 Hero에 그림 → 대체텍스트 입력 → 장식 체크 시 `aria-disabled=true`·게이트 "대체텍스트 통과" → **이미지 지우기 실제 실행** → 메타 사라짐·버튼 "이미지 고르기"로 · 캔버스 Hero가 자체 그래픽 SVG로 돌아감 | `shots/panel-1280-picked.png` · `clear-1280-before.png` · `clear-1280-after.png` |
| 768 | **PASS** | 768에서 편집기는 "섹션 / 편집 / 검사" 탭 배치. 기본 탭 "섹션" → "편집" 탭 클릭 → 이미지 편집 details 729×42(닫힘) → 펼침 729×765 · 가로 넘침 0. SVG(f10) 실패 문구·`aria-invalid=true` → 2:3 JPEG "1000 × 1500 · WebP 30KB" → 장식 체크 `aria-disabled=true` → **지우기 실행** → 캔버스 Hero 자체 그래픽 복귀 | `logs/panel-768.txt` · `shots/w768-initial.png` · `w768-edit-tab.png` · `w768-fail.png` · `w768-picked.png` · `w768-canvas-{before,after}-clear.png` |
| 390 | **PASS** | 같은 탭 배치, details 351×607~661 · 가로 넘침 0. 실패 문구 → 선택 → 장식 → **지우기 실행** → 캔버스 복귀 | `logs/panel-390.txt` · `shots/w390-fail.png` · `w390-panel-recheck.png` · `w390-canvas-{before,after}-clear.png` |

- **이전 레인 "상자 0" 원인 판정**: 768·390에서 편집 영역은 탭 패널이고, 기본 선택 탭이 "섹션"이라 편집 패널 조상 `DIV.px-3 py-2`가 `display:none`이었다(실측). 결함 아님 — "편집" 탭을 누르면 도달·조작 가능.
- 환경 메모: `w390-picked.png` 상단 흰 공백은 스크롤 직후 400ms 캡처 타이밍 문제. 1.5초 뒤 재캡처(`w390-panel-recheck.png`)와 `elementFromPoint`로 정상 렌더 확인 — 결함 아님.

## 4. F2 (조건 3 일부) — 갱신 표
| 조건 | 판정 | 근거 |
|---|---|---|
| 모든 섹션 실렌더 | **PASS(30변형 전수)** | s1 30/30 · 폴백 0 · 표식 0 · 음성 대조 검출 |
| 폰트 자체 호스팅 | PASS | 정적 사본 90칸 Pretendard 2면 loaded(data: 글꼴) · M2C-5 HTML 외부 요청 0 |
| 모션(M2b) | 게이트 확인 수준(변경 없음) | 기준선은 감소 모션으로 캡처 |
| 이미지 슬롯 = 사용자 이미지 또는 자체 그래픽 | PASS | 3폭에서 사용자 이미지 반영 → 지우기 → 자체 그래픽 복귀 실측 |
| 정적 HTML·PNG에 같은 이미지 | PASS(M2C-5 실측, 이번 재실행 안 함) | M2C-5 QB-8·QB-9 |
| 캔버스 캡션 "시안 (F2)" | **PASS(육안)** | "시안 (F2) — 프로필의 색·글자·글꼴·모션과 고른 이미지 또는 자체 그래픽으로 그린 페이지입니다." 1280: 미리보기 제목 아래(232,96 · 721×18 · 13px · visible · opacity 1 · aria-hidden 조상 없음). 768·390: 편집 탭 아래 "페이지 미리보기" 제목 아래에 보임 · 새로고침 없음 | `shots/f2-caption-1280.png` · `w768-edit-tab.png` · `w390-panel-recheck.png` |
→ **F2 = PASS**

## 5. 결함·관찰
| ID | 심각도 | 내용 | 재현 | 증거 |
|---|---|---|---|---|
| E-1 | P3(접근성) | "이미지 지우기"를 누르면 버튼이 사라지면서 포커스가 `BODY`로 떨어진다. 마우스(1280·768·390)·**키보드 Enter**(1280) 모두. 다음 Tab은 편집 패널 첫 버튼 "위로"로 감 — 작업 위치(이미지 편집)를 잃음 | 이미지 선택 → "이미지 지우기"에 포커스 → Enter → `document.activeElement` | `logs/panel-768.txt`·`panel-390.txt` CLEAR 줄 · 이 REPORT 3절 |
| E-2 | P3 | 지운 뒤에도 `role=status` 글이 "이미지를 넣었습니다(대체텍스트를 적어 주세요)"로 남는다 — 지움 결과를 알리지 않고 이전 결과가 보임 | 위와 같음 → status 글 | `logs/panel-768.txt`·`panel-390.txt` CLEAR 줄 |
| D-3(재현) | P3 | 폭 변경 시 열어 둔 "이미지 편집"이 닫힌다: 1280→768 닫힘, 390→1280 닫힘(768→390은 같은 탭 배치라 유지). 1280→768에선 기본 탭 "섹션"으로 돌아가 편집 위치도 잃음 | 펼침 → 폭 변경 | `shots/w768-initial.png` · 3절 |
| O-1 | 관찰 | portfolio--masonry 1280 정적 문서 높이 1277→1278(+1px). 차이 픽셀은 전부 kit-art 안 — SVG 교체의 부수 효과로 봄 | s2 실행 | `logs/s2-heights.json` |
| O-2 | 관찰 | 지운 뒤 대체텍스트 입력값은 유지된다(다음 이미지에 그대로 쓰임). 사양 확인 필요 — 결함 판정 안 함 | 지우기 후 입력란 | `shots/clear-1280-after.png` |
- M2C-5의 D-1·D-2·D-4·B-M2C-01은 이번 범위 밖(재측정 안 함)

## 6. 회귀 게이트
- `npx vitest run`(기본 1회): **227파일 2034/2034 통과 · EXIT 0** · 32.2s (`logs/vitest.txt`)
- `npm run build` **EXIT 0** (`logs/build.txt`)

| 경로 | 첫 화면 | 진입 직후 자동 로드 포함 |
|---|---|---|
| /catalog | 99.66 / 100 | 102.04 / 125 |
| /references/:id | 97.00 / 100 | 99.39 / 125 |
| /compare | 98.84 / 100 | 121.70 / 125 |
| /profile | 99.62 / 100 | 119.12 / 125 |
| /studio/:projectId | 91.77 / 100 | 127.04 / 128 (M2c 기준선 127.36 + 0.03, 멈춤 > 127.39) |
- 조작 뒤 청크(gzip): ImageSlotPanel 3.33 · ingest 2.64 · imageStore 0.92 · exportImages 0.69 · exportFlow 3.26 · pngCapture 9.97 — M2C-5와 같은 해시·크기

## 7. fixture
- `fixtures/gen-fixtures.mjs` = M2C-5 생성기 사본(DIR·space만 변경). 24개 재생성, **이름·바이트·sha256 앞 16자리가 M2C-5 MANIFEST와 24/24 같음**. 바이너리는 `.gitignore`, `MANIFEST.json`만 커밋

## 8. 책임·환경
- 실측: 데스크톱 Chrome 계열 Ego Lite 1종 + 기준선은 macOS Google Chrome headless. **Safari·Firefox·모바일 실기기 = 미검증**
- 좁은 폭은 CDP 뷰포트 덮어쓰기(창 크기 자체가 아님). 캔버스(교차 출처 sandbox iframe) 반영은 화면 캡처로 판정
- 결함은 고치지 않았다
