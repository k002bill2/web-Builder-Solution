import { colorFamilyOf } from "../../domain/colorFamily";
import type { DesignReference } from "../../domain/reference";
import { ALL_FILTER_GROUPS, type FilterGroupKey } from "../../fixtures/catalogFilters";
import type { CatalogFilters } from "./catalogSearchParams";

/**
 * 카탈로그 옵션 개수 — 분리형 facet count (v2 SPEC 4.2 r2 · V2-AC-41).
 * 옵션 수 = "그 그룹만 빼고 나머지 필터를 모두 적용한 결과 중 이 옵션을 가진 레퍼런스 수".
 * 저장소(진입 청크)는 바꾸지 않고 카탈로그 청크 안에서 센다. 백엔드가 정해지면 저장소 facets()로 옮긴다.
 */
export type FacetKey = "industry" | FilterGroupKey;

export const FACET_KEYS: readonly FacetKey[] = Object.freeze(["industry", ...ALL_FILTER_GROUPS.map((g) => g.key)]);

export type FacetCounts = Readonly<Record<FacetKey, Readonly<Partial<Record<string, number>>>>> & {
  /** 업종 "전체" = 업종을 뺀 조건의 결과 수 */
  readonly industryTotal: number;
};

export function facetValues(ref: DesignReference, key: FacetKey): readonly string[] {
  switch (key) {
    case "industry":
      return [ref.industry];
    case "audience":
      return ref.audience;
    case "concept":
      return ref.visualTags;
    case "layout":
      return [ref.layoutType];
    case "purpose":
      return ref.purpose;
    case "license":
      return [ref.licenseStatus];
    case "color":
      return [colorFamilyOf(ref.colorPalette.primary)];
    case "device":
      return ref.devices;
  }
}

/** 선택이 있는 facet 그룹 (모션은 개수를 표시하지 않아 제외 — 조건으로는 남는다). */
export function selectedFacets(filters: CatalogFilters): FacetKey[] {
  return FACET_KEYS.filter((key) => (key === "industry" ? filters.industry !== undefined : (filters[key]?.length ?? 0) > 0));
}

/** 그 그룹만 뺀 새 조건 (입력 불변). */
export function withoutFacet(filters: CatalogFilters, key: FacetKey): CatalogFilters {
  const { [key]: _removed, ...rest } = filters;
  void _removed;
  return rest;
}

/**
 * current = 현재 결과, excluded[key] = key 그룹을 뺀 조건의 결과(선택 있는 그룹만).
 * scope가 있으면(보관함) 그 id만 센다 — 목록과 같은 모집단.
 */
export function countFacets(
  current: readonly DesignReference[],
  excluded: Readonly<Partial<Record<FacetKey, readonly DesignReference[]>>>,
  scope?: ReadonlySet<string>,
): FacetCounts {
  const inScope = (refs: readonly DesignReference[]) => (scope ? refs.filter((r) => scope.has(r.id)) : refs);
  const count = (key: FacetKey) => {
    const tally: Record<string, number> = {};
    for (const ref of inScope(excluded[key] ?? current)) {
      for (const value of facetValues(ref, key)) tally[value] = (tally[value] ?? 0) + 1;
    }
    return tally;
  };
  return {
    ...(Object.fromEntries(FACET_KEYS.map((key) => [key, count(key)])) as Record<FacetKey, Record<string, number>>),
    industryTotal: inScope(excluded.industry ?? current).length,
  };
}
