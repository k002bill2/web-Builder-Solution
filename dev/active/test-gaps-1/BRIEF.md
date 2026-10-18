# TEST-GAPS-1 BRIEF — 생존 변이·부분 단언 테스트 공백 일괄 보강 (Developer, 테스트 전용)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18 (자동 진행 — 열린 테스트 공백 BACKLOG 묶음)
base origin/main `5444def5`. 대상(BACKLOG 원문을 먼저 읽고 표로 정리):
- B-RS-08 남은 항목(L5 M1 · L1 U14-b — RS7-C에서 닫히지 않은 것만)
- B-M3-04 로드 조건 정적 포함 단위 가드 · B-SEC-05 작은 헤더 단언 · B-M4B-07 RZ-AC 부분 단언(08·13·17·09·04) · B-M4B-08 GatePanel 형제 0 단언

## 할 일
1. 항목마다: 변이를 먼저 걸어 **테스트가 못 잡는 것을 재현(RED 기록)** → 단언 추가 → 같은 변이 FAIL 확인 → 변이 되돌림 → 커밋. 재현 안 되면(이미 잡힘) 근거만 기록하고 닫기 제안.
2. 앱 코드 변경 0(테스트·픽스처만). 테스트 가능성 때문에 앱 코드 변경이 필요하면 그 항목은 멈추고 REPORT에 기록.
3. fresh typecheck·lint·test·build · 예산 증분 0 확인. REPORT에 항목별 RED/GREEN 표와 BACKLOG 닫기 제안.

## 규칙
- **git push·pull·fetch 등 원격 명령 일절 금지.** Codex 금지. 단언 약화·skip 0. 첫 2턴 BRIEF·PROGRESS 커밋, REPORT 초안 8턴 안, 항목마다 커밋. 마감 전 `git status --short` 빈 값. 최대 55턴, 45턴부터 마감.
