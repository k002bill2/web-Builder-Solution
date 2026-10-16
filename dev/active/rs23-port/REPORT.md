# RS23-PORT REPORT — rs23-impl 회귀 테스트 5건 main API 이식

결론: 5개 항목 모두 GREEN(RED·todo 0). 앱 코드 변경 0. 게이트 4종 exit 0. 테스트 2812 → 2830(+18).

## 항목별 (파일:행 · 결과)
| # | AC | 파일:행 | 결과 |
|---|---|---|---|
| 1 | RS3-AC-04 ① writer restart 잠금 재요청 0 | app/src/data/persistence/createLock.test.ts:124 | GREEN |
| 1 | RS3-AC-04 ② 비쓰기 탭 파괴 흐름 뒤 create 자기 잠금 거절 0 | createLock.test.ts:138 | GREEN |
| 1 | RS3-AC-04 ③ 쓰기 탭 싱크 멈춤 뒤 create = cleared 사유·쓰기 0 | createLock.test.ts:151 | GREEN |
| 1 | tryLock 직접 호출 0 가드(restartFlow·RestartDialog·CandidatesSection·ProjectRow) | createLock.test.ts:168 | GREEN |
| 2 | RS3-AC-01 다른 탭 보유 → READ_ONLY·쓰기 0 → 해제 뒤 성공 | createLock.test.ts:80 | GREEN |
| 2 | RS3-AC-01 stale(C-E2b) 쓰기 0 | createLock.test.ts:99 | GREEN |
| 2 | RS3-AC-01 unsupported(C-E3 기본 사유) 쓰기 0 | createLock.test.ts:114 | GREEN |
| 2 | RS3-AC-01 cleared(C-E2c) 쓰기 0 | createLock.test.ts:151 (③과 겸함, 원본 구성 동일) | GREEN |
| 3 | RS3-AC-02 다른 탭 writer + IDB 문서 → B=F2 · C=F4 · 잠금 요청 0 · 기억 0 · /projects 링크 유지 | app/src/pages/ProfileRestartOtherTab.test.tsx:66 | GREEN |
| 4 | RS3-AC-05 실저장소 단계 주입 request·commit=C-E3, response·flush=C-E4 | app/src/data/persistence/restartRealRepo.test.ts:86 | GREEN |
| 4 | RS3-AC-05 거짓 양성 0 | restartRealRepo.test.ts:112 | GREEN |
| 4 | RS3-AC-07b 실저장소 IDB 단언 | restartRealRepo.test.ts:124 | GREEN |
| 4 | RS3-AC-10[U] R-E4 → 편집 저장 1회 → IDB=메모리 + '새로 시작 전' 스냅샷 1 | restartRealRepo.test.ts:149 | GREEN |
| 5 | pendingWrites 정적·동적 import 간선 0 (StudioPage·StudioLayout·useDocSave·memoryProjectRepository·CandidatesSection) + 검출기 자체 테스트 | app/src/test/pendingImportGuard.test.ts:31,45 | GREEN |

### main API 대응 (SPEC-4 기준)
- 기억 조회: rs23 `unconfirmedStart`/`remember` → main `pendingOf`(features/pending/pendingWrites). 재시도: `retryUnconfirmed` → `retryPending`(ok:true/false 단언).
- C-E4 모양 `{alert: RESTART_TEXT.createUnconfirmed, retry, held:"unconfirmed", label}` → `toMatchObject`. `CREATE_TEXT`는 main에 없어 `RESTART_TEXT.createUnconfirmed` 사용.
- RS3-AC-05 commit 단계: 원본은 memory 저장소 주입, 이식본은 실저장소 주입.

## 게이트 (app/, CP2 커밋 347d79a9 시점 fresh)
| 명령 | exit | 수치 |
|---|---|---|
| npm run typecheck | 0 | — |
| npm run lint | 0 | — |
| npm test -- --run | 0 | Test Files 313 passed · Tests 2830 passed (base 2812 → +18 = 7+1+4+6) |
| npm run build | 0 | 번들 가드 통과 |
- `git diff origin/main --name-only -- app/` 중 `*.test.ts(x)` 외 파일: 0

## ProjectsPage "알림 영역은 둘" flaky
- 사실: CP3 시점 전체 실행(2818건)에서 1건 실패 — `expected ['프로젝트 알림', null, '저장소 알림'] to deeply equal ['프로젝트 알림','저장소 알림']` (ProjectsPage.test.tsx:123). 같은 파일 단독 실행 19/19 통과, CP4 전체 실행에서는 통과.
- 추정: 전체 병렬 실행 부하에서만 나타나는 타이밍 의존 flaky(aria-label 없는 알림 영역이 잠깐 하나 더 렌더). 수정하지 않음.

## 사실 / 추정 / 미확인
- 사실: 5개 항목 GREEN → main에 빠진 동작은 이 범위에서 발견되지 않음.
- 미확인: Red-Green(앱 동작을 되돌려 FAIL 확인)은 앱 코드 수정 금지·시간 상한으로 미실행 — 회귀 검출력은 미검증. 단 항목 5는 검출기 자체 테스트로 검출 경로를 확인.
- 미이식: RS3-AC-07b 원본 두 번째 케이스(create C-E4 → 편집 quota)와 held 문구(`T.notYet`) 정규식 단언은 시간 제한으로 미이식.
- 미확인: Codex 리뷰 미실행(시간 상한).
- 가드 범위: tryLock 가드는 원본대로 4개 파일. `deleteProject.ts`·`writeImport.ts`는 tryLock 사용하나 대상 외.

## 서브에이전트
- A(항목 1·2, worktree 격리): createLock.test.ts 작성, 7 GREEN → 메인이 복사·재실행·커밋.
- B(항목 3·4, worktree 격리): 2 파일 작성, 5 GREEN → 메인이 복사(cmp 동일 확인)·재실행·커밋.
- 항목 5는 메인 직접.

## 커밋
- e692dacc CP1 · 347d79a9 CP2 · a5f2827f CP3 · (REPORT 커밋은 아래 log 참조)
