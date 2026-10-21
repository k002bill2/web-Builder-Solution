/**
 * TYPESCALE TS-AC-14 — 되돌리기 하한(T1): 값 있는 문서·스냅샷이 T1 코드만으로 저장 검사·IDB 복원·가져오기·재저장을 통과하고
 * 각 경로 뒤 `typeScale`·해시가 그대로다(재구성 소실 = 해시 불일치 실패 방지).
 */
import { describe, expect, it } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { validatePageDoc } from "../../engine/validate/validatePageDoc";
import { checkFile } from "../../features/projectFile/checkFile";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { jsonFile, seedDocRecord, seedFile } from "../../test/projectFileFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkSaveDoc, rekeyDoc } from "../startDocWrite";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { soloLocks } from "./fakeLocks";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence } from "./studioPersistence";

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
const studioOn = (persistence: StudioPersistence, entry: LocalEntry = {}) =>
  createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => persistence, soloLocks()) });
const rehash = <T extends PageDoc>(doc: T): T => ({ ...doc, hash: hashDoc(doc) });
const withScale = (doc: PageDoc, typeScale: number): PageDoc => rehash({ ...doc, typeScale });

async function entryFrom(persistence: StudioPersistence, projectId: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = checkEnvelope(await persistence.get("docs", projectId), "doc", projectId);
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}

describe("TS-AC-14 되돌리기 하한 — 값 있는 문서가 T1 코드만으로 모든 읽기 경로를 통과", () => {
  it("저장 검사(checkSaveDoc) · 재저장 검증 결과에 같은 값·해시", () => {
    const doc = withScale(seedDocRecord().doc as PageDoc, 1.333);
    const saved = checkSaveDoc(doc.projectId, doc);
    expect(saved.ok).toBe(true);
    const checked = validatePageDoc(doc);
    if (!checked.ok) throw new Error("검증 실패");
    expect(checked.value.typeScale).toBe(1.333);
    expect(checked.value.hash).toBe(hashDoc(checked.value));
    expect(checked.value).toEqual(doc);
  });

  it("IDB 복원(localSync) — 값 있는 문서·스냅샷 저장 → 새 store 복원 = 같은 문서 · 복원 뒤 재저장도 값 유지", async () => {
    const persistence = createMemoryPersistence();
    const studio = studioOn(persistence);
    await (await studio.board()).confirmProfile(1, 0);
    const gen = await studio.generations();
    let job = await gen.requestGeneration("profile-1", 1);
    for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
    const projects = (await studio.projects()) as ProjectRepository<PageDoc>;
    const { doc } = await projects.startDoc("project-1", 1, "C", "create");
    const saved = await projects.saveDoc("project-1", doc.revision, withScale(doc, 1.2));
    const snapshot = await projects.createSnapshot("project-1", "비율 있음");

    const again = (await studioOn(persistence, await entryFrom(persistence, "project-1")).projects()) as ProjectRepository<PageDoc>;
    const reloaded = (await again.getDoc("project-1")) as PageDoc;
    expect(reloaded).toEqual(saved);
    expect(reloaded.typeScale).toBe(1.2);
    expect(await again.listSnapshots("project-1")).toEqual([snapshot]);
    const edited = rehash({ ...reloaded, meta: { ...reloaded.meta, title: "다시 저장" } });
    const next = (await again.saveDoc("project-1", reloaded.revision, edited)) as PageDoc;
    expect(next.typeScale).toBe(1.2);
    expect(next.hash).toBe(hashDoc(next));
  });

  it("가져오기(checkFile) — 문서·스냅샷에 값 있는 파일 = 통과 · 재키(rekeyDoc) 뒤 값 그대로·해시 재계산", async () => {
    const record = seedDocRecord();
    const doc = withScale(record.doc as PageDoc, 1.333);
    const snapshots = record.snapshots.map((s) => ({ ...s, doc: withScale(s.doc as PageDoc, 1.2) }));
    const result = await checkFile(jsonFile(seedFile({ doc: { ...record, doc, snapshots } })));
    if (!result.ok) throw new Error(result.message);
    const imported = result.file.doc!.doc as PageDoc;
    expect(imported.typeScale).toBe(1.333);
    expect(imported.hash).toBe(doc.hash);
    expect((result.file.doc!.snapshots[0]!.doc as PageDoc).typeScale).toBe(1.2);
    const rekeyed = rekeyDoc(imported, "project-9");
    expect(rekeyed.typeScale).toBe(1.333);
    expect(checkSaveDoc("project-9", rekeyed).ok).toBe(true);
  });

  it("범위 밖 값 파일 = 가져오기 거부(기존 checkFile 실패 경로)", async () => {
    const record = seedDocRecord();
    const doc = withScale(record.doc as PageDoc, 2.01);
    const result = await checkFile(jsonFile(seedFile({ doc: { ...record, doc } })));
    expect(result.ok).toBe(false);
  });
});
