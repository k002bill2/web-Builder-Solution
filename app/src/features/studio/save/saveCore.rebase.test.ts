/**
 * RS6-L3a CP0(L1 QA note 2 · INTEGRATE-6 6.4 · MQ-6-5 A) — DocBook이 revision을 올리는 쓰기(복원·충돌 해결·restart)와 코어 revision 기준(`confirmed.revision + 1`).
 * 코어가 열린 프로젝트에서 세 경로 뒤 다음 코어 save는 같은 revision으로 덮어쓰지 않는다(정상 다음 revision 또는 STALE).
 * 저장소·코어 층 규칙만 — 화면 호출처(SnapshotPreview·ConflictCallout·restartFlow) 전환은 L3b.
 */
import { describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError } from "../../../data/projectRepository";
import { PROJECT, edited, startedRig } from "./testRig";

/** 코어로 1회 저장 → 기준 revision = 시작 + 1 */
async function savedRig(options: Parameters<typeof startedRig>[0] = {}) {
  const rig = await startedRig(options);
  const c = rig.core();
  c.edit(edited(rig.doc, "A"));
  await c.save();
  const revision = (await rig.repo.getDoc(PROJECT))!.revision;
  return { ...rig, c, revision };
}

describe("RS6-L3a CP0 · DocBook revision 쓰기 뒤 코어 기준", () => {
  it("복원 뒤 코어 save = 복원 revision + 1 · IDB = DocBook · 코어 초안 = 복원 문서", async () => {
    const { db, repo, c, doc, revision } = await savedRig();
    const snap = await repo.createSnapshot(PROJECT, "기준");
    c.edit(edited(doc, "B"));
    await c.save();
    const restored = await repo.restoreSnapshot(PROJECT, snap.snapshotId, revision + 1);
    expect(restored.revision).toBe(revision + 2);
    expect(c.view()).toMatchObject({ dirty: false, doc: { hash: restored.hash } });
    c.edit(edited(restored, "C"));
    const result = await c.save();
    expect(result).toMatchObject({ status: "saved", receipt: { revision: restored.revision + 1 } });
    const stored = await db.doc();
    expect([stored?.doc.revision, stored?.doc.meta.title]).toEqual([restored.revision + 1, "C"]);
    expect((await repo.getDoc(PROJECT))?.revision).toBe(restored.revision + 1);
  });

  it("충돌 해결 mine 뒤 코어 save = 해결 revision + 1 · 내 초안 = 해결 문서면 dirty 0", async () => {
    const { db, repo, c, doc } = await savedRig();
    const mine = edited(doc, "M");
    c.edit(mine);
    const resolved = await repo.resolveConflict(PROJECT, "mine", mine);
    expect(c.view().dirty).toBe(false);
    c.edit(edited(doc, "N"));
    expect(await c.save()).toMatchObject({ status: "saved", receipt: { revision: resolved.revision + 1 } });
    expect((await db.doc())?.doc.revision).toBe(resolved.revision + 1);
  });

  it("충돌 해결 mine 요청 뒤 새 편집 = 초안 유지 · dirty · 다음 save = 해결 revision + 1", async () => {
    const { repo, c, doc } = await savedRig();
    const mine = edited(doc, "M");
    c.edit(mine);
    const pending = repo.resolveConflict(PROJECT, "mine", mine);
    c.edit(edited(doc, "later"));
    const resolved = await pending;
    expect(c.view()).toMatchObject({ dirty: true, doc: { meta: { title: "later" } } });
    expect(await c.save()).toMatchObject({ status: "saved", receipt: { revision: resolved.revision + 1 } });
  });

  it("충돌 해결 theirs 뒤 코어 초안 = 저장된 문서 · 다음 save = 그 revision + 1", async () => {
    const { repo, c, doc } = await savedRig();
    c.edit(edited(doc, "M"));
    const theirs = await repo.resolveConflict(PROJECT, "theirs", edited(doc, "M"));
    expect(c.view()).toMatchObject({ dirty: false, doc: { hash: theirs.hash } });
    c.edit(edited(theirs, "T"));
    expect(await c.save()).toMatchObject({ status: "saved", receipt: { revision: theirs.revision + 1 } });
  });

  it("restart(편집기 밖) 뒤 재진입 seed = 같은 코어의 새 문서 · 다음 save = restart revision + 1", async () => {
    const { db, repo, c, revision } = await savedRig();
    const { doc: restarted } = await repo.startDoc(PROJECT, 1, "A", "restart", revision);
    expect(restarted.revision).toBe(revision + 1);
    const again = repo.core!(PROJECT, restarted);
    expect(again).toBe(c);
    expect(again.view()).toMatchObject({ dirty: false, doc: { hash: restarted.hash, candidateId: "A" } });
    again.edit(edited(restarted, "R"));
    expect(await again.save()).toMatchObject({ status: "saved", receipt: { revision: restarted.revision + 1 } });
    expect((await db.doc())?.doc.revision).toBe(restarted.revision + 1);
  });

  it("미저장 편집이 있으면 복원 = STALE_DOC · DocBook·스냅샷·코어 초안 변화 0", async () => {
    const { repo, c, doc, revision } = await savedRig();
    const snap = await repo.createSnapshot(PROJECT, "기준");
    c.edit(edited(doc, "draft"));
    const before = repo.listSnapshots(PROJECT);
    const error = await repo.restoreSnapshot(PROJECT, snap.snapshotId, revision).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ProjectRepositoryError);
    expect((error as ProjectRepositoryError).code).toBe("STALE_DOC");
    expect((await repo.getDoc(PROJECT))?.revision).toBe(revision);
    expect(await repo.listSnapshots(PROJECT)).toEqual(await before);
    expect(c.view()).toMatchObject({ dirty: true, doc: { meta: { title: "draft" } } });
  });

  it("코어 save 진행 중 복원 = 그 save 뒤 판정 → STALE_DOC · IDB = 코어 save", async () => {
    const { db, repo, c, doc, revision } = await savedRig();
    const snap = await repo.createSnapshot(PROJECT, "기준");
    const gate = db.hold();
    c.edit(edited(doc, "S"));
    const saving = c.save();
    const restoring = repo.restoreSnapshot(PROJECT, snap.snapshotId, revision).catch((e: unknown) => e);
    gate.release();
    expect(await saving).toMatchObject({ status: "saved", receipt: { revision: revision + 1 } });
    expect(((await restoring) as ProjectRepositoryError).code).toBe("STALE_DOC");
    const stored = await db.doc();
    expect([stored?.doc.revision, stored?.doc.meta.title]).toEqual([revision + 1, "S"]);
  });

  it("memory 모드: 복원 뒤 코어 초안 = 복원 문서 · 다음 save = DocBook revision + 1", async () => {
    const { repo, c, doc, revision } = await savedRig({ memory: true });
    const snap = await repo.createSnapshot(PROJECT, "기준");
    c.edit(edited(doc, "B"));
    await c.save();
    const restored = await repo.restoreSnapshot(PROJECT, snap.snapshotId, revision + 1);
    expect(c.view()).toMatchObject({ dirty: false, doc: { hash: restored.hash } });
    c.edit(edited(restored, "C"));
    await c.save();
    expect((await repo.getDoc(PROJECT))?.revision).toBe(restored.revision + 1);
  });

  it("reject 매핑(L2 QA 4절 3 · 문서 교체 진입점 core.link): 코어 연결 reject → 복원 reject · DocBook·스냅샷 변화 0", async () => {
    const { repo, c, revision } = await savedRig();
    const snap = await repo.createSnapshot(PROJECT, "기준");
    const before = await repo.listSnapshots(PROJECT);
    vi.spyOn(c, "link").mockRejectedValueOnce(new Error("chunk"));
    await expect(repo.restoreSnapshot(PROJECT, snap.snapshotId, revision)).rejects.toThrow("chunk");
    expect((await repo.getDoc(PROJECT))?.revision).toBe(revision);
    expect(await repo.listSnapshots(PROJECT)).toEqual(before);
  });
});
