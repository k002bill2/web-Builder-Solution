/**
 * RS6-L1 CP3 — 하네스 h5·h6(discard·replace·lease, CE-1·CX-3) + 포트 mode = gate·cleared 결합(h2-69·h4 제품판 — 실제 두 탭 fakeLocks)
 * + RS6-AC-U10(cleared 직전 진행 중 save → 이후 쓰기 0).
 */
import { describe, expect, it, vi } from "vitest";
import { createLinkNetwork } from "../../../data/persistence/fakeTabLink";
import { createLockRegistry } from "../../../data/persistence/fakeLocks";
import { imageRecordId } from "../../../data/persistence/imageRecord";
import { createSaveCore, type CoreLink, type SaveCore } from "./saveCore";
import { PROJECT, bindOf, confirmOf, edited, image, otherTab, startedRig, ticks, uuid, withImage } from "./testRig";

const discardOf = (core: SaveCore) => core.link((io, s, link) => io.discard(s, link));
const replaceOf = (core: SaveCore, ...args: Parameters<CoreLink["io"]["replace"]> extends [unknown, ...infer R] ? R : never) => core.link((io, s) => io.replace(s, ...args));

describe("RS6-L1 CP3 · h5 discard", () => {
  it("h5-1 저장 진행 중 discard → rejected{inflight} · 초안 그대로 · 완료 뒤 B 커밋", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const gate = db.hold();
    c.edit(edited(doc, "B"));
    const saving = c.save();
    expect(await discardOf(c)).toEqual({ status: "rejected", reason: "inflight" });
    gate.release();
    expect(await saving).toMatchObject({ status: "saved" });
    expect((await db.doc())?.doc.meta.title).toBe("B");
  });

  it("h5-2 커밋 안 된 초안(quota) discard → IDB 재읽기로 저장 상태 복귀 · 뒤 confirm에 폐기 초안 부활 0", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "폐기"));
    db.failNext("QuotaExceededError");
    expect(await c.save()).toMatchObject({ status: "failed" });
    expect(await discardOf(c)).toMatchObject({ status: "discarded", restored: { proof: "fresh", revision: doc.revision } });
    expect([c.view().doc.meta.title, c.view().dirty, c.view().epoch]).toEqual([doc.meta.title, false, 1]);
    const start = db.ops.length;
    expect(await confirmOf(c)).toMatchObject({ status: "confirmed", wrote: false });
    expect(db.since(start)).toEqual([]);
  });

  it("h5-3 discard 읽기 중 편집 C → blocked{newer} · C 보존", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "B"));
    const read = db.holdRead();
    const discarding = discardOf(c);
    await read.reached;
    c.edit(edited(doc, "C"));
    read.release();
    expect(await discarding).toEqual({ status: "blocked", reason: "newer" });
    expect([c.view().doc.meta.title, c.view().dirty]).toEqual(["C", true]);
  });

  it("h6-1 discard 읽기 중 save = failed{discarding} · 쓰기 0 · 두 번째 discard·dirty confirm 거절 · 끝난 뒤 save 정상", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "B"));
    const read = db.holdRead();
    const discarding = discardOf(c);
    await read.reached;
    const start = db.ops.length;
    expect(await c.save()).toEqual({ status: "failed", reason: "discarding", newer: false });
    expect(await discardOf(c)).toEqual({ status: "rejected", reason: "discarding" });
    expect(await confirmOf(c)).toEqual({ status: "failed", reason: "discarding" });
    expect(db.since(start)).toEqual([]);
    read.release();
    expect(await discarding).toMatchObject({ status: "discarded" });
    c.edit(edited(doc, "D"));
    expect(await c.save()).toMatchObject({ status: "saved" });
  });

  it("h6-3 discard 읽기 throw → reject · 가드 해제(finally) → 다음 save saved", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "B"));
    db.failRead();
    await expect(discardOf(c)).rejects.toBeDefined();
    expect(await c.save()).toMatchObject({ status: "saved" });
  });

  it("h6-5 discard 중 edit·replace 수용 → blocked{newer} · 바인딩 보존", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    const read = db.holdRead();
    const discarding = discardOf(c);
    await read.reached;
    c.edit(next, bindOf(next, uuid(1)));
    read.release();
    expect(await discarding).toEqual({ status: "blocked", reason: "newer" });
    expect(c.view().images[uuid(1)]).toBeDefined();
  });

  it("h6-7 CX-3 순차 discard → 바인딩 = 커밋된 X · 다음 save에 폐기 Blob Y 안 붙음", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    const x = bindOf(next, uuid(1), image(800));
    c.edit(next, x);
    expect(await c.save()).toMatchObject({ status: "saved" });
    c.edit(edited(next, "Y"), bindOf(next, uuid(1), image(1200)));
    expect(await discardOf(c)).toMatchObject({ status: "discarded" });
    expect(c.view().images[uuid(1)]?.blob).toBe(x[uuid(1)]?.blob);
    c.edit(edited(next, "Z"));
    expect(await c.save()).toMatchObject({ status: "saved" });
    expect(((await db.persistence.get("images", imageRecordId(PROJECT, uuid(1)))) as { data: { width: number } }).data.width).toBe(800);
  });

  it("h6-8 커밋 없는 코어(seed)의 discard → 폐기 Blob 제거(바인딩 = 마지막 커밋에 실린 것뿐)", async () => {
    const { core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    c.edit(next, bindOf(next, uuid(1)));
    expect(await discardOf(c)).toMatchObject({ status: "discarded" });
    expect(c.view().images).toEqual({});
    expect(c.view().doc.hash).toBe(doc.hash);
  });
});

describe("RS6-L1 CP3 · h5 replace · lease · start", () => {
  it("h5-5 replace: intent 없음·epoch 불일치·dirty·진행 중 거절 · 성공 = epoch+1 · 옛 완료가 교체 초안을 덮지 않음", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const theirs = edited(doc, "교체");
    expect(await replaceOf(c, theirs, {})).toEqual({ status: "rejected", reason: "intent-required" });
    expect(await replaceOf(c, theirs, { intent: "replace", expectedEpoch: 9 })).toEqual({ status: "rejected", reason: "epoch" });
    c.edit(edited(doc, "미저장"));
    expect(await replaceOf(c, theirs, { intent: "replace", expectedEpoch: 0 })).toEqual({ status: "rejected", reason: "dirty" });
    const gate = db.hold();
    const saving = c.save();
    await ticks();
    expect(await replaceOf(c, theirs, { intent: "replace", expectedEpoch: 0 })).toEqual({ status: "rejected", reason: "inflight" });
    gate.release();
    await saving;
    expect(await replaceOf(c, theirs, { intent: "replace", expectedEpoch: 0 })).toEqual({ status: "replaced", epoch: 1 });
    expect([c.view().doc.meta.title, c.view().dirty]).toEqual(["교체", true]);
  });

  it("h5-6 confirm은 starter 호출 0 · retryStart만 1회", async () => {
    const starter = vi.fn(async () => undefined);
    const { doc } = await startedRig();
    const c = createSaveCore(doc, async () => ({ projectId: PROJECT, port: undefined, now: () => "", book: (d) => d, align: () => undefined, io: (await import("./coreIo")).coreIo }), starter);
    await c.link((io, s, link) => io.confirm(s, link, c.save));
    expect(starter).not.toHaveBeenCalled();
    await c.retryStart();
    expect(starter).toHaveBeenCalledTimes(1);
  });

  it("h5-7 lease: 같은 mountId = 같은 토큰(StrictMode) · release 뒤 = 새 토큰", async () => {
    const { core } = await startedRig();
    const c = core();
    const token = c.acquire("m1");
    expect(c.acquire("m1")).toBe(token);
    c.release(token);
    expect(c.acquire("m1")).not.toBe(token);
  });
});

describe("RS6-L1 CP3 · 포트 mode = gate·cleared (실제 두 탭)", () => {
  it("h4 제품판 — 다른 탭이 writer: readonly · 쓰기 0 → writer 탭 닫힘 뒤 다시 저장 = writer · locks 없음 = unsupported", async () => {
    const locks = createLockRegistry();
    const a = locks.tab();
    const { db } = await startedRig({ locks: a });
    const b = await otherTab(db, { locks: locks.tab() });
    b.core.edit(edited(b.seed, "B"));
    const start = db.ops.length;
    expect(await b.core.save()).toMatchObject({ status: "failed", reason: "readonly" });
    expect(await confirmOf(b.core)).toMatchObject({ status: "failed", reason: "readonly" });
    expect(db.since(start)).toEqual([]);
    a.close();
    expect(await b.core.save()).toMatchObject({ status: "saved" });
    const u = await otherTab(db, { locks: null });
    expect(await confirmOf(u.core)).toEqual({ status: "failed", reason: "unsupported" });
  });

  it("h4-4 제품판 — 다른 탭이 진입 뒤 썼으면 잠금을 잡아도 stale · 덮어쓰기 0", async () => {
    const locks = createLockRegistry();
    const a = locks.tab();
    const { db, core, doc } = await startedRig({ locks: a });
    const b = await otherTab(db, { locks: locks.tab() });
    core().edit(edited(doc, "A"));
    expect(await core().save()).toMatchObject({ status: "saved" });
    a.close();
    b.core.edit(edited(b.seed, "B"));
    expect(await b.core.save()).toMatchObject({ status: "failed", reason: "stale" });
    expect((await db.doc())?.doc.meta.title).toBe("A");
  });

  it("RS6-AC-U10 cleared 직전 진행 중 save → 이후 코어 쓰기 0 · 다음 save failed{cleared}", async () => {
    const net = createLinkNetwork();
    const { db, core, doc } = await startedRig({ link: net.tab() });
    const other = net.tab();
    const c = core();
    const gate = db.hold();
    c.edit(edited(doc, "A"));
    const a = c.save();
    await ticks();
    c.edit(edited(doc, "B"));
    const b = c.save();
    const start = db.ops.length;
    other.post({ type: "cleared" });
    await ticks();
    gate.release();
    await a;
    expect(await b).toMatchObject({ status: "failed", reason: "cleared" });
    expect(db.since(start)).toEqual([]);
  });
});
