# CSP-2 BRIEF R2 — 마감 전용 (Developer)

발주: Jarvis 2026-10-20. 1차 run은 71턴 턴 상한으로 마감 직전 중단. E0·E1 구현·실측·문서 개정은 커밋됨(`80c1dc6d`~`e6e300fb`). **추가 구현 금지.**
남은 미커밋: Codex P2 반영(`app/scripts/zipCssGuard.mjs`·`zipCssGuard.test.mjs`·`check-bundle-size.mjs` 6줄) + `logs/e1-*.txt` 4개.
Jarvis 확인(tip + 미커밋 상태): typecheck 0 · lint 0 · `vitest --maxWorkers=4` 379/3416 · build 0 · `/studio` 128.76 · 복원 131.76 · 렌더 84.30/8.89 · zip CSS 가드 통과 · 리슨 0 · docker 잔존 0.

1. 미커밋 Codex 반영을 검토하고 명시 경로로 커밋(RED 로그 = 가드 파일 없음 → GREEN 2/2). 가드 변이 1회(정규식에서 `data:` 대소문자 무시 제거 등) FAIL 확인 → 되돌림.
2. REPORT에 Codex 절(지적 내용·반영·판정)과 결론 확정 · PROGRESS 전부 체크.
- **git push·pull·fetch 금지.** Codex 재실행 금지. 마감 전 `git status --short` 빈 값. 최대 15턴, 11턴부터 마감.
