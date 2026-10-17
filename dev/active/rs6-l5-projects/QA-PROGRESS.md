# RS6-L5 QA PROGRESS

대상 tip `40b50234` · base `aca09805` · QA 착수 2026-10-17

- [x] 0. QA-BRIEF·QA-PROGRESS 커밋 (`de457e37`)
- [x] 1. 손실·거짓 상태 판정 — **FAIL 경로 1건**: U16이 rebase(메모리 쓰기 직후 proof committed) 뒤 flush 실패를 IDB 커밋으로 믿고 기억 해제(restoreSnapshot·resolveConflict 재현, 역사실 확인). 나머지(writer 재쓰기·다른 탭 readonly·시작 다시 시도 dirty·core() 0) PASS. 임시 테스트 삭제
- [x] 2. 변이 — M2 U16 revision·M4a saveAgain reject·M5 idle 재판정·M3b dedupe 2겹 = FAIL(검출). 생존: M1 우선순위(전체 332/2968 통과) · M3 페이지 guard 단독(행 guard가 2겹) · M4b 페이지 catch(전체 통과). 매번 checkout
- [x] 3. 접근성 (R2 R3에서 완료) (성공 포커스 · 실패 포커스 유지 · aria-busy · status/alert · 버튼 0 행 포커스)
- [x] 4. Ego Lite 실화면 (R2 R4에서 완료 · PendingStart BLOCKED) (preview 4382 · 해제 save 실패 행 → 다시 저장 · PendingStart · 1280·390 · 정리)
- [x] 5. fresh 게이트 — typecheck 0 · lint 0 · test 332/2968 · build 0 · /studio 129.09/130.44 · /projects 99.18/109.64 · 기존 테스트 = 라벨 교체 + 새 it 1개(약화 0)
- [x] 6. QA-REPORT 작성 · 커밋 (R2)

## R2 (QA-BRIEF-R2 · tip `f576340c` · FIX1 `0911b900` 재검증) — 2026-10-17
- [x] R0. QA-BRIEF-R2·QA-PROGRESS 커밋
- [x] R1. FIX1 재검증 — PASS: 3경로 기억 유지 · "저장 확인" 재쓰기 → 해제 · 재쓰기 실패 → 유지 · 판독자 U16뿐 · 변이 committed = FAIL 9. 원래 항목: — restoreSnapshot·resolveConflict flush 실패 재현(임시 테스트) · `rebased` 판독 경로 grep(편집기 표시·confirm·discard·`DocBook.start`) · flush 실패 뒤 "저장 확인" → 재쓰기 → 해제(임시 테스트) · 변이 `rebased`→`committed` FAIL
- [x] R2. 1차 생존 변이 — M1(start 하향) 중간 · M3 낮음 · M4b 중간 · 모두 거짓 saved 아님. 원래 항목: 3종(M1 · M3 · M4b) 테스트 공백 심각도 판정(수정 금지)
- [x] R3. 접근성 — PASS(테스트 + 실화면 포커스·역할 · 코어 stuck 포커스는 추정). 원래 항목: (1차 3번)
- [x] R4. Ego Lite 실화면 — 실패 행·readonly alert·다시 저장 성공·IDB 확인(1280·390) · 정리 완료 · 리슨 0. PendingStart 실화면 BLOCKED: readonly 새로 시작은 쓰기 전 거절이라 기억 0 — 주입 없이 만들 경로 없음. 원래 항목: (preview 4383 · writer 잠금 → 해제 save 실패 행 → 다시 저장 · PendingStart · 1280·390 · 정리 · 리슨 0 · 4382 잔존 확인)
- [x] R5. fresh 게이트 — typecheck 0 · lint 0 · 332/2971 · build 0 · 129.09 · 132.07. 원래 항목: (기대 332/2971 · /studio 129.09 · 복원 132.07)
- [x] R6. QA-REPORT 초안(`804e6219`) → 최종 커밋 — 판정 PASS with notes
