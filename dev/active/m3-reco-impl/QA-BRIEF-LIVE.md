# M3-1 QA BRIEF LIVE — 추천 모드 실화면 2차 (QA)

책임 역할: QA / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-18
대상: 이 워크트리 tip `d59455d8`. 계획 `dev/active/m3-reco-impl/QA-LIVE-PLAN.md`(약 21턴 추정). 1차 판정 `QA-REPORT.md` 0절 PASS with notes.

## 범위
- QA-LIVE-PLAN 0 → 0′ → 1(1280 → 390) → 2 순서. preview `--port 4399 --strictPort`. 각 절 끝마다 QA-REPORT 8절(2차) 표 갱신 커밋. 스크린샷은 `dev/active/m3-reco-impl/shots/`.
- 꼭 볼 것: 카드 3 + "2개 더 보기" · 근거 3개 펼치기 · 화면 status 1·alert 1(RQ-09) · 적용 대화상자 차이 목록 → 적용(저장 확인 뒤 성공) → `/compare` 초안 반영 → 뒤로 → 되돌리기 · 승인 전 변경 0(보드·트레이 필 개수 그대로) · `tab=all` 진입에서 rec 청크 요청 0(네트워크 목록) · 390 가로 넘침 0 · 포커스 이동.
- 실패 재현이 길어지면(+5턴 넘음) 해당 행만 BLOCKED로 적고 다음으로.

## 판정·규칙
- 2차 판정 + **종합 판정**(1차 + 2차) 1줄을 QA-REPORT 첫머리에. FAIL = 거짓 성공 · 승인 전 변경 · status/alert 중복 · 데이터 손실.
- 첫 2턴 QA-BRIEF-LIVE·QA-PROGRESS 커밋. 절마다 커밋. **45턴이면 남은 행 미확인으로 적고 판정 확정·마감.**
- 마지막 커밋 직전 preview 종료 → `lsof -nP -iTCP:4399 -sTCP:LISTEN` 0 기록 · IDB 삭제·`finish({keep:[]})`. 앱·테스트 수정 커밋 금지, Codex 금지, push 금지. 마감 전 `git status --short` 빈 값. 최대 55턴.
