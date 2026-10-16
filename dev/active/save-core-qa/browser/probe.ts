/**
 * save-core-qa 실제 브라우저 프로브 — 하네스 코어(읽기 전용 import) + 제품 openIdbPersistence + 제품 createWriterGate(navigator.locks).
 * DB 이름은 반드시 save-core-qa- 접두어. 제품 DocBook·스케줄러·React와는 결합하지 않는다.
 */
import { hashOf, openSaveCore, readImage, readStored, type SaveCore } from "../../save-core-harness/core/saveCore";
import { openIdbPersistence } from "../../../../app/src/data/persistence/idbPersistence";
import { createWriterGate, type WriterLocks } from "../../../../app/src/data/persistence/writerLock";
import type { StudioPersistence } from "../../../../app/src/data/persistence/studioPersistence";

const PREFIX = "save-core-qa-";
const guard = (name: string) => {
  if (!name.startsWith(PREFIX)) throw new Error(`DB 이름 접두어 위반: ${name}`);
};
const doc = (revision: number, body: string, imageIds: readonly string[] = []) => ({ revision, body, imageIds });
const state: { persistence?: StudioPersistence; core?: SaveCore } = {};

async function openCore(name: string) {
  guard(name);
  state.persistence?.close();
  const persistence = await openIdbPersistence(indexedDB, name);
  const gate = createWriterGate(navigator.locks as unknown as WriterLocks, async () => true);
  const core = await openSaveCore({ projectId: "p", persistence, writer: { mode: () => gate.enter() }, initial: doc(0, "init") });
  state.persistence = persistence;
  state.core = core;
  return core;
}

async function snapshot(name: string) {
  guard(name);
  const persistence = await openIdbPersistence(indexedDB, name);
  try {
    const stored = await readStored(persistence, "p");
    const images = await persistence.keys("images");
    const bytes = images.includes("img") ? await (await readImage(persistence, "img"))?.text() : undefined;
    return { body: stored?.doc.body, generation: stored?.generation, hashOk: stored ? stored.hash === hashOf(stored.doc) : undefined, images, bytes };
  } finally {
    persistence.close();
  }
}

const qa = {
  /** 저장: A(gen1, 이미지 img=bytes-A) — write resolve = 제품 어댑터의 tx oncomplete */
  async save(name: string) {
    const core = await openCore(name);
    core.edit(doc(1, "A", ["img"]), new Map([["img", new Blob(["bytes-A"], { type: "image/png" })]]));
    const r = await core.save();
    return { save: r.status === "saved" ? { gen: r.receipt.generation, hash: r.receipt.hash } : r, snap: await snapshot(name) };
  },
  /** reload 뒤: 새 코어 hydrate + wrote:false confirm(실제 IDB 재읽기) */
  async afterReload(name: string) {
    const core = await openCore(name);
    const c = await core.confirm();
    return { hydrated: core.view().confirmed, confirm: c.status === "failed" ? c : { status: c.status, gen: c.receipt.generation, proof: c.receipt.proof }, snap: await snapshot(name) };
  },
  /** abort: 문서 put 뒤 이미지 put이 DataCloneError → 제품 applyOps abort → 문서·이미지 함께 롤백되어야 함 */
  async abortWrite(name: string) {
    const core = await openCore(name);
    const bad = { notCloneable: () => 1 } as unknown as Blob;
    core.edit(doc(2, "BAD", ["img", "img-bad"]), new Map([["img-bad", bad]]));
    const r = await core.save();
    return { save: r.status === "saved" ? "saved" : r.reason, snap: await snapshot(name) };
  },
  /** 탭 역할: 코어 열기 + confirm(편집 없음) */
  async tabConfirm(name: string) {
    const core = state.core && state.persistence ? state.core : await openCore(name);
    const c = await core.confirm();
    return c.status === "failed" ? c : { status: c.status, gen: c.receipt.generation, proof: c.receipt.proof };
  },
  async tabOpen(name: string) {
    await openCore(name);
    return { confirmed: state.core?.view().confirmed?.generation };
  },
  /** 탭 역할: 편집 후 저장(잠금 취득 = 첫 쓰기) */
  async tabSave(body: string) {
    const core = state.core!;
    core.edit(doc(core.view().doc.revision + 1, body, core.view().doc.imageIds));
    const r = await core.save();
    return r.status === "saved" ? { status: "saved", gen: r.receipt.generation } : r;
  },
  async locks() {
    const q = await navigator.locks.query();
    return { held: q.held?.map((l) => l.name), pending: q.pending?.map((l) => l.name) };
  },
  async databases() {
    return (await indexedDB.databases()).map((d) => d.name);
  },
  async cleanup() {
    state.persistence?.close();
    state.persistence = undefined;
    state.core = undefined;
    const names = (await indexedDB.databases()).map((d) => d.name ?? "").filter((n) => n.startsWith(PREFIX));
    const results = await Promise.all(
      names.map((n) => new Promise<string>((ok) => {
        const req = indexedDB.deleteDatabase(n);
        req.onsuccess = () => ok(`${n}:deleted`);
        req.onerror = () => ok(`${n}:error`);
        req.onblocked = () => ok(`${n}:blocked`);
      })),
    );
    return { results, after: (await indexedDB.databases()).map((d) => d.name) };
  },
};
(window as unknown as { qa: typeof qa }).qa = qa;
document.getElementById("state")!.textContent = "ready";
