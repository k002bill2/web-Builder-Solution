/** H2 — 디바운스 전 편집(동기 등록) → confirm. 결과 receipt는 IDB 재읽기와 대조. 메모리 폴백·unsupported는 영속 confirmed 0. */
import { describe, expect, it } from "vitest";
import { createWriterGate } from "../../../../app/src/data/persistence/writerLock";
import { hashOf, openSaveCore, readImage, readStored } from "../core/saveCore";
import { blobOf, docOf, harnessDb, until, writerAlways } from "./helpers";

const P = "p1";
const A = docOf(1, "A");
const B = docOf(2, "B", ["img-b"]);
const C = docOf(3, "C");

async function savedA() {
  const db = harnessDb();
  const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
  core.edit(A);
  await core.save();
  return { db, core };
}

describe("H2 confirm은 최신 초안을 커밋하거나 명시적으로 실패한다", () => {
  it("A 저장 진행 중 B 편집 → confirm: receipt = B(문서 hash·이미지 id·세대)이고 IDB 재읽기와 일치", async () => {
    const { db, core } = await savedA();
    core.edit(docOf(2, "A2"));
    const gate = db.hold(2);
    const pending = core.save();
    await until(() => db.seen.includes(2));
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]])); // 디바운스 전(스케줄러 publish 없음) — 코어에 동기 등록
    const confirming = core.confirm();
    gate.release();
    await pending;
    const result = await confirming;
    const stored = await readStored(db.persistence, P);
    expect(result).toMatchObject({ status: "confirmed", wrote: true, receipt: { hash: hashOf(B), imageIds: ["img-b"] } });
    if (result.status !== "confirmed") throw new Error("unreachable");
    expect(stored).toMatchObject({ hash: result.receipt.hash, generation: result.receipt.generation });
    expect(await (await readImage(db.persistence, "img-b"))?.text()).toBe("bytes-B");
    expect(core.view()).toMatchObject({ dirty: false, confirmed: result.receipt });
  });

  it("confirm 진행 중(커밋 전) 편집 C → confirmed 아님: status newer · receipt=B · C는 dirty", async () => {
    const { db, core } = await savedA();
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    const gate = db.hold(2);
    const confirming = core.confirm();
    await until(() => db.seen.includes(2));
    core.edit(C);
    gate.release();
    const result = await confirming;
    expect(result).toMatchObject({ status: "newer", receipt: { hash: hashOf(B) } });
    expect(core.view()).toMatchObject({ dirty: true, confirmed: { hash: hashOf(B) } });
  });

  it("메모리 폴백(영속 없음): save·confirm 모두 failed{not-persistent} · view.confirmed 없음", async () => {
    const core = await openSaveCore({ projectId: P, persistence: undefined, writer: writerAlways, initial: docOf(0, "seed") });
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(await core.save()).toMatchObject({ status: "failed", reason: "not-persistent" });
    expect(await core.confirm()).toMatchObject({ status: "failed", reason: "not-persistent" });
    expect(core.view()).toMatchObject({ dirty: true, confirmed: undefined });
  });

  it("unsupported(navigator.locks 없음 — 제품 createWriterGate(undefined)): confirm failed · 쓰기 0", async () => {
    const db = harnessDb();
    const gate = createWriterGate(undefined, async () => true);
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: { mode: () => gate.enter() }, initial: docOf(0, "seed") });
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(await core.confirm()).toMatchObject({ status: "failed", reason: "unsupported" });
    expect(db.seen).toEqual([]);
    expect(core.view()).toMatchObject({ dirty: true, confirmed: undefined });
  });
});
