# save-core-harness REPORT

- 성격: **격리 하네스 안 저장 코어 TDD 결과**. 제품 통합 PASS 주장 없음 — 코어는 제품 `app/`의 DocBook·localSync·useDocSave·스케줄러와 연결되지 않았다.
- base `5b7d026`(앱 `93f8111`) · 브랜치 `k002bill2/save-core-harness` · 커밋 9개(H1~H5 각 1 · 문서 1 · rawlogs 1 · 후속 결함 1 · 문서 갱신 1 — 테스트 변경 커밋은 RED+GREEN 동시, amend/rebase 0, push/merge 0).
- 쓰기 범위 = `dev/active/save-core-harness/`만. `git diff --stat 5b7d026 HEAD -- app` = 빈 출력(최종 절 참조).
- Codex 재리뷰 0(BRIEF: correctness 리뷰는 뒤 독립 QA 몫).

## 1. 결론

| H | 판정 | 한 줄 |
|---|---|---|
| H1 | **PASS(하네스)** | 저장 중 편집+detach → 늦은 완료가 B를 확정하지 않음, B 문서·Blob 보존 뒤 재저장으로 영속, 늦은 완료가 새 커밋을 덮지 않음 |
| H2 | **PASS(하네스)** | confirm = 최신 초안 커밋 + IDB 재읽기 receipt, 진행 중 편집이면(wrote:true·wrote:false 경로 모두) `newer`, 메모리·unsupported는 confirmed 0 |
| H3 | **PASS(하네스)** | readonly 거절·quota·abort 뒤 재시도로 문서+이미지 함께 커밋, 리로드(새 코어) Blob 일치, 부족 이미지 제출 0 |
| H4 | **PARTIAL** | 코어 로직은 PASS(낡은 증명 거짓 confirmed 0·예상 세대 불일치 저장 거절). 단 BRIEF가 요구한 **실제 IDB 초기화·트랜잭션과 실제 Web Locks·브라우저 멀티탭 = NOT VERIFIED** |
| H5 | **PASS(하네스)** | inflight discard/replace 거절, discard 진행 중 편집이면 blocked·보존, 근거 있을 때만 discard 복귀, 없으면 blocked 보존, intent·epoch 검사, confirm의 starter 호출 0, lease 멱등 |

공통 제한(전 H): 영속 경계는 **제품 `createMemoryPersistence`**(structuredClone·전부-아니면-전무·commit 지연·fail 주입). fake-indexeddb 미설치(`find app/node_modules -maxdepth 4 -iname '*indexeddb*'` → caniuse 데이터 2개뿐) · Node v24.12.0 `typeof indexedDB` = undefined · 새 의존성 금지 → **실제 IndexedDB 엔진 동작 NOT VERIFIED**. "리로드" = 같은 영속 인스턴스 위 새 코어.

## 2. 테스트 수 (예상 대 실제)

| | H1 | H2 | H3 | H4 | H5 | 합 |
|---|---|---|---|---|---|---|
| 최초 예상(PROGRESS, 구현 전) | 3 | 4 | 4 | 3 | 6 | 20 (범위 16~24) |
| H5 커밋 시점 | 3 | 4 | 4 | **4** | 6 | 21 |
| 최종(후속 결함 2건 추가) | 3 | **5** | 4 | **4** | **7** | **23** |

차이: H4 +1 = "탭 B 저장 뒤 탭 A dirty 저장 → stale 거절(B 덮어쓰기 0)". H2 +1·H5 +1 = H5 커밋 뒤 마감 점검에서 발견한 "await 사이 편집" 결함(아래 12~13행). 착수 중 smoke 1건은 H1 전에 삭제.

## 3. RED chronology (rawlogs 원문)

| 순서 | 로그 | 결과 | 핵심 실패 단언(원문) | 커밋 |
|---|---|---|---|---|
| 1 | `h1-red.txt` | 2 failed / 1 passed, exit 1 | `expected { status: 'saved', …(2) } to match object { status: 'saved', newer: true, …(1) }` | `0410ea0` |
| 2 | `h1-green.txt` | 3 passed, exit 0 | — | `0410ea0` |
| 3 | `h2-red.txt` | 2 failed / 5 passed, exit 1 | `expected { status: 'confirmed', …(2) } to match object { status: 'newer', …(1) }` · `expected { status: 'saved', …(2) } to match object { status: 'failed', …(1) }`(memory) | `4dbef70` |
| 4 | `h2-green.txt` | 7 passed, exit 0 | — | `4dbef70` |
| 5 | `h3-red.txt` | 1 failed / 10 passed, exit 1 | reason `- "image-missing" + "not-committed"` — v0가 이미지 없이 **문서만 커밋**함을 재읽기 verify가 잡음 | `ce99f37` |
| 6 | `h3-green.txt` | 11 passed, exit 0 | — (첫 green 시도는 패치 스크립트 실패로 같은 RED가 다시 찍혀 덮였고, 수정 뒤 재실행본) | `ce99f37` |
| 7 | `h4-red-1.txt` | 4 failed / 11 passed | 테스트1 첫 단언이 신규 `proof` 필드라 핵심 단언이 가려짐 → 구현 전 proof 단언을 테스트2로 이동 | `fa64ebd` |
| 8 | `h4-red.txt` | 4 failed / 11 passed, exit 1 | `expected { status: 'confirmed', …(2) } to match object { status: 'failed', reason: 'stale' }` · readonly 탭 confirmed · dirty 저장 `saved`(B 덮어씀) | `fa64ebd` |
| 9 | `h4-green.txt` | 15 passed, exit 0 | — | `fa64ebd` |
| 10 | `h5-red.txt` | 5 failed / 16 passed, exit 1 | `expected { status: 'discarded' } to match object { status: 'rejected', …(1) }` · `… { status: 'blocked', reason: 'stale' }` · replace `… { status: 'rejected', reason: 'dirty' }` · lease `expected 2 to be 1` | `e73c162` |
| 11 | `h5-green.txt` | 21 passed, exit 0 | — | `e73c162` |
| 12 | `followup-red.txt` | 2 failed / 21 passed, exit 1 | wrote:false 확인 진행 중 편집 `expected { status: 'confirmed', …(2) } to match object { status: 'newer', …(1) }` · discard 진행 중 편집 `expected { status: 'discarded', …(1) } to match object { status: 'blocked', reason: 'newer' }`(편집 C가 조용히 폐기·clean 표시) | `6000c29` |
| 13 | `followup-green.txt` | 23 passed, exit 0 | — (진입 mark 캡처·재확인) | `6000c29` |
| 14 | `h3-mutation-red.txt` | h3만 2 failed / 2 passed, exit 1 | 임시로 detach가 바인딩을 버리게 바꾸면 H3-1·3이 `expected { status: 'failed', …(1) } to match object { status: 'confirmed', … }` — H3 테스트가 바인딩 폐기를 잡는다는 확인. 변경은 원복(커밋 안 함) | `6000c29` |

RED 없이 처음부터 PASS한 테스트(정직 표기): H1-2(커밋 뒤 편집 경계) · H2-1(진행 중 저장 뒤 confirm) · H2-4(unsupported 쓰기 0) · H3-1~3(바인딩 보존·quota·abort — H1의 코어 소유 바인딩과 제품 메모리 영속의 원자성 덕) · H5-5(confirm starter 0, 회귀 가드). v0의 "detach 시 Blob 폐기"는 H1-1에서 앞선 `newer` 단언에 가려 별도 RED로 관측하지 못했고, 대신 14행 mutation 실행으로 H3 테스트가 그 결함을 잡는 것을 확인했다. H5 lease RED는 TypeError가 아니도록 v0 스텁(호출마다 새 토큰 = QA-6 흉내)을 먼저 넣고 측정했다.

rawlogs 커밋 시점(정직 표기): 실행 때 `*.log`로 저장했는데 저장소 `.gitignore:5 *.log`에 걸려 H별 커밋(`0410ea0`~`e73c162`)에 **로그가 빠졌다**. 이전 레인 관례대로 `.txt`로 이름만 바꿔(내용 무변경) 마지막 커밋에 추가했다. 위 "커밋" 열은 해당 H의 테스트·코어가 들어간 커밋이다. `.gitignore`는 수정하지 않았다.

## 4. 최종 실행 (fresh)

| 명령 | 결과 | 로그 |
|---|---|---|
| `app/node_modules/.bin/vitest run --config dev/active/save-core-harness/vitest.config.mjs` 1회차 | Test Files 5 passed · Tests 23 passed · exit 0 | `final-harness-run1.txt` |
| 같은 명령 2회차 | Test Files 5 passed · Tests 23 passed · exit 0 | `final-harness-run2.txt` |
| `app/node_modules/.bin/tsc --noEmit -p dev/active/save-core-harness/tsconfig.json` | exit 0 | `final-tsc.txt` |
| `app/node_modules/.bin/eslint --config app/eslint.config.js …/core …/test` | exit 0(오류 검출은 착수 시 의도적 위반 파일로 확인) | `final-eslint.txt` |
| 제품 baseline `(cd app && npx vitest run)` 1회(구현 착수 전, 01:59) | Test Files 304 passed · Tests 2769 passed · exit 0 | `baseline-app-fullsuite.txt` |

결정성: `sequence.shuffle: false, seed: 1` · 환경 node · unhandled error 허용 안 함(`dangerouslyIgnoreUnhandledErrors: false`, 두 회차 모두 exit 0). 제품 baseline은 하네스 통과를 대체하지 않으며, 하네스도 제품 회귀 PASS를 대체하지 않는다.

## 5. mock·fake 범위 (무엇을 증명하지 않는가)

| 대상 | 하네스에서 쓴 것 | 증명 안 되는 것 |
|---|---|---|
| IndexedDB | 제품 `createMemoryPersistence` — 실패 주입이 실제로 쓰기 0, commit 게이트가 커밋 전/후를 가름 | 실제 IDB 트랜잭션 수명·auto-commit·quota 실측·oncomplete 타이밍·브라우저 재시작 영속 |
| 쓰기 잠금 | 제품 `createWriterGate` + 제품 `fakeLocks` registry | 실제 `navigator.locks`·탭 닫힘 해제 타이밍 |
| gate `fresh` | `async () => true` mock — 최신성은 코어 confirm·save의 IDB 재읽기가 판정 | 제품 `fresh()`(meta gen 비교)와의 결합 |
| 멀티탭 | 같은 영속 인스턴스 위 코어 2개 | 브라우저 멀티탭(NOT VERIFIED) |
| 편집기 | `attach().detach()` 호출로 POP/cleanup 대체 | React 언마운트·StrictMode 실제 이중 effect·스케줄러 디바운스 |

## 6. 제품 미연결 · 미측정

- 제품 통합 0: gap G1~G8은 `MINIMAL-CONTRACT.md` 4절. 특히 DocBook 메모리 커밋 층(QA-4 뿌리)과 디바운스 publish(CX-1 뿌리)는 코어가 **우회**한 것이지 제품에서 해결된 것이 아니다.
- 브라우저 실행 0 · 번들 예산 측정 0 · 예산 변경 0.
- rs5 지적 대응(하네스 한정): CX-1·QA-3 → H2·H5(동기 등록 + dirty replace 거절) · QA-1 → H4 · QA-2 → H1·H2(receipt 반환·재읽기) · QA-4 → H5 · QA-6 → H5-6(멱등만) · QA-5·7·8·9 → 범위 밖(G4·G8).

## 7. 회수 요청

1. 제품 적용 여부·방식(G1 DocBook 공존, G2 스케줄러 동기 등록, G3 조건부 쓰기) 결정 — 사용자/Jarvis.
2. 독립 QA 검증(BRIEF) — 이 REPORT는 자기 검증이다.
3. 실제 IDB 검증이 필요하면 fake-indexeddb 추가(새 의존성 승인) 또는 브라우저 실측 레인 필요.
