import { useId, type FocusEvent } from "react";
import type { IndustryId, SortKey } from "../../domain/reference";
import type { FacetCounts } from "../../features/catalog/facetCounts";
import { INDUSTRY_LABELS, INDUSTRY_ORDER, SORT_OPTIONS } from "../../fixtures/catalogFilters";
import { Button } from "../ds/Button";
import { Chip } from "../ds/Chip";
import { SegmentedControl } from "../ds/SegmentedControl";

const SORT_SEGMENTS = SORT_OPTIONS.map((o) => ({ value: o.id, label: o.label }));

/**
 * 칩 줄(<1024 가로 스크롤)에서 일부만 보이는 칩은 Chrome이 포커스해도 스크롤하지 않는다.
 * 키보드 포커스일 때만 링까지(`scroll-px-2`) 보이게 스크롤한다 — 마우스 동작은 그대로 (D-V22-03).
 */
function revealFocusedChip(e: FocusEvent<HTMLElement>) {
  if (e.target.matches(":focus-visible")) e.target.scrollIntoView({ block: "nearest", inline: "nearest" });
}

/** 업종 칩 — 보이는 개수는 aria-hidden, 스크린리더에는 설명 "N개" (이름은 업종명 그대로). */
function IndustryChip({
  label,
  count,
  selected,
  onClick,
}: {
  readonly label: string;
  readonly count: number;
  readonly selected: boolean;
  readonly onClick: () => void;
}) {
  const descriptionId = useId();
  return (
    <>
      <Chip tone="primary" selected={selected} aria-describedby={descriptionId} onClick={onClick}>
        {label}
        <span aria-hidden="true" className={`ds-caption2 tabular-nums ${selected ? "" : "text-label-alternative"}`}>
          {count}
        </span>
      </Chip>
      <span id={descriptionId} hidden>
        {`${count}개`}
      </span>
    </>
  );
}

/**
 * 카탈로그 칩 줄: "필터 N"(<1024) + 업종 칩(단일 선택) + 정렬 (v2 SPEC 4.2 r2). DOM 순서 = 보이는 순서.
 * <1024: 1행 = "필터 N" + 칩 가로 스크롤, 2행 = 정렬(오른쪽). ≥1024: "필터 N" 숨김, 칩 줄바꿈, 정렬은 오른쪽 끝.
 * 정렬은 모든 폭에서 한 벌 (C-13).
 */
export function CatalogToolbar({
  industry,
  onIndustryChange,
  counts,
  sort,
  onSortChange,
  railId,
  railOpen,
  selectionCount,
  onRailToggle,
}: {
  readonly industry: IndustryId | undefined;
  readonly onIndustryChange: (industry: IndustryId | undefined) => void;
  readonly counts: FacetCounts;
  readonly sort: SortKey;
  readonly onSortChange: (sort: SortKey) => void;
  readonly railId: string;
  readonly railOpen: boolean;
  readonly selectionCount: number;
  readonly onRailToggle: () => void;
}) {
  const filterDescriptionId = useId();
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line-neutral pb-4">
      <Button
        variant="outline"
        size="sm"
        className="lg:hidden"
        aria-label="필터"
        aria-describedby={filterDescriptionId}
        aria-expanded={railOpen}
        aria-controls={railId}
        onClick={onRailToggle}
      >
        {selectionCount > 0 ? `필터 ${selectionCount}` : "필터"}
      </Button>
      <span id={filterDescriptionId} hidden>
        {`선택 ${selectionCount}개`}
      </span>
      <div
        role="group"
        aria-label="업종"
        onFocus={revealFocusedChip}
        className="-m-1 -mr-2 flex min-w-0 flex-1 scroll-px-2 gap-2 overflow-x-auto p-1 pr-2 lg:flex-wrap"
      >
        <IndustryChip
          label="전체"
          count={counts.industryTotal}
          selected={industry === undefined}
          onClick={() => onIndustryChange(undefined)}
        />
        {INDUSTRY_ORDER.map((id) => (
          <IndustryChip
            key={id}
            label={INDUSTRY_LABELS[id]}
            count={counts.industry[id] ?? 0}
            selected={industry === id}
            onClick={() => onIndustryChange(industry === id ? undefined : id)}
          />
        ))}
      </div>
      <div className="flex w-full items-center justify-end gap-2.5 lg:w-auto">
        <span className="ds-caption1 hidden text-label-alternative sm:inline">필터 상태는 URL로 유지됩니다</span>
        <SegmentedControl label="정렬" size="sm" options={SORT_SEGMENTS} value={sort} onChange={onSortChange} />
      </div>
    </div>
  );
}
