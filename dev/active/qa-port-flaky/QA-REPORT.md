# QA-REPORT — rs23-port-gaps(A) · flaky-projects-alerts(B) 독립 검증 (2026-10-17)

대상: `k002bill2/qa-port-flaky` = main `3454702f` + A 병합 `0fa484b7` + B 병합 `5163af0b`. 모든 변이는 임시, 매번 `git checkout -- src`로 복원.

## 0. 판정
| 대상 | 판정 | 요지 |
|---|---|---|
| A rs23-port-gaps | **PASS with notes** | 변이 M3·M4·M5 전부 FAIL 재현, 가드 별칭·네임스페이스 FAIL / 주석 PASS. 테스트 파일만 변경, 기존 단언 완화 0. 노트: 텍스트 정규식 테스트 → import 가드로 대체되며 검사 범위가 "writerLock 직접 import"로 좁아짐(재수출 경유 미검출, REPORT 자인) · 신규 restartRealRepo 4건 Red-Green 미실행(REPORT 자인, 이번 QA 범위 밖) |
| B flaky-projects-alerts | **PASS with notes** | 회귀 테스트 수정 전 RED / 수정 후 GREEN. import 실패 시 빈 상태·저장소 영역 렌더 확인. 로딩 미종료 경로에서 빈 화면 회귀 없음. 노트: import 실패 분기(`pendingRows.failed`)를 지키는 커밋된 테스트가 없음(임시 테스트로만 확인) |

## 1. 변이 표 (사실)
| # | 변이 (임시) | 실행 | 결과 |
|---|---|---|---|
| base | 없음 | `npx vitest run src/data/persistence/createLock.test.ts` | 8 passed |
| M3 | `tabLockHold.ts:44` 쓰기 탭 writer 재사용 줄 제거 | 동일 | 1 failed (②-c) — REPORT 일치 |
| M4 | `tabLockHold.ts:54` `hold.held = undefined` 제거 | 동일 | 1 failed (②-b) — REPORT 일치 |
| M5 | `tabLockHold.ts:45` `!hold.held && locks` → `locks` | 동일 | 2 failed (②-b, ②-c) — REPORT 일치 |
| base | 없음 | `npx vitest run src/test/tryLockGuard.test.ts` | 6 passed |
| G1 | `ProjectRow.tsx` 끝에 `import { tryLock as grab } from "../../data/persistence/writerLock"` + 사용 | 동일 | 1 failed (ProjectRow 간선) |
| G2 | `ProjectRow.tsx` 끝에 `import * as w from ".../writerLock"` + 사용 | 동일 | 1 failed (ProjectRow 간선) |
| G3 | `ProjectRow.tsx` 끝에 `// tryLock(...) import { tryLock } from ".../writerLock"` · `/* tryLock */` 주석 | 동일 | 6 passed (오탐 0) |
| B-RED | `ProjectsPage.tsx`를 `3454702f` 판으로 임시 교체 | `npx vitest run src/pages/ProjectsPendingGate.test.tsx` | 1 failed (`expect(element).not.toBeInTheDocument()` — 로딩 중 저장소 h2 존재). 복원 후 1 passed |
| B-FAIL | 임시 테스트 `src/pages/QaTmpImportFail.test.tsx`(pendingRows mock 팩토리 throw) | 해당 파일 | 1 passed (alert + 빈 상태 + 저장소 h2, 로딩 없음). 임시 파일 삭제 |
| B-FAIL 변이 | 위 + `settled = items !== null && ready`(failed 분기 제거) | 해당 파일 | 1 failed — 임시 테스트가 공허하지 않음 확인 |

- A·B 신규/변경 테스트 파일에 `it.todo`·`skip`·`.only` 0 (grep).

## 2. diff 범위 (사실, `git diff 3454702f -- app/`)
- A(`3454702f..0fa484b7`): `createLock.test.ts`, `restartRealRepo.test.ts`, `src/test/tryLockGuard.test.ts`(신규) — 테스트 파일만.
- B(`0fa484b7..5163af0b`): `pages/ProjectsPage.tsx`(+4/−2), `pages/ProjectsPendingGate.test.tsx`(신규).
- `-` 줄 검토:
  - `createLock.test.ts`: ① `import { readFileSync }` 제거(아래 테스트 이동에 따른 미사용) ② writerLock import에 `tryLock` 추가(교체 줄) ③ 텍스트 정규식 테스트 "tryLock 직접 호출 0"(4개 파일) 제거 → `tryLockGuard.test.ts`가 같은 4개 파일을 import 그래프로 검사. 단언 대상 동일, 검출 방식 변경. 주석 오탐은 제거됐고 재수출 경유는 이전(텍스트 정규식은 단어만 있어도 FAIL)보다 약함 — 노트.
  - `restartRealRepo.test.ts`: `-` 1줄 = import에 `openOf` 추가(교체 줄). 단언 삭제 0.
- `ProjectsPage.test.tsx` diff: 0줄(항목 4).

## 3. B 경로 판정 (코드 근거 `app/src/pages/ProjectsPage.tsx`)
- 수정: `settled = items !== null && (ready || pendingRows.failed)` (L289) — 빈 상태(L354)·`BrowserStorageSection`(L373)을 settled일 때만. `LoadingState` 조건(L348 `items === null || (!ready && !failed)`)은 그대로라 이제 로딩과 완료 화면이 배타적.
- (a) RED: 1절 B-RED. 사실.
- (b) import 실패: `usePendingRows` reject → `setMod(null)` → `failed = mod === null` → settled true → alert + 빈 상태 + 저장소 영역. 1절 B-FAIL로 사실 확인.
- (c) 로딩 미종료:
  - 목록 null(`listProjects` 미해결): base와 동일하게 `LoadingState`만. reject는 `useThrowToBoundary`로 오류 경계 — 변경 없음.
  - import 무한 대기(mod undefined 유지): `LoadingState` 계속 표시 → 빈 화면 아님. base에서는 이 구간에 빈 상태·저장소 영역이 로딩과 함께 보였고 이제 로딩만 보임 — 의도된 변경. 항목>0이면 base도 `ProjectList`가 `ready`로 막혀 있었으므로 차이는 빈 상태·저장소 영역 노출뿐. 판정: 빈 화면 회귀 없음(코드 판정, 추정 아님).
  - 참고(추정): 무한 대기 동안 저장소 영역(브라우저 데이터 지우기 진입)이 안 보인다. 브라우저 dynamic import는 보통 해결 또는 reject로 끝나므로 실사용 영향은 낮다고 추정.

## 4. 명령·exit·수치 (fresh, `app/`)
| 명령 | exit | 수치 |
|---|---|---|
| `npm run typecheck` | 0 | — |
| `npm run lint` | 0 | — |
| `npm test -- --run` (1회차) | 0 | 315 files / 2842 tests passed, 49s |
| `npm test -- --run` (2회차) | 0 | 315 files / 2842 tests passed, 49s |
| `npm run build` | 0 | `/projects` 첫 화면 99.43KB/100KB · 자동 로드 포함 108.72KB/125KB · `/studio/:projectId` 91.79KB/100KB · 129.86KB/130KB · 복원 진입 91.79KB/100KB · 132.90KB/134KB · 썸네일 21장 가드 통과 |
- 기대치 대조: base 313/2830 + A(+1 file/+11) + B(+1 file/+1) = 315/2842 — 일치.
- build 경고: `vite.config.ts:6` 확장자 없는 import 경고(기존, 이번 diff 무관).
- 최종 `git status --porcelain`: `app/` 변경 0 (항목 6).

## 5. 사실 / 추정 / 미확인
- 사실: 1·2·4절 전체, 3절 (a)(b).
- 코드 판정: 3절 (c).
- 추정: 무한 import 실사용 영향 낮음. `/studio` 자동 로드 129.86/130KB는 여유 0.14KB — 이번 diff는 `/studio`와 무관하나 다음 변경에서 예산 초과 가능성.
- 미확인: 자연 재현율(전체 2회 모두 통과, flaky 재현 0/2 — 수정 후라 기대대로). A 신규 restartRealRepo 4건 Red-Green(브리프 범위 밖). Codex 검증은 브리프 금지로 미실행.
