/**
 * 가져오기 쓰기 (P2-SPEC 3.5 — 잠금 · DB_VERSION 2 + 업그레이드로 열기 · 한 트랜잭션 · gen+1 · saved · 1회 키 · 새로고침).
 * AC-P04(U) · AC-P05(U — 쓴 레코드가 열기·이미지 읽기를 그대로 통과) · AC-P06(abort·Quota) · AC-P07(읽기 불가 = IM-8).
 */
import { describe, expect, it, vi } from "vitest";
import { DB_NAME, SCHEMA_VERSION, STORE_NAMES } from "../../data/persistence/envelope";
import { createLockRegistry, soloLocks } from "../../data/persistence/fakeLocks";
import { createLinkNetwork } from "../../data/persistence/fakeTabLink";
import { DB_VERSION } from "../../data/persistence/idbPersistence";
import { readImageRecord } from "../../data/persistence/imageRecord";
import { openLocalSync } from "../../data/persistence/localSync";
import { createMemoryPersistence } from "../../data/persistence/studioPersistence";
import { WRITER_LOCK } from "../../data/persistence/writerLock";
import { fakeDeps, fileImage, jsonFile, seedFile, seedProject, seedSeries } from "../../test/projectFileFixtures";
import { checkFile, type CheckedFile } from "./checkFile";
import {
  IMPORTED_KEY,
  IMPORT_DB_NAME,
  IMPORT_DB_VERSION,
  IMPORT_STORE_NAMES,
  createImporter,
  importMessage,
  importerFor,
  runImport,
  upgradeImportDb,
  type ImportDeps,
  type ImportRun,
} from "./writeImport";

const NOW = "2026-10-08T10:00:00.000Z";
const IM8 = "저장된 데이터를 읽지 못해 가져오지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다";
const IM9 = "다른 탭에서 편집 중이라 가져오지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요";
const IM10 = "가져오지 못했습니다 — 다시 시도하세요";
const IM11 = "브라우저 저장 공간이 부족해 가져오지 못했습니다 — 쓰지 않는 프로젝트를 지운 뒤 다시 시도하세요";
const IM4 = "파일 내용이 손상되어 가져올 수 없습니다";

async function checked(images = [fileImage("a", 500, 300)]): Promise<CheckedFile> {
  const result = await checkFile(jsonFile(seedFile({}, images)), fakeDeps().deps);
  if (!result.ok) throw new Error(result.message);
  return result.file;
}

const env = (kind: string, id: string, data: unknown, schemaVersion = SCHEMA_VERSION) => ({ schemaVersion, kind, id, data });
const stateOf = (n: number, over: Record<string, unknown> = {}) => ({
  series: new Map([[`profile-${n}`, seedSeries(`profile-${n}`)]]),
  commits: new Map(),
  adjustCommits: new Map(),
  jobs: new Map(),
  projects: new Map([[`project-${n}`, Object.freeze(seedProject(`project-${n}`, `profile-${n}`))]]),
  heads: new Map(),
  gen: 7,
  ...over,
});

interface FakeOpts {
  /** 커밋 대신 이 이름의 오류로 abort(쓰기 0) */
  readonly failCommit?: string;
  /** n번째 put이 동기로 던진다(DataCloneError 등) */
  readonly throwOnPut?: number;
  /** 처음 열 때의 DB 버전 · 0 = DB 없음 */
  readonly version?: number;
  readonly blocked?: boolean;
}

/** 손 IDB 가짜(deleteProject.test 복제 + 버전 열기·업그레이드·put 동기 예외·이름 있는 커밋 실패) */
function fakeIdb(initial: Record<string, ReadonlyMap<string, unknown>>, opts: FakeOpts = {}) {
  const stores = new Map(Object.entries(initial).map(([name, records]) => [name, new Map(records)]));
  const txs: { names: string[]; mode: string }[] = [];
  const opened: [string, number | undefined][] = [];
  let version = opts.version ?? (stores.size ? 2 : 0);
  let closed = 0;
  let puts = 0;
  let aborted = 0;
  const request = (get: () => unknown) => {
    const r: { result?: unknown; onsuccess?: () => void; onerror?: () => void } = {};
    queueMicrotask(() => {
      r.result = get();
      r.onsuccess?.();
    });
    return r;
  };
  const db = {
    objectStoreNames: { contains: (name: string) => stores.has(name) },
    createObjectStore: (name: string) => void stores.set(name, new Map()),
    onversionchange: null as unknown,
    close: () => void (closed += 1),
    transaction(names: string[], mode: string) {
      txs.push({ names: [...names], mode });
      const ops: (() => void)[] = [];
      let finished = false;
      const tx: { error: unknown; oncomplete?: () => void; onerror?: () => void; onabort?: () => void; abort(): void; objectStore(name: string): unknown } = {
        error: null,
        abort: () => {
          if (finished) return;
          finished = true;
          aborted += 1;
          tx.error = new DOMException("abort", "AbortError");
          tx.onabort?.();
        },
        objectStore(name: string) {
          const store = stores.get(name)!;
          return {
            get: (key: string) => request(() => store.get(key)),
            put: (value: unknown, key: string) => {
              puts += 1;
              if (puts === opts.throwOnPut) throw new DOMException("clone", "DataCloneError");
              ops.push(() => store.set(key, value));
            },
          };
        },
      };
      setTimeout(() => {
        if (finished) return;
        finished = true;
        if (opts.failCommit) {
          tx.error = new DOMException("fail", opts.failCommit);
          tx.onerror?.();
          tx.onabort?.();
          return;
        }
        ops.forEach((op) => op());
        tx.oncomplete?.();
      }, 0);
      return tx;
    },
  };
  const factory = {
    open: vi.fn((name: string, next?: number) => {
      opened.push([name, next]);
      const r: { result?: unknown; onsuccess?: () => void; onerror?: () => void; onblocked?: () => void; onupgradeneeded?: (e: { oldVersion: number; newVersion: number }) => void } = {};
      queueMicrotask(() => {
        r.result = db;
        if (opts.blocked) {
          r.onblocked?.();
          return;
        }
        if (next !== undefined && next > version) {
          r.onupgradeneeded?.({ oldVersion: version, newVersion: next });
          version = next;
        }
        r.onsuccess?.();
      });
      return r;
    }),
  } as unknown as IDBFactory & { open: ReturnType<typeof vi.fn> };
  return { factory, stores, txs, opened, closed: () => closed, aborted: () => aborted };
}

const fullDb = (state: unknown, opts?: FakeOpts) =>
  fakeIdb(
    {
      meta: new Map([["generation", env("generation", "generation", 7)]]),
      studio: new Map([["state", state]]),
      docs: new Map([["project-1", env("doc", "project-1", { doc: {}, snapshots: [] })]]),
      snapshots: new Map(),
      images: new Map([["project-1/a", env("image", "project-1/a", {})]]),
      board: new Map(),
      saved: new Map(),
    },
    opts,
  );
const snapshotOf = (stores: Map<string, Map<string, unknown>>) => [...stores].map(([name, s]) => [name, [...s.entries()]]);

describe("runImport — 한 IDB 트랜잭션 (3.5 ②)", () => {
  it("새 브라우저(DB 없음) → DB_VERSION 2로 열어 저장소 7개 생성 · project-1 · gen 1 · 문서·이미지 레코드 · 트랜잭션 1개 readwrite 4저장소 · 연결 닫음", async () => {
    const idb = fakeIdb({});
    const file = await checked();
    await expect(runImport(idb.factory, file, NOW)).resolves.toEqual({ status: "done", projectId: "project-1", name: file.project.name });
    expect(idb.opened).toEqual([[IMPORT_DB_NAME, IMPORT_DB_VERSION]]);
    expect([...idb.stores.keys()].sort()).toEqual([...STORE_NAMES].sort());
    expect(idb.txs).toEqual([{ names: ["studio", "docs", "images", "meta"], mode: "readwrite" }]);
    const state = idb.stores.get("studio")!.get("state") as { data: Record<string, unknown> & { projects: Map<string, unknown>; heads: Map<string, unknown>; gen: number } };
    expect(state).toMatchObject({ schemaVersion: SCHEMA_VERSION, kind: "state", id: "state" });
    expect([...state.data.projects.keys()]).toEqual(["project-1"]);
    expect([...state.data.heads.keys()]).toEqual(["project-1"]);
    expect(state.data.gen).toBe(1);
    expect(idb.stores.get("meta")!.get("generation")).toEqual(env("generation", "generation", 1));
    expect(idb.stores.get("docs")!.get("project-1")).toMatchObject({ schemaVersion: SCHEMA_VERSION, kind: "doc", id: "project-1" });
    const image = idb.stores.get("images")!.get("project-1/a") as { data: Record<string, unknown> };
    expect(image).toMatchObject({ schemaVersion: SCHEMA_VERSION, kind: "image", id: "project-1/a" });
    expect(Object.keys(image.data).sort()).toEqual(["bytes", "format", "height", "variants", "width"]);
    expect(idb.closed()).toBe(1);
  });

  it("기존 project-1·gen 7 → 새 project-2·profile-2 · gen 8 · 기존 레코드 값 그대로 · 같은 파일 2회 = project-3", async () => {
    const before = env("state", "state", stateOf(1));
    const idb = fullDb(before);
    const file = await checked();
    await expect(runImport(idb.factory, file, NOW)).resolves.toMatchObject({ status: "done", projectId: "project-2" });
    const state = idb.stores.get("studio")!.get("state") as { data: ReturnType<typeof stateOf> };
    expect(state.data.projects.get("project-1")).toBe(before.data.projects.get("project-1"));
    expect([...state.data.series.keys()]).toEqual(["profile-1", "profile-2"]);
    expect(state.data.gen).toBe(8);
    expect(idb.stores.get("docs")!.get("project-1")).toEqual(env("doc", "project-1", { doc: {}, snapshots: [] }));
    expect([...idb.stores.get("images")!.keys()]).toEqual(["project-1/a", "project-2/a"]);
    await expect(runImport(idb.factory, file, NOW)).resolves.toMatchObject({ status: "done", projectId: "project-3" });
  });

  it("AC-P05 쓴 상태·문서는 openLocalSync(checkState·readDoc), 이미지는 readImageRecord를 그대로 통과", async () => {
    const idb = fullDb(env("state", "state", stateOf(1)));
    await runImport(idb.factory, await checked(), NOW);
    const state = (idb.stores.get("studio")!.get("state") as { data: never }).data;
    const persistence = createMemoryPersistence();
    await persistence.write([{ type: "put", store: "docs", record: idb.stores.get("docs")!.get("project-2") as never }]);
    const sync = await openLocalSync({ state }, async () => persistence, soloLocks());
    expect(sync.docs.get("project-2")?.doc.projectId).toBe("project-2");
    await expect(readImageRecord(idb.stores.get("images")!.get("project-2/a"), "project-2/a")).resolves.toMatchObject({ width: 500, height: 300, format: "png" });
  });

  it("AC-P07 상태 봉투 schemaVersion 99 · Map 아닌 필드 → unreadable · abort · 쓰기 0", async () => {
    for (const state of [env("state", "state", stateOf(1), 99), env("state", "state", { ...stateOf(1), projects: {} })]) {
      const idb = fullDb(state);
      const before = snapshotOf(idb.stores);
      await expect(runImport(idb.factory, await checked(), NOW)).resolves.toEqual({ status: "unreadable" });
      expect(snapshotOf(idb.stores)).toEqual(before);
      expect(idb.closed()).toBe(1);
    }
  });

  it("AC-P06 put 중 동기 예외 → abort · 거부 · state·docs·images·meta 전부 이전 값", async () => {
    const idb = fullDb(env("state", "state", stateOf(1)), { throwOnPut: 3 });
    const before = snapshotOf(idb.stores);
    await expect(runImport(idb.factory, await checked(), NOW)).rejects.toMatchObject({ name: "DataCloneError" });
    expect(idb.aborted()).toBe(1);
    expect(snapshotOf(idb.stores)).toEqual(before);
    expect(idb.closed()).toBe(1);
  });

  it("AC-P06 커밋 실패(QuotaExceededError) → 거부(오류 이름 보존) · 쓰기 0", async () => {
    const idb = fullDb(env("state", "state", stateOf(1)), { failCommit: "QuotaExceededError" });
    const before = snapshotOf(idb.stores);
    await expect(runImport(idb.factory, await checked(), NOW)).rejects.toMatchObject({ name: "QuotaExceededError" });
    expect(snapshotOf(idb.stores)).toEqual(before);
  });

  it("열기 blocked → 거부 · 트랜잭션 0", async () => {
    const idb = fakeIdb({}, { blocked: true });
    await expect(runImport(idb.factory, await checked(), NOW)).rejects.toBeDefined();
    expect(idb.txs).toEqual([]);
  });

  it("parity — DB 이름·버전·저장소 = 영속 모듈 · 업그레이드 = 없는 저장소만 만든다", () => {
    expect(IMPORT_DB_NAME).toBe(DB_NAME);
    expect(IMPORT_DB_VERSION).toBe(DB_VERSION);
    expect([...IMPORT_STORE_NAMES]).toEqual([...STORE_NAMES]);
    const made: string[] = [];
    const have = new Set(["meta"]);
    upgradeImportDb({ objectStoreNames: { contains: (n) => have.has(n) }, createObjectStore: (n) => void made.push(n) }, 1, 2);
    expect(made).toEqual(STORE_NAMES.filter((n) => n !== "meta"));
    const none: string[] = [];
    upgradeImportDb({ objectStoreNames: { contains: () => false }, createObjectStore: (n) => void none.push(n) }, 2, 2);
    expect(none).toEqual([]);
  });
});

const flushAll = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

function setup(over: { locks?: null; run?: ImportDeps["run"]; writer?: boolean } = {}) {
  const browser = createLockRegistry();
  const net = createLinkNetwork();
  const link = net.tab();
  const other = net.tab();
  const heard: string[] = [];
  other.listen((m) => heard.push(m.type));
  const stop = vi.fn();
  let writer = over.writer ?? false;
  if (over.writer !== undefined)
    link.attach({
      isWriter: () => writer,
      stop: () => {
        writer = false;
        stop();
      },
    });
  const session = { setItem: vi.fn() };
  const go = vi.fn();
  const run = over.run ?? vi.fn(async (): Promise<ImportRun> => ({ status: "done", projectId: "project-4", name: "카페" }));
  const locks = over.locks === null ? undefined : browser.tab();
  const deps: ImportDeps = { locks, factory: {} as IDBFactory, link, session, go, run, now: () => NOW };
  return { browser, heard, stop, session, go, run, locks, deps, importer: createImporter(deps) };
}

describe("흐름 — 잠금·멈춤·saved·1회 키·새로고침 (3.5 ①·③·④)", () => {
  it("성공 → 커밋 뒤 saved · 키 = JSON {projectId, name} · /projects 이동 · 잠금 보유", async () => {
    const t = setup({ writer: false });
    const file = await checked();
    await expect(t.importer.importFile(file)).resolves.toEqual({ status: "done", stopped: false });
    expect(t.run).toHaveBeenCalledWith(t.deps.factory, file, NOW);
    await flushAll();
    expect(t.heard).toEqual(["saved"]);
    expect(t.session.setItem).toHaveBeenCalledWith(IMPORTED_KEY, JSON.stringify({ projectId: "project-4", name: "카페" }));
    expect(t.go).toHaveBeenCalledWith("/projects");
    expect(t.browser.held()).toEqual([WRITER_LOCK]);
  });

  it("AC-P04 다른 탭이 쓰기 탭 → busy(IM-9) · 실행 0 · 전송 0 · 이동 0", async () => {
    const t = setup({ writer: false });
    const file = await checked();
    await t.browser.tab().request(WRITER_LOCK, { ifAvailable: true }, () => {
      void (async () => {
        await expect(t.importer.importFile(file)).resolves.toEqual({ status: "busy", stopped: false });
      })();
      return flushAll();
    });
    await flushAll();
    expect(t.run).not.toHaveBeenCalled();
    expect(t.heard).toEqual([]);
    expect(t.go).not.toHaveBeenCalled();
    expect(importMessage("busy")).toBe(IM9);
  });

  it("이 탭이 쓰기 탭 → 진행 전 싱크 멈춤 · stopped", async () => {
    const t = setup({ writer: true });
    await expect(t.importer.importFile(await checked())).resolves.toEqual({ status: "done", stopped: true });
    expect(t.stop).toHaveBeenCalledTimes(1);
    expect(t.stop.mock.invocationCallOrder[0]).toBeLessThan((t.run as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]!);
  });

  it("AC-P06 Quota → quota(IM-11) · 그 밖 거부 → failed(IM-10) · 잠금 놓음 · 이동 0", async () => {
    const q = setup({ writer: false, run: vi.fn(async (): Promise<ImportRun> => Promise.reject(new DOMException("full", "QuotaExceededError"))) });
    await expect(q.importer.importFile(await checked())).resolves.toEqual({ status: "quota", stopped: false });
    expect(q.browser.held()).toEqual([]);
    expect(q.go).not.toHaveBeenCalled();
    const f = setup({ writer: false, run: vi.fn(async (): Promise<ImportRun> => Promise.reject(new Error("tx"))) });
    await expect(f.importer.importFile(await checked())).resolves.toEqual({ status: "failed", stopped: false });
    await flushAll();
    expect(f.heard).toEqual([]);
    expect(importMessage("quota")).toBe(IM11);
    expect(importMessage("failed")).toBe(IM10);
  });

  it("읽기 불가 → unreadable(IM-8) · 재매김 재검사 실패 → corrupt(IM-4) · 쓰기 탭이었으면 stopped", async () => {
    const u = setup({ writer: true, run: vi.fn(async (): Promise<ImportRun> => ({ status: "unreadable" })) });
    await expect(u.importer.importFile(await checked())).resolves.toEqual({ status: "unreadable", stopped: true });
    const c = setup({ writer: false, run: vi.fn(async (): Promise<ImportRun> => ({ status: "corrupt" })) });
    await expect(c.importer.importFile(await checked())).resolves.toEqual({ status: "corrupt", stopped: false });
    expect(c.browser.held()).toEqual([]);
    expect(importMessage("unreadable")).toBe(IM8);
    expect(importMessage("corrupt")).toBe(IM4);
  });

  it("navigator.locks 없음 = 잠금 없이 진행 · 탭당 1개(같은 링크 = 같은 importer)", async () => {
    const t = setup({ locks: null });
    await expect(t.importer.importFile(await checked())).resolves.toEqual({ status: "done", stopped: false });
    const deps = { ...t.deps, link: createLinkNetwork().tab() };
    expect(importerFor(deps)).toBe(importerFor({ ...deps }));
  });
});
