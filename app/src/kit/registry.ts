import type { SectionInstance } from "../engine/contracts/pageDoc";
import { AboutStory } from "./AboutStory";
import { FooterBizExtended } from "./FooterBizExtended";
import { HeaderStickyRightCta } from "./HeaderStickyRightCta";
import { HeroFullbleedLeft } from "./HeroFullbleedLeft";
import type { KitSection } from "./types";

/**
 * 킷 레지스트리 (M2A-2a K3 · m2a 0.1 · Opus B-1-8) — `type/variant` → 킷 컴포넌트. 없는 쌍은 렌더 문서가 와이어프레임 폴백 + 표식으로 그린다.
 * M2A-2a = 바깥 3변형 · M2A-2b = 본문 4변형(about·services·faq·contact). 나머지는 M2b.
 */
export const KIT_REGISTRY: Readonly<Record<string, KitSection>> = Object.freeze({
  "header/sticky-right-cta": HeaderStickyRightCta,
  "hero/fullbleed-left": HeroFullbleedLeft,
  "about/story": AboutStory,
  "footer/biz-extended": FooterBizExtended,
});

export const kitFor = (section: Pick<SectionInstance, "type" | "variant">, registry: Readonly<Record<string, KitSection>> = KIT_REGISTRY): KitSection | undefined =>
  registry[`${section.type}/${section.variant}`];
