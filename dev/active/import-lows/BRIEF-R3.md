# IMPORT-LOWS BRIEF R3 — 마감 전용 (Developer)

발주: Jarvis 2026-10-20 (영환님 "1"). R2가 PROGRESS 7·8 직전 중단. 구현·퍼즈·게이트·예산은 끝남 — **코드 추가 구현 금지(Codex 반영만 예외)**.
1. 미커밋 REPORT·PROGRESS 검토 후 커밋.
2. Codex adversarial 1회(`--scope branch --base 2531ebf8`, `--help` 금지) → 지적 반영 1회(TDD, 단언 약화 0). 반영으로 복원 진입이 131.78을 넘으면 반영하지 말고 REPORT에 기록.
3. fresh test·build 1회(반영이 있을 때만) · REPORT 결론 확정 · PROGRESS 7·8 체크.
- **git push·pull·fetch 금지.** 마감 전 `git status --short` 빈 값. 최대 20턴, 15턴부터 마감.
