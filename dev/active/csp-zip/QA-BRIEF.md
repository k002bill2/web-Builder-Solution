# CSP-2 QA BRIEF — 정적 zip·React zip CSP 독립 검증 (QA, 정적·회귀 — 브라우저 금지)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-20. 대상 tip `bf17d779`. 근거 `REPORT.md` · `logs/` · `docs/design/csp/CSP-SPEC.md` r1 5a.

## 검증 (항목마다 QA-REPORT 커밋)
1. fresh typecheck·lint·test(`npx vitest run --maxWorkers=4`, 379/3416)·build · 예산 `/studio` 128.76 · 복원 131.76 · 렌더 84.30/8.89 · zip CSS 가드 통과 재현.
2. 변이 5종(되돌림): `STATIC_CSP_ZIP`에 `data:` 추가 · zip meta 제거 · React zip plugin `apply:"build"` → `"serve"` 삭제(항상) · plugin `injectTo` `head-prepend` → `body` · zipCssGuard에서 `@font-face` 제외 제거. 각각 FAIL로 잡히는지.
3. CSP-AC 판정표 재판독 — AC-02·04·06·07·08·09·11·C1·C2·R3·R4가 실제 단언/로그로 뒷받침되는지.
4. **로그 재판독(재실행 금지)**: `logs/e0-r3-file.txt`·`e0-c1-*.txt`·`e1-c1-docker-build.txt`·`e1-c2-dev.txt` — 양성 대조(해시 밖 스크립트 위반 1·미실행)가 실제로 찍혀 있는지, 위반 0 주장과 일치하는지. static-html R1·R5 재확인 행(B-SEC-08)도.
5. React zip 템플릿 변경이 lock·허용표·RZ-AC 대조 테스트와 어긋나지 않는지(`template.test.ts` 등) · 새 의존성 0.
## 규칙
- 첫 2턴 QA-BRIEF·QA-PROGRESS 커밋, QA-REPORT 초안 6턴 안, 항목마다 커밋, **18턴이면 판정 확정**. 앱·테스트 코드 커밋 금지, Codex·docker·브라우저 금지, **git push·pull·fetch 금지**. 마감 전 `git status --short` 빈 값. 최대 24턴.
