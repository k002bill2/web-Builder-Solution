# save-core-qa REPORT — 저장 코어 구현물(8da53e0) 독립 QA

- 대상: `dev/active/save-core-harness/`(core 239행 · test 23건) @ `8da53e0`, base `5b7d026`. 브랜치 `k002bill2/save-core-qa`.
- 쓰기 범위 = `dev/active/save-core-qa/`만. 원본 코어·하네스 테스트·제품 `app/` 변경 0, 새 의존성 0, merge/push 0.
- **제품 동작 해결 주장 없음.** 아래 PASS는 전부 "하네스" 또는 "프로브" 범위다.

## 0. 결론 (먼저)

| H | 구현 쪽 자기 판정 | QA 판정 | 근거 한 줄 |
|---|---|---|---|
| H1 | PASS(하네스) | **PASS(하네스) · 주의 CE-2** | 23건 재현. 단 Blob을 편집 시점이 아니라 쓰기 직전에 바인딩에서 읽음(CE-2) |
| H2 | PASS(하네스) | **PASS(하네스) · 단언 공백** | wrote:true 경로의 IDB 재읽기 verify를 지워도 23건 PASS(M9 생존) |
| H3 | PASS(하네스) | **PASS(하네스) + 실제 IDB abort 롤백 확인** | 브라우저 실제 IDB에서 문서 put 뒤 이미지 DataCloneError → 문서·이미지 함께 0 |
| H4 | PARTIAL | **PARTIAL 유지(제품 미통합)** · 코어×제품 IDB 어댑터×실제 `navigator.locks` **프로브 PASS 1회** | 2탭 실측: B 잠금 보유 중 A readonly → B 닫힘 → A confirm `stale` · A dirty 저장 `stale` · B2 보존 |
| H5 | PASS(하네스) | **FAIL — 반례 CE-1 (+ Codex ③ 재현 CX-3)** | discard await 사이 save 진입 → `discarded`인데 폐기 초안 B가 IDB에 커밋되고 confirm까지 됨, 화면은 A·clean. 또 discard 뒤에도 폐기 Blob 바인딩이 남아 다음 저장에 커밋됨(CX-3) |

## 1. 독립 자동 검증 (fresh)

| 명령 | 결과 | 로그 |
|---|---|---|
| `(cd app && npm ci)` | exit 0 · 이후 `git status --porcelain app` 빈 출력(lock diff 0) | `rawlogs/npm-ci.txt` · `scope-check.txt` |
| `app/node_modules/.bin/vitest run --config dev/active/save-core-harness/vitest.config.mjs` 1회차 | Test Files 5 passed · **Tests 23 passed (23)** · exit 0 | `rawlogs/harness-run1.txt` |
| 같은 명령 2회차 | 23 passed · exit 0 | `rawlogs/harness-run2.txt` |
| `tsc --noEmit -p dev/active/save-core-harness/tsconfig.json` | exit 0 | `rawlogs/harness-tsc.txt` |
| `eslint --config app/eslint.config.js …/core …/test` | exit 0 | `rawlogs/harness-eslint.txt` |
| `grep -n "Errors\|Unhandled" rawlogs/{harness-run*,qa-run*,qa-final-run,codex-followup-run*}.txt`(최종 커밋 로그 기준 재실행) | 일치 0줄(grep exit 1) — unhandled error 없음 | `rawlogs/EXIT-MANIFEST.txt`(전 로그 exit 줄 + port·pgrep 수기 3줄) |
| `git diff --stat 5b7d026 HEAD -- app` | 빈 출력 | `scope-check.txt` |
| `git log --name-status 5b7d026..8da53e0` | 9커밋 변경 파일 전부 `dev/active/save-core-harness/` | `scope-check.txt` |

### TDD 이력 검토

- 각 H 커밋은 test+core를 **같은 커밋**에 넣었다(예: `0410ea0` = core 169행 + h1.test). RED 로그 6개는 나중 커밋 `ba711d5`에서 `.txt`로 추가됐다. 그래서 **RED는 git 이력으로는 검증되지 않고 로그 원문으로만 남는다.** REPORT도 이를 정직하게 적었다.
- v0(RED 기준선) 코어는 git에 없다. 그래서 H1~H5의 RED는 재생할 수 없다. `6000c29` 후속분 replay도 시간 때문에 실행하지 않았다(미실행).
- **mutation 14종** (`scripts/mutate.sh`, /tmp 복사본에만 적용, 원본 무변경 · M0 무변경 대조 23 PASS) → `rawlogs/mutations.txt`
  - 죽음 11: M1 confirm 진입 mark · M2 discard 진입 mark · M3 stale 세대 · M4 discard inflight · M5 replace dirty · M7 chain 직렬 · M10 wrote:false verify · M11 wrote:false writer 검사 · M12 replace epoch · M13 wrote:true newer · M14 discard verify.
  - **생존 3 = 빠진 단언**:
    - **M6 `settle` 세대 가드 제거** → 23 PASS. 저장이 직렬이라 가드가 죽은 코드다. H1-3 "늦은 callback 세대 식별"은 이 가드를 실제로 검증하지 않고, 직렬화(M7)가 막는다.
    - **M8 verify의 이미지 key 검사 → `return true`** → 23 PASS. `image-missing` 사전 검사 때문에 중복이 됐다.
    - **M9 confirm wrote:true 경로의 재읽기 verify 삭제** → 23 PASS. 메모리 영속은 write resolve = 커밋이라 verify가 항상 참이다. REPORT의 "IDB 재읽기 receipt" 주장 가운데 wrote:true 경로는 **어느 테스트도 강제하지 않는다.**

## 2. 반례 (QA 폴더 `test/qa.test.ts`, 2회 실행 동일)

- 명령: `app/node_modules/.bin/vitest run --config dev/active/save-core-qa/vitest.config.mjs --reporter=verbose --silent=false`
- 결과: Codex 전 `qa.test.ts` 9건 = **3 failed | 6 passed (9) · exit 1**, 2회 동일(`rawlogs/qa-run{1,2}.txt`). **최종 = CE 9 + CX 1 = 10건: 같은 명령(include 전체) fresh 1회 4 failed | 6 passed (10) · exit 1**(`rawlogs/qa-final-run.txt`). tsc·eslint exit 0(`qa-tsc.txt`·`qa-eslint.txt`).
- CE = 계약 단언(실패 = 반례 확인), OBS = 관찰 고정. 테스트를 유리하게 고치지 않았다. 원본 코어와 헬퍼는 읽기 전용으로 import했다.
- 이 테스트들은 Codex 실행 **전에** 커밋했다(`07dec81`). 그래서 "자기 단언 → 원문 검토" 순서가 git 이력에 남는다.

| ID | 판정 | 등급(QA) | 분류 | 관측(로그 원문 `[QA]`) |
|---|---|---|---|---|
| **CE-1** | **RED = 반례** | **P1** | **모델 내** (단일 탭·배타 writer·제품 메모리 영속. 실제 IDB 재현은 미실행 — 영속 구현과 무관한 코드 경로라는 추론) | `discard:"discarded", save:"saved", confirm:"confirmed", confirmHashIsB:true, stored:"B", view:{body:"A", dirty:false}` |
| **CE-2** | **RED = 반례** | P2 | **id 정책 의존** (같은 id에 다른 Blob) | `receiptHashIsD1:true, storedBody:"D1", imageBytes:"Y", reopenedConfirm:"confirmed"` |
| **CE-3a** | **RED = 반례** | P2 | **범위 밖 사용** (한 탭에 코어 2개가 제품 gate 1개를 공유) | `r1:2, r2:2, stored:["c2",2]` — 둘 다 gen2 `saved`, c1 커밋은 소실 |
| CE-3b | PASS | — | 두 탭 = 제품 gate 2개 + fakeLocks | `ra:"saved", rb:"readonly"` — 배타 writer에서는 TOCTOU에 도달하지 않음 |
| CE-4 | PASS | 관찰 | 모델 내 | 동시 confirm 2회 = 둘 다 confirmed(gen1, gen2), **write 2회**(같은 내용을 중복 커밋) |
| CE-5 | PASS | — | 모델 내 | clean 상태 save 진행 중 confirm → confirmed gen1(verify가 gen2 커밋 전에 읽음) |
| CE-6 | PASS | — | 모델 내 | discard await 중 replace → discard `blocked{newer}`, 교체본 R 유지 |
| OBS-1 | 관찰 | P2(liveness) | 모델 내 | 다른 탭이 쓴 뒤에는 save `stale` · discard `blocked{stale}` · replace `rejected{dirty}` · confirm `stale` — **재열기 말고는 회복 경로가 없다** |
| OBS-2 | 관찰 | P3 | 범위(프로젝트 1개) 밖 | 이미지 존재 확인 `keys("images")`가 프로젝트를 구분하지 않는다. 다른 프로젝트의 `img-x`가 있으면 바인딩 없이 `saved` |

### 반례 상세

- **CE-1 (H5 FAIL 근거)**
  - 원인: `discard`는 진입 시점에만 `inflight > 0`을 검사한다(saveCore.ts:179). 그 뒤 `await readStored/verify` 사이에 `save()`가 진입하면, 그 save는 B를 target으로 잡는다. discard는 `doc = stored.doc; savedMark = mark`로 끝나고 B가 커밋된다. 이어서 `settle`이 `confirmed = B`로 바꾸고, `mark <= savedMark`가 되어 confirm은 wrote:false로 B를 confirmed 처리한다.
  - 모델 경계: 제품 mock(메모리 영속) 때문에 생긴 결함이 **아니다**. 코어 로직 자체의 결함이다.
  - 실제 도달 조건: UI·스케줄러가 discard 진행 중에 save를 부를 수 있어야 한다. 제품 스케줄러(G2, 디바운스 publish)는 미연결이라 도달 여부를 검증하지 못했다.
- **CE-2**
  - 원인: `saveNow`는 `target = doc`을 먼저 잡는다. 그다음 `await writer.mode()/readStored/keys`를 거친 **뒤에** `attached.get(id)`를 읽는다(:119 대 :134). 그래서 그 사이에 같은 id로 다른 Blob이 들어오면 D1이 Y 바이트와 함께 커밋된다.
  - `verify`가 key 존재만 보므로, 다시 연 코어의 confirm도 이 불일치를 통과시킨다.
  - 제품 이미지 id는 `projectId/localId`(imageRecord.ts:4)다. localId가 다른 바이트로 재사용되는지는 **확인 못 함**. 재사용하지 않는다면 "모델 한정"이다.
- **CE-3a**: MINIMAL-CONTRACT G3(세대 읽기와 쓰기가 다른 트랜잭션)을 구체적으로 확인한 것이다. 두 탭에서는 배타 잠금이 막는다(CE-3b·브라우저 14번). 같은 탭에서 코어를 재열기할 때 gate를 새로 만들면 readonly가 된다(브라우저 관측 3번). 반대로 gate를 공유하면 CE-3a 경로에 들어간다.

## 3. 실제 브라우저 IndexedDB · Web Locks (실행함)

- 도구: ego-browser(TaskSpace 23, 종료 `finish({keep:[]})`). 전용 vite(`browser/vite.config.mjs`, 플러그인 0)로 **origin `http://127.0.0.1:4367`**만 사용했다.
  - 기동 전 `lsof -iTCP:4367` exit 1(비어 있음). 종료 뒤에도 exit 1(`rawlogs/browser-cleanup.txt`).
  - 사용자 5480/localhost origin은 무접촉. 실서비스 연결 0.
- 결합 범위: **하네스 코어(읽기 전용 import) + 제품 `openIdbPersistence`(실제 IDB 어댑터) + 제품 `createWriterGate(navigator.locks)`**(`fresh = async () => true`).
  - DocBook·localSync·스케줄러·React는 **미결합**이다.
- DB: `indexedDB.databases()` 기동 전 `[]` → `save-core-qa-1791912138069` 1개 생성 → 끝에 `deleteDatabase` `deleted` → 뒤 `[]`.

| # | 단계 | 관측(`rawlogs/browser-probe-{1,2}.txt`) |
|---|---|---|
| 1 | 코어 save(A + img Blob) | `saved gen1`. 어댑터 write resolve = 제품 `txDone` oncomplete. 재읽기 `body A · gen1 · hashOk · images [img] · bytes "bytes-A"` |
| 2 | **실제 페이지 reload** 뒤 새 코어 | hydrated gen1 → wrote:false confirm `confirmed gen1 proof fresh`. Blob 바이트 일치 |
| 3 | 같은 페이지에서 gate를 새로 만든 코어로 save | `readonly`. 앞 gate가 페이지 수명 동안 잠금을 보유한다(관찰: 같은 탭에서 재열기할 때 gate 재사용이 필요) |
| 5 | 새 로드 페이지에서 abort: 문서 put 다음 이미지 put이 DataCloneError | save `failed` (사유 = `toInfra` 메시지 "INFRA: 저장 — …", 오류 이름은 가려짐). **문서 A gen1 그대로 · img-bad 없음** = 실제 IDB 트랜잭션 롤백 |
| 6 | abort 뒤 reload | gen1 · bytes-A 그대로 |
| 7–11 | 탭 A(p1) 열기(hydrated gen1) → 탭 B(p2) save | B `saved gen2`. `locks.query().held = ["design-studio-writer"]`. A confirm → `failed readonly` |
| 12–13 | B 페이지 닫음 | held `[]`. A confirm → **`failed stale`**(낡은 증명으로 거짓 confirmed 0) |
| 14–15 | A dirty save | `failed stale`. IDB = `B2 gen2` 보존(덮어쓰기 0) |

- 한계:
  - 수동 스크립트 1회 실행이다. 자동 테스트가 아니다.
  - 다른 탭은 같은 브라우저 프로필의 두 페이지다(탭 닫힘 = `page.close()`). 브라우저 재시작, quota 실측, 탭 크래시 해제는 미실행이다.
  - `unsupported` 경로(locks 없음)는 브라우저에서 실행하지 않았다.

## 4. mock · fake 경계 (별도 표기)

| 대상 | 하네스 23건 | QA 반례 9건 | 브라우저 프로브 |
|---|---|---|---|
| IndexedDB | 제품 `createMemoryPersistence`(fake, 원자·structuredClone) | 같음 | **실제 IDB**(제품 어댑터) |
| 잠금 | 제품 gate + `fakeLocks` 또는 `writerAlways` mock | 제품 gate + `fakeLocks` · `writerAlways` · 지연 writer mock | **실제 `navigator.locks`** |
| gate `fresh` | `async () => true` | 같음 | 같음(제품 meta gen `fresh()` 미결합) |
| 멀티탭 | 같은 영속 인스턴스 위 코어 2개 | 같음 | 같은 origin 페이지 2개 |
| React·DocBook·스케줄러 | 미연결 | 미연결 | **미연결** |

## 5. Codex adversarial-review (1회 · 구현물 대상)

- 명령: `node codex-companion.mjs adversarial-review --scope branch --base 5b7d026 "<saveCore 동시성 focus>"`(1회, 재실행 0). 원문은 `rawlogs/codex-adversarial.txt`.
- 순서: QA 반례 커밋 `07dec81` → Codex 실행 → Codex 원문 검토 → 새 지적 1건만 재현 테스트(`test/codex-followup.test.ts`, 이 커밋).
- Codex 판정: **needs-attention**, 지적 3건(전부 high/P1).

## 6. Codex 결과 대조

| Codex 지적 | QA 자기 반례(Codex 전) | 일치 | 비고 |
|---|---|---|---|
| ① discard await 중 save → 폐기 초안 부활 (:178-190) | CE-1 | **일치** | 등급도 P1로 일치. 관측값(화면 A·dirty false·저장소 B·confirm B)이 같다 |
| ② 제출 문서와 Blob 바인딩을 다른 시점에 읽음 (:119-135) | CE-2 | **일치(등급 불일치)** | Codex P1, QA P2. QA 근거: 제품 localId 재사용 정책을 확인하지 못했고, 같은 id 재바인딩이 제품에서 발생하는지 미검증이다. Codex 근거: 현재 코어 API가 재바인딩을 허용한다. **결정은 Jarvis에게 넘긴다** |
| ③ discard가 폐기 Blob 바인딩을 남김 (:187-190) | **QA 놓침** | 신규 | Codex 이후 재현: CX-3 **RED 2회 동일**. 관측 `discard:"discarded", viewBlobAfterDiscard:"Y", stored:"A-text", imageBytes:"Y"`(`rawlogs/codex-followup-run{1,2}.txt`, exit 1). 경합 없이 **순차 호출만으로** 도달하고, 같은 id 재바인딩이 전제다(CE-2와 같은 id 정책 의존). QA 등급 P1 후보(순차 도달) / id 정책 확인 전까지 P2 하한 |
| (Codex 언급) 세대 TOCTOU는 배타 writer 전제 | CE-3a/3b | 일치 | 두 탭에서는 막히고(CE-3b·브라우저 14번), 같은 탭에서 gate를 공유하면 뚫린다 |
| (Codex 언급) 실제 IDB 미검증 | 3절 | **실행 시점 차이**(판단 불일치 아님) | Codex는 `07dec81` 직후, 브라우저 프로브 커밋 `aa3784e` 전에 실행됐다. 프로브는 그 뒤 실행(3절). 단 제품 통합 미검증이라는 점은 같다 |

- 새 수정 0: 코어를 고치지 않았다(BRIEF). 지적 ①②③의 수정 방향은 7절에 넘긴다.

## 7. 회수 요청 · 다음 범위 (Jarvis 결정)

1. **CE-1 (P1)**: H5를 PASS로 회수하지 말 것. 수정 방향은 결정이 필요하다. 이 QA는 수정하지 않았다(BRIEF: 자동 수정 0).
   - 후보 (a): discard가 진입부터 끝까지 save를 막는 상태(예: `discarding` 플래그 → save는 `rejected`)
   - 후보 (b): discard가 저장 chain에 직렬로 들어감
2. **M6·M8·M9 생존**: 빠진 단언 3건을 보강할지, 아니면 죽은 코드(M6·M8)를 정리할지 결정이 필요하다.
3. **CE-2·CX-3**: 제품 localId 재사용 정책을 확인한 뒤 등급을 정한다(Codex P1 / QA P2). 수정한다면 두 가지가 필요하다.
   - 바인딩을 target 캡처와 같은 시점에 동결한다.
   - discard 때 바인딩을 복원하거나 비운다.
4. **OBS-1 stale 회복 경로**와 **CE-3a 같은 탭 재열기 시 gate 공유 규칙**: 제품 통합(G1~G3) 설계 때 함께 결정한다.
5. H4는 실제 IDB·locks 결합 프로브까지 확인했다. 그래도 제품 통합 검증(DocBook·스케줄러·React)은 별도 레인이 필요하다.
