/**
 * RESTART SPEC r1 MQ-S2 ★A — restart만 `docs.start` 전에 쓰기 잠금 확인(RS-AC-08·08b·08c).
 * 잠금을 못 잡으면(readonly·stale) INFRA로 던지고 메모리 문서·스냅샷·멱등 기록·IDB 쓰기 모두 0(갈라짐 0).
 * 잠금을 잡은 뒤의 flush 실패는 커밋 뒤 미확인 — 같은 인자 재시도 = 멱등 재생으로 flush 재제출.
 * 브라우저 1개 = 메모리 가짜 영속 1개 + 잠금 가짜 registry 1개(writerLock.test.ts와 같은 모양).
 */
import { describe, expect, it } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { createLockRegistry } from "./fakeLocks";
import { READ_ONLY_TAB, STALE_TAB, toInfra } from "./infra";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence, type WriteOp } from "./studioPersistence";
import { WRITER_LOCK, type WriterLocks } from "./writerLock";

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
const failureOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { message?: string }) => String(e.message));
const settle = async () => {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
};

async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}
type SavedRecord = { doc: PageDoc; snapshots: readonly { snapshotId: string; reason?: string; name: string; doc: PageDoc }[] };
const savedRecord = async (persistence: StudioPersistence) => (checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1") as { data: SavedRecord }).data;

async function openTab(persistence: StudioPersistence, locks: WriterLocks | undefined, projectId?: string) {
  const writes: (readonly WriteOp[])[] = [];
  const own: StudioPersistence = { ...persistence, write: (ops) => (writes.push(ops), persistence.write(ops)), close: () => undefined };
  const entry = await entryFrom(persistence, projectId);
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, locks) });
  return { studio, writes, projects: async () => (await studio.projects()) as ProjectRepository<PageDoc> };
}

/** 시드: 확정 → 3안(v1) → B안 편집 시작 → 저장 → 닫기(잠금 놓음) */
async function seeded() {
  const persistence = createMemoryPersistence();
  const browser = createLockRegistry();
  const lock = browser.tab();
  const tab = await openTab(persistence, lock);
  await (await tab.studio.board()).confirmProfile(1, 0);
  const gen = await tab.studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = await tab.projects();
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  await projects.saveDoc("project-1", doc.revision, edit(doc, "시드"));
  await settle();
  lock.close();
  return { persistence, browser };
}

function flaky(persistence: StudioPersistence) {
  const gate = { fail: false };
  const wrapped: StudioPersistence = {
    ...persistence,
    write: (ops) => (gate.fail ? Promise.reject(toInfra(new DOMException("x", "QuotaExceededError"), "저장")) : persistence.write(ops)),
  };
  return { gate, wrapped };
}

describe("RS-AC-08 restart 전 잠금 확인 (MQ-S2 ★A)", () => {
  it("다른 탭이 잠금 보유 → INFRA 읽기 전용 사유 · 메모리 문서·스냅샷 변화 0 · IDB 쓰기 0 → 보유 탭이 쓰지 않고 풀면 같은 인자 다시 시도 = 성공", async () => {
    const { persistence, browser } = await seeded();
    const other = browser.tab();
    let release = () => undefined as void;
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>((done) => (release = done)));
    const a = await openTab(persistence, browser.tab(), "project-1");
    const projects = await a.projects();
    const before = (await projects.getDoc("project-1"))!;
    const snapshotsBefore = await projects.listSnapshots("project-1");

    expect(await failureOf(projects.startDoc("project-1", 1, "C", "restart", before.revision))).toBe(`INFRA: 저장 — ${READ_ONLY_TAB}`);
    expect(await projects.getDoc("project-1")).toEqual(before);
    expect(await projects.listSnapshots("project-1")).toEqual(snapshotsBefore);
    await settle();
    expect(a.writes).toEqual([]);
    expect((await savedRecord(persistence)).doc).toEqual(before);

    release();
    await settle();
    const started = await projects.startDoc("project-1", 1, "C", "restart", before.revision);
    expect(started.doc).toMatchObject({ candidateId: "C", revision: before.revision + 1 });
    const record = await savedRecord(persistence);
    expect(record.doc).toMatchObject({ candidateId: "C", revision: before.revision + 1 });
    expect(record.snapshots.map((s) => [s.reason, s.name, s.doc.candidateId, s.doc.revision])).toEqual([["restart", "새로 시작 전", "B", before.revision]]);
  });

  it("보유 탭이 저장(세대 +1)한 뒤 풀면 → 낡은 탭 사유 · 다시 시도해도 쓰기 0(새로고침 전까지)", async () => {
    const { persistence, browser } = await seeded();
    const a = await openTab(persistence, browser.tab(), "project-1");
    const projectsA = await a.projects();
    const before = (await projectsA.getDoc("project-1"))!;

    const lockW = browser.tab();
    const w = await openTab(persistence, lockW, "project-1");
    const projectsW = await w.projects();
    const docW = (await projectsW.getDoc("project-1"))!;
    const savedW = await projectsW.saveDoc("project-1", docW.revision, edit(docW, "W 저장 후 닫음"));
    await settle();
    lockW.close();

    expect(await failureOf(projectsA.startDoc("project-1", 1, "C", "restart", before.revision))).toBe(`INFRA: 저장 — ${STALE_TAB}`);
    expect(await failureOf(projectsA.startDoc("project-1", 1, "C", "restart", before.revision))).toBe(`INFRA: 저장 — ${STALE_TAB}`);
    expect(await projectsA.getDoc("project-1")).toEqual(before);
    expect(await projectsA.listSnapshots("project-1")).toEqual([]);
    await settle();
    expect(a.writes).toEqual([]);
    expect((await savedRecord(persistence)).doc).toEqual(savedW);
  });

  it("create는 그대로(MQ-S2 C 범위 밖) — 잠금 확인을 하지 않고 DOC_EXISTS 판정", async () => {
    const { persistence, browser } = await seeded();
    const other = browser.tab();
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>(() => undefined));
    const a = await openTab(persistence, browser.tab(), "project-1");
    const projects = await a.projects();
    await expect(projects.startDoc("project-1", 1, "C", "create")).rejects.toMatchObject({ code: "DOC_EXISTS" });
  });
});

describe("RS4-AC-15 create 가드 — 메모리에 문서 없을 때만 커밋 전에 잠금 확인(SPEC-4 r0.3a · MQ-3-2 A)", () => {
  /** 확정 → 3안까지만(편집 문서 없음) → 닫기 */
  async function docless() {
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

  it("다른 탭 잠금 + 문서 없는 프로젝트 create → READ_ONLY_TAB · 메모리 문서 0 · IDB 쓰기 0 · 보유 탭이 놓으면 다시 시도 성공", async () => {
    const { persistence, browser } = await docless();
    const other = browser.tab();
    let release!: () => void;
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>((ok) => (release = ok)));
    const a = await openTab(persistence, browser.tab());
    const projects = await a.projects();
    expect(await failureOf(projects.startDoc("project-1", 1, "B", "create"))).toBe(`INFRA: 저장 — ${READ_ONLY_TAB}`);
    expect(await projects.getDoc("project-1")).toBeUndefined();
    await settle();
    expect(a.writes).toEqual([]);
    release();
    other.close();
    await settle();
    expect(await failureOf(projects.startDoc("project-1", 1, "B", "create"))).toBe("ok");
    expect((await savedRecord(persistence)).doc.candidateId).toBe("B");
  });
});

describe("RS-AC-08b 커밋 뒤 미확인 — 잠금 획득 뒤 flush INFRA", () => {
  it("flush 실패 → 메모리 = 새 문서 · IDB = 옛 문서 → 같은 인자 다시 시도 = 멱등 재생으로 flush 재제출 → IDB = 새 문서 + '새로 시작 전'", async () => {
    const { persistence, browser } = await seeded();
    const { gate, wrapped } = flaky(persistence);
    const tab = await openTab(wrapped, browser.tab(), "project-1");
    const projects = await tab.projects();
    const before = (await projects.getDoc("project-1"))!;
    gate.fail = true;
    expect(await failureOf(projects.startDoc("project-1", 1, "C", "restart", before.revision))).toMatch(/^INFRA: /);
    expect(await projects.getDoc("project-1")).toMatchObject({ candidateId: "C", revision: before.revision + 1 });
    expect((await savedRecord(persistence)).doc).toEqual(before);

    gate.fail = false;
    const replay = await projects.startDoc("project-1", 1, "C", "restart", before.revision);
    expect(replay.doc).toMatchObject({ candidateId: "C", revision: before.revision + 1 });
    const record = await savedRecord(persistence);
    expect(record.doc).toMatchObject({ candidateId: "C", revision: before.revision + 1 });
    expect(record.snapshots.map((s) => [s.reason, s.name, s.doc.candidateId])).toEqual([["restart", "새로 시작 전", "B"]]);
  });
});

describe("RS-AC-08c ① 직전 저장 flush 성공 → 스냅샷 = 그 revision", () => {
  it("저장 두 번 뒤 restart → '새로 시작 전' = 마지막 저장 문서(revision·hash·updatedAt) — 저장 안 된 화면 편집은 저장소가 모른다", async () => {
    const { persistence, browser } = await seeded();
    const tab = await openTab(persistence, browser.tab(), "project-1");
    const projects = await tab.projects();
    const first = (await projects.getDoc("project-1"))!;
    const saved = await projects.saveDoc("project-1", first.revision, edit(first, "마지막 저장"));
    // 저장되지 않은 화면 편집(이탈로 버려진 경우)은 저장소에 오지 않는다 — restart는 저장된 revision을 기준으로 한다
    await projects.startDoc("project-1", 1, "C", "restart", saved.revision);
    const [snapshot] = await projects.listSnapshots("project-1");
    expect(snapshot).toMatchObject({ reason: "restart", name: "새로 시작 전", hash: saved.hash, doc: { revision: saved.revision } });
    expect((await savedRecord(persistence)).snapshots[0]!.doc.updatedAt).toBe(saved.updatedAt);
  });
});

/** 조건이 참이 될 때까지 매크로태스크를 넘긴다(청크 로드·flush 대기) */
const until = async (check: () => Promise<boolean>) => {
  for (let i = 0; i < 100 && !(await check()); i += 1) await new Promise((r) => setTimeout(r, 0));
};

describe("RS-AC-08c (r2 · Codex P2-5) 스냅샷 = 이 탭 저장소 문서 — 브라우저 저장 상태와 무관", () => {
  it("② 직전 저장 flush 진행 중(delay) → 스냅샷 = 메모리 최신 revision · restart flush가 뒤에 이어져 IDB 최종 = 새 문서 + 그 스냅샷", async () => {
    const { persistence, browser } = await seeded();
    const hold: { wait?: Promise<void> } = {};
    const delayed: StudioPersistence = { ...persistence, write: async (ops) => (await hold.wait, persistence.write(ops)) };
    const tab = await openTab(delayed, browser.tab(), "project-1");
    const projects = await tab.projects();
    const first = (await projects.getDoc("project-1"))!;
    let release = () => undefined as void;
    hold.wait = new Promise<void>((r) => (release = r));
    const saving = projects.saveDoc("project-1", first.revision, edit(first, "진행 중 저장"));
    await until(async () => (await projects.getDoc("project-1"))!.revision > first.revision);
    const now = (await projects.getDoc("project-1"))!;
    expect(now.revision).toBe(first.revision + 1);
    expect((await savedRecord(persistence)).doc.revision).toBe(first.revision);
    const restarting = projects.startDoc("project-1", 1, "C", "restart", now.revision);
    release();
    hold.wait = undefined;
    await saving;
    await restarting;
    const record = await savedRecord(persistence);
    expect(record.doc).toMatchObject({ candidateId: "C", revision: now.revision + 1 });
    expect(record.snapshots.filter((s) => s.reason === "restart").map((s) => [s.doc.revision, s.doc.hash])).toEqual([[now.revision, now.hash]]);
  });

  it("③ 직전 저장 flush 실패(quota — IDB r1 · 메모리 r2) → 스냅샷 = r2 · restart flush 성공 시 IDB에 r2 스냅샷이 처음 저장 / 실패 시 INFRA(화면 R-E4) · 메모리 = 새 문서", async () => {
    for (const restartFails of [false, true]) {
      const { persistence, browser } = await seeded();
      const { gate, wrapped } = flaky(persistence);
      const tab = await openTab(wrapped, browser.tab(), "project-1");
      const projects = await tab.projects();
      const first = (await projects.getDoc("project-1"))!;
      gate.fail = true;
      expect(await failureOf(projects.saveDoc("project-1", first.revision, edit(first, "quota")))).toMatch(/^INFRA: /);
      const r2 = (await projects.getDoc("project-1"))!;
      expect([r2.revision, (await savedRecord(persistence)).doc.revision]).toEqual([first.revision + 1, first.revision]);
      gate.fail = restartFails;
      const result = await failureOf(projects.startDoc("project-1", 1, "C", "restart", r2.revision));
      const [snapshot] = (await projects.listSnapshots("project-1")).filter((s) => s.reason === "restart");
      expect(snapshot).toMatchObject({ hash: r2.hash, doc: { revision: r2.revision } });
      expect(await projects.getDoc("project-1")).toMatchObject({ candidateId: "C", revision: r2.revision + 1 });
      const record = await savedRecord(persistence);
      if (restartFails) {
        expect(result).toMatch(/^INFRA: /);
        expect(record.doc.revision).toBe(first.revision);
      } else {
        expect(result).toBe("ok");
        expect(record.snapshots.filter((s) => s.reason === "restart").map((s) => s.doc.revision)).toEqual([r2.revision]);
      }
    }
  });
});
