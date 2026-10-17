/**
 * 저장 코어 상태 부분(INTEGRATE-6 9.2 진입 몫 · 하네스 `save-core-harness/core/saveCore.ts` 이식) — 초안·mark·바인딩·epoch·lease·직렬 chain.
 * 동기 생성(2.2-2 ① · D6-10 — 열 때 IDB 읽기 0). io(save 본문·confirm·discard·replace)와 포트는 조작 뒤 청크 — `connect()`가 받는다(값 import 0, 타입만).
 * 영속 레코드 접근 0: 코어는 `StudioPersistence`를 받지 않고 포트(CorePort, LocalSync 구현)만 쓴다(2.2-1).
 *
 * MC I7 변경(RS6-L2 · MQ-6-3 A · INTEGRATE-6 D6-4) — 옛 문장 "읽기가 끝나지 않으면 가드도 풀리지 않는다(liveness)"를 다음으로 바꾼다:
 * "discard 읽기가 `DISCARD_GIVE_UP_MS` 안에 끝나지 않으면 포기 토큰을 무효화하고 가드를 풀며 `blocked{timeout}`을 돌려준다.
 *  늦게 온 읽기 결과는 버린다(doc·바인딩·savedMark·epoch 변경 0, 초안·바인딩 보존). 진입 = 호출 시점(connect 전 동기 mark)." — 취소 0 · 자동 재시도 0.
 */
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { RenderImages } from "../images/store/types";

export interface Receipt {
  readonly hash: string;
  readonly revision: number;
  readonly mark: number;
  /** hydrated = 생성 seed · committed = 이 코어 트랜잭션 완료 · fresh = 확인 시점 IDB 재읽기 · rebased = DocBook 메모리 쓰기 맞춤(IDB flush 증명 아님 — RS6-L5 FIX1) */
  readonly proof: "hydrated" | "committed" | "fresh" | "rebased";
}
/** `revision` = memory 모드(not-persistent) DocBook 메모리 커밋 revision — 영속 증명(receipt) 아님(I5) · 편집기 `savedRevision` 출처(RS6-L3a CP2) */
export type SaveResult = { readonly status: "saved"; readonly receipt: Receipt; readonly newer: boolean } | { readonly status: "failed"; readonly reason: string; readonly newer: boolean; readonly revision?: number };
export type ConfirmResult = { readonly status: "confirmed"; readonly wrote: boolean; readonly receipt: Receipt } | { readonly status: "newer"; readonly receipt: Receipt } | { readonly status: "failed"; readonly reason: string };
export type DiscardResult = { readonly status: "discarded"; readonly restored: Receipt } | { readonly status: "rejected" | "blocked"; readonly reason: string };
export type ReplaceResult = { readonly status: "replaced"; readonly epoch: number } | { readonly status: "rejected"; readonly reason: string };
export interface ReplaceRequest {
  readonly intent?: "replace";
  readonly expectedEpoch?: number;
}

/** 코어 가변 상태 — io 청크가 같은 객체를 읽고 쓴다 */
export interface CoreState {
  doc: PageDoc;
  mark: number;
  savedMark: number;
  inflight: number;
  epoch: number;
  confirmed: Receipt | undefined;
  attached: RenderImages;
  committed: RenderImages;
  discarding: boolean;
  /** LV-2 포기 토큰 — discard 차례 번호. 포기·끝나면 올려서 늦은 읽기 결과를 버린다 */
  discards: number;
  chain: Promise<unknown>;
}

/** 포트(1.3) — 제품 LocalSync가 구현. 이미지 키는 포트 안에서 `imageRecordId(projectId, localId)`로만(RS6-AC-U15) */
export interface CorePort {
  /** 쓰기 전 잠금 판정 — writer·readonly·stale·unsupported 또는 지워진 탭 cleared */
  mode(): Promise<string>;
  /** 마지막 커밋 문서 레코드의 문서(IDB 재읽기) — discard 복귀 · 없으면 undefined */
  head(projectId: string): Promise<PageDoc | undefined>;
  /** 문서 + 바인딩 이미지 + 도장 1 트랜잭션(queue.submit → committed). 실패 = reject(`reason` 필드) */
  commit(projectId: string, doc: PageDoc, bound: RenderImages): Promise<void>;
  /** IDB 재읽기 증명 — 문서 hash·revision + 참조 이미지 레코드 존재 */
  verify(projectId: string, receipt: Receipt): Promise<boolean>;
}

/** 조작 뒤 io 본문 */
export interface CoreIo {
  save(s: CoreState, link: CoreLink): Promise<SaveResult>;
  confirm(s: CoreState, link: CoreLink, save: () => Promise<SaveResult>): Promise<ConfirmResult>;
  /** `entered` = 호출 시점 mark(connect 전 동기 — `core.discard()`가 잡는다) */
  discard(s: CoreState, link: CoreLink, entered: number): Promise<DiscardResult>;
  replace(s: CoreState, next: PageDoc, request: ReplaceRequest, blobs?: RenderImages): ReplaceResult;
}

/** io + 포트(local만) + DocBook 연결 — 조립은 DocBook 청크(`coreLink`) */
export interface CoreLink {
  readonly projectId: string;
  readonly io: CoreIo;
  readonly port: CorePort | undefined;
  /** 저장 시각(DocBook과 같은 주입 시계) */
  readonly now: () => string;
  /** memory 모드 저장 = DocBook 메모리 커밋(판정 그대로 · 기준 = 지금 메모리 revision — 이 탭 문서 필드 작성자는 코어 1명) — 저장된 문서 */
  readonly book: (doc: PageDoc) => PageDoc;
  /** saved 뒤 DocBook 문서 = 커밋한 문서 그대로(G1 — 실패면 호출 0) */
  readonly align: (doc: PageDoc) => void;
  /** 편집 틀 이미지 맵(저장소 `images` 등록) — save 시작 때 코어 바인딩에 합친다(RS6-L3a · 기존 saveDoc 경로가 flush 때 맵을 싣던 것과 같은 시점 — ingest 직후 편집은 맵 state 갱신 전이라 edit 때는 못 받는다) */
  readonly images?: () => RenderImages | undefined;
}

export function createSaveCore(seed: PageDoc, connect: () => Promise<CoreLink>, starter?: () => Promise<void>) {
  const s: CoreState = { doc: seed, mark: 0, savedMark: 0, inflight: 0, epoch: 0, confirmed: { hash: seed.hash, revision: seed.revision, mark: 0, proof: "hydrated" }, attached: {}, committed: {}, discarding: false, discards: 0, chain: Promise.resolve() };
  let leases = 0;
  let live: { readonly mountId: string; readonly token: number } | undefined;
  const save = (): Promise<SaveResult> => {
    if (s.discarding) return Promise.resolve({ status: "failed", reason: "discarding", newer: false });
    s.inflight += 1;
    // 청크·싱크 받기 실패 = failed(2.2-2 ③ — 다음 save가 다시 받는다)
    const run = s.chain
      .then(connect)
      .then(
        (link) => link.io.save(s, link),
        (): SaveResult => ({ status: "failed", reason: "unavailable", newer: false }),
      )
      .finally(() => (s.inflight -= 1));
    s.chain = run.catch(() => undefined);
    return run;
  };
  return {
    edit(next: PageDoc, blobs?: RenderImages) {
      // CE-2: 초안 = 사본(호출자 객체를 나중에 바꿔도 불변) — 엔진 문서는 불변 계약이라 얕은 사본(I6 G2)
      s.doc = { ...next };
      s.mark += 1;
      if (blobs) s.attached = { ...s.attached, ...blobs };
      return s.mark;
    },
    save,
    /** 편집 틀 맵 중 초안이 참조하는 Blob만 바인딩에(mark 변화 0) — 편집 틀 cleanup이 맵을 지우기 전 동기로(FIX1 · 해제 save가 맵을 읽는 시점과 무관) */
    keep(blobs: RenderImages) {
      const held = JSON.stringify(s.doc);
      s.attached = { ...s.attached, ...Object.fromEntries(Object.entries(blobs).filter(([id]) => held.includes(id))) };
    },
    /** 진입 = 호출 시점 mark(동기) — connect 대기 중 들어온 편집·교체도 newer로 막는다(L1 QA note 1 · 하네스 "첫 await 전 진입") */
    discard() {
      const entered = s.mark;
      return connect().then((link) => link.io.discard(s, link, entered));
    },
    /** 조작 뒤 io 위임 1개(confirm·replace) — 호출자가 io 함수를 고른다 */
    link: <T>(run: (io: CoreIo, s: CoreState, link: CoreLink) => T) => connect().then((link) => run(link.io, s, link)),
    /** 지금까지 낸 save가 끝난 뒤(G1 — DocBook 경로 레코드 재쓰기는 이 뒤) */
    idle: () => s.chain,
    /** 같은 mountId 재요청(StrictMode) = 같은 토큰 · release 뒤 = 새 토큰 */
    acquire(mountId: string) {
      if (live?.mountId === mountId) return live.token;
      leases += 1;
      live = { mountId, token: leases };
      return leases;
    },
    release(token: number) {
      if (live?.token === token) live = undefined;
    },
    retryStart: async () => starter?.(),
    /** 진입 동기 몫(G7 재seed = doc·바인딩·dirty + epoch·confirmed) · mark·inflight = 상태 표시 출처(I6 8.1 `saving` = inflight > 0 · LV-1) */
    view() {
      const { doc, mark, savedMark, inflight, epoch, confirmed, attached } = s;
      return { doc, mark, inflight, dirty: mark > savedMark, epoch, confirmed, images: attached };
    },
  };
}

export type SaveCore = ReturnType<typeof createSaveCore>;

/** 저장소 능력(선택) — ImageKeeper와 같은 모양(MQ-6-1 · 공개 ProjectRepository 직접 확장 0) */
export interface CoreKeeper {
  readonly core?: (projectId: string, seed: PageDoc) => SaveCore;
  /** 레지스트리 읽기(생성 0) — 편집기 밖(`/projects` 행)이 코어 상태를 본다(RS6-L5) */
  readonly cores?: ReadonlyMap<string, SaveCore>;
}
