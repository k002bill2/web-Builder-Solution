/**
 * 저장 코어(격리 하네스) — 프로젝트 1개·탭 1개의 문서+이미지 저장/확인 상태기.
 * 영속 경계 = 제품 `StudioPersistence`(write 1회 = 트랜잭션 1개). 제품 DocBook·localSync·useDocSave와 연결하지 않는다(MINIMAL-CONTRACT 참조).
 * v0 = 제품 위험을 흉내 낸 순진한 구현(RED 기준선). H1: Blob 바인딩은 코어 소유 · 저장 직렬화 · 제출 mark 고정 · 세대로 늦은 완료 식별.
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

export async function openSaveCore(options: CoreOptions) {
  const { projectId, persistence, writer } = options;
  const loaded = persistence ? await readStored(persistence, projectId) : undefined;
  let doc: CoreDoc = loaded?.doc ?? options.initial;
  let mark = 0;
  let savedMark = 0;
  let inflight = 0;
  const epoch = 0;
  let confirmed: Receipt | undefined = loaded && { hash: loaded.hash, imageIds: loaded.doc.imageIds, generation: loaded.generation, mark: 0, proof: "hydrated" };
  // H1: Blob 바인딩은 코어 소유(편집 시 동기 등록) — 편집기 detach(POP/cleanup)와 무관하게 보존
  let attached: ReadonlyMap<string, Blob> = new Map();
  // H1: 저장은 직렬 — 늦은 완료가 새 커밋을 덮지 않게(IDB 커밋 순서 = 제출 순서)
  let chain: Promise<unknown> = Promise.resolve();
  const settle = (receipt: Receipt) => {
    savedMark = Math.max(savedMark, receipt.mark);
    if (!confirmed || receipt.generation > confirmed.generation) confirmed = receipt;
  };

  const save = (): Promise<SaveResult> => {
    inflight += 1;
    const run = chain.then(saveNow).finally(() => (inflight -= 1));
    chain = run.catch(() => undefined);
    return run;
  };
  const saveNow = async (): Promise<SaveResult> => {
    const target = doc;
    const submitted = mark;
    // H2: 메모리 폴백은 영속 confirmed를 만들지 않는다
    if (!persistence) return { status: "failed", reason: "not-persistent", newer: mark > submitted };
    const mode = await writer.mode();
    if (mode !== "writer") return { status: "failed", reason: mode, newer: mark > submitted };
    const prev = await readStored(persistence, projectId);
    // H4: 예상 세대 = 이 코어가 마지막으로 본 세대 — 다른 탭이 그 뒤 썼으면 덮지 않는다
    if ((prev?.generation ?? 0) !== (confirmed?.generation ?? 0)) return { status: "failed", reason: "stale", newer: mark > submitted };
    const generation = (prev?.generation ?? 0) + 1;
    const hash = hashOf(target);
    const ops: WriteOp[] = [{ type: "put", store: "docs", record: { schemaVersion: SCHEMA, kind: "core-doc", id: projectId, data: { doc: target, hash, generation } } }];
    // H3: 참조 이미지 = 바인딩에 있으면 문서와 같은 트랜잭션으로 put · 없으면 이미 IDB에 있어야 함 · 둘 다 아니면 제출 0
    const stored = new Set(await persistence.keys("images"));
    for (const id of target.imageIds) {
      const blob = attached.get(id);
      if (blob) ops.push({ type: "put", store: "images", record: { schemaVersion: SCHEMA, kind: "core-image", id, data: { projectId, blob } } });
      else if (!stored.has(id)) return { status: "failed", reason: "image-missing", newer: mark > submitted };
    }
    try {
      await persistence.write(ops);
    } catch (error) {
      return { status: "failed", reason: (error as Error).message, newer: mark > submitted };
    }
    const receipt: Receipt = { hash, imageIds: target.imageIds, generation, mark: submitted, proof: "committed" };
    settle(receipt);
    return { status: "saved", receipt, newer: mark > submitted };
  };

  /** H2: 커밋 증명 = IDB 재읽기(문서 hash·세대 일치 + 참조 이미지 레코드 존재) */
  const verify = async (receipt: Receipt): Promise<boolean> => {
    if (!persistence) return false;
    const stored = await readStored(persistence, projectId);
    if (stored?.hash !== receipt.hash || stored.generation !== receipt.generation) return false;
    const keys = new Set(await persistence.keys("images"));
    return receipt.imageIds.every((id) => keys.has(id));
  };
  /** H2: dirty면 최신 초안을 저장(진행 중 저장 뒤 직렬) · 끝난 뒤 mark가 앞서면 newer(확정 아님) */
  const confirm = async (): Promise<ConfirmResult> => {
    if (!persistence) return { status: "failed", reason: "not-persistent" };
    if (mark <= savedMark && confirmed) {
      // H4: wrote:false = writer 탭 + 지금 IDB 재읽기가 마지막 증명과 같을 때만(열기·직전 증명 재사용 0)
      const mode = await writer.mode();
      if (mode !== "writer") return { status: "failed", reason: mode };
      if (!(await verify(confirmed))) return { status: "failed", reason: "stale" };
      return { status: "confirmed", wrote: false, receipt: { ...confirmed, proof: "fresh" } };
    }
    const result = await save();
    if (result.status === "failed") return { status: "failed", reason: result.reason };
    if (!(await verify(result.receipt))) return { status: "failed", reason: "not-committed" };
    if (mark > result.receipt.mark) return { status: "newer", receipt: result.receipt };
    return { status: "confirmed", wrote: true, receipt: result.receipt };
  };

  return {
    edit(next: CoreDoc, blobs: ReadonlyMap<string, Blob> = new Map()) {
      doc = next;
      mark += 1;
      attached = new Map([...attached, ...blobs]);
      return mark;
    },
    attach() {
      return { detach: () => undefined };
    },
    save,
    confirm,
    async discard() {
      if (confirmed && loaded) doc = loaded.doc;
      savedMark = mark;
      return { status: "discarded" as const };
    },
    replace(next: CoreDoc) {
      doc = next;
      mark += 1;
      savedMark = mark;
      return { status: "replaced" as const };
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
