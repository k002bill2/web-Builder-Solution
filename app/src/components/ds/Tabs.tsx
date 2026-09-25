import { cx } from "./cx";

export interface TabItem<T extends string> {
  readonly value: T;
  readonly label: string;
  readonly count?: number;
}

/** 목업 번들 Tabs — 밑줄 탭 바 (제어 컴포넌트). */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  readonly items: readonly TabItem<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-6 border-b border-line-neutral">
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.value)}
            className={cx(
              "relative cursor-pointer whitespace-nowrap py-3 text-body1 font-semibold",
              "transition-colors duration-(--duration-fast) ease-standard hover:text-label-normal",
              "focus-visible:outline-none focus-visible:shadow-(--focus-ring)",
              active
                ? "text-label-normal after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:rounded-xs after:bg-label-normal"
                : "text-label-alternative",
            )}
          >
            {it.label}
            {it.count != null && (
              <span className={cx("ml-1 font-medium", active ? "text-primary" : "text-label-assistive")}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
