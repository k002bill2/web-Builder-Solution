import type { IndustryId, SortKey } from "../../domain/reference";
import { INDUSTRY_LABELS, INDUSTRY_ORDER, SORT_OPTIONS } from "../../fixtures/catalogFilters";
import { Chip } from "../ds/Chip";
import { SegmentedControl } from "../ds/SegmentedControl";

const SORT_SEGMENTS = SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }));

/**
 * 카탈로그 칩 줄: 업종 칩(단일 선택) + 정렬 (v2 SPEC 4.2 r2).
 * <1024: 1행 = 칩 가로 스크롤, 2행 = 정렬(오른쪽). ≥1024: 칩 줄바꿈, 정렬은 오른쪽 끝. 정렬은 모든 폭에서 한 벌 (C-13).
 */
export function CatalogToolbar({
  industry,
  onIndustryChange,
  sort,
  onSortChange,
}: {
  readonly industry: IndustryId | undefined;
  readonly onIndustryChange: (industry: IndustryId | undefined) => void;
  readonly sort: SortKey;
  readonly onSortChange: (sort: SortKey) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line-neutral pb-4">
      <div role="group" aria-label="업종" className="-m-1 flex min-w-0 flex-1 gap-2 overflow-x-auto p-1 lg:flex-wrap">
        <Chip tone="primary" selected={industry === undefined} onClick={() => onIndustryChange(undefined)}>
          전체
        </Chip>
        {INDUSTRY_ORDER.map((id) => (
          <Chip
            key={id}
            tone="primary"
            selected={industry === id}
            onClick={() => onIndustryChange(industry === id ? undefined : id)}
          >
            {INDUSTRY_LABELS[id]}
          </Chip>
        ))}
      </div>
      <div className="flex w-full items-center justify-end gap-2.5 lg:w-auto">
        <span className="ds-caption1 hidden text-label-alternative sm:inline">필터 상태는 URL로 유지됩니다</span>
        <SegmentedControl label="정렬" size="sm" options={SORT_SEGMENTS} value={sort} onChange={onSortChange} />
      </div>
    </div>
  );
}
