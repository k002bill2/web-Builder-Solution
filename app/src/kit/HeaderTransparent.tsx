import { HeaderStickyRightCta } from "./HeaderStickyRightCta";
import type { KitSectionProps } from "./types";

/**
 * header/transparent (SPEC-BOUND B-3 · MQ-B1) — 겹치지 않고 면을 이어 붙인다: 일반 흐름(비고정) · header 면 = 첫 본문 hero 맨 위 면(D-1 heroTop).
 * primary·surface = 그 면 · media(이미지가 맨 위) = bg · 값 없음 = bg + 아래 구분선. 바·시트는 K1-1에서 CTA를 뺀 것(시트는 늘 bg).
 * data-surface = 검사 표시(정적 HTML에서 지워짐) · 스타일 = 면 클래스(정적 HTML 보존, D-2).
 */
export function HeaderTransparent(props: KitSectionProps) {
  const top = props.links.heroTop;
  const face = top === "primary" || top === "surface" ? top : "bg";
  return <HeaderStickyRightCta {...props} surface={face} className={`kit-header kit-header--clear kit-header--face-${face}${top ? "" : " kit-header--edge"}`} />;
}
