/**
 * RS7-C(B-RS-08) — RS6 QA 생존 변이의 테스트 공백. 앱 코드 변경 0 · 변이 근거 `dev/active/rs7-mutation-gaps/REPORT.md`.
 * L1 U10-a(포트 mode cleared 판정) · IMG-meta(commit 바인딩 메타 확인) · L3a M2b(rebase epoch — 복원·restart 경로).
 */
import { describe, expect, it } from "vitest";
import { createLinkNetwork } from "../../../data/persistence/fakeTabLink";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { SaveCore } from "./saveCore";
import { PROJECT, bindOf, confirmOf, edited, startedRig, ticks, uuid, withImage } from "./testRig";

const replaceOf = (core: SaveCore, next: PageDoc, expectedEpoch: number) => core.link((io, s) => io.replace(s, next, { intent: "replace", expectedEpoch }));

describe("RS7-C · L1 U10-a 포트 mode = cleared", () => {
  it("cleared 수신 뒤 clean 코어 확인 → failed{cleared}(writer로 재읽기 0)", async () => {
    const net = createLinkNetwork();
    const { core } = await startedRig({ link: net.tab() });
    const c = core();
    net.tab().post({ type: "cleared" });
    await ticks();
    expect(await confirmOf(c)).toEqual({ status: "failed", reason: "cleared" });
  });
});

describe("RS7-C · L1 IMG-meta 메타 없는 바인딩", () => {
  it("ingest를 거치지 않은 Blob 바인딩(메타 0) · IDB 레코드 0 → failed{image-missing} · 제출 0 · dirty", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    const next = withImage(doc, uuid(1));
    const ingested = bindOf(next, uuid(1))[uuid(1)]!;
    c.edit(next, { [uuid(1)]: { ...ingested, blob: new Blob([new Uint8Array([1, 2, 3])], { type: "image/png" }) } });
    const start = db.ops.length;
    expect(await c.save()).toMatchObject({ status: "failed", reason: "image-missing" });
    expect(db.since(start)).toEqual([]);
    expect(c.view().dirty).toBe(true);
  });
});

describe("RS7-C · L3a M2b rebase epoch +1(충돌 경로 밖)", () => {
  /** 코어로 1회 저장 → 기준 revision = 시작 + 1 */
  async function savedRig() {
    const rig = await startedRig();
    const c = rig.core();
    c.edit(edited(rig.doc, "A"));
    await c.save();
    return { ...rig, c, revision: (await rig.repo.getDoc(PROJECT))!.revision };
  }

  it("복원 뒤 epoch +1 · 옛 epoch replace = rejected{epoch} · 새 epoch replace = replaced", async () => {
    const { repo, c, revision } = await savedRig();
    const snap = await repo.createSnapshot(PROJECT, "기준");
    const before = c.view().epoch;
    const restored = await repo.restoreSnapshot(PROJECT, snap.snapshotId, revision);
    expect(c.view().epoch).toBe(before + 1);
    expect(await replaceOf(c, edited(restored, "old"), before)).toEqual({ status: "rejected", reason: "epoch" });
    expect(c.view().doc.hash).toBe(restored.hash);
    expect(await replaceOf(c, edited(restored, "new"), before + 1)).toEqual({ status: "replaced", epoch: before + 2 });
  });

  it("restart(편집기 밖) 뒤 epoch +1 · 옛 epoch replace = rejected{epoch} · 코어 초안 = restart 문서", async () => {
    const { repo, c, revision } = await savedRig();
    const before = c.view().epoch;
    const { doc: restarted } = await repo.startDoc(PROJECT, 1, "A", "restart", revision);
    expect(c.view().epoch).toBe(before + 1);
    expect(await replaceOf(c, edited(restarted, "old"), before)).toEqual({ status: "rejected", reason: "epoch" });
    expect(c.view()).toMatchObject({ dirty: false, doc: { hash: restarted.hash } });
  });
});
