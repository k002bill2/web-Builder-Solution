/**
 * 내보내기 읽기 (P2-SPEC 3.6 — IDB readonly 한 트랜잭션 `studio·docs·images` · 봉투 mismatch·invalid = EX-6 · 그 프로젝트 없음 = EX-7).
 * 손 IDB 가짜(jsdom에 IndexedDB 없음) — 실제 IDB는 Ego Lite.
 */
import { describe, expect, it } from "vitest";
import { DB_NAME, SCHEMA_VERSION } from "../../data/persistence/envelope";
import { fakeDeps, fakeImageBytes, seedDocRecord, seedProject, seedSeries } from "../../test/projectFileFixtures";
import { checkFile } from "./checkFile";
import { encodeProjectFile } from "./encode";
import { readImageRecord } from "../../data/persistence/imageRecord";
import { WIDTH_STEPS, widthLadder } from "../studio/images/ingest/ladder";
import { MAX_PIXELS, MAX_SIDE } from "../studio/images/ingest/limits";
import { EXPORT_DB_NAME, EXPORT_MAX_PIXELS, EXPORT_MAX_SIDE, EXPORT_WIDTH_STEPS, exportImageOf, readProject } from "./readProject";

const env = (kind: string, id: string, data: unknown, schemaVersion = SCHEMA_VERSION) => ({ schemaVersion, kind, id, data });

/** 가져오기 레코드 규칙(recordsHold)을 지키는 시드 — Codex r2 */
const project = (n: number) => Object.freeze(seedProject(`project-${n}`, `profile-${n}`));
const version = (n: number, v: number) => Object.freeze(seedSeries(`profile-${n}`)[v - 1]!);

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

/** 저장 규칙(readImageRecord)을 지키는 레코드 — 폭 640 사다리 1단 · PNG 서명 바이트 · bytes = 변형본 합 */
const image = (tag: string) => {
  const blob = new Blob([fakeImageBytes("png", 640, 480, tag) as BlobPart], { type: "image/png" });
  return { variants: { 640: blob }, width: 640, height: 480, format: "png", bytes: blob.size };
};
const docData = seedDocRecord("project-1");

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

describe("Codex r1 — 이미지 레코드는 저장 규칙 전체(readImageRecord)로 검사 · 실패 레코드 제외", () => {
  const png = (w: number, h: number) => new Blob([fakeImageBytes("png", w, h) as BlobPart], { type: "image/png" });
  /** width 1280인데 변형본 640만(사다리 640·1280 아님) */
  const shortLadder = () => {
    const v = png(640, 240);
    return { variants: { 640: v }, width: 1280, height: 480, format: "png", bytes: v.size };
  };
  const emptyVariants = { variants: {}, width: 640, height: 480, format: "png", bytes: 0 };

  it("width 1280 + variants 640만 · variants {} → 제외 · 나머지 정상 이미지는 포함", async () => {
    const images = new Map<string, unknown>([
      ["project-1/a", env("image", "project-1/a", image("a"))],
      ["project-1/b", env("image", "project-1/b", shortLadder())],
      ["project-1/c", env("image", "project-1/c", emptyVariants)],
      ["project-1/d", env("image", "project-1/d", image("d"))],
    ]);
    const result = await readProject(seeded({ images }).factory, "project-1");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.source.images.map((i) => i.localId)).toEqual(["a", "d"]);
    expect(result.source.images[0]!.image).toEqual(image("a"));
  });

  it("왕복 보장 — 정상 1 + 손상 1 시드 → readProject → encodeProjectFile → checkFile(L1) ok · 이미지 = 정상 1", async () => {
    const good = png(640, 480);
    const idb = fakeIdb({
      studio: new Map([["state", env("state", "state", stateData({ projects: new Map([["project-1", seedProject()]]), series: new Map([["profile-1", seedSeries()]]) }))]]),
      docs: new Map([["project-1", env("doc", "project-1", seedDocRecord())]]),
      images: new Map<string, unknown>([
        ["project-1/good", env("image", "project-1/good", { variants: { 640: good }, width: 640, height: 480, format: "png", bytes: good.size })],
        ["project-1/bad", env("image", "project-1/bad", shortLadder())],
      ]),
    });
    const read = await readProject(idb.factory, "project-1");
    if (read.status !== "ok") throw new Error(read.status);
    const encoded = await encodeProjectFile({ ...read.source, exportedAt: "2026-10-08T09:12:33.000Z" });
    if (!encoded.ok) throw new Error(encoded.message);
    const checked = await checkFile(encoded.blob, fakeDeps().deps);
    expect(checked).toMatchObject({ ok: true });
    if (!checked.ok) return;
    expect(checked.file.images.map((i) => [i.localId, i.width, Object.keys(i.variants)])).toEqual([["good", 640, ["640"]]]);
  });
});

describe("Codex r2 — 문서·스냅샷·계열·프로젝트도 가져오기와 같은 레코드 규칙(recordsHold) · 실패 = unreadable(EX-6)", () => {
  const record = seedDocRecord("project-1");
  const v1 = version(1, 1);
  const v2 = version(1, 2);
  const v2NoBase = Object.fromEntries(Object.entries(v2).filter(([key]) => key !== "base"));
  const withState = (over: Record<string, unknown>) => env("state", "state", stateData(over));

  it.each([
    ["문서 hash만 변경(Codex 재현)", { doc: env("doc", "project-1", { ...record, doc: { ...record.doc, hash: "x" } }) }],
    ["스냅샷 문서 hash 변경", { doc: env("doc", "project-1", { ...record, snapshots: [{ ...record.snapshots[0]!, doc: { ...record.doc, hash: "x" } }] }) }],
    ["계열 v2 프로필 모양 손상(base 없음)", { state: withState({ series: new Map([["profile-1", [v1, v2NoBase]]]) }) }],
    ["계열 버전 건너뜀(1·3)", { state: withState({ series: new Map([["profile-1", [v1, { ...v2, version: 3 }]]]) }) }],
    ["프로젝트 이름 규칙 밖(앞뒤 공백)", { state: withState({ projects: new Map([["project-1", { ...project(1), name: " 강남 " }]]) }) }],
  ])("%s → unreadable · 연결 닫음", async (_, over) => {
    const idb = seeded(over);
    await expect(readProject(idb.factory, "project-1")).resolves.toEqual({ status: "unreadable" });
    expect(idb.closed()).toBe(1);
  });

  it("왕복 보장 — 정상 시드 → readProject → encodeProjectFile → checkFile(L1 실제) ok · 레코드·이미지 그대로", async () => {
    // 가짜 디코더는 표시 없는 "가로x세로" 바이트만 읽는다 — image(tag) 대신 표시 없는 PNG
    const plain = () => {
      const blob = new Blob([fakeImageBytes("png", 640, 480) as BlobPart], { type: "image/png" });
      return { variants: { 640: blob }, width: 640, height: 480, format: "png", bytes: blob.size };
    };
    const images = new Map([
      ["project-1/a", env("image", "project-1/a", plain())],
      ["project-1/b", env("image", "project-1/b", plain())],
    ]);
    const read = await readProject(seeded({ images }).factory, "project-1");
    if (read.status !== "ok") throw new Error(read.status);
    const encoded = await encodeProjectFile({ ...read.source, exportedAt: "2026-10-08T09:12:33.000Z" });
    if (!encoded.ok) throw new Error(encoded.message);
    const checked = await checkFile(encoded.blob, fakeDeps().deps);
    expect(checked).toMatchObject({ ok: true });
    if (!checked.ok) return;
    expect(checked.file.project).toEqual(read.source.project);
    expect(checked.file.series).toEqual(read.source.series);
    expect(checked.file.doc).toEqual(read.source.doc);
    expect(checked.file.images.map((i) => i.localId).sort()).toEqual(["a", "b"]);
  });
});

describe("exportImageOf = readImageRecord parity (리터럴 복제 — 진입 closure를 import하지 않으려고)", () => {
  it("한도·사다리 상수 = limits·ladder", () => {
    expect([EXPORT_MAX_SIDE, EXPORT_MAX_PIXELS, EXPORT_WIDTH_STEPS]).toEqual([MAX_SIDE, MAX_PIXELS, [...WIDTH_STEPS]]);
  });

  const blobOf = (format: string, w: number) => new Blob([fakeImageBytes(format, w, 10) as BlobPart]);
  const valid = (width: number, height: number, format = "png") => {
    const variants = Object.fromEntries(widthLadder(width).map((w) => [w, blobOf(format, w)]));
    return { variants, width, height, format, bytes: Object.values(variants).reduce((sum, b) => sum + b.size, 0) };
  };
  const id = "project-1/x";
  const base = valid(800, 400);
  const corpus: Array<[string, unknown]> = [
    ...[500, 640, 800, 1280, 1500, 1920, 2400].map((w) => [`정상 png ${w}`, env("image", id, valid(w, 300))] as [string, unknown]),
    ["정상 jpeg", env("image", id, valid(800, 400, "jpeg"))],
    ["정상 webp", env("image", id, valid(800, 400, "webp"))],
    ["레코드 없음", undefined],
    ["null", null],
    ["kind 다름", env("doc", id, base)],
    ["id 다름", env("image", "project-1/y", base)],
    ["schemaVersion 2", env("image", id, base, 2)],
    ["data null", env("image", id, null)],
    ["형식 gif", env("image", id, { ...base, format: "gif" })],
    ["사다리 1280 단 추가", env("image", id, { ...base, variants: { ...base.variants, 1280: blobOf("png", 1280) } })],
    ["사다리 640 빠짐", env("image", id, { ...base, variants: { 800: base.variants[800] } })],
    ["width 1280 · 변형본 640만", env("image", id, { ...valid(640, 300), width: 1280 })],
    ["variants {}", env("image", id, { ...base, variants: {}, bytes: 0 })],
    ["서명 ≠ 형식(png 바이트 webp로)", env("image", id, { ...base, format: "webp" })],
    ["bytes ≠ 합", env("image", id, { ...base, bytes: base.bytes + 1 })],
    ["높이 한도 밖", env("image", id, { ...base, height: 16_385 })],
    ["픽셀 한도 밖", env("image", id, valid(8000, 6000))],
    ["높이 소수", env("image", id, { ...base, height: 1.5 })],
    ["폭 0", env("image", id, { ...base, width: 0 })],
    ["변형본 Blob 아님", env("image", id, { ...base, variants: { 640: "x", 800: base.variants[800] } })],
  ];

  it.each(corpus)("%s → 원본과 같은 판정", async (_, record) => {
    const [mine, original] = await Promise.all([exportImageOf(record, id), readImageRecord(record, id)]);
    expect(mine).toEqual(original);
  });

  it("말뭉치에 통과·거절이 둘 다 있다(대조가 한쪽으로 쏠리지 않게)", async () => {
    const passed = await Promise.all(corpus.map(([, record]) => readImageRecord(record, id)));
    expect(passed.filter(Boolean)).toHaveLength(9);
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
