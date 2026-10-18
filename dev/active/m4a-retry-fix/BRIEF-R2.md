# M4-a-6 BRIEF R2 — 턴 상한 중단 뒤 마감 (Developer)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
상태(이전 run 61턴 `error_max_turns`로 중단): 커밋 tip `367b0f37`. **미커밋 변경** = Codex r1 P2 반영 시도(`exportFlow.ts`·`exportFlowFails.ts`·`exportFlowChunk.test.ts` — 계수를 요청이 아니라 로드 결과에 붙임) + untracked 로그 5개(`logs/ego-L2.*`·png 2·`red-2.txt`).

## 할 일 (이 순서, 각 항목 끝에 커밋)
1. 미커밋 Codex 반영을 검증: 해당 테스트 RED/GREEN 근거를 `logs/red-2.txt`로 확인 → 전체 test·typecheck·lint 통과면 커밋(로그 포함). 통과 못 하면 되돌리고 REPORT에 사유.
2. **Ego 결과 해석**(`logs/ego-L2.txt`): attempt2에서 새로고침 안내 · `?retry=1` 요청 확인됨. 그런데 attempt3(차단 해제 뒤)이 `?retry=2`와 `staticHtml` 청크를 받고도 60초 뒤 실패 alert로 남았다 — 원인을 코드로 판정하라(생성기 슬롯이 실패 기억? 다른 단계 시간 초과? 테스트 스크립트 차단 해제 누락?). **복구 성공 실화면을 1회 다시 확인**(preview `--port 4397 --strictPort`, 5턴 한도). 복구가 안 되면 거짓 "다시 시도"인지 판정해 REPORT에 명시.
3. **예산 감량 1회**: 현재 `/studio` +0.08(개정 18 몫 0.09 중). 안내 문구·계수 코드가 진입 청크에 붙은 양을 줄여 **+0.03 이하** 목표(동작 변화 0 수단만 — 예: 문구를 조작 뒤 청크로, 계수 객체 단순화). 못 줄이면 실측 그대로 기록(남은 몫 안이면 진행).
4. Codex는 이미 1회 썼다 — 재실행 금지. REPORT 결론·예산 표·Ego 결과·Codex 처리표 갱신.
5. preview 종료 → `lsof -nP -iTCP:4397 -sTCP:LISTEN` 0 · `git status --short` node_modules 외 빈 값.

## 규칙
- 쓰기 경로는 BRIEF(R1)와 같음. 단언 약화·skip 0. 명시 경로 커밋, push 0. **최대 40턴, 32턴이 되면 남은 항목을 미확인으로 적고 마감.**
