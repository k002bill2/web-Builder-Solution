# M4-a-4 QA 2차 run — 실화면 매트릭스 계획 (LIVE-PLAN)

작성: 1차 QA run 2026-10-18 · 대상 tip = 2차 착수 시점 `k002bill2/m4a-qa`(또는 수정 반영 tip) · 정본 `docs/design/m4a/EXPORT-SPEC.md` 7.1 R1~R5

## 0. 환경 사실 (`ls /Applications` · 2026-10-18)
| 브라우저 | 설치 | 구동 수단 | 비고 |
|---|---|---|---|
| Ego Lite (Chromium) | 있음 `ego lite.app` · `~/.local/bin/ego-browser` | **자동** — `ego-browser nodejs` (TaskSpace/Page API · 폭은 `page.cdp('Emulation.setDeviceMetricsOverride')`) | Chromium 대표 |
| Google Chrome · Microsoft Edge | 있음 | 수동(`open -a "Google Chrome" <url>`) — 자동 구동 수단 없음 | Ego Lite가 Chromium 행을 대신. 필요 시 수동 1회 |
| Safari | 있음 | **수동** — `open -a Safari <url>` 후 사람이 확인·`screencapture` | 자동화 도구 금지(Playwright·Puppeteer·claude-in-chrome 금지 규칙) |
| Firefox | **없음** | — | **BLOCKED** — 설치는 사용자 승인 필요. 승인 없으면 Firefox 열 전부 미확인으로 기록 |
| Archive Utility | 있음 `/System/Library/CoreServices/Applications/Archive Utility.app` | `open -a "Archive Utility" <zip>` (Finder 더블클릭과 같은 처리) + `ditto -xk` 대조 | 1차에서 `ditto -xk`만 확인 |
| Windows 탐색기 | 없음 | — | R5 Windows 행 BLOCKED(환경 없음) |

## 1. 준비 (예상 3턴)
1. `cd app && npm run build && npx vite preview --port 4395 --strictPort` 백그라운드(나중에 반드시 종료).
2. 문서 = 경로 A(모던 카페 A v1 → 보정값 v2 → B안 새로 시작 → SEO 입력 · 게이트 차단 0 — 메모리 "내보내기 게이트 시드 차단"). **앱 안 클릭으로만 이동**(새로고침하면 메모리 store 초기화 — 메모리 "메모리 store 새로고침 함정").
3. Hero 1200×800 · About 800×800 이미지 업로드 + 대체텍스트. 출력 폴더 `/tmp/m4a-qa-live/`(저장소 밖).

## 2. 매트릭스 (실행 순서)
| # | 행 | 브라우저 × 폭 | 형식 | 확인 | 수단 | 예상 턴 |
|---|---|---|---|---|---|---|
| L1 | 내보내기 UI | Ego × 1280 · 390 | zip · HTML | 버튼 순서·크기 · 성공 status 1 · alert 0 · 포커스 = 누른 버튼 · 내려받기 링크 ≥ 24px · 성공 제목 조사(수정 반영 여부) · 차단 보조 문장 (R4) | ego-browser | 3 |
| L2 | 실패 alert | Ego × 390 | zip | 실패 경로 1개 유발(예: 렌더 청크 차단 또는 F-패턴 주입 불가 시 시간 초과) → alert 1개 · 문구가 `export.fail.pattern`/일반 문구 중 무엇인지 기록 (R4 잔여 · 5b) | ego-browser | 3 |
| L3 | 해제 | — | zip | `open -a "Archive Utility"` 해제 폴더 vs `ditto -xk` `diff -r` 동일 · `unzip -t` 0 오류 · 파일 7개(이미지 2) (R1·R5) | Bash | 1 |
| L4 | 로컬 서버 | Ego × 1280 · 390 | zip · HTML | `python3 -m http.server 4396` · 이미지 2·글꼴 400/700 loaded · 가로 넘침 0 · 요청 전부 `assets/*` 200 · 외부 0 · 404 = favicon만 (R1·R2) · 미리보기 스크린샷과 비교 · **단일 `.html`도 같은 서버로 1280·390**(data: 이미지·글꼴 loaded · 요청 = 문서 1건) | ego-browser | 4 |
| L5 | 로컬 서버 | Safari × 1280 · 390 | zip · HTML | 같은 URL(폴더 index.html + 단일 .html) 수동 열기 · 이미지·글꼴 눈 확인 · `screencapture` (R1) | 수동 | 3 |
| L6 | `file://` | Ego × 1280 | zip · HTML | 폴더 `index.html` · 단일 HTML 직접 열기 → `document.fonts.check` 400/700 · 이미지 로드 (R1b 관찰) | ego-browser | 2 |
| L7 | `file://` | Safari × 1280 | zip · HTML | 같은 2파일 수동 열기 — 상대 경로 `@font-face` 적용 여부(Q19 재판정 트리거) (R1b) | 수동 | 2 |
| L8 | Firefox 열 | Firefox × 1280 · 390 | zip · HTML | L4·L6 반복 | 수동 | BLOCKED(미설치) |
| L9 | 큰 문서 | Ego × 1280 | zip · HTML | 이미지 20MB+ 문서(노이즈 PNG 10장+ 슬롯마다 업로드 · 입력 한도 파일 10MB · WebP 0.82) → zip 성공 · 생성 시간 · 단일 HTML 성공/크기 (R3 — Developer BLOCKED 항목) | ego-browser | 6 |
| L10 | render.css 외부 문자열 | — | HTML · zip | 실제 build 결과 index.html·단일 HTML에 `scan.py`(`logs/scan.py`) — `https://tailwindcss.com` 주석 외 외부 요청 후보 0 (1차 3절 한계 보완) | Bash | 1 |
- 노이즈 이미지 생성: `python3`로 무작위 PNG(압축 안 되는 바이트) — 앱 코드 아님, `/tmp`에만.

## 3. 마감 (예상 2턴)
1. preview·http.server 종료 → `lsof -nP -iTCP:4395 -sTCP:LISTEN` · `:4396` 출력 없음 기록.
2. IDB `design-studio` 삭제 · ego-browser `finish({keep:[]})`.
3. 스크린샷만 `dev/active/m4a-qa/shots/`에 커밋 · 내려받은 파일은 저장소 밖 · `git status --short` 빈 값.

## 4. 예산
- 합계 예상 ≈ 28턴(+BLOCKED 행 제외) · 상한 권고 40턴. 순서 우선: L1 → L3 → L4 → L6 → L2 → L10 → L9 → L5·L7(수동, 사용자 참여 필요) → L8.
- 수동 행(L5·L7·Safari)은 무인 run에서는 할 수 없으므로 **사용자 동석 run** 또는 미확인 기록. [추정] 무인 2차는 Ego 행 + Bash 행만 가능.
