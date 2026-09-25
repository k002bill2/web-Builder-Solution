import { cx } from "./cx";

export interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

const SIZE = {
  sm: "h-10 pl-3 pr-10 text-body2",
  md: "h-12 pl-4 pr-11 text-body1",
} as const;

/** 목업 번들 Select — 네이티브 <select> 기반. */
export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  readonly options: readonly SelectOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  /** 접근성 이름 (화면에 라벨이 없을 때 필수) */
  readonly label: string;
  readonly size?: keyof typeof SIZE;
  readonly className?: string;
}) {
  return (
    <span className={cx("relative flex items-center", className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => {
          const next = options.find((o) => o.value === e.target.value);
          if (next) onChange(next.value);
        }}
        className={cx(
          "w-full cursor-pointer appearance-none rounded-md border-(length:--border-thick) border-line-strong bg-background-normal text-label-normal outline-none",
          "transition-[border-color,box-shadow] duration-(--duration-fast) ease-standard",
          "hover:border-label-alternative focus-visible:border-primary focus-visible:shadow-(--focus-ring)",
          SIZE[size],
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute right-4 size-4.5 text-label-alternative"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </span>
  );
}
