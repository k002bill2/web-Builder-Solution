import type { IndustryId, MotionLevel, ReferenceQuery, SortKey } from "../../domain/reference";
import {
  ALL_FILTER_GROUPS,
  CATALOG_TABS,
  INDUSTRY_ORDER,
  MOTION_OPTIONS,
  SORT_OPTIONS,
  type CatalogTab,
  type FilterGroupKey,
} from "../../fixtures/catalogFilters";

/** 카탈로그 필터 (정렬 제외). URL 쿼리와 1:1로 대응한다 (FR-CAT-01). */
export type CatalogFilters = Omit<ReferenceQuery, "sort">;

export interface CatalogState {
  readonly filters: CatalogFilters;
  readonly sort: SortKey;
  readonly tab: CatalogTab;
}

export const DEFAULT_SORT: SortKey = "score";
export const DEFAULT_TAB: CatalogTab = "all";

function optionIds(key: FilterGroupKey): readonly string[] {
  return ALL_FILTER_GROUPS.find((g) => g.key === key)?.options.map((o) => o.id) ?? [];
}

const GROUP_OPTION_IDS: Readonly<Record<FilterGroupKey, readonly string[]>> = Object.freeze({
  audience: optionIds("audience"),
  concept: optionIds("concept"),
  layout: optionIds("layout"),
  purpose: optionIds("purpose"),
  license: optionIds("license"),
  color: optionIds("color"),
  device: optionIds("device"),
});

function pickOne<T extends string>(raw: string | null, allowed: readonly T[]): T | undefined {
  return allowed.find((id) => id === raw);
}

/** 허용 목록 순서로 정렬·중복 제거하고 모르는 값은 버린다. */
function canonical(values: readonly string[], allowed: readonly string[]): string[] {
  return allowed.filter((id) => values.includes(id));
}

function parseList(raw: string | null, allowed: readonly string[]): string[] | undefined {
  const values = canonical(raw ? raw.split(",") : [], allowed);
  return values.length > 0 ? values : undefined;
}

export function parseCatalogParams(params: URLSearchParams): CatalogState {
  const groups = Object.fromEntries(
    (Object.keys(GROUP_OPTION_IDS) as FilterGroupKey[])
      .map((key) => [key, parseList(params.get(key), GROUP_OPTION_IDS[key])] as const)
      .filter(([, values]) => values !== undefined),
  ) as Partial<Pick<CatalogFilters, FilterGroupKey>>;
  const industry = pickOne<IndustryId>(params.get("industry"), INDUSTRY_ORDER);
  const motion = pickOne<MotionLevel>(params.get("motion"), MOTION_OPTIONS.map((o) => o.id));
  return {
    filters: { ...(industry && { industry }), ...groups, ...(motion && { motion }) },
    sort: pickOne(params.get("sort"), SORT_OPTIONS.map((o) => o.id)) ?? DEFAULT_SORT,
    tab: pickOne(params.get("tab"), CATALOG_TABS.map((o) => o.id)) ?? DEFAULT_TAB,
  };
}

export function toCatalogParams({ filters, sort, tab }: CatalogState): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.industry) params.set("industry", filters.industry);
  for (const key of Object.keys(GROUP_OPTION_IDS) as FilterGroupKey[]) {
    const values = filters[key];
    if (values && values.length > 0) params.set(key, values.join(","));
  }
  if (filters.motion) params.set("motion", filters.motion);
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  if (tab !== DEFAULT_TAB) params.set("tab", tab);
  return params;
}

export function selectedIn(filters: CatalogFilters, key: FilterGroupKey): readonly string[] {
  return filters[key] ?? [];
}

/** 체크박스 한 개를 토글한 새 필터를 돌려준다 (입력 불변). */
export function toggleGroupOption(filters: CatalogFilters, key: FilterGroupKey, id: string): CatalogFilters {
  const current = selectedIn(filters, key);
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  const values = canonical(next, GROUP_OPTION_IDS[key]);
  const { [key]: _removed, ...rest } = filters;
  void _removed;
  return values.length > 0 ? ({ ...rest, [key]: values } as CatalogFilters) : rest;
}
