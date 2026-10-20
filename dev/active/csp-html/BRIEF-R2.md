# CSP-1 BRIEF R2 — 재개 (Developer)

발주: Jarvis 2026-10-20 (영환님 "재개해"). 1차 run은 Claude 구독 세션 한도로 중단(10:36, rate_limit). 정본 `BRIEF.md` 그대로, **남은 일만**.
완료 커밋: `c1c8ba0a`(CSP-AC-07 기준 픽스처) · `6bedabe4`(static-html CSP meta · 메뉴 스크립트 해시 상수 · F-15) · `af6e875c`(EXPORT-SPEC 개정). PROGRESS 체크는 비어 있음 — 첫 턴에 커밋 기준으로 0~5 체크 갱신.

## 남은 일 (순서)
1. RED 증거 확인: CSP-AC-01·03·04·05·06(html)·07(html)·08·10 테스트가 있는지·`6bedabe4^`에서 실패했는지 기록(없는 AC는 추가).
2. fresh typecheck·lint·test·build. **전체 test는 `npx vitest run --maxWorkers=4`**(머신 부하로 시간 초과 flaky 관측).
3. 예산: `/studio` 128.76 · 복원 131.76 증분 0 · 렌더 JS·CSS 불변. 증분 생기면 감량 1회 뒤 멈춤.
4. Ego Lite R1(1280·390 CSP 전·후 스크린샷 바이트 동일·위반 0)·R5(390 메뉴 시트 닫힘) 1회 — preview `--port 4399 --strictPort`, 뷰포트 override는 측정과 같은 스크립트 안. **끝나면 preview 종료 → `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0 기록**(1차는 preview를 남긴 채 중단됨). 8턴 넘게 막히면 BLOCKED 기록 후 다음.
5. Codex adversarial 1회(`--scope branch --base ec32f407`, `--help` 금지)·반영 1회.
6. REPORT 결론 확정 · PROGRESS 전부 체크.
- zip·React zip 코드 금지. **git push·pull·fetch 금지.** 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 45턴, 36턴부터 마감.
