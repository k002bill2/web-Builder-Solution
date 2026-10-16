/**
 * save-core-final-qa 자기 프로브 — 수정본 코어(읽기 전용 import) + 제품 openIdbPersistence(실제 IDB) + 제품 createWriterGate(navigator.locks).
 * 페이지당 gate 1개(같은 페이지 gate 재생성 = readonly 관찰 회피). DB 이름은 finalqa- 접두어만. 수동 1회 실행용 — 자동 suite 아님.
 */
import { hashOf, openSaveCore, readImage, readStored, type WriterCheck } from "../../save-core-harness/core/saveCore";
import { openIdbPersistence } from "../../../../app/src/data/persistence/idbPersistence";
import { createWriterGate, type WriterLocks } from "../../../../app/src/data/persistence/writerLock";

const PREFIX = "finalqa-";
const guard = (name: string) => {
  if (!name.startsWith(PREFIX)) throw new Error(`DB 이름 접두어 위반: ${name}`);
};
const doc = (revision: number, body: string, imageIds: readonly string[] = []) => ({ revision, body, imageIds });
const gate = createWriterGate(navigator.locks as unknown as WriterLocks, async () => true);
const gateWriter: WriterCheck = { mode: () => gate.enter() };

async function stored(name: string) {
  const p = await openIdbPersistence(indexedDB, name);
  try {
    const s = await readStored(p, "p");
    const img = await readImage(p, "img");
    return { body: s?.doc.body, generation: s?.generation, hashOk: s ? s.hash === hashOf(s.doc) : undefined, bytes: await img?.text() };
  } finally {
    p.close();
  }
}

const fqa = {
  /** CE-1 수정 확인: A(gen1) 커밋 → 편집 B → discard 진입 직후 save → save failed{discarding} · discarded · IDB = A */
  async discardRace(name: string) {
    guard(name);
    const p = await openIdbPersistence(indexedDB, name);
    const core = await openSaveCore({ projectId: "p", persistence: p, writer: gateWriter, initial: doc(0, "init") });
    core.edit(doc(1, "A"));
    const a = await core.save();
    core.edit(doc(2, "B", ["img"]), new Map([["img", new Blob(["bytes-B"])]]));
    const d = core.discard();
    const s = core.save();
    const [dr, sr] = await Promise.all([d, s]);
    const c = await core.confirm();
    const v = core.view();
    p.close();
    return { a: a.status, discard: dr.status, save: sr.status === "saved" ? `saved:gen${sr.receipt.generation}` : `failed:${sr.reason}`, confirm: c.status === "failed" ? `failed:${c.reason}` : `${c.status}:gen${c.receipt.generation}`, view: { body: v.doc.body, dirty: v.dirty, blob: v.blob("img") ? "Y" : "none" }, idb: await stored(name) };
  },
  /** CE-2 수정 확인: D1(img=X) save가 writer.mode에서 대기하는 동안 D2(img=Y) 편집 → 커밋 = D1 + X */
  async bindingFreeze(name: string) {
    guard(name);
    const p = await openIdbPersistence(indexedDB, name);
    let release = () => undefined as void;
    const held = new Promise<void>((r) => (release = r));
    let calls = 0;
    const writer: WriterCheck = { mode: async () => ((calls += 1), calls === 1 && (await held), gate.enter()) };
    const core = await openSaveCore({ projectId: "p", persistence: p, writer, initial: doc(0, "init") });
    core.edit(doc(1, "D1", ["img"]), new Map([["img", new Blob(["X"])]]));
    const s = core.save();
    while (calls < 1) await new Promise((r) => setTimeout(r, 0));
    core.edit(doc(2, "D2", ["img"]), new Map([["img", new Blob(["Y"])]]));
    release();
    const sr = await s;
    const view = core.view();
    p.close();
    return { save: sr.status === "saved" ? `saved:gen${sr.receipt.generation}` : `failed:${sr.reason}`, dirty: view.dirty, idb: await stored(name) };
  },
  /** CE-3a PARTIAL 경계: 같은 DB 이름에 어댑터(연결) 2개 + 같은 페이지 gate → 동시 save */
  async twoAdapters(name: string) {
    guard(name);
    const seedP = await openIdbPersistence(indexedDB, name);
    const seed = await openSaveCore({ projectId: "p", persistence: seedP, writer: gateWriter, initial: doc(0, "init") });
    seed.edit(doc(1, "A"));
    await seed.save();
    seedP.close();
    const [p1, p2] = [await openIdbPersistence(indexedDB, name), await openIdbPersistence(indexedDB, name)];
    const c1 = await openSaveCore({ projectId: "p", persistence: p1, writer: gateWriter, initial: doc(0, "init") });
    const c2 = await openSaveCore({ projectId: "p", persistence: p2, writer: gateWriter, initial: doc(0, "init") });
    c1.edit(doc(2, "c1"));
    c2.edit(doc(2, "c2"));
    const rs = await Promise.all([c1.save(), c2.save()]);
    p1.close();
    p2.close();
    return { r: rs.map((r) => (r.status === "saved" ? `saved:gen${r.receipt.generation}` : `failed:${r.reason}`)), idb: await stored(name) };
  },
  async locks() {
    const q = await navigator.locks.query();
    return { held: q.held?.map((l) => l.name), pending: q.pending?.map((l) => l.name) };
  },
  async databases() {
    return (await indexedDB.databases()).map((d) => d.name);
  },
  async cleanup() {
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
(window as unknown as { fqa: typeof fqa }).fqa = fqa;
document.getElementById("state")!.textContent = "ready";
