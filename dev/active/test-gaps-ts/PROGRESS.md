# TEST-GAPS-TS PROGRESS

- [x] 0. BRIEF·PROGRESS 커밋
- [x] 1. B-M2B-05c — StudioLayout typeScale useMemo 의존성 테스트 + M4 RED/GREEN (logs/m4-*.txt)
- [x] 2. B-CI-01 — memoryProjectRepository.test.ts 로컬 시계 기대값 + TZ 3종 (logs/tz-*.txt)
- [x] 2b. ci.yml TZ env 제거 · README CI 절 정정
- [x] 3. ADR-008 6절 제출 기록 1줄 + 첫 줄 정정
- [x] 4. BACKLOG B-M2B-05c·B-CI-01 닫힘 표기
- [x] 5. 게이트 (typecheck·lint·vitest·build) → logs/gates.txt · 예산 증분 0
- [x] 6. REPORT.md · git status 빈 값

## 메모
- 1: SnapshotFlow.test.tsx에 테스트 추가(같은 v2 · typeScale 1.2↔1.5 미리보기 진입/종료). M4 RED = 전체 1 failed/3460(새 테스트만). GREEN 3460 passed. 커밋 6ad20f59.
- 2: 311a1b0c · TZ UTC/Seoul/New_York 각 25 passed.
- 3: a615ec06.
- 4: c6bbc139. 5: gates EXIT=0, 예산 128.79·131.79 증분 0. 6: REPORT.md.
