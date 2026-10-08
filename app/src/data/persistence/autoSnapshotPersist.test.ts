/**
 * 자동 스냅샷 정리의 영속 (P1D-SPEC 1.2 · AC-D02 한 트랜잭션·이미지 · AC-D03 이행) — 메모리 가짜 영속으로 앱 조립(deferredStudio)을 돌린다(monotonicIds.test와 같은 하네스).
 * 문서 레코드를 직접 심어(자동 25개 = P1c까지 상한 없던 데이터) 열기 쓰기 0 → 다음 자동 생성 1회에 20개 + 뺀 스냅샷 전용 이미지 delete가 한 write.
 */
import { describe, expect, it, vi } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { setSlot } from "../../engine/ops/slotOps";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository, ProjectSnapshot } from "../projectRepository";
import { SCHEMA_VERSION, checkEnvelope } from "./envelope";
import type { DocRecord, LocalEntry } from "./entryRead";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence } from "./studioPersistence";
import { soloLocks } from "./fakeLocks";

const imports = {
  ...STUDIO_IMPORTS,
  board: async () => {
    const mod = await STUDIO_IMPORTS.board();
    return {
      ...mod,
      createMemoryCompareBoardRepository: (options: Parameters<typeof mod.createMemoryCompareBoardRepository>[0]) =>
        mod.createMemoryCompareBoardRepository({ ...options, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }) }),
    };
  },
};
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const withImage = (doc: PageDoc, localId: LocalImageId): PageDoc => {
  for (const s of doc.sections)
    for (const [key, v] of Object.entries(s.slots))
      if (typeof v === "object" && v.kind === "image") {
        const next = setSlot(doc, s.instanceId, key, { ...(v as ImageSlotValue), enabled: true, source: localId });
        return { ...next, hash: hashDoc(next) };
      }
  throw new Error("이미지 슬롯 없음");
};

function studioOn(persistence: StudioPersistence, entry: LocalEntry = {}) {
  return createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => persistence, soloLocks()) });
}
async function entryFrom(persistence: StudioPersistence): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1");
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}
const docRecord = async (persistence: StudioPersistence) => {
  const env = checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1");
  if (env.status !== "ok") throw new Error("문서 레코드 없음");
  return env.data as DocRecord;
};

/**
 * 확정 → 3안 → 편집 시작 → 문서 레코드를 자동 `autos`개 + 수동 2개로 바꿔 심는다(이미지 레코드 2개 함께).
 * 이미지 A = 가장 오래된 자동(snapshot-1)만 · 이미지 B = 수동(snapshot-2)과 두 번째 자동(snapshot-3)이 함께 참조.
 */
async function seeded(autos: number) {
  const persistence = createMemoryPersistence();
  const studio = studioOn(persistence);
  await (await studio.board()).confirmProfile(1, 0);
  const gen = await studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = (await studio.projects()) as ProjectRepository<PageDoc>;
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  const snap = (n: number, kind: "auto" | "manual", d: PageDoc): ProjectSnapshot<PageDoc> => ({
    snapshotId: `snapshot-${n}`,
    projectId: "project-1",
    kind,
    ...(kind === "auto" && { reason: "export" as const }),
    name: `${kind} ${n}`,
    createdAt: new Date(Date.UTC(2026, 9, 8, 1, n)).toISOString(),
    doc: d,
    profileVersion: d.profileVersion,
    candidateId: d.candidateId,
    hash: d.hash,
  });
  const snapshots = [
    snap(1, "auto", withImage(doc, uuid(1))),
    snap(2, "manual", withImage(doc, uuid(2))),
    ...Array.from({ length: autos - 1 }, (_, i) => snap(i + 3, "auto", i === 0 ? withImage(doc, uuid(2)) : doc)),
    snap(autos + 2, "manual", doc),
  ];
  const image = (n: number) => ({ type: "put" as const, store: "images" as const, record: { schemaVersion: SCHEMA_VERSION, kind: "image", id: `project-1/${uuid(n)}`, data: {} } });
  const raw = (await persistence.get("docs", "project-1")) as { schemaVersion: number; kind: string; id: string; data: DocRecord };
  await persistence.write([{ type: "put", store: "docs", record: { ...raw, data: { ...raw.data, snapshots } } }, image(1), image(2)]);
  return { persistence };
}

describe("AC-D02·D03 정리 영속 — 한 트랜잭션 · 이미지 · 이행", () => {
  it("자동 25개 레코드: 열고 목록 읽기 = 쓰기 0 → 다음 자동(복원) 1회 = write 1번에 자동 20 · 수동 그대로 · 전용 이미지 delete · snapshotSeq 상향", async () => {
    const { persistence } = await seeded(25);
    const write = vi.spyOn(persistence, "write");
    const projects = (await studioOn(persistence, await entryFrom(persistence)).projects()) as ProjectRepository<PageDoc>;
    const opened = await projects.listSnapshots("project-1");
    expect(opened.filter((s) => s.kind === "auto")).toHaveLength(25);
    expect(write).not.toHaveBeenCalled();

    const manual = opened.find((s) => s.snapshotId === "snapshot-2")!;
    await projects.restoreSnapshot("project-1", manual.snapshotId, (await projects.getDoc("project-1"))!.revision);
    expect(write).toHaveBeenCalledTimes(1);
    const ops = write.mock.calls[0]![0];
    expect(ops.filter((op) => op.type === "put" && op.store === "docs")).toHaveLength(1);
    expect(ops.filter((op) => op.type === "delete")).toEqual([{ type: "delete", store: "images", id: `project-1/${uuid(1)}` }]);

    const record = await docRecord(persistence);
    const autos = record.snapshots.filter((s) => s.kind === "auto").map((s) => s.snapshotId);
    // 자동 25 + 1 = 26 → 가장 오래된 6개(snapshot-1, 3~7) 빠짐
    expect(autos).toEqual([...Array.from({ length: 19 }, (_, i) => `snapshot-${i + 8}`), "snapshot-28"]);
    expect(record.snapshots.filter((s) => s.kind === "manual").map((s) => s.snapshotId)).toEqual(["snapshot-2", "snapshot-27"]);
    expect(record.snapshotSeq).toBe(7);
    expect(await persistence.keys("images")).toEqual([`project-1/${uuid(2)}`]);
  });

  it("자동 20개 레코드에 자동 1개 → 같은 write에서 가장 오래된 자동 1개만 빠짐 · 새로고침 뒤 목록 그대로", async () => {
    const { persistence } = await seeded(20);
    const projects = (await studioOn(persistence, await entryFrom(persistence)).projects()) as ProjectRepository<PageDoc>;
    await projects.restoreSnapshot("project-1", "snapshot-2", (await projects.getDoc("project-1"))!.revision);
    const record = await docRecord(persistence);
    expect(record.snapshots.filter((s) => s.kind === "auto").map((s) => s.snapshotId)).toEqual([...Array.from({ length: 19 }, (_, i) => `snapshot-${i + 3}`), "snapshot-23"]);
    expect(record.snapshotSeq).toBe(1);
    const reloaded = (await studioOn(persistence, await entryFrom(persistence)).projects()) as ProjectRepository<PageDoc>;
    expect((await reloaded.listSnapshots("project-1")).map((s) => s.snapshotId)).toEqual(record.snapshots.map((s) => s.snapshotId));
  });
});
