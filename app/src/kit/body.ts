import type { SectionInstance } from "../engine/contracts/pageDoc";

/** 본문 섹션 면 (m2a 0.3 "섹션 면") — 톤 base = bg 면 · alt = surface 면. data-surface = [B] 대비 판정이 면을 찾는 표시 */
export const bodySurface = (section: SectionInstance) =>
  ({ "data-tone": section.tone, "data-surface": section.tone === "alt" ? "surface" : "bg" }) as const;

/** 섹션 제목 id (aria-labelledby 대상, 0.12) */
export const headingId = (section: SectionInstance) => `h-${section.instanceId}`;
