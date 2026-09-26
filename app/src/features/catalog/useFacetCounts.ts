import { useEffect, useState } from "react";
import { useReferenceRepository } from "../../data/ReferenceRepositoryContext";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";
import type { DesignReference } from "../../domain/reference";
import type { CatalogFilters } from "./catalogSearchParams";
import { countFacets, selectedFacets, withoutFacet, type FacetCounts, type FacetKey } from "./facetCounts";

type Excluded = Partial<Record<FacetKey, readonly DesignReference[]>>;

/**
 * 옵션 개수. 선택이 있는 그룹마다 저장소를 한 번(그 그룹을 뺀 조건) 읽고, 나머지는 현재 결과로 센다.
 * 선택이 없으면 추가 조회 0. 응답 전에는 이전 값을 유지한다 (useReferenceList와 같은 방식).
 */
export function useFacetCounts(
  filters: CatalogFilters,
  current: readonly DesignReference[],
  scope?: ReadonlySet<string>,
): FacetCounts {
  const repository = useReferenceRepository();
  const fail = useThrowToBoundary();
  const [excluded, setExcluded] = useState<Excluded>({});
  useEffect(() => {
    let cancelled = false;
    const keys = selectedFacets(filters);
    Promise.all(keys.map((key) => repository.list(withoutFacet(filters, key)))).then(
      (lists) => {
        if (!cancelled) setExcluded(Object.fromEntries(keys.map((key, i) => [key, lists[i]])));
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, filters, fail]);
  return countFacets(current, excluded, scope);
}
