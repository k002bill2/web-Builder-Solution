# P1D-L1 REPORT — 단조 카운터 + 스냅샷 삭제 판정·저장소 배선

- 브랜치 `k002bill2/p1d-l1` · base `f1f4fe1` · 커밋: BRIEF P0 `6067c61` → 구현 `30b3d9f` → 이 REPORT.
- 결론: **관문 통과 · 범위(P1D-SPEC 7절 L1 행) 구현 · typecheck·lint·build·전체 vitest exit 0.** UI 0 · 프로젝트 삭제 0 · 자동 정리 0.

## 1. 관문 실측 (build 실측 — KB 추정 0)

| 경로 | 판정선 | main(BRIEF) | 이 레인 실측 | 여유 |
|---|---|---|---|---|
| `/studio` 진입 직후 자동 로드 포함 | ≤ 129.65 | 129.62 | **129.64** | 0.01 |
| `/studio` 저장 데이터 복원 진입 | ≤ 132.68 | 132.65 | **132.68** | **0.00** (스크립트 판정 "멈춤 > 132.68" — 통과) |
| `/profile` 첫 화면 | ≤ 100 | 99.87 | **99.87** | 0.13 (진입 직후 120.00 → 119.97) |
| `/projects` 진입 직후 | ≤ 125 | 104.47 | **104.49** | — |
| `/compare` 진입 직후 | ≤ 125 | 122.73 | **122.73** | — |

- 측정: 배선 직후 `npm run build`(exit 0, `/tmp/p1d-l1-gate-build.log`) · 구현 커밋 tip에서 다시 `npm run build`(exit 0) — 같은 수치.
- `/studio` 첫 화면 91.83 → 91.84(studioStore reader 변경). `seqId.ts`는 별도 청크(`seqId-*.js`) — 조작 뒤 3모듈만 import, 진입 판정 수치에 영향 없음(위 실측).
- **주의(L2·L3에 전달)**: 복원 진입 여유 0.00 · `/studio` 0.01 — 진입 closure(`studioStore`·`memoryProjectRepository`·`deferredStudio`)에 더 넣을 자리 없음. L2(SnapshotDialog 조작 뒤)·L3(`/projects` 조작 뒤 청크)는 SPEC대로 진입 몫 0이어야 함.

## 2. 구현 (파일)

| 파일 | 변경 |
|---|---|
| `app/src/data/seqId.ts` (새) | `seqOf(prefix, id)` · `nextSeqId(prefix, ids, deletedMax = 0)` = max(현존 최대, 묘비) + 1 · 숫자 아닌 묘비 = 0 |
| `studioStore.ts` (진입) | `StudioSeq` · `StudioState.seq?` · reader `seq()` · `jobCount` → `jobIds()` · **`nextProfileId` 제거** |
| `memoryBoardConfirm.ts` (조작 뒤) | profile·project id = `nextSeqId(…, tx.seq()?.…)` |
| `memoryGenerate.ts` (조작 뒤) | `newJob(record, reader, …)` 안에서 `job` id 계산 |
| `memoryGenerationRepository.ts` (`/profile` 진입) | `newJob(current, tx, …)` — 식 삭제·인자만 |
| `memoryDocBook.ts` (조작 뒤) | `snapshotSeq` 상태(시드 = 문서 레코드) · 발급 5곳(수동·복원·충돌·내보내기·새로 시작) 단조 · `snapshotSeqOf` · `deleteSnapshot` 판정 |
| `persistence/entryRead.ts` | `DocRecord.snapshotSeq?` — 타입만(진입 바이트 0) |
| `persistence/localSync.ts` (조작 뒤) | `BookView.snapshotSeqOf?` → 문서 레코드에 `snapshotSeq`(0이면 생략 — 기존 레코드 모양 그대로) · `readDoc`·`checkState`에서 `snapshotSeq`·`seq` 정수 검증(아니면 기존 unreadable) |
| `projectRepository.ts` | `deleteSnapshot(projectId, snapshotId): Promise<void>` |
| `memoryProjectRepository.ts` (`/studio`·`/projects` 진입) | `ProjectMethod`·`SnapshotWrite` 유니온 + `deleteSnapshot: write("deleteSnapshot")` 1줄 |

- `deleteSnapshot` 판정 순서: 모양(SCHEMA_INVALID) → 프로젝트·문서 없음(NOT_FOUND) → **없는 id = 변화 0으로 성공**(저장소 `kept`가 flush → localSync가 같은 레코드면 `queue.retry`) → `manual` 아님 = SCHEMA_INVALID → commit → 목록에서 빼고 `snapshotSeq = max(기존, 지운 번호)`.
- `seq`(project·profile·job)는 이 레인에서 **읽기만** — 올리는 쓰기는 L3 프로젝트 삭제 트랜잭션. 진입 상태 → store → localSync `{ ...latest, heads, gen }`로 보존됨을 테스트로 확인.
- 이행: `seq`·`snapshotSeq` 없음 = 0 → 현존 최대 + 1(= 기존 `length + 1`). 이행 쓰기 0 · `SCHEMA_VERSION` 변경 0.

## 3. TDD

- RED 예측은 구현 전에 PROGRESS에 기록. RED 실측(구현 전): `seqId.test.ts` import 실패 · `monotonicIds.test.ts` 4건 RED(`deleteSnapshot is not a function` ×3 · `profile-2 ≠ profile-4`) · 이행 1건 GREEN(회귀 고정 — 예측대로).
  - 하네스 수정 2회(단언 아님): `confirmProfile` 반환 모양(`.result` 없음) · 두 번째 확정은 보드 id를 바꿔야 새 계열(같은 보드 id면 확정 멱등 키가 같아 `profile-1` 재생).
- GREEN: 새 테스트 13건 + `writerLock.test.ts` 추가 2건.
- 추가 2건(낡은 탭 `deleteSnapshot` 쓰기 0 · 커밋 실패 뒤 같은 삭제 재시도 = 변화 0 + flush 재제출로 레코드 반영·`snapshotSeq` 1)은 **구현 뒤 작성** — RED 출발 아님(기존 localSync 경로를 그대로 타는 회귀 고정).
- 기존 테스트 수정: `ProfileGenerateLoad.test.tsx` `store.jobCount()` → `store.jobIds().length` 5곳(같은 값 — 단언 약화 0) · `ProjectsPage.test.tsx` 가짜 저장소에 `deleteSnapshot: unused` 1줄(인터페이스 추가).
- RED 테스트 단독 커밋 0 · amend·rebase 0.

## 4. AC 대응

- AC-D01① 수동 1·2·3 → 2 삭제 → `snapshot-4` ✅ · ② 3 삭제 → `snapshot-4`, 문서 레코드 `snapshotSeq = 3`, 새로고침(새 탭 진입) 뒤에도 `snapshot-4` ✅.
- project·profile·job: 상태 레코드 `seq {3,3,3}` → 새 확정 `project-4`·`profile-4`·새 잡 `job-4`, 다시 쓴 상태 레코드에 `seq` 그대로, 기존 project-1·profile-1·job-1 값 그대로 ✅ · 이행(seq 없음) → `-2` ✅ · `nextSeqId` 가운데 빠짐(1·3 → 4) ✅. (실제 삭제로 `seq`를 올리는 ③④는 L3)
- D08 판정: 없는 id 성공·변화 0 · 자동 = SCHEMA_INVALID · 없는 프로젝트 = NOT_FOUND · 두 번 삭제 멱등 ✅ · IDB 실패 뒤 재시도 ✅.
- 다중 탭 낡은 탭 쓰기 0 유지 ✅ (`deleteSnapshot` → `INFRA: 저장 — 다른 탭에서 바뀐 내용이 있습니다…`, 탭 쓰기 기록 0, 레코드 그대로).
- D09 관문 ✅ (1절).

## 5. 이미지 localId 발급 방식 (3절 image 행 [확인 필요] → 확정)

- `crypto.randomUUID()` — `app/src/components/studio/ImageSlotField.tsx:103` (형식 = `engine/validate/localImageId.ts` UUID v4 소문자). **무작위 → 카운터 불필요**(SPEC 3절 "무작위면 그대로").

## 6. 검증 (fresh, 구현 커밋 기준)

- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm run build` exit 0(번들 가드 통과) · `npx vitest run` exit 0 — **276 files / 2418 tests passed**.
- Ego Lite 생략: UI 변경 0(L1은 저장소·판정·카운터만) — 브라우저로 볼 화면이 없음. E 항목(AC-D01④ 실제 IDB 새로고침)은 L3 프로젝트 삭제와 함께.
- Codex 검증: Jarvis 몫(BRIEF) — 미실행.

## 7. 남은 것 · 메모

- L3가 `seq` 올리는 쓰기(프로젝트 삭제 트랜잭션 — state 레코드 직접 수정) · L2가 자동 정리 시 `snapshotSeq` 상향(정리 헬퍼에서 `seqOf` 재사용 가능).
- `jobCount` reader는 `jobIds`로 바뀜(비테스트 사용처 0 — 1곳이 newJob 이동으로 사라짐).
- 문서(6절 "바뀌는 문서")·ADR 수정 0 — Jarvis 몫.
