/**
 * id 재매김 (P2-SPEC 3.4 항상 새 id · AC-P03 id 충돌 · AC-P05 열기 무결 — 결과가 localSync 열기(checkState·readDoc)를 그대로 통과).
 */
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "../../data/persistence/envelope";
import type { LocalState } from "../../data/persistence/entryRead";
import { soloLocks } from "../../data/persistence/fakeLocks";
import { openLocalSync } from "../../data/persistence/localSync";
import { createMemoryPersistence } from "../../data/persistence/studioPersistence";
import { checkSaveDoc } from "../../data/startDocWrite";
import { hashDoc } from "../../engine/ops/hash";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { fakeDeps, fileImage, jsonFile, seedFile, seedProject, seedSeries } from "../../test/projectFileFixtures";
import { checkFile, type CheckedFile } from "./checkFile";
import { mergeImport, rekeyImport } from "./rekey";

const NOW = "2026-10-08T10:00:00.000Z";

async function checked(over: Parameters<typeof seedFile>[0] = {}, images = [fileImage("a", 500, 300)]): Promise<CheckedFile> {
  const result = await checkFile(jsonFile(seedFile(over, images)), fakeDeps().deps);
  if (!result.ok) throw new Error(result.message);
  return result.file;
}

const stateWith = (n: number, over: Partial<LocalState> = {}): LocalState => ({
  series: new Map([[`profile-${n}`, seedSeries(`profile-${n}`)]]),
  commits: new Map(),
  adjustCommits: new Map(),
  jobs: new Map(),
  projects: new Map([[`project-${n}`, Object.freeze(seedProject(`project-${n}`, `profile-${n}`))]]),
  heads: new Map(),
  gen: 4,
  ...over,
});

function planned(result: ReturnType<typeof rekeyImport>) {
  if (!result.ok) throw new Error(result.message);
  return result.plan;
}

describe("rekeyImport 치환 규칙 (3.4)", () => {
  it("새 id · project updatedAt = 가져온 시각(나머지 그대로) · series profileId만 · 문서·스냅샷 projectId·hash 재계산 · snapshotId·snapshotSeq 그대로 · 이미지 키 접두", async () => {
    const file = await checked();
    const plan = planned(rekeyImport(file, stateWith(1), NOW));
    expect(plan.projectId).toBe("project-2");
    expect(plan.profileId).toBe("profile-2");
    expect(plan.project).toEqual({ ...file.project, projectId: "project-2", profileId: "profile-2", updatedAt: NOW });
    expect(plan.series).toEqual(file.series.map((v) => ({ ...v, profileId: "profile-2" })));
    const doc = plan.doc!;
    expect(doc.doc.projectId).toBe("project-2");
    expect(doc.doc.hash).toBe(hashDoc(doc.doc as unknown as PageDoc));
    expect({ ...doc.doc, projectId: file.doc!.doc.projectId, hash: file.doc!.doc.hash }).toEqual(file.doc!.doc);
    expect(doc.snapshotSeq).toBe(2);
    doc.snapshots.forEach((s, i) => {
      const before = file.doc!.snapshots[i]!;
      expect(s).toEqual({ ...before, projectId: "project-2", doc: s.doc, hash: s.doc.hash });
      expect(checkSaveDoc("project-2", s.doc).ok).toBe(true);
    });
    expect(plan.head).toEqual({ projectId: "project-2", revision: doc.doc.revision, hash: doc.doc.hash, profileVersion: doc.doc.profileVersion, candidateId: doc.doc.candidateId, updatedAt: doc.doc.updatedAt });
    expect(plan.images.map((im) => [im.key, im.image])).toEqual([["project-2/a", file.images[0]]]);
  });

  it("AC-P03 — 대상 project-1·profile-1 + 같은 id 파일 → project-2 · 기존 값 그대로 · 같은 파일 2회 = project-3 · seq 불변", async () => {
    const file = await checked();
    const before = stateWith(1);
    const first = planned(rekeyImport(file, before, NOW));
    const once = mergeImport(before, first);
    expect(once.projects.get("project-1")).toBe(before.projects.get("project-1"));
    expect(once.series.get("profile-1")).toBe(before.series.get("profile-1"));
    expect([...once.projects.keys()]).toEqual(["project-1", "project-2"]);
    expect(before.projects.size).toBe(1);
    const second = planned(rekeyImport(file, once, NOW));
    expect([second.projectId, second.profileId]).toEqual(["project-3", "profile-3"]);
    expect(mergeImport(once, second).seq).toBe(once.seq);
  });

  it("AC-P03 묘비 — 대상 seq.project 5(프로젝트 1개) → project-6 · seq 값 그대로", async () => {
    const seq = Object.freeze({ project: 5, profile: 5, job: 0 });
    const target = stateWith(1, { seq });
    const plan = planned(rekeyImport(await checked(), target, NOW));
    expect([plan.projectId, plan.profileId]).toEqual(["project-6", "profile-6"]);
    expect(mergeImport(target, plan).seq).toBe(seq);
  });

  it("빈 대상(상태 없음 — 첫 실행·지운 직후) → project-1 · 문서 없음 = head·doc 없음", async () => {
    const plan = planned(rekeyImport(await checked({ doc: null }, []), undefined, NOW));
    expect([plan.projectId, plan.doc, plan.head, plan.images]).toEqual(["project-1", null, undefined, []]);
    const merged = mergeImport(undefined, plan);
    expect(merged.heads.has("project-1")).toBe(false);
    expect(merged.projects.get("project-1")?.name).toBe("강남 카페");
  });
});

describe("AC-P05 열기 무결 — 가져오기 결과가 localSync 열기를 그대로 통과", () => {
  it("병합 상태(checkState) + 새 문서 레코드(readDoc) → openLocalSync 성공 · 문서 시드에 새 id", async () => {
    const target = stateWith(1);
    const plan = planned(rekeyImport(await checked(), target, NOW));
    const state = mergeImport(target, plan);
    const persistence = createMemoryPersistence();
    await persistence.write([{ type: "put", store: "docs", record: { schemaVersion: SCHEMA_VERSION, kind: "doc", id: plan.projectId, data: plan.doc } }]);
    const sync = await openLocalSync({ state }, async () => persistence, soloLocks());
    expect(sync.docs.get("project-2")?.doc.hash).toBe(plan.doc!.doc.hash);
    expect(state.heads.get("project-2")).toEqual(plan.head);
  });
});
