# QA-PROGRESS — M4-a-7 B-M4A-12 독립 검증

대상 tip `ef73f7e3` / base `36e825a6`. 규칙: 브라우저·Codex 금지, 앱·테스트 커밋 금지, 변이는 매번 되돌림.

- [x] 0. QA-BRIEF·QA-PROGRESS 커밋
- [x] 1. fresh typecheck·lint·test·build · 예산 /studio·복원 · StudioLayout assets/infra- 참조 0
- [x] 2. 판별 정확성 + 변이 3종(상수 1글자·판별 제거·INFRA 확대) FAIL 확인
- [x] 3. 거짓 성공 0 · 거짓 사유 0 · 쓰기 탭 회귀 0
- [ ] 4. restartFlow.ts:51 불일치 검토·권고
- [ ] 5. 바뀐 기존 단언 이전/이후 표 — 약화 0
- [ ] 6. 판정 확정 · git status 빈 값
