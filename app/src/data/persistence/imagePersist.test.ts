/**
 * PERSIST-P1b 배선 (ADR-007 P1b · 부록 Codex 제약 2) — 메모리 가짜 영속으로 앱 조립(deferredStudio)을 돌린다.
 * 저장: 문서 쓰기 트랜잭션에 이미지 Blob + 메타 · 5.9 참조 집합 정리 · 실패 = INFRA · 재시도.
 * 복원: 새 세션(진입 결과)에서 편집 틀 마운트(맵 없음) → 메타 WeakMap까지 재구성 · 실패 = 맵에 없음(잃은 이미지 경로).
 * 실제 IDB에서의 Blob 생존은 Ego Lite 실측 몫이다(jsdom에는 IDB가 없다).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { setSlot } from "../../engine/ops/slotOps";
import { makePng } from "../../features/studio/images/ingest/fixtures/imageBytes";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { addImage, imageMeta, pickVariant, slotTarget } from "../../features/studio/images/store/imageStore";
import type { ImageKeeper, RenderImages } from "../../features/studio/images/store/types";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { STUDIO_IMPORTS, createDeferredStudio } from "../deferredStudio";
import type { ProjectRepository } from "../projectRepository";
import { checkEnvelope } from "./envelope";
import type { LocalEntry } from "./entryRead";
import { imageRecordId } from "./imageRecord";
import { IMAGE_READ } from "./imageRestore";
import { openLocalSync } from "./localSync";
import { createMemoryPersistence, type MemoryPersistenceOptions, type StudioPersistence } from "./studioPersistence";

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
/** 이미지 슬롯이 있는 첫 섹션·슬롯 키 */
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

function studioOn(persistence: StudioPersistence, entry: LocalEntry = {}) {
  return createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => persistence) });
}
async function started(persistence: StudioPersistence) {
  const studio = studioOn(persistence);
  await (await studio.board()).confirmProfile(1, 0);
  const gen = await studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = (await studio.projects()) as Repo;
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  return { projects, doc };
}
async function entryFrom(persistence: StudioPersistence, projectId?: string): Promise<LocalEntry> {
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const doc = projectId ? checkEnvelope(await persistence.get("docs", projectId), "doc", projectId) : undefined;
  return { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(doc?.status === "ok" && { doc: doc.data as LocalEntry["doc"] }) };
}
/** 편집 틀 흉내 — images 맵 state + publish(함수형 setter) */
function frame() {
  let images: RenderImages | undefined;
  const publish = vi.fn((update: (prev: RenderImages | undefined) => RenderImages | undefined) => {
    images = update(images);
  });
  return { publish, get images() {
    return images;
  }, set: (next: RenderImages) => (images = next) };
}
/** 새 세션 복원 — 진입 결과로 새 앱 조립 → 마운트(맵 없음) → 복원 완료까지 */
async function reopen(persistence: StudioPersistence) {
  IMAGE_READ.read = (key) => persistence.get("images", key);
  const repo = (await studioOn(persistence, await entryFrom(persistence, "project-1")).projects()) as Repo;
  const view = frame();
  repo.images?.("project-1", undefined, view.publish);
  await vi.waitFor(() => expect(view.publish).toHaveBeenCalled(), { timeout: 1000 }).catch(() => undefined);
  return { repo, view };
}
const original = IMAGE_READ.read;
afterEach(() => {
  IMAGE_READ.read = original;
});

describe("이미지 저장 — 문서 쓰기 트랜잭션에 Blob + 메타(P1b ①)", () => {
  it("이미지 넣은 문서 저장 → images 저장소에 변형본 Blob 전부 + 메타 · 새 세션 마운트 → 같은 메타로 복원(직렬화 경계 Blob 보존)", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc } = await started(persistence);
    const img = image();
    const next = withImage(doc, uuid(1));
    const view = frame();
    const { section } = imageSlotOf(next);
    view.set(addImage({}, uuid(1), img, slotTarget(section.type, section.variant)));
    projects.images?.("project-1", view.images, view.publish);
    await projects.saveDoc("project-1", doc.revision, next);

    const stored = (await persistence.get("images", imageRecordId("project-1", uuid(1)))) as { kind: string; data: IngestedImage };
    expect(stored.kind).toBe("image");
    expect(Object.keys(stored.data.variants)).toEqual(Object.keys(img.variants));
    expect([stored.data.width, stored.data.height, stored.data.format, stored.data.bytes]).toEqual([img.width, img.height, img.format, img.bytes]);
    expect(stored.data.variants[640]).toBeInstanceOf(Blob);

    const { view: again } = await reopen(persistence);
    const restored = again.images?.[uuid(1)];
    expect(restored).toBeDefined();
    expect([restored!.width, restored!.height, restored!.blob.size]).toEqual([img.width, img.height, pickVariant(img.variants, slotTarget(section.type, section.variant))!.size]);
    expect(imageMeta(restored!)).toMatchObject({ width: img.width, height: img.height, format: "png", bytes: img.bytes });
    expect(Object.keys(imageMeta(restored!)!.variants)).toEqual(Object.keys(img.variants));
  });

  it("같은 세션 편집기 이탈 → 재진입(새로고침 없음 · DocBook 문서) → 이미지·메타 복원", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc } = await started(persistence);
    IMAGE_READ.read = (key) => persistence.get("images", key);
    const img = image();
    const view = frame();
    view.set(addImage({}, uuid(1), img, 1920));
    projects.images?.("project-1", view.images, view.publish);
    await projects.saveDoc("project-1", doc.revision, withImage(doc, uuid(1)));
    // 편집 틀이 사라졌다가 다시 마운트(맵 없음)
    const again = frame();
    projects.images?.("project-1", undefined, again.publish);
    await vi.waitFor(() => expect(again.publish).toHaveBeenCalled(), { timeout: 1000 });
    expect(imageMeta(again.images![uuid(1)]!)).toMatchObject({ width: img.width, height: img.height, format: "png", bytes: img.bytes });
  });

  it("이미지 지우기 저장 → 레코드 삭제 · 스냅샷이 참조하면 남는다(5.9 참조 집합)", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc } = await started(persistence);
    const view = frame();
    view.set(addImage(addImage({}, uuid(1), image(), 1920), uuid(2), image(900), 1920));
    projects.images?.("project-1", view.images, view.publish);
    const one = await projects.saveDoc("project-1", doc.revision, withImage(doc, uuid(1)));
    await projects.createSnapshot("project-1", "하나");
    const two = await projects.saveDoc("project-1", one.revision, withImage(one, uuid(2)));
    // uuid1은 스냅샷이 붙잡는다
    expect(await persistence.keys("images")).toEqual([imageRecordId("project-1", uuid(1)), imageRecordId("project-1", uuid(2))]);
    await projects.saveDoc("project-1", two.revision, withImage(two, { kind: "placeholder", patternId: "diagonal" }));
    expect(await persistence.keys("images")).toEqual([imageRecordId("project-1", uuid(1))]);
  });

  it("IDB 실패 = INFRA · 이미지 레코드 0 · 같은 요청 재시도 → 문서와 이미지가 함께 저장", async () => {
    const gate = { fail: false };
    const options: MemoryPersistenceOptions = { fail: () => (gate.fail ? new DOMException("x", "QuotaExceededError") : undefined) };
    const persistence = createMemoryPersistence(options);
    const { projects, doc } = await started(persistence);
    const view = frame();
    view.set(addImage({}, uuid(1), image(), 1920));
    projects.images?.("project-1", view.images, view.publish);
    const next = withImage(doc, uuid(1));
    gate.fail = true;
    expect(await codeOf(projects.saveDoc("project-1", doc.revision, next))).toBe("INFRA");
    expect(await persistence.keys("images")).toEqual([]);
    gate.fail = false;
    expect(await codeOf(projects.saveDoc("project-1", doc.revision, next))).toBe("ok");
    expect(await persistence.keys("images")).toEqual([imageRecordId("project-1", uuid(1))]);
    expect(((await persistence.get("docs", "project-1")) as { data: { doc: PageDoc } }).data.doc.hash).toBe(next.hash);
  });
});

describe("이미지 자동 복원 실패 = 잃은 이미지 경로(P1b ②)", () => {
  it("읽기 실패 → publish 0(맵 없음 = 기존 잃은 이미지 표시)", async () => {
    const persistence = createMemoryPersistence();
    const { projects, doc } = await started(persistence);
    const view = frame();
    view.set(addImage({}, uuid(1), image(), 1920));
    projects.images?.("project-1", view.images, view.publish);
    await projects.saveDoc("project-1", doc.revision, withImage(doc, uuid(1)));
    IMAGE_READ.read = async () => {
      throw new DOMException("x", "UnknownError");
    };
    const repo = (await studioOn(persistence, await entryFrom(persistence, "project-1")).projects()) as Repo;
    const again = frame();
    repo.images?.("project-1", undefined, again.publish);
    await new Promise((ok) => setTimeout(ok, 50));
    expect(again.publish).not.toHaveBeenCalled();
  });

  it("메모리 모드(로컬 영속 아님) = images 없음(동작 변화 0)", async () => {
    const repo = (await createDeferredStudio(async () => FIXTURE_CATALOG, imports).projects()) as Repo;
    expect(repo.images).toBeUndefined();
  });
});
