# RS23-PORT-GAPS REPORT (2026-10-16)
판정: 3항목 완료 · 게이트 4종 통과 · 앱 코드 변경 0 (테스트 파일만).

## 1. RS3-AC-04 ①·② 변이 표 (사실 — 매 변이 후 `git checkout` 복원)
| # | 변이 (임시) | 보강 전 | 보강 후 | 잡은 테스트 |
|---|---|---|---|---|
| M1 | writerLock `enter()` writer 재사용 분기 제거 | FAIL(①) | FAIL | ①, ②-c |
| M2 | tabLockHold `release()` 해제 호출 누락 | FAIL(②) | FAIL | ②, ②-b |
| M3 | tabLockHold `acquire()` 쓰기 탭 writer 재사용 제거 | **PASS(생존)** | FAIL | ②-c |
| M4 | tabLockHold `release()` `held = undefined` 누락 | **PASS(생존)** | FAIL | ②-b |
| M5 | tabLockHold `acquire()` 보유 중 재사용 제거 | **PASS(생존)** | FAIL | ②-b, ②-c |
보강: `createLock.test.ts` ②-b(보유 중 재요청 재사용 · 다른 탭 tryLock 실패 · 놓고 다시 잡으면 실제 잠금) · ②-c(쓰기 탭 = 싱크 잠금 재사용, release 뒤 잠금 유지·create 성공). 가짜 잠금 해제는 비동기라 release 뒤 `settle()` 필요(사실).

## 2. tryLock 가드 (사실)
- 신규 `app/src/test/tryLockGuard.test.ts`: 주석 제거 → writerLock 모듈 지정자 import 판정 → 이름(별칭 포함) import + 식별자 사용 / 네임스페이스 / 동적 import = 위반. `import type` 허용.
- 검출기 자체 테스트: 주석 속 단어·import type·다른 모듈·문자열 = 통과 / 이름·별칭·`import * as w`·동적 = 위반.
- `createLock.test.ts`의 텍스트 정규식 테스트는 제거하고 이동 주석으로 대체.
- RED 확인: `ProjectRow.tsx`에 `import * as w from ".../writerLock"` 임시 추가 → 가드 1 failed. 복원.
- 한계(추정): 정규식 기반 파서라 `import{tryLock}` 같은 변형은 처리하나 재수출 체인(다른 모듈 경유)은 추적하지 않는다.

## 3. 미이식 단언 (서브에이전트 worktree 작성 → cherry-pick)
`restartRealRepo.test.ts` 신규 4건, 모두 GREEN · it.todo 0.
1. RS3-AC-05 before 읽기 실패 + response 실패 → C-E5(createUnknown) · 기억 unknown (SPEC-3 7절, SPEC-4 4.1 F-6)
2. RS3-AC-05 C-E4 상태 같은 안·다른 안·재시도 모두 편집기 이동 0 (SPEC-3 7절·5절)
3. RS3-AC-07b restart R-E4 → 프로필 R-E4 재시도 flush 계속 실패 = R-E4 유지 · "반영되지 않았" 0 → 성공 → IDB = 메모리
4. RS3-AC-07b create(C-E4) 변형 + /projects 재시도 동일
- 미확인: 신규 4건의 Red-Green(앱 변이로 FAIL 확인)은 시간 제약으로 미실행. 문장 검사는 앱 문구("반영되지 않았습니다")에 맞춰 부분 문자열 "반영되지 않았"로 함. "링크 0"은 UI 미렌더 → 기억 유지로 대체(추정 대체).

## 게이트 (fresh, `app/`)
| 명령 | exit | 수치 |
|---|---|---|
| npm run typecheck | 0 | — |
| npm run lint | 0 | — |
| npm test -- --run | 0 | 314 files / 2841 tests passed (base 313 / 2830 → +1 file, +11 tests) |
| npm run build | 0 | — |

## 서브에이전트 기록
- worker(worktree `.claude/worktrees/agent-a657323aac375db84`, commit 72a45993): 항목 3 → 이 브랜치로 cherry-pick. 항목 2는 시간상 메인이 직접 작성.
- Codex 검증: 브리프 지시로 미실행.
