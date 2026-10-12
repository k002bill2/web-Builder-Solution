# RESTART SPEC-3 — 편집 시작 갈라짐(B-RS-02) · 미확인 쓰기 인계(B-RS-03)

- 작성: RS23-SPEC Designer 레인 · base main `93f8111` · 코드 0. 결정 질문 = `docs/design/restart/MQ-3.md`(MQ-3-1~4). ★ = 권장안.
- 선행 문서: `docs/design/restart/SPEC.md` r2(이하 "SPEC r2") · `MQ.md`(S1~S7 결정 기록) · ADR-007(개정 2·3 — 잠금·탭 단위 공유) · ADR-004 개정 15 · `app/scripts/m2cBaseline.json`.
- 근거 수준: **L1** = 코드·문서 행 직접 인용(경로만 = base `93f8111`) · **L3** = 추정(실측 전). 원인 추적은 읽기 전용 조사 2건(RS02·RS03)을 메인이 행 단위로 다시 확인해 통합했다(REPORT 2절).
- 이 문서는 SPEC r2를 **대체하지 않는다**. SPEC r2의 3.3·3.3.1·5.3 규칙은 그대로이고, 이 문서가 바꾸는 행은 8절 "SPEC r2와 다르게 한 곳"에 적는다.

## 0. 요약

1. **B-RS-02 원인(L1)**: `startDoc`은 restart일 때만 커밋 전에 잠금을 확인한다(`app/src/data/memoryProjectRepository.ts:121-122`). create는 메모리 커밋 → `kept()` flush(`:65-66`) 순서라, 쓰기 탭이 아니면 메모리에만 문서가 생기고 IDB는 그대로(INFRA)다. 이것은 SPEC r2가 일부러 남긴 범위(MQ-S2 C)이고, 테스트가 지금 동작을 고정한다(`app/src/data/persistence/restartLock.test.ts:136` "create는 그대로").
2. **B-RS-02 수정(★ MQ-3-2 A)**: create도 커밋 **전에** 같은 `guardWrite()`를 부른다. 잠금 소유자는 탭당 하나인 `LocalSync` 쓰기 문(`createWriterGate`)이다. 흐름별로 따로 잡는 잠금(`tryLock`·`held`)은 새로 두지 않는다. 거절되면 메모리·IDB 변화 0이다. 저장소 인터페이스·스키마·오류 타입은 바뀌지 않고, 바뀌는 것은 내부 순서 1곳이다(restart 조건 제거).
3. **커밋 뒤 실패는 남는다(L1)**: flush INFRA(quota·트랜잭션 중단·`cleared`)와 응답 단계 실패(`:79-81` — 이때는 flush가 아예 실행되지 않는다)는 잠금과 무관하게 커밋 **뒤**에 난다. create도 restart처럼 **커밋 확인 → 사유** 순서로 결과를 정한다(★ MQ-3-3 A). 커밋된 것으로 확인되면 "미확인"이라고 말하고, 성공이나 실패로 단정하지 않는다.
4. **B-RS-03 원인(L1)**: 미확인 기억은 `restartFlow.ts:28-35`의 모듈 Map에 있다(프로필 조작 뒤 청크). `/projects` 목록은 메모리 문서를 저장된 것처럼 보여 주고(`memoryProjectRepository.ts:100-103` · `projectListView.ts:36-41`), "편집기 열기" 링크(`projectListView.ts:64`)는 아무 상태 없이 편집기로 보낸다. 편집기 저장 상태는 `idle`로 시작한다(`useAutosaveScheduler.ts:59`). 그래서 상태 글자가 비고, 떠나기 경고가 없고(`:67-70`), `leave()`도 하지 않는다(`useDocSave.ts:143`).
5. **B-RS-03 수정(★ MQ-3-1 A — `/studio` 진입 0B)**: 미확인 기억을 의존성 없는 탭 메모리 모듈로 옮긴다. `/projects` 행이 그 기억을 읽어 "편집기 열기" 대신 **"저장 다시 시도"**를 보여 준다. 다시 시도는 같은 인자로 `startDoc`을 부르는 멱등 재생이고, 기존 계약 그대로다. 확인되면 링크가 돌아온다. 편집기 쪽 인계(진입 때 미확인 상태로 시작)는 `/studio` 진입 바이트가 필요하다. 판정선 수정 금지 조건에서는 예산 결정 사항이므로 MQ-3-1 B로 둔다.
6. **영속 범위**: 미확인 상태는 **메모리로만** 전달한다. 새로고침하면 탭 메모리가 IDB로 돌아가므로 미확인 쓰기 자체가 없어지고, 상태는 다시 일치한다. 잃는 것은 "새로 시작/편집 시작이 반영되지 않음"이며, 이미 R-E4 문장이 밝히고 있다. 저장할 스키마·저장소 계약 변경이 필요 없다(4절).

## 1. 범위 / 제외

**범위**
- `startDoc` create의 커밋 전 잠금 확인(저장소 내부 순서).
- 프로필 "편집 시작"(create) 실패 판정: 커밋 확인 → 사유. 문구는 C-E# 계열(5.1).
- 미확인 기억 모듈 이동: restart와 create 공통, 탭 메모리.
- `/projects` 행의 미확인 표시와 "저장 다시 시도"(5.2).

**제외**
- `/studio` 화면 변경(편집기 저장 상태 인계)은 MQ-3-1 B로, 예산 결정 뒤에 다룬다.
- 탭 메모리 되돌리기(롤백)는 없다. 저장소에 되돌리는 경로가 없고(`memoryDocBook.ts:398-404` 동기 커밋), 만들려면 계약 변경이다.
- 미확인 상태를 IDB에 기록하는 것은 하지 않는다(4절 — 새로고침 뒤에는 기록할 대상이 없다).
- 읽기 전용 탭의 편집기 저장 실패 문구 개선은 하지 않는다. 지금은 일반 "저장하지 못했습니다"이고 사유를 보여 주지 않는다(`useDocSave.ts:72-76`). 기존 동작이므로 별건이다.
- create의 `UNKNOWN_VARIANT`·`DOC_EXISTS` 판정은 바꾸지 않는다.

## 2. 지금 흐름 trace (L1 — 원래 계약 vs 현재 구현)

### 2.1 실행 순서

`startDoc(p, v, c, mode, rev)` = `kept(p, bookOf().then(async docs => (mode==="restart" && await (await local?.sync())?.guardWrite(), call("startDoc", commit => docs.start(...)))))`. 위치는 `memoryProjectRepository.ts:121-122`이다. 단계는 다음 순서로 진행한다.

1. **청크·싱크 열기**: `bookOf()`가 `memoryDocBook`과 `local.sync()`를 함께 연다(`:58-61`). 실패하면 쓰기 0이다.
2. **잠금 확인**: restart만 한다. `guardWrite()`(`localSync.ts:197-201`)는 다음과 같이 판정한다.
   - `cleared`이면 `CLEARED_TAB`.
   - `gate.enter()` 결과가 `writer`가 아니면 `blocked(mode)`. `readonly`는 `READ_ONLY_TAB`, `stale`은 `STALE_TAB`, `unsupported`는 기본 사유다(`:81` · `infra.ts:26-29`).
3. **`call()` request 단계**(`:72-74`): 커밋 전.
4. **판정과 커밋**: `docs.start` 판정(`memoryDocBook.ts:369-406`) → `commit()`(`:75-78`, 주입 실패도 여기) → 메모리 교체.
5. **`call()` response 단계**(`:79-81`): 커밋 뒤. 여기서 실패하면 `kept`의 `.then`을 타지 않아 **flush가 0번 실행된다**(`:66`).
6. **flush**(`localSync.ts:189-192`):
   - `writer`이면 `write()`. 큐에 제출하고 IDB 커밋까지 기다린다.
   - 시도 전이거나 `readonly`이면 `gate.enter()` 결과에 따라 `write()` 또는 `blocked(mode)`로 reject한다. reject면 **큐 제출·`submitted` 기록이 0**이다.
   - writer 탭에서 IDB가 실패하면 큐가 미확인으로 보관하고, 같은 레코드를 다시 flush할 때 `queue.retry`로 재제출한다(`:154-155` · `writeQueue.ts:78-94`).
7. **멱등 기록**: 키는 `[projectId, mode, profileVersion, candidateId, restart ? rev : null]`이다. 프로젝트별 마지막 1건만 두고, 같은 키면 커밋 없이 직전 결과를 재생한다(`memoryDocBook.ts:374-376,403`). 재생 뒤에도 `kept`가 flush를 다시 실행한다.

### 2.2 실패 시점별 상태 (create, 지금 구현)

| # | 시점 | 탭 메모리 | IDB | 화면(지금) | 다시 시도(같은 인자) |
|---|---|---|---|---|---|
| a | 커밋 전(청크·싱크 열기, request·commit 주입, 판정 오류) | 변화 0 | 변화 0 | "편집을 시작하지 못했습니다" + 다시 시도(`restartFlow.ts:51` · `CandidatesSection.tsx:257-262`) | 처음 요청과 같다 |
| b | 커밋 뒤 flush INFRA — **잠금 없는 탭**(B-RS-02) | 새 문서 + 멱등 기록 | 문서 없음 | 같은 문장(거짓 "변화 0") | 재생 → flush 재시도. `readonly`면 같은 INFRA, `stale`이면 새로고침 전까지 계속 INFRA인데 문장은 그대로 "다시 시도" |
| b′ | 커밋 뒤 flush INFRA — writer 탭(quota·중단·`cleared`) | 새 문서 | 문서 없음(큐 미확인) | 같은 문장 | 재생 → `queue.retry` 재제출 |
| b″ | 커밋 뒤 응답 단계 실패 | 새 문서 | 문서 없음(flush 0회) | 같은 문장 | 재생 → 이번에는 flush 실행 |
| c | flush 성공 뒤 재판정 `getDoc` 실패 | 새 문서 | 새 문서(일치) | F1 이동, 알림 없음(`restartFlow.ts:54-55`) | 해당 없음 — 정상 |

(b) 상태에서 이어지는 거짓 경로(L1 — RS02 조사, 메인 재확인):
- **같은 안·다른 버전**으로 다시 누르면 `DOC_EXISTS`(메모리 문서 동봉) → `judge`가 같은 안이라 이동한다. 결과적으로 **IDB에 없는 문서로 편집기가 열린다**(`restartFlow.ts:38-39,50`).
- **다른 안**을 누르면 F4 대화상자가 열린다. 대상은 IDB에 없는 문서다. restart를 누르면 R-E2가 난다.
- `/projects` 목록은 그 문서를 "편집 중 · X안 · vN"으로 보여 준다(`memoryProjectRepository.ts:100-103`).
- 새로고침하면 메모리 문서가 사라진다. 편집기에서 한 저장도 모두 INFRA였으므로 **편집 내용 손실**로 체감된다.

### 2.3 restart 미확인(R-E4) 뒤 `/projects` → 편집기 (B-RS-03, 지금 구현)

| 단계 | 사실 | 근거 |
|---|---|---|
| R-E4 발생 조건 | restart는 `guardWrite` 통과 뒤에만 커밋한다. 따라서 **R-E4 탭은 언제나 writer 탭**이고, 원인은 quota·중단·`cleared`·응답 단계 실패 중 하나다 | `memoryProjectRepository.ts:121-122` |
| 기억 | `WeakMap<ProjectRepository, Map<projectId, RestartOpen{selected, version, doc, held}>>`. 프로필 "편집 시작"만 읽는다(`startEdit` 첫 줄). 지우는 때는 restart 성공과 커밋 확인 음성이다 | `restartFlow.ts:28-35,42-44` · `RestartDialog.tsx:80-87,108` |
| 기억 청크 | `restartFlow`는 `RestartDialog`에서 정적 import된다. 프로필 조작 뒤(`PROFILE_AFTER_ACTION`)이며 대비 판정 등 domain import를 함께 끈다 | `RestartDialog.tsx:11` · `check-bundle-size.mjs:78` · `restartFlow.ts:5-11` |
| `/projects` | `listProjects` 요약은 메모리 `book.docOf` 우선이라 새 문서가 저장된 것처럼 보인다. "편집기 열기"는 state 없는 `<Link>`다 | `memoryProjectRepository.ts:100-103` · `projectListView.ts:36-41,64` · `ProjectRow.tsx:51-52` |
| 편집기 진입 | `getDoc`(메모리 우선 — 새 문서). 저장 상태 `idle` → 상태 글자 빈칸 · 떠나기 경고 없음 · `leave()`=undefined · `flushed()`=true | `useStudioDoc.ts:22` · `useAutosaveScheduler.ts:59,67-70` · `saveStatusText.ts:40-41` · `useDocSave.ts:118-128,143` |
| 저절로 닫히는 경로 | 편집 저장, 스냅샷 복원(`adopt`), 내보내기 요청은 모두 `kept` → flush로 **프로젝트 레코드 전체**(새 문서 + "새로 시작 전" 스냅샷)를 제출한다. 성공하면 갈라짐이 닫히고, 실패하면 기존 "저장하지 못했습니다" 경로를 탄다 | `localSync.ts:151-161` · `memoryProjectRepository.ts:119,129,132-133` · `useExportFlow.ts:62` |
| 남는 거짓 | 편집 없이 떠나거나 새로고침하면 새로 시작이 조용히 사라진다(옛 문서로 돌아감 — 내용 손실은 아님). 편집기에서 확인된 뒤에도 프로필 기억이 남아 R-E4 대화상자가 다시 열린다. 이때 "다시 시도"는 무해한 no-op 성공이다 | RS03 조사 3절 |
| 앱 안 `/studio` 이동 경로 | ① 프로필 편집 시작·대화상자(`CandidatesSection.tsx:105,272` — 기억이 막음) ② `/projects` 행 링크(`ProjectRow.tsx:52`) ③ 브라우저 뒤로/앞으로(SPA history) ④ 그 밖 없음(`AppLayout.tsx:16`은 헤더 숨김만) | grep `/studio/` |

### 2.4 원래 계약 vs 현재 구현

- **ADR-007**:
  - 실패는 INFRA로 재시도 경로에 둔다.
  - "저장됨"은 IDB 커밋 확인 뒤에만 표시한다.
  - 메모리가 진실의 원천이고 롤백 규정은 없다.
  - 개정 2: "먼저 편집한 탭만 쓰기", 잠금은 첫 쓰기 때 잡는다.
  - 개정 3과 P1d L3: 탭 단위 잠금 소유를 공유한다(`tabLockHold`).
- **SPEC r2**:
  - restart만 잠금을 먼저 확인한다(MQ-S2 A). create는 "덮을 문서가 없어 피해가 작다"는 이유로 C(별건)였다(SPEC r2 4절·`MQ.md:26`).
  - RS-R7이 `/projects` 우회를 BACKLOG 후보로 남겼다.
- **현재 구현**: SPEC r2와 일치한다(위반 아님).
- **B-RS-02·03**은 결함이 아니라 SPEC r2가 의도적으로 남긴 미해결 항목이다. 따라서 이 문서의 변경은 계약 위반 수정이 아니라 **범위 확장**이고, 사용자 승인 대상이다(MQ-3).

## 3. 잠금 소유 규칙 (B-RS-02 · 같은 탭 공통 소유자)

1. **소유자 = 탭당 `LocalSync` 1개의 쓰기 문(`gate`)**(`localSync.ts:131` · `writerLock.ts:31-56`). create, restart, 저장, 재시도는 모두 `guardWrite()` 또는 `flush()`를 거쳐 **같은 `gate.enter()`**를 부른다.
   - 프로필·`/projects` 흐름은 `tryLock`을 직접 부르지 않는다.
   - 흐름마다 `held`를 따로 두지 않는다.
2. `gate`는 상태를 하나만 가진다.
   - `writer`이면 탭 수명 동안 보유한다.
   - `readonly`이면 다음 `enter`에서 다시 요청한다.
   - `stale`·`unsupported`이면 새로고침 전까지 유지한다.
   - 따라서 같은 탭에서 create가 거절된 뒤 restart를 해도 같은 판정을 받는다. 반대로 create가 잡은 잠금은 restart·저장이 그대로 이어 쓴다. 재진입 문제(Web Locks는 같은 이름 재요청에 null)가 생기지 않는다.
3. **파괴 흐름과의 관계(L1)**: `/projects` 파괴 흐름(삭제·지우기·가져오기)은 `tabLockHold`가 소유를 공유한다(`tabLockHold.ts:1-5`).
   - **쓰기 탭**이면 싱크 잠금을 재사용하고 싱크를 멈춘다(`stop` → `cleared` → 이후 `guardWrite`는 `CLEARED_TAB`, 새로고침 안내).
   - **비쓰기 탭**이면 `tryLock` 잠금을 흐름이 끝날 때 놓는다(`deleteProject.ts:155,159` · `writeImport.ts:171,175` · `clearBrowserData.ts:42`). 성공 경로는 새로고침 이동이다.
   - 그러므로 파괴 흐름 뒤 같은 탭 create가 **자기 잠금에 막히는 경로는 없다**. RS3-AC-04가 이를 고정한다.
4. create 가드 위치: `startDoc` 래퍼에서 `docs.start` **전**. 지금 restart 줄의 `mode === "restart" &&` 조건만 없앤다.
   - `local`이 없으면(`persistence: "memory"` — 테스트·폴백) 가드도 없다(지금과 같다).
   - 판정·커밋 구간에 await를 더하지 않는다. 가드는 `call()` 바깥이다.
5. 가드는 원자성을 끝까지 보장하지 않는다. 잠금을 잡은 뒤의 flush 실패와 응답 실패는 6절 판정이 맡는다.

## 4. 영속 미확인 상태 — 메모리로 충분한가, 저장소 계약 변경이 필요한가 (판정)

| 질문 | 판정 | 근거 |
|---|---|---|
| 미확인 쓰기는 새로고침 뒤에도 남는가 | **아니다.** 새로고침하면 탭 메모리가 IDB에서 다시 하이드레이트되므로, 미확인(메모리에만 있던) 문서는 사라지고 메모리와 IDB가 일치한다 | ADR-007 2단 하이드레이션 · `localSync.ts:110-118` |
| 따라서 미확인 상태를 IDB에 기록할 필요가 있는가 | **없다.** 기록할 대상이 새로고침 뒤에는 존재하지 않는다. 기록하면 오히려 "없는 쓰기를 미확인이라 말하는" 거짓이 생긴다 | — |
| 탭 안에서 다른 화면으로 전달하려면 저장소 인터페이스가 필요한가 | **아니다.** 같은 탭의 화면들은 같은 저장소 인스턴스를 공유하고(`deferredStudio.ts:55` 공유 로더), 지금도 기억이 그 인스턴스를 키로 쓴다(`restartFlow.ts:28`). 의존성 없는 모듈로 옮기기만 하면 된다 | RS03 조사 1절 |
| 다시 시도에 새 API가 필요한가 | **아니다.** 같은 인자 `startDoc` = 멱등 재생 → flush 재제출(`memoryDocBook.ts:374-376` · `localSync.ts:154-155`). 결과는 둘 중 하나다: 커밋됐는지 모르는 경우에도 같은 키라 두 번 바뀌지 않는다. 커밋이 안 됐으면 처음 요청이 된다 | SPEC r2 R-E5 |
| 저장소가 "미확인 있음"을 알려 줄 수는 있나 | 내부에는 있다(`WriteQueue.status/unconfirmed` — `writeQueue.ts:16-26`). 하지만 `LocalSync`·`ProjectRepository` 인터페이스 밖이다. 노출하면 **저장소 계약 변경**이고, 화면이 읽으려면 진입 청크 비용이 든다. 또 응답 단계 실패(flush 0회)는 큐가 모른다. 따라서 이 레인은 쓰지 않는다 | RS03 조사 4절 |

**결론**: 메모리 전달 + 기존 `startDoc` 재생만으로 안전하다. 새 스키마·엔진 계약·의존성·백엔드는 필요 없다. 예산 상향은 ★안에서 0이고, MQ-3-1 B를 고를 때만 필요하다.

## 5. 상태 · 메시지 · 재시도/취소/복구

### 5.1 프로필 "X안으로 편집 시작"(create) 결과 — 판정 순서

`startEdit` 첫 줄(미확인 기억이 있으면 그 상태부터 연다)은 지금 그대로다. create가 **실패**하면 다음 순서로 판정한다(SPEC r2 3.3.1과 같은 원리이고, create에 맞춰 조건만 다르다).

1. `DOC_EXISTS`(동봉 doc 있음): 지금 그대로 `judge`. 판정 단계에서만 나오므로 커밋 확인 대상이 아니다(`memoryDocBook.ts:384-385`). 응답 단계에서 이 모양이 오는 경우는 주입 테스트뿐이고, 그때 동봉 doc이 곧 지금 문서다. 지금처럼 이동한다.
2. 그 밖 모든 실패: **커밋 확인**으로 `getDoc(projectId)`를 부른다.
   - **before 읽기(요청 전)**: create를 부르기 **직전**에 `before = getDoc(projectId)`를 읽는다(메모리 — 조작 뒤 청크, 실패하면 `before = "unknown"`). 이유: 같은 쌍 문서가 이미 있는 상태에서 커밋 전 실패(청크·싱크 열기 실패, 가드 거절, request 단계)가 나면 `now`가 요청 쌍과 같아 거짓 양성이 된다. 가드는 멱등 재생 판정보다 앞이다(`memoryProjectRepository.ts:122` → `memoryDocBook.ts:374-376`).
   - **양성**: `before === undefined && now && now.candidateId === selected && now.profileVersion === version`. `before`가 문서였으면(같은 키 재생이 아닌 한 `DOC_EXISTS`가 먼저 났을 것) 이 요청이 커밋한 것이 없으므로 **음성**이다. `before === "unknown"`이고 `now`가 요청 쌍이면 **확인 불가(C-E5)**다. create는 문서가 없을 때만 커밋한다. 그러니 판정 단계 거절이 아닌 실패 뒤에 요청 쌍과 같은 문서가 있다면 이 요청(또는 그 재생)이 커밋한 것이다. 결과는 **C-E4**이고, 기억에 `{mode:"create", projectId, version, selected}`를 저장한다.
   - **음성**: 문서 없음, 또는 다른 쌍. 아래 사유 판정으로 가고 기억은 지운다.
     - INFRA 메시지 끝이 `READ_ONLY_TAB`이면 C-E2, `STALE_TAB`이면 C-E2b, `CLEARED_TAB`이면 C-E2c.
     - `UNKNOWN_VARIANT`이면 저장소 alert(지금 그대로, 다시 시도 없음).
     - 그 밖이면 `startFailed`(지금 문장) + INFRA 사유(" · " 뒤). 다시 시도가 있다.
   - **`getDoc` 실패**: **C-E5**이고 기억에 `held:"unknown"`을 저장한다.
3. 성공 뒤 재판정(SPEC r2 3.1 P2-4)은 지금 그대로다.

| ID | 상태 | 자리 | 문구 | 버튼 |
|---|---|---|---|---|
| C-E2 | 다른 탭 잠금(쓰기 0) | "편집 시작" 아래 `role=alert` Callout(지금 자리) | "다른 탭에서 편집 중이라 편집을 시작하지 않았습니다 — 그 탭을 닫은 뒤 다시 시도하세요" | 다시 시도 |
| C-E2b | 다른 탭이 저장함(`stale`, 쓰기 0) | 같음 | "다른 탭에서 바뀐 내용이 있어 편집을 시작하지 않았습니다 — 새로고침한 뒤 다시 고르세요" | 없음 |
| C-E2c | 지워짐(`cleared`, 쓰기 0) | 같음 | "이 브라우저 데이터가 지워져 편집을 시작하지 않았습니다 — 새로고침하세요" | 없음 |
| C-E3 | 그 밖 커밋 전 실패 | 같음 | 지금 `startFailed` "편집을 시작하지 못했습니다"(+ " · " INFRA 사유) | 다시 시도 |
| C-E4 | 커밋 뒤 미확인 | 같음 | "편집 문서를 만들었지만 브라우저에 저장됐는지 확인하지 못했습니다 — 다시 시도하면 같은 요청으로 저장을 이어 갑니다. 지금 떠나면 새로고침 때 편집 문서가 없던 상태로 돌아갈 수 있습니다" | 다시 시도 |
| C-E5 | 확인 불가 | 같음 | "편집 문서를 만들었는지 확인하지 못했습니다 — 다시 시도해도 같은 요청이라 두 번 만들어지지 않습니다" | 다시 시도 |

- **C-E4·C-E5의 다시 시도**는 기억의 인자(처음 요청한 안·버전)로 create를 재생한다. 지금 고른 안과 다르더라도 그렇다.
  - 성공하면 기억을 지우고 기존 성공 경로(이동 + `changeNotice`)로 간다.
  - 다시 실패하면 같은 판정 순서를 다시 탄다.
  - 기억이 있는 동안 다른 안의 "편집 시작"은 create 전에 같은 C-E4/C-E5를 다시 보여 준다(restart R-E4의 RS-AC-08d와 같은 규칙).
- **취소**: Callout에는 닫기가 없다. 다른 화면으로 가는 것이 곧 취소이고, 기억은 남는다(5.2가 `/projects`에서 이어받는다).
- **이동 금지**: C-E4·C-E5 상태에서는 편집기로 보내지 않는다(SPEC r2 R-E4와 같은 원칙 — 편집기는 미확인을 이어받지 못한다, 2.3).
- 문구 자리·모양은 기존 Callout 1개를 쓴다. 새 라이브 영역은 없다. 문자열은 조작 뒤 청크(`restartText.ts`)에 둔다. `generationText.ts`(진입)는 변경 0이다.

### 5.2 `/projects` 행 — 미확인 기억이 있는 프로젝트 (B-RS-03 ★ MQ-3-1 A)

| 항목 | 규칙 |
|---|---|
| 판정 | 행 렌더 때 기억 모듈 `unconfirmedStart(repo, projectId)`를 조회한다(동기 Map 조회, 쓰기 0). 키는 같은 저장소 인스턴스다 |
| 상태 글자 | 기존 `editStatus` 뒤에 한 줄 P-U1을 붙인다(색이 아니라 글자로). restart면 "새로 시작한 문서(C안 · v4)가 브라우저에 저장됐는지 확인하지 못했습니다", create면 "편집 시작한 문서(C안 · v4)가 브라우저에 저장됐는지 확인하지 못했습니다", `held:"unknown"`이면 "C안 · v4로 바뀌었는지 확인하지 못했습니다" |
| 행동 | "편집기 열기" 링크를 **숨기고** 버튼 **"저장 다시 시도"**를 둔다. 같은 위치, 같은 버튼 크기 |
| 다시 시도 | 같은 인자 `startDoc` 재생(restart면 `expectedRevision` = 기억의 `doc.revision`). 진행 중에는 `aria-busy`와 `aria-disabled`, 연타는 요청 1회 |
| 성공 | 기억을 지운다. P-U1을 지우고 링크를 되살린다. 행 안 `role=status` P-U2 "저장을 확인했습니다 — 편집기를 열 수 있습니다". **자동 이동은 하지 않는다**(목록에서 사용자가 고른다). 포커스는 되살아난 "편집기 열기" 링크로 간다 |
| 실패 | 커밋 확인(5.1 2단계, restart면 SPEC r2 3.3.1)을 다시 한다. ① 양성: 행 `role=alert` P-U3 "아직 저장을 확인하지 못했습니다 · {INFRA 사유}" + 버튼 유지 ② 음성(실제로는 커밋 안 됨): 기억을 지운 뒤 P-U4 — restart면 링크를 되살리고 "새로 시작이 반영되지 않은 상태입니다 — 지금 문서(B안 · v3)를 그대로 엽니다" · create면 문서가 없어 링크도 없음(`hasDoc` false — `projectListView.ts:64`)이고 "편집 시작이 반영되지 않았습니다 — 프로필에서 다시 고르세요" ③ 확인 불가: P-U3 문형 + 버튼 유지 |
| 복구 안내(상시, 버튼 아래 캡션) | P-U5 restart: "계속 실패하면 새로고침하세요 — 이전 문서(B안 · v3)로 돌아가고 새로 시작은 취소됩니다" · create: "계속 실패하면 새로고침하세요 — 편집 시작 전 상태로 돌아갑니다" |
| 삭제 행동 | 미확인 행의 "삭제"는 지금 그대로다. 삭제는 IDB 직접 트랜잭션 + 새로고침 이동이라 메모리 미확인과 무관하다(ADR-007 개정 3). 기억은 새로고침과 함께 사라진다 |
| 청크 | 판정·버튼·문구 = `/projects` 진입 청크의 행 분기 몇 줄 + **기억 모듈(의존성 0)**. 재시도 본문(커밋 확인 포함)은 조작 뒤 청크(클릭 때 import)에 둔다 |

**편집기로 보내지 않는 이유**(SPEC r2 R-E4와 같은 결론):
- `/studio` 저장 훅은 `idle`로 시작해 미확인을 이어받을 길이 없다(2.3).
- 진입 바이트 0 범위에서 정직한 길은 "확인되기 전에는 편집기 입구를 열지 않는다"이다.
- 대신 언제든 새로고침으로 일치 상태(옛 문서)로 돌아갈 수 있음을 P-U5가 밝힌다.

### 5.3 남는 경로 (★안 기준 — 숨기지 않는다)

| ID | 경로 | 결과 | 완화 |
|---|---|---|---|
| RS3-R1 | 브라우저 **뒤로/앞으로**로 `/studio/:id` SPA 재진입(예: 편집기 → 프로필 restart R-E4 → 뒤로) | 편집기가 미확인 문서를 `idle`로 연다(지금과 같음) | 편집 저장·복원·내보내기가 하나라도 성공하면 레코드 전체가 써져 닫힌다(2.3). 남는 손실은 "편집 없이 새로고침하면 새로 시작이 사라짐"뿐이고, 내용 손실은 없다. 완전히 닫으려면 MQ-3-1 B |
| RS3-R2 | 편집기에서 확인된 뒤에도 기억이 남음(편집기는 기억을 지우지 못한다 — `/studio` 0B) | 프로필은 R-E4/C-E4를, `/projects`는 P-U1을 다시 보여 준다 | 다시 시도는 멱등 재생 + `queue.retry` no-op으로 즉시 성공하고 기억이 지워진다(1클릭). 문장은 "확인하지 못했다"이지 "실패했다"가 아니라 거짓이 아니다 |
| RS3-R3 | 다른 탭 | 미확인은 이 탭 메모리에만 있다. 다른 탭에는 IDB 옛 상태가 보인다 | 다른 탭에서 그 프로젝트를 편집하면 그 탭이 writer가 될 수 없다(이 탭이 잠금 보유 — R-E4 탭은 writer). 그 탭은 읽기 전용 INFRA다(지금과 같음) |
| RS3-R4 | 탭 닫기·새로고침 | 미확인 쓰기가 사라지고 메모리와 IDB가 일치한다(옛 상태) | C-E4·R-E4·P-U5가 미리 밝힌다. 새로고침 경고(`beforeunload`)는 넣지 않는다. 프로필·목록 화면 진입 청크에 언로드 가드를 더하는 것은 이 레인 밖이고 MQ-3-4 |

## 6. 실패 판정 공통 규칙 (create · restart · `/projects` 재시도)

1. **커밋 확인 먼저**: 오류 모양만으로 커밋 전·뒤를 가를 수 없다(SPEC r2 3.3.1 사실 그대로). create에서는 `DOC_EXISTS`만 예외다(판정 단계 전용, 5.1).
2. **판정 근거는 이 탭 저장소 메모리**: 다른 탭은 이 탭 메모리를 바꾸지 못하고, 이 탭에서 그 사이 같은 프로젝트를 쓰는 다른 경로도 화면에 없다. 프로필 화면, 그리고 `/projects` 행(같은 탭 다른 라우트는 동시에 마운트되지 않는다)이 그렇다.
3. **결과 3분류만 쓴다**:
   - 확인 양성 = "미확인"(R-E4·C-E4·P-U3)
   - 확인 음성 = 사유별 "하지 않았습니다/하지 못했습니다"(쓰기 0 확실)
   - 확인 불가 = "확인하지 못했습니다"(R-E5·C-E5)
   - "성공"은 저장소 resolve(=flush 커밋 확인) 뒤에만 말한다.
4. **다시 시도는 항상 기억의 인자 그대로**: 멱등 키가 같아야 중복이 없다. 화면이 인자를 다시 만들지 않는다.
5. 사유 문자열 비교는 `infra.ts:26-29` 상수 값과 같아야 한다(SPEC r2 RS-R8). `CLEARED_TAB`도 `TAB_REASON`에 추가해 테스트로 일치를 고정한다.

## 7. 수용 기준 (RS3-AC)

태그: **[U]** Vitest · **[G]** 가드·빌드 · **[E]** 브라우저 QA(Ego Lite, `npm run build` + `vite preview`, 앱 안 클릭만 — 메모리 store 새로고침 함정·PNG preview 규칙).

| ID | 조건 | 검증 |
|---|---|---|
| RS3-AC-01 | **create 거절 시 메모리·IDB 동일**: `fakeLocks` 다른 탭 보유 → create → C-E2. 메모리 문서·멱등 기록·`listProjects().hasDoc` 변화 0, IDB `docs` 레코드 0, 큐 제출 0. 보유 탭이 쓰지 않고 놓으면 다시 시도 → 성공 + IDB 문서 1. `stale`이면 C-E2b(다시 시도 없음). `cleared`이면 C-E2c. `unsupported`이면 C-E3 + 기본 사유. 각 경우 쓰기 0 | [U] |
| RS3-AC-02 | **기존 단언 교체 허용**: `restartLock.test.ts:136` "create는 그대로(MQ-S2 C 범위 밖)"를 RS3-AC-01 단언으로 **교체**한다. 그 밖 기존 단언 변경은 0이다(SPEC r2 RS-AC-01 선례) | [U] |
| RS3-AC-03 | **commit 뒤 오류 재시도 중복 없음**: create와 restart 각각 ① 잠금 획득 뒤 flush INFRA(quota 주입) ② `fail({method:"startDoc", phase:"response"})`(flush 0회) ③ ① + `getDoc` 실패 주입(C-E5·R-E5). 각각 다시 시도 1~3회 뒤 성공. 문서 revision은 +1 한 번뿐이고, restart "새로 시작 전" 스냅샷 신규 id는 1개, 멱등 기록은 1건, IDB 최종 = 메모리. `DOC_EXISTS` 0 | [U] |
| RS3-AC-04 | **같은 탭 잠금 소유 공통**: ① 같은 탭에서 create 성공(writer) → restart → 잠금 재요청 0(fakeLocks request 호출 수 불변) ② 비쓰기 탭에서 `/projects` 삭제가 busy·실패로 끝난 뒤 같은 탭 create → 자기 잠금 때문에 C-E2가 나는 일이 0 ③ 쓰기 탭 삭제 실패(싱크 멈춤) 뒤 create → C-E2c(새로고침 안내), 쓰기 0. 프로필·`/projects` 흐름 코드에서 `tryLock` 직접 호출 0(가드 테스트 또는 grep 단언) | [U][G] |
| RS3-AC-05 | **create 커밋 확인 판정표**: 같은 `Error`를 request·commit·response·flush 단계에 주입했을 때 결과가 각각 C-E3·C-E3·C-E4·C-E4로 갈린다. **거짓 양성 0**: 같은 쌍 문서가 이미 있고(앞 create가 확인 저장됨, 마지막 start 키는 다른 restart) 청크 로드 실패·가드 거절·request 실패를 주입 → C-E3/C-E2(미확인 아님) · 기억 0. before 읽기 실패 + now = 요청 쌍 → C-E5. `DOC_EXISTS`는 지금 그대로 judge. C-E4 상태에서 편집기 이동 0 | [U] |
| RS3-AC-06 | **기억 공통**: C-E4 뒤 다른 안 "편집 시작" → create 호출 0, C-E4 재표시 → 다시 시도 인자 = 처음 쌍. R-E4 뒤도 같다(기존 RS-AC-08d 유지). 기억 모듈 이동 뒤 `restartFlow` 기존 테스트 전부 통과 | [U] |
| RS3-AC-07 | **`/projects` 미확인 안내·재시도**: R-E4(또는 C-E4) 뒤 앱 안 클릭으로 `/projects`에 가면 그 행에 P-U1 글자가 보이고 "편집기 열기" 링크가 0개, "저장 다시 시도" 버튼이 있다. 재시도 성공 → P-U2 · 링크 복원 · 포커스 = 링크 · 기억 삭제 · IDB = 메모리. 재시도 실패(flush 주입 지속) → P-U3 · 버튼 유지. 확인 음성 → P-U4(restart = 링크 복원 · create = 링크 0, 행 "편집 전" 상태). 다른 프로젝트 행은 변화 0 | [U][E] |
| RS3-AC-08 | **새로고침 한계**: R-E4 → 새로고침 → 프로필·`/projects`·편집기 모두 옛 문서(B안 v3), "새로 시작 전" 스냅샷 없음, 미확인 표시 0. 메모리 = IDB이고 내용 손실 0 | [E](+[U] 하이드레이션 단언) |
| RS3-AC-09 | **탭 변경 한계 · 다른 탭 차단 실측**: 탭 A에서 프로젝트를 **실제로 편집해 저장**한다(첫 쓰기로 writer 잠금 취득 — 탭을 열기만 하면 잠금이 잡히지 않는다, `writerLock.ts:2-3`). 탭 B 프로필에서 문서 없는 프로젝트 create → C-E2, B의 `/projects`·IDB 변화 0. 탭 A를 **편집 없이** 닫은 경우와 **저장 뒤** 닫은 경우 각각 B 다시 시도 → 성공 / C-E2b | [E] |
| RS3-AC-10 | **회귀 — save-on-leave(B-RS-01)·undo(FIELD-UNDO)·export**: 기존 테스트 전부 통과(변경 0). 추가로 RS3-R1 경로(뒤로로 편집기 재진입)에서 편집 1회 저장 성공 → IDB에 새 문서 + "새로 시작 전" 스냅샷. 되돌리기 1회 뒤 저장 → 같은 결과. 내보내기 요청 → flush로 레코드 확정. 링크 이탈 시 `leave()`는 dirty일 때만 대기한다(지금 그대로) | [U][E] |
| RS3-AC-11 | **예산(관문 — 9절)**: `/studio` 일반 ≤ 129.90 · 복원 ≤ 132.94(판정선, 수정 금지) · `/profile` 첫 화면 ≤ 100 · `/profile`·`/profile (3안 있음)` 진입 직후 ≤ 125이고 base 대비 증분 0 목표(조작 뒤만 변경) · `/projects` 첫 화면 ≤ 100 · 진입 직후 ≤ 125. base·브랜치 두 빌드 출력을 REPORT에 | [G] |
| RS3-AC-12 | 검증 4종(typecheck·lint·test·build) + 가드(`noHardcodedStyle`·브랜드 격리). 기억 모듈 import 간선 가드: `StudioPage`·`StudioLayout`·`useDocSave`·`memoryProjectRepository`·`CandidatesSection`에서 정적·동적 import 0 | [G] |
| RS3-AC-13 | 접근성: P-U1은 글자(색만으로 구분 0). 버튼 이름 "저장 다시 시도"는 행 이름을 포함한 `aria-label`로 둔다(예: "가게 홈페이지 저장 다시 시도" — 기존 `ProjectRow.tsx:52` 링크 관례). 결과 알림은 행 안 한 자리(`role=status`/`alert`). 1280·1024·390에서 버튼 가림 0 | [U][E] |

## 8. 구현 순서 (Developer — RED → GREEN 체크포인트 4개)

0. **Precondition — 진입 증분 측정(구현 전, 코드 커밋 0)**: base `93f8111` 빌드 출력을 기록한다(`/studio` 129.87·132.91, `/profile` 3시나리오, `/projects`). 다음 두 스파이크를 빌드해 9절 표를 채운다.
   - (i) `memoryProjectRepository.ts:122` restart 조건 제거만
   - (ii) (i) + `/projects` 행 분기·기억 모듈
   - 판정선을 넘으면 감량 1회 → 그래도 넘으면 **멈추고 MQ 재상신**. 판정선 수정과 MQ-3-1 B 자동 전환은 하지 않는다.
1. **CP1 — create 가드(B-RS-02)**
   - RED: RS3-AC-01·02·04 테스트를 쓴다. `restartLock.test.ts:136`을 교체하고 RED를 확인한다.
   - GREEN: `memoryProjectRepository.ts:122` 조건을 제거한다. `localSync.guardWrite` 본문은 변경 0이다.
2. **CP2 — 기억 모듈 + create 판정(B-RS-02 화면)**
   - RED: RS3-AC-03·05·06.
   - GREEN:
     - 기억 모듈 신설(예: `features/projects/unconfirmedStart.ts`, import 0, `WeakMap<object, Map>`, 값 `{mode, projectId, version, selected, doc?, held}`).
     - `restartFlow.remember`가 이 모듈을 쓰게 한다.
     - `startEdit` create 실패 판정 5.1을 넣는다.
     - 문구 C-E#를 `restartText.ts`에, `CLEARED_TAB`을 `TAB_REASON`에 둔다.
3. **CP3 — `/projects` 행 게이트(B-RS-03)**
   - RED: RS3-AC-07·13(U).
   - GREEN: `projectRowView`에 미확인 분기(링크 숨김 + 버튼)를 넣는다. 재시도 본문은 조작 뒤 청크(`check-bundle-size.mjs`에 `/projects` afterAction 등록)에 둔다. P-U# 문구를 넣는다.
4. **CP4 — 회귀·예산·실화면**
   - RS3-AC-10(U) · 11 · 12 게이트를 돌린다.
   - Ego Lite RS3-AC-07·08·09·10(E)·13을 확인한다.
   - REPORT에 base·브랜치 빌드 출력과 9절 판정을 적는다.

## 9. 예산 (ADR-004 · 판정선 수정 금지)

| 시나리오 | base 실측(L1) | 판정선 | 이 레인 변경 | 기대(L3 — 실측 전) |
|---|---|---|---|---|
| `/studio/:projectId` | 129.87 (`m2cBaseline.json`) | **129.90**(+0.03) | `memoryProjectRepository.ts:122` 조건 1개 **삭제** | ≤ +0.00 (감소 가능) |
| `/studio` 복원 진입 | 132.91 | **132.94** | 같음 | ≤ +0.00 |
| `/profile` 첫 화면 | 99.90(SPEC r2 실측) | 100 | 0(조작 뒤만) | 0 |
| `/profile` · `(3안 있음)` 진입 직후 | 120.10 · 122.58(MQ-S7 재상신 기록) | 125(MQ-S7 B 계열 ≤ +0.10 수용분 유지) | 0(`restartFlow`·`restartText`·기억 모듈 = 조작 뒤) | 0. 기억 모듈이 공유 청크로 분리되면서 엔진 청크 import 문 몇 바이트가 늘 수 있으니 실측 필수 |
| `/projects` 첫 화면 · 진입 직후 | 실측 필요(P2 기록 105.63은 진입 직후) | 100 · 125 | 행 분기 + 기억 모듈 + 문구 P-U1·P-U5 | 증분 있음(소량, L3) — 한도 여유 큼 |

- **판정선(129.90·132.94)·`m2cBaseline.json`·`bundleBudget.test.mjs` 수정 금지.** 넘으면 감량 1회(예: 조건식 정리) → 그래도 넘으면 멈추고 재상신.
- `/studio` 진입 closure에 들어가는 변경은 조건 삭제 1건뿐이어야 한다(RS3-AC-12 import 간선 가드).

## 10. SPEC r2와 다르게 한 곳 (RS3-D#)

- **RS3-D1**: SPEC r2 3.3.1 3항 "이 판정은 restart에만 쓴다. create의 실패는 지금 그대로"를 → create에도 커밋 확인을 적용하도록 바꾼다(5.1, `DOC_EXISTS`만 예외). 사유: B-RS-02 가드 뒤에도 커밋 뒤 실패가 남고, 지금 문장 "시작하지 못했습니다"는 그 경우 거짓이다.
- **RS3-D2**: SPEC r2 MQ-S2 C("create는 별건")를 이 레인에서 처리한다(MQ-3-2). `restartLock.test.ts:136` 단언을 교체한다.
- **RS3-D3**: SPEC r2 RS-R7("남는 우회 = `/projects` → 편집기")을 → `/projects` 행 게이트로 닫는다. 남는 것은 history 이동(RS3-R1)뿐이다.
- **RS3-D4**: 미확인 기억 위치를 `restartFlow.ts` 모듈 Map에서 의존성 없는 공용 모듈로 옮기고, create도 담는다. 기억 의미·수명(탭 메모리)은 같다.
- **RS3-D5**: 읽기 전용·stale·cleared 탭에서는 프로필 "편집 시작"으로 편집기를 열 수 없게 된다. 지금은 메모리에만 문서를 만들고 같은 안·다른 버전 재클릭으로 편집기가 열렸다(2.2). 그 편집기는 저장이 전부 INFRA였으므로, 잃는 기능은 "저장 안 되는 편집기"뿐이다.

## 변경 이력
- r0 (2026-10-13): 초안 — RS02·RS03 trace 통합, ★ MQ-3-1 A(`/projects` 게이트, `/studio` 0B) · MQ-3-2 A · MQ-3-3 A.
