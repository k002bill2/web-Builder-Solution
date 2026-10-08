/**
 * 프로젝트 삭제 (P1D-SPEC 1.3 삭제 범위 1~4 · 잠금 · AC-D01③④ · D04 · D05 · D08(프로젝트)).
 * 순수 판정(planDelete)·이미지 접두·IDB 껍데기(손 가짜 — jsdom에 IndexedDB 없음)·탭당 흐름(실행부 주입).
 */
import { describe, expect, it, vi } from "vitest";
import { DB_NAME, SCHEMA_VERSION } from "../../data/persistence/envelope";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { createLinkNetwork } from "../../data/persistence/fakeTabLink";
import { WRITER_LOCK } from "../../data/persistence/writerLock";
import { nextSeqId } from "../../data/seqId";
import { DELETED_NOTICE_KEY } from "../../pages/ProjectsPage";
import { DELETED_KEY, DELETE_DB_NAME, createDeleter, deleterFor, planDelete, projectImageKeys, runDelete, type DeleteDeps, type RunResult } from "./deleteProject";

const env = (kind: string, id: string, data: unknown, schemaVersion = SCHEMA_VERSION) => ({ schemaVersion, kind, id, data });

const project = (n: number) => Object.freeze({ projectId: `project-${n}`, profileId: `profile-${n}`, name: `이름 ${n}`, revision: 1 });
const job = (n: number, profile = n) => Object.freeze({ key: `k${n}`, job: { jobId: `job-${n}`, profileId: `profile-${profile}` } });
const commit = (n: number) => Object.freeze({ key: `c${n}`, profileId: `profile-${n}`, version: 1 });

/** 프로젝트 n개(계열·잡·확정 기록 1:1) — 각 번호는 새 기준 데이터에서 시작(AC-D01) */
function stateData(nums: readonly number[], over: Record<string, unknown> = {}) {
  return {
    series: new Map(nums.map((n) => [`profile-${n}`, [Object.freeze({ profileId: `profile-${n}`, version: 1 })]])),
    commits: new Map(nums.map((n) => [`profile-${n}`, commit(n)])),
    adjustCommits: new Map(nums.map((n) => [`profile-${n}`, commit(n)])),
    jobs: new Map(nums.map((n) => [`job-${n}`, job(n)])),
    projects: new Map(nums.map((n) => [`project-${n}`, project(n)])),
    heads: new Map(nums.map((n) => [`project-${n}`, { projectId: `project-${n}`, revision: 1 }])),
    gen: 7,
    ...over,
  };
}
const stateRecord = (data: unknown, schemaVersion?: number) => env("state", "state", data, schemaVersion);
const genRecord = (n: number) => env("generation", "generation", n);

type Planned = Extract<ReturnType<typeof planDelete>, { status: "ok" }>;
const planned = (result: ReturnType<typeof planDelete>): Planned => {
  expect(result.status).toBe("ok");
  return result as Planned;
};

describe("planDelete — 새 상태 (SPEC 1.3 삭제 범위 2)", () => {
  it("AC-D01③ 가운데(project-2) 삭제 → 그 계열·잡·확정·조정·머리 0 · 남은 레코드 값 그대로 · 다음 id = -4", () => {
    const data = stateData([1, 2, 3]);
    const { state } = planned(planDelete(stateRecord(data), genRecord(7), "project-2"));
    expect([...state.projects.keys()]).toEqual(["project-1", "project-3"]);
    expect([...state.heads.keys()]).toEqual(["project-1", "project-3"]);
    expect([...state.series.keys()]).toEqual(["profile-1", "profile-3"]);
    expect([...state.adjustCommits.keys()]).toEqual(["profile-1", "profile-3"]);
    expect([...state.commits.values()].map((c) => c.profileId)).toEqual(["profile-1", "profile-3"]);
    expect([...state.jobs.keys()]).toEqual(["job-1", "job-3"]);
    // 덮어쓰기 0 — 남은 레코드는 같은 값(참조)
    for (const n of [1, 3]) {
      expect(state.projects.get(`project-${n}`)).toBe(data.projects.get(`project-${n}`));
      expect(state.series.get(`profile-${n}`)).toBe(data.series.get(`profile-${n}`));
      expect(state.jobs.get(`job-${n}`)).toBe(data.jobs.get(`job-${n}`));
    }
    expect(state.seq).toEqual({ project: 2, profile: 2, job: 2 });
    expect(nextSeqId("project", state.projects.keys(), state.seq.project)).toBe("project-4");
    expect(nextSeqId("profile", state.series.keys(), state.seq.profile)).toBe("profile-4");
    expect(nextSeqId("job", state.jobs.keys(), state.seq.job)).toBe("job-4");
  });

  it("AC-D01④ 최대(project-3) 삭제 → seq {3,3,3} · 다음 id = -4(재발급 0)", () => {
    const { state } = planned(planDelete(stateRecord(stateData([1, 2, 3])), genRecord(7), "project-3"));
    expect(state.seq).toEqual({ project: 3, profile: 3, job: 3 });
    expect(nextSeqId("project", state.projects.keys(), state.seq.project)).toBe("project-4");
    expect(nextSeqId("profile", state.series.keys(), state.seq.profile)).toBe("profile-4");
    expect(nextSeqId("job", state.jobs.keys(), state.seq.job)).toBe("job-4");
  });

  it("seq = max(기존, 지운 번호) — 기존 묘비가 더 크면 유지 · 계열의 잡 여러 개면 그중 최대", () => {
    const data = stateData([1, 2], { seq: { project: 9, profile: 1, job: 1 }, jobs: new Map([["job-1", job(1)], ["job-5", job(5, 2)], ["job-7", job(7, 2)], ["job-2", job(2)]]) });
    const { state } = planned(planDelete(stateRecord(data), genRecord(3), "project-2"));
    expect(state.seq).toEqual({ project: 9, profile: 2, job: 7 });
    expect([...state.jobs.keys()]).toEqual(["job-1"]);
  });

  it("gen = meta generation + 1(state에 같은 값) · meta 없음 = 1 · 그 밖 필드 보존", () => {
    const withMeta = planned(planDelete(stateRecord(stateData([1])), genRecord(41), "project-1"));
    expect(withMeta.gen).toBe(42);
    expect(withMeta.state.gen).toBe(42);
    const noMeta = planned(planDelete(stateRecord(stateData([1], { extra: "그대로" })), undefined, "project-1"));
    expect(noMeta.gen).toBe(1);
    expect((noMeta.state as unknown as { extra: string }).extra).toBe("그대로");
  });

  it("J-S17 이미 지워짐 = gone(상태 없음 · 그 프로젝트 없음)", () => {
    expect(planDelete(undefined, genRecord(1), "project-1")).toEqual({ status: "gone" });
    expect(planDelete(stateRecord(stateData([1])), genRecord(1), "project-2")).toEqual({ status: "gone" });
  });

  it("AC-D08 읽기 불가 = unreadable(schemaVersion 99 · 봉투 모양 아님 · Map 아닌 필드)", () => {
    expect(planDelete(stateRecord(stateData([1]), 99), genRecord(1), "project-1")).toEqual({ status: "unreadable" });
    expect(planDelete({ kind: "state", id: "state" }, genRecord(1), "project-1")).toEqual({ status: "unreadable" });
    expect(planDelete(stateRecord(stateData([1], { jobs: {} })), genRecord(1), "project-1")).toEqual({ status: "unreadable" });
    expect(planDelete(stateRecord(null), genRecord(1), "project-1")).toEqual({ status: "unreadable" });
  });

  it("heads 없는 옛 레코드도 지운다(빈 머리)", () => {
    const { state } = planned(planDelete(stateRecord(stateData([1, 2], { heads: undefined })), genRecord(1), "project-1"));
    expect([...state.heads.keys()]).toEqual([]);
  });
});

describe("projectImageKeys — 슬래시 포함 접두 (SPEC 1.3 삭제 범위 3)", () => {
  it("project-1 삭제가 project-10/…을 건드리지 않는다", () => {
    expect(projectImageKeys(["project-1/a", "project-10/b", "project-1/c", "project-2/x", 5], "project-1")).toEqual(["project-1/a", "project-1/c"]);
  });
});

/** 손 IDB 가짜 — 요청은 마이크로태스크 뒤 성공, 트랜잭션은 다음 매크로태스크에 커밋(그때 쓰기 반영) · failCommit = 커밋 대신 오류(쓰기 0) */
function fakeIdb(initial: Record<string, ReadonlyMap<string, unknown>>, opts: { failCommit?: boolean } = {}) {
  const stores = new Map(Object.entries(initial).map(([name, records]) => [name, new Map(records)]));
  const txs: { names: string[]; mode: string }[] = [];
  const opened: string[] = [];
  let closed = 0;
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
          tx.error = new DOMException("abort", "AbortError");
          tx.onabort?.();
        },
        objectStore(name: string) {
          const store = stores.get(name)!;
          return {
            get: (key: string) => request(() => store.get(key)),
            getAllKeys: () => request(() => [...store.keys()]),
            put: (value: unknown, key: string) => void ops.push(() => store.set(key, value)),
            delete: (key: string) => void ops.push(() => store.delete(key)),
          };
        },
      };
      setTimeout(() => {
        if (finished) return;
        finished = true;
        if (opts.failCommit) {
          tx.error = new DOMException("quota", "QuotaExceededError");
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
    open: (name: string) => {
      opened.push(name);
      return request(() => db);
    },
  } as unknown as IDBFactory;
  return { factory, stores, txs, opened, closed: () => closed };
}

const docRecord = (id: string) => env("doc", id, { doc: { projectId: id }, snapshots: [] });

function twoProjects(state = stateRecord(stateData([1, 10])), opts?: { failCommit?: boolean }) {
  return fakeIdb(
    {
      meta: new Map([["generation", genRecord(7)]]),
      studio: new Map([["state", state]]),
      docs: new Map([["project-1", docRecord("project-1")], ["project-10", docRecord("project-10")]]),
      snapshots: new Map(),
      images: new Map([["project-1/a", 1], ["project-1/b", 2], ["project-10/a", 3], ["project-10/b", 4]]),
    },
    opts,
  );
}

describe("runDelete — 한 IDB 트랜잭션 (AC-D04 U)", () => {
  it("project-1 삭제 → docs·images 접두·state·meta generation +1 · project-10 그대로 · 트랜잭션 1개 readwrite 4저장소 · 연결 닫음", async () => {
    const idb = twoProjects();
    await expect(runDelete(idb.factory, "project-1")).resolves.toBe("done");
    expect(idb.opened).toEqual([DELETE_DB_NAME]);
    expect(idb.txs).toEqual([{ names: ["studio", "docs", "images", "meta"], mode: "readwrite" }]);
    expect([...idb.stores.get("docs")!.keys()]).toEqual(["project-10"]);
    expect([...idb.stores.get("images")!.keys()]).toEqual(["project-10/a", "project-10/b"]);
    const meta = idb.stores.get("meta")!.get("generation");
    expect(meta).toEqual(genRecord(8));
    const state = idb.stores.get("studio")!.get("state") as ReturnType<typeof stateRecord> & { data: ReturnType<typeof stateData> & { seq: unknown } };
    expect(state).toMatchObject({ schemaVersion: SCHEMA_VERSION, kind: "state", id: "state" });
    expect(state.data.gen).toBe(8);
    expect([...state.data.projects.keys()]).toEqual(["project-10"]);
    expect([...state.data.heads.keys()]).toEqual(["project-10"]);
    expect([...state.data.series.keys()]).toEqual(["profile-10"]);
    expect([...state.data.jobs.keys()]).toEqual(["job-10"]);
    expect(state.data.seq).toEqual({ project: 1, profile: 1, job: 1 });
    expect(idb.stores.get("snapshots")!.size).toBe(0);
    expect(idb.closed()).toBe(1);
  });

  it("AC-D08 읽기 불가(schemaVersion 99) → unreadable · 쓰기 0", async () => {
    const idb = twoProjects(stateRecord(stateData([1, 10]), 99));
    const before = structuredClone([...idb.stores].map(([n, s]) => [n, [...s.keys()]]));
    await expect(runDelete(idb.factory, "project-1")).resolves.toBe("unreadable");
    expect([...idb.stores].map(([n, s]) => [n, [...s.keys()]])).toEqual(before);
    expect(idb.stores.get("meta")!.get("generation")).toEqual(genRecord(7));
    expect(idb.closed()).toBe(1);
  });

  it("J-S17 이미 지워짐 → gone · 쓰기 0 · 저장소 없는 빈 DB도 gone", async () => {
    const idb = twoProjects();
    await expect(runDelete(idb.factory, "project-2")).resolves.toBe("gone");
    expect(idb.stores.get("meta")!.get("generation")).toEqual(genRecord(7));
    expect(idb.stores.get("docs")!.size).toBe(2);
    const empty = fakeIdb({});
    await expect(runDelete(empty.factory, "project-1")).resolves.toBe("gone");
    expect(empty.txs).toEqual([]);
    expect(empty.closed()).toBe(1);
  });

  it("AC-D08 트랜잭션 실패 → 거부 · 전부 아니면 전무(쓰기 0)", async () => {
    const idb = twoProjects(undefined, { failCommit: true });
    await expect(runDelete(idb.factory, "project-1")).rejects.toBeDefined();
    expect(idb.stores.get("docs")!.size).toBe(2);
    expect(idb.stores.get("images")!.size).toBe(4);
    expect(idb.stores.get("meta")!.get("generation")).toEqual(genRecord(7));
    expect(idb.closed()).toBe(1);
  });
});

const flushAll = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

function setup(over: { locks?: null; run?: DeleteDeps["run"]; writer?: boolean } = {}) {
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
  const run = over.run ?? vi.fn(async (): Promise<RunResult> => "done");
  const locks = over.locks === null ? undefined : browser.tab();
  const deps: DeleteDeps = { locks, factory: {} as IDBFactory, link, session, go, run };
  return { browser, net, link, heard, stop, session, go, run, locks, deps, deleter: createDeleter(deps) };
}

describe("흐름 — 잠금·멈춤·saved·1회 키·새로고침 (SPEC 1.3 잠금 · 4단계 · J-S16)", () => {
  it("쓰기 탭 아님 + 잠금 비어 있음 → 잠금 잡고 진행 · 멈춤 0 · 커밋 뒤 saved · 키 = 이름 · /projects 이동 · 잠금 보유", async () => {
    const t = setup({ writer: false });
    await expect(t.deleter.remove("project-3", "카페")).resolves.toEqual({ status: "done", stopped: false });
    expect(t.run).toHaveBeenCalledWith(t.deps.factory, "project-3");
    expect(t.stop).not.toHaveBeenCalled();
    await flushAll();
    expect(t.heard).toEqual(["saved"]);
    expect(t.session.setItem).toHaveBeenCalledWith(DELETED_KEY, "카페");
    expect(t.go).toHaveBeenCalledWith("/projects");
    expect(t.browser.held()).toEqual([WRITER_LOCK]);
  });

  it("AC-D05 다른 탭이 쓰기 탭(잠금 보유) → busy · 실행 0 · 멈춤 0 · 전송 0", async () => {
    const t = setup({ writer: false });
    await t.browser.tab().request(WRITER_LOCK, { ifAvailable: true }, () => {
      void (async () => {
        await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "busy", stopped: false });
      })();
      return flushAll();
    });
    await flushAll();
    expect(t.run).not.toHaveBeenCalled();
    expect(t.stop).not.toHaveBeenCalled();
    expect(t.heard).toEqual([]);
    expect(t.go).not.toHaveBeenCalled();
  });

  it("이 탭이 쓰기 탭 → 보유 잠금 안에서(새 요청 0) · 진행 전 싱크 멈춤 · stopped", async () => {
    const t = setup({ writer: true });
    const held = vi.spyOn(t.locks!, "request");
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "done", stopped: true });
    expect(held).not.toHaveBeenCalled();
    expect(t.stop).toHaveBeenCalledTimes(1);
    expect(t.stop.mock.invocationCallOrder[0]).toBeLessThan((t.run as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0]!);
  });

  it("실패(거부) → failed · 잡은 잠금을 놓는다 · 이동 0", async () => {
    const t = setup({ writer: false, run: vi.fn(async (): Promise<RunResult> => Promise.reject(new Error("tx"))) });
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "failed", stopped: false });
    expect(t.browser.held()).toEqual([]);
    expect(t.go).not.toHaveBeenCalled();
    await flushAll();
    expect(t.heard).toEqual([]);
  });

  it("읽기 불가 → unreadable · 잠금 놓음 · 쓰기 탭이었으면 stopped(닫으면 새로고침)", async () => {
    const t = setup({ writer: false, run: vi.fn(async (): Promise<RunResult> => "unreadable") });
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "unreadable", stopped: false });
    expect(t.browser.held()).toEqual([]);
    const w = setup({ writer: true, run: vi.fn(async (): Promise<RunResult> => "unreadable") });
    await expect(w.deleter.remove("project-1", "가")).resolves.toEqual({ status: "unreadable", stopped: true });
  });

  it("J-S17 이미 지워짐(gone) → 성공과 같게 키·이동 · saved 0(쓰기 없음)", async () => {
    const t = setup({ writer: false, run: vi.fn(async (): Promise<RunResult> => "gone") });
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "done", stopped: false });
    await flushAll();
    expect(t.heard).toEqual([]);
    expect(t.session.setItem).toHaveBeenCalledWith(DELETED_KEY, "가");
    expect(t.go).toHaveBeenCalledWith("/projects");
  });

  it("navigator.locks 없음 = 잠금 없이 진행 · sessionStorage 저장 실패도 이동", async () => {
    const t = setup({ locks: null });
    t.session.setItem.mockImplementation(() => {
      throw new Error("quota");
    });
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "done", stopped: false });
    expect(t.go).toHaveBeenCalledWith("/projects");
  });

  it("탭당 1개(Codex r1 교훈) — 멈춘 쓰기 탭의 재시도가 자기 잠금에 막혀 busy가 되지 않는다", async () => {
    const browser = createLockRegistry();
    const locks = browser.tab();
    const link = createLinkNetwork().tab();
    let writer = false;
    link.attach({ isWriter: () => writer, stop: () => void (writer = false) });
    // 싱크가 잠금을 보유한 쓰기 탭
    void locks.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>(() => undefined));
    writer = true;
    const run = vi.fn<() => Promise<RunResult>>().mockRejectedValueOnce(new Error("tx")).mockResolvedValueOnce("done");
    const deps: DeleteDeps = { locks, factory: {} as IDBFactory, link, session: undefined, go: vi.fn(), run };
    const first = deleterFor(deps);
    await expect(first.remove("project-1", "가")).resolves.toEqual({ status: "failed", stopped: true });
    const again = deleterFor({ ...deps });
    expect(again).toBe(first);
    await expect(again.remove("project-1", "가")).resolves.toEqual({ status: "done", stopped: true });
  });

  it("parity — DB 이름 = 영속 DB 이름 · 1회 키 = 페이지가 읽는 키(리터럴 복제)", () => {
    expect(DELETE_DB_NAME).toBe(DB_NAME);
    expect(DELETED_NOTICE_KEY).toBe(DELETED_KEY);
  });
});
