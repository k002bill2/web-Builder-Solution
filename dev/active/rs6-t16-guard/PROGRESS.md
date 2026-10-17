# RS6 T16 PROGRESS — 편집기 안 디바운스 중 beforeunload 회귀 테스트

- [x] 0. BRIEF·PROGRESS 커밋 (571e28e7)
- [x] 1. 레지스트리 경고 판정·리스너 코드 확인 (`memoryProjectRepository.ts:148`)
- [x] 2. 테스트 파일 작성 (케이스 1~6 + 2b inflight 단독) — `app/src/components/studio/StudioUnloadGuard.test.tsx`
- [x] 3. GREEN 확인 (5/5)
- [x] 4. 변이 RED: dirty / inflight / 리스너 / (+memory) — logs/, 매번 checkout·복원 확인
- [x] 5. typecheck · lint · 전체 스위트 3회 GREEN(341/3027) · build 1회(129.12 그대로)
- [ ] 6. Codex review 1회 (--scope branch --base af76d10b)
- [ ] 7. REPORT.md 작성 · 커밋
