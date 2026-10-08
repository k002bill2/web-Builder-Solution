/**
 * 복원 청크는 이미지 참조가 있을 때만 받는다(Codex r2 P2 · BRIEF-R3 ③) — 이미지 없는 문서 진입이 복원 청크(ADR-004 개정 11 시나리오)를 받지 않게.
 * 테스트마다 모듈 그래프를 새로 올려(resetModules) 복원 청크 모듈 평가 횟수 = import 횟수로 센다.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isTerminal } from "../../domain/generation";
import type { ImageSlotValue, LocalImageId, PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { setSlot } from "../../engine/ops/slotOps";
import { makePng } from "../../features/studio/images/ingest/fixtures/imageBytes";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import type { ImageKeeper, RenderImages } from "../../features/studio/images/store/types";
import { FIXTURE_CATALOG } from "../../test/compareFixtures";
import type { ProjectRepository } from "../projectRepository";
import type { LocalEntry } from "./entryRead";
import type { StudioPersistence } from "./studioPersistence";
import { soloLocks } from "./fakeLocks";

const loads = { n: 0 };

type Repo = ProjectRepository<PageDoc> & ImageKeeper;
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}` as LocalImageId;
const png = (width: number) => new Blob([new Uint8Array(makePng({ width, height: 10 }))], { type: "image/png" });
const image = (width = 800): IngestedImage => {
  const variants = Object.fromEntries(widthLadder(width).map((w) => [w, png(w)]));
  return { variants, width, height: 400, format: "png", bytes: Object.values(variants).reduce((s, b) => s + b.size, 0) };
};
const withImage = (doc: PageDoc, source: LocalImageId): PageDoc => {
  for (const s of doc.sections)
    for (const [key, v] of Object.entries(s.slots))
      if (typeof v === "object" && v.kind === "image") {
        const next = setSlot(doc, s.instanceId, key, { ...(v as ImageSlotValue), enabled: true, source });
        return { ...next, hash: hashDoc(next) };
      }
  throw new Error("이미지 슬롯 없음");
};

/** 새 모듈 그래프 — 저장(세션 1) → 진입 결과로 새 세션 → 편집 틀 마운트(맵 없음) */
async function enterAfterSave(edit: (doc: PageDoc) => PageDoc, map?: (doc: PageDoc) => RenderImages) {
  const { STUDIO_IMPORTS, createDeferredStudio } = await import("../deferredStudio");
  const { boardOf } = await import("../../test/compareFixtures");
  const { openLocalSync } = await import("./localSync");
  const { createMemoryPersistence } = await import("./studioPersistence");
  const { checkEnvelope } = await import("./envelope");
  const { addImage } = await import("../../features/studio/images/store/imageStore");
  const imports = {
    ...STUDIO_IMPORTS,
    board: async () => {
      const mod = await STUDIO_IMPORTS.board();
      return { ...mod, createMemoryCompareBoardRepository: (o: Parameters<typeof mod.createMemoryCompareBoardRepository>[0]) => mod.createMemoryCompareBoardRepository({ ...o, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }) }) };
    },
  };
  const persistence = createMemoryPersistence();
  const studioOn = (p: StudioPersistence, entry: LocalEntry = {}) => createDeferredStudio(async () => FIXTURE_CATALOG, imports, { entry, sync: (e) => openLocalSync(e, async () => p, soloLocks()) });
  const studio = studioOn(persistence);
  await (await studio.board()).confirmProfile(1, 0);
  const gen = await studio.generations();
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i += 1) job = await gen.getJob(job.jobId);
  const projects = (await studio.projects()) as Repo;
  const { doc } = await projects.startDoc("project-1", 1, "B", "create");
  const publish = vi.fn();
  projects.images?.("project-1", map && addImage({}, uuid(1), image(), 1920), publish);
  await projects.saveDoc("project-1", doc.revision, edit(doc));
  const state = checkEnvelope(await persistence.get("studio", "state"), "state", "state");
  const saved = checkEnvelope(await persistence.get("docs", "project-1"), "doc", "project-1");
  const entry = { ...(state.status === "ok" && { state: state.data as LocalEntry["state"] }), ...(saved.status === "ok" && { doc: saved.data as LocalEntry["doc"] }) };
  const repo = (await studioOn(persistence, entry).projects()) as Repo;
  repo.images?.("project-1", undefined, vi.fn());
}

beforeEach(() => {
  vi.resetModules();
  loads.n = 0;
  // vi.mock 팩토리 결과는 resetModules 뒤에도 남는다 — 테스트마다 다시 등록
  vi.doMock("./imageRestore", async (importOriginal) => {
    loads.n += 1;
    return importOriginal();
  });
});

describe("복원 청크 = 이미지 참조 있을 때만(BRIEF-R3 ③)", () => {
  it("이미지 참조 없는 문서 진입 → 복원 청크 import 0", async () => {
    await enterAfterSave((doc) => ({ ...doc, meta: { ...doc.meta, title: "이미지 없음" }, hash: hashDoc({ ...doc, meta: { ...doc.meta, title: "이미지 없음" } }) }));
    await new Promise((ok) => setTimeout(ok, 50));
    expect(loads.n).toBe(0);
  });

  it("이미지 참조 있는 문서 진입 → 복원 청크 import 1", async () => {
    await enterAfterSave((doc) => withImage(doc, uuid(1)), () => ({}));
    await vi.waitFor(() => expect(loads.n).toBe(1));
    await new Promise((ok) => setTimeout(ok, 50));
    expect(loads.n).toBe(1);
  });
});
