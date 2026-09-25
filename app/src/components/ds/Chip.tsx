import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-pressed"> {
  readonly selected?: boolean;
  readonly tone?: "neutral" | "primary";
}

const SELECTED: Record<NonNullable<ChipProps["tone"]>, string> = {
  neutral: "bg-label-normal border-label-normal text-background-normal hover:bg-label-normal",
  primary: "bg-primary border-primary text-on-primary hover:bg-primary",
};

/** 목업 번들 Chip — 선택 토글 필(pill). aria-pressed로 상태를 알린다. */
export function Chip({ selected = false, tone = "neutral", className, type = "button", children, ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cx(
        "inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 text-body3 font-medium select-none cursor-pointer",
        "transition-[background-color,border-color,color] duration-(--duration-fast) ease-standard",
        "focus-visible:outline-none focus-visible:shadow-(--focus-ring)",
        selected ? SELECTED[tone] : "border-line-normal bg-background-normal text-label-normal hover:bg-fill-normal",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
