# P1D-L1 PROGRESS

- [x] BRIEF P0 커밋
- [x] 정본 읽기(P1D-SPEC 0·3·4·5·D08·D09·7절, MQ, ADR-007 개정3)
- [x] RED 예측 기록 + RED 테스트(AC-D01①②)
- [x] seqId.ts nextSeqId
- [x] studioStore seq() reader + nextProfileId 제거 → memoryBoardConfirm
- [x] project id 새 규칙
- [x] job id → memoryGenerate.newJob
- [x] memoryDocBook snapshot id + snapshotSeq
- [x] localSync/entryRead snapshotSeq? 타입
- [x] ProjectRepository.deleteSnapshot + memoryProjectRepository 위임 + DocBook 판정
- [x] 관문 build 실측(15턴 전)
- [x] 이미지 localId grep 결론
- [x] typecheck·lint·build·vitest exit 0
- [x] REPORT

## RED 예측 (구현 전 기록)
- `seqId.test.ts` 전부 RED — 모듈 `./seqId` 없음(import 실패).
- `monotonicIds.test.ts`
  - 스냅샷 ①② · D08 → RED: `projects.deleteSnapshot is not a function`.
  - seq {3,3,3} 상태 → 새 확정 `project-4`/`profile-4`/`job-4` 기대 → RED: 지금 `length+1`이라 `profile-2`(project-2·job-2).
  - 이행(seq 없음) → 새 확정 `project-2`·`profile-2`·`job-2` → GREEN(지금과 같은 값 — 회귀 고정용).

## 결과
- 관문 통과: /studio 129.64 · 복원 132.68 · /profile 첫 화면 99.87 · /projects 104.49 · /compare 122.73
- 게이트: typecheck·lint·build exit 0 · vitest 276 files / 2420 tests exit 0(최종)
- 서브에이전트 0(BRIEF 금지) · Codex = Jarvis 몫
