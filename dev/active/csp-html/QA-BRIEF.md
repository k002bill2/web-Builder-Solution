# CSP-1 QA BRIEF — static-html 고정 CSP 독립 검증 (QA, 정적·회귀 — 브라우저 금지)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-20. 대상 tip `8775e440`. 근거 `REPORT.md` · `docs/design/csp/CSP-SPEC.md` r1 5a · Ego 로그(`logs/`).

## 검증 (항목마다 QA-REPORT 커밋)
1. fresh typecheck·lint·test(`npx vitest run --maxWorkers=4`)·build · 예산 `/studio` 128.76 · 복원 131.76 · 렌더 JS·CSS 불변 재현.
2. 변이 5종(되돌림): 해시 상수 1글자 · 정책에 `'unsafe-inline'` 추가 · meta 위치를 head 끝으로 · `assertStaticHead`의 중복 meta 검사 제거 · zip 대상에도 meta 삽입. 각각 FAIL로 잡히는지.
3. CSP-AC 판정표 재판독 — 테스트가 실제로 그 AC를 단언하는지, RED 증거(구현 전 22 실패) 기록이 맞는지.
4. Developer Ego 로그 재판독: R1 1280·390 스크린샷 바이트 동일·위반 0 · R5 시트 닫힘 — 로그가 주장과 일치하는지(재실행 금지).
5. zip·React zip 코드 변경 0 확인(`git diff ec32f407 -- app/src/features/studio/zip app/src/features/studio/reactZip`).
## 규칙
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, QA-REPORT 초안 6턴 안, 항목마다 커밋, **18턴이면 판정 확정**. 앱·테스트 코드 커밋 금지, Codex 금지, **git push·pull·fetch 금지**. 마감 전 `git status --short` 빈 값. 최대 24턴.
