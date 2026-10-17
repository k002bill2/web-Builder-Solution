# RS6-L5 FIX1 BRIEF — U16 기억 해제가 rebase 뒤 flush 실패를 커밋으로 믿는 경로 (Developer, 좁은 수정)

책임 역할: Developer / 실행 환경: Orca + Claude Code / 발주: Jarvis 2026-10-17
대상: 이 워크트리 `k002bill2/rs6-l5-projects` (tip `f2d92022`). 근거: `dev/active/rs6-l5-projects/QA-PROGRESS.md` 1번 — **FAIL 경로 1건**(QA run은 접근성·실화면 전에 중단, REPORT 미작성):
> U16이 rebase(메모리 쓰기 직후 proof `committed`) 뒤 flush 실패를 IDB 커밋으로 믿고 기억 해제 — `restoreSnapshot`·`resolveConflict`로 재현, 역사실 확인.
→ 미확인 쓰기(PendingRecord)를 **숨기는** 경로. 머지 차단.

## 범위 (이 수정만)
1. U16 해제 조건이 "IDB에 실제로 커밋된 증명"일 때만 참이 되게 한다. 후보(최소안 선택·근거 기록):
   - (a) rebase가 만든 proof를 `committed`가 아닌 별도 값(예: `rebased`/메모리 전용)으로 두고, 코어 `saved`(포트 commit → `committed` 수신) 또는 `confirm` 성공(재읽기 일치)에서만 `committed`로 올린다.
   - (b) U16 판정에 `verify`(IDB 재읽기) 1회를 넣는다(조작 뒤 청크 · `/projects` 진입 바이트 주의).
   - (c) DocBook 쓰기의 flush 결과를 코어에 전달해 실패 시 proof를 되돌린다.
   - L3a CP0 rebase 의미(revision·savedMark·epoch 맞춤)와 L3b·L1 테스트(rebase 관련)를 깨지 않게. proof 값 추가가 다른 판정(편집기 상태 표시·confirm·discard)에 주는 영향을 표로.
2. RED 먼저(정식 테스트): QA 재현 2경로(`restoreSnapshot`·`resolveConflict` 뒤 flush 실패 → `/projects` 행 기억 유지 · "저장 확인" 노출) + 정상 경로(flush 성공 → 다음 코어 save 커밋 → 기억 해제) GREEN.
3. 예산: `/studio`·복원 진입 증분 0 목표(현재 129.09/132.07, 상한 129.13/132.11). 기준선·`check-bundle-size.mjs` 수정 금지(L4 측정 레인과 충돌 방지). `/studio`가 +0.01 이상 늘면 멈추고 보고.

## 규칙
- TDD(RED 로그 `dev/active/rs6-l5-projects/logs/fix1-*`). 기존 단언 약화·skip 0. 범위 밖 변경 0.
- 쓰기 경로: L5 표 + 이 수정에 필요한 `features/studio/save/{saveCore,coreIo}.ts`·`data/memoryDocBook.ts`만(필요 최소, REPORT에 사유). L4 경로(`SaveStatus`·`ConflictCallout`·`saveStatusText`) 접촉 금지.
- fresh `typecheck`·`lint`·`npm test -- --run`·`build`. REPORT에 "FIX1" 절(선택안·근거·영향 표·테스트·예산). Codex review 1회(`--scope branch --base 40b50234`). 명시 경로 커밋, amend·rebase·push 금지. 브라우저 불필요(재QA가 함).
- 첫 3턴 BRIEF-FIX1·PROGRESS 갱신 커밋. 최대 55턴, 40턴부터 마감. 서브에이전트 불필요.
