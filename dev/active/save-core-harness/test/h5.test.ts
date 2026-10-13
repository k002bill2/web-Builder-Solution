/** H5 — replace/discard × inflight · 폐기 초안 부활 0 · start 재시도와 confirm 분리 · lease 멱등(StrictMode 이중 mount). */
import { describe, expect, it, vi } from "vitest";
import { hashOf, openSaveCore, readStored } from "../core/saveCore";
import { blobOf, docOf, harnessDb, until, writerAlways } from "./helpers";

const P = "p1";
const A = docOf(1, "A");
const B = docOf(2, "B", ["img-b"]);
const R = docOf(5, "restart");

async function savedA() {
  const db = harnessDb();
  const starter = vi.fn(async () => undefined);
  const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed"), starter });
  core.edit(A);
  await core.save(); // 세대 1
  return { db, core, starter };
}

describe("H5 replace/discard와 진행 중 저장", () => {
  it("저장 진행 중 discard → rejected{inflight} · 초안 그대로 · 완료 뒤 B 커밋", async () => {
    const { db, core } = await savedA();
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    const gate = db.hold(2);
    const pending = core.save();
    await until(() => db.seen.includes(2));
    expect(await core.discard()).toMatchObject({ status: "rejected", reason: "inflight" });
    expect(core.view().doc).toEqual(B);
    gate.release();
    expect(await pending).toMatchObject({ status: "saved", receipt: { hash: hashOf(B) } });
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(B));
  });

  it("커밋 안 된 초안(quota 실패) discard → IDB 재읽기로 저장 상태 A 복귀 증명 · 이후 confirm에 폐기 초안 부활 0", async () => {
    const { db, core } = await savedA();
    db.failAt(2, "QuotaExceededError");
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(await core.save()).toMatchObject({ status: "failed" });
    const result = await core.discard();
    expect(result).toMatchObject({ status: "discarded", restored: { hash: hashOf(A), generation: 1, proof: "fresh" } });
    expect(core.view()).toMatchObject({ doc: A, dirty: false });
    expect(await core.confirm()).toMatchObject({ status: "confirmed", wrote: false, receipt: { hash: hashOf(A) } });
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(A));
  });

  it("복귀 근거 없음(다른 탭이 세대 2 기록) → discard blocked{stale} · 초안 보존", async () => {
    const { db, core } = await savedA();
    const other = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    other.edit(docOf(2, "other"));
    await other.save();
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(await core.discard()).toMatchObject({ status: "blocked", reason: "stale" });
    expect(core.view()).toMatchObject({ doc: B, dirty: true });
  });

  it("replace: dirty 미저장이면 conflict · intent 없음/epoch 불일치 거절 · 진행 중 거절 · 옛 완료가 교체 초안을 덮지 않음", async () => {
    const { db, core } = await savedA();
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(core.replace(R, { intent: "replace", expectedEpoch: 0 })).toMatchObject({ status: "rejected", reason: "dirty" });
    expect(core.view().doc).toEqual(B);
    const gate = db.hold(2);
    const pending = core.save();
    await until(() => db.seen.includes(2));
    expect(core.replace(R, { intent: "replace", expectedEpoch: 0 })).toMatchObject({ status: "rejected", reason: "inflight" });
    gate.release();
    await pending;
    expect(core.replace(R, {})).toMatchObject({ status: "rejected", reason: "intent-required" });
    expect(core.replace(R, { intent: "replace", expectedEpoch: 7 })).toMatchObject({ status: "rejected", reason: "epoch" });
    expect(core.replace(R, { intent: "replace", expectedEpoch: 0 })).toMatchObject({ status: "replaced", epoch: 1 });
    expect(core.view()).toMatchObject({ doc: R, dirty: true, epoch: 1, confirmed: { hash: hashOf(B) } });
    expect(await core.confirm()).toMatchObject({ status: "confirmed", wrote: true, receipt: { hash: hashOf(R) } });
  });

  it("confirm은 start(문서 생성) 호출 0 · retryStart는 명시 호출에서만", async () => {
    const { core, starter } = await savedA();
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    await core.confirm();
    await core.confirm();
    expect(starter).toHaveBeenCalledTimes(0);
    await core.retryStart();
    expect(starter).toHaveBeenCalledTimes(1);
  });

  it("lease: 같은 mountId 재acquire(StrictMode 이중 effect) = 같은 토큰 · release 뒤 acquire = 새 토큰", async () => {
    const { core } = await savedA();
    const first = core.acquire("mount-1");
    expect(core.acquire("mount-1")).toBe(first);
    core.release(first);
    expect(core.acquire("mount-1")).not.toBe(first);
  });
});
