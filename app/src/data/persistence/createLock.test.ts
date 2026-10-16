/**
 * RS23-PORT 항목 1·2(rs23-impl 원본을 main API로 이식) — RESTART SPEC-3 3절 · MQ-3-2 ★A — create도 커밋 전 잠금 확인(이 탭 메모리에 문서가 없을 때만, RS3-AC-01·02·04).
 * 거절되면 메모리 문서·멱등 기록·목록·IDB·큐 제출 모두 0(갈라짐 0). 잠금 소유자는 탭당 LocalSync 쓰기 문 하나 — 흐름별 잠금 0.
 * 브라우저 1개 = 메모리 가짜 영속 1개 + 잠금 가짜 registry 1개(restartLock.test.ts와 같은 모양).
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { tabLockHold } from "../../features/projects/tabLockHold";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { createLockRegistry } from "./fakeLocks";
import { createLinkNetwork } from "./fakeTabLink";
import { CLEARED_TAB, READ_ONLY_TAB, STALE_TAB } from "./infra";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence, type WriteOp } from "./studioPersistence";
import type { TabLink } from "./tabLink";
import { WRITER_LOCK, tryLock, type WriterLocks } from "./writerLock";

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

const failureOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { message?: string }) => String(e.message));
const settle = async () => {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
};
const docWrites = (writes: readonly (readonly WriteOp[])[]) => writes.flat().filter((op) => op.type === "put" && op.store === "docs");

async function entryFrom(persistence: StudioPersistence): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  return state.status === "ok" ? { state: state.data as LocalEntry["state"] } : {};
}

async function openTab(persistence: StudioPersistence, locks: WriterLocks | undefined, link?: TabLink) {
  const writes: (readonly WriteOp[])[] = [];
  const own: StudioPersistence = { ...persistence, write: (ops) => (writes.push(ops), persistence.write(ops)), close: () => undefined };
  const entry = await entryFrom(persistence);
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, locks, link) });
  return { studio, writes, projects: async () => (await studio.projects()) as ProjectRepository<PageDoc> };
}

/** 시드: 확정 → 3안(v1) → 닫기(잠금 놓음). 편집 문서는 없다 */
async function seeded() {
  const persistence = createMemoryPersistence();
  const browser = createLockRegistry();
  const lock = browser.tab();
  const tab = await openTab(persistence, lock);
  await (await tab.studio.board()).confirmProfile(1, 0);
  const gen = await tab.studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  await settle();
  lock.close();
  return { persistence, browser };
}

/** 이 탭 메모리·목록·IDB 모두 "문서 없음" */
async function expectNoDoc(projects: ProjectRepository<PageDoc>, persistence: StudioPersistence, writes: readonly (readonly WriteOp[])[]) {
  expect(await projects.getDoc("project-1")).toBeUndefined();
  expect((await projects.listProjects()).find((p) => p.projectId === "project-1")?.hasDoc).toBe(false);
  await settle();
  expect(docWrites(writes)).toEqual([]);
  expect(await persistence.get("docs", "project-1")).toBeUndefined();
}

describe("RS3-AC-01 create 거절 시 메모리·IDB 동일", () => {
  it("다른 탭이 잠금 보유 → INFRA 읽기 전용 사유 · 쓰기 0 → 보유 탭이 쓰지 않고 풀면 다시 시도 = 성공 + IDB 문서 1", async () => {
    const { persistence, browser } = await seeded();
    let release = () => undefined as void;
    void browser.tab().request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>((done) => (release = done)));
    const a = await openTab(persistence, browser.tab());
    const projects = await a.projects();

    expect(await failureOf(projects.startDoc("project-1", 1, "B", "create"))).toBe(`INFRA: 저장 — ${READ_ONLY_TAB}`);
    await expectNoDoc(projects, persistence, a.writes);

    release();
    await settle();
    const started = await projects.startDoc("project-1", 1, "B", "create");
    // 멱등 기록 0이었다 — 재생이 아니라 처음 요청으로 커밋(revision 1)
    expect(started.doc).toMatchObject({ candidateId: "B", revision: 1 });
    expect(checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1")).toMatchObject({ status: "ok", data: { doc: { candidateId: "B", revision: 1 } } });
    expect(docWrites(a.writes)).toHaveLength(1);
  });

  it("보유 탭이 저장(세대 +1)한 뒤 풀면 → 낡은 탭 사유 · 다시 시도해도 쓰기 0", async () => {
    const { persistence, browser } = await seeded();
    const a = await openTab(persistence, browser.tab());
    const projectsA = await a.projects();
    const lockW = browser.tab();
    const w = await openTab(persistence, lockW);
    await (await w.projects()).renameProject("project-1", 1, "W 이름");
    await settle();
    lockW.close();

    expect(await failureOf(projectsA.startDoc("project-1", 1, "B", "create"))).toBe(`INFRA: 저장 — ${STALE_TAB}`);
    expect(await failureOf(projectsA.startDoc("project-1", 1, "B", "create"))).toBe(`INFRA: 저장 — ${STALE_TAB}`);
    await expectNoDoc(projectsA, persistence, a.writes);
  });

  it("Web Locks 없음(unsupported) → 기본 사유 INFRA · 쓰기 0", async () => {
    const { persistence } = await seeded();
    const a = await openTab(persistence, undefined);
    const projects = await a.projects();
    expect(await failureOf(projects.startDoc("project-1", 1, "B", "create"))).toMatch(/^INFRA: 저장 — /);
    await expectNoDoc(projects, persistence, a.writes);
  });
});

describe("RS3-AC-04 같은 탭 잠금 소유 공통", () => {
  it("① 같은 탭 create 성공(writer) → restart → 잠금 재요청 0", async () => {
    const { persistence, browser } = await seeded();
    const tabLock = browser.tab();
    let requests = 0;
    const counted: WriterLocks = { request: (...args) => ((requests += 1), tabLock.request(...args)) };
    const a = await openTab(persistence, counted);
    const projects = await a.projects();
    const { doc } = await projects.startDoc("project-1", 1, "B", "create");
    const after = requests;
    expect(after).toBeGreaterThan(0);
    await projects.startDoc("project-1", 1, "C", "restart", doc.revision);
    expect(requests).toBe(after);
  });

  it("② 비쓰기 탭에서 파괴 흐름이 잠금을 잡았다 놓은 뒤 → 같은 탭 create = 자기 잠금 때문에 거절 0", async () => {
    const { persistence, browser } = await seeded();
    const locks = browser.tab();
    const link = createLinkNetwork().tab();
    const a = await openTab(persistence, locks, link);
    const projects = await a.projects();
    await projects.listProjects();
    const hold = tabLockHold(link, locks);
    expect(await hold.acquire()).toBe(true);
    hold.release();
    await expect(projects.startDoc("project-1", 1, "B", "create")).resolves.toMatchObject({ doc: { candidateId: "B" } });
  });

  it("②-b 파괴 흐름 잠금: 잡은 동안 재요청 = 재사용(true) · 다른 탭은 못 잡음 · 놓고 다시 잡으면 실제로 다시 잡는다", async () => {
    const { browser } = await seeded();
    const locks = browser.tab();
    const link = createLinkNetwork().tab();
    const other = browser.tab();
    const hold = tabLockHold(link, locks);
    expect(await hold.acquire()).toBe(true);
    // 이미 쥐고 있으면 재사용 — Web Locks 재진입 불가라 다시 tryLock 하면 false
    expect(await tabLockHold(link, locks).acquire()).toBe(true);
    hold.release();
    await settle();
    expect(await hold.acquire()).toBe(true);
    // 다시 잡은 잠금이 진짜 잠금인지 — 다른 탭 tryLock 은 실패
    expect(await tryLock(other)).toBeUndefined();
    hold.release();
    await settle();
    const otherRelease = await tryLock(other);
    expect(otherRelease).toBeTypeOf("function");
    otherRelease?.();
  });

  it("②-c 쓰기 탭 파괴 흐름 = 싱크 보유 잠금 재사용(true) · release 뒤에도 같은 탭 쓰기 계속", async () => {
    const { persistence, browser } = await seeded();
    const locks = browser.tab();
    const link = createLinkNetwork().tab();
    const a = await openTab(persistence, locks, link);
    const projects = await a.projects();
    await projects.renameProject("project-1", 1, "쓰기 탭");
    await settle();
    expect(link.own()?.isWriter()).toBe(true);
    const hold = tabLockHold(link, locks);
    expect(await hold.acquire()).toBe(true);
    hold.release();
    await settle();
    expect(await tryLock(browser.tab())).toBeUndefined();
    await expect(projects.startDoc("project-1", 1, "B", "create")).resolves.toMatchObject({ doc: { candidateId: "B" } });
  });

  it("③ 쓰기 탭 파괴 흐름 실패(싱크 멈춤) 뒤 create → 지워짐 사유(새로고침 안내) · 쓰기 0", async () => {
    const { persistence, browser } = await seeded();
    const locks = browser.tab();
    const link = createLinkNetwork().tab();
    const a = await openTab(persistence, locks, link);
    const projects = await a.projects();
    await projects.renameProject("project-1", 1, "쓰기 탭");
    await settle();
    expect(link.own()?.isWriter()).toBe(true);
    tabLockHold(link, locks).stop();
    const before = docWrites(a.writes).length;
    expect(await failureOf(projects.startDoc("project-1", 1, "B", "create"))).toBe(`INFRA: 저장 — ${CLEARED_TAB}`);
    expect(await projects.getDoc("project-1")).toBeUndefined();
    await settle();
    expect(docWrites(a.writes)).toHaveLength(before);
  });

  it("프로필·/projects 흐름 코드에서 tryLock 직접 호출 0(파괴 흐름 공유 tabLockHold만)", () => {
    const files = ["../../features/profile/restartFlow.ts", "../../features/profile/RestartDialog.tsx", "../../features/profile/CandidatesSection.tsx", "../../components/projects/ProjectRow.tsx"];
    for (const file of files) expect(readFileSync(new URL(file, import.meta.url), "utf8")).not.toMatch(/tryLock/);
  });
});
