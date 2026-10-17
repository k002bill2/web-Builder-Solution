# RS6-L3b QA PROGRESS

대상 tip `0c842581` · base `860d530d` · 착수 2026-10-17

- [ ] 0. QA-BRIEF·QA-PROGRESS 커밋
- [ ] 1. 손실 경로 표(main 대비) — 코드 추적 + 임시 테스트
  - [ ] 디바운스 중 링크 이탈 → lease 해제 save → IDB / 이동 뒤 레지스트리 경고 → 커밋 뒤 꺼짐
  - [ ] 해제 save 실패 뒤 알림·경고 유지·재진입 dirty
  - [ ] POP·재마운트(U7) · 저장 중 + 추가 편집 이탈(U11)
  - [ ] 예외 순서 readonly·unsupported 이동 / failed·offline·stale·cleared 보류 코어 경로 테스트
  - [ ] 편집기 안 새로고침 경고(레지스트리 대체)
- [ ] 2. StudioLeave 14건 표 대조 (서브에이전트 읽기 전용)
- [ ] 3. CP-A 상쇄·coreFixture 판정 (서브에이전트 읽기 전용)
- [ ] 4. 변이 5종 (매번 git checkout -- app/)
- [ ] 5. Ego Lite 실화면 (a)~(e) + 정리
- [ ] 6. fresh 게이트 typecheck·lint·test·build
- [ ] 7. QA-REPORT 작성·커밋
