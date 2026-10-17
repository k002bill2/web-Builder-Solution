# RS6-L5 QA REPORT — `/projects`·프로필 연결 (1차 QA + R2 FIX1 재검증 통합)

대상: `k002bill2/rs6-l5-projects` · 1차 tip `40b50234` → R2 tip `f576340c`(FIX1 코드 `0911b900`) · QA 2026-10-17
정본: `QA-BRIEF.md`(1차) · `QA-BRIEF-R2.md` · `docs/design/restart/INTEGRATE-6.md` r1 8.1·8.2·12.1·RS6-AC-U11·U16·B2 · `UX-5.md` UX5-AC-08·11

## 0. 판정 — (초안) PASS with notes
- 1차 FAIL 1건(U16: rebase 뒤 IDB flush 실패를 커밋으로 믿고 기억 해제)은 **FIX1로 닫혔다**. 재현 시도 3경로(restoreSnapshot · resolveConflict mine · restart `DocBook.start`) 모두 기억 유지.
- `"rebased"` 추가로 생긴 새 거짓 saved/confirmed 경로 **0** — `proof` 판독자는 U16(`pendingRows.ts:56`) 1곳뿐(grep).
- flush 실패 뒤 "저장 확인" = 쓰기 탭 재쓰기 → 확인 → 기억 해제(임시 테스트로 확인). 재쓰기도 실패하면 alert · 기억 유지.
- notes: 생존 변이 3종의 테스트 공백(2절, 모두 거짓 saved 아님) · restart 경로 FIX1 회귀 테스트 없음 · REPORT 잔여 1~3.
- (작성 중) 실화면 4절 · 게이트 5절은 R2 fresh 결과로 채운다.

## 1. 손실·거짓 상태 표
| # | 경로 | 1차 | R2 | 근거 |
|---|---|---|---|---|
| 1 | U16 — restoreSnapshot 뒤 flush 실패 | **FAIL**(기억 해제) | PASS — 기억 유지 · proof=`rebased` | 커밋 테스트 `ProjectsCoreRows.test.tsx` FIX1 1 · 임시 Q1 |
| 2 | U16 — resolveConflict(mine) 뒤 flush 실패 | **FAIL** | PASS | 커밋 FIX1 2 · 임시 Q3 |
| 3 | U16 — restart(`DocBook.start`) 뒤 flush 실패 | 미확인 | PASS — startDoc reject · IDB rev 1 · 메모리 rev 2 · proof=`rebased` · 기억 유지 | 임시 Q5(커밋 테스트 없음) |
| 4 | flush 실패 뒤 "저장 확인" | — | PASS — verify stale → writer 확인 → 초안 재쓰기(IDB rev 1 → 3) → status "저장을 확인했습니다" · 기억 0 · IDB hash = 코어 receipt hash | 임시 Q2·Q3 |
| 5 | 4번 재쓰기도 실패 | — | PASS — alert "저장하지 못했습니다" · 기억 유지 · 행 = 실패 + "다시 저장"(초안 dirty) · watchCores 재판정 뒤에도 유지 | 임시 Q4 |
| 6 | rebase flush 성공 뒤 "저장 확인" | — | PASS — 재읽기만(쓰기 0) · 기억 0 · 포커스 = 편집기 열기 | 임시 Q6 |
| 7 | head 없는 기록 | PASS | 변화 없음(`pending.head` 조건 그대로) | 코드 `pendingRows.ts:56` |
| 8 | "저장 확인" 쓰기 탭 재쓰기 · 다른 탭 readonly | PASS | 변화 없음 | 1차 기록 |
| 9 | "시작 다시 시도" + 코어 dirty | PASS | 변화 없음 | 1차 기록 |
| 10 | `/projects`가 `repo.core()` 호출 0 | PASS | 변화 없음 | 1차 기록 |

### `"rebased"` 판독 경로 (grep `proof` · 비테스트 소스)
| 판독 | proof 읽음? | 새 거짓 상태 |
|---|---|---|
| U16 `watchCores` | 예 — `=== "committed"` | 없음(rebased = 해제 안 함 · 보수 방향) |
| 코어 save | 아니오(`confirmed.revision`만) | 없음 |
| confirm | 아니오(`verify`에 넘김 · 결과 proof = fresh) | 없음 |
| discard | 아니오(`verify` 근거) | 없음 — flush 실패면 verify 실패 → blocked stale(FIX1 전과 같음) |
| 편집기 표시(`useDocSave`·SaveStatus) | 아니오(doc·dirty·mark만) | 없음 |
| restart `DocBook.start` | 같은 `rebase` | 없음(행 3) |

## 2. 변이 표
| 변이 | 결과 | 심각도(테스트 공백) |
|---|---|---|
| R2: `rebase` proof `rebased` → `committed` | **FAIL 9**(커밋 FIX1 3 + 임시 6) · 복원 | — 검출 |
| M2 U16 revision 조건 제거 | FAIL(1차) | — |
| M4a saveAgain reject 매핑 제거 | FAIL(1차) | — |
| M5 `watchCores` idle 재판정 제거 | FAIL(1차) | — |
| M3b "다시 저장" dedupe 2겹 제거 | FAIL(1차) | — |
| M1 행 우선순위 — 시작 대기(start)를 코어 상태 뒤로 | **생존**(R2 재실행: projects·pages 51 파일 / 562 통과) | **중간(P2)** — 시작 대기 + 코어 dirty/inflight 조합 테스트 0. 회귀 시 라벨 "다시 저장"인데 `retryRow`는 starter 실행(라벨·동작 불일치). 거짓 saved는 CP0 STALE_DOC 가드가 막음(1차 9번) |
| M1' 우선순위 — dirty를 inflight 앞으로 | FAIL(R2 · "저장 중…" 행 테스트) | — 검출 |
| M3 페이지 `state.busy` guard 단독 제거 | 생존(1차) | **낮음** — 행 버튼 `!held.busy`가 같은 행 연타를 막는다. 남는 공백 = 다른 행 동시 재시도(busy가 단일 값이라 먼저 끝난 쪽이 다른 행 busy 표시를 지움). 코어 save는 chain 직렬이라 거짓 saved 아님 |
| M4b 페이지 `.catch` 제거 | 생존(1차) | **중간(P2)** — 청크 로드 실패·`retryRow` reject 테스트 0. 회귀 시 미처리 reject + busy가 풀리지 않아 버튼이 "저장 중…"/aria-busy로 고정. 거짓 성공은 아님 |

## 3. 접근성
(작성 중 — 테스트 근거 + 실화면)

## 4. 실화면 (Ego Lite)
(작성 중)

## 5. 게이트 (R2 fresh)
(작성 중)

## 6. 사실 / 추정 / 미확인
- 사실: 1·2절 수치(명령 출력 `logs/qa-r2-fix1-temp.log` · 임시 테스트 원문 `logs/qa-r2-temp-test-source.log`).
- 추정: M3·M4b 회귀 시 동작은 코드 읽기 기반(1차 생존 확인 + R2 코드 추적, 재실행 안 함).
