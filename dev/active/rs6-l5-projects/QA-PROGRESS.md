# RS6-L5 QA PROGRESS

대상 tip `40b50234` · base `aca09805` · QA 착수 2026-10-17

- [ ] 0. QA-BRIEF·QA-PROGRESS 커밋
- [ ] 1. 손실·거짓 상태 판정 (U16 해제 · 저장 확인 writer · 시작 다시 시도 dirty · core() 미호출)
- [ ] 2. 변이 5종 (우선순위 · U16 revision · 연타 dedupe · reject 매핑 · watchCores idle) — 매번 `git checkout -- app/`
- [ ] 3. 접근성 (성공 포커스 · 실패 포커스 유지 · aria-busy · status/alert · 버튼 0 행 포커스)
- [ ] 4. Ego Lite 실화면 (preview 4382 · 해제 save 실패 행 → 다시 저장 · PendingStart · 1280·390 · 정리)
- [ ] 5. fresh 게이트 (typecheck · lint · test 332/2968 · build 크기) · 기존 테스트 수정 점검
- [ ] 6. QA-REPORT 작성 · 커밋
