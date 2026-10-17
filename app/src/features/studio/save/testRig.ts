/**
 * 저장 코어 테스트 장치(RS6-L1) — 하네스 `save-core-harness/test/helpers.ts`의 제품판. 영속 = 제품 `createMemoryPersistence`,
 * 싱크 = 제품 `openLocalSync`(포트 구현), 저장소 = 앱 조립(createDeferredStudio). 실제 IndexedDB 아님. 테스트 전용 — 앱 코드는 import하지 않는다.
 */
import { isTerminal } from "../../../domain/generation";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../../engine/contracts/pageDoc";
import { hashDoc } from "../../../engine/ops/hash";
import { setSlot } from "../../../engine/ops/slotOps";
import { makePng } from "../images/ingest/fixtures/imageBytes";
import { widthLadder } from "../images/ingest/ladder";
import type { IngestedImage } from "../images/ingest/types";
import { addImage, slotTarget } from "../images/store/imageStore";
import type { RenderImages } from "../images/store/types";
import { FIXTURE_CATALOG, boardOf } from "../../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../../../data/deferredStudio";
import type { ProjectRepository } from "../../../data/projectRepository";
import type { DocRecord, LocalEntry } from "../../../data/persistence/entryRead";
import { createLinkNetwork } from "../../../data/persistence/fakeTabLink";
import { createLockRegistry } from "../../../data/persistence/fakeLocks";
import { openLocalSync } from "../../../data/persistence/localSync";
import { createMemoryPersistence, type StudioPersistence, type WriteOp } from "../../../data/persistence/studioPersistence";
import type { TabLink } from "../../../data/persistence/tabLink";
import type { WriterLocks } from "../../../data/persistence/writerLock";
import type { CoreKeeper, SaveCore } from "./saveCore";

export const PROJECT = "project-1";
export type Repo = ProjectRepository<PageDoc> & CoreKeeper;

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

export interface Deferred {
  readonly promise: Promise<void>;
  release(): void;
}
export const deferred = (): Deferred => {
  let release = () => undefined as void;
  const promise = new Promise<void>((r) => (release = r));
  return { promise, release };
};

export const ticks = async (n = 20) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0));
};

/** 영속 장치 — write 호출을 기록하고 "다음 write"를 막거나(hold) 실패시키거나(failNext) 반영 없이 거짓 성공(dropNext)시킨다 */
export function harnessDb() {
  const holds = new Map<number, Deferred>();
  const fails = new Map<number, unknown>();
  const drops = new Map<number, (ops: readonly WriteOp[]) => readonly WriteOp[]>();
  const ops: (readonly WriteOp[])[] = [];
  /** 다음 docs 읽기를 막는다(확인·폐기 재읽기 await 사이 편집 재현) */
  let readGate: { readonly store: string; readonly gate: Deferred; readonly reached: Deferred } | undefined;
  const inner = createMemoryPersistence({ commit: (n) => holds.get(n)?.promise, fail: (n) => fails.get(n) });
  const persistence: StudioPersistence = {
    ...inner,
    get: async (store, id) => {
      const held = store === readGate?.store ? readGate : undefined;
      if (held) {
        readGate = undefined;
        held.reached.release();
        await held.gate.promise;
      }
      return inner.get(store, id);
    },
    write: (batch) => {
      ops.push(batch);
      const keep = drops.get(ops.length);
      return keep ? inner.write(keep(batch)) : inner.write(batch);
    },
  };
  const next = () => ops.length + 1;
  return {
    persistence,
    ops,
    /** 지금부터 n번째(1부터) write */
    hold(n = 1) {
      const d = deferred();
      holds.set(ops.length + n, d);
      return d;
    },
    failNext(name: "QuotaExceededError" | "AbortError") {
      fails.set(next(), new DOMException("injected", name));
    },
    /** 다음 write는 keep(ops)만 반영하고 성공으로 끝난다(M8·M9 — 어댑터 거짓 성공) */
    dropNext(keep: (ops: readonly WriteOp[]) => readonly WriteOp[] = () => []) {
      drops.set(next(), keep);
    },
    /** 다음 store 읽기(get)를 막는다 — reached = 그 읽기에 닿음 · release = 진행 */
    holdRead(store: "docs" | "meta" = "docs") {
      const held = { store, gate: deferred(), reached: deferred() };
      readGate = held;
      return { reached: held.reached.promise, release: held.gate.release };
    },
    since: (start: number) => ops.slice(start),
    async doc(projectId = PROJECT) {
      return ((await persistence.get("docs", projectId)) as { data?: Omit<DocRecord, "doc"> & { readonly doc: PageDoc } } | undefined)?.data;
    },
  };
}
export type HarnessDb = ReturnType<typeof harnessDb>;

export const edited = (doc: PageDoc, title: string): PageDoc => {
  const next = { ...doc, meta: { ...doc.meta, title } };
  return { ...next, hash: hashDoc(next) };
};

export interface TabOptions {
  readonly locks?: WriterLocks | undefined;
  readonly link?: TabLink;
  readonly entry?: LocalEntry;
  /** 메모리 모드(로컬 영속 없음) */
  readonly memory?: boolean;
}

export function studioTab(db: HarnessDb, { locks = createLockRegistry().tab(), link = createLinkNetwork().tab(), entry = {}, memory }: TabOptions = {}) {
  return createDeferredStudio(async () => FIXTURE_CATALOG, imports, memory ? undefined : { entry, sync: (e) => openLocalSync(e, async () => db.persistence, locks, link) });
}

/** 확정 → 3안 → B안 편집 시작(앱 흐름) → 설정 쓰기가 가라앉을 때까지 */
export async function startedRig(options: TabOptions = {}) {
  const db = harnessDb();
  const studio = studioTab(db, options);
  await (await studio.board()).confirmProfile(1, 0);
  const gen = await studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const repo = (await studio.projects()) as Repo;
  const { doc } = await repo.startDoc(PROJECT, 1, "B", "create");
  await ticks();
  const core = (seed: PageDoc = doc): SaveCore => repo.core!(PROJECT, seed);
  return { db, studio, repo, doc, core };
}

/** 코어 io 위임(①) 호출 모양 — 화면(L3·L4)이 부를 방식 그대로 */
export const confirmOf = (core: SaveCore) => core.link((io, s, link) => io.confirm(s, link, core.save));

export const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const png = (width: number) => new Blob([new Uint8Array(makePng({ width, height: 10 }))], { type: "image/png" });
export const image = (width = 800): IngestedImage => {
  const variants = Object.fromEntries(widthLadder(width).map((w) => [w, png(w)]));
  return { variants, width, height: 400, format: "png", bytes: Object.values(variants).reduce((sum, b) => sum + b.size, 0) };
};
const imageSlotOf = (doc: PageDoc) => {
  for (const section of doc.sections) for (const [key, v] of Object.entries(section.slots)) if (typeof v === "object" && v.kind === "image") return { section, key };
  throw new Error("이미지 슬롯 없음");
};
/** 첫 이미지 슬롯에 로컬 이미지 id를 건 문서 */
export const withImage = (doc: PageDoc, id: LocalImageId): PageDoc => {
  const { section, key } = imageSlotOf(doc);
  const next = setSlot(doc, section.instanceId, key, { ...(section.slots[key] as ImageSlotValue), enabled: true, source: id });
  return { ...next, hash: hashDoc(next) };
};
/** 편집기 ingest 결과 바인딩(Blob + 메타) */
export const bindOf = (doc: PageDoc, id: LocalImageId, img: IngestedImage = image()): RenderImages => {
  const { section } = imageSlotOf(doc);
  return addImage({}, id, img, slotTarget(section.type, section.variant));
};
