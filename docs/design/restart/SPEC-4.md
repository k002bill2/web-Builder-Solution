# RESTART SPEC-4 — 미확인 쓰기 이탈 보호 · 실제 저장 재시도 (B-RS-02 · B-RS-03 재정리)

- 작성: RS23 이탈 보호 Designer 레인 · 설계 base `7dbf116` · 앱 base `93f8111` · 코드 0 · **r0.1(Codex a1 반영 — 미재검토)**. 결정 질문 = `docs/design/restart/MQ-4.md`. ★ = 권장안.
- 승인 근거: 사용자 최신 "2" = **이탈 보호 확장**(미확인 상태 새로고침·탭 닫기 경고 + 실제 저장 재시도 수단). 예산 상향·새 스키마·새 인터페이스·의존성·백엔드·push 승인은 **아니다**.
- **SPEC-3 r0.2는 superseded 초안이다.** 수정하지 않고 보존한다. 이 문서가 B-RS-02·03의 구현 기준을 한 번에 다시 정리한다. SPEC-3에서 그대로 가져오는 규칙은 "(SPEC-3 유지)"로 표시하고, 바꾼 규칙은 10절에 적는다.
- 닫아야 하는 지적(최종 게이트 `dev/active/rs23-spec/final-gate/REPORT.md`):
  - **F1 [P1]** create 재시도가 before를 다시 읽어 미확인 기억을 지운다(SPEC-3 5.1 ↔ 6절 3-1 모순).
  - **F2 [P2]** R-E6/C-E6의 "편집기에서 한 번 저장하면 확인됩니다"를 따를 수단이 없다.
  - 그리고 SPEC-3가 남긴 **history 재진입(RS3-R1)** 과 **새로고침·탭 닫기 손실(RS3-R4 · MQ-3-4)**.
- 근거 수준: **L1** = 코드 행 직접 확인(경로 = 앱 `93f8111`) · **L3** = 추정(실측 전). 조사 2건(읽기 전용 서브에이전트)을 메인이 행 단위로 다시 확인했다(REPORT 2절).

## 0. 요약

1. **미확인 기억 = 탭 수명 · 저장소 인스턴스 범위의 단일 모듈**(`pendingWrites`, import 0). 값은 판별 유니온 `PendingStart | PendingRecord`이고, **최초 요청 직전 상태(`origin`)를 기억 안에 한 번만 저장**한다. 재시도는 before를 다시 읽지 않는다 → **F1 닫힘**.
2. **보호는 컴포넌트가 아니라 기억에 붙는다.** 기억이 0→1개가 되는 순간 모듈이 `window`에 `beforeunload`를 걸고, 1→0개가 되는 순간 뗀다. 화면이 언마운트돼도 기억이 남으면 보호가 남는다(언마운트 공백 0). 앱 공통 진입 코드는 0이다 — 기억을 만드는 코드(프로필 조작 뒤 청크 · `/projects` 재시도 청크 · 편집기)가 이미 모듈을 싣는다.
3. **실제 저장 재시도 수단 두 가지(인터페이스 변경 0, L1)**:
   - **요청 재생**(`PendingStart`): 같은 인자 `startDoc` — 같은 키 재생(`memoryDocBook.ts:374-376`)이 판정보다 앞이고, 성공하면 `kept`가 **그 프로젝트의 현재 메모리 레코드 전체**를 IDB 커밋까지 flush한다(`memoryProjectRepository.ts:65-66` · `localSync.ts:152-155`).
   - **내용 보존 저장 확인**(`PendingRecord`): `deleteSnapshot(projectId, "")` — 계약상 "없는 id = 변화 0으로 성공(재시도 멱등)"(`projectRepository.ts:157` · `memoryDocBook.ts:290-291`)이고, 성공하면 같은 `kept` flush를 탄다. revision 증가 0 · 문서 내용 변화 0 · 스냅샷 변화 0(★ MQ-4-2 A).
   - 기억은 **이 두 쓰기의 resolve(= IDB 커밋 확인) 또는 사용자의 명시적 폐기**로만 끝난다. "요청 전 상태와 같음"은 **요청 미반영**일 뿐이고, 저장 확정이 아니다.
4. **F2 닫힘**: R-E6/C-E6(재시도가 `STALE_DOC`/`DOC_EXISTS`로 끝남)은 기억을 지우지 않는다. `PendingStart` → `PendingRecord`로 바꾸고, 문구는 "새로 시작은 반영되지 않았습니다"와 **실행 가능한 버튼 "저장 확인"**을 함께 준다. "편집기에서 한 번 저장" 지시는 삭제한다.
5. **history 재진입(★ MQ-4-1 A)**: 편집기가 진입 때 기억을 읽어 저장 상태를 **"저장 확인 전"**(실패 계열 · 떠나기 경고 · "저장 확인" 버튼)으로 시작하고, 편집기 저장이 성공하면 기억을 지운다. 확인 resolve는 확인 중 편집이 없을 때만 `saved`다(r0.1). 편집기가 확인되지 않은 편집을 가진 채 POP으로 언마운트되면 그 **내용을 `PendingDraft`로 탭 수명 동안 보존**하고, 재진입 뒤 실제 저장으로만 해제한다(r0.1 — 메모리 레코드 확인으로 잃은 편집을 "확인"하지 않는다). 이 레인은 `/studio` 진입 바이트가 필요하므로 **Developer 예산 스파이크가 먼저**다(9절). 넘으면 감량 1회 → 그래도 넘으면 복원하고 멈춰 수치로 보고한다. 그동안 `/studio` 링크는 기억이 있는 프로젝트에서 계속 막는다(SPEC-3 5.2 게이트 유지).
6. **무손실은 보장하지 않는다.** `beforeunload`는 브라우저가 무시할 수 있다(사용자 활성화 없음 · 모바일 백그라운드 종료 · 탭 강제 종료 · 크래시). 경고는 "실수 새로고침 방지"이고, 경고가 떠도 사용자가 떠나면 저장을 확인하지 못한 변경은 사라진다(5.6).

## 1. 범위 / 제외

**범위**
- 기억 모듈 `pendingWrites`(타입 · 전이 · `beforeunload` 토글 · 폐기).
- 프로필 "편집 시작"(create)·"새로 시작"(restart) 판정표 재정리(F1).
- 재시도 종결 R-E6/C-E6 → `PendingRecord` 전이와 "저장 확인"(F2).
- `/projects` 행 게이트(SPEC-3 5.2 유지) + `PendingRecord` 행 · 폐기 확인.
- 편집기 진입 인계(★ MQ-4-1 A — 예산 관문 통과 조건부).
- create 커밋 전 잠금 확인(SPEC-3 3절 4 유지 — `(mode === "restart" || !docs.docOf(projectId)) && guardWrite()`).

**제외**
- 저장소·`LocalSync`·`ProjectRepository` 인터페이스 변경(새 `confirmDoc`·`queue.status` 노출) — MQ-4-2 B로만 남긴다(구현 차단).
- 미확인 상태 IDB 기록(새로고침 뒤에는 기록할 대상이 없다 — SPEC-3 4절 유지).
- 탭 메모리 롤백(되돌리는 경로 없음 — SPEC-3 1절 유지).
- 판정선·`m2cBaseline.json`·`bundleBudget.test.mjs`·ADR-004 수정.
- 다른 탭으로 미확인 상태 전달(BroadcastChannel 등) — 미확인은 이 탭 메모리에만 있다.

## 2. 현재 사실 (L1 — 조사 통합)

| 사실 | 근거 |
|---|---|
| 앱 전체에서 `beforeunload` 등록은 1곳, 편집기 저장 훅의 effect다. 등록·해제가 편집기 마운트 수명에 묶인다. `popstate`·`pagehide`·`useBlocker` 사용 0 | `useAutosaveScheduler.ts:290-291` · grep |
| 경고 조건: 로컬 영속이면 phase가 `idle`·`saved`가 아닐 때 | `useAutosaveScheduler.ts:67-70` |
| 저장 스케줄러는 늘 `idle`에서 시작하고 초기 phase 옵션이 없다. `retry()`는 저장 전 변경(version > savedVersion)이 있을 때만 저장한다 → 편집 없이는 no-op | `useAutosaveScheduler.ts:59,83,102,139-141` |
| "다시 저장" 버튼은 `failed`일 때만 보인다 | `SaveStatus.tsx:57-61` |
| 앱 안 링크 이탈은 `leave()`가 dirty 계열일 때만 저장을 기다린다(B-RS-01) | `useDocSave.ts:142-147` |
| `kept`는 쓰기 성공 뒤에만 flush한다. 판정 실패(`STALE_DOC`·`DOC_EXISTS`·`NOT_FOUND`)·응답 단계 실패는 flush 0회 | `memoryProjectRepository.ts:65-66,69-83` |
| flush는 **호출 시점의 현재 메모리 레코드**(문서·스냅샷·seq)를 쓴다. 마지막 제출과 같으면 `queue.retry`, 다르면 새 제출. 성공 resolve = IDB `oncomplete` 뒤 | `localSync.ts:152-161` · `writeQueue.ts:88-92` · `idbPersistence.ts:54,92-95` |
| flush는 `cleared`면 INFRA, writer가 아니면 `gate.enter()` 뒤 `blocked(mode)` | `localSync.ts:189-192` |
| `startDoc` 같은 키 재생은 `NOT_FOUND`·`DOC_EXISTS`·`STALE_DOC` 판정보다 앞이고, 그 사이 `saveDoc`이 revision을 올려도 재생은 성공한다(옛 result 반환 + 현재 레코드 flush) | `memoryDocBook.ts:374-386` · save는 `starts`를 지우지 않음 `:366` |
| `saveDoc` 같은 내용이라도 새 키(`requested|hash`)면 revision +1. 직전 키와 같을 때만 재생 | `memoryDocBook.ts:358-366` |
| `deleteSnapshot` 없는 id = commit 없이 return(flush는 `kept`가 함). 문서가 메모리에 없으면 `NOT_FOUND`. 스냅샷 id는 `nextSeqId("snapshot", …)` 생성(빈 문자열은 생성되지 않음 — L3, CP1에서 테스트로 고정) | `memoryDocBook.ts:176,285-291` · `projectRepository.ts:157` |
| `committed()`는 **메모리** `getDoc`을 본다. IDB 커밋 확인이 아니다 | `restartFlow.ts:59-66` · `memoryProjectRepository.ts:114-116` |
| 현재 기억: `WeakMap<ProjectRepository, Map<projectId, RestartOpen>>`, restart만. 값 `doc`이 곧 restart의 요청 전 문서(재시도도 같은 `doc` 사용) | `restartFlow.ts:14-35` · `RestartDialog.tsx:80-87,107` |
| LocalSync·ProjectRepository에는 "이 프로젝트 레코드가 커밋됐나"를 묻는 메서드가 없다. 확인 수단은 flush하는 쓰기의 resolve뿐 | `localSync.ts:43-56` · `projectRepository.ts:143-165` |
| 저장소는 탭당 1개다: `main.tsx:29-40` 공유 로더 → `deferredStudio.ts:55` → `sharedLoader.ts:6-13`(성공 캐시). "같은 인스턴스" 계약 `ProfileRepositoryContext.tsx:8-9`. 라우터 위 `AppProviders`(`AppProviders.tsx:29`)가 전달 | 조사 A |
| 라우트 = `BrowserRouter` + `useRoutes`(data router 아님 → `useBlocker` 불가 구조, `routes.tsx:15-17`). 이동 내내 살아 있는 것은 `AppProviders`·`AppLayout` 본문·모듈 수준 상태뿐. Outlet 아래는 `RouteErrorBoundary resetKey={pathname}`로 경로마다 다시 마운트 | `routes.tsx:19-45` · `AppLayout.tsx:9-25` |
| 편집기 앱 안 링크 이탈: `a[href]` 클릭을 가로채 저장을 기다리고, **실패면 이동을 보류**한다. 브라우저 뒤로/앞으로(POP)·주소 직접 입력은 가로채지 않는다 → 편집기 언마운트와 함께 경고 해제. 언마운트 때 스케줄러 dispose로 **디바운스 중인 편집은 버려지고**, 진행 중 저장의 완료 콜백은 무시된다 | `StudioLayout.tsx:127-148` · `useAutosaveScheduler.ts:193,275-279` |
| 진입 state(`useEntryState`)는 마운트 때 1번 읽고 `history.state.usr`를 비운다 → history 재진입에 state로 미확인을 넘길 수 없다 | `useStudioDoc.ts:48-56` |
| **요청 진행 중 공백**: restart는 `startDoc` 호출(`RestartDialog.tsx:107`)부터 `settle`(`:112`)까지, create는 `startEdit` 전체(`restartFlow.ts:47`)에서 기억도 경고도 0 | 조사 A |
| `restartFlow`는 `RestartDialog` 청크 안에만 있다(`CandidatesSection.tsx:74`는 타입 import, 실행은 `restartLoader.ts:4`). 프로필 조작 뒤 청크 | `check-bundle-size.mjs:78` |

## 3. 기억 모델 — 타입 · 범위 · 전이

### 3.1 타입 (모듈 `features/pending/pendingWrites.ts` 예시 — import 0)

```ts
/** 최초 요청 직전 이 탭 메모리의 문서 상태. 최초 요청 때 1번만 읽고, 재시도는 다시 읽지 않는다(F1) */
type Origin =
  | { readonly kind: "absent" }                       // create: 문서 없음(관측함)
  | { readonly kind: "doc"; readonly head: DocHead }  // restart: expectedRevision 출처 = head.revision
  | { readonly kind: "unknown" };                     // create: 최초 before 읽기 실패(관측 못 함) — 재시도에서 "요청 전 그대로" 판정 불가 (r0.1 · Codex P2)

/** 시작 요청(create·restart)이 커밋됐을 수 있으나 IDB 커밋은 확인 못 함. 재시도 = 같은 인자 startDoc 재생 */
interface PendingStart {
  readonly kind: "start";
  readonly mode: "create" | "restart";
  readonly projectId: string;
  readonly version: number;
  readonly selected: string;
  readonly origin: Origin;
  readonly held: "unconfirmed" | "unknown"; // 양성 · 확인 불가
}

/** 시작 요청은 반영되지 않음(종결). 그 사이 메모리 레코드(다른 편집 포함)의 IDB 커밋이 확인되지 않음.
 *  재시도 = 내용 보존 저장 확인(deleteSnapshot(projectId, "")) */
interface PendingRecord {
  readonly kind: "record";
  readonly projectId: string;
  readonly cause: "start-not-applied";
  readonly head?: DocHead; // 안내 문구용(안 · 버전). 판정에 쓰지 않는다
}

/** (CP4 전용 · r0.1 · Codex P1-1) 편집기가 확인되지 않은 편집을 가진 채 언마운트(POP·주소 입력).
 *  저장소 메모리에 들어가지 못했을 수 있는 내용(dirty·offline·커밋 전 failed)을 탭 수명 동안 보존한다.
 *  끝 = 편집기 재진입 뒤 실제 saveDoc resolve, 또는 명시 폐기. 편집기 밖 "저장 확인"으로는 끝나지 않는다 */
interface PendingDraft {
  readonly kind: "draft";
  readonly projectId: string;
  readonly doc: PageDoc;            // 스케줄러의 마지막 편집 내용
  readonly baseRevision: number;    // 저장소가 마지막으로 돌려준 revision(useDocSave revisionRef)
  readonly images?: RenderImages;   // 그 내용이 참조하는 편집 틀 이미지 맵 항목(언마운트로 등록이 풀리므로 함께 보관)
  readonly under?: PendingStart | PendingRecord; // 편집기 진입 전부터 있던 기억(같이 끝난다 — saveDoc resolve = 현재 레코드 전체 flush)
}

type Pending = PendingStart | PendingRecord | PendingDraft;
```

- 타입 import만(`DocHead`) — 런타임 import 0. 엔진·도메인·저장소 모듈을 끌어오지 않는다(RS4-AC-12 간선 가드).
- `RestartOpen.doc`(지금 restart 기억)은 `origin.head`로 옮긴다. 의미는 같다.

### 3.2 범위 · 수명

| 축 | 규칙 |
|---|---|
| 키 | `WeakMap<object(저장소 인스턴스), Map<projectId, Pending>>` — 지금 `restartFlow.ts:29`와 같은 범위. 프로젝트당 1건 |
| 수명 | 탭(문서) 수명. 새로고침·탭 닫기·파괴 흐름의 새로고침 이동이면 모듈과 함께 사라진다(그때 메모리도 IDB로 돌아간다) |
| 저장소 인스턴스 | 앱은 탭당 저장소 1개를 공유한다(2절 — 성공 캐시 공유 로더, 바뀌는 경로 0). 그래도 보호 카운트는 WeakMap을 셀 수 없으므로 **모듈 전역 집합 `active: Set<string>`(`${인스턴스 seq}:${projectId}`) + 진행 중 요청 수 `inflight`** 로 센다. 테스트가 저장소를 여러 개 만들어도 카운트가 섞이지 않는다 |
| 읽기 | `pendingOf(repo, projectId)` 동기 조회(쓰기 0) |
| 쓰기 | `hold(repo, pending)` · `release(repo, projectId, why: "confirmed" \| "not-applied-absent" \| "discarded")` 두 함수만. 지우는 이유를 인자로 받아 테스트가 "확인 없이 지움"을 잡는다 |

### 3.3 이탈 보호(beforeunload) — 기억에 붙는다

1. `hold`가 (`active.size + inflight`)를 0 → 1로 만들면 `window.addEventListener("beforeunload", onUnload)`. `release`가 1 → 0으로 만들면 `removeEventListener`.
   - **요청 진행 중 보호**(2절 공백): 프로필·`/projects`의 `startDoc`·확인 쓰기는 `guarding(promise)`로 감싼다 — 시작 때 `inflight+1`, 끝(resolve·reject 모두, `finally`)에 `-1`. 판정 결과가 기억이면 `hold`가 `finally`보다 먼저 일어나게 해 카운트가 0을 거치지 않는다(RS4-AC-05). 진행 중 새로고침을 경고하는 것은 커밋 여부를 모르는 구간이기 때문이다.
2. `onUnload(e)`: `e.preventDefault()` + `e.returnValue = ""`(브라우저 기본 문구 — 사용자 지정 문구는 표시되지 않는다).
3. **화면 수명과 무관**: 등록 주체가 모듈이라 프로필 대화상자·`/projects` 행·편집기가 언마운트돼도 기억이 있으면 보호가 남는다. 화면 언마운트로 보호가 사라지는 순간이 0이다.
4. **기존 편집기 보호는 그대로**: `useAutosaveScheduler.ts:286-291` 경고(dirty·saving·failed·offline·stale)는 변경 0. 두 리스너가 동시에 있어도 브라우저 경고는 1번이다.
5. **편집기 언마운트 공백**(★ MQ-4-1 A의 CP4 · r0.1 Codex P1-1로 교정): 앱 안 링크는 저장 실패 시 이동을 보류하므로(2절) 공백은 POP·주소 입력뿐이다. 이때 phase `dirty`·`saving`·`failed`·`offline`이면 **최신 편집이 저장소 메모리에 없을 수 있다** — `offline`은 저장 호출 전에 멈추고(`useAutosaveScheduler.ts:171-176`), `failed`는 커밋 전 실패일 수 있고, `dirty`는 디바운스 중이다. 그래서 메모리 레코드를 확인하는 `PendingRecord`로 바꾸면 잃은 편집에 "확인했습니다"를 주게 된다(거짓 saved).
   - 규칙: cleanup에서 `hold(PendingDraft{doc: 스케줄러 최신 내용, baseRevision, images, under: 진입 때 기억})`를 먼저 하고 리스너를 뗀다(순서 반대면 공백 — RS4-AC-05).
   - 편집기 재진입 때 draft를 화면 문서로 복원하고 **dirty**로 시작한다 → 기존 자동 저장(`saveDoc(p, baseRevision, doc)`)이 실제 저장한다. resolve면 draft(와 `under`) 해제. `STALE_DOC`이면 기존 충돌 흐름(E-S09 — 내 편집 유지 · 선택).
   - `stale` phase: 기존 충돌 흐름 소관 — 같은 규칙으로 draft를 남겨 재진입 때 충돌 선택을 다시 보여 준다.
   - 편집기 밖에서는 draft를 저장하지 않는다(엔진 해시·이미지 맵이 필요 — 편집기 소관). 밖에서는 상태 글자 + "편집기에서 이어 저장" 링크 + 폐기만.
6. **폐기(사용자 명시)**: `discardAndReload()` = 확인 대화(5.5) 뒤 `active` 비우기 · `inflight = 0` → 리스너 해제 → `location.reload()`. 리스너를 먼저 떼야 브라우저 경고가 두 번 묻지 않는다. 편집기가 마운트된 채 폐기하면 편집기 자체 경고(`useAutosaveScheduler.ts:286-291`)가 남으므로, 폐기 버튼은 편집기 밖(프로필·`/projects`)에만 둔다. 자동 폐기는 없다.
7. `onUnload` 본문은 기존 편집기 핸들러와 같게 한다(`useAutosaveScheduler.ts:286-289` — `preventDefault()` + `returnValue = ""`).

### 3.4 전이표 (닫힌 상태)

| 지금 | 사건 | 다음 | 근거 |
|---|---|---|---|
| 없음 | 최초 요청 resolve | 없음(성공 경로) | resolve = flush 커밋 확인 |
| 없음 | 최초 요청 reject → 판정표 4.1 양성·진행됨 | `PendingStart{held:"unconfirmed"}` | 4.1 |
| 없음 | 최초 요청 reject → `now` 읽기 실패, 또는 before 읽기 실패 + 지금 문서 있음 | `PendingStart{held:"unknown"}`(origin 그대로 — `unknown` 포함) | 4.1 F-5·F-6 (before 실패 + 문서 없음 = F-6b 사유) |
| 없음 | 최초 요청 reject → 요청 전 그대로 / 처음 `STALE_DOC`·`DOC_EXISTS` | 없음(사유 문구 · SPEC-3 C-E2~3 · R-E1) | 이 요청이 쓴 것 0. 이 탭에 다른 미확인 신호가 없으므로 새 기억을 만들지 않는다 |
| `PendingStart` | 재생 resolve | 없음(`release "confirmed"`) | 현재 레코드 전체 flush 커밋 |
| `PendingStart` | 재생 reject → `STALE_DOC`·`DOC_EXISTS` | 메모리에 문서 있음 → `PendingRecord{cause:"start-not-applied"}` | 같은 키는 커밋된 적 없음(L1 — 재생이 판정보다 앞). 그 사이 편집의 영속 여부는 모름 |
| `PendingStart` | 재생 reject → 지금 = `origin`과 정확히 같음(origin `unknown`이면 이 행 없음 — 다음 행) | origin `absent`면 없음(`"not-applied-absent"` — 메모리에 문서 0 = IDB에도 이 문서 0). origin `doc`이면 `PendingRecord{cause:"start-not-applied"}` | "요청 전 그대로" = 요청 미반영일 뿐, origin 레코드의 영속 확정이 아니다 |
| `PendingStart` | 재생 reject → 양성·진행됨·확인 불가 · **origin `unknown`의 모든 그 밖 reject** | 그대로(`held` 갱신) | 6절 · 관측하지 않은 부재로 지우지 않는다(r0.1 Codex P2) |
| `PendingRecord` | "저장 확인" resolve | 없음(`"confirmed"`) | 현재 레코드 전체 flush 커밋 |
| `PendingRecord` | "저장 확인" reject | 그대로 + 사유 문구 | — |
| `PendingRecord`·`PendingStart` | 편집기 저장 resolve(★ CP4) | 없음(`"confirmed"`) | `saveDoc` resolve = 같은 flush |
| 편집기 안 `PendingStart`·`PendingRecord` | 편집기 "저장 확인" resolve(★ CP4) | 기억 해제. **phase는 확인 시작 뒤 편집이 없을 때만 `saved`**, 있으면 `dirty` 유지 · 경고 유지 · 자동 저장 계속 | 확인은 제출 시점 레코드만 확인한다(`localSync.ts:151-161`) — r0.1 Codex P1-2 |
| 없음·기억 | (CP4) 편집기가 `dirty`·`saving`·`failed`·`offline`·`stale`로 언마운트 | `PendingDraft{under: 기존 기억}` | 3.3-5 — 최신 편집이 메모리에 없을 수 있음 |
| `PendingDraft` | 편집기 재진입 → draft 복원 → `saveDoc` resolve | 없음(`"confirmed"`, `under` 포함) | 실제 저장 · 현재 레코드 전체 flush |
| `PendingDraft` | 편집기 밖 "저장 다시 시도/저장 확인" | 없음 — 버튼을 두지 않는다 | 밖에서는 draft 내용을 저장할 수 없다 |
| 어느 것이든 | 사용자 "버리고 새로고침" 확인 | 없음(`"discarded"`) → reload | 5.5 |
| 어느 것이든 | 새로고침·탭 닫기(경고를 지나침) | 모듈째 소멸 | 브라우저 — 5.6 |

- `PendingRecord`의 재시도는 `startDoc`을 부르지 않는다. 그래서 `STALE_DOC` 고착(SPEC-3 r2 P2)이 다시 생기지 않는다.
- 다른 화면(편집기 저장·복원·내보내기)이 이 프로젝트를 성공적으로 써도 ★ CP4 전에는 기억이 남는다(RS4-R2 — 1클릭 확인으로 끝남, 거짓은 아님).

## 4. 판정표 — 최초 요청 vs 재시도 (F1)

### 4.1 최초 요청 (기억 없음)

`origin`은 `startDoc` **직전** `getDoc`으로 1번 읽는다(create·restart 공통 · 조작 뒤 청크). restart는 대화상자가 가진 `doc`이 곧 origin이다(지금과 같음 — 따로 읽지 않는다). create에서 읽기가 실패하면 `origin = {kind:"unknown"}`이고, 기억이 생기면 **그대로 기억에 저장**한다(r0.1 · Codex P2 — 재시도에서 관측값으로 덮지 않는다).

| # | 결과 | create 판정 | restart 판정 | 결과 상태 |
|---|---|---|---|---|
| F-1 | resolve | 성공(지금 그대로 + 재판정 SPEC r2 3.1) | 성공 | 없음 |
| F-2 | `DOC_EXISTS`(동봉 doc) | `judge`(지금 그대로) | — | 없음 |
| F-3 | `STALE_DOC` | — | R-E1/R-E1b(SPEC r2 그대로) | 없음 |
| F-4 | `UNKNOWN_VARIANT` | alert(지금 그대로) | 같음 | 없음 |
| F-5 | 그 밖 reject → `now = getDoc()` 실패 | C-E5 | R-E5 | `PendingStart unknown`(origin은 읽은 그대로 — create 읽기 실패면 `unknown`) |
| F-6 | 그 밖 reject → origin `unknown` + now 문서 있음(요청 쌍이든 아니든) | C-E5 | — | `PendingStart unknown{origin unknown}` |
| F-6b | 그 밖 reject → origin `unknown` + now 문서 없음 | C-E3(커밋 0 — create가 커밋했다면 지금 문서가 있다; 메모리 문서는 이 탭에서 지워지지 않는다) | — | 없음 |
| F-7 | 그 밖 reject → 양성: create `origin absent && now 요청 쌍` · restart `now.revision === origin.revision+1 && 요청 쌍` | C-E4 | R-E4 | `PendingStart unconfirmed` |
| F-8 | 그 밖 reject → 요청 전 그대로: create `origin absent && now undefined` · restart `now`가 origin과 revision·안·버전 모두 같음 | 사유 C-E2/2b/2c/3 | 사유(SPEC r2) | 없음 |
| F-9 | 그 밖 reject → create `origin doc`(같은 키 재생이 아닌데 문서가 있었다 — 가드 전에 `DOC_EXISTS`가 났어야 하는 모양) | C-E3(커밋 0 — create는 문서가 없을 때만 커밋) | — | 없음 |
| F-10 | 그 밖 reject → 진행됨(restart `now.revision > origin.revision+1` 또는 쌍 불일치 + revision 증가) | — | R-E4(미확인 유지 — SPEC-3 6절 3-1 유지) | `PendingStart unconfirmed` |

### 4.2 재시도 (기억 = `PendingStart`) — **before를 다시 읽지 않는다**

재시도는 기억의 `{mode, version, selected, origin}`으로 같은 키를 만든다(restart `expectedRevision = origin.head.revision`). 판정은 기억의 `origin`과 비교한다.

| # | 결과 | 판정 | 다음 상태 | 문구(5절) |
|---|---|---|---|---|
| R-1 | resolve | 확인 | 없음 | 성공(프로필 = 이동 · `/projects` = P-U2) |
| R-2 | `STALE_DOC`(restart) · `DOC_EXISTS`(create) | 같은 키 미커밋 → **요청 미반영 종결** | `PendingRecord start-not-applied` | R-E6 / C-E6(새 문구 — "저장 확인" 버튼) |
| R-3 | 그 밖 reject → `getDoc` 실패 | 확인 불가 | `PendingStart unknown` | R-E5 / C-E5 / P-U3 |
| R-4 | 그 밖 reject → 지금 = origin 그대로(origin `absent`·`doc`만) | 요청 미반영 | origin `absent` → 없음 · origin `doc` → `PendingRecord start-not-applied` | P-U4(absent) / R-E6·C-E6 문형(doc) |
| R-4u | 그 밖 reject → origin `unknown` | 판정 불가("요청 전 그대로"를 알 수 없다) | `PendingStart unknown` 유지 | C-E5 / P-U3 |
| R-5 | 그 밖 reject → 그 밖 모두(요청 쌍 · 진행됨 · origin `absent`인데 문서 있음) | 미확인 유지 | `PendingStart unconfirmed` | R-E4 / C-E4 / P-U3 |

- origin `unknown` 기억은 R-1(재생 resolve)·R-2(`DOC_EXISTS` → `PendingRecord`)·명시 폐기로만 끝난다.

- **F1 닫힘 근거**: C-E4(최초 create 커밋 뒤 flush 실패) → 재시도 → 같은 키 재생 → flush 또 실패 → R-5(origin `absent`인데 문서 있음 = 미확인 유지). SPEC-3 5.1의 "before가 문서면 음성" 규칙은 **최초 요청 F-9에만** 남고 재시도에는 쓰지 않는다. 기억에 처음 before(`origin`)가 있다.
- **같은 키 재생과 R-E5 복구 경로 분리**:
  - (가) **재생 경로**: 처음 요청이 커밋됐다면(C-E4/R-E4, 또는 R-E5인데 실제로는 커밋됨) 재시도는 그 사이 편집이 revision을 올렸어도 재생으로 resolve한다(`memoryDocBook.ts:374-376` · save는 `starts` 보존 `:366`). → R-1, 현재 레코드 전체 확인.
  - (나) **미커밋 경로**: R-E5인데 실제로는 request 단계에서 실패(커밋 0) → 그 사이 편집 → 재시도 = 새 커밋 판정 → `STALE_DOC`(expectedRevision이 옛 값) → R-2 → `PendingRecord` → "저장 확인"이 그 사이 편집까지 확인한다. 고착 0, 거짓 저장 0.
  - (다) 같은 (나)에서 그 사이 편집이 없으면 재시도는 새 요청으로 정상 커밋된다(R-1 또는 R-5).
- **링크를 여는 것만으로 저장됐다고 보지 않는다**: `PendingRecord`가 있는 동안 `/projects` 링크는 계속 막는다(★ CP4 통과 시 편집기 인계로 대체 — 5.3).

### 4.3 `PendingRecord` "저장 확인"

- 이미지 조건(r0.1): RS4-R10 — P-3 측정 전에는 편집기 밖 확인이 이미지까지 확인한다고 단정하지 않는다.

- 호출: `repo.deleteSnapshot(projectId, "")`(★ MQ-4-2 A). 조작 뒤 청크.
- resolve → `release "confirmed"` · 성공 문구. reject → 사유 판정(SPEC-3 6절 5 상수 비교):
  - `READ_ONLY_TAB` → "다른 탭에서 편집 중이라 저장을 확인하지 못했습니다 — 그 탭을 닫은 뒤 저장 확인을 다시 누르세요"(버튼 유지).
  - `STALE_TAB` → "다른 탭에서 바뀐 내용이 있어 이 탭은 더 저장할 수 없습니다 — 이 탭의 확인되지 않은 변경은 새로고침하면 사라집니다"(버튼 숨김 · 폐기만).
  - `CLEARED_TAB` → 같은 문형("이 브라우저 데이터가 지워져 …").
  - `NOT_FOUND`(메모리 문서 없음 — 이론상 없음) → `release "not-applied-absent"`.
  - 그 밖(quota·중단) → "아직 저장을 확인하지 못했습니다 · {사유}"(버튼 유지).
- 같은 내용 `saveDoc`은 쓰지 않는다(새 키면 revision +1 — `memoryDocBook.ts:364`, 다른 탭에 저장 세대 신호). 쓸 경우는 MQ-4-2 C.

## 5. 화면 · 문구 · 버튼 · 포커스 · 알림

### 5.1 프로필 — create(Callout · 지금 자리) · restart(대화상자 · 지금 자리)

| ID | 상태 | 문구 | 버튼 | 알림 |
|---|---|---|---|---|
| C-E2·2b·2c·3 | 사유(쓰기 0) | SPEC-3 5.1 표 그대로 | SPEC-3 그대로 | `role=alert` |
| C-E4 | `PendingStart unconfirmed`(create) | "편집 문서를 만들었지만 브라우저에 저장됐는지 확인하지 못했습니다 — 저장 다시 시도를 누르면 같은 요청으로 저장을 이어 갑니다. 확인 전에 새로고침하거나 탭을 닫으면 이 편집 문서는 사라집니다" | **저장 다시 시도**(주) · 버리고 새로고침(보조) | `role=alert` |
| C-E5 | `PendingStart unknown`(create) | "편집 문서를 만들었는지 확인하지 못했습니다 — 저장 다시 시도는 같은 요청이라 두 번 만들어지지 않습니다" | 같음 | `role=alert` |
| C-E6 | `PendingRecord start-not-applied`(create) | "편집 시작은 반영되지 않았습니다 — 이 프로젝트에는 이미 문서(X안 · vN)가 있습니다. 그 문서가 브라우저에 저장됐는지는 아직 확인하지 않았습니다 — 저장 확인을 누르면 확인한 뒤 엽니다" (r0.1 — "엽니다" 단정 삭제: 확인 전 이동 0) | **저장 확인**(주) · 버리고 새로고침(보조) | `role=alert` |
| R-E4·R-E5 | `PendingStart`(restart) | SPEC r2 문구 + 끝에 "확인 전에 새로고침하거나 탭을 닫으면 새로 시작과 그 뒤 편집이 사라집니다" | 저장 다시 시도 · 버리고 새로고침 | 대화상자 `role=alert` |
| R-E6 | `PendingRecord start-not-applied`(restart) | "새로 시작은 반영되지 않았습니다 — 그 사이 이 문서가 바뀌었습니다(X안 · vN). 이 문서가 브라우저에 저장됐는지는 아직 확인하지 않았습니다 — 저장 확인을 누르세요" | **저장 확인** · 버리고 새로고침 | `role=alert` |
| P-OK | 확인 성공(프로필) | "저장을 확인했습니다" | **확인 뒤에만** 기존 판정으로 간다: create = 동봉/지금 doc로 `judge`(같은 안 = 이동 · 다른 안 = F4) · restart 대화상자 = 지금 doc로 R-E1/R-E1b 문형(같은 안이면 기존 "편집기 열기" 이동 제공). 확인 전에는 `go`·`judge` 호출 0 | `role=status` |

- 포커스: 상태가 바뀌면 포커스는 주 버튼에 남는다(버튼 이름이 바뀌어도 같은 요소 — 지금 대화상자 관례). 진행 중에는 `aria-busy` + `aria-disabled`, 연타는 요청 1회.
- `startEdit` 첫 줄 규칙(기억이 있으면 그 상태부터)은 **세 종류 모두**에 적용하고, 다시 여는 문구는 **기억의 종류·`cause`로 고른다**(r0.1): `PendingStart` → C-E4/C-E5/R-E4/R-E5 · `PendingRecord start-not-applied` → C-E6/R-E6 · `PendingDraft` → "이 문서에 편집기에서 저장을 확인하지 못한 편집이 있습니다 — 편집기에서 이어 저장하세요" + 링크 "편집기에서 이어 저장"(CP4에서만 생김) · 보조 폐기. `PendingDraft`에는 create·restart를 실행하지 않는다.
- "편집기에서 한 번 저장하면 확인됩니다" 문장은 **삭제**(F2).

### 5.2 `/projects` 행 (SPEC-3 5.2 게이트 유지 + 확장)

| 기억 | 상태 글자(P-U1 · 글자로) | 행동 |
|---|---|---|
| `PendingStart` | SPEC-3 P-U1 그대로 | "편집기 열기" 숨김 · **저장 다시 시도**(재생) |
| `PendingRecord` | "이 문서(X안 · vN)가 브라우저에 저장됐는지 확인하지 못했습니다" | "편집기 열기" 숨김(★ CP4 통과 전) · **저장 확인** |
| `PendingDraft`(CP4에서만) | "편집기에서 저장을 확인하지 못한 편집이 있습니다(X안 · vN)" | "편집기에서 이어 저장" 링크(편집기가 draft를 복원해 실제 저장) · 행 "저장 확인" 없음
| 공통 | 캡션 P-U5: "확인 전에 새로고침하거나 탭을 닫으면 확인되지 않은 변경이 사라집니다 — 이전에 저장된 상태로 돌아갑니다" | 보조 **버리고 새로고침**(5.5) |

- 결과 알림은 행 안 한 자리: 성공 `role=status` P-U2 "저장을 확인했습니다 — 편집기를 열 수 있습니다" + 포커스 → 되살아난 "편집기 열기". 실패 `role=alert` P-U3(4.3 사유 문형) + 포커스 유지. `PendingRecord`로 바뀌면 `role=alert` "새로 시작(편집 시작)은 반영되지 않았습니다 — 저장 확인을 눌러 이 문서의 저장을 확인하세요" + 포커스 → "저장 확인".
- `aria-label`은 행 이름 포함(SPEC-3 RS3-AC-13 유지).

### 5.3 편집기 진입 인계 (★ MQ-4-1 A · CP4 — 예산 관문 통과 조건부)

| 항목 | 규칙 |
|---|---|
| 진입 | `pendingOf(repo, projectId)`가 `PendingStart`·`PendingRecord`면 저장 상태를 **`unconfirmed`**(기존 `failed` 계열 표시 재사용 — 바이트 최소)로 시작. 상태 글자 "브라우저 저장을 확인하지 못했습니다", 버튼 **저장 확인**, 떠나기 경고 켬(`needsUnloadGuard`가 `idle`·`saved`가 아니므로 자동). `PendingDraft`면 draft 내용·이미지 맵을 복원하고 **dirty**로 시작(자동 저장이 실제 저장) |
| 저장 확인 | `PendingStart`면 재생, `PendingRecord`면 `deleteSnapshot(projectId, "")` — 저장 훅 바깥 1회 호출이지만 **스케줄러 버전과 묶는다**(r0.1 · Codex P1-2): 시작 때 스케줄러 version을 기록 → resolve면 기억 해제, version이 그대로면 `saved`, 늘었으면 `dirty` 유지(경고·자동 저장 계속). 확인 중 편집은 막지 않는다. reject면 4.3 사유 문형 · phase 유지 |
| 편집 저장 | 지금 경로 그대로(`saveDoc`). resolve하면 기억 삭제(현재 레코드 전체 flush 커밋 = 기억이 가리키는 쓰기를 포함) |
| 떠남 | phase가 `dirty`·`saving`·`failed`·`offline`·`stale`이면 cleanup에서 `hold(PendingDraft)` 먼저, 리스너 해제 나중(3.3-5). `idle`·`saved`·`unconfirmed`(편집 없음)면 진입 때 기억을 그대로 둔다 |
| 링크 게이트 | CP4가 들어가면 `/projects`의 `PendingRecord` 행은 "편집기 열기"를 되살린다(편집기가 인계·확인 — 이미지 맵이 등록된 자리). `PendingStart` 행은 게이트 유지(재생을 한 곳에서). `PendingDraft` 행은 "편집기에서 이어 저장" 링크 |
| 예산 실패 시 | CP4를 넣지 않는다. 링크 게이트 유지 · history 재진입은 RS4-R1로 남긴다(5.6) |

### 5.4 history 재진입

- CP4 있음: 진입 경로와 무관하게 편집기가 기억을 읽는다 → 거짓 `idle` 0. 뒤로/앞으로 재진입 문제(RS3-R1) 닫힘.
- CP4 없음(예산 관문 실패): 편집기는 지금처럼 `idle`로 연다. 단 **기억 모듈의 `beforeunload`는 살아 있다**(모듈 리스너는 라우트와 무관) → 새로고침·탭 닫기 경고는 편집기 안에서도 뜬다. 남는 거짓: 상태 글자 빈칸·"저장 확인" 버튼 없음. 편집 1회 저장이 성공하면 레코드 전체가 써지지만 기억은 남아(RS4-R2) 다음 화면에서 1클릭 확인이 필요하다.

### 5.5 폐기 확인 ("버리고 새로고침")

1. 보조 버튼 클릭 → 같은 자리에서 확인 Callout(`role=alertdialog`, 이름 "확인되지 않은 변경 버리기").
2. 문구: "이 탭에서 저장을 확인하지 못한 변경(새로 시작 · 편집 문서 · 그 뒤 편집)을 버리고, 브라우저에 마지막으로 저장된 상태로 다시 엽니다. 되돌릴 수 없습니다." — "자동 복구" 표현 금지.
3. 버튼: **취소**(첫 포커스) · **버리고 새로고침**(위험 스타일 토큰). Esc = 취소 → 포커스는 보조 버튼으로 돌아간다.
4. 확인 → `discardAndReload()`(3.3-6). 탭 안 모든 미확인 기억이 함께 사라진다는 점을 문구가 말한다(새로고침은 프로젝트 단위가 아니다).

### 5.6 남는 경로 · 브라우저 한계 (숨기지 않는다)

| ID | 경로 | 결과 | 완화 |
|---|---|---|---|
| RS4-R1 | CP4 예산 실패 시 history 재진입 | 편집기 `idle` 표시(거짓 idle). 새로고침 경고는 있음 | 예산 재상신(MQ-4-1). 링크 게이트 유지 |
| RS4-R2 | CP4 없이 편집기 저장 성공 | 기억 남음 → 다음 화면 1클릭 "저장 다시 시도/저장 확인" → 즉시 확인(재생 또는 retry no-op) | 문구는 "확인하지 못했다"(거짓 아님) |
| RS4-R3 | `beforeunload` 미표시 | Chrome·Safari·Firefox는 **sticky user activation**(그 페이지에서 사용자 클릭·키 입력)이 없으면 경고를 띄우지 않는다. 미확인 상태는 클릭으로만 생기므로 대개 충족하지만 보장은 아니다 | 문구 P-U5가 미리 밝힘 |
| RS4-R4 | 모바일·강제 종료 | iOS Safari·Android는 백그라운드 탭 종료·앱 전환에서 `beforeunload`를 부르지 않을 수 있다. 크래시·OS 종료·작업 관리자 종료도 마찬가지 | 무손실 보장 없음(0절 6) |
| RS4-R5 | 경고를 지나침 | 사용자가 "떠나기"를 고르면 미확인 변경은 사라지고 이전 IDB 상태가 남는다 | 문구로 밝힘 |
| RS4-R6 | 다른 탭 | 미확인은 이 탭 메모리에만. 다른 탭은 옛 IDB 상태를 보고, 이 탭이 잠금을 쥐고 있으면 읽기 전용 | SPEC-3 RS3-R3 그대로 |
| RS4-R8 | 편집기 `dirty`·`offline`·커밋 전 `failed`에서 POP·주소 입력 | CP4 있음: `PendingDraft`로 탭 수명 보존 → 재진입 때 실제 저장(3.3-5). **CP4 없음(예산 실패)**: 지금 동작 그대로 그 편집은 저장소 메모리에도 없이 버려지고, POP은 `beforeunload` 대상이 아니라 경고도 없다 | CP4 예산 관문에 달림. 기존 동작 약화 0 |
| RS4-R9 | 기억 확인 성공의 의미 | "저장 확인"은 **이 탭 메모리 레코드 전체**가 IDB에 커밋됐음을 확인한다. 메모리에 들어가지 못한 편집(R8)은 대상이 아니다 | 성공 문구는 "브라우저 저장을 확인했습니다"(문서 단위) — "모든 편집이 저장됐다"고 말하지 않는다 |
| RS4-R10 | 편집기 밖 "저장 확인"과 이미지 (r0.1 · advisor) | `kept`는 이미지 맵을 `maps.get(projectId) ?? held`로 넘기는데 편집기를 떠나면 등록이 풀린다(`memoryProjectRepository.ts:64-66`). 마지막 제출과 레코드가 다르면 새 제출이 되고, 맵이 없으면 새로 참조된 이미지 blob은 넣지 않는다(`imageOps.ts:19-25` — 메타 없는 참조는 put 0). 즉 **쓰기 문이 막혀 제출 0이었던 편집(읽기 전용·stale 탭에서 새 이미지를 넣은 편집)을 편집기 밖에서 확인하면 이미지 레코드 없이 문서가 커밋될 수 있다(L3 — 실측 전)** | 8.0 P-3 측정으로 확정. 확인되면 편집기 밖 "저장 확인"은 `PendingRecord`에 한해 CP4가 있으면 편집기로 넘기고(링크 게이트 행), CP4가 없으면 결함으로 MQ-4-2 재상신 — 구현 차단 |
| RS4-R7 | bfcache | `beforeunload` 리스너가 있는 동안 일부 브라우저는 페이지를 bfcache에 넣지 않을 수 있다(L3). 기억이 있는 동안만 리스너가 있어 영향은 그 구간뿐 | — |

## 6. 공통 규칙 (SPEC-3 6절 대체)

1. **영속 확인 = flush하는 쓰기의 resolve뿐**: `startDoc` 재생 · `deleteSnapshot(projectId, "")` · 편집기 `saveDoc`. 메모리 `getDoc`은 **커밋 여부(이 요청이 메모리에 썼는가)** 판정에만 쓰고, 영속 성공 근거로 쓰지 않는다.
2. **기억 삭제 이유는 3개뿐**: `confirmed`(위 1의 resolve) · `not-applied-absent`(origin `absent` + 지금도 문서 없음) · `discarded`(사용자 확인). 그 밖의 삭제 0 — 테스트가 `release` 인자를 단언한다.
3. **"요청 전 그대로" = 요청 미반영**. 기억이 있던 프로젝트에서 이 판정이 나면 origin `doc`이면 `PendingRecord`로 바꾸고 지우지 않는다.
4. **재시도는 기억의 인자 그대로, before 재조회 0**(F1). 화면이 인자를 다시 만들지 않는다.
5. **`STALE_DOC`·`DOC_EXISTS` 추론(L1 — SPEC-3 유지)**: 같은 키 재생이 판정보다 앞이고 `state.starts`는 start 커밋 1곳에서만 쓰이며, 기억이 있는 동안 이 탭의 다른 start는 `startEdit` 첫 줄이 막는다 → 이 오류로 끝난 같은 키 요청은 커밋된 적 없다. 전제(다른 start 0)는 RS4-AC-03이 고정한다.
6. 사유 상수 비교는 `infra.ts` 값과 같아야 한다(SPEC-3 6절 5 유지 · `CLEARED_TAB` 추가).
7. 판정 근거는 이 탭 메모리(SPEC-3 6절 2 유지).

## 7. 수용 기준 (RS4-AC)

태그: **[U]** Vitest · **[G]** 가드·빌드 · **[E]** 브라우저 QA(Ego Lite, `npm run build` + `vite preview`, 앱 안 클릭만 — 메모리 store 새로고침 함정·PNG preview 규칙). [E]의 멀티 탭은 **잠금 실제 취득**(탭 A에서 실제 편집 저장 1회 — 열기만으로는 잠금 0, `writerLock.ts:2-3`)을 먼저 한다.

| ID | 조건 | 검증 |
|---|---|---|
| RS4-AC-01 | **F1**: create 처음 요청 commit 뒤 flush 실패(quota) → C-E4 · 기억 `PendingStart{origin absent}` → 재시도(flush 계속 실패) 1·2회 → 기억 유지 · `release` 호출 0 · `/projects` 링크 0 · "반영되지 않았다" 문장 0. 재시도 경로에서 `getDoc` before 읽기 호출 0(스파이). flush 성공 주입 → R-1 · IDB 문서 1 · 기억 0 | [U] |
| RS4-AC-02 | **F2**: R-E5(request 실패 + getDoc 실패) → 편집 저장 ① 성공 ② commit 뒤 실패 → 재시도 = `STALE_DOC` → `PendingRecord start-not-applied` · 기억 유지 · 링크 0 · "저장 확인" 버튼 존재 · "편집기에서 한 번 저장" 문장 0 → "저장 확인"(`deleteSnapshot(p,"")`) ② 경우 flush 실패 주입 → 유지 · 성공 → 기억 0 · IDB 문서 = 메모리(그 사이 편집 포함) · revision 변화 0 · 스냅샷 수 변화 0. create 대응(C-E5 → `DOC_EXISTS` → C-E6)도 같다 | [U] |
| RS4-AC-03 | **같은 키 재생 분리**: C-E4/R-E4 뒤 편집 저장으로 revision +2 → 재시도 = 재생 resolve(STALE 0) → 기억 0 · IDB = 메모리(편집 포함). 기억이 있는 동안 프로필 다른 안 "편집 시작" → `startDoc` 호출 0(기억 재표시) | [U] |
| RS4-AC-04 | **판정표 4.1 전 행**: request·commit·response·flush 주입 × create·restart → F-5~F-10 기대 상태. 거짓 양성 0(SPEC-3 RS3-AC-05 유지 · 같은 쌍 문서가 이미 있고 가드 거절 → C-E2 · 기억 0) | [U] |
| RS4-AC-05 | **보호 수명**: `hold` 0→1 → `beforeunload` 등록 1회, 이벤트 `defaultPrevented` true · 1→0 → 해제. 화면(대화상자·행·편집기) 언마운트 뒤에도 기억이 있으면 리스너 존재. (CP4) 편집기 `failed`·`offline`·`dirty` 상태 언마운트 → `PendingDraft` · cleanup 순서: `hold` 호출이 리스너 해제보다 먼저(호출 순서 스파이) | [U] |
| RS4-AC-06 | **기존 보호 약화 0**: `useAutosaveScheduler` 경고 테스트·`StudioLeave`(B-RS-01) 테스트 전부 변경 없이 통과. dirty 편집 뒤 앱 안 링크 이탈 = 저장 대기 그대로 | [U] |
| RS4-AC-07 | **`/projects` 행**: `PendingStart`·`PendingRecord` 각각 P-U1 글자 · 링크 0 · 버튼 이름 · 성공 P-U2 + 포커스 = 링크 · 실패 P-U3 + 포커스 유지 · 다른 행 변화 0 | [U][E] |
| RS4-AC-08 | **폐기 확인**: 보조 버튼 → `alertdialog` · 첫 포커스 = 취소 · Esc = 취소(기억 유지 · reload 0) · 확인 → 기억 0 → 리스너 해제 → `location.reload` 1회(순서 단언) | [U][E] |
| RS4-AC-09 | **새로고침 한계 실측**: R-E4 → 페이지 안에서 **신뢰 입력**(ego-browser CDP `Input.dispatchMouseEvent` 클릭 — JS `element.click()`은 sticky activation을 만들지 않는다) 1회 → 새로고침 → 경고 판정 = CDP `Page.javascriptDialogOpening` 이벤트의 `type === "beforeunload"` 수신 → `Page.handleJavaScriptDialog({accept:true})`(떠나기) → 이전 IDB 문서(B안 v3)만 · 미확인 표시 0. 신뢰 입력 없이 새로고침한 경우 이벤트가 오지 않으면 그 사실을 REPORT에 기록(무손실 단정 0) | [E] |
| RS4-AC-10 | **멀티 탭 잠금 실취득**: 탭 A 실제 편집 저장(writer) → 탭 B 문서 없는 프로젝트 create → C-E2 · B IDB 변화 0 · B 기억 0. 탭 B에서 `PendingRecord`의 "저장 확인" → READ_ONLY 문형 · 버튼 유지. A를 편집 없이 닫음 → B 확인 성공 / A가 저장 뒤 닫음 → B STALE 문형(폐기만) | [E] |
| RS4-AC-11 | **(CP4) history 재진입**: R-E4 → 브라우저 뒤로 `/studio/:id` → 상태 글자 "확인하지 못했습니다" · "저장 확인" 버튼 · 새로고침 경고 · 편집 없이 저장 확인 성공 → 기억 0 · `saved`. 편집 저장 성공 → 기억 0. **(r0.1 · Codex P1-2) 확인 지연(`delay` 주입) 중 편집 → 확인 resolve → phase `dirty` · 경고 유지 · 곧바로 이탈 시 저장 대기**. **(r0.1 · Codex P1-1) 편집 → 오프라인 → POP 언마운트 → `PendingDraft` → 재진입 → 온라인 저장 → 최종 IDB 내용 = 마지막 편집 · 기억 0**. `failed`(request 단계 실패)도 같다 | [U][E] |
| RS4-AC-12 | **예산·간선**: 9절 표 전부. `pendingWrites` 런타임 import 0. `memoryProjectRepository`·`localSync`·저장소 인터페이스 diff 0(가드 조건 1줄 제외). `/studio` 진입 closure 변경은 CP4 범위만 | [G] |
| RS4-AC-13 | 검증 4종(typecheck·lint·test·build) + `noHardcodedStyle`·브랜드 격리. `deleteSnapshot(p, "")` 계약 테스트(빈 id = 변화 0 + flush 1회 · 스냅샷 id 생성기가 빈 문자열을 만들지 않음) | [G][U] |
| RS4-AC-16 | (r0.1 · Codex P2) **origin unknown**: create before 읽기 실패 + flush 실패 → C-E5 · 기억 `origin unknown` → 재시도 reject(문서 있음·없음 각각) → 기억 유지(R-4u) · `release` 0 · getDoc before 재조회 0 → 재생 resolve → 기억 0. F-6b(문서 없음 첫 요청) → C-E3 · 기억 0 | [U] |
| RS4-AC-17 | (r0.1 · advisor) **이미지 확인 경로(P-3)**: 읽기 전용 탭에서 새 이미지를 넣은 편집 저장(gate 거절 · 제출 0) → 편집기 이탈 → 보유 탭 닫음 → 편집기 밖 `deleteSnapshot(p,"")` → IDB `images`에 그 참조 레코드가 있는가. 없으면 RS4-R10 결함 확정 | [U] |
| RS4-AC-14 | 접근성: 상태는 글자(색만 0) · 결과 알림 한 자리 · `alertdialog` 이름 · 1280·1024·390 버튼 가림 0 | [U][E] |
| RS4-AC-15 | create 가드(SPEC-3 RS3-AC-01·02·04 유지): 거절 시 메모리·IDB 변화 0 · `restartLock.test.ts:136-142` 그대로 통과 · 흐름 코드 `tryLock` 직접 호출 0 | [U][G] |

## 8. 구현 계획 (Developer — 4 RED/GREEN 체크포인트)

### 8.0 Precondition — 측정 관문 (코드 커밋 0 · 같은 머신)

1. **테스트 수 기준선**: `cd app && npm test -- --run 2>&1 | tail -5` → 파일·테스트 수를 REPORT에 기록. 예측 delta(L3): CP1 +8~12 · CP2 +12~16 · CP3 +8~10 · CP4 +6~8 → 총 +34~46. 실측과 ±50% 넘게 다르면 REPORT에 이유.
2. **예산 기준선**: `git stash` 금지 — 깨끗한 워크트리에서 `cd app && npm run build && node scripts/check-bundle-size.mjs`(파일 = `app/scripts/check-bundle-size.mjs`) 출력 원문을 저장(gzip KB = 1000 bytes, `check-bundle-size.mjs:10,159`).
3. **스파이크 3개**(각각 별도 빌드, 버린다): 9절 표 S1·S2·S3. 각 원문 출력 저장.
3b. **P-3 이미지 확인 경로 측정**(테스트 1개, 커밋 0): RS4-AC-17을 먼저 써서 실행한다. 이미지 레코드가 빠지면 RS4-R10 확정 → CP3의 편집기 밖 "저장 확인"을 CP4 링크로 대체(CP4 예산 통과 시) 또는 구현 차단·재상신.
4. 판정: S1이 판정선 안이면 CP1~3 착수. S2/S3가 `/studio` 129.90·132.94를 넘으면 **감량 1회** → 그래도 넘으면 스파이크 복원, CP4 중단, 수치(전후 raw)로 MQ-4-1 재상신. 수치 없이 상향 요청 금지.

### 8.1 CP1 — 기억 모듈 + 보호 + create 가드
- RED: `app/src/features/pending/pendingWrites.test.ts`(RS4-AC-05 · 13 일부), `app/src/data/persistence/restartLock.test.ts`에 RS4-AC-15(create 가드) 추가.
- GREEN: `app/src/features/pending/pendingWrites.ts` 신설 · `memoryProjectRepository.ts:122` 조건 1개 교체 · `deleteSnapshot(p,"")` 계약 테스트(`app/src/data/memoryDocBook.test.ts` 또는 기존 스냅샷 테스트 파일).
- 실행: `npm test -- --run src/features/pending src/data/persistence/restartLock.test.ts`.

### 8.2 CP2 — 프로필 판정표(F1·F2)
- RED: `app/src/features/profile/restartFlow.test.ts`(RS4-AC-01·02·03·04), `RestartDialog.test.tsx`(R-E6 문구·버튼·포커스), `CandidatesSection` create Callout 테스트(C-E4~6).
- GREEN: `restartFlow.ts` 기억을 `pendingWrites`로 이전(`RestartOpen.doc` → `origin.head`) · `startEdit` create 판정 4.1/4.2 · `committed()` 3분류 + origin 비교 · `restartText.ts` 문구 · 폐기 확인 Callout(공용 컴포넌트는 조작 뒤 청크).
- 실행: `npm test -- --run src/features/profile`.

### 8.3 CP3 — `/projects` 행
- RED: `app/src/features/projects/ProjectRow.test.tsx`·`projectListView.test.ts`(RS4-AC-07·08·14).
- GREEN: 행 분기(동기 `pendingOf`) · 재시도/확인 본문은 클릭 때 dynamic import(조작 뒤) · `check-bundle-size.mjs` afterAction 등록은 **측정 목록 추가만**(판정선 수정 0).
- 실행: `npm test -- --run src/features/projects`.

### 8.4 CP4 — 편집기 인계 (예산 관문 통과 시에만)
- RED: `app/src/features/studio/useDocSave.test.ts`·`StudioLeave` 계열(RS4-AC-11 · 05 cleanup 순서 · 06 회귀).
- GREEN: `useDocSave`/`useAutosaveScheduler`에 초기 상태 주입(기존 옵션 객체에 선택 필드 — 화면 내부 훅 인자이지 저장소 계약 아님) · 진입 시 `pendingOf` · 저장 확인 버튼 · cleanup `hold`.
- 실행: `npm test -- --run src/features/studio` → 전체 `npm run typecheck && npm run lint && npm test -- --run && npm run build`.

### 8.5 CP 공통 · QA
- 각 CP: RED 확인 출력 → GREEN → 4종 게이트. 커밋은 CP 단위, 명시 pathspec.
- Ego Lite QA: RS4-AC-07·08·09·10·11·14(멀티 탭은 잠금 실취득 먼저). 결과·스크린샷 경로를 REPORT에.

## 9. 예산 관문 (ADR-004 · 판정선 수정 금지 · Designer는 0B를 단정하지 않는다)

| 시나리오 | base(L1) | 판정선 | S1: 기억 모듈 + 프로필·`/projects`(CP1~3) | S2: S1 + 편집기 인계 정적(CP4) | S3: S1 + 편집기 동기 조회만 + 인계 본문 lazy |
|---|---|---|---|---|---|
| `/studio/:projectId` | 129.87 | **129.90** | 가드 조건 1줄(수 B) — **실측** | 모듈 + 훅 초기 상태 + 버튼·cleanup — 30B 초과 가능성 높음(L3) | 모듈 동기 조회 + `import()` 1개 — 초과 가능성 있음(L3). 조건부 로드 시나리오 추가가 필요(`check-bundle-size.mjs:25`) |
| `/studio` 복원 진입 | 132.91 | **132.94** | 같음 | 같음 | 같음 |
| `/profile` 첫 화면 · 진입 직후 | 99.89(여유 0.11) · 120.10/122.58 (L2 — restart-impl 빌드 기록, main 병합 뒤 재측정 전) | 100 · 125 | 0 목표(기억 모듈은 `RestartDialog` 조작 뒤 청크와 공유 청크) — 실측 | 같음 | 같음 |
| `/projects` 첫 화면 · 진입 직후 | 98.43 · 105.69 (L2 — 같은 기록, 재측정 전) | 100 · 125 | 행 분기 + 동기 `pendingOf` 모듈(공유 청크 분리 오버헤드 +0.02~0.04 실측 사례 `retryLoader.ts:4`) — 증분 있음(L3) | 같음 | 같음 |

- 후보 비교(측정 대상):
  - (a) **앱 공통 guard**(AppLayout/main 진입에 리스너): index 청크라 9개 시나리오 전부의 첫 화면·진입 합계가 는다(`bundleBudget.mjs:59,71-73`). `/profile` 첫 화면 여유 0.11·`/studio` 허용 0.03이라 배분 없이는 막힐 가능성이 높다(L3). 기억 모듈 방식이면 **불필요** — 참고 측정만, 채택 안 함.
  - (b) **lazy body**: 기억 모듈은 동기 조회 함수만, 인계 UI 본문은 기억이 있을 때만 `import()` → S3.
  - (c) **studio 진입 인계 정적** → S2.
- S3는 "조건이 참인 시나리오"를 측정 목록에 새로 둬야 한다(`check-bundle-size.mjs:25` 원칙). 그 시나리오의 한도는 ADR 결정 사항이라 **MQ-4-3**이다(판정선을 새로 정하지 않는다).
- 실패 시: 감량 1회 → 넘으면 스파이크 복원 · CP4 중단 · raw 수치 보고. 판정선·기준선·ADR 수정 0.

## 10. SPEC-3 r0.2와 다르게 한 곳 (RS4-D#)

- **RS4-D1**(F1): SPEC-3 5.1 "before 읽기 → before가 문서면 음성"과 "재시도도 같은 판정 순서"를 → before는 최초 요청에서 1번 읽어 기억 `origin`에 저장, 재시도는 origin과 비교(4.2). F-9만 최초 요청 규칙으로 남는다.
- **RS4-D2**(F2): SPEC-3 6절 3-2 R-E6/C-E6 "기억 삭제 · 링크 복원 · 편집기에서 한 번 저장"을 → `PendingRecord` 전이 · 링크 게이트 유지 · "저장 확인" 버튼(`deleteSnapshot(p,"")`)(4.3).
- **RS4-D3**: SPEC-3 MQ-3-4 A(경고 없음)를 → 기억이 있는 동안 모듈 수준 `beforeunload`(사용자 "2" 승인).
- **RS4-D4**: SPEC-3 MQ-3-1 A(`/projects` 게이트만)를 → 게이트 유지 + 편집기 인계(★ MQ-4-1 A, 예산 관문 조건부).
- **RS4-D5**: SPEC-3 6절 3-1 "요청 전 그대로 = 음성 → 기억 삭제"를 → origin `absent`일 때만 삭제, origin `doc`이면 `PendingRecord`("요청 미반영 ≠ 저장 확정").
- **RS4-D6**: 기억 값 타입 `RestartOpen{doc, held}` → `Pending` 판별 유니온(3.1). 지우기는 이유 인자 필수.
- **RS4-D7** (r0.1): 편집기 언마운트 시 `PendingRecord edit-unsaved` → `PendingDraft`(내용·이미지 보존, 편집기 재진입 저장으로만 해제). 편집기 확인은 스케줄러 버전과 묶음. `Origin`에 `unknown` 추가와 R-4u.

## 변경 이력
- r0.1 (2026-10-13): Codex 적대검토 a1(P1 2 · P2 1) + advisor 점검 반영(**Codex 미재검토**) — P1-1 offline·dirty·커밋 전 failed 편집을 `PendingRecord`로 확인하던 거짓 saved → `PendingDraft`(3.1 · 3.3-5 · 5.3 · RS4-AC-11) · P1-2 편집기 확인 resolve가 확인 중 편집을 saved로 덮음 → 스케줄러 버전 검사(3.4 · 5.3) · P2 origin unknown 표현 불가 → `Origin.unknown` · F-6/F-6b · R-4u · RS4-AC-16. advisor: C-E6 "엽니다"·P-OK 이동은 확인 뒤에만 · 다시 여는 문구 종류별 · 편집기 밖 확인의 이미지 누락 위험 RS4-R10 + P-3 측정 · QA 경고 판정법(CDP) · 폐기 시 inflight 0.
- r0 (2026-10-13): 초안 — 사용자 "2"(이탈 보호 확장) 승인 범위. F1·F2·history 재진입 설계, 조사 2건(읽기 전용) 통합.
