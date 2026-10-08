/**
 * P1C-D5 첫 저장 1회 안내 (P1C-SPEC 1.4 · AC-C11) — 판정 = IDB `meta` 키 `firstSaveNotice`.
 * 키 쓰기는 확정 상태 쓰기 뒤 별도 제출(쓰기 큐 경유 — 트랜잭션마다 세대 +1 불변식 유지) · 실패해도 확정 성공(다음 확정에 한 번 더) ·
 * 지우기(빈 DB) 뒤 다시 안내 · 읽기 전용·지워짐 탭·memory(강등)는 안내 0·쓰기 0.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { createLockRegistry, soloLocks } from "./fakeLocks";
import { createLinkNetwork } from "./fakeTabLink";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type StudioPersistence, type WriteOp } from "./studioPersistence";
import type { TabLink } from "./tabLink";
import type { WriterLocks } from "./writerLock";

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

const NOTICE = "firstSaveNotice";
afterEach(() => vi.useRealTimers());
const isNotice = (op: WriteOp) => op.type === "put" && op.store === "meta" && op.record.id === NOTICE;
const genOf = (ops: readonly WriteOp[]) => (ops.find((op) => op.type === "put" && op.store === "meta" && op.record.id === "generation") as { record: { data: number } } | undefined)?.record.data;
const stateGenOf = (ops: readonly WriteOp[]) => (ops.find((op) => op.type === "put" && op.store === "studio") as { record: { data: { gen: number } } } | undefined)?.record.data.gen;

async function entryFrom(persistence: StudioPersistence): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  return state.status === "ok" ? { state: state.data as LocalEntry["state"] } : {};
}

/** 탭 1개 — failNotice = 안내 키를 담은 트랜잭션만 실패(쿼터 등) */
function tabOf(persistence: StudioPersistence, failNotice = false) {
  const writes: (readonly WriteOp[])[] = [];
  const own: StudioPersistence = {
    ...persistence,
    write: (ops) => (writes.push(ops), failNotice && ops.some(isNotice) ? Promise.reject(new Error("QuotaExceededError")) : persistence.write(ops)),
    close: () => undefined,
  };
  return { own, writes };
}

async function openSync(persistence: StudioPersistence, { locks = soloLocks() as WriterLocks, link = createLinkNetwork().tab() as TabLink, failNotice = false } = {}) {
  const { own, writes } = tabOf(persistence, failNotice);
  const sync = await openLocalSync(await entryFrom(persistence), async () => own, locks, link);
  return { sync, writes };
}

async function openStudio(persistence: StudioPersistence, failNotice = false) {
  const { own, writes } = tabOf(persistence, failNotice);
  const entry = await entryFrom(persistence);
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, soloLocks(), createLinkNetwork().tab()) });
  return { studio, writes };
}

describe("LocalSync.firstSave — 1회 판정(meta firstSaveNotice)", () => {
  it("빈 DB → true · 안내 키를 쓰기 큐로 제출(같은 트랜잭션에 세대 +1 도장) · 두 번째는 false · 쓰기 그대로", async () => {
    const persistence = createMemoryPersistence();
    const { sync, writes } = await openSync(persistence);
    expect(await sync.firstSave()).toBe(true);
    await settle();
    expect(writes).toHaveLength(1);
    const [ops] = writes as [readonly WriteOp[]];
    expect(ops.filter(isNotice)).toHaveLength(1);
    expect(genOf(ops)).toBe(1);
    expect(stateGenOf(ops)).toBe(1);
    expect(checkEnvelope(await persistence.get("meta", NOTICE), NOTICE, NOTICE)).toEqual({ status: "ok", data: true });
    expect(await sync.firstSave()).toBe(false);
    await settle();
    expect(writes).toHaveLength(1);
  });

  it("이미 안내한 브라우저의 새 탭 → false · 쓰기 0", async () => {
    const persistence = createMemoryPersistence();
    const first = await openSync(persistence);
    await first.sync.firstSave();
    await settle();
    const second = await openSync(persistence);
    expect(await second.sync.firstSave()).toBe(false);
    await settle();
    expect(second.writes).toHaveLength(0);
  });

  it("안내 키 put 실패 → 여전히 true(reject 0) · 키 없음 · 다음 호출에 다시 true", async () => {
    const persistence = createMemoryPersistence();
    const { sync, writes } = await openSync(persistence, { failNotice: true });
    expect(await sync.firstSave()).toBe(true);
    await settle();
    expect(writes).toHaveLength(1);
    expect(await persistence.get("meta", NOTICE)).toBeUndefined();
    expect(await sync.firstSave()).toBe(true);
  });

  it("지우기 뒤(빈 DB) 첫 저장 → 다시 true", async () => {
    const before = createMemoryPersistence();
    await (await openSync(before)).sync.firstSave();
    await settle();
    expect(await before.get("meta", NOTICE)).toBeDefined();
    // deleteDatabase = 새 빈 DB(meta 함께 사라짐)
    const after = createMemoryPersistence();
    expect(await (await openSync(after)).sync.firstSave()).toBe(true);
  });

  it("읽기 전용 탭(다른 탭이 쓰기 잠금 보유) → false · 쓰기 0", async () => {
    const persistence = createMemoryPersistence();
    const browser = createLockRegistry();
    const a = await openSync(persistence, { locks: browser.tab() });
    const b = await openSync(persistence, { locks: browser.tab() });
    expect(await a.sync.firstSave()).toBe(true);
    expect(await b.sync.firstSave()).toBe(false);
    await settle();
    expect(b.writes).toHaveLength(0);
  });

  it("지워짐(다른 탭 cleared 수신) 탭 → false · 쓰기 0", async () => {
    const persistence = createMemoryPersistence();
    const net = createLinkNetwork();
    const link = net.tab();
    net.tab().post({ type: "cleared" });
    await settle();
    const { sync, writes } = await openSync(persistence, { link });
    expect(await sync.firstSave()).toBe(false);
    await settle();
    expect(writes).toHaveLength(0);
  });

  it("세대 불변식 — 상태 저장·안내 키 제출이 섞여도 쓰기 트랜잭션마다 meta 세대 +1(상태 gen 같음) · 상태 쓰기가 안내 키보다 먼저", async () => {
    const persistence = createMemoryPersistence();
    const { sync, writes } = await openSync(persistence);
    const state = { series: new Map(), commits: new Map(), adjustCommits: new Map(), jobs: new Map(), projects: new Map() };
    sync.saveState(state);
    expect(await sync.firstSave()).toBe(true);
    sync.saveState(state);
    await settle();
    expect(writes).toHaveLength(3);
    expect(writes.map(genOf)).toEqual([1, 2, 3]);
    expect(writes.map(stateGenOf)).toEqual([1, 2, 3]);
    expect(writes.map((ops) => ops.some(isNotice))).toEqual([false, true, false]);
  });
});

describe("보드 확정 결과 firstSave (deferredStudio 배선)", () => {
  it("빈 DB 첫 확정 → firstSave true · 다음 확정 → 없음", async () => {
    const persistence = createMemoryPersistence();
    const { studio } = await openStudio(persistence);
    const board = await studio.board();
    const first = await board.confirmProfile(1, 0);
    expect(first).toMatchObject({ profileId: "profile-1", version: 1, firstSave: true });
    await settle();
    const { board: seen } = await board.getBoard();
    const second = await board.createProfileVersion("profile-1", seen.revision, 0, "new");
    expect(second.profileId).toBe("profile-2");
    expect(second.firstSave).toBeUndefined();
  });

  it("안내 키 put 실패해도 확정 성공 · 다음 확정에 한 번 더", async () => {
    const persistence = createMemoryPersistence();
    const { studio } = await openStudio(persistence, true);
    const board = await studio.board();
    expect(await board.confirmProfile(1, 0)).toMatchObject({ profileId: "profile-1", firstSave: true });
    await settle();
    const { board: seen } = await board.getBoard();
    expect(await board.createProfileVersion("profile-1", seen.revision, 0, "new")).toMatchObject({ profileId: "profile-2", firstSave: true });
  });

  it("싱크가 2초 넘게 늦으면(Codex r1 P2) 첫 확정 안내 없음 · 늦은 판정은 키 기록 0 · 다음 확정에 안내 1회", async () => {
    const persistence = createMemoryPersistence();
    const { own } = tabOf(persistence);
    let release = () => undefined as void;
    const gate = new Promise<void>((done) => (release = done));
    const entry = await entryFrom(persistence);
    const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: async (e) => (await gate, openLocalSync(e, async () => own, soloLocks(), createLinkNetwork().tab())) });
    const board = await studio.board();
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    let first: Awaited<ReturnType<typeof board.confirmProfile>> | undefined;
    const pending = board.confirmProfile(1, 0).then((r) => (first = r));
    for (let i = 0; i < 50 && !first; i += 1) {
      await vi.advanceTimersByTimeAsync(100);
      await new Promise((done) => setImmediate(done));
    }
    await pending;
    expect(first).toMatchObject({ profileId: "profile-1", version: 1 });
    expect(first?.firstSave).toBeUndefined();
    vi.useRealTimers();
    release();
    for (let i = 0; i < 5; i += 1) await new Promise((done) => setImmediate(done));
    await settle();
    expect(await persistence.get("meta", NOTICE)).toBeUndefined();
    const { board: seen } = await board.getBoard();
    expect(await board.createProfileVersion("profile-1", seen.revision, 0, "new")).toMatchObject({ profileId: "profile-2", firstSave: true });
    await settle();
    const { board: again } = await board.getBoard();
    expect((await board.createProfileVersion("profile-2", again.revision, 0, "new")).firstSave).toBeUndefined();
  });

  it("memory(강등 — 로컬 영속 없음) → 확정 성공 · firstSave 없음", async () => {
    const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports);
    const result = await (await studio.board()).confirmProfile(1, 0);
    expect(result.profileId).toBe("profile-1");
    expect(result.firstSave).toBeUndefined();
  });
});
