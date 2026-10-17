/**
 * RS6-L1 CP1 — 하네스 h1·h2(+h4-2·h6 M8) 의미를 제품 포트 위에서(코어 + LocalSync 포트 + createMemoryPersistence).
 * 제출 mark 고정(I1) · 직렬(I2) · confirm wrote:true = 재읽기 증명(I3) · wrote:false = writer + 재읽기(I4) · 레지스트리 = 저장소 인스턴스(2.2-2).
 */
import { describe, expect, it } from "vitest";
import { hashDoc } from "../../../engine/ops/hash";
import { confirmOf, edited, startedRig, ticks } from "./testRig";

describe("RS6-L1 CP1 · 레지스트리(2.2-2)", () => {
  it("같은 projectId = 같은 코어(동기 생성) · 저장소 인스턴스마다 따로(모듈 전역 0)", async () => {
    const a = await startedRig();
    const b = await startedRig();
    expect(a.core()).toBe(a.core());
    expect(a.core()).not.toBe(b.core());
    expect(a.core().view().doc).toBe(a.doc);
  });
});

describe("RS6-L1 CP1 · h1 제출 mark 고정 · 직렬", () => {
  it("h1-1 커밋 전 편집 B → A 완료 newer · B dirty · IDB = A → 다시 저장으로 B 영속", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const gate = db.hold();
    c.edit(edited(doc, "A"));
    const first = c.save();
    await ticks();
    c.edit(edited(doc, "B"));
    gate.release();
    const result = await first;
    expect(result).toMatchObject({ status: "saved", newer: true });
    expect(c.view().dirty).toBe(true);
    expect((await db.doc())?.doc.meta.title).toBe("A");
    expect(c.view().confirmed).toMatchObject({ hash: hashDoc(edited(doc, "A")), revision: doc.revision + 1, proof: "committed" });
    expect(await c.save()).toMatchObject({ status: "saved", newer: false });
    expect((await db.doc())?.doc.meta.title).toBe("B");
    expect(c.view().dirty).toBe(false);
  });

  it("h1-2 커밋 뒤 편집 B → A 완료 newer=false · B dirty", async () => {
    const { core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "A"));
    expect(await c.save()).toMatchObject({ status: "saved", newer: false });
    c.edit(edited(doc, "B"));
    expect(c.view().dirty).toBe(true);
    expect(c.view().confirmed?.revision).toBe(doc.revision + 1);
  });

  it("h1-3 A 커밋 보류 중 B 저장 → 직렬: A 다음 B · IDB·confirmed = B", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const gate = db.hold();
    c.edit(edited(doc, "A"));
    const a = c.save();
    c.edit(edited(doc, "B"));
    const b = c.save();
    await ticks();
    gate.release();
    expect(await a).toMatchObject({ status: "saved", receipt: { revision: doc.revision + 1 } });
    expect(await b).toMatchObject({ status: "saved", receipt: { revision: doc.revision + 2, hash: hashDoc(edited(doc, "B")) } });
    const stored = await db.doc();
    expect([stored?.doc.meta.title, stored?.doc.revision]).toEqual(["B", doc.revision + 2]);
    expect(c.view().confirmed?.revision).toBe(doc.revision + 2);
  });
});

describe("RS6-L1 CP1 · h2 confirm 증명", () => {
  it("h2-1 A 진행 중 B 편집 → confirm receipt = B · IDB 재읽기와 같음", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const gate = db.hold();
    c.edit(edited(doc, "A"));
    void c.save();
    c.edit(edited(doc, "B"));
    const confirmed = confirmOf(c);
    await ticks();
    gate.release();
    const result = await confirmed;
    expect(result).toMatchObject({ status: "confirmed", wrote: true, receipt: { hash: hashDoc(edited(doc, "B")) } });
    expect((await db.doc())?.doc.hash).toBe(hashDoc(edited(doc, "B")));
  });

  it("h2-2 confirm 진행 중(커밋 전) 편집 C → newer · receipt = B · C dirty", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const gate = db.hold();
    c.edit(edited(doc, "B"));
    const confirmed = confirmOf(c);
    await ticks();
    c.edit(edited(doc, "C"));
    gate.release();
    expect(await confirmed).toMatchObject({ status: "newer", receipt: { hash: hashDoc(edited(doc, "B")) } });
    expect(c.view().dirty).toBe(true);
  });

  it("h2-3 wrote:false 확인 진행 중 편집 → newer · 편집 dirty", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const read = db.holdRead();
    const confirmed = confirmOf(c);
    await read.reached;
    c.edit(edited(doc, "C"));
    read.release();
    expect(await confirmed).toMatchObject({ status: "newer" });
    expect(c.view().dirty).toBe(true);
  });

  it("h4-2 · C5 T10 시드 확인 = writer + IDB 재읽기 → wrote:false proof fresh · 쓰기 0", async () => {
    const { db, core } = await startedRig();
    const c = core();
    const start = db.ops.length;
    expect(await confirmOf(c)).toMatchObject({ status: "confirmed", wrote: false, receipt: { proof: "fresh" } });
    expect(db.since(start)).toEqual([]);
    expect(c.view().confirmed?.proof).toBe("hydrated");
  });

  it("C5 T13 저장 뒤 같은 내용 재확인 = 쓰기 0 · proof fresh(직전 증명 재사용 0)", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "A"));
    expect(await confirmOf(c)).toMatchObject({ status: "confirmed", wrote: true, receipt: { proof: "committed" } });
    const start = db.ops.length;
    expect(await confirmOf(c)).toMatchObject({ status: "confirmed", wrote: false, receipt: { proof: "fresh", revision: doc.revision + 1 } });
    expect(db.since(start)).toEqual([]);
  });

  it("h6 M8 어댑터 거짓 성공(반영 없이 resolve) → confirm failed{not-committed}", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    db.dropNext();
    c.edit(edited(doc, "A"));
    expect(await confirmOf(c)).toEqual({ status: "failed", reason: "not-committed" });
    expect((await db.doc())?.doc.revision).toBe(doc.revision);
  });

  it("포트 쓰기 레코드 = 제품 kind:doc + 도장(두 번째 레코드 형식 0 · I6 6.1)", async () => {
    const { db, core, doc } = await startedRig();
    core().edit(edited(doc, "A"));
    const start = db.ops.length;
    await core().save();
    const puts = db.since(start).flat().flatMap((op) => (op.type === "put" ? [`${op.store}:${op.record.kind}`] : []));
    expect(puts).toEqual(["docs:doc", "studio:state", "meta:generation"]);
  });
});
