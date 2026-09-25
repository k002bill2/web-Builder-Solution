import type { ReactNode } from "react";
import { cx } from "./cx";

export type TagTone = "neutral" | "blue" | "green" | "red" | "orange" | "violet";
export type TagSize = "sm" | "md";

const TONE: Record<TagTone, string> = {
  neutral: "text-label-neutral bg-fill-strong",
  blue: "text-accent-blue bg-accent-blue-bg",
  green: "text-accent-green bg-accent-green-bg",
  red: "text-accent-red bg-accent-red-bg",
  orange: "text-accent-orange bg-accent-orange-bg",
  violet: "text-accent-violet bg-accent-violet-bg",
};

const SIZE: Record<TagSize, string> = {
  sm: "h-5 px-1.5 rounded-xs text-caption2",
  md: "h-6 px-2 rounded-sm text-caption1",
};

/** 목업 번들 Tag (tint 변형). */
export function Tag({
  tone = "neutral",
  size = "md",
  className,
  children,
}: {
  readonly tone?: TagTone;
  readonly size?: TagSize;
  readonly className?: string;
  readonly children: ReactNode;
}) {
  return (
    <span className={cx("inline-flex items-center gap-1 whitespace-nowrap font-semibold leading-none", TONE[tone], SIZE[size], className)}>
      {children}
    </span>
  );
}
