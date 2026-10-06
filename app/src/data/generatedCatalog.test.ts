import { describe, expect, it } from "vitest";
import { generatedReferenceComparisonAttributes } from "../fixtures/generatedReferenceDetails";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG } from "../test/compareFixtures";
import { withGeneratedCatalog, withGeneratedReferences } from "./generatedCatalog";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryReferenceRepository } from "./referenceRepository";

const GEN = generatedReferenceFixtures[0]!;
const base = () => createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);

describe("생성 레퍼런스 병합 저장소 (SPEC m3p 6절 · MQ-M3P-7 A)", () => {
  it("목록 = 큐레이션 6 + 생성 15, 필터·점수순(미측정 맨 뒤)이 합친 목록에 그대로 적용된다", async () => {
    const repo = withGeneratedReferences(base());
    expect(await repo.list()).toHaveLength(referenceFixtures.length + generatedReferenceFixtures.length);
    for (const industry of ["cafe-fnb", "beauty", "medical", "professional", "education"] as const) {
      expect((await repo.list({ industry })).length, industry).toBeGreaterThanOrEqual(4);
    }
    const sorted = await repo.list({ sort: "score" });
    expect(sorted.slice(-generatedReferenceFixtures.length).map((r) => r.id)).toEqual(generatedReferenceFixtures.map((r) => r.id));
  });

  it("생성 id는 카드·상세·유사 추천(큐레이션 포함 가능)을, 큐레이션 id는 원래 저장소 값을 준다", async () => {
    const repo = withGeneratedReferences(base());
    expect(await repo.getById(GEN.id)).toEqual(GEN);
    expect((await repo.getDetail(GEN.id))?.measuredWith).toBe("미측정");
    const similar = await repo.getSimilar(GEN.id);
    expect(similar.map((g) => g.kind)).toEqual(["industry", "concept", "layout"]);
    expect(similar.flatMap((g) => g.items).some((r) => r.id === GEN.id)).toBe(false);
    expect(similar.find((g) => g.kind === "industry")!.items.every((r) => r.industry === GEN.industry)).toBe(true);
    expect(await repo.getDetail("ref-a")).toEqual(referenceDetailFixtures["ref-a"]);
    expect(await repo.getSimilar("ref-a")).toEqual(await base().getSimilar("ref-a"));
  });

  it("보드 카탈로그 병합 = 기존 + 생성 3벌, 입력은 바꾸지 않는다", () => {
    const merged = withGeneratedCatalog(FIXTURE_CATALOG);
    expect(merged.references).toHaveLength(FIXTURE_CATALOG.references.length + generatedReferenceFixtures.length);
    expect(merged.attributes[GEN.id]).toEqual(generatedReferenceComparisonAttributes[GEN.id]);
    expect(FIXTURE_CATALOG.attributes[GEN.id]).toBeUndefined();
  });
});

describe("비교 보드에 생성 레퍼런스 담기 (조건부 로드 — 조작 뒤)", () => {
  it("카탈로그 밖 생성 id를 담으면 생성 청크로 넓혀 열이 생기고 비교 결과가 available이다", async () => {
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG });
    const added = await board.addReference(GEN.id);
    expect(added.ok).toBe(true);
    expect(added.board.columns.map((c) => c.referenceId)).toEqual([GEN.id]);
    const { results } = await board.getComparison([GEN.id]);
    expect(results[0]).toMatchObject({ referenceId: GEN.id, status: "available" });
  });

  it("넓혀도 없는 id는 기존대로 unavailable", async () => {
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG });
    expect(await board.addReference("gen-없음")).toMatchObject({ ok: false, reason: "unavailable" });
  });
});
