/**
 * B-M3P-08 — 큐레이션 "동네 치과"(ref-c)를 기준으로 편집 시작한 문서(보드 확정 → 3안 → writeStartDoc)에 About 섹션 1개 ·
 * 같은 (유형, 엔진 변형) 섹션 중복 0. 썸네일 경로(detailRender.test)만으로는 3안 구성(composeCandidates) 단계를 보지 못해 따로 둔다.
 */
import { isTerminal } from "../domain/generation";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "./memoryGenerationRepository";
import { createMemoryProjectRepository } from "./memoryProjectRepository";
import type { ProjectRepository } from "./projectRepository";
import { createStudioStore } from "./studioStore";

async function startedDoc(base: string, candidateId: "A" | "B" | "C"): Promise<PageDoc> {
  const store = createStudioStore();
  const others = ["ref-a", "ref-b", "ref-c"].filter((r) => r !== base).slice(0, 2);
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf([base, ...others], { hero: base }), store });
  await board.confirmProfile(1, 0);
  const gen = createMemoryGenerationRepository({ store });
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
  const repo = createMemoryProjectRepository({ store, now: () => "2026-10-07T00:00:00.000Z" }) as ProjectRepository<PageDoc>;
  return (await repo.startDoc("project-1", 1, candidateId, "create")).doc;
}

describe("동네 치과 편집 문서 섹션 중복 (B-M3P-08)", () => {
  it.each(["A", "B", "C"] as const)("ref-c 기준 %s안 편집 시작 → About 1개 · 같은 (유형, 변형) 중복 0", async (id) => {
    const doc = await startedDoc("ref-c", id);
    expect(doc.sections.filter((s) => s.type === "about")).toHaveLength(1);
    const pairs = doc.sections.map((s) => `${s.type}/${s.variant}`);
    expect(pairs.filter((p, i) => pairs.indexOf(p) !== i)).toEqual([]);
  });
});
