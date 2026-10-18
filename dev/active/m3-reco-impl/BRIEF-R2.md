# M3-1 BRIEF R2 — main 병합 · `/catalog` 첫 화면 감량 1회 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 tip `606af16d`. origin/main은 그 뒤 PR #45(`36e825a6`, B-M4A-08 — `/studio` 기준선 128.79 · 복원 131.77)가 들어가 **`app/scripts/m2cBaseline.json`·`bundleBudget.test.mjs`가 충돌**한다.

## 할 일 (항목마다 커밋)
1. `git merge --no-ff origin/main` → 충돌 2파일은 **main 값(128.79·131.77)을 기준으로** 해결. 이 브랜치의 `/studio` 기준선 상향(128.72·131.70)은 버린다. 병합 뒤 fresh build로 `/studio`·복원 정규화 실측 기록. **기준선 파일은 main 값 그대로 두고**, 검사기 허용(+0.03) 안이면 통과로 기록 — 넘으면(> 128.82 · > 131.80) 멈추고 보고. `/studio` 증분 = 병합 실측 − 128.79를 REPORT에 명시.
2. **`/catalog` 첫 화면 감량 1회**(현 100.47, base 100.05, +0.42): REPORT 0절 후보대로 스켈레톤·실패 alert·rec 분기 부속을 rec 청크(RecoView 쪽)로 옮기는 등 **동작 변화 0 수단만**. 목표 **+0.10 이하(≤ 100.15)**. 로드 조건 테스트(`tab=all`에서 rec 청크 안 받음)와 상태 표시 테스트는 그대로 통과해야 한다. 결과를 표(원인별 B)로.
3. fresh typecheck·lint·test·build · 감량이 화면에 영향 없는지 단위로 확인(Ego는 R1에서 함 — 감량이 상태 부품 위치를 바꾸면 Ego Lite 1회 preview `--port 4399 --strictPort`, 5턴 한도).
4. REPORT 0·1절 갱신: 병합 후 수치 · 감량 결과 · 남은 예산 질문(있으면 수치로).

## 규칙
- 쓰기 경로 R1과 같음 + 충돌 2파일. 단언 약화·skip 0. Codex 재실행 금지(R1에서 1회). 명시 경로 커밋, push 0. preview 종료·리슨 0. 마감 전 `git status --short` 빈 값. **최대 40턴, 32턴이면 마감.**
