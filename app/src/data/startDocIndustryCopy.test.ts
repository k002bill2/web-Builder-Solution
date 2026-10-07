/**
 * B-M3P-06 — 편집기 새 문서 문구 = 같은 레퍼런스 썸네일 문구(공용 표 `industryCopy`). 레퍼런스를 모르거나 표 밖이면 예시 문구(SAMPLE_COPY) 그대로.
 */
import { isTerminal, type PlannedSection } from "../domain/generation";
import type { DesignReference } from "../domain/reference";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { generatedReferenceComparisonAttributes, generatedReferenceDetailFixtures } from "../fixtures/generatedReferenceDetails";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { buildThumbnail } from "../thumbs/entry";
import { referenceRenderInput } from "../thumbs/referenceDoc";
import { industryCopyOf } from "./industryCopy";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "./memoryGenerationRepository";
import { createMemoryProjectRepository } from "./memoryProjectRepository";
import type { ProjectRepository } from "./projectRepository";
import { SAMPLE_COPY } from "./sampleCopy";
import { writeStartDoc } from "./startDocWrite";
import { createStudioStore } from "./studioStore";

const REFS = [...referenceFixtures, ...generatedReferenceFixtures];
const CATALOG = {
  references: REFS,
  details: { ...FIXTURE_CATALOG.details, ...generatedReferenceDetailFixtures },
  attributes: { ...FIXTURE_CATALOG.attributes, ...generatedReferenceComparisonAttributes },
};
const h1Of = (svg: string) => [...svg.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((m) => m[1]!);
const slotOf = (doc: Pick<PageDoc, "sections">, type: string, key: string) => doc.sections.find((s) => s.type === type)?.slots[key];

async function startedDoc(base: string, catalog: typeof CATALOG = CATALOG): Promise<PageDoc> {
  const store = createStudioStore();
  const others = ["ref-c", "ref-d"].filter((r) => r !== base);
  const board = createMemoryCompareBoardRepository({ catalog, initialBoard: boardOf([base, ...others], { hero: base }), store });
  await board.confirmProfile(1, 0);
  const gen = createMemoryGenerationRepository({ store });
  let job = await gen.requestGeneration("profile-1", 1);
  for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
  const repo = createMemoryProjectRepository({ store, now: () => "2026-10-07T00:00:00.000Z" }) as ProjectRepository<PageDoc>;
  expect((await repo.getProject("project-1"))?.baseReferenceId).toBe(base);
  return (await repo.startDoc("project-1", 1, "A", "create")).doc;
}

const SECTIONS: readonly PlannedSection[] = [
  { type: "header", variant: "sticky-right-cta", motion: "L1" },
  { type: "hero", variant: "split", motion: "L2" },
  { type: "about", variant: "split", motion: "L2" },
  { type: "services", variant: "grid-2", motion: "L2" },
  { type: "portfolio", variant: "masonry", motion: "L1" },
  { type: "contact", variant: "form", motion: "L1" },
  { type: "footer", variant: "biz-extended", motion: "L1" },
];
const write = (copy?: Readonly<Record<string, string>>) =>
  writeStartDoc({ candidateId: "A", sections: SECTIONS, libraryVersion: "v", generatorVersion: "g", profileVersion: 1, projectId: "p", updatedAt: "2026-10-07T00:00:00.000Z", ...(copy && { copy }) });

describe("편집기 새 문서 업종 문구 (B-M3P-06)", () => {
  it.each(["gen-beauty-1", "ref-a"])("%s로 편집 시작 → 편집기 hero 제목 = 그 카드 썸네일 SVG h1 · 부제 = 썸네일 부제", async (id) => {
    const doc = await startedDoc(id);
    const thumb = referenceRenderInput(id).doc;
    expect([slotOf(doc, "hero", "title")]).toEqual(h1Of(buildThumbnail(id, "[data-site-root]{color:red}").svg));
    expect(slotOf(doc, "hero", "subtitle")).toBe(slotOf(thumb, "hero", "subtitle"));
    expect(slotOf(doc, "hero", "title")).not.toBe(SAMPLE_COPY["hero/title"]);
  });

  it("기준 레퍼런스를 모르면(카드 조회 실패) 편집 시작 문서는 예시 문구 그대로(폴백)", async () => {
    const odd = { ...referenceFixtures[0]!, id: "ref-x", industry: "other" as DesignReference["industry"] };
    const doc = await startedDoc("ref-x", {
      references: [...REFS, odd],
      details: { ...CATALOG.details, "ref-x": CATALOG.details["ref-a"]! },
      attributes: { ...CATALOG.attributes, "ref-x": CATALOG.attributes["ref-a"]! },
    });
    expect(slotOf(doc, "hero", "title")).toBe(SAMPLE_COPY["hero/title"]);
    expect(slotOf(doc, "hero", "subtitle")).toBe(SAMPLE_COPY["hero/subtitle"]);
  });

  it("카드 21장 모두 — 표 문구가 있고 썸네일 hero 제목·부제와 같다(출처 하나)", () => {
    for (const card of REFS) {
      const copy = industryCopyOf(card);
      expect(copy, card.id).toBeDefined();
      const thumb = referenceRenderInput(card.id).doc;
      expect(copy!["hero/title"], card.id).toBe(slotOf(thumb, "hero", "title"));
      expect(copy!["hero/subtitle"], card.id).toBe(slotOf(thumb, "hero", "subtitle"));
    }
  });

  it("표 밖 업종·레이아웃·톤 → undefined (부분 덮기 0)", () => {
    const card = referenceFixtures[0]!;
    expect(industryCopyOf({ ...card, industry: "other" as DesignReference["industry"] })).toBeUndefined();
    expect(industryCopyOf({ ...card, layoutType: "carousel" as DesignReference["layoutType"] })).toBeUndefined();
    expect(industryCopyOf({ ...card, visualTags: ["neon" as DesignReference["visualTags"][number]] })).toBeUndefined();
    expect(industryCopyOf({ ...card, visualTags: [] })).toBeUndefined();
  });

  it("copy 없음 = 지금 예시 문구 그대로(폴백) · copy 있음 = 표의 슬롯만 덮고 나머지는 예시 문구", () => {
    const plain = write();
    const withCopy = write(industryCopyOf(referenceFixtures[0]!));
    if (!plain.ok || !withCopy.ok) throw new Error(`문서 실패 ${JSON.stringify([plain, withCopy].filter((w) => !w.ok))}`);
    expect(slotOf(plain.doc, "hero", "title")).toBe(SAMPLE_COPY["hero/title"]);
    expect(slotOf(withCopy.doc, "hero", "title")).toBe(industryCopyOf(referenceFixtures[0]!)!["hero/title"]);
    expect(slotOf(withCopy.doc, "hero", "cta")).toBe(SAMPLE_COPY["hero/cta"]);
    expect(slotOf(withCopy.doc, "about", "body")).toBe(SAMPLE_COPY["about/body"]);
    expect(withCopy.doc.hash).not.toBe(plain.doc.hash);
  });
});
