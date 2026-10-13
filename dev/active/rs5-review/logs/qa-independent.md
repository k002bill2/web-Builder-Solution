# QA 독립 판단 — CONTRACT-5 r0.1a (418979e) 코드 대조

- 귀속: **QA(Orca Claude Code)** 단독. Codex 호출 **전**에 작성·커밋. 계약·코드 수정 0.
- 대상: `docs/design/restart/CONTRACT-5.md`(r0.1a) ↔ 앱 코드(HEAD 기준 `app/` 변경 0 — `git diff --stat 93f8111 HEAD -- app` 빈 출력).
- 근거 수준: [L1] 코드 행 직접 확인 · [L1-추적] 여러 행 이어 읽은 경로 추론(실행 0) · [L3] 추정. **테스트·브라우저 실행 0 — 아래 전부 미측정.**
- 심각도: P1 = 계약대로 구현하면 데이터 소실·거짓 "확인됨"·사용자 조작 무효가 생길 수 있음 · P2 = 내부 모순·누수·UX 결함 · Obs = 관찰.

## A. F표(1절) 사실 대조

| F | 계약 근거행 | 대조 결과 |
|---|---|---|
| F1 | `localSync.ts:151-155` | 일치 [L1] — `record`는 호출 시점 `book.docOf()`로 만든다 |
| F2 | `memoryDocBook.ts:364-367` · `memoryProjectRepository.ts:65-66` | 일치 [L1] — `kept`는 `work` resolve(메모리 커밋) 뒤 flush |
| F3 | `useDocSave.ts:67-70` · `localSync.ts:193-196` | 일치 [L1] |
| F4 | `imageOps.ts:23-25` · `memoryProjectRepository.ts:147-148` | 일치(부분) [L1] — 단 `kept`는 호출 시점 맵을 `held`로 잡는다(`:65-66` `maps.get(projectId) ?? held`). 저장 **진행 중** 이탈은 이미 보호, 이탈 **뒤** 새 flush만 누락. 계약 F4 문장은 이 완화를 언급하지 않는다(결론은 유효) |
| F5 | `localSync.ts:113` | 일치 [L1] |
| F6 | `writeQueue.ts:93` · `localSync.ts:123,154-155` | 일치 [L1] — `submitted`는 빈 Map으로 시작 |
| F8 | `localSync.ts:125-131` | 일치 [L1] |
| F9 | `useAutosaveScheduler.ts:134-137` | 일치 [L1] |
| F10 | `localSync.ts:161` · `writeQueue.ts:37,69-70` | 일치 [L1] |
| F11 | `main.tsx:49` | 일치 [L1] — `:48` `<StrictMode>` 시작(1행 차) |
| F12 | `useDocSave.ts:129-140` | 일치 [L1] |
| (I5b 전제) 하이드레이트 레코드 참조 동일성 | — | 성립 [L1] — DocBook 시드가 `r.doc`·`r.snapshots` 객체 그대로(`memoryDocBook.ts:146,166-167`) → `localSync.ts:155`식 성분 비교(`doc ===` · `snapshots ===`) 가능. 단 계약 I5 "레코드 참조 동일"은 `write()`가 매번 새 `DocRecord`를 만드므로(`:153`) **성분 동일**로 읽어야 한다(표현 정정 필요, P2 이하) |

## B. 지적 (QA 독립)

### QA-1 (P1) `wrote:false` 확인 증명이 열기 시점 이후 낡는다 — 읽기 전용 탭 거짓 "확인됨"
- 계약: I5b는 최신성 `fresh()`를 **싱크 열기 때** 1회만 요구, 4.2-5는 "메모리 레코드 === `lastConfirmed` → `{wrote:false}`"로 쓰기 탭 판정(`gate`)을 거치지 않는다.
- 코드: `fresh()`는 `hydrated`(진입 gen)와 지금 meta gen을 비교(`localSync.ts:93-98`). 쓰기 탭 판정은 실제 쓰기 경로에서만(`:189-192`). 잠금은 쓰기 탭이 탭 수명 동안 보유(`writerLock.ts:2-3`) → **writer 모드에서는** 증명이 유지되지만, readonly 모드(다른 탭이 작성자)에서는 열기 뒤 다른 탭이 `docs/{projectId}`를 덮을 수 있다.
- 실패 경로 [L1-추적]: 탭 A 열기(fresh 통과·증명 획득) → 탭 B가 잠금 보유·같은 프로젝트 저장 → 탭 A에서 편집 없이 `/projects` "저장 확인" → `{wrote:false}` → `confirmed` 표시, 실제 IDB 문서 = 탭 B 내용.
- T19는 **열기 시점** stale만 다룬다. 제안: `wrote:false`는 `gate.mode === "writer"`일 때만, 아니면 `fresh()` 재판정 실패 = `failed{stale-tab|read-only}`.

### QA-2 (P1) oncomplete 확인 세대 규칙이 I2와 모순 · 제안 인터페이스로는 I2 구현 불가
- 계약 4.1 행 "IDB oncomplete → `confirmedSeq = max(…, s)` · `latest.seq ≤ s`면 latest 비움" vs I2 "`confirmedSeq = max(confirmedSeq, seqOf(제출 레코드.doc))`".
- 코드: `LocalSync.flush`는 `Promise<void>`(`localSync.ts:48`) — **무슨 레코드가 커밋됐는지 돌려주지 않는다**. 2.5의 `confirm`도 `{ wrote }`만. `kept`는 메모리 커밋과 flush 사이에 `await local.sync()`(`memoryProjectRepository.ts:66`) 비동기 틈이 있고, flush는 그때의 현재 레코드를 싣는다(F1).
- 실패 경로 [L1-추적]: 편집기 이탈 뒤 저장 s 진행 → s 메모리 커밋 → (틈) 프로필에서 restart(memHead 기준 expectedRevision이라 STALE 아님) → replace, 미확인 latest(s) 있음 → `conflicted` → s의 flush가 **restart 문서**를 실어 oncomplete → 4.1 규칙으로 `confirmedSeq = s`, latest 비움 → conflicted의 "내 초안"(s) 소실, IDB에는 s 내용 없음.
- 4.5 "장부(프로젝트) 직렬"이 replace(startDoc·restoreSnapshot·resolveConflict)를 진행 중 save 뒤로 직렬화한다고 명시하지 않는다.
- 제안: LocalSync가 커밋한 레코드(최소 `doc` head)를 돌려주고 장부가 doc→seq로 판정(I2) · 4.1 행을 I2로 통일 · replace도 장부 직렬 큐 경유 명시.

### QA-3 (P1) replace 술어가 미publish 편집(dirtyMark)을 보지 않는다 — `adopt` 중 편집 덮어쓰기 "해결" 주장 미지지
- 계약 4.4: 조건은 "미확인 `latest` 있음/없음"뿐. 디바운스 중 편집과 `adopt`의 `await write` 중 편집은 `mark()`만(dirtyMark) — `latest`가 없다(2.2 · 4.1 1행).
- 코드: `adopt`는 `await write(...)` 뒤 `docRef`·`setDoc`·`settle()`로 무조건 덮는다(`useDocSave.ts:131-136`).
- 결과 [L1-추적]: "미확인 latest 없음" 행으로 분류 → `replaced{doc}`로 편집기 문서 교체 → 그 편집 소실. 6.2 "(B 추적) `adopt` 중 편집 덮어씀 = 새 계약 해결(설계)" 판정은 4.4 술어로 뒷받침되지 않는다.
- 제안: lease가 있고 `dirtyMark > publishedMark`면 replace 전에 강제 publish(→ conflicted) 또는 conflicted 직행.

### QA-4 (P1) `discard`가 메모리 커밋된 초안을 되돌리지 않는다 · 진행 중 discard 미정의
- 계약: `discard(projectId)` = "사용자 명시 폐기만"(2.3) — 전이 표 없음. seed.doc = `latest?.doc ?? 메모리 문서`(2.3 LedgerSeed).
- 코드: 읽기 전용 거절·quota여도 메모리는 이미 커밋(F2, `memoryDocBook.ts:364-366`). 장부 밖 경로(`createSnapshot`·`deleteSnapshot`·`requestExport`)도 `kept`로 **현재 메모리 레코드**를 flush(`memoryProjectRepository.ts:86-89,132-133`).
- 실패 경로 [L1-추적]: 저장 s가 read-only로 실패(memory committed, `memSeq = s`) → 사용자가 "폐기" → latest만 비움 → 재진입 seed.doc = 메모리 문서 = **폐기한 초안** · 이후 스냅샷 만들기 한 번이면 IDB에도 기록. inflight 중 discard도 완료가 초안을 커밋한다.
- 제안: discard를 (a) 메모리 미커밋 초안 한정, (b) 메모리 커밋분은 `lastConfirmed`로 되돌리는 replace 쓰기, (c) inflight 중 금지 중 하나로 명시.

### QA-5 (P2) 재시도 성공 경로가 `stored`를 갱신하지 않는다 — binding 해제 조건 영구 미충족
- 코드: 같은 레코드 재flush는 `queue.retry`를 바로 반환(`localSync.ts:155`) — `settle` 연결 없음. 원 제출 실패 때 `settle(false)`가 put id를 `stored`에서 뺀다(`:170`).
- 결과 [L1-추적]: quota 실패 → 재시도 성공(T14)이어도 `stored`에 이미지 id 없음 → 4.6-2 "confirmedSeq ≥ seq **그리고** id ∈ stored" 해제 조건이 탭 수명 동안 미충족(Blob 누수) · 이후 binding 없는 경로의 엄격 검사(I4)가 이미 커밋된 이미지를 `image-missing`으로 거짓 실패할 수 있음(리로드 전까지).
- 제안: `LocalSync.confirm`의 retry 경로가 성공 시 `stored` 갱신(계약 2.5에 명시).

### QA-6 (P2) StrictMode·lease: `acquire` 멱등 정의가 시그니처와 맞지 않고 re-seed 방식 미정
- 계약: `acquire(projectId)` "멱등: 같은 마운트의 재호출 = 같은 토큰"(2.3) — 마운트 식별자가 인자에 없다. 4.5는 commit 단계 effect 한정 + "`view()` 이후 seq·epoch가 바뀌었으면 편집기가 다시 seed".
- 코드: StrictMode cleanup→remount 때 스케줄러는 `dispose` 후 새로 만들어진다(`useAutosaveScheduler.ts:275-279`, deps `[debounceMs, maxWaitMs]`). 편집 문서·revision은 `useState(initialDoc)`·`useRef(initialDoc.revision)`(`useDocSave.ts:58,61`) — 첫 렌더 값 고정, 재seed하려면 key 재마운트 같은 별도 수단 필요.
- 결과: release→acquire는 어차피 새 토큰(멱등 문장 무의미) · "다시 seed" 수단 미정의. 데이터 소실 경로는 확인 못 함(P2).

### QA-7 (P2) I7 ↔ 4.2-2 모순 — `start.held === "unconfirmed"` 처리
- I7: `not-applied`·`unknown`일 때만 `failed{start-pending}`. 4.2-2: "`start`가 있으면" 전부 실패. `unconfirmed`(시작 문서 메모리 커밋·IDB 미확인)에서 `confirm`이 문서를 flush해도 되는지 계약이 두 답을 준다.

### QA-8 (P2) I8 보호 술어가 settle 경로에서 꺼지지 않는다
- `dirtyMark > publishedMark`는 publish로만 해소(I8 r0.1a). 그러나 편집을 저장 없이 끝내는 경로가 있다: `resolve("theirs")`의 `settle()`(`useDocSave.ts:103-107`) · `adopt`의 `settle()`(`:136`) · 스케줄러 `settle`(`useAutosaveScheduler.ts:125-131`).
- 결과 [L1-추적]: 편집 후 "다른 편집 불러오기" → 편집은 버려졌는데 dirtyMark > publishedMark 유지 → 다음 publish 전까지 `beforeunload` 거짓 경고. 또한 superseded 토큰의 `mark` 처리 미정의.
- 제안: settle·replace·discard 전이에서 `publishedMark = dirtyMark`.

### QA-9 (P2) "revision 단일 소유자"와 남는 `local.base` · in-tab STALE 소멸
- `DocBook.save`는 여전히 `local.base`로 expectedRevision을 보정하고(`memoryDocBook.ts:354`) 멱등 키는 요청 revision(`:358`). memHead가 메모리 head와 항상 같으면 base는 무효과지만, 계약은 base의 존폐를 말하지 않는다.
- memHead = 메모리 현재 head이면 탭 안 `STALE_DOC`(`:363`)은 사실상 사라지고 epoch(replace)만 남는다 → **replace로 분류되지 않는 문서 변경 경로**가 생기면 조용히 덮인다. 현재 문서 변경 경로 = save·start·restoreSnapshot·resolveConflict(`resolveConflict` mine은 revision +1, `:331`) — 4.4가 이들을 열거하므로 지금은 닫혀 있음 [L1]. 새 경로 추가 시 규칙 필요(문서화 권고).

### Obs
- O1 memory 모드: `persistence: local ? "local" : "memory"`(`memoryProjectRepository.ts:107`) — I6 대응 가능 [L1].
- O2 unsupported: `navigator.locks` 없음 → gate `unsupported`(`writerLock.ts:32`) → `blocked()`는 일반 INFRA 사유(`localSync.ts:81`, readonly·stale만 문구). 2.4가 "구별 필드 신설 제안"으로 정직 표기 — 일치.
- O3 response 단계 실패 주입: `call`이 커밋 뒤 response fail을 던지면 `kept`의 flush가 아예 돌지 않는다(`memoryProjectRepository.ts:66,79-81`) → memory committed · IDB 제출 0. 테스트 주입 전용 경로지만 T-계획의 `memory: committed` 분류 근거로 쓸 때 주의.

## C. 체크리스트 대응 (BRIEF)

| 항목 | 판단 |
|---|---|
| mark/dirtyMark/publishedMark | QA-3 · QA-8 |
| epoch/baseEpoch | QA-2(직렬 미명시) · QA-3 |
| hydrated-confirm-proof(I5b) | QA-1 · 참조 동일성 전제 성립(A표) |
| lease acquire/release StrictMode | QA-6 |
| queued save 대상 레코드 동일성 | QA-2 |
| 이미지 binding 복제/수명 | QA-5 · F4 `held` 완화 |
| 새 편집 vs 예전 resolve | I1 자체는 정합 · QA-2가 예외 경로 |
| conflicted discard/replace + 저장 중 완료 | QA-2 · QA-4 |
| read-only/stale/unsupported/memory | QA-1 · O1 · O2 |
| revision 단일 소유자 | QA-9 |
| no-commit retryStart · unload 보호 | QA-7 · QA-8 |
