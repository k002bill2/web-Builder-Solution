/**
 * RS23-PORT 항목 3 — RS3-AC-02 저장된 문서 열기 회귀 0(rs23-impl createLock.test.ts:174 이식, main API로 다시 씀).
 * IDB에 B안 문서가 있고 다른 탭이 writer여도: 프로필 편집 시작 B = F2 이동 · C = F4 대화상자 · 잠금 요청(가드 호출) 0 · 기억(Pending) 0 · `/projects` 링크(hasDoc) 유지.
 * 흐름 함수(startEdit)를 로컬 영속 저장소(메모리 가짜 IDB + 가짜 잠금)에 직접 건다.
 */
import { describe, expect, it } from "vitest";
import { isTerminal } from "../domain/generation";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { STUDIO_IMPORTS, createDeferredStudio } from "../data/deferredStudio";
import type { ProjectRepository } from "../data/projectRepository";
import { checkEnvelope } from "../data/persistence/envelope";
import type { LocalEntry } from "../data/persistence/entryRead";
import { createLockRegistry } from "../data/persistence/fakeLocks";
import { openLocalSync } from "../data/persistence/localSync";
import { createMemoryPersistence, type StudioPersistence } from "../data/persistence/studioPersistence";
import { WRITER_LOCK, type WriterLocks } from "../data/persistence/writerLock";
import { pendingOf } from "../features/pending/pendingWrites";
import { startEdit } from "../features/profile/restartFlow";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";

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
const settle = async () => {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
};

async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}

async function openTab(persistence: StudioPersistence, locks: WriterLocks | undefined, projectId?: string) {
  const own: StudioPersistence = { ...persistence, close: () => undefined };
  const entry = await entryFrom(persistence, projectId);
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, locks) });
  return { studio, projects: async () => (await studio.projects()) as ProjectRepository<PageDoc> };
}

/** 시드: 확정 → 3안(v1) → B안 create → 닫기(잠금 놓음). IDB에 B안 문서 */
async function seeded() {
  const persistence = createMemoryPersistence();
  const browser = createLockRegistry();
  const lock = browser.tab();
  const tab = await openTab(persistence, lock);
  await (await tab.studio.board()).confirmProfile(1, 0);
  const gen = await tab.studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  await (await tab.projects()).startDoc("project-1", 1, "B", "create");
  await settle();
  lock.close();
  return { persistence, browser };
}

describe("RS3-AC-02 저장된 문서 열기 회귀 0 — 다른 탭 writer여도 가드 호출 0", () => {
  it("IDB에 B안 문서 + 다른 탭 잠금 → 편집 시작 B = F2 이동 · C = F4 대화상자 · 잠금 요청 0 · 기억 0 · 목록 링크 유지", async () => {
    const { persistence, browser } = await seeded();
    expect(await persistence.get("docs", "project-1")).toBeDefined();
    // 다른 탭이 writer 잠금을 계속 쥔다
    void browser.tab().request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>(() => undefined));
    const tabLock = browser.tab();
    let requests = 0;
    const counted: WriterLocks = { request: (...args) => ((requests += 1), tabLock.request(...args)) };
    const tab = await openTab(persistence, counted, "project-1");
    const projects = await tab.projects();

    expect(await startEdit(projects, "project-1", 1, "B")).toHaveProperty("go");
    expect(await startEdit(projects, "project-1", 1, "C")).toEqual({ open: expect.objectContaining({ selected: "C", doc: expect.objectContaining({ candidateId: "B" }) }) });
    await settle();
    expect(requests).toBe(0);
    expect(pendingOf(projects, "project-1")).toBeUndefined();
    expect((await projects.listProjects()).find((p) => p.projectId === "project-1")?.hasDoc).toBe(true);
  });
});
