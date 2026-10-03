# B0 기준선 (시작 커밋 fdb5a06) — 2026-10-03

게이트 `dev/active/m2a-2b/gate.sh b0-baseline` → `logs/b0-baseline.txt` (guards 75/75 · typecheck · lint · build exit 0)

| 화면 (gzip KB) | 첫 화면 | 진입 직후 |
|---|---|---|
| 공통 JS | 89.34 | — |
| /catalog | 99.64 | 102.03 |
| /references/:id | 96.99 | 99.38 |
| /compare · (조정 있음) | 98.75 | 121.39 |
| /profile | 99.60 | 123.64 |
| /projects | 94.00 | 107.05 |
| /studio/:projectId | 91.72 (≤99.40) | 124.23 (≤124.70) |
| 렌더 문서 JS / CSS | 78.86 (멈춤선 89.70) | 5.76 (≤30) |
| 렌더 문서 중 앱과 공유 | 0 | |

캡처: `shots.mjs`(+`shots.json` prefix b0) · ego-browser · vite dev 127.0.0.1:4337 · 앱 흐름 A안 · iframe scrollIntoView(start/end) + 뷰포트 캡처(fullPage 0)
- `shots/b0-1280-top.png` · `b0-1280-bottom.png` · `b0-390-top.png` · `b0-390-bottom.png` · 로그 `logs/b0-shots.txt` (error 0, rects 44)
- 1280 창: iframe 폭 721(열 폭 — 데스크톱 프레임 = 열 폭, md 미만 배치) · 390 창: iframe 351
