# INTEGRATE-6 — 저장 코어 ↔ 제품 연결 설계 (RS6 입력)

- 상태: **r0 설계안 — 구현 승인 아님 · 코드 0 · 측정 0 · 실화면 확인 0.** 작성 Designer(Orca Claude Code) · 발주 Jarvis 2026-10-17 · 회수 Jarvis.
- base `c7a7a2a8`(main — studio-preload-slim 병합 뒤). 앱 코드는 읽기만 했다.
- 입력: 코어 `dev/active/save-core-harness/core/saveCore.ts`(이하 **코어**) · `MINIMAL-CONTRACT.md`(이하 **MC**, I1~I9·G1~G8) · `save-core-fix/REPORT.md` · `save-core-final-qa/REPORT.md`(H1~H5 · BD-1/BD-2 · LV-1/LV-2) · `CONTRACT-5.md`(이하 **C5**) · `UX-5.md` · `SPEC-4.md` · `rs5-review`·`rs5-spike`·`rs4-cp4-measure` REPORT · ADR-004 개정 13·16.
- 이 문서는 C5·UX-5·SPEC-4·ADR·BACKLOG를 **수정하지 않는다.** 다르게 하는 곳은 10절 "대체/차이"에 적는다. 새 저장소 인터페이스·예산 상향·엔진/PageDoc 계약·새 의존성은 전부 `MQ-6.md`로만 올린다.
- 표기: **[L1]** 코드·문서 행 직접 확인 · **[L1-추적]** 여러 행을 이어 읽은 경로 추론(실행 0) · **[L3]** 추정 · **미측정** = 실행으로 확인하지 않음.

## 0. 결론 (먼저)

1. **연결 방식 = "코어 상태기 + 제품 영속 포트(port)"** (★ MQ-6-1 A). 코어의 상태기(초안·mark·바인딩·직렬 chain·epoch·discarding·lease)는 그대로 옮긴다. 영속 접근(`readStored`/`commit`/`verify`/`readImage`)은 코어가 `StudioPersistence`를 직접 부르지 않고, 제품 `LocalSync`가 구현하는 **포트**를 부른다. 이유: 코어는 자기 레코드 모양(`kind:"core-doc"`/`"core-image"`, 문서별 세대)을 쓴다 [L1 `saveCore.ts:82-90,156,160`]. 제품은 `kind:"doc"` 레코드 + `meta.generation`(탭 간 쓰기 도장) + 상태 레코드를 같은 트랜잭션에 쓴다 [L1 `localSync.ts:125-131,165`]. 코어를 그대로 import하면 **두 번째 레코드 형식**이 생긴다 = PageDoc/스키마 계약 변경이라 MQ 사안이고, 권하지 않는다.
2. **BD-1(같은 탭 다른 어댑터 객체)은 제품 구조에서 도달하지 않는다 — 조건부.** `openIdbPersistence`를 부르는 곳은 `openLocalSync` 1곳뿐이다 [L1 `localSync.ts:92`]. `openLocalSync`는 탭당 1회 만들어지는 공유 로더 `sync`를 거친다 [L1 `deferredStudio.ts:45` · `sharedLoader.ts:5-13` · `main.tsx:30`]. 그래서 코어가 **같은 `LocalSync` 인스턴스의 포트**를 쓰는 한 어댑터는 탭당 1개다. 이 조건이 깨지지 않게 import 그래프 가드 [G] 1건을 수용 기준에 넣는다(RS6-AC-G2). 조건부 IDB 쓰기(G3)는 필요 없다 — 탭 수명 배타 writer 잠금이 다른 탭을 막기 때문이다(4절).
3. **liveness(LV-1·LV-2)는 "취소 0 · 관찰 시간 제한 · 결과 버리지 않음"** 규칙으로 닫는다(3절). IDB 트랜잭션은 취소할 수 없으므로, 시간 제한은 **표시 전환과 사용자 선택**에만 쓴다. discard 읽기 정지는 **포기(abandon) 토큰**으로 가드를 풀고 늦은 결과를 무시한다 — 코어 내부 동작 변경이다(MC I7 문장 변경). 공개 인터페이스는 아니지만 MC 계약을 바꾸므로 MQ-6-3에 함께 올린다.
4. **CP4(편집기 인계 · RS4-R1)는 RS6에 흡수한다**(★ MQ-6-4 A). 코어는 탭 수명 객체이고 편집기는 `acquire`/`release`로 빌려 쓴다. 그래서 "편집기 밖 미확인 기억 → 재진입 인계"가 코어 구조 안에 이미 있다. `PendingDraft` 경로(SPEC-4 3.3-5)를 따로 만들 이유가 없다. 다만 **바이트는 상쇄를 가정하지 않는다** — 흡수는 "같은 측정 1회로 판정"이라는 뜻이고, 상쇄는 대체 코드 제거를 같은 스파이크에서 실측했을 때만 인정한다(7절).
5. **예산: 지금 실측된 어떤 연결안도 여유 안에 없다.** main 여유 = 정규화 0.44KB · raw 0.60KB [L1 `studio-preload-slim/REPORT.md`]. 기존 실측: CP4 조합+a **+0.80**(정규화) [L1 `rs4-cp4-measure/REPORT-M2.md:1`], C5 장부 S5a-r +417B · S5b +753B(raw, preload-slim 이전 base) [L1 `rs5-spike/REPORT.md` 3절]. **코어 자체의 바이트는 미측정이다.** 그래서 RS6 첫 레인은 **측정 관문(L0)**이고, 통과 전에는 구현 레인을 시작하지 않는다(8절).
6. 새 의존성은 필요 없다 — 코어·포트는 기존 `StudioPersistence`·`writerLock`·`writeQueue`만 쓴다.
7. 남는 손실: 탭이 죽으면(모바일 백그라운드 종료·크래시·경고 무시) 미확인 초안은 사라진다. 코어는 탭 메모리이고 초안 영속은 새 스키마라 범위 밖이다(9절).

## 1. 경계 매핑표 — 코어 API·불변식 → 제품

분류: **신설** = 제품에 없음 · **변경** = 기존 모듈 동작·시그니처 변경 · **유지** = 그대로 씀 · **삭제/대체** = 코어가 대신함.

### 1.1 API

| 코어 API [L1 `saveCore.ts`] | 제품 쪽 연결점 | 분류 | 근거 |
|---|---|---|---|
| `openSaveCore({projectId, persistence, writer, initial, starter})` :106 | 새 `features/studio/save/` (가칭) `coreFor(projectId, seed)` — 탭당 레지스트리(`Map<projectId, Core>`)가 **저장소 인스턴스(`createMemoryProjectRepository` closure)** 에 매달린다(2.2-2). **동기 생성** — `initial` = 편집기가 이미 받은 문서(`getDoc` 결과 = 진입 레코드 또는 DocBook), 열 때 IDB 읽기(`readStored`) 0. `persistence` 인자 → `CorePort`(1.3, 첫 `save()` 때 늦게 붙음), `writer` → `LocalSync` 안 `gate`(:122), `starter` → 기존 create/restart 재생 경로 | 신설 · **MC 변경**(D6-10) | `memoryProjectRepository.ts:56,114-117` · `deferredStudio.ts:45,55` · `localSync.ts:47,122` |
| `edit(doc, blobs)` :241 — **동기** | `useDocSave`의 `change` 경로(편집마다). 지금은 스케줄러가 version만 올리고 2초 뒤 `saveDoc`(MC G2) | 변경 | 2절 G2 행 |
| `attach()/detach()` :247 | 코어에서 의미 없음(no-op). 제품에는 넣지 않는다 | 삭제 | 코어 본문이 빈 함수 |
| `acquire(mountId)/release(token)` :255-263 | `StudioLayout` commit 단계 effect(마운트·cleanup). mountId = `useId()` 계열 | 신설 | C5 4.5 StrictMode 행 · MC G7 |
| `save()` :132 | 스케줄러의 저장 1회 = `core.save()` 단일 경로. 기존 `repository.saveDoc` → DocBook 메모리 커밋 → `flush`(F2) 경로를 대체 | 변경(대체) | C5 F1·F2·F3 · 2절 |
| `confirm()` :182 | UX-5 "저장 확인" 버튼(편집기 안 dirty 아닐 때 · `/projects` 행). 기존 `LocalSync.confirm`(:197, SPEC-4 3.5 `confirmDoc`)은 포트의 `verify` 재료로 남는다 | 변경 | UX-5 8.1 |
| `discard()` :203 | UX-5 "확인되지 않은 변경 버리기"·"버리고 새로고침" | 신설 | UX-5 6.3 |
| `replace(doc, {intent, expectedEpoch}, blobs)` :228 | 스냅샷 복원·restart 재생·충돌 해결 뒤 문서 교체(C5 4.4 · `useDocSave` `adopt` F12) | 변경 | C5 F12 · MC I8 |
| `retryStart()` :264 | UX-5 "시작 다시 시도" — 기존 `pendingRetry`/`restartFlow` 재생 함수를 `starter`로 주입 | 변경(연결만) | UX-5 4절 |
| `view()` :267 | `SaveStatus`·`ConflictCallout`·`/projects` 행의 상태 판정 입력. 환경 축(readonly/stale/unsupported/cleared)은 view에 없음 → 포트 `mode()` 병행(MQ-6-2 G1/G5) | 신설 | UX-5 2.1 |

### 1.2 불변식

| MC 불변식 | 제품에서 성립시키는 곳 | 분류 | 비고 |
|---|---|---|---|
| I1 제출 mark 고정 | 코어 그대로 | 유지(코어) | C5 I1·Q1·CX-1을 구조로 닫음(dirty = `mark > savedMark`가 confirm 판정에 들어감 — rs5-review 공통 원인 해소) |
| I2 직렬·세대 | 코어 chain + 기존 `writeQueue`(탭 전역 직렬, F10) | 유지 | 두 직렬이 겹쳐도 순서 = 제출 순서 [L1-추적] |
| I3 confirm wrote:true = 재읽기 증명 | 포트 `verify` = `persistence.get("docs")` hash·revision 비교 + 이미지 레코드 재읽기 | 신설(포트) | 코어 `verify` :174를 제품 레코드 모양으로 |
| I4 confirm wrote:false | 포트 `verify` + `gate.mode === "writer"` | 신설(포트) | QA-1(rs5-review) 해소 경로 |
| I5 비영속 | `persistence === "memory"` → 포트 없음 → `not-persistent`. `navigator.locks` 없음 → gate `unsupported` | 유지 | UX-5 `memory-only`·`unsupported` |
| I6 원자·이미지 | 포트 `commit`이 문서 put + 바인딩 이미지 put + 상태 레코드·meta(도장)를 **한 `queue.submit`** 으로. 참조 이미지가 바인딩에도 IDB에도 없으면 제출 0 | 변경 | 지금 `imageOps`는 맵 없는 참조를 조용히 건너뜀(C5 F4) → 엄격 모드 필요. 제품 `imageOps`의 참조 밖 id **delete(GC)** 는 코어 계약("delete op 0")과 다르다 → 포트가 GC delete를 같은 트랜잭션에 계속 싣되, discard는 delete를 내지 않는다(CX-3 유지). 편집기 맵 cleanup 삭제(`memoryProjectRepository.ts:138-149`)는 코어 바인딩이 대신하므로 L3에서 정리 [L1-추적] |
| I6b 예상 세대 | 제품 = **잠금 획득 때 `fresh()` 1회**(meta.generation == hydrated)[L1 `localSync.ts:99-103`] + 탭 수명 잠금 보유(`writerLock.ts:2-3`). 커밋마다 IDB 재읽기 불필요 — 4절 | 대체 | 코어의 문서별 세대 읽기를 제품 잠금 규칙으로 대체 |
| I7 discard 배타 | 코어 그대로 + 3절 포기 토큰 | 변경(코어) | LV-2 |
| I8 replace 거절 | 코어 그대로. `adopt` 중 편집(F12)은 `dirty` 거절로 막힘 | 유지 | QA-3 해소 |
| I9 같은 영속 직렬 | 탭당 포트 1개 → 코어 간 직렬은 `writeQueue` 직렬로 충분. 코어 `WeakMap` gate는 남겨도 무해 | 유지 | BD-1 2절 |

### 1.3 포트 (`CorePort`) — 코어가 부르는 영속 경계 (내부 인터페이스 신설 · MQ-6-1)

| 메서드(가칭) | 의미 | 제품 구현 재료 [L1] |
|---|---|---|
| `mode(): Promise<WriterMode \| "cleared">` | 쓰기 전 잠금 판정 | `gate.enter()` :122 · `cleared` 플래그 :137 |
| `head(projectId)` | 마지막 커밋 문서 레코드(hash·revision) | `persistence.get("docs", id)` · 시드 `LocalSync.docs` |
| `commit(projectId, doc, bound)` | 문서 + 바인딩 이미지 + 도장 1 트랜잭션. 참조 이미지가 바인딩·`stored`에 없으면 throw `image-missing`(제출 0) | `write` :155-183 + 엄격 `imageOps` |
| `verify(receipt)` | IDB 재읽기 증명(문서 hash·revision + 참조 이미지 레코드 존재) | `confirm` :197-207의 이미지 키 검사 + 문서 재읽기 |
| `image(id)` | 코어 바인딩에 없는 참조 이미지의 IDB 레코드 존재 | `keys("images")`/`get("images")` |

- 이 포트는 `LocalSync`(data 내부 인터페이스, `localSync.ts:43-56`)에 메서드를 더한다. `ProjectRepository`(공개)에는 **코어 접근자 1개**(`saveCore(projectId)` 또는 `studioRepository` 경유)가 더해진다 → 둘 다 MQ-6-1.
- 문서 모양: 코어 `CoreDoc{revision, body, imageIds}`는 하네스용 축약이다. 제품에서는 `PageDoc` + `DocHead`(revision·hash)를 쓰고, `imageIds` = 기존 `recordRefs(record)`(:201)로 계산한다. **PageDoc·엔진 계약 변경 0**이 목표다. 바뀌어야 하면 MQ.

## 2. 같은 탭 단일 소유자 (BD-1 · CE-3a 다른 어댑터 객체)

### 2.1 판정 — 제품 경로에서 어댑터는 탭당 1개 (조건부 보장)

| 사실 | 근거 [L1] |
|---|---|
| IDB를 여는 함수는 `openIdbPersistence` 하나, 호출자는 `openLocalSync` 기본 인자뿐 | `idbPersistence.ts:59` · `localSync.ts:92` (grep: 그 밖 호출 0, 테스트 제외) |
| `openLocalSync`는 `createDeferredStudio`의 `sync` 공유 로더로만 열린다 | `deferredStudio.ts:40,45` · `memoryProjectRepository.ts:49` `openLocal` |
| 공유 로더는 성공한 Promise를 탭 수명 동안 재사용, 실패면 비우고 다음에 다시 연다(실패 쪽은 `persistence.close()` 뒤 throw) | `sharedLoader.ts:5-13` · `localSync.ts:117-120` |
| `loadDeferredStudio`는 앱 시작 때 1회 | `main.tsx:30` |
| 쓰기 큐는 `LocalSync`마다 1개, 탭 전역 직렬 | `localSync.ts:154` · C5 F10 |

→ **코어가 `LocalSync` 포트만 쓰면 같은 탭에서 어댑터 2개는 생기지 않는다**(같은 탭의 `StudioPersistence` 밖 IDB 쓰기 3곳은 6.2 — 전부 멈춤 뒤 새로고침). final-qa의 BD-1 재현(`openIdbPersistence` 2회)은 제품 코드에 없는 경로다. 단 이것은 **구조 관례**이고 타입이 막지 않는다.

### 2.2 최소안 (구현 레인 규칙)

1. 코어는 `StudioPersistence`를 인자로 받지 않는다 — 포트만 받는다(1.3). 하네스의 `exclusive(WeakMap)`은 남겨도 되지만 제품 보장의 근거로 쓰지 않는다.
2. 코어 레지스트리(`projectId → Core`)는 **저장소 인스턴스에 매단다** — `createMemoryProjectRepository` closure, 편집기 이미지 맵 `maps`와 같은 자리(`memoryProjectRepository.ts:56`). 모듈 전역 Map 금지(테스트 간 공유 문제, save-core-fix 4절 `writerAlways` 교훈) — 저장소는 테스트마다 새로 만들어지므로 공유 0. 결정 3줄(r1 · QA R2):
   - **① 생성 시점**: 편집기 첫 마운트 때 `coreFor(projectId, seed)`가 **동기 생성**한다(seed = `useStudioDoc`이 받은 문서 · 증명 `hydrated`). 같은 projectId의 다음 마운트는 레지스트리의 같은 코어를 받는다. 하네스 `openSaveCore`의 async 열기(`readStored` await, `saveCore.ts:106-108`)는 쓰지 않는다 — IDB 머리(`head()`)는 첫 save·confirm 때 포트가 읽는다. MC 열기 조항 변경(D6-10 · MQ-6-1 ★A에 포함).
   - **② 소유 객체(local·memory 공통)**: 저장소 인스턴스. memory 모드에도 저장소는 있으므로(`memoryProjectRepository.ts:107` `persistence: "memory"`) 같은 레지스트리를 쓴다. 저장소는 `createDeferredStudio`로 탭당 1개이고 진입 closure(PROJECT_AUTO)에 이미 있다(9.1).
   - **③ 포트 없는 동안 `save()`**: `edit`·`view`·`acquire`·`release`는 포트 없이 동기 동작한다. **local** = `save()`가 먼저 포트(`local.sync()` + io 청크)를 기다린 뒤 커밋한다 — 같은 promise 안이라 화면은 `saving`. 로드 실패 = `failed`(청크 재시도 `retryableImport` 경유 → 기존 "다시 저장"). **memory** = 포트가 영원히 없다 → DocBook 메모리 커밋(지금 `saveDoc` 경로)을 한 뒤 `not-persistent`(I5). DocBook은 계속 문서를 받으므로 `/projects`·스냅샷은 memory 모드에서도 지금과 같다.
3. 가드 테스트(RS6-AC-G2): `openIdbPersistence` import 1곳(`localSync.ts`) · `openLocalSync` 호출 = `openLocal` 1곳 · 코어 모듈이 `idbPersistence`를 import 0. 기존 `pendingImportGuard.test.ts`·`tryLock` import 가드와 같은 방식.
4. **조건부 쓰기(G3)는 하지 않는다.** 필요해지는 경우 = 같은 탭에서 어댑터 2개 경로를 일부러 만들 때뿐이다. 그때는 `StudioPersistence` 변경(MQ)이다.

### 2.3 같은 프로젝트 코어 2개 (같은 탭)

- 편집기 재마운트·StrictMode·레이아웃 모드 전환(`StudioLayout.tsx:86-92` 하위 재마운트, UX-5 5.6)은 **코어를 새로 열지 않는다** — 레지스트리에서 같은 코어를 받고 `acquire(mountId)`만 다시 한다(MC H5-6 멱등).
- 코어를 닫는 경우는 3가지뿐: 프로젝트 삭제 · `cleared` · `stale` 뒤 사용자 새로고침(OBS-1 — 재열기 외 회복 없음 유지). 닫기 API는 코어에 없다(MC 4 CE-3a 근거 "close = 인터페이스 확장") → 레지스트리에서 지우는 것으로 대신하고 늦은 resolve는 레지스트리 밖 코어에만 기록된다(화면 영향 0).

## 3. liveness — LV-1 · LV-2 (시간 제한 · 취소 · 표시)

원칙 3개:
- **취소 0**: 시작된 IDB 트랜잭션·읽기는 취소하지 않는다(취소 수단 없음, C5 4.5 "취소" 행). 결과가 늦게 오면 코어에 기록한다.
- **시간 제한 = 관찰 전환**: 정해진 시간이 지나면 화면 상태와 버튼만 바꾼다. 코어 상태(chain·inflight)는 건드리지 않는다.
- **자동 재시도 0**: 사용자 조작이나 다음 편집 저장만 재시도한다(MC 5 "discarding 자동 재시도 없음" 유지).

| ID | 정지 지점 | 규칙 | 화면(UX-5 상태 대응) |
|---|---|---|---|
| LV-1 | 한 코어의 `commit` write가 끝나지 않음 → 같은 포트의 다른 save 무기한 대기 | **저장 감시(watchdog)**: 스케줄러가 `save()` 시작 시각을 잡고, `T_slow`가 지나도 resolve가 없으면 phase를 `saving-slow`로 바꾼다(코어 inflight 유지). 그 뒤 편집은 계속 `edit()`로 받는다(mark 증가 — I1이 newer로 처리). 두 번째 save는 chain에 줄 서지만 **스케줄러가 inflight 중 추가 save를 내지 않는다**(단일 비행 + resolve 뒤 최신 1회, C5 4.5 dedupe 행 승계) | `saving` 행 문구 뒤 꼬리 "· 브라우저 응답이 늦습니다"(status 1회). 버튼 0(누를 것이 없음). 보호(I8) on. `T_hang` 지나면 alert 1회 "브라우저가 저장에 응답하지 않습니다 — 이 탭을 닫으면 확인되지 않은 변경이 사라질 수 있습니다" + 버튼 없음 |
| LV-2 | `discard`의 IDB 읽기가 끝나지 않음 → `discarding` 고정, save·dirty confirm 계속 `failed{discarding}` | **포기 토큰**: discard 진입 때 토큰을 만들고 `T_discard` 뒤 resolve가 없으면 토큰을 무효화하고 `discarding = false`로 풀고 결과 `blocked{timeout}`을 돌려준다. 늦게 온 읽기 결과는 토큰이 다르면 **버린다**(doc·attached·savedMark·epoch 변경 0). 초안·바인딩은 보존 | 폐기 대화상자 진행 표시(`aria-busy`) → 시간 초과면 대화상자 안 alert "버리지 못했습니다 — 변경은 그대로 있습니다" · 포커스 "취소" 유지 |
| (공통) | `confirm()`이 save 뒤 `verify` 읽기에서 정지 | 버튼 `aria-busy` 유지 · `T_slow` 꼬리 문구는 LV-1과 같음. 연타는 진행 중 promise 공유(C5 4.5 dedupe — 코어에는 없음, 화면 훅 몫, CE-4 "동시 confirm = write 2회" 회피) | UX5-AC-07 |
| (공통) | 이탈(POP·링크) 중 inflight · 링크 이동 고착(6.5) | 코어는 탭 수명이라 계속 소유한다. **편집기 lease 해제(언마운트 cleanup) 때 마지막 제출 뒤 편집이 있으면 `core.save()` 1회**(링크·POP·재마운트 공통, 대기 없음) → 앱 안 링크는 저장 완료를 기다리지 않고 이동한다(`flushBeforeLeave`의 저장 대기 제거). 예외(클릭 시점 상태, **지금 동작 기준**): `readonly`·`unsupported` = 이동 · `failed`·`offline`·`stale`·`cleared` = 보류(지금 `leave()` 그대로). 세부·테스트 대응 = 3.1 · MQ-6-7 | `/projects` 행 "저장 중…"(UX-5 2.3) · 탭 수준 떠나기 경고(3.1) |

- 시간 값(`T_slow`·`T_hang`·`T_discard`)은 **이 문서에서 정하지 않는다.** 근거 없는 수치를 만들지 않기 위해, 구현 레인 L2가 가짜 지연 주입(`createMemoryPersistence({commit})` :28)으로 테스트를 고정하고 값은 상수 1곳에 둔다. 제안 기본값과 그 근거는 MQ-6-3에서 결정한다.
- LV-2 포기 토큰은 MC I7 "읽기가 끝나지 않으면 가드도 풀리지 않는다"를 **바꾼다** → MQ-6-3(코어 계약 변경). 안전성 근거: 늦은 결과를 버리므로 폐기 초안 부활·바인딩 오염 0 — CE-1·CX-3 테스트는 그대로 GREEN이어야 한다(RS6-AC-U5).

### 3.1 링크 이탈 · lease 해제 저장 · 탭 수준 경고 (r1 — QA R1 · 결정 = MQ-6-7)

1. **save 주체 = lease 해제**: `StudioLayout`의 `acquire`/`release` effect cleanup이 `release(token)` 전에 "마지막 제출 mark 뒤 편집 있음"이면 `core.save()`를 1회 낸다(결과를 기다리지 않음). 링크·POP(RS4-R8)·레이아웃 재마운트·StrictMode가 같은 경로라 링크 핸들러에만 두지 않는다. 편집이 없으면 0회(RS6-AC-U6 "편집 없으면 mark 변화 0"과 일치) · 재마운트 때 1회 나가도 스케줄러가 곧 낼 저장을 앞당긴 것뿐이다(RS6-AC-U7 = 최대 1회).
   - save-on-leave가 언마운트 저장을 버린 이유("진행 중 저장과 같은 revision으로 겹쳐 STALE" · 스케줄러 "dispose 뒤 저장 0" 단언, `save-on-leave/REPORT.md:90`)는 코어에서 성립하지 않는다 [L1-추적]: 제출 mark가 고정되고(I1) 저장이 코어 chain으로 직렬이라(I2) 두 번째 save는 앞 커밋 뒤 다음 revision으로 나간다. 스케줄러 `dispose`는 그대로 저장 0이다 — 저장은 스케줄러가 아니라 lease 해제가 낸다(`useAutosaveScheduler.test.ts:321,387` 유지).
2. **탭 수준 `beforeunload` 소유자 = 코어 레지스트리**(저장소 인스턴스, 2.2-2): 코어 중 하나라도 `dirty` 또는 `inflight`면 등록, 모두 0이면 해제. memory 모드는 코어가 1개라도 있으면 늘(`needsUnloadGuard` "메모리 늘" 승계, `useAutosaveScheduler.ts:67-70`). 편집기 훅 경고(`:283-292`)는 L3에서 이 경고로 옮긴다(리스너 중복 0). `pendingWrites` 모듈 경고(`pendingWrites.ts:61-71`)는 `PendingStart`·`PendingRecord` 몫으로 그대로 둔다. → 편집기를 떠난 뒤 `/projects`에서 탭을 닫아도 코어 dirty·inflight면 경고가 뜬다.
3. **예외 목록(클릭 시점 상태 — 지금 동작 기준)** [L1 `StudioLeave.test.tsx` 14건 GREEN · `save-on-leave/REPORT.md:92,95`]:
   - 이동: `readonly`(거절 · `:158,173`) · `unsupported`(Web Locks 없음 로컬 · `:199`). 편집은 코어에 남고 해제 save가 거절돼도 반영 0.
   - 보류: `failed`(`:127` 뒤 절반 · `:225,235` — 클릭 시점이 이미 실패일 때) · `offline`(출처 = 스케줄러 `navigator.onLine` → phase `offline`, `useAutosaveScheduler.ts:25` — 8.1에는 offline 행이 없어 스케줄러 phase를 그대로 쓴다 · `:211`) · `stale`·`cleared`(새로고침이 출구 · `save-on-leave/REPORT.md:92`). 보류 경로 동작은 **지금 `leave()` 그대로** — 클릭 → 저장 1회 → 성공이면 이동, 아니면 보류(`useDocSave.ts:142-146`).
   - 바꾸려면 MQ(MQ-6-7 B·C).
4. **`StudioLeave.test.tsx` 14건 대응(r1 설계 기준)** — 유지 7 · 의미 변경 6 · 폐기(이전) 1:

| 행 | 지금 | r1 | 판정 · 사유 |
|---|---|---|---|
| :99 저장 중 추가 편집 → 마지막 편집 반영 뒤 이동 1회 | 저장 뒤 이동 | 즉시 이동 · 해제 save가 진행 중 저장 뒤 마지막 편집 1회(chain) | 의미 변경 — 단언을 "이동 1회 · 해제 뒤 IDB = 마지막 편집"으로 |
| :114 저장 전 변경 → 저장 끝까지 대기 | 대기 | 즉시 이동 · 해제 save 1회 | 의미 변경 — RS6-AC-U12로 대체 |
| :127 실패 → 보류 · 다음 클릭 다시 저장 → 성공 이동 | 보류 | 클릭 시점 dirty면 즉시 이동(뒤 실패는 `/projects` 행 + 탭 경고). 클릭 시점 `failed`면 보류·다시 저장·성공 이동 | 의미 변경 — 앞 절반(dirty 클릭) 변경 · 뒤 절반은 시작 상태를 `failed`로 옮겨 유지 |
| :144 대기 중 연타 = 저장 1·이동 1 | — | dirty 클릭에는 대기가 없음 | 폐기(이전) — 대기는 보류 경로에만 남으므로 "`failed` 상태 클릭 대기 중 연타 = 저장 1·이동 1"로 옮긴다 |
| :158 읽기 전용 거절 → 이동 · 반영 0 | 이동 | 이동 · 해제 save 거절 · 반영 0 | 유지 |
| :173 읽기 전용 · 저장 전 변경 채로 떠나도 이동 | 이동 | 이동 | 유지 |
| :184 거절 뒤 쓰기 가능 → 저장 뒤 이동 | 저장 뒤 이동 | 즉시 이동 · 해제 save가 writer를 잡고 저장(지난 거절로 건너뛰지 않음) | 의미 변경 — 단언을 "이동 + IDB 반영"으로 |
| :199 Web Locks 없음 로컬 → 이동 | 이동 | 이동(`unsupported`) | 유지 |
| :211 거절 뒤 오프라인 → 보류 · 저장 0 | 보류 | 보류(`offline`) | 유지 |
| :225 메모리 저장 실패 → 보류 | 보류 | 클릭 시점 dirty면 이동(memory 탭 경고 늘) · `failed` 클릭이면 보류 | 의미 변경 — 시작 상태를 `failed`로 옮기면 보류 단언 유지 |
| :235 일반 저장 실패 → 보류 | 보류 | 같음(local) | 의미 변경 — 같음 |
| :244 수정 키 · :252 `a[download]` · :266 변경 없음 | 통과 | 통과 | 유지 3 |

## 4. H4 — 다른 탭·낡은 증명과 실제 Web Locks·writerLock 결합

| 상황 | 제품 규칙(유지) [L1] | 코어 결과 | UX-5 |
|---|---|---|---|
| 첫 쓰기 전 | 잠금 요청 안 함(진입·읽기만으로 안 잡음) | — | — |
| 첫 save | `gate.enter()` → `ifAvailable` 요청 → 잡으면 `fresh()`(meta.generation == hydrated && 상태 키 존재) | 포트 `mode()` = `writer`/`readonly`/`stale`/`unsupported` → 코어 `failed{mode}`(:146-147) | `readonly`·`stale`·`unsupported` 행 |
| writer 잡음 | 탭 수명 동안 보유(끝나지 않는 Promise), steal 0 | 이후 커밋은 다른 탭과 경쟁 0 → **I6b 문서별 세대 재읽기 불필요** | — |
| readonly | 다음 `enter()`에서 다시 요청 | `failed{readonly}` · 다른 탭이 닫힌 뒤 "저장 확인"/"다시 저장"이 writer를 잡고 `fresh()` 실패면 `stale` | `readonly` → 그 뒤 `stale` |
| 다른 탭이 지움 | `cleared` 브로드캐스트 → `stop()` | 포트 `mode()` = `cleared` → `failed{cleared}`(코어 reason 추가 — 포트 값 통과) | `cleared` |
| confirm wrote:false | `mode()==="writer"` + `verify`(IDB 재읽기 == 마지막 증명) | `confirmed{wrote:false, proof:"fresh"}` · readonly면 `failed{readonly}`(MC G5 보수적 선택 유지) | 영구 확인 5조건(UX-5 3절) |
| 열기 증명 | 하이드레이트는 `proof:"hydrated"` — 재사용 0 | I4 | C5 I5b·QA-1 해소 |

- 결합 규칙 요약: **"세대 검사는 잠금 획득 때 1회(`fresh`), 증명은 확인 때마다(`verify`)"**. 코어 하네스의 커밋마다 세대 재읽기(I6b)는 제품에서 `fresh()` + 배타 잠금으로 대체한다. 근거: 제품 `meta.generation`은 탭 간 도장이고 writer 탭 안에서 계수로 충분하다고 이미 결정돼 있다(`localSync.ts:125-127` 주석 · ADR-007 개정 2).
- final-qa 실제 IDB 프로브(5-1 #11~13: B 닫힘 → A `stale`)가 이 규칙의 실측 근거다. 제품 통합 뒤 같은 시나리오를 **제품 화면**에서 다시 본다(RS6-AC-B3).
- 남는 것: OBS-1(stale 뒤 회복 = 새로고침뿐) 유지 · CE-4(동시 confirm write 2회)는 화면 dedupe로 막음(3절).

## 5. 편집기 연결 — 생명주기 · 스케줄러 · DocBook(G1·G2·G7·G8)

> 행 근거는 6.3·6.4 trace 표.

| gap | 결정 | 근거 |
|---|---|---|
| G1 메모리 커밋 층(DocBook) | **필드별 작성자 1명**: `docs/{projectId}` 레코드의 **문서 필드 작성자 = 코어 단독**, **스냅샷 필드(`snapshots`·`snapshotSeq`) 작성자 = DocBook**, 둘 다 같은 `writeQueue`로 직렬. 포트 `commit`은 기존 `write`(`localSync.ts:155-157` — 레코드를 `book.docOf`에서 만듦)를 그대로 쓰지 않고, **"코어 동결 doc + 제출 시점 DocBook snapshots"로 레코드를 만드는 변형**을 쓴다(그대로 쓰면 아직 DocBook에 없는 코어 doc 대신 옛 문서가 써진다). 코어 `saved` resolve 뒤 DocBook 문서를 같은 doc으로 맞춘다(`memHead` 동기) · 실패면 DocBook 변경 0. restart·복원·충돌 해결은 6.4대로 `core.replace` 경유라 문서 필드를 DocBook이 직접 바꾸는 경로가 남지 않는다. **(r1 · QA R7) DocBook 경로 레코드 재쓰기도 같은 규칙**: `createSnapshot`·`deleteSnapshot`·`requestExport`·`confirmDoc`·`startDoc`(→ `kept` → `LocalSync.flush` → `write`, `memoryProjectRepository.ts:65-66,86-89,122,131,134`)는 그 projectId 코어의 **chain 뒤에서 레코드를 만든다**(코어 inflight가 끝난 뒤 `write` 호출) · 문서 필드 = 코어의 마지막 커밋 doc(레지스트리에 코어가 있으면, 없으면 DocBook) · 이미지 GC 기준 = 그 doc의 참조. 이유: 지금 `write`는 레코드를 **제출 시점**에 `book.docOf`로 만든다(`localSync.ts:155-157`) — 코어 N+1 진행 중 제출되면 doc N이 뒤에 써져 IDB가 되돌고 같은 트랜잭션 GC가 N+1의 새 이미지를 지운다. RED = RS6-AC-U14. → C5 F2·F3·QA-4를 함께 닫는다. 다른 화면은 DocBook을 계속 읽는다 | C5 F2·F3 · rs5-review QA-4 · 6.4 |
| G2 디바운스 | `change`마다 `core.edit(doc, newBlobs)` **동기 1회**. 스케줄러 디바운스는 **save 시점**만 정한다. 비용 = 동결 사본 1개(엔진 문서 객체는 이미 불변이면 얕은 동결) | MC G2 · C5 I8 `mark` |
| G7 lease ↔ 재seed | 마운트 effect: `token = acquire(mountId)` → `view()`로 doc·바인딩·dirty를 받아 편집기 state를 다시 seed(StrictMode 2회째도 같은 토큰이라 결과 같음). render 중에는 `view()`만 | C5 4.5 StrictMode 행 · MC H5-6 |
| G8 start 상태 | 코어는 `retryStart`만 있고 `held` 상태가 없다 → start 상태는 **기존 `pendingWrites` `PendingStart`를 유지**(이미 main, `/projects`·프로필이 읽음). 코어는 start-pending 동안 save를 막지 않는다 → UX-5 G10 ★(편집기 진입 막기 + 편집기 안 Callout) 그대로 | SPEC-4 3절 · UX-5 G10 |
| 이미지 ingest 중 이탈 | `edit()`는 ingest 완료 뒤에만(Blob 확정). ingest 중 이탈 보호는 UX-5 G9 그대로(범위 밖) | C5 4.6-5 |

## 6. 제품 trace 근거 (서브에이전트 ①② · 읽기 전용 · [L1])

### 6.1 코어를 그대로 import하면 깨지는 것 (1절 결론 1의 근거)

| 충돌 | 코어 | 제품 | 결과 |
|---|---|---|---|
| 문서 레코드 | `docs/{id}` `kind:"core-doc"`만 인정(`saveCore.ts:84,156`) | `kind:"doc"` + `DocRecord{doc, snapshots, snapshotSeq}`, 모양이 다르면 `unreadable` throw(`localSync.ts:74-81,165`) | 같은 키에서 서로의 레코드를 거부 — 코어는 undefined, 제품 열기는 INFRA 실패 |
| 이미지 레코드 | `images/{id}` `kind:"core-image"`, Blob 포함(`:160`) | 키 `${projectId}/${localId}`, `kind:"image"`(`imageOps.ts:27` · `imageRecord.ts:20`) | 형식 2개 |
| 세대 | 문서 레코드 안 `generation`(`:153-154`) | `meta/generation` — `fresh()`·가져오기·삭제가 읽음(`localSync.ts:99-103,129-135` · `writeImport.ts:106-109`) | 코어가 meta 세대를 올리지 않으면 다른 탭 `fresh()`가 코어 쓰기를 못 봄 = **H4 회귀** |
| 직렬 | 코어 chain + `WeakMap` gate(`:99-104,124`) | `writeQueue.tail`(`writeQueue.ts:37,69`) | 같은 persistence 위 체인 2개 = 서로 순서 보장 0 |
| cleared·saved | 우회 | `committed` 래퍼가 cleared 멈춤 + `saved` 전송(`localSync.ts:140-153`) | 직접 write면 cleared 탭이 계속 씀 |
| 잠금 | `WriterCheck.mode()` | `gate.enter()`(`:122`). Web Locks는 재진입 불가 → 같은 탭 두 번째 gate는 `readonly` | 코어가 자기 gate를 만들면 자기 탭을 막음 |

→ 그래서 1.3 포트 `commit`은 **`write`(:155) → `queue.submit` → `committed` 경로를 그대로 탄다**(도장·cleared·saved 전송 유지). 코어는 영속을 직접 만지지 않는다.

### 6.2 BD-1 추가 사실 — 같은 탭에서 `StudioPersistence` 밖 IDB 쓰기

| 경로 | 쓰기 | 뒤처리 | 코어 영향 |
|---|---|---|---|
| `deleteProject.ts:89` | IDB 직접 | `hold.stop()` 후 새로고침 이동(`:146-147`) | 새로고침으로 코어 소멸 — 경쟁 0 |
| `writeImport.ts:48` | IDB 직접 + meta gen +1 | 같음(`:163-164`) | 같음 |
| `clearBrowserData.ts:52` | `deleteDatabase` | 같음(`:47`) | 같음 + 다른 탭은 `cleared` 수신 |

- 셋 다 "멈춤 → 새로고침"이라 코어와 겹치는 시간이 없다 [L1-추적]. 단 **멈춤 전 진행 중 코어 save**가 있으면 `committed`의 cleared 검사가 막는지 구현 레인이 RED로 확인한다(RS6-AC-U10).

### 6.3 편집기 생명주기 (서브에이전트 ②)

| 모듈 | 사실 | 코어 연결 |
|---|---|---|
| `useAutosaveScheduler.ts` | phase `idle·dirty·saving·saved·failed·offline·stale`(:25) · 디바운스 2000ms·최대 30000ms(:57-58) · 단일 비행(:181-190) · `dispose`는 타이머만 지움 — 디바운스 편집 버림, 진행 저장 콜백 무시(:134-137,193,207) · `beforeunload`(:283-292) | 저장 대상만 `core.save()`로. dispose 손실은 `edit()` 동기 등록으로 소멸(G2) |
| `useDocSave.ts` | 훅 층 유일 저장 호출 `repository.saveDoc`(:69) · `revisionRef`(:61) · readonly 판별 = 문자열(:74) · `edit/resolve/flushed/adopt/leave`(:87-147) · 언마운트 정리 없음 | `saveDoc` 직행 → 코어 경유. readonly 판별 → 포트 `mode()`(문자열 매칭 제거) |
| `StudioLayout.tsx` | `useDocSave` 1회(:80) · 앱 안 링크 `flushBeforeLeave`(:130-148, :430·464·509) · POP·주소 입력 미차단 · `key={projectId}`(`StudioPage.tsx:34`) | 링크 이탈 규칙 변경(3절 LV-1) |
| `useStudioDoc.ts` | `getProject`+`getDoc` 읽기만(:22) · 재마운트가 진행 중 저장을 기다리지 않음 → 거짓 `STALE_DOC` 경쟁(SPEC-4 N3) | 재진입 seed = `core.view()`(DocBook 읽기 아님) → 경쟁 소멸 |
| `pendingWrites.ts` | `PendingStart·PendingRecord`만(:32), 저장소 키 WeakMap(:47), 모듈 `beforeunload`(:65-71) | `PendingStart` 유지(G8) · `PendingRecord`는 코어 `confirm`으로 대체 후보(구현 레인 판단, 행 문구 유지) |
| 리스너 | `pagehide`·`visibilitychange` 0건(grep) | 추가하지 않음(모바일 손실은 12절 그대로) |

### 6.4 revision을 올리거나 문서 레코드를 다시 쓰는 다른 쓰기 — 코어가 조율해야 하는 곳

- revision을 실제로 올리는 곳 [L1 · QA F4]: `memoryDocBook.ts` `save`:368 · `restoreSnapshot`:316 · `resolveConflict("mine")`:335 · `start("restart")`:396 (+ DocBook 밖 `writeImport.ts:110`). 아래 표의 스냅샷 생성·삭제·내보내기는 revision을 올리지 않지만 **레코드를 통째 다시 쓴다**(5절 G1 r1 규칙 대상).

| 쓰기 | 위치 | 코어 규칙 |
|---|---|---|
| 충돌 해결 `resolveConflict` | `useDocSave.ts:100` | 해결 결과 문서 → `core.replace(doc, {intent, expectedEpoch})`. dirty면 거절 → 선택 전에 편집 잠금(UX-5 MQ-5-5 ★A) |
| 스냅샷 복원 `adopt` | `SnapshotPreview.tsx:93` → `useDocSave.ts:129-140` | 같음(F12 덮어쓰기는 `rejected{dirty}`로 막힘 → "저장 뒤 다시 복원" 안내) |
| 스냅샷 생성(전 `flushed`) | `SnapshotDialog.tsx:152` | "저장 먼저" 대기(revision 변화 0)는 `core.save()` 결과 대기로 대체 — 정지 시 3절 감시. 생성 자체 = DocBook 레코드 재쓰기 → G1 r1 규칙 |
| **스냅샷 삭제 `deleteSnapshot`** (r1 추가) | `SnapshotDialog.tsx:260` → `memoryProjectRepository.ts:128` `write` → `kept`(:65-66) → `flush` | "저장 먼저" 대기 없음 · revision 변화 0 · 레코드 통째 재쓰기 → G1 r1 규칙(코어 chain 뒤 · 코어 doc) · RS6-AC-U14 |
| 내보내기 | `useExportFlow.ts:57-62`(`proceed` 분기) | 내보내기 전 저장 = `core.save()` 경유 · 잡 기록은 레코드 재쓰기 → G1 r1 규칙 |
| 편집기 밖 `confirmDoc`·`startDoc` | `restartFlow.ts:135`(`confirmDoc`) · `:166`(`startDoc`) | restart 재생 = `starter`. 레지스트리에 코어가 있으면 `replace`, 없으면 다음 열기가 새 시드. 레코드 재쓰기는 G1 r1 규칙 |

### 6.5 liveness 현재 사실 (서브에이전트 ②)

- `AbortController` 0건 · 저장 경로 `Promise.race` 0건 · IDB 무응답 타임아웃 0(`idbPersistence.ts:56,64-66`은 오류·abort·blocked만).
- 저장 정지 시: "저장 중…" 무기한(`saveStatusText.ts:45`) · "다시 저장" 없음(`SaveStatus.tsx:57`, `retry` no-op :102) · `flushed()` 미완 → **앱 안 링크 이동이 막히고 `leaving.current`가 남아 다시 눌러도 무시**(`StudioLayout.tsx:135-142`) · 스냅샷 생성·복원 대기 · `writeQueue` 뒤 쓰기 전부 막힘. 빠져나갈 길 = 새로고침·탭 닫기뿐.

## 7. CP4 흡수 판정 (RS4-R1)

| 항목 | 내용 |
|---|---|
| CP4가 하던 일 | 편집기가 `PendingDraft`/`PendingRecord`를 진입 때 읽고(`unconfirmed`/dirty 복원), 떠날 때 `hold(PendingDraft)` — RS4-R1(history 재진입 거짓 idle)·RS4-R8(POP 편집 소실) 해소 [L1 SPEC-4 5.3·5.6] |
| 코어에서 같은 일 | 코어 = 탭 수명 객체. 떠날 때 할 일 = 마지막 제출 뒤 편집이 있으면 `core.save()` 1회 + `release(token)`(3.1-1 · 초안·바인딩은 이미 `edit()`로 코어에 있음). CP4 `hold(PendingDraft)`가 하던 언마운트 뒤 떠나기 경고는 레지스트리 탭 수준 경고가 대신한다(3.1-2). 재진입 = `acquire` + `view()` seed. **`PendingDraft` 타입·`hold`·`studioHandoff` 경로가 필요 없다** |
| 판정 | ★ **흡수**(MQ-6-4 A). 별도 CP4를 먼저 넣으면 RS6에서 그 경로(`pendingWrites` 진입 정적 638B · `StudioLayout` +622B, raw — `rs4-cp4-measure/REPORT.md:57`)를 다시 걷어내야 한다 |
| 진입 바이트 공유 | CP4의 "진입 정적 조회"(배치안 a) 몫과 코어의 진입 몫은 **같은 자리**(편집기 마운트 effect·상태 표시)다. 흡수하면 진입 증분은 1번만 생긴다. 다만 얼마인지는 **미측정** — 기존 CP4 수치(+0.80)와 C5 S5b(+753B)를 더하거나 빼서 추정하지 않는다 |
| 상쇄 | 코어가 대체하는 진입 코드 후보(`useDocSave` `revisionRef`·`base()` 보정·`adopt`, 스케줄러 dispose 경로)를 **같은 스파이크에서 제거해** 잴 때만 상쇄로 인정한다(9.3 S6c). 제거 목록 = L0 REPORT 파일:행 고정 · L3가 같은 목록을 머지할 때만 유효(r1) |
| 별도 유지가 맞는 경우 | MQ-6-4 B — 측정 관문 L0이 실패하고 예산 상향도 거절되면, RS6 범위를 "편집기 밖 저장 확인(코어 io 청크만)"으로 줄이고 RS4-R1은 열린 채 둔다 |

## 8. UX-5 상태 · 버튼 ↔ 코어 메서드

### 8.1 상태 판정 (UX-5 2.1 축 → 코어·포트 출처)

| UX-5 상태 | 판정 출처 | 비고 |
|---|---|---|
| `memory-only` | `persistence === "memory"` 또는 결과 `not-persistent` | 코어 I5 |
| `unsupported` | 포트 `mode()` = `unsupported` 또는 결과 `unsupported` | UX-5 G5 — 포트가 구별 필드가 된다 |
| `readonly` · `stale` · `cleared` | 포트 `mode()` / 결과 reason 같은 이름 | 4절 |
| `dirty` | `view().dirty && !view().inflight` | 코어 `mark > savedMark` |
| `saving` (+ `saving-slow`) | `view().inflight` (+ 3절 감시) | LV-1 |
| `unconfirmed` | `confirmed.proof === "hydrated"` 이고 편집기 밖 미확인 기록이 있음, 또는 마지막 결과 `failed`인데 편집기 밖 | UX-5 2.2 "한 상태에 버튼 1개" 규칙 유지 |
| `image-missing` | 결과 `image-missing` | 슬롯 식별 UX-5 G7 |
| `conflicted`(편집기 phase `stale` 포함) | **같은 탭 교체** = `replace`의 거절(`rejected{dirty}`·`{epoch}`) — 복원·restart·충돌 해결이 미저장 편집과 부딪힘 · **다른 탭** = 포트 `mode()`(`readonly`·`stale` — 이 경우는 `stale` 행으로 보냄) · IDB head 불일치는 `verify` 실패(`not-committed`)로만 다룬다(커밋마다 head 재읽기는 없음 — D6-3) | 아래 8.2 G2·G4 |
| 영구 확인 | `confirm()` = `confirmed` · 그 뒤 `view().mark` 변화 0 · local · 포트 정상 | UX-5 3절 5조건 |
| `newer` | `confirm()` = `newer` 또는 `save()` `newer:true` | 상태 글자는 새 세대 기준(UX-5 3절) |

### 8.2 버튼 1:1

| 버튼(UX-5 문구 재사용) | 코어 메서드 | 1:1 | 비고 |
|---|---|---|---|
| "저장 확인" | `confirm()` | 1:1 | 코어는 dirty면 save 후 verify — **UX-5 G6 해소**(마운트 중 dirty여도 거짓 확인 0). 그래도 UX-5 MQ-5-3 ★A(편집기 안 dirty일 때 숨김)는 유지 — 버튼 1개 규칙 |
| ★"다시 저장" | `save()` | 1:1 | |
| "시작 다시 시도" | `retryStart()` | 1:1 | starter = 기존 재생 함수 |
| "지금 문서 유지" | **없음** | ✗ | UX-5 G3 그대로 — `PendingStart` 해제(코어 밖, `pendingWrites`). MQ-6-5 |
| "내 초안으로 저장"(충돌) | **없음** | ✗ | 코어 `replace`는 dirty면 거절, `save`는 stale이면 거절. 기존 `resolveConflict("mine")` 뒤 `replace`가 필요 → MQ-6-5(UX-5 G2) |
| "바뀐 문서 쓰기"(충돌) | `discard()`가 **아님** | ✗ | 코어 discard는 "이 코어의 마지막 증명"으로 복귀 — 교체 문서(theirs)가 아니다. 같은 탭 교체면 `replace(theirs)`, 다른 탭이면 새로고침(OBS-1) → MQ-6-5(UX-5 G4) |
| "확인되지 않은 변경 버리기" | `discard()` | 1:1 | 결과 `blocked{newer\|stale\|no-saved-state\|timeout}`·`rejected{inflight\|discarding}` 문구는 MQ 아님 — 9.3 표 |
| "버리고 새로고침" | `discard()` + `location.reload()` | 1:1(+브라우저) | stale·cleared에서는 discard가 `blocked{stale}` → 바로 reload(초안 폐기는 reload가 함) |

### 8.3 결과 reason → 문구 (UX-5 2.3 재사용)

| 코어 reason | UX-5 행 | 문구 |
|---|---|---|
| `not-persistent` | memory-only | ★"이 탭에 저장됨" |
| `unsupported` | unsupported | UX-5 문구 |
| `readonly` / `stale` / `cleared` | 같은 이름 | ★ UX-5 2.3 |
| `image-missing` | image-missing | "이미지 {n}개를 저장하지 못했습니다" |
| `not-committed` | failed(infra-unknown) | ★"저장하지 못했습니다" |
| quota·abort(`toInfra` 메시지 문자열) | failed | ★"저장하지 못했습니다 · 저장 공간 부족" — 문자열 매칭(MC G6) 대신 포트가 코드로 분류해 넘긴다(포트 내부 — 코어 reason 값 1개 추가) |
| `discarding` | (표시 없음) | 화면 버튼 `aria-busy` 중 — 사용자에게 사유 노출 0, 폐기 결과 뒤 다음 편집 저장이 이어 받음 |
| `inflight` · `dirty` · `epoch` · `intent-required` | (프로그래머 오류/경쟁) | 화면 문구 0 — 개발 경고. `inflight`는 버튼 비활성으로 도달 0 |
| `timeout`(3절 신설) | 폐기 대화상자 | "버리지 못했습니다 — 변경은 그대로 있습니다" |

### 8.4 접근성 (UX5-AC 승계 + 추가)

- alert = `SaveStatus` 1곳, status = 편집 알림 1곳(UX5-AC-01). `saving-slow` 꼬리는 status 1회, `T_hang`은 alert 1회.
- 버튼 진행 중 `aria-busy` + `aria-disabled`, `disabled` 금지(UX5-AC-07). 연타 = 진행 중 promise 공유.
- 재진입 seed `conflicted`에서만 포커스 이동(UX5-AC-04). 폐기 대화상자 시간 초과 시 포커스 "취소" 유지.

## 9. 예산 — 진입 closure 배치 · 측정 선행 관문

### 9.1 지금 사실 [L1]

| 항목 | 값 | 출처 |
|---|---|---|
| `/studio` 정규화 / 판정선 | 128.09 / 128.53 (여유 0.44) | `studio-preload-slim/REPORT.md:30-33,48` |
| `/studio` raw / 한도 | 129.40 / 130 (여유 0.60) | 같음 |
| 복원 진입 정규화 / 판정선 · raw 한도 | 131.07 / 131.51 · 132.43 / 134 | 같음 |
| 판정 방식 | 정규화 = 기준선 잠금(멈춤 > 128.53·131.51), raw = 한도(130·134) 둘 다 통과 | ADR-004 개정 16 :265-270 |
| 진입 closure | `StudioPage` + EAGER_DYNAMIC + PROJECT_AUTO(`deferredStudio`·`memoryProjectRepository`) + `StudioLayout` + `gateCheck` (+ 복원 `imageRestore`) | `check-bundle-size.mjs:51,136-152` |
| 진입 쪽 저장 모듈 | `useDocSave`·`useAutosaveScheduler`(StudioLayout 청크) · `projectRepository` · `memoryProjectRepository` | `StudioLayout.tsx:17` · `useDocSave.ts:18` |
| 조작 뒤 저장 모듈 | `memoryDocBook`(:41 동적) · `localSync`(`memoryDocBook.ts:144` 동적) · `writeQueue`(localSync 정적) | 같음 |
| CP4 조합+a | 정규화 129.33(+0.80) · raw 130.70(+0.70) · 하한 | `rs4-cp4-measure/REPORT-M2.md:1,13-14` |
| C5 장부 S5a-r / S5b | raw +417B / +753B (preload-slim 이전 base 129896) · 정규화 미측정 | `rs5-spike/REPORT.md` 3절 |
| 코어 자체 | **미측정** | — |

### 9.2 배치 — 진입 closure에 들어올 것 / 조작 뒤 청크로 보낼 것

| 조각 | 배치 | 이유 |
|---|---|---|
| 코어 상태 부분: 초안·`mark`·`savedMark`·바인딩 Map·`edit`·`view`·`acquire`/`release`·epoch · **레지스트리**(`coreFor` — 저장소 인스턴스, 2.2-2) | **진입**(편집기와 같은 closure · 레지스트리는 `memoryProjectRepository` 쪽 PROJECT_AUTO) | `edit`는 편집마다 동기(G2), `view`는 render 중 동기, cleanup `release`는 동기, 코어 생성도 마운트 때 동기(2.2-2 ①) |
| 코어 io 부분: `save`/`commit` 호출·`confirm`·`discard`·`replace`·`retryStart`·`verify`·reason 분류 | **조작 뒤** — `localSync` 청크(포트 구현과 같은 청크) | 첫 save는 편집 뒤 디바운스(비동기)라 lazy 가능. 이미 `memoryDocBook`→`localSync`가 조작 뒤 |
| 포트 `CorePort` 구현 · 엄격 imageOps | 조작 뒤(`localSync`) | 같은 이유 |
| 감시(watchdog) 타이머 · `saving-slow` 문구 | 진입(스케줄러 안 상수·분기 1개) | 저장 중 표시 |
| 충돌 선택·폐기 대화상자 본문 | 조작 뒤(lazy) — **단** 조건부 자동 import는 rs4-cp4-measure 배치안 b′처럼 공통 런타임 청크를 만들 수 있다(`/profile` 100.13 초과 사례) → 측정 시나리오에 포함 | `rs4-cp4-measure/REPORT.md:11,52` |
| `/projects` 행 확인 UI | `/projects` 청크(진입 0 목표) | UX-5 9절 |

- **이 표는 배치 원칙이지 크기 약속이 아니다.** S5c에서 lazy 분리가 진입 절감으로 측정되지 않은 사례가 있다(`rs5-spike/REPORT.md` 4절).

### 9.3 측정 선행 관문 (L0 — Developer 스파이크, 앱 커밋 0)

| 시나리오 | 내용 | 판정 |
|---|---|---|
| **S6-base** | main `c7a7a2a8` 재빌드 = 128.09/129.40 재현 확인(dist sha 기록) | 재현 실패면 중단 |
| **S6a** | 코어 상태 부분(진입) + io 부분(localSync 청크) + 포트 — 편집기 호출 배선 없음(하한) | 정규화 ≤ 128.53 · ≤ 131.51 · raw ≤ 130 · ≤ 134 |
| **S6b** | S6a + 편집기 배선(`edit`·`acquire`/`release`·seed·`save` 경유·상태 표시) = CP4 흡수판. **배치 = 2.2-2 결정 3줄 그대로**(레지스트리·동기 생성 = 저장소 인스턴스 쪽 진입 · 포트는 첫 `save()` 때 `localSync` 청크) — 이 배치의 진입 영향은 S6a(레지스트리 포함)·S6b가 잰다 | 같음 |
| **S6c** | S6b + 대체 코드 제거(`revisionRef`·`base()`·`adopt` 경로·dispose 경로 중 코어가 대신하는 것) — **상쇄 실측**. (r1 · QA R5) **제거 목록은 L0 REPORT에 파일:행으로 고정**하고, L3가 **같은 목록을 실제로 머지할 때만 상쇄가 유효**하다 — 목록이 다르면(빼지 못한 줄·더 뺀 줄) 그 머지 전에 재측정 | 같음 |
| **S6d** (측정 전용, UNAPPROVED) | S6c + 충돌/폐기 본문 lazy 조건 참 | 한도 미승인 — 수치만(`EXTRA_SCENARIOS`, `rs5-spike/tools/rawbytes.mjs`) |
| 공통 | `/profile`·`/projects`·`/catalog` 첫 화면·진입 동시 기록(공통 런타임 청크 분리 감시) | 기존 한도 |

- 도구: 정식 = `cd app && npm run build` exit·출력(정규화 줄 + raw 줄). 청크 귀속 = `dev/active/rs4-cp4-measure/tools/chunks.mjs`. 같은 머신·직렬 빌드·base 바이트 복원 확인(rs5-spike 8절 절차).
- 규칙: **감량 1회** 뒤에도 S6c가 판정선을 넘으면 중단 → 수치(정규화·raw 둘 다)로 MQ-6-6 상신. 예산·기준선·ADR·시나리오 한도 변경 0.
- 판정선 128.53/131.51(정규화) · raw 130/134(한도). 둘 다 통과해야 PASS.

## 10. 수용 기준 (RS6-AC) — 구현 레인 검증용

[U] = 단위·컴포넌트(vitest) · [G] = 가드(번들·import 그래프·문구) · [B] = 브라우저(ego-browser, `npm run build` + preview — memory `png-export-needs-preview` 교훈).

| ID | 기준 | 종류 |
|---|---|---|
| RS6-AC-U1 | 하네스 h1~h6 37건을 **3분류 대응표**로 REPORT에: ① **이식**(제품 포트 위에서 같은 의미 재현 — 코어 + `LocalSync` 포트 + `createMemoryPersistence`) ② **잠금 기반 대체**("같은 persistence 위 코어 여러 개 = 다른 탭"을 흉내 낸 h4·h5 일부·h6-3 CE-3a → `writerLock`·`localSync` 테스트와 RS6-AC-B3로) ③ **폐기**(제품에 없는 경로 — 사유 1줄). ①은 전부 GREEN | [U] |
| RS6-AC-U2 | C5 T1~T19 중 코어로 닫히는 것(T1·T2·T3·T5·T5b·T10·T12·T13·T16) + rs5-review CX-1(확인 직전 편집·확인 중 편집) RED→GREEN | [U] |
| RS6-AC-U3 | 편집기 저장 실패 시 DocBook revision 변화 0(G1 — C5 F2 반전) | [U] |
| RS6-AC-U4 | LV-1: 커밋 지연 주입 → `T_slow` 뒤 `saving-slow` · 편집 계속 수용 · 해제 뒤 `newer` 처리 · 추가 save 제출 0 | [U] |
| RS6-AC-U5 | LV-2: discard 읽기 정지 → `T_discard` 뒤 `blocked{timeout}` · 가드 해제 · 늦은 결과 버림(doc·바인딩·epoch 불변) · CE-1·CX-3 회귀 GREEN | [U] |
| RS6-AC-U6 | StrictMode mount→cleanup→mount: 같은 토큰 · 코어 새로 열기 0 · 편집 없으면 mark 변화 0 | [U] |
| RS6-AC-U7 | 레이아웃 모드 전환 재마운트 → 같은 코어 · 알림 재발화 0(UX5-AC-01) · lease 해제 save 최대 1회(편집 없으면 0) | [U] |
| RS6-AC-U8 | 버튼 1:1(8.2) — 각 버튼 클릭이 해당 코어 메서드 1회만 호출(스파이), 연타 1회 | [U] |
| RS6-AC-U10 | 삭제·가져오기·지우기 흐름의 `stop()` 직전 진행 중 코어 save → cleared 이후 쓰기 0(6.2) | [U] |
| RS6-AC-U11 | 저장 정지(지연 주입) 중 앱 안 링크 → 이동함 · 코어 inflight 유지 · `/projects` 행 "저장 중…" · 해제 뒤 IDB = 마지막 편집(6.5 고착 해소) | [U] |
| RS6-AC-U9 | memory 모드: "저장 확인" DOM 0 · "브라우저에 저장됨" 0(UX5-AC-09) | [U] |
| RS6-AC-U12 | **디바운스 대기 중 이탈**(dirty · inflight 0 → 앱 안 링크, 그리고 POP 언마운트): 즉시 이동 · lease 해제 save 1회 · 해제 뒤 IDB = 마지막 편집 · `/projects`에서 탭 닫기 경고 on(레지스트리 `beforeunload`) · 저장 끝나면 경고 off(3.1) | [U] |
| RS6-AC-U13 | 이탈 예외 목록(3.1-3): 클릭 시점 `readonly`·`unsupported` = 이동 · `failed`·`offline`·`stale`·`cleared` = 보류 + 지금 `leave()` 동작. `StudioLeave.test.tsx` 유지 7건 변경 없이 GREEN · 의미 변경 6건·이전 1건은 3.1-4 표대로 단언 교체(REPORT에 대응표) | [U] |
| RS6-AC-U14 | **G1 DocBook 경로 재쓰기(RED 먼저)**: 코어 commit 진행 중(지연 주입) `deleteSnapshot` → IDB doc = 코어 최신 · 새 이미지 삭제 0 · 스냅샷 삭제 반영. 같은 단언 `createSnapshot`·`confirmDoc` 각 1건(5절 G1 r1) | [U] |
| RS6-AC-G1 | 9.3 측정 관문 PASS 수치 + 최종 `npm run build` 정규화·raw 줄 | [G] |
| RS6-AC-G2 | import 그래프: `openIdbPersistence` 호출 1곳 · 코어 모듈 → `idbPersistence` import 0 · 코어 io 부분이 진입 closure에 없음 | [G] |
| RS6-AC-G3 | UX-5 2.4 금지 문구 0건(UX5-AC-14) + 3절 새 문구가 `saveStatusText.ts` 1곳 | [G] |
| RS6-AC-B1 | POP 재진입: 편집 → 뒤로 → 앞으로 → 상태 글자 이어짐 · 저장 뒤 새로고침 시 마지막 편집 복원 | [B] |
| RS6-AC-B2 | 이미지 바인딩: 새 이미지 편집 → POP → `/projects` "저장 확인" → 새로고침 → 이미지 복원 | [B] |
| RS6-AC-B3 | 멀티탭 실제 잠금: A writer → B `readonly` 문구 → A 닫기 → B "저장 확인" → `stale` 문구(final-qa 5-1 #11~13을 제품 화면으로) | [B] |
| RS6-AC-B4 | 390·1024·1280에서 상태 글자·충돌 Callout 노출(UX5-AC-12) | [B] |

## 11. 깨질 기존 테스트 (예상 — 실행 0)

(대체·변경 대상 모듈을 import하는 기존 테스트 파일 grep [L1] + 6절 trace로 고른 예상 — 실행 0)

| 파일 | 예상 | 이유 |
|---|---|---|
| `features/studio/useDocSave.test.tsx` · `useDocSaveWrite.test.tsx` | 변경 많음 | `revisionRef`·`saveDoc` 직행·`adopt` 경로가 코어 경유로 바뀜 |
| `features/studio/useAutosaveScheduler.test.ts` · `.hook.test.tsx` | 일부 변경 | 저장 호출 대상·dispose·감시 phase |
| `components/studio/StudioLayout.test.tsx` · `SaveStatus.test.tsx` · `ConflictCallout.test.tsx` | 일부 변경 | acquire/seed·상태 판정 출처·충돌 버튼 |
| `data/persistence/localSync.test.ts` · `confirmDoc.test.ts` · `imagePersist.test.ts` | 추가 위주 | 포트 메서드·엄격 imageOps(맵 없는 참조 = 제출 0으로 동작 변경 — 기존 "조용히 건너뜀" 단언이 있으면 RED) |
| `features/studio/saveStatusText.test.ts` | 추가 | 새 문구 |
| `features/studio/snapshotRevision.test.tsx` · `exportFlow.test.ts` | 변경 가능 | 스냅샷 복원·내보내기 전 저장이 코어 경유(6.4) |
| `components/studio/StudioLayout.test.tsx`의 링크 이탈 보류 단언 | 변경 | 저장 대기 제거(3절 · RS6-AC-U11) |
| `features/pending/pendingWrites.test.ts` · `pages/ProjectsPending.test.tsx` | 확인 필요 | `PendingRecord` 대체 여부(6.3) |
| `data/chunkRetryWiring.test.ts` · `test/pendingImportGuard.test.ts` | 확인 필요 | 청크 경계·import 가드 |

- 예상 delta는 기록만 하고(구현 레인 PROGRESS에 RED 전 기록), ±50% 넘게 다르면 REPORT에 이유(SPEC-4 8.0 관례).

## 12. 데이터 손실 잔존 한계 (숨기지 않는다)

| 경로 | 결과 | 보호 |
|---|---|---|
| 모바일 백그라운드 종료 · OS 회수 · 크래시 | 코어(탭 메모리) 소멸 → IDB = 마지막 커밋 | 0. 상태 꼬리 문구만(UX-5 7절) |
| 새로고침·주소 입력·탭 닫기 | `beforeunload` 경고(브라우저 문구 · 편집기 밖에서도 — 레지스트리 소유, 3.1-2) — 무시하면 소멸 | 안전층(보장 아님, SPEC-4 RS4-R3) |
| 이탈 뒤 lease 해제 save 실패(r1) | 사용자는 이미 `/projects` · 편집은 코어에 남음 · 행 상태 `failed`·탭 경고 on | `/projects` 행 "다시 저장" — 경고를 무시하고 탭을 닫으면 소멸(3.1) |
| `T_hang` 저장 정지 중 탭 닫기 | 미확인 변경 소멸, IDB는 직전 커밋 또는 이번 트랜잭션 전부/전무 | alert 고지 |
| 이미지 ingest 중 이탈 | 고른 이미지 소실 | UX-5 G9 |
| stale 탭의 초안 | 저장 불가 → 새로고침 시 소멸 | 상태 문구 |
| 이미지 증명 = 존재만(바이트 비교 0) · OBS-2/BD-2(다른 프로젝트 같은 id 통과) | 제품 이미지 id = `imageRecordId(projectId, localId)`(`localSync.ts:202`)라 BD-2는 비도달 [L1-추적] | — |

## 13. 대체 / 차이 (기존 문서 수정 0)

| ID | 기존 | INTEGRATE-6 | 사유 |
|---|---|---|---|
| D6-1 | C5 2.3 `SaveLedgerApi`(`mark`/`publish`/`save(token, seq)`/`subscribe`) | 코어 API(`edit`/`save`/`confirm`/`discard`/`replace`/`retryStart`/`acquire`/`release`/`view`) | 하네스 37건·QA로 확정된 쪽을 쓴다. C5 P1 5건(rs5-review)이 코어에서는 구조로 닫힘(dirty = mark 비교) |
| D6-2 | C5 2.5 "`ProjectRepository.ledger?`" | 코어 접근자 + `LocalSync` 포트(MQ-6-1) | 이름·모양만 다름 — 공개 인터페이스 추가 1은 같음 |
| D6-3 | MC I6b 커밋마다 문서별 세대 재읽기 | 잠금 획득 때 `fresh()` 1회 + 배타 잠금 — **MC 계약 변경**(MQ-6-1 A에 포함) | 4절 |
| D6-9 | UX-5 7절 링크 행 — `leave()` 이동 보류(저장 대기) | lease 해제 save 1회(대기 없음) 뒤 이동 · 탭 수준 경고 = 레지스트리. 클릭 시점 `readonly`·`unsupported` = 이동, `failed`·`offline`·`stale`·`cleared` = 보류(지금 동작 그대로) | 3절 LV-1 공통 행 · 3.1 · 6.5 고착 해소 · 결정 = MQ-6-7 |
| D6-4 | MC I7 "읽기가 끝나지 않으면 가드도 안 풀림" | 포기 토큰 `blocked{timeout}` | LV-2 · MQ-6-3 |
| D6-5 | SPEC-4 CP4(`PendingDraft`·`hold`·`studioHandoff`) | 코어 lease + seed로 흡수 | 7절 · MQ-6-4 |
| D6-6 | UX-5 G6(마운트 중 confirm 거짓 확인) | 코어 confirm이 dirty면 save 후 verify → G6 해소. 노출 규칙(MQ-5-3 ★A)은 유지 | 8.2 |
| D6-7 | UX-5 "바뀐 문서 쓰기" = `discard`? | `discard` 아님 — 코어 discard는 자기 증명으로 복귀 | 8.2 · MQ-6-5 |
| D6-8 | C5 8.3 S5a~c 판정선 raw 129900/132940 | 정규화 128.53/131.51 + raw 130/134 | ADR-004 개정 16 |
| D6-10 | MC `openSaveCore` "`docs/{projectId}`를 읽어 초안·`hydrated` 설정"(async 열기) | 편집기 마운트 때 **동기 생성** · seed = 편집기가 받은 문서 · IDB 머리는 첫 save·confirm 때 포트가 읽음 — **MC 계약 변경**(MQ-6-1 A에 포함) | 2.2-2 ① · QA R2 |
| D6-11 | SPEC-4 RS4-AC-06 "`useAutosaveScheduler` 경고 테스트·`StudioLeave`(B-RS-01) 테스트 전부 변경 없이 통과 · dirty 편집 뒤 앱 안 링크 이탈 = 저장 대기 그대로"(`SPEC-4.md:349`) | `StudioLeave` 유지 7 · 의미 변경 6 · 이전 1(3.1-4 표) · dirty 링크 이탈 = 해제 save 뒤 즉시 이동 · 편집기 경고는 레지스트리 경고로 이전 | 3.1 · 결정 = MQ-6-7 |

## 변경 이력
- r0 (2026-10-17) — 최초 작성. 코드 0 · 측정 0 · Codex 0.
