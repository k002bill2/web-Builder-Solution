/** H1 — 저장 A 진행 중 편집 B → POP/cleanup(detach) → A 완료. 커밋 앞뒤는 제품 메모리 영속의 commit 게이트로 제어. */
import { describe, expect, it } from "vitest";
import { hashOf, openSaveCore, readImage, readStored } from "../core/saveCore";
import { blobOf, docOf, harnessDb, until, writerAlways } from "./helpers";

const P = "p1";
const A = docOf(1, "A");
const B = docOf(2, "B", ["img-b"]);

describe("H1 저장 중 편집·cleanup·늦은 완료", () => {
  it("커밋 전 편집 B + detach → A 완료: newer=true · dirty · confirmed=A(≠B) · B 문서/Blob 보존 → 재저장으로 B+Blob 영속", async () => {
    const db = harnessDb();
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    const view = core.attach();
    core.edit(A);
    const gate = db.hold(1);
    const pending = core.save();
    await until(() => db.seen.includes(1)); // 트랜잭션 제출됨 · 커밋 전
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    view.detach(); // POP/cleanup
    gate.release();
    const result = await pending;
    expect(result).toMatchObject({ status: "saved", newer: true, receipt: { hash: hashOf(A) } });
    const v = core.view();
    expect(v.dirty).toBe(true);
    expect(v.confirmed?.hash).toBe(hashOf(A));
    expect(v.doc).toEqual(B);
    expect(await v.blob("img-b")?.text()).toBe("bytes-B");
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(A));
    const again = await core.save();
    expect(again).toMatchObject({ status: "saved", newer: false, receipt: { hash: hashOf(B), imageIds: ["img-b"] } });
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(B));
    expect(await (await readImage(db.persistence, "img-b"))?.text()).toBe("bytes-B");
    expect(core.view().dirty).toBe(false);
  });

  it("커밋 뒤 편집 B: A 완료는 newer=false로 끝났고 B는 dirty로 남는다(confirmed=A)", async () => {
    const db = harnessDb();
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    core.edit(A);
    const gate = db.hold(1);
    const pending = core.save();
    await until(() => db.seen.includes(1));
    gate.release();
    const result = await pending;
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(result).toMatchObject({ status: "saved", newer: false });
    expect(core.view()).toMatchObject({ dirty: true, confirmed: { hash: hashOf(A) } });
  });

  it("늦은 callback: A 커밋 보류 중 B 저장 시작 → A가 나중에 풀려도 IDB·confirmed는 B(세대로 식별)", async () => {
    const db = harnessDb();
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    core.edit(A);
    const gate = db.hold(1);
    const pA = core.save();
    await until(() => db.seen.includes(1));
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    const pB = core.save();
    await new Promise((r) => setTimeout(r, 0));
    gate.release();
    const [rA, rB] = await Promise.all([pA, pB]);
    expect(rA).toMatchObject({ status: "saved", newer: true });
    expect(rB).toMatchObject({ status: "saved", newer: false, receipt: { hash: hashOf(B) } });
    if (rA.status !== "saved" || rB.status !== "saved") throw new Error("unreachable");
    expect(rB.receipt.generation).toBeGreaterThan(rA.receipt.generation);
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(B));
    expect(core.view()).toMatchObject({ dirty: false, confirmed: { hash: hashOf(B), generation: rB.receipt.generation } });
  });
});
