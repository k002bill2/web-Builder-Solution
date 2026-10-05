# M2B-D1 PROGRESS — PNG 높이 비결정(D-1)

- base `a121f31` · branch `k002bill2/m2b-d1` · 서브에이전트 0

- [x] 0. BRIEF·PROGRESS 커밋 (1fcdcff)
- [x] 1. 원인 판정(코드 변경 전) — **(b) 그렸지만 잘못된 폭에서 잰 rects를 받아들임**
  - 코드 경로: `pngCapture.ts:101` settled = `pageBottom(r) > 0`만 — rects의 섹션 폭이 캡처 폭(`width`)인지 보지 않음. 높이 = 그 rects 바닥(104행), 그림 폭 = 1280 고정(SVG `width:1280px`) → 내용은 1280 배치, 캔버스는 다른 폭 배치 높이.
  - Ego Lite 프로브(`repro/rects-probe-ego.mjs`, `logs/probe-ego.txt`): rAF 8~10/8초 정지 상태 3/5회에서 첫 rects = 섹션 폭 0(바닥 0) → 뒤에 1280 rects. 즉 렌더 문서는 iframe 뷰포트가 캡처 폭이 되기 전 배치를 보고한다.
  - 폭별 높이(`logs/width-heights*.txt`, headless): 0·1·16px → 바닥 8313(> 0, 1280의 2.39배) · 50px 8168 · 100px 4374 · 1280px 3479. 좁은 폭 rects는 "바닥 > 0"을 통과한다.
  - headless 정상 rAF(`logs/probe-headless-x1.txt`) 5/5 첫 rects부터 1280 → 재현 안 됨(정상 환경에선 드묾).
  - 한계(L3): QA의 10492를 만든 정확한 중간 뷰포트 상태(폭 0×높이>0 등)는 직접 관측 못 함.
- RED 전 예측: 새 테스트 **3개**(pngCapture.test.ts) — ① 좁은 폭 rects 뒤 최종 rects → 높이 = 최종(RED) ② 좁은 폭만 오면 RENDER_TIMEOUT(RED: 지금은 좁은 높이로 그림) ③ 상한 넘는 문서는 스크롤바로 폭이 줄어도 CANVAS_TOO_TALL(지금도 GREEN — 실패 정책 고정). 픽스처 fakeChannel 섹션 폭 = 열린 폭(rem × 루트 px)으로 맞춤(기존 단언 변경 0). 전체 vitest 1873 → 1876 예상.
- [x] 2. 예측 커밋 bf32bf9 → RED(예측대로 2 실패·1 통과, 21개) → 수정 7f90b94 GREEN 21/21
  - 수정: `pngCapture.ts` settled = 바닥 > 0 + 가장 넓은 섹션 폭 = 캡처 폭(±1px) · 바닥 > 상한이면 폭 무관(CANVAS_TOO_TALL 유지). 정적 HTML·렌더 문서 0줄 변경.
  - 결정적 관측(L2, `logs/capture-ego.txt` 5회차): rects `[폭 0, 바닥 0] → [폭 0, 바닥 8314] → [1280, 3479]` — 옛 조건이면 8314로 그렸을 보고를 수정본은 건너뛰고 3479로 그림.
- [ ] 3. 마감 게이트: 표적·가드·typecheck·lint·build, 전체 vitest exit0
- [x] 4. PNG 5회 높이 동일 — headless 5/5 · Ego Lite 5/5 모두 1280×3479, SHA 7dab0a8e54e8 (`logs/capture-headless-x1.txt`, `logs/capture-ego.txt`)
- [ ] 5. Codex review --scope branch --base a121f31 (≤2라운드)
- [ ] 6. REPORT.md · 서버 종료(lsof 0)
