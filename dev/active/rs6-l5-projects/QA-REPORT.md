# RS6-L5 QA REPORT — `/projects`·프로필 연결 (1차 QA + R2 FIX1 재검증 통합)

대상: `k002bill2/rs6-l5-projects` · 1차 tip `40b50234` → R2 tip `f576340c`(FIX1 코드 `0911b900`) · QA 2026-10-17
정본: `QA-BRIEF.md`(1차) · `QA-BRIEF-R2.md` · `docs/design/restart/INTEGRATE-6.md` r1 8.1·8.2·12.1·RS6-AC-U11·U16·B2 · `UX-5.md` UX5-AC-08·11

## 0. 판정 — PASS with notes
- 1차 FAIL 1건(U16: rebase 뒤 IDB flush 실패를 커밋으로 믿고 기억 해제)은 **FIX1로 닫혔다**. 재현 시도 3경로(restoreSnapshot · resolveConflict mine · restart `DocBook.start`) 모두 기억 유지.
- `"rebased"` 추가로 생긴 새 거짓 saved/confirmed 경로 **0** — `proof` 판독자는 U16(`pendingRows.ts:56`) 1곳뿐(grep).
- flush 실패 뒤 "저장 확인" = 쓰기 탭 재쓰기 → 확인 → 기억 해제(임시 테스트로 확인). 재쓰기도 실패하면 alert · 기억 유지.
- REPORT 잔여 3(`retryRow` 폴백 "다시 저장했습니다") 판정 = **notes(FAIL 아님) · 추정(코드 근거)**: 폴백은 클릭 시점엔 행에 버튼이 있었는데(onRetry 가드 = `describeRow` label 필수) 청크 로드 사이 기억·dirty가 모두 사라진 경합에서만 탄다. 기억 해제(`settle(..., undefined, …)`) 호출은 전부 `"confirmed"`(확인 뒤) 또는 `not-applied-absent`(restartFlow:121)이고(grep 8곳), 코어 clean 전환(`savedMark` 전진)은 commit 성공(coreIo:48)·verify 뒤 discard(:101)·memory 모드(:36)·`rebase`(:147)뿐이다. `rebase`는 편집기 안 복원·충돌 해결·새로 시작에서만 불려 `/projects` 화면 위 경합으로는 도달 경로를 찾지 못했다. 문구가 부정확(저장 0인데 "다시 저장했습니다")한 것은 그대로 note.
- 범위 밖 관측(미확인): 기억이 **없는** 프로젝트에서 rebase flush가 실패하면 코어는 clean(`rebase`가 savedMark 전진)이라 `/projects` 행은 일반 행이다. 편집기 쪽 reject 처리가 기억을 남기는지는 이번에 확인하지 않았다(FIX1 변경과 무관 — FIX1 전에도 같음).
- notes: 생존 변이 3종의 테스트 공백(2절, 모두 거짓 saved 아님) · restart 경로 FIX1 회귀 테스트 없음 · REPORT 잔여 1~3.
- 실화면: 실제 `navigator.locks` 잠금으로 해제 save 실패 행 → readonly alert → 잠금 해제 뒤 "다시 저장" 성공 · IDB 마지막 편집 확인(1280·390). PendingStart 실화면 = BLOCKED(4절).
- 게이트 fresh: typecheck 0 · lint 0 · 332/2971 · build 0 · `/studio` 129.09 · 복원 132.07(기대값 그대로).

## 1. 손실·거짓 상태 표
| # | 경로 | 1차 | R2 | 근거 |
|---|---|---|---|---|
| 1 | U16 — restoreSnapshot 뒤 flush 실패 | **FAIL**(기억 해제) | PASS — 기억 유지 · proof=`rebased` | 커밋 테스트 `ProjectsCoreRows.test.tsx` FIX1 1 · 임시 Q1 |
| 2 | U16 — resolveConflict(mine) 뒤 flush 실패 | **FAIL** | PASS | 커밋 FIX1 2 · 임시 Q3 |
| 3 | U16 — restart(`DocBook.start`) 뒤 flush 실패 | 미확인 | PASS — startDoc reject · IDB rev 1 · 메모리 rev 2 · proof=`rebased` · 기억 유지 | 임시 Q5(커밋 테스트 없음) |
| 4 | flush 실패 뒤 "저장 확인" | — | PASS — verify stale → writer 확인 → 초안 재쓰기(IDB rev 1 → 3) → status "저장을 확인했습니다" · 기억 0 · IDB hash = 코어 receipt hash · 재쓰기 뒤 메모리(`getDoc`) rev·hash = IDB rev·hash | 임시 Q2(+정합 단언 1회)·Q3 |
| 5 | 4번 재쓰기도 실패 | — | PASS — alert "저장하지 못했습니다" · 기억 유지 · 행 = 실패 + "다시 저장"(초안 dirty) · watchCores 재판정 뒤에도 유지 | 임시 Q4 |
| 6 | rebase flush 성공 뒤 "저장 확인" | — | PASS — 재읽기만(쓰기 0) · 기억 0 · 포커스 = 편집기 열기 | 임시 Q6 |
| 7 | head 없는 기록 | PASS | 변화 없음(`pending.head` 조건 그대로) | 코드 `pendingRows.ts:56` |
| 8 | "저장 확인" 쓰기 탭 재쓰기 · 다른 탭 readonly | PASS | 변화 없음 | 1차 기록 |
| 9 | "시작 다시 시도" + 코어 dirty | PASS | 변화 없음 | 1차 기록 |
| 10 | `/projects`가 `repo.core()` 호출 0 | PASS | 변화 없음 | 1차 기록 |

- revision 1 → 3 건너뜀은 설계대로다: 메모리 rebase가 rev 2를 쓰고, 다음 커밋 = `confirmed.revision + 1`(L3a CP0 "같은 revision 덮어쓰기 0"). 불필요한 revision 증가가 아니다(IDB에 rev 2는 없다 — 쓰기 1회).

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
| 항목 | 결과 | 근거 |
|---|---|---|
| 성공 포커스 = 편집기 열기(UX5-AC-08) | PASS | 테스트 `ProjectsCoreRows.test.tsx:62·139` · `ProjectsPending.test.tsx:73·161` · **실화면**: "다시 저장" 성공 뒤 `document.activeElement` = "모던 카페 브랜드 프로젝트 편집기 열기" |
| 실패 포커스 유지 | PASS | 테스트 `ProjectsCoreRows.test.tsx:78` · `ProjectsPending.test.tsx:108` · **실화면**: readonly 실패 뒤 포커스 = "… 다시 저장" 버튼 |
| `aria-busy` | PASS | 진행 중 `aria-busy=true` = `ProjectsPending.test.tsx:87`(시작 다시 시도) · 결과 뒤 해제 = `ProjectsCoreRows.test.tsx:79·95`. 코어 "다시 저장" 진행 중 aria-busy는 같은 `ProjectRow` 속성(`ProjectRow.tsx:74`)이라 공유 — 코어 행 전용 테스트는 없음(추정 = 동일 동작) |
| status / alert 역할 | PASS | 성공 = `role=status`, 실패 = `role=alert`(`ProjectRow.tsx:110`) · 실화면: alert "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다" · status "다시 저장했습니다" |
| 버튼 0 행(stuck) 포커스 유실 0 | PASS(테스트) | 기억 행 stuck → 폐기 버튼 `ProjectsPending.test.tsx:206` · memory → 결과 알림 `:214`. **코어 행** stuck(다시 저장 → stale·cleared로 버튼 숨김) 포커스는 테스트 없음 — 같은 `focusFor` 경로(`ProjectsPage.tsx` pick 순서)라 **추정** PASS |
| 390 폭 | PASS | 실화면 `scrollWidth` = `clientWidth` = 390(가로 넘침 0) · `qa-shots/r2-390-retry-readonly.png` |

## 4. 실화면 (Ego Lite)
환경: `vite preview --port 4383 --strictPort`(fresh build) · Ego Lite space 20 · 앱 안 클릭으로만 이동(새로고침 0 — 메모리 store 함정).
| 단계 | 관측 | 근거 |
|---|---|---|
| 탭 A(p1): 카탈로그 → 비교(모던 카페·로컬 베이커리) → 프로필 v1 확정 → 3안 → A안 편집 시작 | `navigator.locks.query()` held = `design-studio-writer` exclusive 1개(탭 A) | 명령 출력 |
| 탭 B(p2): `/projects` 새로 진입 → 편집기 열기 → 제목 "B탭 마지막 편집" 입력 → "프로젝트로 돌아가기" | 편집기 "저장하지 못했습니다" · 행 = "저장하지 못했습니다" + "다시 저장" + "편집기 열기" | `qa-shots/r2-1280-failed-row-locked.png` |
| 잠금 유지 중 "다시 저장" | `role=alert` "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다" · 포커스 = 다시 저장 버튼 · 거짓 saved 0. **1차 REPORT 미확인("다른 탭 잠금이 실화면 행 문구로 나오는지") 해소** | `r2-1280-retry-readonly.png` · `r2-390-retry-readonly.png` |
| 탭 A 닫기 → held 0 → "다시 저장" | `role=status` "다시 저장했습니다" · 일반 행 · 포커스 = 편집기 열기 · held = 탭 B · IDB `design-studio/docs/project-1` = rev 2 · 제목 "B탭 마지막 편집" | `r2-1280-retry-success.png` · 명령 출력 |
| PendingStart 행 | **BLOCKED** — 탭 C(p3, readonly)에서 "B안으로 새로 시작" → 잠금 확인 단계에서 거절("다른 탭에서 편집 중이라 새로 시작하지 않았습니다") → 쓰기 0 → 기억 0 → `/projects` 행 = 일반(정상 동작). (사실) 쓰기 전 거절이라 기억 0. (추정) PendingStart는 쓰기 뒤 결과 미확인(flush 실패 등)일 때 생기므로 주입 없이 실화면에서 만들 경로를 찾지 못했다. 단위 테스트(`ProjectsPending.test.tsx` CP2)로만 확인 | 명령 출력 |
| 정리 | `Storage.clearDataForOrigin(http://localhost:4383, indexeddb·local_storage·cache_storage·service_workers)` → `indexedDB.databases()` = [] · `finish({keep:[]})` · `listTaskSpaces()` = space 19 `rs6-l5-qa`(ownership user — 1차 run 잔여, 사용자 소유라 미접촉)만 · preview kill → 438x·5480 리슨 0 · 5480 무접촉 | 명령 출력 |
- R2 시작 시점(2턴) 438x·5480 리슨 = 0 — 1차 run의 4382 잔존은 이미 없었다(사실).
- preview는 1회 백그라운드 기본 시한(10분)으로 끊겨 같은 포트로 재기동했다(관측 영향 0 — 탭 상태는 브라우저에 있음).

## 5. 게이트 (R2 fresh · tip `f576340c` + 문서 커밋만)
| 게이트 | 결과 | 로그(로컬 · gitignore) |
|---|---|---|
| `npm run typecheck` | exit 0 | `logs/qa-r2-typecheck.log` |
| `npm run lint` | exit 0 | `logs/qa-r2-lint.log` |
| `npm test -- --run` | 332 파일 / 2971 통과(기대 그대로) | `logs/qa-r2-test.log` |
| `npm run build` | exit 0 · `/studio` 정규화 129.09(기준선 129.09) · 복원 132.07(기준선 132.07) · `/projects` 99.19 / 109.64 | `logs/qa-r2-build.log` |
- 임시 테스트(`QaR2.tmp.test.tsx`)는 게이트 전에 삭제했다. 변이는 매번 `git checkout --` 로 되돌렸고 `git status` 앱 변경 0을 확인했다.

## 6. 사실 / 추정 / 미확인
- 사실: 1·2절 수치(명령 출력 `logs/qa-r2-fix1-temp.log` · 임시 테스트 원문 `logs/qa-r2-temp-test-source.log`).
- 사실: 4절 실화면 관측(명령 출력·스크린샷) · 5절 게이트 수치.
- 추정: M3·M4b 회귀 시 동작은 코드 읽기 기반(1차 생존 확인 + R2 코드 추적, 재실행 안 함). 코어 행 stuck 포커스·코어 "다시 저장" aria-busy는 공유 코드 경로 근거.
- 미확인/BLOCKED: PendingStart 실화면(4절) · 실제 quota 실패의 실화면.

## 7. 권고(수정 아님 — 다음 레인 후보)
1. M1 공백: 시작 대기 + 코어 dirty 조합 행 테스트 1개(라벨 = "시작 다시 시도", 클릭 = starter).
2. M4b 공백: `pendingRetry` 청크 로드 실패 → 실패 결과·busy 해제 테스트 1개.
3. FIX1 restart 경로(`DocBook.start` flush 실패 → 기억 유지) 회귀 테스트 1개 — 지금은 같은 `rebase` 줄이라 FIX1 테스트가 간접 보호.
4. REPORT 잔여 1~3(첫 실패 문구 · image-missing 뒤 다시 저장 · `retryRow` 폴백 성공 문구)은 그대로 열려 있다.

## 8. 예산
- 브리프 상한 55턴을 넘겼다(약 70턴). 실화면용 프로젝트를 새 origin(4383)에서 앱 흐름(카탈로그 → 비교 → 확정 → 3안 → 편집 시작)으로 만드느라 선택자 재시도가 많았다.

## 9. 서브에이전트
- R2: 0개(단일 레인 · 순차 의존 — 실화면은 탭 순서 의존).
