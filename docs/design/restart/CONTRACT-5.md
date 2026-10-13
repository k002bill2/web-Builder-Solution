# CONTRACT-5 — 전용 저장 확인 기술 계약 (내용 · 이미지 · 편집 세대 · 진행 중 저장)

- 상태: **r0.1 설계안 — 구현 승인 아님.** r0.1 = Codex a1(P1 3) 반영, **미재검토**. 사용자 최신 지시 1 = "계약 설계만 승인; 구현·예산 상향 별도". 이 문서의 인터페이스 변경은 전부 **제안**이다.
- base `467a691`(앱 `93f8111`). 작성 Developer(Orca Claude Code) · 회수 Jarvis. 상위 UX(문구·버튼 배치·화면 흐름)는 이 계약 회수 뒤 Designer.
- 대체 관계: SPEC-4 r0.1b의 `deleteSnapshot(projectId, "")` 확인 차용(MQ-4-2 ★A)과 `PendingDraft`/`PendingRecord` 분산 소유를 **버린다**. 근거 = rs4-measure P-3 판정(이미지 누락 실재 · 빈 id 스냅샷 실재 가능, `dev/active/rs4-measure/REPORT.md` 2절)과 rs4-review P1 4건(C1·C2·Q1·Q3).
- 표기: [L1] 코드 행 직접 확인 · [L1-추적] 여러 행 이어 읽은 경로 추론(실행 0) · [L3] 추정/미측정.

## 0. 요약 (결론 먼저)

1. **추천 = 안 A "저장 장부(SaveLedger)"**: 저장소 인스턴스(탭당 1개)가 프로젝트당 장부 1개를 소유한다. 장부가 **편집 세대(draftSeq) · 메모리 커밋 revision · 불변 스냅샷(문서 + 해시 + 이미지 Blob 묶음) · 진행 중 요청 · 확인 세대(confirmedSeq)** 를 한곳에서 가진다. 편집기는 장부를 **임대(lease)** 해 쓰고, 떠나도 장부는 남는다.
2. **확인(confirm)** 은 "지금 최신 세대의 문서와 그 문서가 참조하는 이미지 전부가 같은 IDB 트랜잭션(또는 이미 커밋된 이미지 레코드)으로 `oncomplete` 됐다"를 뜻한다. memory 모드는 영구 확인을 **절대** 주지 않는다(`memory-only`).
3. 확인은 **시작 요청(create/restart) 재시도와 분리**된다. 확인은 `startDoc`을 부르지 않는다. 반영 안 된 시작 요청은 늘 사용자 명시 결정으로 돌아간다.
4. **새 IDB 스키마 0**. 편집 세대·장부는 탭 메모리이고, 영속 판정은 기존 `docs`·`images` 레코드 + 트랜잭션 `oncomplete`로 충분하다(6절).
5. 번들: 장부의 진입 몫은 **미측정**. 실측된 SPEC-4 스파이크는 전부 `/studio` 판정선 초과(8절). 이 레인 측정 0 · 예산 상향 0.

## 1. 현재 사실 — 계약이 반드시 담아야 할 것 (L1)

| # | 사실 | 근거 | 계약 귀결 |
|---|---|---|---|
| F1 | flush는 **호출 시점의 현재 메모리 레코드**를 쓴다. 요청 자신의 문서가 아니다 | `localSync.ts:151-155` | "확인됨"은 *제출된 레코드의 동일성*으로 정의한다(요청 단위가 아님) |
| F2 | 메모리 커밋이 IDB보다 먼저. read-only·stale·cleared·quota reject여도 메모리 revision은 이미 +1 | `memoryDocBook.ts:364-367` · `memoryProjectRepository.ts:65-66` · P-3 로그 `a.memory revision before→afterSave [1,2,true]` | 실패 결과에 `memory: committed\|not-committed\|unknown`과 메모리 head를 싣는다. revision 소유자는 편집기 훅이 아니라 장부 |
| F3 | `revisionRef`는 resolve 때만 갱신, `base()` 보정은 `submitted === current && unconfirmed`일 때만. read-only flush는 제출 0 → 다음 저장이 자기 `STALE_DOC` | `useDocSave.ts:67-70` · `localSync.ts:193-196,192` | 같음(F2) — C3의 실제 원인 |
| F4 | 참조 이미지가 맵에 없으면 이미지 put을 **조용히 건너뛰고** 문서는 커밋 | `imageOps.ts:23-25` · `memoryProjectRepository.ts:147-148`(떠나면 `maps.delete`) | RS4-R10 근원. 계약: 참조 이미지 미기록 = **제출 전 실패** |
| F5 | `stored`는 열 때 `keys("images")`로 시드 → 하이드레이트된 이미지는 settled | `localSync.ts:113` | 엄격 검사가 새로고침 뒤 거짓 실패하지 않는다 |
| F6 | `queue.status === undefined` = "확인됨" 또는 "제출한 적 없음". 하이드레이트 레코드는 `submitted`에 없어 flush가 새 제출(문서 put + 세대 +1 + `saved` 전송) | `writeQueue.ts:93` · `localSync.ts:136,154-161,148` | 쓰기 0 확인에는 시드를 포함한 "마지막 확인 레코드" 동일성이 필요(Q4) |
| F7 | 같은 내용이라도 새 키(`requested\|hash`)면 revision +1 | `memoryDocBook.ts:358-366` | 초안 hash = 메모리 head hash면 `saveDoc`을 부르지 않는다(위장 저장·불필요 revision 0) |
| F8 | `meta.generation`은 **탭 간 쓰기 도장**(트랜잭션마다 +1, 재시도 포함) | `localSync.ts:125-131` · ADR-007 개정 2 보충 | 편집 세대는 다른 이름 `draftSeq`. 둘을 섞지 않는다(2.1) |
| F9 | 스케줄러 `dispose` = 타이머 해제만 → 디바운스 편집 소실 · 진행 저장 완료 콜백 무시 · POP/`useBlocker` 0 | `useAutosaveScheduler.ts:134-137,193` · `routes.tsx:15-17` | 언마운트 때 최신 편집을 장부에 **먼저** 넘긴다 |
| F10 | 이미지·문서는 같은 `queue.submit` = 같은 IDB 트랜잭션. 큐는 탭 전역 직렬 | `localSync.ts:161` · `writeQueue.ts:37,69-70` | "부분 쓰기"는 트랜잭션 안에서는 없다. 위험은 트랜잭션 *사이*(어느 레코드를 실었나) |
| F11 | `StrictMode` 사용 → 마운트 → cleanup → 마운트 | `main.tsx:49` | 임대 획득·해제는 멱등, cleanup 넘김이 거짓 초안을 만들지 않아야 함 |
| F12 | `adopt`는 `await write` 중 생긴 편집을 덮고 `settle()` | `useDocSave.ts:129-140` | 문서 교체 인계는 장부의 `replace` 전이 하나로(4.4) |

## 2. 타입 (typed pseudocode — 실제 `.ts` 변경 0)

### 2.1 이름 구분

| 이름 | 뜻 | 수명 | 영속 |
|---|---|---|---|
| `draftSeq` | 이 탭·이 프로젝트의 **편집 세대**. 장부가 발급, 단조 증가, 편집기 재마운트를 넘어 유지 | 탭 | 아니오 |
| `writeGen` | 기존 `meta.generation`(탭 간 쓰기 도장) — 이 계약은 읽지도 바꾸지도 않는다 | IDB | 예(기존) |
| `revision` | 문서 낙관적 잠금 번호(기존 `DocHead.revision`) | IDB | 예(기존) |
| `LeaseToken` | 편집기 마운트 1회의 임대 증표 | 마운트 | 아니오 |

### 2.2 장부 상태 (저장소 인스턴스 소유 · 프로젝트당 1)

```ts
type DraftSeq = number & { readonly __brand: "DraftSeq" };

/** 편집기가 넘기는 불변 스냅샷 — 넘기는 순간 deepFreeze. 해시는 편집기가 계산해 넣는다(편집기 밖 확인이 엔진을 import하지 않게) */
interface DraftSnapshot {
  readonly seq: DraftSeq;
  readonly doc: PageDoc;              // frozen
  readonly hash: string;              // hashDoc(doc) — 편집기 계산
  readonly images: ImageBinding;      // 이 doc + 현재 스냅샷이 참조하는 localId → 이미지 항목(Blob 포함). 참조 밖 항목 0
  readonly baseEpoch: number;         // (r0.1 · Codex a1-2) publish 시점 장부 epoch — 문서 교체 뒤 초안을 새 head 위에 조용히 재기반하지 않게
}
type ImageBinding = ReadonlyMap<string /* localId */, RenderImage /* Blob 변형본 포함 */>;

type StartPending = {                 // SPEC-4 PendingStart의 판정 규칙(origin 1회 보존 · F1)은 그대로 승계
  readonly mode: "create" | "restart";
  readonly version: number; readonly selected: string;
  readonly origin: Origin;            // absent | doc(head) | unknown — SPEC-4 3.1 그대로
  readonly held: "unconfirmed" | "unknown" | "not-applied";
};

interface ProjectLedger {
  readonly projectId: string;
  latest?: DraftSnapshot;             // 아직 확인 안 된 최신 초안(없으면 = 메모리 문서가 최신 의도)
  nextSeq: DraftSeq;
  epoch: number;                      // (r0.1) 문서 교체(replace) 횟수 — 자기 저장 커밋은 올리지 않는다
  dirtyMark: number;                  // (r0.1 · Codex a1-1) 편집마다 동기 +1(스냅샷·해시 0 — 비용 상수). publish·확인과 별개
  conflicted?: { readonly theirs: DocHead }; // (r0.1) latest.baseEpoch ≠ epoch — 명시 선택 전 저장·확인 0
  memHead?: DocHead;                  // 장부가 본 마지막 메모리 커밋 head — expectedRevision의 유일한 출처
  memSeq: DraftSeq | 0;               // memHead에 담긴 초안 세대(교체 전이면 교체 시점 seq)
  confirmedSeq: DraftSeq | 0;         // oncomplete로 확인된 세대
  lastConfirmed?: DocRecord;          // 영속 확인 증명 — 이 탭이 제출해 oncomplete 받은 레코드, 또는 검증된 하이드레이트(3 I5b · r0.1 Codex a1-3). 편집용 시드와 별개
  inflight?: { readonly seq: DraftSeq; readonly kind: "save" | "confirm"; readonly done: Promise<ConfirmResult> };
  lease?: LeaseToken;                 // 활성 편집기 1개
  start?: StartPending;               // 시작 요청 미확인(확인과 별개 축)
  lastResult?: ConfirmResult;         // 호출자가 언마운트해도 결과는 여기 남는다
}
```

### 2.3 공개 API (제안 — 저장소 인스턴스에서 `ledger(projectId)`로 얻음)

```ts
interface SaveLedgerApi {
  // 편집기 전용
  acquire(projectId): { token: LeaseToken; seed: LedgerSeed };      // 멱등: 같은 마운트의 재호출 = 같은 토큰
  release(token: LeaseToken, last?: DraftInput): void;               // cleanup — last가 있으면 먼저 publish(F9)
  mark(token): void;                                                  // (r0.1) 편집마다 동기 — dirtyMark +1만(I8 보호 · view() 표시용)
  publish(token, input: DraftInput): DraftSeq | "superseded";        // 저장 시작·cleanup 때만(스냅샷·해시 비용 — 키 입력마다 아님)
  save(token, seq: DraftSeq): Promise<ConfirmResult>;                // 스케줄러의 저장 = 장부 경유 단일 경로
  // 어디서나(편집기 · /projects · 프로필)
  view(projectId): LedgerView;                                       // 동기 조회, 쓰기 0
  confirm(projectId): Promise<ConfirmResult>;                        // 사용자 "저장 확인" — 4.2
  retryStart(projectId): Promise<StartResult>;                       // 시작 요청 재생 — 확인과 별개(4.3)
  discard(projectId): void;                                          // 사용자 명시 폐기만
  subscribe(projectId, fn): () => void;                              // 결과 전달(호출자 수명과 분리)
}
interface DraftInput { readonly doc: PageDoc; readonly hash: string; readonly images: ImageBinding }
interface LedgerSeed {                                               // 재진입 인계
  readonly doc: PageDoc;              // latest?.doc ?? 메모리 문서
  readonly revision: number;          // memHead.revision (getDoc 순서와 무관 — C3)
  readonly images: ImageBinding;      // latest?.images ∪ 복원 대상(기존 restoreImages 경로)
  readonly phase: "idle" | "unconfirmed" | "saving" | "start-pending" | "conflicted"; // conflicted = 내 초안 + 교체 문서(theirs) 선택 대기
}
```

### 2.4 결과 (닫힌 합)

```ts
type Stage = "before-request" | "request" | "commit" | "idb" | "response";
type Reason =
  | "offline" | "quota" | "read-only" | "stale-tab" | "cleared" | "unsupported"
  | "stale-doc" | "image-missing" | "clone-failed" | "start-pending" | "superseded" | "replaced-conflict" | "infra-unknown";

type ConfirmResult =
  | { kind: "confirmed"; seq: DraftSeq | 0; head: DocHead; wrote: boolean; newer: boolean } // newer = 확인 중 더 새 초안 생김(=여전히 미확인)
  | { kind: "memory-only"; head?: DocHead }                     // memory 모드 — 영구 확인 아님. UI에 "저장됨(영구)" 금지
  | { kind: "failed"; reason: Reason; stage: Stage;
      memory: "committed" | "not-committed" | "unknown";        // F2 — committed면 head 동봉, 장부 memHead 이미 갱신
      head?: DocHead; missing?: readonly string[] /* image-missing localId */ };
```

Reason ↔ 현재 코드 원인 대응 [L1]: `quota` = `toInfra` quota 사유(`infra.ts:8-23`) · `read-only`/`stale-tab` = `blocked(mode)`(`localSync.ts:81,192`) · `cleared` = `CLEARED_TAB`(`:190`) · `unsupported` = `navigator.locks` 없음·비보안 컨텍스트·조작 뒤 `openLocalSync` 실패(모드는 `local` 유지 — 구별 필드 없음, 2.5에서 신설 제안) · `clone-failed` = `writeQueue.ts:53-55` · `offline` = 스케줄러가 저장 호출 전에 멈춤(`useAutosaveScheduler.ts:171-176`) · `stale-doc` = 다른 탭/다른 경로 커밋(`memoryDocBook.ts:363`).
지금은 전부 `INFRA` + 문구이고 UI가 문구 매칭으로 가린다(`useDocSave.ts:74`) → 장부 안에서 코드로 분류하는 것이 제안(문구 매칭 제거).

### 2.5 최소 interface delta (제안 — 실행 승인 아님)

| 위치 | 현재 | 제안 | 성격 |
|---|---|---|---|
| `ProjectRepository`(`projectRepository.ts:141-166`) | 확인 메서드 0 | `ledger?: SaveLedgerApi`(local·memory 구현만, server 미정) | **공개 인터페이스 추가 1** |
| `LocalSync`(`localSync.ts:43-56`) | `flush`만 | `confirm(projectId, book, binding): Promise<{ wrote: boolean }>` — `lastConfirmed` 동일성 우선, 이미지 엄격 검사 · `mode(): WriterMode \| "cleared" \| "closed"` | 내부 인터페이스 2 |
| `imageOps`(`imageOps.ts:23-25`) | 맵 없는 참조 skip | `strict` 인자: 참조 ∖ (settled ∪ binding) ≠ ∅ → `IMAGE_MISSING` throw(제출 0) | 내부 동작 1 |
| `memoryProjectRepository.call`/`kept` | 실패 시 메모리 커밋 여부를 호출자가 모름 | 커밋 시점에 장부 `memHead`·`memSeq` 갱신(저장소 내부라 오류 모양 변경 0) | 내부 |
| `useAutosaveScheduler` | 초기 phase 옵션 0, `doc` private | 초기 seed 옵션 · `dispose` 전 최신 doc/pending 노출(1회) · 새 phase `unconfirmed`(확인 전 상속) | 화면 훅 3 |
| `useDocSave` | `revisionRef` 소유 | expectedRevision = `ledger.view().memHead.revision`(요청 시점 읽기) · `adopt` = 장부 `replace` 경유 | 화면 훅 2 |
| `StudioLayout`(`:310`) | images state 빈 시작 + 복원 | `seed.images`로 시작 · `repository.images` 등록은 유지(편집기 안 flush용) | 화면 1 |

SPEC-4가 "훅 인자 1건"이라 한 것(Q6)보다 크다. 숨기지 않는다.

## 3. 불변식

- **I1 (최신 보호)**: 어떤 저장·확인 resolve도 자기 대상 seq보다 큰 `latest`를 지우지 못한다. `latest`는 `confirmedSeq ≥ latest.seq`일 때만 비운다. (C1)
- **I2 (확인 단조)**: `confirmedSeq = max(confirmedSeq, seqOf(제출 레코드.doc))` — F1에 따라 resolve는 *그때 실린 레코드*를 확인한다. 옛 요청 resolve가 새 커밋을 과소 확인할 수는 있어도 과대 확인은 0.
- **I3 (revision 단일 출처)**: 저장 요청의 expectedRevision은 요청 직전 `memHead.revision`만. 편집기 마운트·`getDoc` 순서와 무관. (C3·F3) **단 `latest.baseEpoch === epoch`일 때만** — 교체 뒤 초안을 새 head 위에 올리는 것은 I3b가 막는다.
- **I3b (교체 충돌 · r0.1 Codex a1-2)**: replace는 lease 유무와 무관하게 미확인 `latest`가 있으면 `conflicted{theirs}`로 간다. conflicted 동안 자동 저장·`confirm`·`acquire` seed의 자동 저장은 쓰기 0(`failed{replaced-conflict}`), 사용자 명시 선택(내 초안 유지 = 새 head 위에 명시 저장 · 교체 문서 채택 = 초안 폐기)만 푼다.
- **I4 (원자 묶음)**: IDB에 커밋되는 문서 레코드가 참조하는 모든 이미지는 같은 트랜잭션의 put 또는 이미 `stored`. 아니면 제출 0 + `image-missing`. (Q3·F4)
- **I5b (확인 증명 · r0.1 Codex a1-3)**: `lastConfirmed`는 (가) 이 탭이 제출해 `oncomplete`를 받은 레코드 또는 (나) **검증된 하이드레이트** — 싱크 열기 때 최신성(`fresh()`) 통과 **그리고** 실제 IDB 문서 레코드에서 읽은 것(`localSync.ts:110-111`의 낡은 entry 대체분 제외) **그리고** 그 레코드 참조 이미지 id 전부가 `stored`(`keys("images")`)에 있음 — 일 때만. 아니면 증명 없음 → 확인은 binding으로 이미지를 실어 새 제출하거나, binding에도 없으면 `failed{image-missing}`. 이미지 **존재**는 확인하나 Blob **내용 유효성**은 확인하지 않는다(읽기 비용 — 잔여 위험, 9절).
- **I5 (위장 0)**: 확인은 `deleteSnapshot`·빈 id·같은 내용 `saveDoc`을 쓰지 않는다. `latest.hash === memHead.hash`면 `saveDoc` 0. `lastConfirmed`와 메모리 레코드가 동일(참조 동일)이면 IDB 쓰기 0·세대 도장 0·`saved` 전송 0. (Q4·F6·F7)
- **I6 (영구 확인 정직)**: `persistence === "memory"` 또는 싱크 `unsupported`/`closed`면 `confirmed` 0 — `memory-only` 또는 `failed{unsupported}`. (Q7a)
- **I7 (시작 분리)**: `confirm`은 `startDoc` 0. `start.held === "not-applied"`(R-E5 무커밋)·`unknown`이면 `confirm`은 `failed{start-pending}`이며 쓰기 0. 시작 재생은 `retryStart`만, 사용자 명시 조작으로만. (C2)
- **I8 (보호 술어 1개)**: 모듈 `beforeunload` 등록 ⇔ ∃ 장부: `dirtyMark > markAtConfirm ∨ (latest && latest.seq > confirmedSeq) ∨ inflight ∨ start ∨ conflicted` (local 모드). `markAtConfirm` = 확인된 저장이 시작될 때의 dirtyMark. 모든 전이 끝(`mark` 포함)에서 재계산(0↔1 토글 주체 단일). (Q8·Q7b)
  - r0.1(Codex a1-1): 디바운스 중 편집은 publish 전이라 `latest`가 없다 → `mark()`가 편집마다 동기로 술어를 켠다. `beforeunload`는 cleanup보다 먼저 판정되므로 release 시 publish로는 탭 닫기를 막지 못한다. 또한 **기존 편집기 경고(`useAutosaveScheduler.ts:283-291`)는 제거·통합하지 않는다** — 마운트 중에는 두 리스너가 함께 있고 브라우저 경고는 1번이다.
- **I9 (임대 1개)**: 프로젝트당 활성 lease 1. 새 acquire는 옛 lease를 대체, 옛 lease의 publish는 `superseded`(쓰기 0). release는 멱등.
- **I10 (권한 유지)**: 쓰기 탭 규칙(Web Locks 단일 작성자 · 최신성 · cleared 멈춤 · steal 0)과 렌더 iframe 격리는 변경 0. 장부는 그 위에서만 쓴다.

## 4. 전이

### 4.1 편집기 저장 (자동 저장 · 마운트 중)

| 지금 | 사건 | 장부 동작 | 다음 |
|---|---|---|---|
| — | 편집(`change`) | `mark(token)` — dirtyMark +1, I8 재계산(스냅샷 0) | — |
| — | 스케줄러 저장 시작(version v) | `publish` → seq s(스냅샷 동결 · hash · binding) → `save(s)` | inflight{s} |
| inflight{s} | 다른 저장 요청 | 단일 비행 — 끝난 뒤 `latest`만 1회 이어서(중간 세대 생략 = 최신 의도 병합) | — |
| inflight{s} | 메모리 커밋 | `memHead`, `memSeq = s` | — |
| inflight{s} | IDB oncomplete | `lastConfirmed = 제출 레코드` · `confirmedSeq = max(…, s)` · `latest.seq ≤ s`면 `latest` 비움 | idle 또는 `newer` |
| inflight{s} | reject | `failed{reason, stage, memory}` 기록 · `latest` 유지 · memory committed면 memHead 이미 갱신 | 미확인 |
| — | `latest.hash === memHead.hash` | `saveDoc` 0 → 바로 `LocalSync.confirm` | — |

### 4.2 `confirm(projectId)` (어디서나 · 사용자 명시)

1. memory 모드 → `memory-only`. 끝.
2. `start`가 있으면 → `failed{start-pending}`(쓰기 0). `conflicted`면 → `failed{replaced-conflict}`(쓰기 0). 끝.
3. `target = latest?.seq ?? memSeq`. `inflight`가 있으면 그것을 기다린다(취소 0 — IDB 트랜잭션은 취소 불가).
4. `latest`가 있고 `latest.hash !== memHead.hash` → 장부 경유 `saveDoc(expectedRevision = memHead.revision, latest.doc)` + binding(편집기 밖이어도 장부가 Blob을 가진다 → **편집기 밖 확인이 초안을 커밋할 수 있다** — P-3 c "옛 레코드 resolve" 해소).
5. `LocalSync.confirm(projectId, book, binding)`: 메모리 레코드 === `lastConfirmed`(I5b 증명만) → `{wrote:false}` · === `submitted` → `queue.retry` · 그 밖 → 엄격 imageOps 뒤 새 제출.
6. 결과: `confirmed{seq: target, newer: latest?.seq > target}` 또는 `failed`. `newer`면 UI는 "확인됨"을 표시하지 않는다(Q1).

### 4.3 시작 요청 (create · restart) — 확인과 분리

- 최초 판정·origin 1회 보존은 SPEC-4 4.1·4.2 판정표 그대로(새 계약은 *기억 위치*만 장부 `start`로 옮긴다 — 프로필 대화상자 언마운트 뒤에도 유지).
- `retryStart` resolve(재생) → `replace` 전이(4.4) + `start` 비움.
- R-E5 무커밋(`not-applied`) 또는 `unknown` → 사용자에게 **재판정 화면**(Designer): "시작 다시 시도"(`retryStart`) 또는 "지금 문서 유지"(`start` 비움 → 이후 `confirm` 가능). 자동 첫 커밋 0.

### 4.4 문서 교체 인계 (`replace`) — restart 재생 · 스냅샷 복원 · 충돌 해결 · `adopt`

| 조건 | 결과 |
|---|---|
| 공통 | `epoch += 1` · `memHead` 갱신 |
| 미확인 `latest` 없음(lease 유무 무관) | 편집기에 `replaced{doc, revision, images}` 전달 → 편집기 doc·revision·이미지 기준 교체 · phase `saved` |
| 미확인 `latest` 있음(**lease 유무 무관** · r0.1 Codex a1-2) | **조용히 덮지 않는다**: `conflicted{theirs}`(I3b). lease 있으면 phase `stale`(기존 충돌 흐름 E-S09), lease 없으면 다음 acquire seed phase `conflicted` — 초안 doc를 바로 편집 문서로 쓰지 않고 선택을 먼저 보인다. `adopt` 중 편집(F12)도 같은 규칙 |

### 4.5 수명 — dedupe · 순서 · 취소 · dispose · POP

| 사건 | 규칙 |
|---|---|
| dedupe | 같은 프로젝트 `confirm` 중복 = 진행 중 promise 공유. 저장은 단일 비행 + 최신 1회 이어 쓰기 |
| 순서 | 장부(프로젝트) 직렬 → 기존 큐(탭 전역 직렬). 순서 보장 추가 비용 0 |
| 취소 | 디바운스 타이머만 취소 가능. 시작된 요청·트랜잭션은 취소 0 — 결과는 장부에 기록 |
| dispose/POP | cleanup: `release(token, last)` — **pending이면 먼저 publish**(디바운스 편집 보존, F9) → lease 해제. 진행 저장은 장부가 계속 소유 → resolve는 장부에 기록(I1·I3) |
| StrictMode | mount→cleanup→mount: pending 없으면 publish 0(거짓 초안 0), lease 재획득 멱등 |
| 호출자 언마운트 | 결과는 `lastResult` + `subscribe`. 호출자 setState는 alive 검사 뒤만 |
| 프로젝트 삭제·`cleared` | 장부 폐기(binding 해제). `cleared`면 모든 confirm `failed{cleared}` |
| 탭 수명 | 장부는 탭 메모리 — 새로고침·탭 닫기·모바일 종료·크래시에 사라진다. 보호는 I8 `beforeunload`(안전층, **보장 아님**). 모바일 백그라운드 종료·크래시는 데이터 손실 잔존 |

### 4.6 이미지 Blob 수명 · 소유권

1. 편집기 맵(React state)이 1차 소유. `publish` 때 참조분만 binding으로 장부에 복사 참조(Blob 자체는 불변 — 복제 0).
2. binding은 `confirmedSeq ≥ 그 스냅샷 seq` **그리고** 그 id가 `stored`에 들어간 뒤 해제. 그 전까지 등록 해제(`maps.delete`) 뒤 재시도도 binding으로 이미지를 싣는다(RS4-R10 해소).
3. object URL은 장부가 갖지 않는다(편집기·`objectUrls.ts` 소유 유지). 재진입 편집기가 `seed.images`에서 새로 만든다.
4. 복원: 확인된 이미지는 기존 `restoreImages` 경로(IDB). 미확인 이미지는 seed binding.
5. 잔여 위험 [L1 B 추적]: 이미지 ingest(비동기 변환, `ImageSlotField.tsx:84-132`) 중 이탈 = 아직 편집이 아니라 장부도 모른다 → 소실. 상위 UI 명세 필요(8절 표 아님 · 6.2 표).

## 5. 대안 비교 (1안만)

| 축 | ★A 저장 장부(저장소 소유) | B SPEC-4 보정형: 기억 모듈 `PendingDraft` + 저장소 `confirmDoc(projectId, images?)` flush 전용 + 편집기 훅 revision |
|---|---|---|
| 소유자 | 1(장부) | 3(훅 revisionRef · 기억 모듈 · 저장소 큐) |
| C1(옛 resolve가 새 초안 삭제) | I1로 구조적 차단 | 세 소유자 간 세대 동기화 규칙 추가 필요 |
| C3(재진입 revision 경쟁) | I3 — getDoc 순서 무관 | 재진입이 진행 저장 완료를 기다리는 동기화 추가 필요 |
| 편집기 밖 초안 커밋 | 가능(hash·binding 보유) | 불가 → 밖에서는 "편집기에서 이어 저장"만 |
| 인터페이스 변경 | 공개 1 + 내부 3 + 화면 6 | 공개 1 + 내부 1 + 화면 5(+ 모듈) |
| 진입 번들 | 장부 최소 몫이 `/studio`·`/projects` 진입 closure(저장소가 PROJECT_AUTO) — 미측정 | 기억 모듈 몫 — S1r 실측 +15B로 이미 판정선 초과 |
| 위험 | 저장소 책임 증가 · 리팩터 범위 | 경쟁 규칙이 문서 규칙에만 의존 → C1/C3 재발 위험 |

추천 근거: P1 결함(C1·C3·Q1·Q3)이 모두 "소유자가 여럿"에서 나왔다. B는 규칙으로 막고, A는 구조로 막는다.

## 6. 기존 결함 대조 · 스키마

### 6.1 스키마

- **새 스키마 불필요.** 근거: (1) 확인은 탭 안 사실(`oncomplete`)이고 새로고침 뒤 진실은 기존 `docs/{projectId}`(revision·hash)·`images/{projectId}/{localId}` 레코드 자체(F5) (2) `draftSeq`·장부는 탭 수명이라 영속하지 않음(영속하면 다중 탭 의미가 생겨 ADR-007 개정 2와 충돌) (3) `SCHEMA_VERSION` 1·`DB_VERSION` 2 변경 0.
- 대가: 탭이 죽으면 미확인 초안은 사라진다(4.5 탭 수명 행) — 초안 영속은 별도 결정(새 스토어 = 스키마 변경)이며 이 계약 범위 밖.

### 6.2 QA·Codex 대조표

| ID | 내용(요약) | 판정 | 근거 |
|---|---|---|---|
| Q1 | 확인 시작 전 미저장 편집 → 거짓 saved | **새 계약 해결** | 4.2-6 `newer` · I1 · confirmedSeq 비교 |
| Q2 | 재진입 getDoc이 옛 저장 커밋보다 먼저 → 거짓 STALE | **새 계약 해결** | I3(memHead 단일 출처) |
| Q3 | 편집기 밖 확인 이미지 누락(RS4-R10) | **새 계약 해결** | I4 · 4.6-2 binding |
| Q4 | "미확인 없으면 IDB 쓰기 0" 과장 | **새 계약 해결** | I5 `lastConfirmed`(시드 포함) |
| Q5 | 보호 범위 문장 과장 · 주소 입력 | **부분**: POP = 장부 해결 · 새로고침/주소/닫기 = 안전층만 · 문구 **상위 UI 명세 필요** | 4.5 |
| Q6 | 변경 건수 과소 | **새 계약 해결(정직 표기)** | 2.5 표 |
| Q7a | memory 모드 영구 확인 | **새 계약 해결** | I6 |
| Q7b | guarding 카운트 0 경유 | **새 계약 해결** | I8 술어 재계산 |
| Q7c | create before getDoc seq 밀림 | **미확인** — 테스트 주입 seq 영향은 구현 때 RED로 확인 | 7절 T10 |
| Q8 | guarding↔리스너 토글 미정의 | **새 계약 해결** | I8 |
| C1 | A 저장→B 편집→POP→A resolve가 B 삭제 | **새 계약 해결** | I1 · 4.5 dispose |
| C2 | 미커밋 PendingStart 확인 = 첫 커밋 · 인계 0 | **새 계약 해결** | I7 · 4.3 · 4.4 |
| C3 | = Q2 | **새 계약 해결** | I3 |
| (B 추적) | `adopt` 중 편집 덮어씀 | **새 계약 해결(설계)** | 4.4 3행 |
| (B 추적) | 이미지 ingest 중 이탈 | **상위 UI 명세 필요** | 4.6-5 |
| (A 추적) | 프로젝트 삭제 시 images prefix 정리 | **미확인** | 미조사 |

## 7. 테스트 계획 (구현 레인용 — 이번 실행 0)

주입점: `options.delay/fail({method, seq, phase: "request"|"commit"|"response"})`(`memoryProjectRepository.ts:69-83`) · P-3 하네스의 잠금 거절·quota 설정(`dev/active/rs4-measure/harness/rs4P3.harness.test.ts`) · 가짜 `StudioPersistence`. 표의 값 = (latest.seq, memSeq, confirmedSeq, memHead.revision, IDB docs revision/이미지, guard).

| # | 시나리오 · 순서 | 기대 |
|---|---|---|
| T1 | 오랜 저장 A: 편집 A → save(s1) `delay(saveDoc, response)` → 편집 B → POP(cleanup publish s2) → A resolve | latest=s2 유지 · memSeq=1 · confirmedSeq=1 · guard **on** · 재진입 seed.doc = B · B 이미지 binding 유지 (C1) |
| T2 | getDoc 먼저 → A commit: A `delay(saveDoc, request)` 중 POP → 재진입(acquire) → A 메모리 커밋 r+1 → B 저장 | B expectedRevision = r+1(memHead) · STALE_DOC 0 · revision r+2 1회 (C3) |
| T3 | 확인 전 dirty: 편집 → 디바운스 중 `confirm()` | 4.2-4로 초안 커밋 → confirmedSeq=latest.seq · 이후 편집 시 `newer:true`면 "확인됨" 표시 0 (Q1) |
| T4 | offline: 스케줄러 offline 중 편집 → POP → `/projects`에서 confirm | 장부 latest로 saveDoc → IDB 문서 = 편집 내용(P-3 c 반전) |
| T5 | 새 이미지 등록 → read-only 잠금 거절(memory committed) → 이탈(maps.delete) → 쓰기 탭 해제 → confirm | 결과 1차 `failed{read-only, memory: committed, head r+1}` · 장부 memHead=r+1 · 확인 시 IDB images 레코드 **있음** · 리로드 복원 맵 = 1 (P-3 a 반전) |
| T5b | T5에서 binding까지 없는 참조(인위 제거) | `failed{image-missing, missing:[id]}` · IDB 쓰기 0 (I4) |
| T6 | unknown origin: create before 읽기 실패 → 문서 있음 | start.held=unknown · confirm = `failed{start-pending}` 쓰기 0 · guard on |
| T7 | R-E5 무커밋 restart → 편집기 재진입 → confirm | startDoc 호출 0 · revision 변화 0 · 재판정 필요 상태 (C2) |
| T7b | retryStart 재생 성공 + lease 있음 · latest 없음 | 편집기 doc·revision·이미지 = 교체 문서 · 다음 편집 STALE 0 |
| T8 | caller unmount: 프로필 대화상자 confirm 중 닫힘 | lastResult 기록 · setState 경고 0 · guard 술어 정상 해제 |
| T9 | create 기억 지속: create 실패(unconfirmed) → 대화상자 언마운트 → `/projects` | view().start 존재 · guard on · retryStart 가능 |
| T10 | 시드 레코드 confirm(Q4): 리로드 직후 편집 없이 confirm | IDB 쓰기 0 · meta.generation 변화 0 · `saved` 전송 0 · create seq 주입 테스트 영향 확인(Q7c) |
| T11 | memory 모드 confirm | `memory-only` · UI 영구 저장 문구 0 |
| T12 | StrictMode mount→cleanup→mount, 편집 없음 | publish 0 · lease 1 · draftSeq 변화 0 |
| T13 | 같은 내용 재확인 | saveDoc 0 · revision 변화 0 (I5) |
| T14 | quota(제출됨) → 재시도 | retry에 이미지 op 포함 · confirmedSeq 갱신(P-3 b 회귀) |
| T15 | 빈 id 스냅샷이 있는 문서에서 confirm | 스냅샷 변화 0(P-3 d2 회귀 — deleteSnapshot 미사용) |
| T16 | (r0.1) saved 상태에서 편집 → 디바운스 타이머 전 `beforeunload` 발화 | 경고 등록됨(I8 `mark` · 기존 편집기 경고도 유지) · 탭 닫기 취소 가능 |
| T17 | (r0.1) 편집 B → POP(latest=B) → 프로필에서 restart 성공(replace) → `/projects` confirm → 재진입 | confirm = `failed{replaced-conflict}` 쓰기 0 · IDB 문서 = restart 결과 · 재진입 seed phase `conflicted`(B는 mine으로 보존) · 선택 전 자동 저장 0 |
| T18 | (r0.1) 이미지 누락 저장이 IDB에 있는 상태로 리로드 → 편집 없이 confirm | 증명 없음 → binding 없으면 `failed{image-missing}` · `confirmed` 0 |
| T19 | (r0.1) entry 읽기 → 다른 탭 저장 → 이 탭 싱크 열기(stale — entry 대체 시드) → confirm | 증명 없음 · `failed{stale-tab}` · `wrote:false confirmed` 0 |

브라우저 실측(Ego Lite, build+preview — memory `png-export-needs-preview` 교훈 동일): POP 재진입·탭 2개 잠금·리로드 복원은 단위 테스트로 대체 불가 → 구현 레인 QA.

## 8. 번들 연결 (측정 0 · 상향 0)

### 8.1 실측(L1, `dev/active/rs4-measure/REPORT.md` 1절 · gzip bytes · KB=1000B `check-bundle-size.mjs:10,159`)

| 시나리오 | 판정선(기준선+0.03) | 절대 한도(ADR-004) | base | S1r | S2 | S3 | pending(S3 · UNAPPROVED) |
|---|---|---|---|---|---|---|---|
| `/studio` 진입 | 129900 | 130000 (개정 9) | 129896 | 129911 판정선 초과 · 한도 안 | 130818 **둘 다 초과** | 130368 **둘 다 초과** | 131163 **둘 다 초과** |
| `/studio` 복원 진입 | 132940 | 134000 (개정 11) | 132929 | 132944 판정선 초과 · 한도 안 | 133850 판정선 초과 · 한도 안 | 133401 판정선 초과 · 한도 안 | 134196 **둘 다 초과** |

- 판정선과 절대 한도를 섞지 않는다. 판정선은 기준선 잠금(`m2cBaseline` + toleranceKb)이고 한도는 ADR 수치다. ADR-004 개정 15의 잠금 상한(129.95/132.98) 문구는 측정 레포트의 판정선 수치와 출처가 달라 여기서 쓰지 않는다.
- **CONTRACT-5 구조의 증분 = 미측정.** 예상 KB를 적지 않는다.

### 8.2 진입 소유 vs 조작 뒤 로드 (설계 배치 — 크기 미측정)

| 조각 | 위치 | 이유 |
|---|---|---|
| 장부 상태 Map · `view`·`acquire`·`release`·`publish`(동기) · I8 리스너 토글 | **진입**(저장소와 같은 closure — PROJECT_AUTO) | cleanup이 동기로 넘겨야 함(F9) |
| `confirm`·`retryStart`·`save` 본문 · 결과 분류 · 엄격 imageOps · `LocalSync.confirm` | **조작 뒤**(memoryDocBook/localSync 청크) | 사용자 조작 또는 첫 저장 때만 |
| 편집기 seed 인계(초기 phase `unconfirmed`·binding 시드) | 진입(조건부 경로) — S3처럼 lazy 가능하나 조건부 자동 import는 별도 시나리오 필요(`check-bundle-size.mjs:25`) | MQ-4-3 승계 |
| `/projects` 행 확인 UI | 조작 뒤 | 진입 0 목표 |

### 8.3 후속 스파이크 (별도 승인 레인)

- 방법: rs4-measure와 같은 머신·같은 도구(`dev/active/rs4-measure/tools/rawbytes.mjs`), base 재빌드 바이트 동일 확인 → 스파이크 → 복원 검증.
- 시나리오: **S5a** 진입 최소 장부(8.2 1행만) · **S5b** S5a + 편집기 seed 정적 · **S5c** S5a + seed lazy(+ "장부 초안 있음" 조건부 시나리오 UNAPPROVED 측정). 각 `/studio`·복원·`/projects` 첫/진입·`/profile` 첫/진입.
- 판정: 판정선 129900/132940 기준 PASS/FAIL, 절대 130000/134000 별도 표기. 감량 1회 후 초과면 raw 수치로 상신 — 예산 자동 상향 0.

## 9. 새로 내린 결정 · 남는 위험

- 새 결정(회수 대상): ① 소유자 = 저장소 인스턴스 장부 ② 편집기 밖 확인이 초안을 커밋할 수 있음(편집기가 hash·binding 동봉) ③ 확인/시작 재시도 분리 ④ 참조 이미지 미기록 = 제출 전 실패(현 동작 변경) ⑤ 새 스키마 0 ⑥ `deleteSnapshot(p,"")` 확인 차용 폐기. ⑦ (r0.1) 미확인 초안이 있는 문서 교체 = 항상 충돌 선택(자동 재기반 0) ⑧ (r0.1) 하이드레이트는 검증 조건(I5b)을 통과해야만 확인 증명.
- 남는 위험: 이미지 Blob 내용 유효성은 확인하지 않음(I5b — 존재만) · 탭 종료·모바일 종료·크래시 손실(안전층만) · ingest 중 이탈 · 저장소 책임 증가로 리팩터 범위 큼(2.5) · 진입 바이트 미측정(이미 판정선 여유 4B) · `local`인데 싱크 열기 실패 상태 구별 필드 신설 필요.

## 변경 이력
- r0 (2026-10-14) — 최초 작성.
- r0.1 (2026-10-14) — Codex adversarial-review a1(`dev/active/rs5-contract/logs/codex-a1.txt`, needs-attention · P1 3) 반영 1회: a1-1 디바운스 편집 이탈 보호(`mark` · I8 · 기존 편집기 경고 유지) · a1-2 lease 없는 교체 충돌(`epoch`·`baseEpoch`·I3b·4.4) · a1-3 하이드레이트 확인 증명 분리(I5b). T16~T19 추가. **미재검토.**
