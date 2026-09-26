import { describe, expect, it } from "vitest";
import type { DesignReference } from "../../domain/reference";
import { referenceFixtures } from "../../fixtures/references";
import { clearRailFilters, railSelectionCount } from "./catalogSearchParams";
import { countFacets, facetValues, selectedFacets, withoutFacet } from "./facetCounts";

const [cafe, salon, dental, pilates, law, bakery] = referenceFixtures as readonly DesignReference[] as [
  DesignReference,
  DesignReference,
  DesignReference,
  DesignReference,
  DesignReference,
  DesignReference,
];

describe("facetValues — 참조 필드에서 옵션 값 추출", () => {
  it("그룹별 필드를 읽고 색상은 대표색 계열로 계산한다", () => {
    expect(facetValues(cafe, "industry")).toEqual(["cafe-fnb"]);
    expect(facetValues(cafe, "audience")).toEqual(["age-20-30"]);
    expect(facetValues(cafe, "concept")).toEqual(["minimal", "warm"]);
    expect(facetValues(cafe, "layout")).toEqual(["fullbleed"]);
    expect(facetValues(dental, "purpose")).toEqual(["booking", "inquiry"]);
    expect(facetValues(salon, "license")).toEqual(["licensed"]);
    expect(facetValues(cafe, "color")).toEqual(["warm"]);
    expect(facetValues(dental, "color")).toEqual(["cool"]);
    expect(facetValues(law, "device")).toEqual(["desktop", "responsive"]);
  });
});

describe("selectedFacets · withoutFacet", () => {
  it("선택이 있는 그룹(업종 포함, 모션 제외)만 고른다", () => {
    expect(selectedFacets({})).toEqual([]);
    expect(selectedFacets({ industry: "beauty", concept: ["minimal"], motion: "low" })).toEqual(["industry", "concept"]);
  });

  it("그 그룹만 뺀 새 조건을 돌려주고 입력은 바꾸지 않는다", () => {
    const filters = Object.freeze({ industry: "beauty" as const, concept: ["minimal" as const], motion: "low" as const });
    expect(withoutFacet(filters, "concept")).toEqual({ industry: "beauty", motion: "low" });
    expect(withoutFacet(filters, "industry")).toEqual({ concept: ["minimal"], motion: "low" });
    expect(filters).toEqual({ industry: "beauty", concept: ["minimal"], motion: "low" });
  });
});

describe("countFacets — 분리형 facet count (V2-AC-41)", () => {
  it("선택 없는 그룹은 현재 결과로, 선택 있는 그룹은 그 그룹을 뺀 결과로 센다", () => {
    // 콘셉트 미니멀·따뜻한 선택 → 현재 결과는 카페 하나. 콘셉트를 뺀 결과는 전체 6개.
    const counts = countFacets([cafe], { concept: referenceFixtures });
    expect(counts.concept.bold).toBe(1); // "현재 결과 중 대담한"이면 0
    expect(counts.concept.minimal).toBe(1);
    expect(counts.industry["cafe-fnb"]).toBe(1);
    expect(counts.industry.beauty ?? 0).toBe(0);
    expect(counts.industryTotal).toBe(1);
  });

  it("업종 '전체'는 업종을 뺀 결과의 수다", () => {
    const counts = countFacets([salon], { industry: [cafe, salon, bakery] });
    expect(counts.industryTotal).toBe(3);
    expect(counts.industry["cafe-fnb"]).toBe(2);
    // 선택 없는 그룹은 현재 결과(헤어살롱, 대표색 무채색)로 센다
    expect(counts.color.neutral).toBe(1);
    expect(counts.color.warm ?? 0).toBe(0);
  });

  it("범위(saved)를 주면 그 안의 레퍼런스만 센다", () => {
    const counts = countFacets(referenceFixtures, {}, new Set([salon.id, pilates.id]));
    expect(counts.industryTotal).toBe(2);
    expect(counts.industry.beauty).toBe(1);
    expect(counts.industry["cafe-fnb"] ?? 0).toBe(0);
    expect(counts.concept.bold).toBe(1);
  });
});

describe("레일 선택 수 · 레일 초기화 (V2-AC-42 · Q8)", () => {
  it("N = 체크된 옵션 수 + 모션(전체 아님 1), 업종은 세지 않는다", () => {
    expect(railSelectionCount({})).toBe(0);
    expect(railSelectionCount({ industry: "beauty" })).toBe(0);
    expect(railSelectionCount({ industry: "beauty", concept: ["minimal", "warm"], color: ["cool"], motion: "low" })).toBe(4);
  });

  it("초기화는 레일 8그룹만 지우고 업종은 남긴다", () => {
    expect(clearRailFilters({ industry: "beauty", concept: ["minimal"], device: ["mobile"], motion: "mid" })).toEqual({
      industry: "beauty",
    });
    expect(clearRailFilters({ concept: ["minimal"] })).toEqual({});
  });
});
