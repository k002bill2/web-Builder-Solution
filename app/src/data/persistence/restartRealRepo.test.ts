/**
 * RS23-PORT 항목 4 — 실저장소(메모리 가짜 IDB + 가짜 잠금 + LocalSync) 회귀(rs23-impl unconfirmedStart.test.ts:88·218·255 이식, main API로 다시 씀).
 * RS3-AC-05 create 단계 주입(request·commit = C-E3 · response·flush = C-E4 · 거짓 양성 0) · RS3-AC-07b 진행된 revision 게이트 · RS3-AC-10[U] R-E4 뒤 편집 저장 1회.
 * 기억 = SPEC-4 Pending(pendingWrites) · `/projects` 재시도 = retryPending.
 */
import { describe, expect, it } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { pendingOf } from "../../features/pending/pendingWrites";
import { CANDIDATE_TEXT } from "../../features/profile/generationText";
import { restartOnce, startEdit } from "../../features/profile/restartFlow";
import { RESTART_TEXT } from "../../features/profile/restartText";
import { retryPending } from "../../features/projects/pendingRetry";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectCall } from "../memoryProjectRepository";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { createLockRegistry } from "./fakeLocks";
import { toInfra } from "./infra";
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
const edit = (doc: PageDoc, title: string): PageDoc => {
  const next = { ...doc, meta: { ...doc.meta, title } };
  return { ...next, hash: hashDoc(next) };
};
const settle = async () => {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
};
const quota = () => toInfra(new DOMException("x", "QuotaExceededError"), "저장");
type Fail = (call: ProjectCall) => Error | undefined;
type Stored = { doc: PageDoc; snapshots: { reason?: string; doc: PageDoc }[] };

/** 탭 1개 — 확정 + 3안(v1)까지 IDB에 저장(문서 없음). `gate.fail` = IDB 쓰기 quota 실패 · `inject` = 저장소 call 주입 */
async function tab() {
  const persistence = createMemoryPersistence();
  const browser = createLockRegistry();
  const gate = { fail: false };
  const inject: { fail?: Fail } = {};
  const flaky: StudioPersistence = {
    ...persistence,
    write: async (ops) => (gate.fail ? Promise.reject(quota()) : persistence.write(ops)),
    close: () => undefined,
  };
  const withFail = {
    ...imports,
    projects: async () => {
      const mod = await STUDIO_IMPORTS.projects();
      return { ...mod, createMemoryProjectRepository: (o: Parameters<typeof mod.createMemoryProjectRepository>[0]) => mod.createMemoryProjectRepository({ ...o, fail: (c) => inject.fail?.(c) }) };
    },
  };
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const entry: LocalEntry = state.status === "ok" ? { state: state.data as LocalEntry["state"] } : {};
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, withFail, { entry, sync: (e) => openLocalSync(e, async () => flaky, browser.tab()) });
  await (await studio.board()).confirmProfile(1, 0);
  const gen = await studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  await settle();
  const repo = (await studio.projects()) as ProjectRepository<PageDoc>;
  const stored = async () => (checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1") as { data?: Stored }).data;
  return { repo, gate, inject, stored };
}
const once = (match: (call: ProjectCall) => boolean, error: () => Error = () => new Error("lost")): Fail => {
  let done = false;
  return (call) => (done || !match(call) ? undefined : ((done = true), error()));
};
const C_E3 = { alert: CANDIDATE_TEXT.startFailed, retry: true };
const C_E4 = { alert: RESTART_TEXT.createUnconfirmed, retry: true, held: "unconfirmed" };

describe("RS3-AC-05 create 커밋 확인 판정표 — 실저장소 단계 주입", () => {
  it("request = C-E3(기억 0) · commit = C-E3(문서 0) · response = C-E4(IDB 0) · flush INFRA = C-E4(IDB 0)", async () => {
    const request = await tab();
    request.inject.fail = once((c) => c.method === "startDoc" && c.phase === "request");
    expect(await startEdit(request.repo, "project-1", 1, "B")).toEqual(C_E3);
    expect(pendingOf(request.repo, "project-1")).toBeUndefined();

    const commit = await tab();
    commit.inject.fail = once((c) => c.method === "startDoc" && c.phase === "commit");
    expect(await startEdit(commit.repo, "project-1", 1, "B")).toEqual(C_E3);
    expect(await commit.repo.getDoc("project-1")).toBeUndefined();
    expect(pendingOf(commit.repo, "project-1")).toBeUndefined();
    await settle();
    expect(await commit.stored()).toBeUndefined();

    const response = await tab();
    response.inject.fail = once((c) => c.method === "startDoc" && c.phase === "response");
    expect(await startEdit(response.repo, "project-1", 1, "B")).toMatchObject(C_E4);
    expect(pendingOf(response.repo, "project-1")).toMatchObject({ kind: "start", mode: "create", version: 1, selected: "B", held: "unconfirmed" });
    expect(await response.stored()).toBeUndefined();

    const flush = await tab();
    flush.gate.fail = true;
    expect(await startEdit(flush.repo, "project-1", 1, "B")).toMatchObject(C_E4);
    expect(await flush.stored()).toBeUndefined();
  });

  it("거짓 양성 0 — 같은 쌍 문서가 이미 저장됐고 마지막 start 키는 다른 restart → request 실패 = C-E3 · 기억 0", async () => {
    const t = await tab();
    const first = await t.repo.startDoc("project-1", 1, "B", "create");
    const c = await t.repo.startDoc("project-1", 1, "C", "restart", first.doc.revision);
    await t.repo.startDoc("project-1", 1, "B", "restart", c.doc.revision);
    t.inject.fail = once((x) => x.method === "startDoc");
    expect(await startEdit(t.repo, "project-1", 1, "B")).toEqual(C_E3);
    expect(pendingOf(t.repo, "project-1")).toBeUndefined();
  });
});

describe("RS3-AC-07b 진행된 revision에서 게이트 유지 — 실저장소 IDB 단언", () => {
  it("restart R-E4 → 편집 저장 quota → /projects 재시도 flush 계속 실패 = 미확인 유지 → flush 성공 → IDB = 메모리 · 기억 삭제", async () => {
    const t = await tab();
    const { doc } = await t.repo.startDoc("project-1", 1, "A", "create");
    await settle();
    t.gate.fail = true;
    expect(await restartOnce(t.repo, "project-1", { selected: "B", version: 1, doc })).toEqual({ held: "unconfirmed" });
    const started = (await t.repo.getDoc("project-1"))!;
    await expect(t.repo.saveDoc("project-1", started.revision, edit(started, "편집"))).rejects.toBeTruthy();
    expect((await t.repo.getDoc("project-1"))!.revision).toBe(doc.revision + 2);
    const held = pendingOf(t.repo, "project-1")!;
    expect(held).toMatchObject({ kind: "start", mode: "restart", selected: "B", held: "unconfirmed" });
    const out = await retryPending(t.repo, held);
    expect(out.ok).toBe(false);
    expect(pendingOf(t.repo, "project-1")).toMatchObject({ kind: "start", mode: "restart", selected: "B" });
    expect((await t.stored())?.doc.candidateId).toBe("A");
    t.gate.fail = false;
    expect((await retryPending(t.repo, pendingOf(t.repo, "project-1")!)).ok).toBe(true);
    await settle();
    expect((await t.stored())?.doc).toEqual(await t.repo.getDoc("project-1"));
    expect((await t.stored())?.doc.meta.title).toBe("편집");
    expect(pendingOf(t.repo, "project-1")).toBeUndefined();
  });
});

describe("RS3-AC-10[U] RS3-R1 경로 — 재시도 없이 편집 저장 1회 성공으로 갈라짐이 닫힌다", () => {
  it("restart R-E4(flush 실패) → 편집 저장 성공 → IDB = 메모리(새 문서 + 편집) · '새로 시작 전' 스냅샷 1개", async () => {
    const t = await tab();
    const { doc } = await t.repo.startDoc("project-1", 1, "A", "create");
    await settle();
    t.gate.fail = true;
    await expect(t.repo.startDoc("project-1", 1, "B", "restart", doc.revision)).rejects.toBeTruthy();
    expect((await t.stored())?.doc.candidateId).toBe("A");
    t.gate.fail = false;
    const started = (await t.repo.getDoc("project-1"))!;
    await t.repo.saveDoc("project-1", started.revision, edit(started, "편집기에서 저장"));
    await settle();
    const record = (await t.stored())!;
    expect(record.doc).toEqual(await t.repo.getDoc("project-1"));
    expect(record.doc).toMatchObject({ candidateId: "B", meta: { title: "편집기에서 저장" } });
    expect(record.snapshots.filter((s) => s.reason === "restart")).toHaveLength(1);
  });
});
