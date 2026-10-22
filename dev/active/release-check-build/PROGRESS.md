# PROGRESS — release-check-build

- [x] 0. 준비: `npm ci` exit 0 (`logs/npm-ci.txt`) · `.bin/vitest`·`.bin/tsc` 존재 · package-lock 변경 0
- [x] 1. B-SEC-09 ① React zip RZ-AC-C1 행렬 (node 20.19·22 × ci·install × M1·M2 = 8회) — 8/8 exit 0 · CSP meta head 첫 자식 · 인라인 script 0 (`logs/rzc1-*.txt`)
- [x] 2. B-M2B-05e 정적 HTML `--site-t1` 직접 단언 (RED/GREEN) — RED 5 failed(새 단언 1.25rem≠1.333rem) · GREEN 3461 passed (`logs/05e-*.txt`)
- [x] 마감: gates.txt · REPORT.md · docker ps · git status 빈 값 — GATES_EXIT=0 · 128.79·131.79 증분 0 · 이 레인 컨테이너 0
- 주의: RED 되돌림 `git checkout -- app/src`가 미커밋 테스트 추가분도 되돌려 같은 내용으로 다시 넣음(RED 로그는 새 단언 FAIL 포함 — 유효).
