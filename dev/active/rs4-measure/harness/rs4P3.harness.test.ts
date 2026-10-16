/**
 * RS4 측정 하네스(P-3 · SPEC-4 RS4-AC-17 · RS4-R10) — 측정 전용, 앱 영구 수정 아님. 원본 = dev/active/rs4-measure/harness/.
 * 질문: 편집기 밖 "저장 확인"(`deleteSnapshot(projectId, "")`)이 쓰기 문이 막혔던 편집의 새 이미지를 IDB images에 넣는가.
 * 브라우저 1개 = 메모리 가짜 영속 1개 + 잠금 가짜 registry 1개(restartLock.test.ts · imagePersist.test.ts 패턴). 실제 IDB oncomplete는 jsdom에 없다.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { setSlot } from "../../engine/ops/slotOps";
import { makePng } from "../../features/studio/images/ingest/fixtures/imageBytes";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { addImage, slotTarget } from "../../features/studio/images/store/imageStore";
import type { ImageKeeper, RenderImages } from "../../features/studio/images/store/types";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { createLockRegistry } from "./fakeLocks";
import { imageRecordId } from "./imageRecord";
import { IMAGE_READ } from "./imageRestore";
import { toInfra } from "./infra";
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
type Repo = ProjectRepository<PageDoc> & ImageKeeper;
const P = "project-1";
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const codeOf = (p: Promise<unknown>) => p.then(() => "ok", (e: { code?: string; message?: string }) => `${e.code ?? ""}:${e.message ?? String(e)}`);
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
const settle = async () => {
  for (let i = 0; i < 40; i += 1) await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
};
async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}
type SavedRecord = { doc: PageDoc; snapshots: { snapshotId: string; kind: string; name?: string }[]; snapshotSeq?: number };
const savedRecord = async (persistence: StudioPersistence) => (checkEnvelope(await persistence.get("docs", P), "doc", P) as { data: SavedRecord }).data;
/** 쓰기 경계 캡처 + 선택적 실패(quota) */
async function openTab(persistence: StudioPersistence, locks: WriterLocks | undefined, projectId?: string) {
  const writes: (readonly WriteOp[])[] = [];
  const gate = { fail: false };
  const own: StudioPersistence = {
    ...persistence,
    write: (ops) => (writes.push(ops), gate.fail ? Promise.reject(toInfra(new DOMException("x", "QuotaExceededError"), "저장")) : persistence.write(ops)),
    close: () => undefined,
  };
  const entry = await entryFrom(persistence, projectId);
  const studio = createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => own, locks) });
  return { studio, writes, gate, projects: async () => (await studio.projects()) as Repo };
}
/** 시드: 확정 → 3안 → B안 편집 시작(이미지 없음) → 닫기 */
async function seeded() {
  const persistence = createMemoryPersistence();
  const browser = createLockRegistry();
  const lock = browser.tab();
  const tab = await openTab(persistence, lock);
  await (await tab.studio.board()).confirmProfile(1, 0);
  const gen = await tab.studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  await (await tab.projects()).startDoc(P, 1, "B", "create");
  await settle();
  lock.close();
  return { persistence, browser };
}
/** 편집기 흉내: 맵 등록(cleanup 반환) + 새 이미지 문서 */
function editorWithImage(projects: Repo, base: PageDoc) {
  const next = withImage(base, uuid(1));
  const { section } = imageSlotOf(next);
  let images: RenderImages | undefined = addImage({}, uuid(1), image(), slotTarget(section.type, section.variant));
  const unregister = projects.images!(P, images, (u) => (images = u(images)));
  return { next, unregister: unregister as unknown as () => void };
}
const opsSummary = (writes: readonly (readonly WriteOp[])[]) =>
  writes.map((ops) => ops.map((op) => (op.type === "put" ? `put:${op.store}:${op.record.id}` : `delete:${op.store}:${op.id}`)));
const docRefsImage = (doc: PageDoc) => JSON.stringify(doc).includes(uuid(1));
/** 새 세션 복원(새로고침 흉내) — 맵 없음 마운트 → 이미지 복원 publish */
async function reopen(persistence: StudioPersistence) {
  IMAGE_READ.read = (key) => persistence.get("images", key);
  const tab = await openTab(persistence, createLockRegistry().tab(), P);
  const repo = await tab.projects();
  let restored: RenderImages | undefined;
  const publish = vi.fn((u: (prev: RenderImages | undefined) => RenderImages | undefined) => (restored = u(restored)));
  repo.images?.(P, undefined, publish);
  await vi.waitFor(() => expect(publish).toHaveBeenCalled(), { timeout: 1500 }).catch(() => undefined);
  return { doc: await repo.getDoc(P), restored, publishCalls: publish.mock.calls.length };
}
const log = (label: string, value: unknown) => console.log(`[P3] ${label} ${JSON.stringify(value)}`);
const original = IMAGE_READ.read;
afterEach(() => {
  IMAGE_READ.read = original;
});

describe("P-3 a. 잠금 거절(읽기 전용 탭) → 편집기 이탈 → 보유 탭 닫힘 → 편집기 밖 deleteSnapshot(p, \"\")", () => {
  it("측정: 문서는 커밋되는가 · 그 문서가 참조하는 이미지 레코드는 IDB images에 있는가 · 리로드 뒤 복원되는가", async () => {
    const { persistence, browser } = await seeded();
    const other = browser.tab();
    let release = () => undefined as void;
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>((done) => (release = done)));
    const a = await openTab(persistence, browser.tab(), P);
    const projects = await a.projects();
    const before = (await projects.getDoc(P))!;
    const { next, unregister } = editorWithImage(projects, before);
    const save = await codeOf(projects.saveDoc(P, before.revision, next));
    await settle();
    log("a.save(readonly)", save);
    log("a.writesAfterSave", opsSummary(a.writes));
    const memAfterSave = (await projects.getDoc(P))!;
    log("a.memory revision before→afterSave", [before.revision, memAfterSave.revision, docRefsImage(memAfterSave)]);
    unregister(); // 편집기 이탈(편집 틀 cleanup)
    release(); // 보유 탭 닫힘
    await settle();
    const snapsBefore = await projects.listSnapshots(P);
    const confirm = await codeOf(projects.deleteSnapshot(P, ""));
    await settle();
    const memAfter = (await projects.getDoc(P))!;
    log("a.confirm", confirm);
    log("a.writesAll", opsSummary(a.writes));
    log("a.memory revision/hash 변화(확인 전→후)", [memAfterSave.revision, memAfter.revision, memAfterSave.hash === memAfter.hash]);
    log("a.snapshots 변화", [snapsBefore.map((s) => s.snapshotId), (await projects.listSnapshots(P)).map((s) => s.snapshotId)]);
    const record = await savedRecord(persistence);
    const imageRec = await persistence.get("images", imageRecordId(P, uuid(1)));
    log("a.IDB doc revision·이미지 참조", [record.doc.revision, docRefsImage(record.doc)]);
    log("a.IDB images 레코드 있음", imageRec !== undefined);
    const again = await reopen(persistence);
    log("a.reload doc 참조·복원 맵 키", [docRefsImage(again.doc!), Object.keys(again.restored ?? {}), again.publishCalls]);
    expect(confirm).toBe("ok");
  });

  it("대조: 같은 흐름에서 편집기가 마운트된 채(맵 등록 유지) deleteSnapshot(p, \"\")", async () => {
    const { persistence, browser } = await seeded();
    const other = browser.tab();
    let release = () => undefined as void;
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>((done) => (release = done)));
    const a = await openTab(persistence, browser.tab(), P);
    const projects = await a.projects();
    const before = (await projects.getDoc(P))!;
    const { next } = editorWithImage(projects, before);
    log("ctl.save(readonly)", await codeOf(projects.saveDoc(P, before.revision, next)));
    release();
    await settle();
    log("ctl.confirm", await codeOf(projects.deleteSnapshot(P, "")));
    await settle();
    log("ctl.writesAll", opsSummary(a.writes));
    log("ctl.IDB images 레코드 있음", (await persistence.get("images", imageRecordId(P, uuid(1)))) !== undefined);
    const again = await reopen(persistence);
    log("ctl.reload 복원 맵 키", Object.keys(again.restored ?? {}));
  });
});

describe("P-3 b. quota 실패(제출됨) → 편집기 이탈 → 편집기 밖 확인", () => {
  it("측정: queue.retry가 제출 당시 이미지 op를 다시 내는가", async () => {
    const { persistence, browser } = await seeded();
    const a = await openTab(persistence, browser.tab(), P);
    const projects = await a.projects();
    const before = (await projects.getDoc(P))!;
    const { next, unregister } = editorWithImage(projects, before);
    a.gate.fail = true;
    log("b.save(quota)", await codeOf(projects.saveDoc(P, before.revision, next)));
    await settle();
    unregister();
    a.gate.fail = false;
    log("b.confirm", await codeOf(projects.deleteSnapshot(P, "")));
    await settle();
    log("b.writesAll", opsSummary(a.writes));
    log("b.IDB doc 이미지 참조", docRefsImage((await savedRecord(persistence)).doc));
    log("b.IDB images 레코드 있음", (await persistence.get("images", imageRecordId(P, uuid(1)))) !== undefined);
    const again = await reopen(persistence);
    log("b.reload 복원 맵 키", Object.keys(again.restored ?? {}));
  });
});

describe("P-3 c. offline(저장 호출 전 멈춤) → 편집기 밖 확인", () => {
  it("측정: 저장소 메모리에 없는 편집은 확인 대상이 아니다 — resolve = 옛 레코드", async () => {
    const { persistence, browser } = await seeded();
    const a = await openTab(persistence, browser.tab(), P);
    const projects = await a.projects();
    const before = (await projects.getDoc(P))!;
    const { unregister } = editorWithImage(projects, before); // 편집은 했지만 saveDoc 호출 0(offline)
    unregister();
    log("c.confirm", await codeOf(projects.deleteSnapshot(P, "")));
    await settle();
    const record = await savedRecord(persistence);
    log("c.writesAll", opsSummary(a.writes));
    log("c.IDB doc = 편집 전(revision·이미지 참조)", [record.doc.revision === before.revision, docRefsImage(record.doc)]);
  });
});

describe("P-3 d. 빈 id 의미 — 부재가 보장되는가 · 부수효과", () => {
  it("측정: 스냅샷이 있는 문서에서 deleteSnapshot(p, \"\") = revision·hash·스냅샷·snapshotSeq·IDB 레코드 변화 0", async () => {
    const { persistence, browser } = await seeded();
    const a = await openTab(persistence, browser.tab(), P);
    const projects = await a.projects();
    const doc = (await projects.getDoc(P))!;
    await projects.createSnapshot(P, "수동1");
    await settle();
    const recBefore = await savedRecord(persistence);
    const snapsBefore = await projects.listSnapshots(P);
    const n = a.writes.length;
    log("d.confirm", await codeOf(projects.deleteSnapshot(P, "")));
    await settle();
    const recAfter = await savedRecord(persistence);
    log("d.writes 확인 뒤 추가", opsSummary(a.writes.slice(n)));
    log("d.memory revision·hash", [doc.revision, (await projects.getDoc(P))!.revision, doc.hash === (await projects.getDoc(P))!.hash]);
    log("d.snapshots 동일", JSON.stringify(snapsBefore) === JSON.stringify(await projects.listSnapshots(P)));
    log("d.IDB 레코드 동일", JSON.stringify(recBefore) === JSON.stringify(recAfter));
  });

  it("측정: 빈 문자열 id 수동 스냅샷이 저장 레코드에 있으면(파일 가져오기 checkFile.ts:73 isString 허용) deleteSnapshot(p, \"\")이 그것을 지운다", async () => {
    const { persistence, browser } = await seeded();
    const rec = await savedRecord(persistence);
    const forged = { ...rec, snapshots: [...rec.snapshots, { ...(rec.snapshots[0] ?? {}), projectId: P, snapshotId: "", kind: "manual", name: "빈 id", doc: rec.doc, createdAt: rec.doc.updatedAt }] };
    await persistence.write([{ type: "put", store: "docs", record: { schemaVersion: 1, kind: "doc", id: P, data: forged } } as WriteOp]);
    const a = await openTab(persistence, browser.tab(), P);
    const projects = await a.projects();
    const listBefore = (await projects.listSnapshots(P)).map((s) => [s.snapshotId, s.kind]);
    log("d2.entry 스냅샷 목록(빈 id 읽힘?)", listBefore);
    log("d2.confirm", await codeOf(projects.deleteSnapshot(P, "")));
    await settle();
    log("d2.확인 뒤 목록", (await projects.listSnapshots(P)).map((s) => [s.snapshotId, s.kind]));
    log("d2.IDB 스냅샷 id", (await savedRecord(persistence)).snapshots.map((s) => s.snapshotId));
  });
});
