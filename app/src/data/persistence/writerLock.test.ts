/**
 * P1C-D2 다중 탭 쓰기 잠금 + 최신성 확인 (P1C-SPEC 1.5 · AC-C01·C02·C14 · MQ-C2 A 먼저 편집한 탭 · MQ-C3 A steal 없음).
 * 브라우저 1개 = 메모리 가짜 영속 1개 + 잠금 가짜 registry 1개. 탭 = 진입 읽기(그 시점 레코드) + 자기 잠금 핸들 + 자기 쓰기 기록.
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
import { toInfra } from "./infra";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence, type WriteOp } from "./studioPersistence";
import { WRITER_LOCK, type WriterLocks } from "./writerLock";

const READ_ONLY = "다른 탭에서 편집 중입니다 — 이 탭의 변경은 저장하지 않습니다";
const STALE = "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요";

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
const savedDoc = async (persistence: StudioPersistence) => (checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1") as { data: { doc: PageDoc } }).data.doc;
const generationOf = async (persistence: StudioPersistence) => (await persistence.get("meta", "generation")) as { data?: unknown } | undefined;

/** 탭 1개 — 진입(이 시점 레코드 읽기) · 자기 잠금 핸들 · 자기 쓰기 기록 */
async function openTab(persistence: StudioPersistence, locks: WriterLocks | undefined, projectId?: string) {
  const writes: (readonly WriteOp[])[] = [];
  const own: StudioPersistence = { ...persistence, write: (ops) => (writes.push(ops), persistence.write(ops)), close: () => undefined };
  const entry = await entryFrom(persistence, projectId);
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, locks) });
  return { studio, writes, projects: async () => (await studio.projects()) as ProjectRepository<PageDoc> };
}

/** 시드 탭: 확정 → 3안 → B안 편집 시작 → 저장 → 닫기(잠금 놓음) */
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

describe("쓰기 잠금 — 먼저 편집한 탭이 쓰기 탭 (AC-C14 · AC-C01)", () => {
  it("진입만 한 탭은 잠금을 잡지 않고, 먼저 편집한 B가 저장 · 뒤에 편집한 A는 쓰기 0 + 읽기 전용 사유", async () => {
    const { persistence, browser } = await seeded();
    const lockA = browser.tab();
    const lockB = browser.tab();
    const a = await openTab(persistence, lockA, "project-1");
    const b = await openTab(persistence, lockB, "project-1");
    const docA = (await (await a.projects()).getDoc("project-1"))!;
    const docB = (await (await b.projects()).getDoc("project-1"))!;
    await settle();
    expect(browser.held()).toEqual([]);

    const savedB = await (await b.projects()).saveDoc("project-1", docB.revision, edit(docB, "B가 먼저"));
    expect(browser.held()).toEqual([WRITER_LOCK]);
    expect(browser.holder(WRITER_LOCK)).toBe(lockB);

    const projectsA = await a.projects();
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision, edit(docA, "A가 나중")))).toBe(`INFRA: 저장 — ${READ_ONLY}`);
    expect(a.writes).toEqual([]);
    expect(await savedDoc(persistence)).toEqual(savedB);
    // 편집은 메모리에서 계속 된다
    expect((await projectsA.getDoc("project-1"))?.meta.title).toBe("A가 나중");
    expect(browser.holder(WRITER_LOCK)).toBe(lockB);
  });

  it("읽기 전용 탭의 상태 쓰기(이름 바꾸기)도 쓰기 0", async () => {
    const { persistence, browser } = await seeded();
    const b = await openTab(persistence, browser.tab(), "project-1");
    const a = await openTab(persistence, browser.tab(), "project-1");
    const projectsB = await b.projects();
    const docB = (await projectsB.getDoc("project-1"))!;
    await projectsB.saveDoc("project-1", docB.revision, edit(docB, "B 저장"));
    const projectsA = await a.projects();
    await projectsA.renameProject("project-1", (await projectsA.getProject("project-1"))!.revision, "A의 이름");
    await settle();
    expect(a.writes).toEqual([]);
  });
});

describe("최신성 확인 — 세대 번호 (AC-C02 · BRIEF 회귀)", () => {
  it("탭A 진입 → 탭B 진입·편집·저장·닫기 → 탭A 편집 = 쓰기 0 · 낡은 탭 사유 · 잠금을 놓는다", async () => {
    const { persistence, browser } = await seeded();
    const lockA = browser.tab();
    const a = await openTab(persistence, lockA, "project-1");
    const docA = (await (await a.projects()).getDoc("project-1"))!;

    const lockB = browser.tab();
    const b = await openTab(persistence, lockB, "project-1");
    const projectsB = await b.projects();
    const docB = (await projectsB.getDoc("project-1"))!;
    const savedB = await projectsB.saveDoc("project-1", docB.revision, edit(docB, "B 저장 후 닫음"));
    await settle();
    lockB.close();

    const projectsA = await a.projects();
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision, edit(docA, "A 낡은 편집")))).toBe(`INFRA: 저장 — ${STALE}`);
    expect(a.writes).toEqual([]);
    expect(await savedDoc(persistence)).toEqual(savedB);
    expect(browser.held()).toEqual([]);
    // 다시 저장해도 낡은 탭 그대로(새로고침 전까지)
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision + 1, edit(docA, "A 다시")))).toBe(`INFRA: 저장 — ${STALE}`);
    expect(a.writes).toEqual([]);

    // A 새로고침 → B의 마지막 저장이 보이고, 그 뒤 편집 저장 성공
    lockA.close();
    const reloaded = await openTab(persistence, browser.tab(), "project-1");
    const projectsR = await reloaded.projects();
    expect(await projectsR.getDoc("project-1")).toEqual(savedB);
    const next = await projectsR.saveDoc("project-1", savedB.revision, edit(savedB as PageDoc, "새로고침 뒤"));
    expect(await savedDoc(persistence)).toEqual(next);
  });

  it("AC-C02: 읽기 전용 B → 쓰기 탭 A 닫힘 → B 다시 저장 = 잠금은 잡히지만 최신성 실패로 쓰기 0 · 낡은 탭 사유", async () => {
    const { persistence, browser } = await seeded();
    const lockA = browser.tab();
    const a = await openTab(persistence, lockA, "project-1");
    const b = await openTab(persistence, browser.tab(), "project-1");
    const projectsA = await a.projects();
    const docA = (await projectsA.getDoc("project-1"))!;
    const savedA = await projectsA.saveDoc("project-1", docA.revision, edit(docA, "A 저장"));
    const projectsB = await b.projects();
    const docB = (await projectsB.getDoc("project-1"))!;
    const editedB = edit(docB, "B 편집");
    expect(await failureOf(projectsB.saveDoc("project-1", docB.revision, editedB))).toBe(`INFRA: 저장 — ${READ_ONLY}`);
    lockA.close();
    const current = (await projectsB.getDoc("project-1"))!;
    expect(await failureOf(projectsB.saveDoc("project-1", current.revision, current as PageDoc))).toBe(`INFRA: 저장 — ${STALE}`);
    expect(b.writes).toEqual([]);
    expect(await savedDoc(persistence)).toEqual(savedA);
    expect(browser.held()).toEqual([]);
  });

  it("잠금이 풀린 뒤 다시 저장 — 그 사이 쓰기가 없었으면 최신성 통과 → 저장", async () => {
    const { persistence, browser } = await seeded();
    const other = browser.tab();
    let release = () => undefined as void;
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>((done) => (release = done)));
    const a = await openTab(persistence, browser.tab(), "project-1");
    const projectsA = await a.projects();
    const docA = (await projectsA.getDoc("project-1"))!;
    const editedA = edit(docA, "A 편집");
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision, editedA))).toBe(`INFRA: 저장 — ${READ_ONLY}`);
    release();
    await settle();
    const current = (await projectsA.getDoc("project-1"))!;
    await projectsA.saveDoc("project-1", current.revision, current as PageDoc);
    expect((await savedDoc(persistence)).meta.title).toBe("A 편집");
  });

  it("다른 탭이 지운 뒤(상태 레코드 없음) 편집 = 쓰기 0 · 낡은 탭 사유(지운 데이터 부활 0)", async () => {
    const { persistence, browser } = await seeded();
    const a = await openTab(persistence, browser.tab(), "project-1");
    const projectsA = await a.projects();
    const docA = (await projectsA.getDoc("project-1"))!;
    await persistence.write([
      { type: "delete", store: "studio", id: "state" },
      { type: "delete", store: "docs", id: "project-1" },
      { type: "delete", store: "meta", id: "generation" },
    ]);
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision, edit(docA, "부활 시도")))).toBe(`INFRA: 저장 — ${STALE}`);
    expect(a.writes).toEqual([]);
    expect(await persistence.get("studio", "state")).toBeUndefined();
  });

  it("세대 번호: 쓰기 커밋마다 meta generation +1 · 상태 레코드 gen이 같은 값", async () => {
    const { persistence, browser } = await seeded();
    const before = (await generationOf(persistence))?.data as number;
    expect(before).toBeGreaterThan(0);
    const a = await openTab(persistence, browser.tab(), "project-1");
    const projectsA = await a.projects();
    const docA = (await projectsA.getDoc("project-1"))!;
    await projectsA.saveDoc("project-1", docA.revision, edit(docA, "세대"));
    await settle();
    expect((await generationOf(persistence))?.data).toBe(before + a.writes.length);
    expect((checkEnvelope(await persistence.get("studio", "state"), "state", "state") as { data: { gen?: number } }).data.gen).toBe(before + a.writes.length);
  });
});

/** 실패 주입 래퍼 — gate.fail이면 쓰기 트랜잭션 reject(IDB QuotaExceeded처럼) */
function flaky(persistence: StudioPersistence) {
  const gate = { fail: false };
  const wrapped: StudioPersistence = {
    ...persistence,
    write: (ops) => (gate.fail ? Promise.reject(toInfra(new DOMException("x", "QuotaExceededError"), "저장")) : persistence.write(ops)),
  };
  return { gate, wrapped };
}
const opsGen = (ops: readonly WriteOp[]) => {
  const put = (store: string, id: string) => ops.find((op) => op.type === "put" && op.store === store && op.record.id === id) as Extract<WriteOp, { type: "put" }> | undefined;
  return { meta: (put("meta", "generation")?.record as { data?: unknown } | undefined)?.data, state: (put("studio", "state")?.record as { data?: { gen?: unknown } } | undefined)?.data?.gen };
};

describe("재시도 커밋도 세대 +1 (Codex r1 P1)", () => {
  it("문서 저장 실패 → 상태 저장(이름 변경) 성공 → 문서 재시도: 재시도 커밋이 새 generation·같은 상태 gen을 함께 쓴다 → 사이에 진입한 탭은 낡음", async () => {
    const { persistence, browser } = await seeded();
    const { gate, wrapped } = flaky(persistence);
    const lockA = browser.tab();
    const a = await openTab(wrapped, lockA, "project-1");
    const projectsA = await a.projects();
    const docA = (await projectsA.getDoc("project-1"))!;
    const edited = edit(docA, "재시도할 문서");
    gate.fail = true;
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision, edited))).toMatch(/^INFRA: /);
    gate.fail = false;
    await projectsA.renameProject("project-1", (await projectsA.getProject("project-1"))!.revision, "이름 바꿈");
    await settle();
    const before = (await generationOf(persistence))?.data as number;

    // 상태 저장과 문서 재시도 사이에 진입한 탭 B — 옛 문서·세대 before를 읽는다
    const lockB = browser.tab();
    const b = await openTab(persistence, lockB, "project-1");

    const retried = await projectsA.saveDoc("project-1", docA.revision, edited);
    await settle();
    const last = a.writes[a.writes.length - 1]!;
    expect(last.some((op) => op.store === "docs")).toBe(true);
    expect(opsGen(last)).toEqual({ meta: before + 1, state: before + 1 });
    expect((await generationOf(persistence))?.data).toBe(before + 1);
    expect(await savedDoc(persistence)).toEqual(retried);

    // A 닫힘 → B 편집 = 최신성 실패(재시도된 문서를 덮지 않는다)
    lockA.close();
    const projectsB = await b.projects();
    const docB = (await projectsB.getDoc("project-1"))!;
    expect(await failureOf(projectsB.saveDoc("project-1", docB.revision, edit(docB, "B가 덮기")))).toBe(`INFRA: 저장 — ${STALE}`);
    expect(b.writes).toEqual([]);
    expect(await savedDoc(persistence)).toEqual(retried);
  });

  it("불변식: 실패·재시도·상태 저장이 섞여도 쓰기 트랜잭션마다 meta generation이 직전보다 크고 상태 gen과 같다", async () => {
    const { persistence, browser } = await seeded();
    const { gate, wrapped } = flaky(persistence);
    const a = await openTab(wrapped, browser.tab(), "project-1");
    const projectsA = await a.projects();
    const docA = (await projectsA.getDoc("project-1"))!;
    const first = edit(docA, "첫 편집");
    const rename = async (name: string) => projectsA.renameProject("project-1", (await projectsA.getProject("project-1"))!.revision, name);
    gate.fail = true;
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision, first))).toMatch(/^INFRA: /);
    await rename("실패 중 이름");
    await settle();
    gate.fail = false;
    await rename("성공 이름");
    await settle();
    await projectsA.saveDoc("project-1", docA.revision, first);
    await settle();
    // 재시도할 것이 없는 재생도 포함
    await projectsA.saveDoc("project-1", docA.revision, first);
    await settle();

    expect(a.writes.length).toBeGreaterThanOrEqual(4);
    const gens = a.writes.map(opsGen);
    gens.forEach((g) => {
      expect(typeof g.meta).toBe("number");
      expect(g.state).toBe(g.meta);
    });
    gens.slice(1).forEach((g, i) => expect(g.meta as number).toBeGreaterThan(gens[i]!.meta as number));
  });
});

describe("navigator.locks 미지원 — 읽기 전용(SPEC 1.5 · THREATS T5)", () => {
  it("잠금 API가 없으면 저장 = INFRA · 쓰기 0", async () => {
    const { persistence } = await seeded();
    const a = await openTab(persistence, undefined, "project-1");
    const projectsA = await a.projects();
    const docA = (await projectsA.getDoc("project-1"))!;
    expect(await failureOf(projectsA.saveDoc("project-1", docA.revision, edit(docA, "잠금 없음")))).toMatch(/^INFRA: 저장 — /);
    expect(a.writes).toEqual([]);
  });
});
