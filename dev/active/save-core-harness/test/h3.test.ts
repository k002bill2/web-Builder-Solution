/** H3 — 새 이미지 + 쓰기 거절/트랜잭션 실패 → detach → 재시도. 문서·이미지는 한 트랜잭션(함께 실패·함께 성공). 리로드 = 같은 영속 위 새 코어. */
import { describe, expect, it } from "vitest";
import { createLockRegistry } from "../../../../app/src/data/persistence/fakeLocks";
import { WRITER_LOCK, createWriterGate } from "../../../../app/src/data/persistence/writerLock";
import { hashOf, openSaveCore, readImage, readStored } from "../core/saveCore";
import { blobOf, deferred, docOf, harnessDb, writerAlways } from "./helpers";

const P = "p1";
const B = docOf(2, "B", ["img-b"]);
const onlyDocAndImagePuts = (ops: readonly (readonly { type: string; store: string }[])[]) =>
  ops.flat().every((op) => op.type === "put" && (op.store === "docs" || op.store === "images"));

describe("H3 이미지 바인딩·원자 실패·재시도", () => {
  it("다른 탭이 잠금 보유(readonly 거절) → detach → 잠금 해제 → 재시도: 바인딩 동결 보존 · 리로드 Blob 일치 · delete op 0", async () => {
    const db = harnessDb();
    const browser = createLockRegistry();
    const other = browser.tab();
    const held = deferred();
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => held.promise);
    const gate = createWriterGate(browser.tab(), async () => true);
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: { mode: () => gate.enter() }, initial: docOf(0, "seed") });
    const editorMap = new Map([["img-b", blobOf("bytes-B")]]);
    const view = core.attach();
    core.edit(B, editorMap);
    editorMap.clear(); // 편집기 쪽 맵 변경은 코어 바인딩에 영향 없음(동결)
    expect(await core.save()).toMatchObject({ status: "failed", reason: "readonly" });
    expect(db.seen).toEqual([]);
    view.detach();
    held.release();
    await new Promise((r) => setTimeout(r, 0));
    expect(await core.confirm()).toMatchObject({ status: "confirmed", wrote: true, receipt: { hash: hashOf(B), imageIds: ["img-b"] } });
    expect(onlyDocAndImagePuts(db.ops)).toBe(true);
    const reloaded = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    expect(reloaded.view().doc).toEqual(B);
    expect(await (await readImage(db.persistence, "img-b"))?.text()).toBe("bytes-B");
  });

  it("quota 실패: 문서·이미지 둘 다 0 → 같은 코어 재시도 성공: 둘 다 있음", async () => {
    const db = harnessDb();
    db.failAt(1, "QuotaExceededError");
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(await core.save()).toMatchObject({ status: "failed" });
    expect(await readStored(db.persistence, P)).toBeUndefined();
    expect(await readImage(db.persistence, "img-b")).toBeUndefined();
    expect(core.view()).toMatchObject({ dirty: true, confirmed: undefined });
    expect(await core.save()).toMatchObject({ status: "saved", receipt: { hash: hashOf(B) } });
    expect((await readStored(db.persistence, P))?.hash).toBe(hashOf(B));
    expect(await (await readImage(db.persistence, "img-b"))?.text()).toBe("bytes-B");
  });

  it("transaction abort(confirm 경로): failed → detach → confirm 재시도 confirmed · 문서/이미지 함께", async () => {
    const db = harnessDb();
    db.failAt(1, "AbortError");
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    const view = core.attach();
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(await core.confirm()).toMatchObject({ status: "failed" });
    expect([await readStored(db.persistence, P), await readImage(db.persistence, "img-b")]).toEqual([undefined, undefined]);
    view.detach();
    expect(await core.confirm()).toMatchObject({ status: "confirmed", wrote: true });
    expect(await (await readImage(db.persistence, "img-b"))?.text()).toBe("bytes-B");
  });

  it("부족 이미지(바인딩·IDB 모두 없음) → 제출 0 · image-missing / 리로드 뒤 IDB에 있는 이미지는 바인딩 없이 저장 가능", async () => {
    const db = harnessDb();
    const core = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    core.edit(docOf(1, "X", ["img-x"]));
    expect(await core.confirm()).toMatchObject({ status: "failed", reason: "image-missing" });
    expect(db.seen).toEqual([]);
    core.edit(B, new Map([["img-b", blobOf("bytes-B")]]));
    expect(await core.save()).toMatchObject({ status: "saved" });
    const reloaded = await openSaveCore({ projectId: P, persistence: db.persistence, writer: writerAlways, initial: docOf(0, "seed") });
    const text = docOf(3, "B-text", ["img-b"]);
    reloaded.edit(text);
    expect(await reloaded.confirm()).toMatchObject({ status: "confirmed", wrote: true, receipt: { hash: hashOf(text), imageIds: ["img-b"] } });
    expect(await (await readImage(db.persistence, "img-b"))?.text()).toBe("bytes-B");
  });
});
