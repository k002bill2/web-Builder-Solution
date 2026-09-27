import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";
import { Icon, type IconName, type IconSize } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "assistive" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none cursor-pointer " +
  "border font-semibold leading-none tracking-(--tracking-snug) " +
  "transition-[background-color,border-color,color,transform] duration-(--duration-fast) ease-standard " +
  "focus-visible:outline-none focus-visible:shadow-(--focus-ring) active:scale-97 " +
  "disabled:cursor-not-allowed disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "border-transparent bg-primary text-on-primary enabled:hover:bg-primary-hover disabled:bg-fill-strong disabled:text-label-disable",
  /** 역상 면(bg-surface-inverse) 안에서만 — 요약 바·필 목록 (A11Y-01 4.5 · v2 V2-AC-11, tokenUsage 가드) */
  secondary:
    "border-transparent bg-inverse-fill-normal text-on-surface-inverse enabled:hover:bg-inverse-fill-strong " +
    "disabled:text-inverse-label-disable aria-disabled:bg-inverse-fill-normal aria-disabled:text-inverse-label-disable",
  /** ghost — 투명 면 (v2 Button ghost) */
  assistive: "border-transparent bg-transparent text-label-normal enabled:hover:bg-fill-normal disabled:text-label-disable",
  outline:
    "bg-background-normal text-label-normal border-line-normal enabled:hover:bg-fill-normal enabled:hover:border-line-strong " +
    "disabled:text-label-disable disabled:border-line-alternative",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 rounded-sm text-caption1",
  md: "h-10 px-4 rounded-md text-body3",
  /** v2 밀도: lg 40 = md 높이, 여백으로만 구분 (계층 lg ≥ md ≥ sm, 목업 md38/lg40 px 미복제) */
  lg: "h-10 px-5 rounded-md text-body3",
};

const ICON_SIZE: Record<ButtonSize, IconSize> = { sm: 16, md: 20, lg: 20 };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly leadingIcon?: IconName;
  readonly trailingIcon?: IconName;
  readonly fullWidth?: boolean;
}

/** Button: primary·secondary(역상)·assistive(ghost)·outline × sm·md·lg, 앞·뒤 아이콘, 전체 폭 (v2 SPEC 3.5). */
export function Button({
  variant = "primary",
  size = "md",
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  className,
  type = "button",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={cx(BASE, VARIANT[variant], SIZE[size], fullWidth && "w-full", className)} {...rest}>
      {leadingIcon && <Icon name={leadingIcon} size={ICON_SIZE[size]} />}
      {children}
      {trailingIcon && <Icon name={trailingIcon} size={ICON_SIZE[size]} />}
    </button>
  );
}
