/**
 * save-core-final-qa 관찰(OBS) — 수정본(3652a8f) 코어·헬퍼 읽기 전용 import. 실패 단언 없음: 관측값을 [FQA] 로그로 남기고 그 값을 고정한다.
 * 하네스 PASS와 분리 보고: liveness(타임아웃 없음) · CE-3a 정책 경계(같은 저장소 다른 어댑터 객체) · OBS-2(다른 프로젝트 이미지).
 */
import { describe, expect, it } from "vitest";
import { openSaveCore, readImage, readStored, type SaveResult, type WriterCheck } from "../../save-core-harness/core/saveCore";
import { blobOf, deferred, docOf, harnessDb, ticks, writerAlways } from "../../save-core-harness/test/helpers";
import { createWriterGate } from "../../../../app/src/data/persistence/writerLock";
import { createLockRegistry } from "../../../../app/src/data/persistence/fakeLocks";
import type { StudioPersistence } from "../../../../app/src/data/persistence/studioPersistence";

const log = (name: string, value: unknown) => console.log(`[FQA] ${name} ${JSON.stringify(value)}`);
const open = (persistence: StudioPersistence, writer: WriterCheck = writerAlways, projectId = "p") =>
  openSaveCore({ projectId, persistence, writer, initial: docOf(0, "init") });
const tracked = <T>(p: Promise<T>) => {
  const box: { done: boolean; value?: T } = { done: false };
  void p.then((value) => Object.assign(box, { done: true, value }));
  return box;
};
const brief = (r: SaveResult | undefined) => (r === undefined ? "pending" : r.status === "saved" ? `saved:gen${r.receipt.generation}` : `failed:${r.reason}`);

describe("save-core-final-qa 관찰", () => {
  it("LV-1 [liveness · 코어 간 직렬] 같은 영속 인스턴스에서 A의 write가 멈추면 B save는 타임아웃 없이 대기", async () => {
    const db = harnessDb();
    const a = await open(db.persistence);
    const b = await open(db.persistence);
    a.edit(docOf(1, "a"));
    b.edit(docOf(1, "b"));
    const hold = db.hold(1);
    const ra = tracked(a.save());
    const rb = tracked(b.save());
    await ticks(200);
    const during = { a: ra.done, b: rb.done, writesSeen: db.seen.length };
    hold.release();
    await ticks(50);
    const after = { a: brief(ra.value), b: brief(rb.value), stored: (await readStored(db.persistence, "p"))?.doc.body };
    log("LV-1", { during, after });
    expect(during).toEqual({ a: false, b: false, writesSeen: 1 });
    expect(after).toEqual({ a: "saved:gen1", b: "failed:stale", stored: "a" });
  });

  it("LV-2 [liveness · discard 읽기 정지] discard의 첫 읽기가 끝나지 않으면 save·dirty confirm은 계속 failed{discarding}, edit은 수용", async () => {
    const db = harnessDb();
    let gateRead: Promise<void> | undefined;
    const persistence: StudioPersistence = { ...db.persistence, get: async (store, id) => (await gateRead, db.persistence.get(store, id)) };
    const core = await open(persistence);
    core.edit(docOf(1, "A"));
    expect((await core.save()).status).toBe("saved");
    const stall = deferred();
    gateRead = stall.promise;
    const d = tracked(core.discard());
    const saves: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      saves.push(brief(await core.save()));
      await ticks(20);
    }
    const markAfterEdit = core.edit(docOf(2, "B"));
    const c = await core.confirm();
    const during = { discardDone: d.done, saves, confirm: c.status === "failed" ? `failed:${c.reason}` : c.status, markAfterEdit, writes: db.ops.length };
    gateRead = undefined;
    stall.release();
    await ticks(50);
    const after = { discard: d.value?.status === "discarded" ? "discarded" : `${d.value?.status}:${d.value && "reason" in d.value ? d.value.reason : ""}`, save: brief(await core.save()), stored: (await readStored(db.persistence, "p"))?.doc.body };
    log("LV-2", { during, after });
    expect(during).toEqual({ discardDone: false, saves: ["failed:discarding", "failed:discarding", "failed:discarding"], confirm: "failed:discarding", markAfterEdit: 2, writes: 1 });
    expect(after).toEqual({ discard: "blocked:newer", save: "saved:gen2", stored: "B" });
  });

  it("BD-1 [정책 경계 · CE-3a PARTIAL] 같은 저장소의 별개 어댑터 객체 2개 + 공유 gate → 둘 다 같은 세대 saved(대조: 같은 객체면 1개 stale)", async () => {
    const run = async (split: boolean) => {
      const db = harnessDb();
      const gate = createWriterGate(createLockRegistry().tab(), async () => true);
      const writer: WriterCheck = { mode: () => gate.enter() };
      const seed = await open(db.persistence, writer);
      seed.edit(docOf(1, "A"));
      await seed.save();
      const p1: StudioPersistence = split ? { ...db.persistence } : db.persistence;
      const p2: StudioPersistence = split ? { ...db.persistence } : db.persistence;
      const c1 = await open(p1, writer);
      const c2 = await open(p2, writer);
      c1.edit(docOf(2, "c1"));
      c2.edit(docOf(2, "c2"));
      const [r1, r2] = await Promise.all([c1.save(), c2.save()]);
      const stored = await readStored(db.persistence, "p");
      return { r1: brief(r1), r2: brief(r2), stored: [stored?.doc.body, stored?.generation] };
    };
    const sameObject = await run(false);
    const twoObjects = await run(true);
    log("BD-1", { sameObject, twoObjects });
    expect(sameObject).toEqual({ r1: "saved:gen2", r2: "failed:stale", stored: ["c1", 2] });
    expect(twoObjects).toEqual({ r1: "saved:gen2", r2: "saved:gen2", stored: ["c2", 2] });
  });

  it("BD-2 [정책 경계 · OBS-2 수정 뒤] 프로젝트 q가 커밋한 img-x를 프로젝트 p가 바인딩 없이 참조 → saved·confirm 통과(바이트 = q 것)", async () => {
    const db = harnessDb();
    const q = await open(db.persistence, writerAlways, "q");
    q.edit(docOf(1, "Q", ["img-x"]), new Map([["img-x", blobOf("bytes-q")]]));
    const rq = await q.save();
    const p = await open(db.persistence, writerAlways, "p");
    p.edit(docOf(1, "P", ["img-x"]));
    const rp = await p.save();
    const cp = await p.confirm();
    const bytes = await (await readImage(db.persistence, "img-x"))?.text();
    log("BD-2", { q: brief(rq), p: brief(rp), confirm: cp.status, bytes });
    expect({ q: brief(rq), p: brief(rp), confirm: cp.status, bytes }).toEqual({ q: "saved:gen1", p: "saved:gen1", confirm: "confirmed", bytes: "bytes-q" });
  });
});
