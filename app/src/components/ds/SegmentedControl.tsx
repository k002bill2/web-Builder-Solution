import { cx } from "./cx";

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/** 목업 번들 SegmentedControl — 상호 배타 선택. 필터 용도라 radiogroup 시맨틱을 쓴다. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  fullWidth = false,
}: {
  readonly options: readonly SegmentOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: string;
  readonly size?: "sm" | "md";
  readonly fullWidth?: boolean;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("gap-0.5 rounded-md bg-fill-normal p-1", fullWidth ? "flex" : "inline-flex")}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cx(
              "cursor-pointer whitespace-nowrap rounded-sm font-semibold",
              "transition-[background-color,color] duration-(--duration-fast) ease-standard",
              "focus-visible:outline-none focus-visible:shadow-(--focus-ring)",
              size === "sm" ? "px-3 py-1 text-caption1 leading-(--line-height-label)" : "px-4 py-1.5 text-body3 leading-(--line-height-label)",
              fullWidth && "flex-1",
              active ? "bg-background-normal text-label-normal shadow-1" : "text-label-alternative hover:text-label-normal",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
