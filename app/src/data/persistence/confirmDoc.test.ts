/**
 * RESTART SPEC-4 r0.3a 3.5 — `confirmDoc` 계약(MQ-4-2 B · RS4-AC-13 · 17 · 17b). 메모리 가짜 영속으로 앱 조립(deferredStudio)을 돌린다.
 * 확인 = 지금 메모리 레코드를 IDB 커밋까지 · 내용·revision·스냅샷 변화 0 · 이미지 없는 문서는 커밋하지 않는다(fail-closed).
 */
import { describe, expect, it, vi } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { setSlot } from "../../engine/ops/slotOps";
import { makePng } from "../../features/studio/images/ingest/fixtures/imageBytes";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { addImage } from "../../features/studio/images/store/imageStore";
import type { ImageKeeper, RenderImages } from "../../features/studio/images/store/types";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { createLockRegistry, soloLocks } from "./fakeLocks";
import { imageRecordId } from "./imageRecord";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type MemoryPersistenceOptions, type StudioPersistence, type WriteOp } from "./studioPersistence";
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
type Repo = ProjectRepository<PageDoc> & ImageKeeper;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string }) => e.code ?? String(e));
const png = (width: number) => new Blob([new Uint8Array(makePng({ width, height: 10 }))], { type: "image/png" });
const image = (width = 800): IngestedImage => {
  const variants = Object.fromEntries(widthLadder(width).map((w) => [w, png(w)]));
  return { variants, width, height: 400, format: "png", bytes: Object.values(variants).reduce((s, b) => s + b.size, 0) };
};
const imageSlotOf = (doc: PageDoc) => {
  for (const s of doc.sections) for (const [key, v] of Object.entries(s.slots)) if (typeof v === "object" && v.kind === "image") return { section: s, key };
  throw new Error("이미지 슬롯 없음");
};
const withImage = (doc: PageDoc, source: ImageSlotValue["source"]): PageDoc => {
  const { section, key } = imageSlotOf(doc);
  const value = section.slots[key] as ImageSlotValue;
  const next = setSlot(doc, section.instanceId, key, { ...value, enabled: true, source });
  return { ...next, hash: hashDoc(next) };
};
const retitle = (doc: PageDoc, title: string): PageDoc => {
  const next = { ...doc, meta: { ...doc.meta, title } };
  return { ...next, hash: hashDoc(next) };
};
const settle = async () => {
  for (let i = 0; i < 30; i += 1) await Promise.resolve();
};

async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}
function tabOn(persistence: StudioPersistence, locks: WriterLocks = soloLocks(), entry: LocalEntry = {}) {
  const writes: (readonly WriteOp[])[] = [];
  const own: StudioPersistence = { ...persistence, write: (ops) => (writes.push(ops), persistence.write(ops)), close: () => undefined };
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, locks) });
  return { studio, writes };
}
async function started(persistence: StudioPersistence, locks?: WriterLocks) {
  const tab = tabOn(persistence, locks);
  await (await tab.studio.board()).confirmProfile(1, 0);
  const gen = await tab.studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = (await tab.studio.projects()) as Repo;
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  return { projects, doc, writes: tab.writes };
}
function frame(images: RenderImages) {
  return { images, publish: vi.fn() };
}
/** 다음 write 하나를 잡아 두는 가짜 — 잡힌 순번을 실패시킬 수 있다 */
function held() {
  const gate: { arm?: Promise<void>; seq?: number; failSeq?: number; failAll?: boolean } = {};
  const options: MemoryPersistenceOptions = {
    commit: (n) => {
      if (!gate.arm) return undefined;
      const arm = gate.arm;
      gate.arm = undefined;
      gate.seq = n;
      return arm;
    },
    fail: (n) => (gate.failAll || n === gate.failSeq ? new DOMException("x", "QuotaExceededError") : undefined),
  };
  return { gate, persistence: createMemoryPersistence(options) };
}
const savedDoc = async (persistence: StudioPersistence) => ((await persistence.get("docs", "project-1")) as { data: { doc: PageDoc } } | undefined)?.data.doc;

describe("confirmDoc 계약 — 내용·revision·스냅샷 변화 0 (RS4-AC-13)", () => {
  it("미확인 없음(직전 저장 확인됨) → resolve · IDB 쓰기 0 · 메모리 변화 0", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc, writes } = await started(persistence);
    const one = await projects.saveDoc("project-1", doc.revision, retitle(doc, "하나"));
    const before = { doc: await projects.getDoc("project-1"), snaps: await projects.listSnapshots("project-1"), writes: writes.length };
    await projects.confirmDoc("project-1");
    expect(writes.length).toBe(before.writes);
    expect(await projects.getDoc("project-1")).toEqual(before.doc);
    expect(await projects.listSnapshots("project-1")).toEqual(before.snaps);
    expect((await savedDoc(persistence))?.revision).toBe(one.revision);
  });

  it("커밋 뒤 IDB 실패(미확인) → confirmDoc = 같은 레코드 재제출 → IDB = 메모리 · revision 증가 0", async () => {
    const { gate, persistence } = held();
    const { projects, doc } = await started(persistence);
    gate.failAll = true;
    expect(await codeOf(projects.saveDoc("project-1", doc.revision, retitle(doc, "실패한 저장")))).toBe("INFRA");
    const mem = (await projects.getDoc("project-1"))!;
    expect(await codeOf(projects.confirmDoc("project-1"))).toBe("INFRA");
    gate.failAll = false;
    expect(await codeOf(projects.confirmDoc("project-1"))).toBe("ok");
    expect(await projects.getDoc("project-1")).toEqual(mem);
    expect((await savedDoc(persistence))?.hash).toBe(mem.hash);
  });

  it("메모리에 문서 없음 = NOT_FOUND · memory 모드 = 즉시 resolve", async () => {
    const persistence = createMemoryPersistence();
    const { projects } = await started(persistence);
    expect(await codeOf(projects.confirmDoc("project-없음"))).toBe("NOT_FOUND");
    const memoryOnly = createDeferredStudio(async () => FIXTURE_CATALOG, imports);
    await (await memoryOnly.board()).confirmProfile(1, 0);
    const gen = await memoryOnly.generations();
    let job = await gen.requestGeneration("profile-1", 1);
    for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
    const repo = await memoryOnly.projects();
    await repo.startDoc("project-1", 1, "B", "create");
    expect(await codeOf(repo.confirmDoc("project-1"))).toBe("ok");
  });
});

describe("confirmDoc 이미지 fail-closed (RS4-AC-17 · 17b)", () => {
  it("P-3 a — 읽기 전용 탭에서 새 이미지 참조 저장(제출 0) → 편집기 이탈 → 보유 탭 닫힘 → 맵 없이 확인 = IMAGES_MISSING · IDB 쓰기 0", async () => {
    const persistence = createMemoryPersistence();
    const browser = createLockRegistry();
    const seedLock = browser.tab();
    await started(persistence, seedLock);
    await settle();
    seedLock.close();
    const holder = browser.tab();
    let releaseHolder!: () => void;
    void holder.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>((ok) => (releaseHolder = ok)));
    const a = tabOn(persistence, browser.tab(), await entryFrom(persistence, "project-1"));
    const projects = (await a.studio.projects()) as Repo;
    const doc = (await projects.getDoc("project-1"))!;
    const view = frame(addImage({}, uuid(1), image(), 1920));
    const leave = projects.images?.("project-1", view.images, view.publish);
    expect(await codeOf(projects.saveDoc("project-1", doc.revision, withImage(doc, uuid(1))))).toBe("INFRA");
    if (typeof leave === "function") leave();
    releaseHolder();
    holder.close();
    await settle();
    const count = a.writes.length;
    expect(await codeOf(projects.confirmDoc("project-1"))).toBe("IMAGES_MISSING");
    expect(a.writes.length).toBe(count);
    expect(await persistence.keys("images")).toEqual([]);
    expect((await savedDoc(persistence))?.hash).not.toBe(withImage(doc, uuid(1)).hash);
  });

  it("맵 없이(편집기 밖) 확인 · 참조 이미지가 IDB에 없음 → IMAGES_MISSING · 쓰기 0 / 맵 있음(편집기 안) → 문서 + 이미지 커밋", async () => {
    const { gate, persistence } = held();
    const { projects, doc, writes } = await started(persistence);
    const view = frame(addImage({}, uuid(1), image(), 1920));
    const leave = projects.images?.("project-1", view.images, view.publish);
    gate.failAll = true;
    expect(await codeOf(projects.saveDoc("project-1", doc.revision, withImage(doc, uuid(1))))).toBe("INFRA");
    gate.failAll = false;
    // 실패 기록은 큐에 이미지 op째 남아 있다 → 재제출이 이미지까지 쓴다(대조: 확인 성공)
    expect(await codeOf(projects.confirmDoc("project-1"))).toBe("ok");
    expect(await persistence.keys("images")).toEqual([imageRecordId("project-1", uuid(1))]);
    if (typeof leave === "function") leave();

    // 새 참조(uuid2) — 맵 없이 메모리만 바뀐 경우를 만든다: 저장 자체가 IDB에서 실패하고 큐 기록을 뒤 저장이 대체
    const one = (await projects.getDoc("project-1"))!;
    const view2 = frame(addImage({}, uuid(2), image(900), 1920));
    const leave2 = projects.images?.("project-1", view2.images, view2.publish);
    gate.failAll = true;
    expect(await codeOf(projects.saveDoc("project-1", one.revision, withImage(one, uuid(2))))).toBe("INFRA");
    if (typeof leave2 === "function") leave2();
    gate.failAll = false;
    const count = writes.length;
    // 실패 기록의 이미지 op가 남아 있으면 재제출로 이미지까지 커밋된다 — 어느 쪽이든 "이미지 없는 문서 커밋" 0
    const result = await codeOf(projects.confirmDoc("project-1"));
    const committed = await savedDoc(persistence);
    if (result === "ok") expect(await persistence.keys("images")).toContain(imageRecordId("project-1", uuid(2)));
    else {
      expect(result).toBe("IMAGES_MISSING");
      expect(writes.length).toBe(count);
      expect(committed?.hash).not.toBe(withImage(one, uuid(2)).hash);
    }
  });

  it("앞선 이미지 put 진행 중 → 맵 없이 확인 → 앞선 put 실패 → 이미지 없는 문서로 resolve하지 않는다(17b)", async () => {
    const { gate, persistence } = held();
    const { projects, doc } = await started(persistence);
    const view = frame(addImage({}, uuid(1), image(), 1920));
    const leave = projects.images?.("project-1", view.images, view.publish);
    let release!: () => void;
    gate.arm = new Promise<void>((ok) => (release = ok));
    const first = codeOf(projects.saveDoc("project-1", doc.revision, withImage(doc, uuid(1))));
    await vi.waitFor(() => expect(gate.seq).toBeDefined());
    if (typeof leave === "function") leave();
    const confirming = codeOf(projects.confirmDoc("project-1"));
    await settle();
    gate.failSeq = gate.seq;
    release();
    expect(await first).toBe("INFRA");
    const result = await confirming;
    const keys = await persistence.keys("images");
    const committed = await savedDoc(persistence);
    // 성공했다면 이미지도 있어야 하고, 이미지가 없으면 성공하면 안 된다
    if (result === "ok") expect(keys).toContain(imageRecordId("project-1", uuid(1)));
    else expect(committed?.hash ?? "").not.toBe(withImage(doc, uuid(1)).hash);
  });
});
