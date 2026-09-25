import { useRef, type KeyboardEvent } from "react";
import { cx } from "./cx";
import { rovingTargetIndex } from "./rovingFocus";

export interface SegmentOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * 목업 번들 SegmentedControl — 상호 배타 선택. 필터 용도라 radiogroup 시맨틱을 쓴다.
 * roving tabindex: Tab 정지점은 선택된 항목 하나, 방향키·Home/End로 이동하면서 선택한다 (APG radio group).
 */
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
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = options.findIndex((o) => o.value === value);
  const tabStop = selected >= 0 ? selected : 0;

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = rovingTargetIndex(event.key, index, options.length);
    const option = target === null ? undefined : options[target];
    if (target === null || !option) return;
    event.preventDefault();
    buttons.current[target]?.focus();
    if (option.value !== value) onChange(option.value);
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("gap-0.5 rounded-md bg-fill-normal p-1", fullWidth ? "flex" : "inline-flex")}
    >
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={i === tabStop ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
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
