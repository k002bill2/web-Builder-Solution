/**
 * RS6-L1 CP2 — 하네스 h3·h6(이미지·동결) 의미 + I6 5절 G1(문서 필드 = 코어 · 스냅샷 = DocBook · DocBook 경로 재쓰기는 코어 chain 뒤)
 * + RS6-AC-U3·U14·U15. 엄격 이미지 확인은 포트 `commit` 전용(공유 imageOps·flush 경로 변경 0 — I6 12.1 #4).
 */
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "../../../data/persistence/envelope";
import { imageRecordId } from "../../../data/persistence/imageRecord";
import type { WriteOp } from "../../../data/persistence/studioPersistence";
import { PROJECT, bindOf, confirmOf, edited, image, startedRig, ticks, uuid, withImage } from "./testRig";

const imageKeys = (ops: readonly (readonly WriteOp[])[]) => ops.flat().flatMap((op) => (op.store === "images" ? [`${op.type}:${op.type === "put" ? op.record.id : op.id}`] : []));
const KEY = imageRecordId(PROJECT, uuid(1));

describe("RS6-L1 CP2 · h3 이미지 원자 · 엄격 참조", () => {
  it("h3-4 참조 이미지가 바인딩·IDB 둘 다 없음 → failed{image-missing} · 제출 0", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(withImage(doc, uuid(1)));
    const start = db.ops.length;
    expect(await c.save()).toMatchObject({ status: "failed", reason: "image-missing" });
    expect(db.since(start)).toEqual([]);
    expect(c.view().dirty).toBe(true);
  });

  it("h3-2 quota 실패 → 문서·이미지 둘 다 0 → 같은 코어 재시도 = 둘 다 한 트랜잭션", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    c.edit(next, bindOf(next, uuid(1)));
    db.failNext("QuotaExceededError");
    expect(await c.save()).toMatchObject({ status: "failed" });
    expect([(await db.doc())?.doc.revision, await db.persistence.get("images", KEY)]).toEqual([doc.revision, undefined]);
    const start = db.ops.length;
    expect(await c.save()).toMatchObject({ status: "saved" });
    expect(db.since(start)).toHaveLength(1);
    expect(imageKeys(db.since(start))).toEqual([`put:${KEY}`]);
    expect((await db.doc())?.doc.revision).toBe(doc.revision + 1);
  });

  it("h3-4 뒤 절반 · IDB에 이미 있는 이미지는 바인딩 없이 저장 · 새 레지스트리(재열기)도 같음", async () => {
    const { db, core, doc } = await startedRig();
    const next = withImage(doc, uuid(1));
    core().edit(next, bindOf(next, uuid(1)));
    expect(await core().save()).toMatchObject({ status: "saved" });
    core().edit(edited(next, "바인딩 없이"));
    expect(await core().save()).toMatchObject({ status: "saved" });
    expect(await db.persistence.get("images", KEY)).toBeDefined();
  });

  it("h3-3 confirm 경로 abort → failed → confirm 재시도 confirmed · 문서·이미지 함께", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    c.edit(next, bindOf(next, uuid(1)));
    db.failNext("AbortError");
    expect(await confirmOf(c)).toMatchObject({ status: "failed" });
    expect(await confirmOf(c)).toMatchObject({ status: "confirmed", wrote: true });
    expect([(await db.doc())?.doc.hash, (await db.persistence.get("images", KEY)) !== undefined]).toEqual([next.hash, true]);
  });

  it("h6 M9 어댑터가 이미지 op만 빠뜨리고 성공 → confirm failed{not-committed}", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    c.edit(next, bindOf(next, uuid(1)));
    db.dropNext((ops) => ops.filter((op) => op.store !== "images"));
    expect(await confirmOf(c)).toEqual({ status: "failed", reason: "not-committed" });
  });

  it("포트 commit = L4 검증(checkSaveDoc) — 모양 밖 문서는 제출 0(다음 열기 unreadable 방지)", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit({ ...doc, sections: "x" as never });
    const start = db.ops.length;
    expect(await c.save()).toMatchObject({ status: "failed", reason: "schema" });
    expect(db.since(start)).toEqual([]);
  });
});

describe("RS6-L1 CP2 · h6 CE-2 동결", () => {
  it("h6-103 제출 뒤 커밋 대기 중 같은 id 다른 Blob 편집 → 커밋 이미지 = 제출 시점 바인딩", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    c.edit(next, bindOf(next, uuid(1), image(800)));
    const gate = db.hold();
    const saving = c.save();
    await ticks();
    c.edit(edited(next, "Y"), bindOf(next, uuid(1), image(1200)));
    gate.release();
    expect(await saving).toMatchObject({ status: "saved", newer: true });
    expect(((await db.persistence.get("images", KEY)) as { data: { width: number } }).data.width).toBe(800);
  });

  it("h6-125 edit 뒤 호출자가 넘긴 문서 객체의 필드를 바꿔도 코어 초안 불변", async () => {
    const { core, doc } = await startedRig();
    const c = core();
    const mine = { ...edited(doc, "A") };
    c.edit(mine);
    (mine as { meta: unknown }).meta = { ...doc.meta, title: "바뀜" };
    expect(c.view().doc.meta.title).toBe("A");
  });
});

describe("RS6-L1 CP2 · G1 · RS6-AC-U3 · U14 · U15", () => {
  it("U3 저장 실패 → DocBook revision 변화 0 · 성공 → DocBook 문서 = 커밋 문서 그대로(같은 객체)", async () => {
    const { db, repo, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "A"));
    db.failNext("QuotaExceededError");
    expect(await c.save()).toMatchObject({ status: "failed" });
    expect((await repo.getDoc(PROJECT))?.revision).toBe(doc.revision);
    expect(await c.save()).toMatchObject({ status: "saved" });
    const mem = await repo.getDoc(PROJECT);
    expect([mem?.revision, mem?.hash, mem?.meta.title]).toEqual([doc.revision + 1, edited(doc, "A").hash, "A"]);
    expect(mem?.updatedAt).toBe((await db.doc())?.doc.updatedAt);
  });

  const inflight = async (write: (r: Awaited<ReturnType<typeof startedRig>>) => Promise<unknown>) => {
    const rig = await startedRig();
    const { db, repo, core, doc } = rig;
    await repo.createSnapshot(PROJECT, "지울 것");
    const c = core();
    const next = withImage(edited(doc, "N+1"), uuid(1));
    c.edit(next, bindOf(next, uuid(1)));
    const gate = db.hold();
    const saving = c.save();
    await ticks();
    const other = write(rig);
    await ticks();
    gate.release();
    expect(await saving).toMatchObject({ status: "saved" });
    await other;
    await ticks();
    const stored = await db.doc();
    expect([stored?.doc.revision, stored?.doc.hash]).toEqual([doc.revision + 1, next.hash]);
    expect(await db.persistence.get("images", KEY)).toBeDefined();
    expect(imageKeys(db.ops).filter((k) => k.startsWith("delete:"))).toEqual([]);
    return { ...rig, stored };
  };

  it("U14 코어 commit 중 deleteSnapshot → IDB doc = 코어 최신 · 새 이미지 삭제 0 · 스냅샷 삭제 반영", async () => {
    const { stored } = await inflight(async ({ repo }) => {
      const [made] = await repo.listSnapshots(PROJECT);
      await repo.deleteSnapshot(PROJECT, made!.snapshotId);
    });
    expect(stored?.snapshots.filter((s) => s.kind === "manual")).toEqual([]);
  });

  it("U14 코어 commit 중 createSnapshot → IDB doc = 코어 최신 · 새 이미지 삭제 0 · 스냅샷 2개", async () => {
    const { stored } = await inflight(({ repo }) => repo.createSnapshot(PROJECT, "새 것"));
    expect(stored?.snapshots.map((s) => s.name)).toEqual(["지울 것", "새 것"]);
  });

  it("U14 코어 commit 중 confirmDoc → IDB doc = 코어 최신 · 새 이미지 삭제 0", async () => {
    await inflight(({ repo }) => repo.confirmDoc!(PROJECT));
  });

  it("U15 다른 프로젝트의 같은 localId 레코드로는 commit·verify 통과 0", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    const foreign = (data: unknown) => ({ type: "put", store: "images", record: { schemaVersion: SCHEMA_VERSION, kind: "image", id: imageRecordId("project-2", uuid(1)), data } }) as const;
    await db.persistence.write([foreign({ width: 1 })]);
    c.edit(next);
    expect(await c.save()).toMatchObject({ status: "failed", reason: "image-missing" });
    c.edit(next, bindOf(next, uuid(1)));
    expect(await c.save()).toMatchObject({ status: "saved" });
    const record = (await db.persistence.get("images", KEY)) as { data: unknown };
    await db.persistence.write([{ type: "delete", store: "images", id: KEY }, foreign(record.data)]);
    expect(await confirmOf(c)).toEqual({ status: "failed", reason: "stale" });
  });

});
