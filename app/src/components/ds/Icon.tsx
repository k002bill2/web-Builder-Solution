import type { CSSProperties } from "react";

/** 아이콘 원본: design/claude-design-handoff/project/assets/icons/ (필요한 것만 복사) */
const ICON_URLS = import.meta.glob<string>("../../assets/icons/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
});

export type IconName = "plus" | "search" | "sparkle" | "bookmark" | "bookmark-fill" | "close" | "arrow-right";
export type IconSize = 14 | 16 | 18 | 20 | 22 | 24;

const SIZE_CLASS: Record<IconSize, string> = {
  14: "size-3.5",
  16: "size-4",
  18: "size-4.5",
  20: "size-5",
  22: "size-5.5",
  24: "size-6",
};

function iconUrl(name: IconName): string {
  const url = ICON_URLS[`../../assets/icons/${name}.svg`];
  if (!url) throw new Error(`아이콘 없음: ${name}`);
  return url;
}

export interface IconProps {
  readonly name: IconName;
  readonly size?: IconSize;
  readonly className?: string;
}

/** SVG를 CSS mask로 써서 currentColor를 상속한다 (tokens/base.css `.ds-icon`). */
export function Icon({ name, size = 24, className = "" }: IconProps) {
  const style = { "--icon": `url("${iconUrl(name)}")` } as CSSProperties;
  return <i aria-hidden="true" className={`ds-icon ${SIZE_CLASS[size]} ${className}`} style={style} />;
}
