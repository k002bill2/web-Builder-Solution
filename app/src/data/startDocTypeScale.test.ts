/**
 * TYPESCALE TS-AC-01·02 — 편집 시작(create)·새로 시작(restart)이 안의 `plan.axes.typeScale`을 문서에 적는다(★B · TSQ-2 A안도).
 */
import { isTerminal } from "../domain/generation";
import type { CandidatePlan } from "../domain/generation";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { hashDoc } from "../engine/ops/hash";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "./memoryGenerationRepository";
import { createMemoryProjectRepository } from "./memoryProjectRepository";
import type { ProjectRepository } from "./projectRepository";
import { writeStartDoc } from "./startDocWrite";
import { createStudioStore } from "./studioStore";

async function setup() {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  await board.confirmProfile(1, 0);
  const gen = createMemoryGenerationRepository({ store });
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
  let ticks = 0;
  const repo = createMemoryProjectRepository({ store, now: () => `2026-10-21T09:00:0${ticks++}.000Z` }) as ProjectRepository<PageDoc>;
  const scaleOf = (id: string) => {
    const found = job.candidates.find((c) => c.id === id);
    if (found?.status !== "succeeded") throw new Error(`${id}안 없음`);
    return (found.plan as CandidatePlan).axes.typeScale;
  };
  const profileScale = store.versions("profile-1")[0]!.base.typography_tokens.scale;
  return { repo, scaleOf, profileScale };
}

describe("TS-AC-01 편집 시작 = 안의 비율을 문서에", () => {
  it.each(["A", "B", "C"])("%s안 create → doc.typeScale = plan.axes.typeScale · hash = hashDoc", async (id) => {
    const { repo, scaleOf } = await setup();
    const { doc } = await repo.startDoc("project-1", 1, id, "create");
    expect(doc.typeScale).toBe(scaleOf(id));
    expect(doc.hash).toBe(hashDoc(doc));
  });
  it("A안 = 프로필 비율 그대로 · B·C안은 A와 다르다", async () => {
    const { scaleOf, profileScale } = await setup();
    expect(scaleOf("A")).toBe(profileScale);
    expect(new Set([scaleOf("A"), scaleOf("B"), scaleOf("C")]).size).toBe(3);
  });
});

describe("TS-AC-02 새로 시작(restart) — 새 안의 비율 · 자동 스냅샷 옛 문서는 옛 값", () => {
  it("B로 시작 → C로 restart = 문서 C 비율 · 스냅샷 '새로 시작 전' = B 비율", async () => {
    const { repo, scaleOf } = await setup();
    const first = await repo.startDoc("project-1", 1, "B", "create");
    const again = await repo.startDoc("project-1", 1, "C", "restart", first.doc.revision);
    expect(again.doc.typeScale).toBe(scaleOf("C"));
    const snapshots = await repo.listSnapshots("project-1");
    expect(snapshots.map((s) => s.doc.typeScale)).toEqual([scaleOf("B")]);
  });
});

describe("writeStartDoc 어댑터 — typeScale 전달", () => {
  const input = {
    candidateId: "B",
    sections: [
      { type: "header", variant: "sticky-right-cta", motion: "L1" },
      { type: "hero", variant: "fullbleed-left", motion: "L1" },
      { type: "about", variant: "story", motion: "L1" },
      { type: "services", variant: "cards-3", motion: "L1" },
      { type: "services", variant: "list", motion: "L1" },
      { type: "faq", variant: "accordion", motion: "L1" },
      { type: "contact", variant: "form", motion: "L1" },
      { type: "footer", variant: "biz-extended", motion: "L1" },
    ],
    libraryVersion: "1.4",
    generatorVersion: "preview-1",
    profileVersion: 1,
    projectId: "project-1",
    updatedAt: "2026-10-21T00:00:00.000Z",
  } as const;
  it("값 있음 = 문서에 · 없음 = 키 0 · 범위 밖 = BAD_VALUE(쓰기 0)", () => {
    const made = writeStartDoc({ ...input, typeScale: 1.333 });
    expect(made.ok && made.doc.typeScale).toBe(1.333);
    const bare = writeStartDoc(input);
    expect(bare.ok && Object.hasOwn(bare.doc, "typeScale")).toBe(false);
    expect(writeStartDoc({ ...input, typeScale: 3 })).toMatchObject({ ok: false, reason: "BAD_VALUE" });
  });
});
