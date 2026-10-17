# RS6-L5 QA PROGRESS

대상 tip `40b50234` · base `aca09805` · QA 착수 2026-10-17

- [x] 0. QA-BRIEF·QA-PROGRESS 커밋 (`de457e37`)
- [x] 1. 손실·거짓 상태 판정 — **FAIL 경로 1건**: U16이 rebase(메모리 쓰기 직후 proof committed) 뒤 flush 실패를 IDB 커밋으로 믿고 기억 해제(restoreSnapshot·resolveConflict 재현, 역사실 확인). 나머지(writer 재쓰기·다른 탭 readonly·시작 다시 시도 dirty·core() 0) PASS. 임시 테스트 삭제
- [x] 2. 변이 — M2 U16 revision·M4a saveAgain reject·M5 idle 재판정·M3b dedupe 2겹 = FAIL(검출). 생존: M1 우선순위(전체 332/2968 통과) · M3 페이지 guard 단독(행 guard가 2겹) · M4b 페이지 catch(전체 통과). 매번 checkout
- [ ] 3. 접근성 (성공 포커스 · 실패 포커스 유지 · aria-busy · status/alert · 버튼 0 행 포커스)
- [ ] 4. Ego Lite 실화면 (preview 4382 · 해제 save 실패 행 → 다시 저장 · PendingStart · 1280·390 · 정리)
- [x] 5. fresh 게이트 — typecheck 0 · lint 0 · test 332/2968 · build 0 · /studio 129.09/130.44 · /projects 99.18/109.64 · 기존 테스트 = 라벨 교체 + 새 it 1개(약화 0)
- [ ] 6. QA-REPORT 작성 · 커밋
