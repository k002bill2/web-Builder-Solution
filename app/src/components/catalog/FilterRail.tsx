import { useId, useRef } from "react";
import type { MotionLevel } from "../../domain/reference";
import type { FacetCounts } from "../../features/catalog/facetCounts";
import {
  FILTER_GROUPS,
  MOTION_OPTIONS,
  TRAILING_FILTER_GROUPS,
  type AnyFilterGroup,
  type FilterGroupKey,
} from "../../fixtures/catalogFilters";
import { Button } from "../ds/Button";
import { Checkbox } from "../ds/Checkbox";
import { SegmentedControl } from "../ds/SegmentedControl";

type MotionValue = MotionLevel | "all";

const MOTION_SEGMENTS: ReadonlyArray<{ value: MotionValue; label: string }> = [
  { value: "all", label: "전체" },
  ...MOTION_OPTIONS.map((o) => ({ value: o.id, label: o.label })),
];

function CheckboxGroup({
  group,
  counts,
  isSelected,
  onToggle,
}: {
  readonly group: AnyFilterGroup;
  readonly counts: FacetCounts;
  readonly isSelected: (key: FilterGroupKey, id: string) => boolean;
  readonly onToggle: (key: FilterGroupKey, id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="ds-label mb-2 text-label-neutral">{group.name}</legend>
      <div className="flex flex-col gap-2">
        {group.options.map((option) => (
          <Checkbox
            key={option.id}
            label={option.label}
            count={counts[group.key][option.id] ?? 0}
            checked={isSelected(group.key, option.id)}
            onChange={() => onToggle(group.key, option.id)}
          />
        ))}
      </div>
    </fieldset>
  );
}

/**
 * 왼쪽 필터 레일 (v2 SPEC 4.2 r2). 색상·디바이스 그룹은 목업에 없어 모션 강도 다음에 덧붙인다 (C-01r2).
 * 한 벌만 렌더한다 — <1024 접힘은 CSS(`hidden lg:flex`)로만, 펼침은 칩 줄의 "필터 N" 버튼이 `open`으로 연다.
 */
export function FilterRail({
  id,
  open,
  counts,
  selectionCount,
  isSelected,
  motion,
  onToggle,
  onMotionChange,
  onReset,
}: {
  readonly id: string;
  readonly open: boolean;
  readonly counts: FacetCounts;
  readonly selectionCount: number;
  readonly isSelected: (key: FilterGroupKey, id: string) => boolean;
  readonly motion: MotionLevel | undefined;
  readonly onToggle: (key: FilterGroupKey, id: string) => void;
  readonly onMotionChange: (motion: MotionLevel | undefined) => void;
  readonly onReset: () => void;
}) {
  const resetDescriptionId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  // 누른 버튼이 곧 비활성이 되어 포커스가 body로 빠진다 — 레일 제목에 둔다 (D-V22-02)
  const reset = () => {
    onReset();
    heading.current?.focus();
  };
  return (
    <aside id={id} aria-label="필터" className={`${open ? "flex" : "hidden lg:flex"} flex-col gap-5.5`}>
      <div className="flex items-center justify-between">
        <h2
          ref={heading}
          tabIndex={-1}
          className="ds-heading2 rounded-xs focus-visible:outline-none focus-visible:shadow-(--focus-ring)"
        >
          필터
        </h2>
        <Button
          variant="assistive"
          size="sm"
          aria-label="필터 초기화"
          aria-describedby={resetDescriptionId}
          disabled={selectionCount === 0}
          onClick={reset}
        >
          {selectionCount > 0 ? `초기화 · ${selectionCount}` : "초기화"}
        </Button>
        <span id={resetDescriptionId} hidden>
          {`선택 ${selectionCount}개`}
        </span>
      </div>
      {FILTER_GROUPS.map((group) => (
        <CheckboxGroup key={group.key} group={group} counts={counts} isSelected={isSelected} onToggle={onToggle} />
      ))}
      <div className="flex flex-col gap-2">
        <span className="ds-label text-label-neutral">모션 강도</span>
        <SegmentedControl
          label="모션 강도"
          size="sm"
          fullWidth
          options={MOTION_SEGMENTS}
          value={motion ?? "all"}
          onChange={(v) => onMotionChange(v === "all" ? undefined : v)}
        />
      </div>
      {TRAILING_FILTER_GROUPS.map((group) => (
        <CheckboxGroup key={group.key} group={group} counts={counts} isSelected={isSelected} onToggle={onToggle} />
      ))}
    </aside>
  );
}
