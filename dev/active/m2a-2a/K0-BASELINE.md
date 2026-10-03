# K0 기준선 (시작 커밋 f0fdb2b) — 2026-10-03

게이트 `dev/active/m2a-2a/gate.sh k0-baseline` → `logs/k0-baseline.txt` (guards 63/63 · typecheck · lint · build exit 0)

| 화면 (gzip KB) | 첫 화면 | 진입 직후 |
|---|---|---|
| 공통 JS | 89.34 | — |
| /catalog | 99.65 | 102.04 |
| /references/:id | 97.00 | 99.38 |
| /compare · (조정 있음) | 98.76 | 121.40 |
| /profile | 99.61 | 123.65 |
| /projects | 94.00 | 107.06 |
| /studio/:projectId | 91.72 (≤99.40) | 123.88 (≤124.70) |
| 렌더 문서 JS / CSS | 76.24 (멈춤선 89.70) | 4.60 (≤30) |
| 렌더 문서 중 앱과 공유 | 0 | |

캡처: `shots.mjs`(+`shots.json` prefix k0) · ego-browser · vite dev 127.0.0.1:4337 · A안(hero `fullbleed-left` — 칩 "Hero · 풀블리드 이미지 + 좌측 카피") · iframe scrollIntoView(start/end) + 뷰포트 캡처
- `shots/k0-1280-top.png` · `k0-1280-bottom.png` · `k0-390-top.png` · `k0-390-bottom.png` · 로그 `logs/k0-shots.txt` (error 0, rects 46)
- 관찰: 편집 패널 "이미지 슬롯 1개는 다음 단계에서 편집할 수 있습니다" — 앱에 로컬 이미지 보관소·업로드 UI 없음(K4 범위 판단 근거)
