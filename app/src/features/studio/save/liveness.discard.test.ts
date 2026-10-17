/**
 * RS6-L2 CP2 — LV-2 discard 포기 토큰(RS6-AC-U5 · MC I7 변경) + L1 QA note 1(discard 호출 뒤 connect 전 편집 = blocked{newer}).
 * 장치 준비(앱 흐름)는 실제 타이머, discard부터 가짜 타이머(시간 = 상수 참조).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { DISCARD_GIVE_UP_MS } from "./coreIo";
import { bindOf, confirmOf, edited, startedRig, ticks, uuid, withImage } from "./testRig";

afterEach(() => vi.useRealTimers());

/** A 저장(커밋) → B 편집(미저장) 상태의 코어 */
async function savedThenEdited() {
  const rig = await startedRig();
  const c = rig.core();
  c.edit(edited(rig.doc, "A"));
  expect(await c.save()).toMatchObject({ status: "saved" });
  c.edit(edited(rig.doc, "B"));
  return { ...rig, c };
}

describe("RS6-L2 CP2 · LV-2 포기 토큰", () => {
  it("U5 discard 읽기 정지 → T_discard 뒤 blocked{timeout} · 가드 해제(save 정상) · 늦은 결과 버림(doc·바인딩·dirty·epoch 불변)", async () => {
    const { db, c, doc } = await savedThenEdited();
    const next = withImage(edited(doc, "B"), uuid(1));
    const bound = bindOf(next, uuid(1));
    c.edit(next, bound);
    const read = db.holdRead("docs");
    vi.useFakeTimers();
    const discarding = c.discard();
    await read.reached;
    await vi.advanceTimersByTimeAsync(DISCARD_GIVE_UP_MS - 1);
    let settled = false;
    void discarding.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(0);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await discarding).toEqual({ status: "blocked", reason: "timeout" });
    const before = c.view();
    expect([before.doc.meta.title, before.dirty, before.epoch]).toEqual(["B", true, 0]);
    // 늦은 읽기 결과 = 버림
    read.release();
    await vi.advanceTimersByTimeAsync(0);
    vi.useRealTimers();
    await ticks();
    const after = c.view();
    expect([after.doc, after.images, after.dirty, after.epoch, after.mark]).toEqual([before.doc, before.images, true, 0, before.mark]);
    // 가드 해제 — 다음 save는 discarding 거절 없이 커밋
    expect(await c.save()).toMatchObject({ status: "saved" });
    expect((await db.doc())?.doc.meta.title).toBe("B");
  });

  it("U5 포기 뒤 save(discarding 아님) · 늦은 읽기 reject도 삼킴(unhandled 0)", async () => {
    const { db, c } = await savedThenEdited();
    const read = db.holdRead("docs");
    vi.useFakeTimers();
    const discarding = c.discard();
    await read.reached;
    await vi.advanceTimersByTimeAsync(DISCARD_GIVE_UP_MS);
    expect(await discarding).toEqual({ status: "blocked", reason: "timeout" });
    vi.useRealTimers();
    db.failRead();
    read.release();
    await ticks();
    expect(await c.save()).toMatchObject({ status: "saved" });
  });

  it("U5 포기한 discard #1의 늦은 끝이 discard #2의 배타를 풀지 않는다(토큰)", async () => {
    const { db, c } = await savedThenEdited();
    const first = db.holdRead("docs");
    vi.useFakeTimers();
    const d1 = c.discard();
    await first.reached;
    await vi.advanceTimersByTimeAsync(DISCARD_GIVE_UP_MS);
    expect(await d1).toEqual({ status: "blocked", reason: "timeout" });
    vi.useRealTimers();
    const second = db.holdRead("docs");
    const d2 = c.discard();
    // #1 늦은 읽기 끝 — #2 진행 중
    first.release();
    await second.reached;
    await ticks();
    expect(await c.save()).toEqual({ status: "failed", reason: "discarding", newer: false });
    second.release();
    expect(await d2).toMatchObject({ status: "discarded" });
    expect([c.view().doc.meta.title, c.view().dirty, c.view().epoch]).toEqual(["A", false, 1]);
  });

  it("T_discard 안에 끝난 discard = 지금 결과 그대로 · 뒤 타이머 발화 0(epoch 1회)", async () => {
    const { c } = await savedThenEdited();
    expect(await c.discard()).toMatchObject({ status: "discarded" });
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(DISCARD_GIVE_UP_MS * 2);
    vi.useRealTimers();
    expect([c.view().doc.meta.title, c.view().dirty, c.view().epoch]).toEqual(["A", false, 1]);
    expect(await confirmOf(c)).toMatchObject({ status: "confirmed", wrote: false });
  });
});

describe("RS6-L2 CP2 · L1 QA note 1 — discard 진입 = 호출 시점(connect 전 동기)", () => {
  it("note1 discard 호출 직후(connect 대기 중) 편집 C(save 없음) → blocked{newer} · C 보존 · dirty", async () => {
    const { db, c, doc } = await savedThenEdited();
    const discarding = c.discard();
    c.edit(edited(doc, "C"));
    expect(await discarding).toEqual({ status: "blocked", reason: "newer" });
    expect([c.view().doc.meta.title, c.view().dirty, c.view().epoch]).toEqual(["C", true, 0]);
    expect(await c.save()).toMatchObject({ status: "saved" });
    expect((await db.doc())?.doc.meta.title).toBe("C");
  });

  it("note1 QA 시나리오 A 회귀: discard 호출 직후 save → discard rejected{inflight} · save saved · IDB = B", async () => {
    const { db, c } = await savedThenEdited();
    const discarding = c.discard();
    const saving = c.save();
    expect(await discarding).toEqual({ status: "rejected", reason: "inflight" });
    expect(await saving).toMatchObject({ status: "saved" });
    expect((await db.doc())?.doc.meta.title).toBe("B");
    expect(c.view().doc.meta.title).toBe("B");
  });

  it("#28 보강 · discard 읽기 중 replace 수용 → blocked{newer} · 교체 초안 보존(HARNESS-MAP h6:92)", async () => {
    const { c, doc } = await savedThenEdited();
    expect(await c.save()).toMatchObject({ status: "saved" });
    const discarding = c.discard();
    const replaced = c.link((io, s) => io.replace(s, edited(doc, "교체"), { intent: "replace", expectedEpoch: 0 }));
    expect(await replaced).toEqual({ status: "replaced", epoch: 1 });
    expect(await discarding).toEqual({ status: "blocked", reason: "newer" });
    expect(c.view().doc.meta.title).toBe("교체");
  });

  it("#20 보강 · discard: IDB 재읽기 ≠ 마지막 증명(거짓 성공으로 IDB = 옛 문서) → blocked{stale} · 초안·dirty 보존(HARNESS-MAP h5:58)", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "A"));
    db.dropNext();
    expect(await c.save()).toMatchObject({ status: "saved" });
    c.edit(edited(doc, "B"));
    expect(await c.discard()).toEqual({ status: "blocked", reason: "stale" });
    expect([c.view().doc.meta.title, c.view().dirty, c.view().epoch]).toEqual(["B", true, 0]);
  });
});
