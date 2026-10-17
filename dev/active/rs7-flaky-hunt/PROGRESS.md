# RS7 FLAKY HUNT — PROGRESS

- [ ] BRIEF·PROGRESS 커밋
- [ ] 1. 식별: 전체 스위트 직렬 반복 ≥15회 (logs/runs.txt)
- [ ] 1b. (실패 0이면) shuffle / pool=forks / pool=threads 변형 각 5회
- [ ] 2. 원인: 단독·파일·셔플 재현율, 후보 정적 조사(서브에이전트 읽기 전용 1)
- [ ] 3. 수정 (테스트 쪽만) — 또는 미재현 마감
- [ ] 4. 검증: 수정 후 전체 스위트 15회 연속 GREEN
- [ ] REPORT.md 작성·커밋
- [ ] 마감: git status --short 빈 값
