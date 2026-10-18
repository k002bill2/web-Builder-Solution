# TEST-GAPS-1 REPORT (초안)

base `5444def5` · 브랜치 `k002bill2/test-gaps-1` · 테스트 전용(앱 코드 변경 0) · 원격 명령 0 · Codex 0

## 1. 대상 (BACKLOG 원문 기준)
| ID | 원문 요지 | 상태(착수 시) |
|---|---|---|
| B-RS-08 | 생존 변이 묶음 — L5 M1은 RS7-M1에서 이미 닫힘. 남은 것 = L1 U14-b(confirmDoc `idle()` 대기 제거) | U14-b만 대상 |
| B-M3-04 | 로드 조건 단위 테스트가 로더 호출 수만 잼 — 정적 side-effect import 미검출 | 대상 |
| B-SEC-05 | `checkImages.test` 헤더 < 사다리(639×480·640×479 → IM-6·디코드 0) · 변이 M2(`===`→`<=`) 생존 | 대상 |
| B-M4B-07 | RZ-AC 부분 단언 08·13·17·09·04 | 대상(서브에이전트 A) |
| B-M4B-08 | `StudioPanels.test.tsx:18` `exports={null}` 시 "내보내기" 제목 뒤 형제 0 단언 · 변이 M2a 생존 | 대상 |

## 2. RED/GREEN 표
RED = 변이에서 기존 테스트 통과(생존 재현) · FAIL = 새 단언이 변이를 잡음 · GREEN = 변이 되돌린 원본에서 통과. 매 변이 `git checkout --`로 되돌림, 앱 코드 커밋 0.

| 항목 | 변이(앱 코드, 임시) | RED(기존) | 새 단언 | FAIL(변이) | GREEN | 커밋 |
|---|---|---|---|---|---|---|
| B-SEC-05 | M2 `checkImages.ts:61` `headerFits` `===` → `<=`(폭·높이) | projectFile/ 9파일 165/165 통과 | `checkImages.test.ts` "헤더가 사다리보다 1px 작음(639×480 · 640×479) = IM-6 · 디코드 0" | 1 failed/24 — `expected { ok: true, … } to deeply equal { ok: false, code: 'IM-6' … }` | 24/24 | `b81712ba` |
| B-M4B-08 | M2a `StudioPanels.tsx:146` `{exports ?? <p className="ds-body">생성기 준비 중입니다.</p>}`(다른 문장 폴백) | `StudioPanels.test.tsx` 2/2 통과 | 같은 파일 — `exports={null}`일 때 h3 "내보내기".nextSibling = null | 1 failed/2 — `expected <p class="ds-body"></p> to be null` | 2/2 | `aee369ec` |
| B-M3-04 | m4-b `CatalogPage.tsx` `import "../components/reco/RecoView";` 1줄 | `CatalogPageRecoLoad.test.tsx` 3/3 통과 | 새 `src/test/recoImportGuard.test.ts` — 소스 전체 정적 간선 0 · 동적 간선 = 로더 2개 3건 · 검출기 자체 | 1 failed/3 — `+ "pages/CatalogPage.tsx → ../components/reco/RecoView"` | 3/3 | `6527ec03` |
| B-M3-04 | m4-c `recoLoader.ts` = `import * as RecoView from "./RecoView"; export const loadRecoView = () => Promise.resolve(RecoView);` | `CatalogPageRecoLoad.test.tsx` 3/3 통과 | (같은 가드) | 2 failed/3 — 정적 `recoLoader.ts → ./RecoView` · 동적 목록에서 `recoLoader.ts → ./RecoView` 빠짐 | 3/3 | `6527ec03` |
| B-RS-08 L1 U14-b | `memoryProjectRepository.ts:141` confirmDoc의 `await cores.get(projectId)?.idle()` 제거 | save+data 61파일 중 기존 497/497 통과(서브에이전트: features·pages·components 포함 2260/2260) | 새 `features/studio/save/confirmDoc.coreIdle.test.ts` — 다른 탭 코어 commit을 `keys("images")` 순번 게이트로 `port.commit`~`link.align` 사이에 세운 채 confirmDoc → 끝 IDB 문서 = 코어 커밋 B | 1 failed — `expected 'A' to be 'B'` | 원본 5회 연속 1/1(메인) · 서브에이전트 11회 | `a00c3215` |
| B-RS-08 L5 M1 | — | — | 이미 RS7-M1에서 닫힘(BACKLOG 원문 · `ProjectsRowPriority.test.tsx`) | — | — | 작업 0 |


## 3. 서브에이전트
- A(worktree): B-M4B-07 — 진행 중
- B(worktree `worktree-agent-ae86468a3f9c0be36`): B-RS-08 U14-b — 검출 성공. 앞선 3회 실패 원인 = 확인이 B 제출 **전**에 쓰면 `submitted`=A라 retry만(쓰기 0) — 노출 구간은 `coreIo.ts` `port.commit`~`link.align` 사이뿐(`localSync.ts:161`). 메인이 변이 재실행으로 재검증.

## 4. 게이트
(작성 중)

## 5. BACKLOG 닫기 제안
(작성 중)
