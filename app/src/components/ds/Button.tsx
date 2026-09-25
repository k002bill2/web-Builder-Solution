import type { ButtonHTMLAttributes } from "react";
import { cx } from "./cx";
import { Icon, type IconName, type IconSize } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "assistive" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap select-none cursor-pointer " +
  "border border-transparent font-semibold leading-none tracking-(--tracking-snug) " +
  "transition-[background-color,border-color,color,transform] duration-(--duration-fast) ease-standard " +
  "focus-visible:outline-none focus-visible:shadow-(--focus-ring) active:scale-97 " +
  "disabled:cursor-not-allowed disabled:active:scale-100";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary enabled:hover:bg-primary-hover disabled:bg-fill-strong disabled:text-label-disable",
  secondary:
    "bg-surface-inverse text-on-surface-inverse enabled:hover:bg-surface-inverse-hover disabled:bg-fill-strong disabled:text-label-disable",
  assistive:
    "bg-fill-normal text-label-normal enabled:hover:bg-fill-strong disabled:bg-fill-alternative disabled:text-label-disable",
  outline:
    "bg-background-normal text-label-normal border-line-normal enabled:hover:bg-fill-normal enabled:hover:border-line-strong " +
    "disabled:text-label-disable disabled:border-line-alternative",
};

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 rounded-sm text-caption1",
  md: "h-10 px-4 rounded-md text-body3",
  lg: "h-13 px-5.5 rounded-md text-body1",
};

const ICON_SIZE: Record<ButtonSize, IconSize> = { sm: 16, md: 20, lg: 22 };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly leadingIcon?: IconName;
  readonly trailingIcon?: IconName;
  readonly fullWidth?: boolean;
}

/** 목업 번들 Button: primary·secondary·assistive·outline × sm·md·lg, 앞·뒤 아이콘, 전체 폭. */
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
