# RS23-PORT QA-REPORT — 이식 테스트 독립 검증

대상: 브랜치 `k002bill2/rs23-reconcile` HEAD `4e5d7518` (base `origin/main`) · 검증일 2026-10-16 · 역할 QA

## 0. 판정: **PASS with notes**

- 변이 8건 모두 대상 테스트가 FAIL → 검출함. 매번 `git checkout -- src` 뒤 `git status --porcelain -- src` = 0건.
- diff 범위 = 새 테스트 파일 4개 추가뿐(삭제·완화 0).
- 전체 fresh 실행: 313 files / 2830 tests passed, exit 0. 실행 뒤 app/ 변경 0.
- notes(아래 5절): RS3-AC-04 ①·②는 이번 변이 세트로 검출력 미검증 · tryLock 가드는 텍스트 정규식이라 주석에도 반응 · 일부 SPEC 단언은 미이식.

## 1. 변이 표

기준(변이 전): 대상 4파일 `npx vitest run <4 files>` → 4 files / 18 tests passed.

| # | 변경 내용 (임시) | 실패한 테스트 | 결과 | 되돌림 |
|---|---|---|---|---|
| M1a | `memoryProjectRepository.ts:122` 가드 조건 `(mode === "restart" \|\| !docs.docOf(projectId))` → `true` (무조건 가드) | `ProfileRestartOtherTab.test.tsx` › RS3-AC-02 "IDB에 B안 문서 + 다른 탭 잠금 → … 잠금 요청 0 …" (1 failed / 17 passed) | 검출 | 0건 |
| M1b | 같은 조건 → `false` (가드 없음) | `createLock.test.ts` › RS3-AC-01 "다른 탭이 잠금 보유 …" · "보유 탭이 저장(세대 +1)한 뒤 풀면 …" · "Web Locks 없음(unsupported) …" · RS3-AC-04 "③ 쓰기 탭 파괴 흐름 실패(싱크 멈춤) 뒤 create …" (4 failed) | 검출 | 0건 |
| M1c | 같은 조건 → `(mode === "restart")` (create 미가드 = 수정 전 동작) | M1b와 같은 4건 | 검출 | 0건 |
| M2a | `features/profile/restartFlow.ts`에 `import { tryLock } from "../../data/persistence/writerLock"; export const lockProbe = tryLock;` 추가 | `createLock.test.ts` › "프로필·/projects 흐름 코드에서 tryLock 직접 호출 0 …" | 검출 | 0건 |
| M2b | `components/projects/ProjectRow.tsx` 맨 앞에 같은 2줄 추가 | 같은 tryLock 가드 테스트 | 검출 | 0건 |
| M3a | `pages/StudioPage.tsx`에 `export const loadPending = () => import("../features/pending/pendingWrites");` 추가 | `pendingImportGuard.test.ts` › "pages/StudioPage.tsx → pendingWrites 정적·동적 간선 0" | 검출 | 0건 |
| M3b | `features/studio/useDocSave.ts`에 `export const loadPending = () => import("../pending/pendingWrites");` 추가 | `pendingImportGuard.test.ts` › "features/studio/useDocSave.ts → … 간선 0" | 검출 | 0건 |
| M4 | `restartFlow.ts:96` C-E3/C-E4 분기 뒤바꿈: `origin.kind === "absent" && now.doc ? "unconfirmed"` → `&& !now.doc ?` | `restartRealRepo.test.ts` › RS3-AC-05 "request = C-E3(기억 0) · commit = C-E3(문서 0) · response = C-E4(IDB 0) · flush INFRA = C-E4(IDB 0)" | 검출 | 0건 |

비고: M4에서 "거짓 양성 0" 테스트는 통과 유지 — origin이 `doc`이라 뒤바꾼 분기(`absent`)를 지나지 않으므로 정상(F-9 경로).

## 2. SPEC 일치 표본 검토 (SPEC-3 7절 · SPEC-4)

| 테스트 | 단언 | SPEC 근거 | 판정 |
|---|---|---|---|
| RS3-AC-01 (createLock:80·99·114) | 다른 탭 보유 = `READ_ONLY_TAB` · stale = `STALE_TAB` · unsupported = `INFRA: 저장 — ` 기본 사유 · 메모리/목록/IDB 문서 0 · 해제 뒤 성공 + IDB 문서 1 | SPEC-3 7절 RS3-AC-01 · SPEC-4 범위 "create 커밋 전 잠금 확인(SPEC-3 3절 4 유지)" | 일치 |
| RS3-AC-02 (ProfileRestartOtherTab:66) | 저장 문서 + 다른 탭 writer → B = `go`(F2) · C = `open`(F4) · 잠금 요청 0 · `pendingOf` 없음 · `hasDoc` true | SPEC-3 RS3-AC-02 "가드 호출 0 · C-E4 분류 0 · 기억 등록 0 · 링크 유지" | 일치 |
| RS3-AC-05 (restartRealRepo:86·112) | request·commit = C-E3 · response·flush = C-E4 · 기억 = `PendingStart{mode:create, held:unconfirmed}` · 거짓 양성 = C-E3 · 기억 0 | SPEC-3 RS3-AC-05 · SPEC-4 F-9(origin doc 최초 create = 커밋 0) | 일치 |
| RS3-AC-07b (restartRealRepo:124) | R-E4 → 편집 quota → `retryPending` 실패 = 기억 유지 → 성공 = IDB = 메모리 · 기억 삭제 | SPEC-3 RS3-AC-07b · SPEC-4 F-10(R-E4 미확인 유지) · 해제 = resolve | 일치 |
| RS3-AC-10[U] (restartRealRepo:149) | R-E4 뒤 편집 저장 1회 → IDB = 메모리 · `reason:"restart"` 스냅샷 1 | SPEC-3 RS3-AC-10 | 일치 |

SPEC-4가 대체한 규칙을 옛 SPEC-3 기대값으로 고정했는지: **발견 0**.
- 기억 API는 SPEC-4(RS4-D6) `Pending` 판별 유니온 · `pendingOf`/`retryPending`으로 단언 — 옛 `RestartOpen` 모양 단언 없음.
- RS4-D5(요청 전 그대로 + origin doc → `PendingRecord`)·RS4-D1(재시도는 origin 비교)과 충돌하는 "기억 삭제" 단언 없음. 이 경로들은 이번 4파일 범위 밖(단언 자체가 없음).

## 3. diff 범위

`git diff --name-status origin/main -- app/`:
```
A app/src/data/persistence/createLock.test.ts
A app/src/data/persistence/restartRealRepo.test.ts
A app/src/pages/ProfileRestartOtherTab.test.tsx
A app/src/test/pendingImportGuard.test.ts
```
`--stat`: 4 files changed, 470 insertions(+), 0 deletions. 기존 테스트 삭제·완화 0.

## 4. 명령 · exit · 수치

| 명령 (cwd) | exit | 수치 |
|---|---|---|
| `npx vitest run <대상 4파일>` (app/, 변이 전) | 0 | 4 files / 18 tests passed |
| 변이별 `npx vitest run <대상 4파일>` (8회) | ≠0 | 표 1 참조 |
| 변이별 `git checkout -- src` + `git status --porcelain -- src` | 0 | 매번 0건 |
| `npm test -- --run` (app/, 최종 fresh) | 0 | Test Files 313 passed · Tests 2830 passed |
| `git status --porcelain` (최종) | 0 | `?? dev/active/rs23-port/QA-BRIEF.md`만 — app/ 변경 0 |

변이 스크립트: `/tmp/rs23qa_mut.sh` (perl 치환 → vitest → `git checkout -- src`). 저장소 밖 임시 파일.

## 5. 사실 / 추정 / 미확인

- 사실: 브리프의 변이 4종(세분 8건) 모두 검출. REPORT의 "Red-Green 미실행" 공백은 이 범위에서 메워짐.
- 사실: 최종 2830 passed — REPORT 수치와 같음. 이번 실행에서 ProjectsPage flaky는 재현되지 않음.
- 미확인(note 1): RS3-AC-04 ①(restart 잠금 재요청 0)·②(자기 잠금 거절 0)는 가드 조건 변이로는 FAIL하지 않음 — 잠금 재요청·tabLockHold 동작을 깨는 변이가 브리프 범위에 없어 검출력 미검증.
- 사실(note 2): tryLock 가드는 원본 텍스트에 `/tryLock/` 정규식 — 주석 속 단어에도 FAIL(거짓 양성 가능), 별칭 import(`import * as w` 후 `w["try"+"Lock"]`)는 놓침. 범위도 4파일(REPORT에 기재).
- 미확인(note 3): SPEC 단언 중 미이식 — RS3-AC-05 "before 읽기 실패 → C-E5"·"C-E4 상태 편집기 이동 0", RS3-AC-07b 프로필 R-E4 재시도 경로·create(C-E4) 변형·"반영되지 않았다" 문장 0, RS3-AC-02 기존 단언은 main `restartLock.test.ts:136-142`에 그대로 있음(확인 · 이번 4파일 범위 밖). REPORT의 "미이식" 항목과 같은 계열.
- 추정: M4 외 다른 분기(`unknown`·F-9)를 뒤바꾸는 변이도 RS3-AC-05 거짓 양성 테스트가 일부 잡을 것 — 미실행.
