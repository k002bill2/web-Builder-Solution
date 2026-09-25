import type { MotionLevel } from "../../domain/reference";
import { FILTER_GROUPS, MOTION_OPTIONS, type FilterGroupKey } from "../../fixtures/catalogFilters";
import { Checkbox } from "../ds/Checkbox";
import { SegmentedControl } from "../ds/SegmentedControl";

type MotionValue = MotionLevel | "all";

const MOTION_SEGMENTS: ReadonlyArray<{ value: MotionValue; label: string }> = [
  { value: "all", label: "전체" },
  ...MOTION_OPTIONS.map((o) => ({ value: o.id, label: o.label })),
];

/** 왼쪽 필터 레일 (목업 76~85행). */
export function FilterRail({
  isSelected,
  motion,
  onToggle,
  onMotionChange,
  onReset,
}: {
  readonly isSelected: (key: FilterGroupKey, id: string) => boolean;
  readonly motion: MotionLevel | undefined;
  readonly onToggle: (key: FilterGroupKey, id: string) => void;
  readonly onMotionChange: (motion: MotionLevel | undefined) => void;
  readonly onReset: () => void;
}) {
  return (
    <aside aria-label="필터" className="flex flex-col gap-5.5">
      <div className="flex items-center justify-between">
        <h2 className="ds-heading2">필터</h2>
        <button
          type="button"
          aria-label="필터 초기화"
          onClick={onReset}
          className="ds-caption1 cursor-pointer font-semibold text-primary hover:text-primary-hover"
        >
          초기화
        </button>
      </div>
      {FILTER_GROUPS.map((group) => (
        <fieldset key={group.key}>
          <legend className="ds-label mb-2 text-label-neutral">{group.name}</legend>
          <div className="flex flex-col gap-2">
            {group.options.map((option) => (
              <Checkbox
                key={option.id}
                label={option.label}
                checked={isSelected(group.key, option.id)}
                onChange={() => onToggle(group.key, option.id)}
              />
            ))}
          </div>
        </fieldset>
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
    </aside>
  );
}
