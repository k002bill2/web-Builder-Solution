# M1-UI-03a 보완 — Codex R4 P2 1건 (저장 상태 조기 노출)

- 작성: Jarvis · 2026-09-25 KST · 책임 역할: Developer / 실행 환경: Orca + Claude Code
- 턴 예산 30. 이 파일 범위 외 변경 금지.

## 지적 (Codex R4, `b64ab25` 이후 diff 대상)
`app/src/features/compare/picksSaver.ts:50` — `STALE_BOARD`(보드 미포함)를 받아 `repository.getBoard()`를 기다리는 동안 `save()`가 다시 호출되면 `pending`에 새 선택이 남는다. 재조회가 성공하면 50행이 무조건 `status: "saved"`로 바꾸고, 이어지는 `drain()` 루프는 `savePicks`를 보내기 전에 상태를 `saving`으로 되돌리지 않는다. 그 저장이 진행되는 내내 `saved`가 노출되어 `confirmAvailability()`가 **미저장 선택이 있는데도 확정을 허용**한다(AC-23 위반).

## 할 일
1. **RED**: `picksSaver.test.ts`에 회귀 테스트 — 지연 주입한 저장소로 ① 저장 → `STALE_BOARD`(board 없음) ② `getBoard()` 대기 중 `save()` 재호출 ③ 재조회 성공 직후와 두 번째 `savePicks` 진행 중 상태가 `saving`이고 `confirmAvailability`가 확정 불가인지 확인. 이름에 `AC-23` 포함. 현재 코드에서 실패하는 것을 확인.
2. **GREEN**: 최소 수정 — 최신 보드 반영 시 `pending`이 있으면 `saving` 유지(없을 때만 `saved`). 필요하면 `drain()`이 매 `savePicks` 전에 `saving`을 보장.
3. 검증 4종: `cd app && npm run typecheck && npm run lint && npm test -- --run && npm run build`
4. 커밋 1개(`fix: Codex R4 — …`), `REPORT.md`의 Codex 절에 R4 결과·커밋 해시 추가 후 커밋.
5. Codex 재리뷰는 하지 않는다(Jarvis가 수행).

## 금지
범위 밖 리팩터링, `design/`, push·원격·`main` 커밋, `--dangerously-skip-permissions`
