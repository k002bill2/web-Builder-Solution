/**
 * P1D-L1 단조 카운터 (P1D-SPEC 3절 · 5절 AC-D01①② · D08 판정) — 메모리 가짜 영속으로 앱 조립(deferredStudio)을 돌린다(localSync.test와 같은 하네스).
 * project·profile·job 삭제 흐름은 L3 — 여기서는 상태 레코드 `seq`(묘비 상한)를 직접 넣어 발급 규칙·이행·직렬화 왕복을 본다.
 */
import { describe, expect, it } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry, LocalState } from "./entryRead";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence } from "./studioPersistence";
import { soloLocks } from "./fakeLocks";

/** 보드 id가 다르면 확정 멱등 키가 달라 새 계열이 된다(새 탭의 새 보드) */
const importsFor = (id = "board-1") => ({
  ...STUDIO_IMPORTS,
  board: async () => {
    const mod = await STUDIO_IMPORTS.board();
    return {
      ...mod,
      createMemoryCompareBoardRepository: (options: Parameters<typeof mod.createMemoryCompareBoardRepository>[0]) =>
        mod.createMemoryCompareBoardRepository({ ...options, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }, { id }) }),
    };
  },
});
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string }) => e.code ?? String(e));

function studioOn(persistence: StudioPersistence, entry: LocalEntry = {}, boardId?: string) {
  return createDeferredStudio(async () => FIXTURE_CATALOG, importsFor(boardId), { entry, sync: (e) => openLocalSync(e, async () => persistence, soloLocks()) });
}

/** 확정 → 3안(끝까지) → B안 편집 시작 — 앱 흐름 그대로 */
async function started(persistence: StudioPersistence) {
  const studio = studioOn(persistence);
  await (await studio.board()).confirmProfile(1, 0);
  const gen = await studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = (await studio.projects()) as ProjectRepository<PageDoc>;
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  return { studio, projects, doc, job };
}

async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}
const stateRecord = async (persistence: StudioPersistence) => (await persistence.get("studio", "state")) as { schemaVersion: number; kind: string; id: string; data: LocalState };
const ids = async (projects: ProjectRepository<PageDoc>) => (await projects.listSnapshots("project-1")).map((s) => s.snapshotId);

/** 새 탭에서 새 보드 확정 + 3안 요청 — 발급된 project·profile·job id */
async function confirmAgain(persistence: StudioPersistence) {
  const studio = studioOn(persistence, await entryFrom(persistence), "board-2");
  const { profileId } = await (await studio.board()).confirmProfile(1, 0);
  const job = await (await studio.generations()).requestGeneration(profileId, 1);
  const project = (await (await studio.projects()).listProjects()).find((p) => p.profileId === profileId)!;
  return { profileId, projectId: project.projectId, jobId: job.jobId };
}

describe("AC-D01 스냅샷 — 삭제 뒤 재발급 0 · 겹침 0", () => {
  it("① 수동 1·2·3 → 2 삭제 → 새 수동 = snapshot-4 (3과 겹침 0)", async () => {
    const { projects } = await started(createMemoryPersistence());
    for (const name of ["하나", "둘", "셋"]) await projects.createSnapshot("project-1", name);
    await projects.deleteSnapshot("project-1", "snapshot-2");
    expect(await ids(projects)).toEqual(["snapshot-1", "snapshot-3"]);
    expect((await projects.createSnapshot("project-1", "넷")).snapshotId).toBe("snapshot-4");
  });

  it("② 수동 1·2·3 → 3(최대) 삭제 → 새 = snapshot-4 · 문서 레코드 snapshotSeq = 3 · 새로고침 뒤에도", async () => {
    const persistence = createMemoryPersistence();
    const { projects } = await started(persistence);
    for (const name of ["하나", "둘", "셋"]) await projects.createSnapshot("project-1", name);
    await projects.deleteSnapshot("project-1", "snapshot-3");
    const record = checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1");
    expect(record.status === "ok" && (record.data as { snapshotSeq?: number }).snapshotSeq).toBe(3);
    const reloaded = (await studioOn(persistence, await entryFrom(persistence, "project-1")).projects()) as ProjectRepository<PageDoc>;
    expect(await ids(reloaded)).toEqual(["snapshot-1", "snapshot-2"]);
    expect((await reloaded.createSnapshot("project-1")).snapshotId).toBe("snapshot-4");
    // 같은 탭(메모리 snapshotSeq)도 같은 규칙
    expect((await projects.createSnapshot("project-1")).snapshotId).toBe("snapshot-4");
  });

  it("삭제가 없던 문서 레코드엔 snapshotSeq를 쓰지 않는다(이행 쓰기 0 · 기존 레코드 모양 그대로)", async () => {
    const persistence = createMemoryPersistence();
    const { projects } = await started(persistence);
    await projects.createSnapshot("project-1", "하나");
    const record = checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1");
    expect(record.status === "ok" && "snapshotSeq" in (record.data as object)).toBe(false);
  });
});

describe("D08 스냅샷 삭제 판정", () => {
  it("없는 id = 변화 0으로 성공(재시도 멱등) · 자동 스냅샷 = SCHEMA_INVALID · 없는 프로젝트 = NOT_FOUND", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc } = await started(persistence);
    await projects.createSnapshot("project-1", "하나");
    await projects.restoreSnapshot("project-1", "snapshot-1", doc.revision);
    const before = await projects.listSnapshots("project-1");
    expect(before.map((s) => [s.snapshotId, s.kind])).toEqual([["snapshot-1", "manual"], ["snapshot-2", "auto"]]);
    expect(await codeOf(projects.deleteSnapshot("project-1", "snapshot-9"))).toBe("ok");
    expect(await codeOf(projects.deleteSnapshot("project-1", "snapshot-2"))).toBe("SCHEMA_INVALID");
    expect(await codeOf(projects.deleteSnapshot("project-9", "snapshot-1"))).toBe("NOT_FOUND");
    expect(await projects.listSnapshots("project-1")).toEqual(before);
    await projects.deleteSnapshot("project-1", "snapshot-1");
    expect(await codeOf(projects.deleteSnapshot("project-1", "snapshot-1"))).toBe("ok");
    expect(await ids(projects)).toEqual(["snapshot-2"]);
  });
});

describe("AC-D01 project·profile·job — 상태 레코드 seq(묘비 상한) · 이행 · 새로고침 생존", () => {
  it("seq {3,3,3} → 새 확정 = project-4 · profile-4 · 새 잡 = job-4 · 다시 쓴 상태 레코드에 seq 그대로 · 기존 프로젝트 값 그대로", async () => {
    const persistence = createMemoryPersistence();
    await started(persistence);
    const raw = await stateRecord(persistence);
    const seq = { project: 3, profile: 3, job: 3 };
    await persistence.write([{ type: "put", store: "studio", record: { ...raw, data: { ...raw.data, seq } } }]);
    const before = (await stateRecord(persistence)).data;
    expect(await confirmAgain(persistence)).toEqual({ profileId: "profile-4", projectId: "project-4", jobId: "job-4" });
    const after = (await stateRecord(persistence)).data;
    expect(after.seq).toEqual(seq);
    expect(after.projects.get("project-1")).toEqual(before.projects.get("project-1"));
    expect(after.series.get("profile-1")).toEqual(before.series.get("profile-1"));
    expect(after.jobs.get("job-1")).toEqual(before.jobs.get("job-1"));
  });

  it("이행 — seq 없는 기존 레코드 = 현존 최대 + 1 (지금 length + 1과 같은 값) · seq를 새로 쓰지 않는다", async () => {
    const persistence = createMemoryPersistence();
    await started(persistence);
    expect(await confirmAgain(persistence)).toEqual({ profileId: "profile-2", projectId: "project-2", jobId: "job-2" });
    expect((await stateRecord(persistence)).data.seq).toBeUndefined();
  });
});

describe("seq · snapshotSeq 모양 검증 — 정수가 아니면 기존 '읽지 못함'(INFRA) 경로", () => {
  it("상태 레코드 seq 꼬리가 정수가 아니면 싱크 열기 = INFRA", async () => {
    const persistence = createMemoryPersistence();
    await started(persistence);
    const raw = await stateRecord(persistence);
    await persistence.write([{ type: "put", store: "studio", record: { ...raw, data: { ...raw.data, seq: { project: "x", profile: 1, job: 1 } } } }]);
    expect(await codeOf(openLocalSync(await entryFrom(persistence), async () => persistence, soloLocks()))).toBe("INFRA");
  });

  it("문서 레코드 snapshotSeq가 정수가 아니면 싱크 열기 = INFRA", async () => {
    const persistence = createMemoryPersistence();
    await started(persistence);
    const raw = (await persistence.get("docs", "project-1")) as { schemaVersion: number; kind: string; id: string; data: object };
    await persistence.write([{ type: "put", store: "docs", record: { ...raw, data: { ...raw.data, snapshotSeq: 1.5 } } }]);
    expect(await codeOf(openLocalSync(await entryFrom(persistence), async () => persistence, soloLocks()))).toBe("INFRA");
  });
});
