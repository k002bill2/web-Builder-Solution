# RS6-L3b QA PROGRESS

대상 tip `0c842581` · base `860d530d` · 착수 2026-10-17

- [x] 0. QA-BRIEF·QA-PROGRESS 커밋 (`ecdf2c82`)
- [x] 1. 손실 경로 표(main 대비) — 코드 추적 + 임시 테스트 Q1~Q4(실행 뒤 삭제)
  - [x] 디바운스 중 링크 이탈 → lease 해제 save → IDB / 이동 뒤 레지스트리 경고 → 커밋 뒤 꺼짐
  - [x] 해제 save 실패 뒤 경고 유지·재진입 dirty·restart 거절 (편집기 밖 실패 표시 없음 = Medium · L5)
  - [x] POP·재마운트(U7) · 저장 중 + 추가 편집 이탈(U11)
  - [x] 예외 순서 테스트 유무 (unsupported 실포트 → leave() 0 = Low)
  - [x] 편집기 안 새로고침 경고(레지스트리 대체) — Q1 · 실화면 (b)
- [x] 2. StudioLeave 14건 표 대조 (서브에이전트 읽기 전용 — 14행 일치 · 약화 0)
- [x] 3. CP-A 상쇄·coreFixture 판정 (서브에이전트 — 제품 영향 0 · 픽스처 Med 2)
- [x] 4. 변이 5종 — 전부 FAIL(8·5·6·20·1) · 매번 restored-clean
- [x] 5. Ego Lite 실화면 (a)~(e) + 콘솔·네트워크 0 + 정리(IDB [] · finish · listTaskSpaces [] · 4378 리슨 0)
- [x] 6. fresh 게이트 typecheck·lint·test(331/2953)·build(129.03/130.36 · 132.01/133.39)
- [x] 7. QA-REPORT 작성·커밋 — 판정 PASS with notes
