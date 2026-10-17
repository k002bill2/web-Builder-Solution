# RS8-2 QA PROGRESS — view().reason · /projects 행 첫 표시

대상 tip `d2bc8702` (base `494a7c6f`). 판정 규칙: /projects 잠금 획득 또는 거짓 사유 행 → FAIL.

- [x] 0. QA-BRIEF·QA-PROGRESS 커밋
- [x] 1. 잠금 회귀: 코드 추적 (render·행 판정·watchCores·클릭 전) — locks.request·gate.enter·port.mode 0
- [x] 1b. 잠금 회귀: 스파이 임시 테스트 (작성→실행→되돌림)
- [ ] 1c. 잠금 회귀: 실화면 2탭 navigator.locks.query() held에 /projects writer 0 · 클릭 뒤 획득 구분
- [x] 2. view().reason 수명: 기록·해제 규칙 추적 (saved·discard·rebased·not-persistent·재시도 성공·편집 재개)
- [x] 2b. 변이: 해제 규칙 각각 제거 → FAIL 확인 (매번 되돌림)
- [x] 3. 행 문구·버튼: UX-5 2.3 원문 대조 · stale "다시 저장" 숨김 · 2벌 가드
- [x] 4. 예산 fresh: /studio 128.66 · 복원 131.65 · /projects 99.09/109.54
- [ ] 5. fresh 게이트: typecheck·lint·test(349/3049)·build
- [x] 6. QA-REPORT 초안 커밋 (15턴 이내)
- [ ] 7. preview 종료 · lsof 0 기록 · git status 빈 값 · 최종 커밋
