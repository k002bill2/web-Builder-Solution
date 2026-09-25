import type { ReactNode } from "react";
import { cx } from "./cx";

export type TagTone = "neutral" | "blue" | "green" | "red" | "orange" | "violet";
export type TagSize = "sm" | "md";
export type TagVariant = "tint" | "outline";

const TONE_TEXT: Record<TagTone, string> = {
  neutral: "text-label-neutral",
  blue: "text-accent-blue",
  green: "text-accent-green",
  red: "text-accent-red",
  orange: "text-accent-orange",
  violet: "text-accent-violet",
};

const TONE_BG: Record<TagTone, string> = {
  neutral: "bg-fill-strong",
  blue: "bg-accent-blue-bg",
  green: "bg-accent-green-bg",
  red: "bg-accent-red-bg",
  orange: "bg-accent-orange-bg",
  violet: "bg-accent-violet-bg",
};

const SIZE: Record<TagSize, string> = {
  sm: "h-5 px-1.5 rounded-xs text-caption2",
  md: "h-6 px-2 rounded-sm text-caption1",
};

/** 목업 번들 Tag — tint(기본)·outline(투명 배경 + currentColor 1px 테두리) 변형. */
export function Tag({
  tone = "neutral",
  variant = "tint",
  size = "md",
  className,
  children,
}: {
  readonly tone?: TagTone;
  readonly variant?: TagVariant;
  readonly size?: TagSize;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap font-semibold leading-none", TONE_TEXT[tone], variant === "outline" ? "border border-current" : TONE_BG[tone], SIZE[size], className)}>
      {children}
    </span>
  );
}
