/**
 * 저장 코어(격리 하네스) — 프로젝트 1개·탭 1개의 문서+이미지 저장/확인 상태기.
 * 영속 경계 = 제품 `StudioPersistence`(write 1회 = 트랜잭션 1개). 제품 DocBook·localSync·useDocSave와 연결하지 않는다(MINIMAL-CONTRACT 참조).
 * v0 = 제품 위험을 흉내 낸 순진한 구현(RED 기준선 — 각 H 커밋 전 rawlogs/*-red.log). H5: discard/replace 거절 규칙 · lease 멱등. H1: Blob 바인딩은 코어 소유 · 저장 직렬화 · 제출 mark 고정 · 세대로 늦은 완료 식별.
 */
import type { StudioPersistence, WriteOp } from "../../../../app/src/data/persistence/studioPersistence";
import type { WriterMode } from "../../../../app/src/data/persistence/writerLock";

export interface CoreDoc {
  readonly revision: number;
  readonly body: string;
  readonly imageIds: readonly string[];
}

export interface Receipt {
  readonly hash: string;
  readonly imageIds: readonly string[];
  readonly generation: number;
  readonly mark: number;
  /** H4: hydrated = 열기 때 읽은 것 · committed = 이 코어의 트랜잭션 완료 · fresh = confirm 시점 재읽기 */
  readonly proof: "hydrated" | "committed" | "fresh";
}

export interface StoredDoc {
  readonly doc: CoreDoc;
  readonly hash: string;
  readonly generation: number;
}

export type SaveResult =
  | { readonly status: "saved"; readonly receipt: Receipt; readonly newer: boolean }
  | { readonly status: "failed"; readonly reason: string; readonly newer: boolean };

export type ConfirmResult =
  | { readonly status: "confirmed"; readonly wrote: boolean; readonly receipt: Receipt }
  | { readonly status: "newer"; readonly receipt: Receipt }
  | { readonly status: "failed"; readonly reason: string };

export type DiscardResult =
  | { readonly status: "discarded"; readonly restored: Receipt }
  | { readonly status: "rejected" | "blocked"; readonly reason: string };

export interface ReplaceRequest {
  readonly intent?: "replace";
  readonly expectedEpoch?: number;
}

export type ReplaceResult = { readonly status: "replaced"; readonly epoch: number } | { readonly status: "rejected"; readonly reason: string };

export interface CoreView {
  readonly doc: CoreDoc;
  readonly mark: number;
  readonly dirty: boolean;
  readonly inflight: boolean;
  readonly epoch: number;
  readonly confirmed: Receipt | undefined;
  readonly blob: (id: string) => Blob | undefined;
}

export interface WriterCheck {
  mode(): Promise<WriterMode>;
}

export interface CoreOptions {
  readonly projectId: string;
  /** undefined = 메모리 폴백(영속 없음) */
  readonly persistence: StudioPersistence | undefined;
  readonly writer: WriterCheck;
  readonly initial: CoreDoc;
  readonly starter?: () => Promise<void>;
}

export const SCHEMA = 1;

export function hashOf(doc: CoreDoc): string {
  const text = JSON.stringify([doc.revision, doc.body, [...doc.imageIds]]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export async function readStored(persistence: StudioPersistence, projectId: string): Promise<StoredDoc | undefined> {
  const raw = (await persistence.get("docs", projectId)) as { kind?: string; data?: StoredDoc } | undefined;
  return raw?.kind === "core-doc" ? raw.data : undefined;
}

export async function readImage(persistence: StudioPersistence, id: string): Promise<Blob | undefined> {
  const raw = (await persistence.get("images", id)) as { kind?: string; data?: { blob: Blob } } | undefined;
  return raw?.kind === "core-image" ? raw.data?.blob : undefined;
}

/** CE-2: 초안 = 동결 사본 — 호출자가 넘긴 객체·imageIds를 나중에 바꿔도 코어 초안·제출본 불변 */
const snapshot = (next: CoreDoc): CoreDoc => Object.freeze({ revision: next.revision, body: next.body, imageIds: Object.freeze([...next.imageIds]) });

/**
 * CE-3a: 같은 영속 인스턴스(= 같은 탭·realm)의 세대 읽기~쓰기 구간은 코어 간 직렬 — 공유 gate로 둘 다 writer여도 뒤 저장은 앞 커밋 세대를 보고 stale.
 * 다른 탭·다른 영속 인스턴스는 막지 못한다(배타 writer 잠금 몫). IDB 트랜잭션 안 조건부 쓰기는 제품 StudioPersistence 변경이 필요해 미구현(G3).
 */
const sections = new WeakMap<StudioPersistence, Promise<unknown>>();
function exclusive<T>(persistence: StudioPersistence, run: () => Promise<T>): Promise<T> {
  const next = (sections.get(persistence) ?? Promise.resolve()).then(run);
  sections.set(persistence, next.catch(() => undefined));
  return next;
}

export async function openSaveCore(options: CoreOptions) {
  const { projectId, persistence, writer } = options;
  const loaded = persistence ? await readStored(persistence, projectId) : undefined;
  let doc: CoreDoc = snapshot(loaded?.doc ?? options.initial);
  let mark = 0;
  let savedMark = 0;
  let inflight = 0;
  let leases = 0;
  let live: { readonly mountId: string; readonly token: number } | undefined;
  let epoch = 0;
  let confirmed: Receipt | undefined = loaded && { hash: loaded.hash, imageIds: loaded.doc.imageIds, generation: loaded.generation, mark: 0, proof: "hydrated" };
  // H1: Blob 바인딩은 코어 소유(편집 시 동기 등록) — 편집기 detach(POP/cleanup)와 무관하게 보존
  let attached: ReadonlyMap<string, Blob> = new Map();
  // CX-3: discard 복귀용 = 마지막 커밋에 실제로 실린 바인딩(그 문서 imageIds 한정) · 열기(hydrated)면 빈 맵
  let committedBlobs: ReadonlyMap<string, Blob> = new Map();
  // CE-1: discard 진입~끝 배타 — 그 사이 save(·dirty confirm)·discard 진입 0
  let discarding = false;
  // H1: 저장은 직렬 — 늦은 완료가 새 커밋을 덮지 않게(IDB 커밋 순서 = 제출 순서)
  let chain: Promise<unknown> = Promise.resolve();
  const settle = (receipt: Receipt, bound: ReadonlyMap<string, Blob>) => {
    savedMark = Math.max(savedMark, receipt.mark);
    // M6: 세대 가드 삭제 — 직렬 chain + 예상 세대(stale) 검사 + 코어 간 직렬 구간으로 커밋 세대는 늘 confirmed+1(가드는 항상 참이던 죽은 코드)
    confirmed = receipt;
    committedBlobs = new Map(receipt.imageIds.flatMap((id) => (bound.has(id) ? [[id, bound.get(id)!] as const] : [])));
  };

  const save = (): Promise<SaveResult> => {
    if (discarding) return Promise.resolve({ status: "failed", reason: "discarding", newer: false });
    inflight += 1;
    const run = chain.then(saveNow).finally(() => (inflight -= 1));
    chain = run.catch(() => undefined);
    return run;
  };
  const saveNow = async (): Promise<SaveResult> => {
    // CE-2: 제출 doc과 Blob 바인딩을 같은 시점에 동결(edit·replace는 늘 동결 doc·새 Map을 할당 — 참조 캡처 = 사본)
    const target = doc;
    const bound = attached;
    const submitted = mark;
    // H2: 메모리 폴백은 영속 confirmed를 만들지 않는다
    if (!persistence) return { status: "failed", reason: "not-persistent", newer: mark > submitted };
    const mode = await writer.mode();
    if (mode !== "writer") return { status: "failed", reason: mode, newer: mark > submitted };
    return exclusive(persistence, () => commit(persistence, target, bound, submitted));
  };
  const commit = async (persistence: StudioPersistence, target: CoreDoc, bound: ReadonlyMap<string, Blob>, submitted: number): Promise<SaveResult> => {
    const prev = await readStored(persistence, projectId);
    // H4: 예상 세대 = 이 코어가 마지막으로 본 세대 — 다른 탭이 그 뒤 썼으면 덮지 않는다
    if ((prev?.generation ?? 0) !== (confirmed?.generation ?? 0)) return { status: "failed", reason: "stale", newer: mark > submitted };
    const generation = (prev?.generation ?? 0) + 1;
    const hash = hashOf(target);
    const ops: WriteOp[] = [{ type: "put", store: "docs", record: { schemaVersion: SCHEMA, kind: "core-doc", id: projectId, data: { doc: target, hash, generation } } }];
    // H3: 참조 이미지 = 동결 바인딩에 있으면 문서와 같은 트랜잭션으로 put · 없으면 IDB 코어 이미지 레코드를 실제로 재읽기 · 둘 다 아니면 제출 0
    for (const id of target.imageIds) {
      const blob = bound.get(id);
      if (blob) ops.push({ type: "put", store: "images", record: { schemaVersion: SCHEMA, kind: "core-image", id, data: { projectId, blob } } });
      else if (!(await readImage(persistence, id))) return { status: "failed", reason: "image-missing", newer: mark > submitted };
    }
    try {
      await persistence.write(ops);
    } catch (error) {
      return { status: "failed", reason: (error as Error).message, newer: mark > submitted };
    }
    const receipt: Receipt = { hash, imageIds: target.imageIds, generation, mark: submitted, proof: "committed" };
    settle(receipt, bound);
    return { status: "saved", receipt, newer: mark > submitted };
  };

  /** H2: 커밋 증명 = IDB 재읽기(문서 hash·세대 일치 + 참조 이미지 = 코어 이미지 레코드의 Blob 실제 재읽기) */
  const verify = async (receipt: Receipt): Promise<boolean> => {
    if (!persistence) return false;
    const stored = await readStored(persistence, projectId);
    if (stored?.hash !== receipt.hash || stored.generation !== receipt.generation) return false;
    const images = await Promise.all(receipt.imageIds.map((id) => readImage(persistence, id)));
    return images.every((blob) => blob !== undefined);
  };
  /** H2: dirty면 최신 초안을 저장(진행 중 저장 뒤 직렬) · 끝난 뒤 mark가 앞서면 newer(확정 아님) */
  const confirm = async (): Promise<ConfirmResult> => {
    if (!persistence) return { status: "failed", reason: "not-persistent" };
    const entered = mark;
    if (mark <= savedMark && confirmed) {
      // H4: wrote:false = writer 탭 + 지금 IDB 재읽기가 마지막 증명과 같을 때만(열기·직전 증명 재사용 0)
      const mode = await writer.mode();
      if (mode !== "writer") return { status: "failed", reason: mode };
      const proof = confirmed;
      if (!(await verify(proof))) return { status: "failed", reason: "stale" };
      // 진입 뒤(await 사이) 편집이 있으면 확정 아님
      if (mark !== entered) return { status: "newer", receipt: { ...proof, proof: "fresh" } };
      return { status: "confirmed", wrote: false, receipt: { ...proof, proof: "fresh" } };
    }
    const result = await save();
    if (result.status === "failed") return { status: "failed", reason: result.reason };
    if (!(await verify(result.receipt))) return { status: "failed", reason: "not-committed" };
    if (mark > result.receipt.mark) return { status: "newer", receipt: result.receipt };
    return { status: "confirmed", wrote: true, receipt: result.receipt };
  };

  /** H5: 진행 중이면 거절 · 저장 상태로 돌아갈 근거(IDB 재읽기 = 마지막 증명)가 있을 때만 폐기, 없으면 blocked(초안 보존) */
  const discard = async (): Promise<DiscardResult> => {
    if (discarding) return { status: "rejected", reason: "discarding" };
    if (inflight > 0) return { status: "rejected", reason: "inflight" };
    if (!persistence) return { status: "blocked", reason: "not-persistent" };
    if (!confirmed) return { status: "blocked", reason: "no-saved-state" };
    // CE-1: 첫 await 전에 동기로 배타 시작 · 읽기 throw여도 finally로 해제(edit·replace는 계속 받음 = mark 검사로 blocked{newer})
    discarding = true;
    try {
      const entered = mark;
      const proof = confirmed;
      const stored = await readStored(persistence, projectId);
      if (!stored || !(await verify(proof))) return { status: "blocked", reason: "stale" };
      // 진입 뒤(await 사이) 편집이 있으면 그 초안을 버리지 않는다(바인딩도 보존)
      if (mark !== entered) return { status: "blocked", reason: "newer" };
      doc = snapshot(stored.doc);
      // CX-3: 바인딩 = 복귀 문서가 커밋될 때 실린 Blob만 · 없는 id는 폐기 Blob 제거(IDB 레코드로 저장) · delete op 0
      attached = committedBlobs;
      savedMark = mark;
      epoch += 1;
      return { status: "discarded", restored: { ...proof, proof: "fresh" } };
    } finally {
      discarding = false;
    }
  };
  /** H5: 문서 교체(재시작·R-E5 재시도 교체)는 명시 intent + 예상 epoch · 진행 중/미저장 편집이 있으면 거절(덮어쓰기 0) */
  const replace = (next: CoreDoc, request: ReplaceRequest, blobs: ReadonlyMap<string, Blob> = new Map()): ReplaceResult => {
    if (request.intent !== "replace") return { status: "rejected", reason: "intent-required" };
    if (inflight > 0) return { status: "rejected", reason: "inflight" };
    if (mark > savedMark) return { status: "rejected", reason: "dirty" };
    if (request.expectedEpoch !== epoch) return { status: "rejected", reason: "epoch" };
    doc = snapshot(next);
    attached = new Map([...attached, ...blobs]);
    mark += 1;
    epoch += 1;
    return { status: "replaced", epoch };
  };

  return {
    edit(next: CoreDoc, blobs: ReadonlyMap<string, Blob> = new Map()) {
      doc = snapshot(next);
      mark += 1;
      attached = new Map([...attached, ...blobs]);
      return mark;
    },
    attach() {
      return { detach: () => undefined };
    },
    save,
    confirm,
    discard,
    replace,
    /** H5: 같은 mountId 재요청(StrictMode 이중 effect) = 같은 토큰 · release 뒤 = 새 토큰 */
    acquire(mountId: string) {
      if (live?.mountId === mountId) return live.token;
      leases += 1;
      live = { mountId, token: leases };
      return leases;
    },
    release(token: number) {
      if (live?.token === token) live = undefined;
    },
    async retryStart() {
      await options.starter?.();
    },
    view(): CoreView {
      const blobs = attached;
      return { doc, mark, dirty: mark > savedMark, inflight: inflight > 0, epoch, confirmed, blob: (id) => blobs.get(id) };
    },
  };
}

export type SaveCore = Awaited<ReturnType<typeof openSaveCore>>;
