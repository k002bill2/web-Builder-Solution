/**
 * P1C-D4 지우기 · 탭 간 알림 × 싱크 (P1C-SPEC 1.5 · 1.6 · AC-C04·C06) — writerLock.test와 같은 브라우저 가짜(영속 1 · 잠금 registry 1) + 알림 network 1.
 * 탭 = 진입 읽기 + 자기 잠금 핸들 + 자기 알림 링크 + 자기 쓰기 기록.
 */
import { describe, expect, it, vi } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { createLockRegistry } from "./fakeLocks";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence, type WriteOp } from "./studioPersistence";
import { type WriterLocks } from "./writerLock";
import { createLinkNetwork } from "./fakeTabLink";
import type { TabLink } from "./tabLink";
import { createClearer } from "../../features/projects/clearBrowserData";


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
/** ProjectRepositoryError 메시지 = "코드: 내용" */
const failureOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { message?: string }) => String(e.message));
const settle = async () => {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
};

async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}

/** 탭 1개 — 진입(이 시점 레코드 읽기) · 자기 잠금 핸들 · 자기 쓰기 기록 */
async function openTab(persistence: StudioPersistence, locks: WriterLocks | undefined, link: TabLink, projectId?: string) {
  const writes: (readonly WriteOp[])[] = [];
  const own: StudioPersistence = { ...persistence, write: (ops) => (writes.push(ops), persistence.write(ops)), close: () => undefined };
  const entry = await entryFrom(persistence, projectId);
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, locks, link) });
  return { studio, writes, projects: async () => (await studio.projects()) as ProjectRepository<PageDoc> };
}

/** 시드 탭: 확정 → 3안 → B안 편집 시작 → 저장 → 닫기(잠금 놓음) */
async function seeded() {
  const persistence = createMemoryPersistence();
  const browser = createLockRegistry();
  const lock = browser.tab();
  const net = createLinkNetwork();
  const tab = await openTab(persistence, lock, net.tab());
  await (await tab.studio.board()).confirmProfile(1, 0);
  const gen = await tab.studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = await tab.projects();
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  await projects.saveDoc("project-1", doc.revision, edit(doc, "시드"));
  await settle();
  lock.close();
  return { persistence, browser, net };
}

const CLEARED = "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요";
type Req = { onsuccess?: () => void; onblocked?: () => void; onerror?: () => void };
function deleter() {
  const requests: Req[] = [];
  const factory = { deleteDatabase: () => (requests.push({}), requests[requests.length - 1]) } as unknown as IDBFactory;
  return { factory, requests };
}

describe("같은 탭 쓰기 탭에서 지우기 (BRIEF 필수 — D2 함정 회귀)", () => {
  it("편집(잠금 보유) → 앱 안 /projects → 지우기 = 보유 잠금 안에서 진행(거짓 '다른 탭 편집 중' 0) · 싱크 멈춤 → 이후 저장 쓰기 0 + 지워짐 사유", async () => {
    const { persistence, browser, net } = await seeded();
    const lock = browser.tab();
    const link = net.tab();
    const tab = await openTab(persistence, lock, link, "project-1");
    const projects = await tab.projects();
    const doc = (await projects.getDoc("project-1"))!;
    const saved = await projects.saveDoc("project-1", doc.revision, edit(doc, "이 탭이 쓰기 탭"));
    await settle();
    expect(browser.holder("design-studio-writer")).toBe(lock);
    expect(link.own()?.isWriter()).toBe(true);

    // 같은 탭(같은 잠금 핸들·링크)의 /projects 영역에서 지우기
    const { factory, requests } = deleter();
    const go = vi.fn();
    const result = createClearer({ locks: lock, factory, link, session: { setItem: vi.fn() }, go }).clear();
    await settle();
    expect(requests).toHaveLength(1);
    requests[0]!.onsuccess?.();
    expect(await result).toBe("done");
    expect(go).toHaveBeenCalledWith("/projects");

    // 멈춘 싱크는 쓰지 않는다(새로고침 이동 전 남은 메모리 쓰기 0)
    const before = tab.writes.length;
    expect(await failureOf(projects.saveDoc("project-1", saved.revision, edit(saved as PageDoc, "지운 뒤")))).toBe(`INFRA: 저장 — ${CLEARED}`);
    await settle();
    expect(tab.writes.length).toBe(before);
    expect(link.own()?.isWriter()).toBe(false);
  });

  it("다른 탭이 쓰기 탭이면 지우기 = busy (AC-C04)", async () => {
    const { persistence, browser, net } = await seeded();
    const b = await openTab(persistence, browser.tab(), net.tab(), "project-1");
    const projectsB = await b.projects();
    const docB = (await projectsB.getDoc("project-1"))!;
    await projectsB.saveDoc("project-1", docB.revision, edit(docB, "B 편집 중"));
    await settle();
    const { factory, requests } = deleter();
    expect(await createClearer({ locks: browser.tab(), factory, link: net.tab(), session: { setItem: vi.fn() }, go: vi.fn() }).clear()).toBe("busy");
    expect(requests).toHaveLength(0);
    expect(net.sent()).not.toContainEqual({ type: "cleared" });
  });
});
