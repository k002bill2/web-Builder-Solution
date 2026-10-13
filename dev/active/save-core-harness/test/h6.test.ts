/** H6 — save-core-qa 반례(78e3c52) 회귀: CE-1 discard 배타 · CE-2/CX-3 doc·Blob 동결과 discard 바인딩 복귀 · CE-3a 같은 영속 코어 간 세대 읽기~쓰기 직렬 · M8/M9 wrote:true 재검증. */
import { describe, expect, it } from "vitest";
import type { StudioPersistence, WriteOp } from "../../../../app/src/data/persistence/studioPersistence";
import { createWriterGate } from "../../../../app/src/data/persistence/writerLock";
import { createLockRegistry } from "../../../../app/src/data/persistence/fakeLocks";
import { hashOf, openSaveCore, readImage, readStored, type WriterCheck } from "../core/saveCore";
import { blobOf, deferred, docOf, harnessDb, until, writerAlways } from "./helpers";

const P = "p1";
const A = docOf(1, "A", ["img"]);
const B = docOf(2, "B", ["img"]);

const open = (persistence: StudioPersistence, writer: WriterCheck = writerAlways) =>
  openSaveCore({ projectId: P, persistence, writer, initial: docOf(0, "seed") });

async function savedA() {
  const db = harnessDb();
  const core = await open(db.persistence);
  core.edit(A, new Map([["img", blobOf("X")]]));
  await core.save(); // 세대 1 = A + X
  return { db, core };
}

/** write를 가로채 거짓 성공을 만든다 — n번째 write: "drop" = 반영 없이 resolve · "no-images" = images op만 빼고 반영 */
function falseSuccessDb(n: number, mode: "drop" | "no-images") {
  const db = harnessDb();
  let calls = 0;
  const write = (ops: readonly WriteOp[]) => {
    calls += 1;
    if (calls !== n) return db.persistence.write(ops);
    return mode === "drop" ? Promise.resolve() : db.persistence.write(ops.filter((op) => op.type !== "put" || op.store !== "images"));
  };
  return { db, persistence: { ...db.persistence, write } satisfies StudioPersistence };
}

describe("H6-1 discard는 진입부터 끝까지 배타(CE-1)", () => {
  it("discard await 중 save → failed{discarding} · write 0 · inflight 0 · 저장소 A 유지 · confirm은 A wrote:false", async () => {
    const { db, core } = await savedA();
    core.edit(B, new Map([["img", blobOf("Y")]]));
    const discarding = core.discard();
    const saving = core.save();
    expect(core.view().inflight).toBe(false);
    expect(await discarding).toMatchObject({ status: "discarded", restored: { hash: hashOf(A) } });
    expect(await saving).toMatchObject({ status: "failed", reason: "discarding" });
    expect(db.ops.length).toBe(1);
    expect((await readStored(db.persistence, P))?.doc.body).toBe("A");
    expect(await core.confirm()).toMatchObject({ status: "confirmed", wrote: false, receipt: { hash: hashOf(A) } });
  });

  it("discard await 중 dirty confirm · 두 번째 discard → 거절(쓰기 0) · 끝난 뒤 save는 정상", async () => {
    const { db, core } = await savedA();
    core.edit(B, new Map([["img", blobOf("Y")]]));
    const discarding = core.discard();
    const confirming = core.confirm();
    expect(await core.discard()).toMatchObject({ status: "rejected", reason: "discarding" });
    await discarding;
    expect(await confirming).toMatchObject({ status: "failed", reason: "discarding" });
    expect(db.ops.length).toBe(1);
    core.edit(docOf(3, "C"));
    expect(await core.save()).toMatchObject({ status: "saved", receipt: { generation: 2 } });
  });

  it("discard 중 읽기 throw → discard reject · 가드 해제(finally) → 다음 save saved", async () => {
    const { db, core } = await savedA();
    core.edit(B, new Map([["img", blobOf("Y")]]));
    const real = db.persistence.get;
    db.persistence.get = () => Promise.reject(new Error("read-broken"));
    await expect(core.discard()).rejects.toThrow("read-broken");
    db.persistence.get = real;
    expect(core.view()).toMatchObject({ doc: B, dirty: true });
    expect(await core.save()).toMatchObject({ status: "saved", receipt: { hash: hashOf(B) } });
  });

  it("discard 중 edit·replace는 받는다(mark 살아 있음) → discard blocked{newer} · 바인딩 보존", async () => {
    const { core } = await savedA();
    const discarding = core.discard();
    expect(core.replace(B, { intent: "replace", expectedEpoch: 0 }, new Map([["img", blobOf("Y")]]))).toMatchObject({ status: "replaced" });
    expect(await discarding).toMatchObject({ status: "blocked", reason: "newer" });
    expect(core.view().doc).toEqual(B);
    expect(await core.view().blob("img")?.text()).toBe("Y");
  });
});

describe("H6-2 제출 doc·Blob 동결과 discard 바인딩 복귀(CE-2·CX-3)", () => {
  it("저장이 writer 확인에서 대기 중 같은 id 다른 Blob 편집 → 커밋된 D1은 D1 편집 때 Blob(X)", async () => {
    const db = harnessDb();
    const held = deferred();
    let calls = 0;
    const core = await open(db.persistence, {
      mode: async () => {
        calls += 1;
        if (calls === 1) await held.promise;
        return "writer";
      },
    });
    const D1 = docOf(1, "D1", ["img"]);
    core.edit(D1, new Map([["img", blobOf("X")]]));
    const saving = core.save();
    await until(() => calls === 1);
    core.edit(docOf(2, "D2", ["img"]), new Map([["img", blobOf("Y")]]));
    held.release();
    expect(await saving).toMatchObject({ status: "saved", receipt: { hash: hashOf(D1) } });
    expect(await (await readImage(db.persistence, "img"))?.text()).toBe("X");
    expect(await core.view().blob("img")?.text()).toBe("Y");
  });

  it("edit·replace 뒤 호출자가 넘긴 doc·imageIds를 바꿔도 코어 초안 불변", async () => {
    const { core } = await savedA();
    const mine = { revision: 2, body: "B", imageIds: ["img"] };
    core.edit(mine);
    mine.body = "hacked";
    mine.imageIds.push("img-ghost");
    expect(core.view().doc).toEqual(docOf(2, "B", ["img"]));
    await core.save();
    const next = { revision: 3, body: "R", imageIds: [] as string[] };
    core.replace(next, { intent: "replace", expectedEpoch: 0 });
    next.body = "hacked";
    expect(core.view().doc.body).toBe("R");
  });

  it("순차 discard → 바인딩 = 커밋된 X · 다음 save에 폐기 Blob Y가 붙지 않음", async () => {
    const { db, core } = await savedA();
    core.edit(B, new Map([["img", blobOf("Y")], ["img-new", blobOf("N")]]));
    expect(await core.discard()).toMatchObject({ status: "discarded" });
    expect(await core.view().blob("img")?.text()).toBe("X");
    expect(core.view().blob("img-new")).toBeUndefined();
    core.edit(docOf(3, "A-text", ["img"]));
    expect(await core.save()).toMatchObject({ status: "saved" });
    expect(await (await readImage(db.persistence, "img"))?.text()).toBe("X");
  });

  it("다시 연 코어(바인딩 없음)의 discard → 폐기 Blob 제거 · IDB의 X로 저장", async () => {
    const { db } = await savedA();
    const reopened = await open(db.persistence);
    reopened.edit(B, new Map([["img", blobOf("Y")]]));
    expect(await reopened.discard()).toMatchObject({ status: "discarded" });
    expect(reopened.view().blob("img")).toBeUndefined();
    reopened.edit(docOf(3, "A-text", ["img"]));
    expect(await reopened.save()).toMatchObject({ status: "saved" });
    expect(await (await readImage(db.persistence, "img"))?.text()).toBe("X");
  });

  it("바인딩 없고 저장소 key의 레코드가 코어 이미지가 아님 → image-missing · 제출 0", async () => {
    const db = harnessDb();
    await db.persistence.write([{ type: "put", store: "images", record: { schemaVersion: 1, kind: "other", id: "img-f", data: {} } }]);
    const core = await open(db.persistence);
    core.edit(docOf(1, "F", ["img-f"]));
    expect(await core.save()).toMatchObject({ status: "failed", reason: "image-missing" });
    expect(db.ops.length).toBe(1);
  });
});

describe("H6-3 같은 영속·같은 프로젝트의 세대 읽기~쓰기는 코어 간 직렬(CE-3a)", () => {
  it("한 탭 코어 2개가 gate 공유 · 동시 save → 하나 saved · 다른 하나 stale · 먼저 커밋 보존", async () => {
    const db = harnessDb();
    const gate = createWriterGate(createLockRegistry().tab(), async () => true);
    const writer: WriterCheck = { mode: () => gate.enter() };
    const seed = await open(db.persistence, writer);
    seed.edit(docOf(1, "A"));
    await seed.save();
    const c1 = await open(db.persistence, writer);
    const c2 = await open(db.persistence, writer);
    c1.edit(docOf(2, "c1"));
    c2.edit(docOf(2, "c2"));
    const [r1, r2] = await Promise.all([c1.save(), c2.save()]);
    expect([r1.status, r2.status]).toEqual(["saved", "failed"]);
    expect(r2).toMatchObject({ reason: "stale" });
    expect(await readStored(db.persistence, P)).toMatchObject({ doc: { body: "c1" }, generation: 2 });
  });

  it("회귀: 한 코어 연속 save 3회 = 세대 1·2·3 · 같은 gate로 다시 연 코어 save saved · 쓰기 실패 뒤 다른 코어 진입 가능", async () => {
    const db = harnessDb();
    const gate = createWriterGate(createLockRegistry().tab(), async () => true);
    const writer: WriterCheck = { mode: () => gate.enter() };
    const core = await open(db.persistence, writer);
    const runs = [1, 2, 3].map((n) => (core.edit(docOf(n, `v${n}`)), core.save()));
    expect((await Promise.all(runs)).map((r) => (r.status === "saved" ? r.receipt.generation : r.reason))).toEqual([1, 2, 3]);
    db.failAt(4, "AbortError");
    core.edit(docOf(4, "v4"));
    expect(await core.save()).toMatchObject({ status: "failed" });
    const again = await open(db.persistence, writer);
    again.edit(docOf(5, "v5"));
    expect(await again.save()).toMatchObject({ status: "saved", receipt: { generation: 4 } });
  });
});

describe("H6-4 confirm wrote:true는 쓰기 resolve를 믿지 않고 재읽기로 증명(M8·M9)", () => {
  it("어댑터가 반영 없이 resolve(거짓 성공) → confirm failed{not-committed}", async () => {
    const { persistence } = falseSuccessDb(1, "drop");
    const core = await open(persistence);
    core.edit(A, new Map([["img", blobOf("X")]]));
    expect(await core.confirm()).toMatchObject({ status: "failed", reason: "not-committed" });
  });

  it("어댑터가 이미지 op만 빠뜨리고 resolve → confirm failed{not-committed}", async () => {
    const { db, persistence } = falseSuccessDb(1, "no-images");
    const core = await open(persistence);
    core.edit(A, new Map([["img", blobOf("X")]]));
    expect(await core.confirm()).toMatchObject({ status: "failed", reason: "not-committed" });
    expect((await readStored(db.persistence, P))?.doc.body).toBe("A");
  });
});
