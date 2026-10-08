# P1D-L1 Developer 브리프 — 단조 카운터 + 스냅샷 삭제 판정·저장소 배선 (진입 관문 레인)

- 역할 Developer / Orca managed Claude Code / worktree p1d-l1 / base `f1f4fe1`(P1D-SPEC 병합 + ADR-007 개정 3). `app/node_modules` lock 그대로 `npm ci` 완료.
- 정본: `docs/design/persistence/P1D-SPEC.md` **0절 사실 · 3절 단조 카운터 전부 · 4절 번들 관문 · 5절 AC-D01①② · D08(스냅샷 판정 — 없는 id 멱등) · D09 · 7절 L1 행**, `P1D-MQ.md`(D1 A·D2 A 채택), `docs/decisions/ADR-007-local-persistence.md` 개정 3, `dev/active/p1c-d2/REPORT.md`(state `gen`·큐 도장 선례).
- 범위 = 7절 L1 행 그대로: `seqId.ts`(`nextSeqId(prefix, ids, deletedMax)` 순수 함수) · `studioStore` `seq()` reader + `nextProfileId` 제거(→ `memoryBoardConfirm`에서 계산) · project id 새 규칙 · job id 계산을 `memoryGenerate.newJob`로 이동(`memoryGenerationRepository`는 인자만) · `memoryDocBook` snapshot id 새 규칙 + `snapshotSeq` 상태 · `localSync`/`entryRead`(문서 레코드 `snapshotSeq?` 선택 필드 — 타입만, 진입 바이트 0) · `ProjectRepository.deleteSnapshot` 인터페이스 + `memoryProjectRepository` 위임 1줄 + DocBook 삭제 판정 본체(1.1 판정 줄 — 없는 id 멱등, 삭제 시 `snapshotSeq` 상향). **UI 0(L2), 프로젝트 삭제 0(L3), 자동 정리 0(L2).**
- 이미지 localId 발급 방식 1회 grep(3절 image 행 [확인 필요]) → REPORT에 결론.

## 관문 (가장 중요)
- 배선을 넣자마자(구현 초반, **15턴 전**) build로 실측: `/studio` **≤129.65** · 복원 진입 **≤132.68** · `/profile` 첫 화면 **≤100** · `/projects`·`/compare` **≤125**. 현재 main: 129.62 · 132.65 · 99.87 · 104.47 · 122.73.
- 하나라도 넘으면 **멈춤** — 실측 수치 + 진입 파일에서 뺄 수 있는 상쇄 후보 조사(식 단위)를 REPORT에 쓰고 커밋 후 종료(MQ-D2 B 재상신은 Jarvis). 우회(진입 파일을 피하는 비인터페이스 배선) 금지(P1D-MQ D2 기각 사유).
- KB 추정 금지 — 실측만.

## 검증
- TDD(RED 예측 PROGRESS, RED 테스트 tip 커밋 금지, 단언 약화·skip 0, **amend·rebase 금지** — 깨진 커밋은 후속 커밋). AC-D01①②가 RED 출발점: 삭제 뒤 id 재발급 0(project·profile·job·snapshot) · 이행(seq 없음 = 현존 최대+1 = 기존 length+1과 같음) · 새로고침 생존(seq·snapshotSeq 직렬화 왕복) · 다중 탭 낡은 탭 쓰기 0 유지 · 기존 P1a~P1c 회귀 테스트 전부 통과.
- 마감: typecheck·lint·build exit 0 · 전체 vitest 1회 exit 0 · REPORT. Ego Lite 불필요(UI 0 — 생략 사유 REPORT). **Codex는 Jarvis 몫.**

## 금지·운영
- 엔진·PageDoc 계약·docs/**·lock·CLAUDE.md 수정 0, 새 의존성 0, `SCHEMA_VERSION` 변경 0. 서브에이전트 0, push/merge/삭제 0, 승인 실패 우회 금지. main 5480 무접촉.
- **첫 3턴 안에 BRIEF P0 커밋.** 턴 관리: 관문 실측 15턴 전, 구현 커밋 32턴 전, 40턴부터 게이트·REPORT만, REPORT 초안 44턴 전 커밋. 한국어.
