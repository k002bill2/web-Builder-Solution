# TEST-GAPS-1 REPORT

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
| B-M4B-07 · 08 | `siteJson.ts:25` `NEUTRAL`에 여분 키 `extra: ""` | **스위트 전체 통과(생존)** — `toMatchObject`라 여분 키 못 잡음 | `reactZip.test.ts` doc 최상위 키 배열 정확 일치 · kitTokens·motion·mainStyle 값 | 스위트 1 failed/3364 — `reactZip.test.ts` 키 배열 | 3364/3364 | `31224e8f` |
| B-M4B-07 · 08(값) | `siteJson.ts:68` motion `{}` · mainStyle `{}` · kitTokens mediaRatio 변조 | 파일 단위 생존(reactZip.test 8/8) · **스위트에선 이미 검출**(fidelity 24~32건) | (같은 단언) | 스위트 25·24·32 failed | 3364/3364 | `31224e8f` |
| B-M4B-07 · 13 | ① `Media.tsx:52` aspect style 제거 ② `templates.ts:108` zip 쪽 `imageSizes={{}}` | 파일 단위 생존(①) · **스위트에선 이미 검출** — ① PortfolioGallery·fidelity ② base `fidelity.test.tsx`로도 1 failed(앱↔zip 대조) | `fidelity.test.tsx` masonry 섹션 존재 · app·zip 각각 aspect 목록 = `1000 / 1000`·`800 / 600` | ① 2 failed ② 1 failed | 3364/3364 | `706af756` |
| B-M4B-07 · 17 | `licenses.ts:53` 글꼴 경로 목록 → `src/assets/fonts/*` · `:55` 이미지 목록 → `- src/assets/images/*` | **스위트 전체 통과(생존)** | `template.test.ts` 새 it — 5절 글꼴 줄·6절 이미지 목록 정확 포함 | 각각 스위트 1 failed — `template.test.ts` | 3364/3364 | `d9411f02` |
| B-M4B-07 · 09 | `zipSite.ts:48` 정적 zip 글꼴 바이트 400↔700 교환 | **스위트 전체 통과(생존)** | `reactZip.test.ts` 새 it — 같은 문서 react-zip·정적 zip을 풀어 글꼴 entry 이름·바이트 직접 대조 | 스위트 1 failed — `assets/fonts/Pretendard-400.woff2: expected false to be true` | 3364/3364 | `7522b184` |
| B-M4B-07 · 04 | `exportFlow.ts:42` `loadReactZip`의 `retryableImport` 제거 | 파일 단위 생존(exportFlowReactZip 7/7) · **스위트에선 이미 검출**(`chunkRetryWiring.test.ts:31`) | 새 `exportFlowReactZipRetry.test.ts` 단일 흐름 — 첫 import 실패(retryable·계수 1) → `?retry=1` 성공 → done·계수 0 | 스위트 2 failed(wiring + 새 파일) | 3364/3364 | `b98a9206` |
| B-RS-08 L5 M1 | — | — | 이미 RS7-M1에서 닫힘(BACKLOG 원문 · `ProjectsRowPriority.test.tsx`) | — | — | 작업 0 |


## 3. 서브에이전트
- A(worktree `worktree-agent-a65471f5cf0e64772`): B-M4B-07 5건 커밋(`50514f8f`·`9f790e5e`·`177297bd`·`aaba2a06`·`81568668`) → cherry-pick(위 표 SHA). 서브에이전트 RED는 파일 단위만 쟀다 → **메인이 변이 9종을 전체 스위트로 재실행**(`/tmp/tg1-mut.py`, 매번 `git checkout --`)해 위 표를 확정. 08 값·13·04는 스위트 단위로는 이미 잡히던 것.
- B(worktree `worktree-agent-ae86468a3f9c0be36`): B-RS-08 U14-b — 검출 성공. 앞선 3회 실패 원인 = 확인이 B 제출 **전**에 쓰면 `submitted`=A라 retry만(쓰기 0) — 노출 구간은 `coreIo.ts` `port.commit`~`link.align` 사이뿐(`localSync.ts:161`). 메인이 변이 재실행으로 재검증.

## 4. 게이트 (fresh · tip `b98a9206` 위, 문서 커밋 전)
- `npm run typecheck` exit 0 · `npm run lint` exit 0 · `npm test -- --run` exit 0 — **375 파일 / 3364 테스트 통과** · `npm run build` exit 0.
- 예산 증분 0: `/studio` 해시 정규화 128.76 = 기준선 128.76 · 복원 131.75 = 131.75 · raw 130.07·133.10 = ADR-004 개정 21 실측과 동일 · `/catalog` 100.76/101. app 변경 = 테스트 파일만(`git diff --stat 5444def5 -- app` 전부 `*.test.*`).
- Codex 미실행(브리프 금지). 원격 명령 0.

## 5. BACKLOG 닫기 제안
| ID | 제안 | 근거 |
|---|---|---|
| B-RS-08 | **닫기** | L5 M1 = RS7-M1에서 이미 닫힘 · L1 U14-b = `a00c3215`가 생존 변이 검출(RED→FAIL→GREEN, 원본 반복 통과) |
| B-M3-04 | **닫기** | `recoImportGuard.test.ts` — 크기 무관 정적 간선 0 · m4-b·m4-c 둘 다 FAIL |
| B-SEC-05 | **닫기** | M2(`===`→`<=`) FAIL |
| B-M4B-08 | **닫기** | M2a(다른 문장 폴백) FAIL |
| B-M4B-07 | **닫기** | 5개 하위 조건 단언 추가. 생존 변이 검출은 08(여분 키)·17·09. 08 값·13·04는 스위트 단위로 이미 잡히던 것 — 이번 단언은 RZ-AC 문장의 하위 조건을 해당 테스트에 직접 둔 보강 |

## 6. 주의
- 13·04·08(값)은 브리프 1절 "재현 안 되면 근거만 기록"에 걸리는 경우지만, BACKLOG 공백이 "단언 0·단일 테스트 0" 자체라 테스트를 유지했다(약화·skip 0). 사용자 판단으로 빼도 다른 테스트가 같은 변이를 잡는다.
- 08 motion 기대값 `{header-1…services-1: "L1"}`은 SPEC 유도가 아니라 실행 출력 스냅샷(서브에이전트 보고). mainStyle·kitTokens는 입력에서 유도.
- U14-b 테스트는 메모리 가짜 영속(harnessDb) 위에서 keys 게이트·쓰기 hold로 경합 구간을 강제로 만든다.
- 04 새 파일 `repositoryCallingSlot`은 `exportFlowReactZip.test.ts`에서 복제(작은 중복).
