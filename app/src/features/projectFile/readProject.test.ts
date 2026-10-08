/**
 * 내보내기 읽기 (P2-SPEC 3.6 — IDB readonly 한 트랜잭션 `studio·docs·images` · 봉투 mismatch·invalid = EX-6 · 그 프로젝트 없음 = EX-7).
 * 손 IDB 가짜(jsdom에 IndexedDB 없음) — 실제 IDB는 Ego Lite.
 */
import { describe, expect, it } from "vitest";
import { DB_NAME, SCHEMA_VERSION } from "../../data/persistence/envelope";
import { EXPORT_DB_NAME, readProject } from "./readProject";

const env = (kind: string, id: string, data: unknown, schemaVersion = SCHEMA_VERSION) => ({ schemaVersion, kind, id, data });

const project = (n: number) => Object.freeze({ projectId: `project-${n}`, profileId: `profile-${n}`, name: `이름 ${n}`, revision: 1 });
const version = (n: number, v: number) => Object.freeze({ profileId: `profile-${n}`, version: v });

function stateData(over: Record<string, unknown> = {}) {
  return {
    // 저장 순서를 믿지 않는다 — 일부러 내림차순
    series: new Map([
      ["profile-1", [version(1, 2), version(1, 1)]],
      ["profile-10", [version(10, 1)]],
    ]),
    commits: new Map(),
    adjustCommits: new Map(),
    jobs: new Map(),
    projects: new Map([
      ["project-1", project(1)],
      ["project-10", project(10)],
    ]),
    heads: new Map(),
    gen: 3,
    ...over,
  };
}

const image = (tag: string) => ({ variants: { 640: new Blob([tag]) }, width: 640, height: 480, format: "png", bytes: tag.length });
const docData = { doc: { projectId: "project-1", hash: "h" }, snapshots: [], snapshotSeq: 2 };

/** 손 IDB 가짜 — 요청은 마이크로태스크 뒤 성공. 트랜잭션·연결 닫기를 기록한다 */
function fakeIdb(initial: Record<string, ReadonlyMap<string, unknown>>) {
  const stores = new Map(Object.entries(initial).map(([name, records]) => [name, new Map(records)]));
  const txs: { names: string[]; mode: string }[] = [];
  const opened: unknown[][] = [];
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
    transaction(names: string[], mode = "readonly") {
      txs.push({ names: [...names], mode });
      return {
        objectStore(name: string) {
          const store = stores.get(name)!;
          return {
            get: (key: string) => request(() => store.get(key)),
            getAllKeys: () => request(() => [...store.keys()]),
            put: () => {
              throw new Error("읽기 전용");
            },
          };
        },
      };
    },
  };
  const factory = {
    open: (...args: unknown[]) => {
      opened.push(args);
      return request(() => db);
    },
  } as unknown as IDBFactory;
  return { factory, txs, opened, closed: () => closed };
}

function seeded(over: { state?: unknown; doc?: unknown; images?: ReadonlyMap<string, unknown> } = {}) {
  const docs = new Map<string, unknown>([["project-10", env("doc", "project-10", { doc: {}, snapshots: [] })]]);
  if (over.doc !== null) docs.set("project-1", over.doc ?? env("doc", "project-1", docData));
  const studio = new Map<string, unknown>();
  if (over.state !== null) studio.set("state", over.state ?? env("state", "state", stateData()));
  return fakeIdb({
    meta: new Map(),
    studio,
    docs,
    images:
      over.images ??
      new Map([
        ["project-1/b", env("image", "project-1/b", image("bb"))],
        ["project-1/a", env("image", "project-1/a", image("a"))],
        ["project-10/a", env("image", "project-10/a", image("x"))],
      ]),
  });
}

describe("readProject — 읽기 한 트랜잭션 (P2-SPEC 3.6)", () => {
  it("DB 이름 = envelope.DB_NAME (parity — 진입 closure를 import하지 않으려고 리터럴)", () => {
    expect(EXPORT_DB_NAME).toBe(DB_NAME);
  });

  it("readonly 트랜잭션 1개(studio·docs·images) · 프로젝트·계열(오름차순)·문서·그 프로젝트 이미지만 · 연결 닫음 · 버전 없이 연다", async () => {
    const idb = seeded();
    const result = await readProject(idb.factory, "project-1");
    expect(idb.opened).toEqual([[EXPORT_DB_NAME]]);
    expect(idb.txs).toEqual([{ names: ["studio", "docs", "images"], mode: "readonly" }]);
    expect(idb.closed()).toBe(1);
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    const { project: p, series, doc, images } = result.source;
    expect(p).toEqual(project(1));
    expect(series.map((v) => v.version)).toEqual([1, 2]);
    expect(series.every((v) => v.profileId === "profile-1")).toBe(true);
    expect(doc).toEqual(docData);
    // 슬래시 포함 접두 — project-10/a 무접촉
    expect(images.map((i) => i.localId).sort()).toEqual(["a", "b"]);
    expect(images.find((i) => i.localId === "b")!.image).toEqual(image("bb"));
  });

  it("문서 레코드 없음 = doc null(편집 문서를 아직 만들지 않은 프로젝트)", async () => {
    const result = await readProject(seeded({ doc: null }).factory, "project-1");
    expect(result.status === "ok" && result.source.doc).toBeNull();
  });

  it("깨진 이미지 레코드(봉투 id 불일치·변형본 아님)는 건너뛴다 — 열기에서도 잃은 이미지", async () => {
    const images = new Map<string, unknown>([
      ["project-1/a", env("image", "project-1/a", image("a"))],
      ["project-1/b", env("image", "project-1/zz", image("b"))],
      ["project-1/c", env("image", "project-1/c", { ...image("c"), variants: { 640: "문자열" } })],
      ["project-1/d", env("image", "project-1/d", image("d"), 2)],
    ]);
    const result = await readProject(seeded({ images }).factory, "project-1");
    expect(result.status === "ok" && result.source.images.map((i) => i.localId)).toEqual(["a"]);
  });
});

describe("readProject — 실패 (EX-6 unreadable · EX-7 gone)", () => {
  it.each([
    ["상태 봉투 schemaVersion 99", env("state", "state", stateData(), 99)],
    ["상태 봉투 kind 다름", env("doc", "state", stateData())],
    ["projects가 Map 아님", env("state", "state", stateData({ projects: {} }))],
    ["data null", env("state", "state", null)],
  ])("%s → unreadable · 연결 닫음", async (_, state) => {
    const idb = seeded({ state });
    await expect(readProject(idb.factory, "project-1")).resolves.toEqual({ status: "unreadable" });
    expect(idb.closed()).toBe(1);
  });

  it("문서 봉투 mismatch·invalid → unreadable", async () => {
    await expect(readProject(seeded({ doc: env("doc", "project-1", docData, 2) }).factory, "project-1")).resolves.toEqual({ status: "unreadable" });
    await expect(readProject(seeded({ doc: env("doc", "project-9", docData) }).factory, "project-1")).resolves.toEqual({ status: "unreadable" });
  });

  it("그 프로젝트 없음(다른 탭이 지움) · 상태 레코드 없음 · 저장소 없는 DB → gone", async () => {
    await expect(readProject(seeded().factory, "project-2")).resolves.toEqual({ status: "gone" });
    await expect(readProject(seeded({ state: null }).factory, "project-1")).resolves.toEqual({ status: "gone" });
    const empty = fakeIdb({});
    await expect(readProject(empty.factory, "project-1")).resolves.toEqual({ status: "gone" });
    expect(empty.txs).toEqual([]);
    expect(empty.closed()).toBe(1);
  });
});
