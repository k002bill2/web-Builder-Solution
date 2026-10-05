import type { SectionInstance } from "../engine/contracts/pageDoc";
import { AboutStory } from "./AboutStory";
import { ContactForm } from "./ContactForm";
import { FaqAccordion } from "./FaqAccordion";
import { FooterBizExtended } from "./FooterBizExtended";
import { FooterBizExtendedMap } from "./FooterBizExtendedMap";
import { FooterMinimal, FooterMinimalBiz } from "./FooterMinimal";
import { HeaderStickyHamburger } from "./HeaderStickyHamburger";
import { HeaderStickyRightCta } from "./HeaderStickyRightCta";
import { HeaderStickyTwoTier } from "./HeaderStickyTwoTier";
import { HeaderTransparent } from "./HeaderTransparent";
import { HeroCenter } from "./HeroCenter";
import { HeroFullbleedLeft } from "./HeroFullbleedLeft";
import { HeroGrid } from "./HeroGrid";
import { HeroImage } from "./HeroImage";
import { HeroSplit } from "./HeroSplit";
import { HeroText } from "./HeroText";
import { PortfolioGrid2, PortfolioGrid3, PortfolioMasonry } from "./PortfolioGallery";
import { ServicesCards2, ServicesCardsMasonry } from "./ServicesCards";
import { ServicesCards3 } from "./ServicesCards3";
import { ServicesList } from "./ServicesList";
import { StatisticsStats3 } from "./StatisticsStats3";
import { TestimonialsQuotes2 } from "./TestimonialsQuotes2";
import type { KitSection } from "./types";

/**
 * 킷 레지스트리 (M2A-2a K3 · m2a 0.1 · Opus B-1-8) — `type/variant` → 킷 컴포넌트. 없는 쌍은 렌더 문서가 와이어프레임 폴백 + 표식으로 그린다.
 * M2A-2a = 바깥 3변형 · M2A-2b = 본문 4변형(about·services·faq·contact) · M2B-1a = hero 5변형(split·center·grid·text·image) · M2B-1b = header 3 · footer 3 ·
 * M2B-2a = about/text(AboutStory 재사용 — 이미지 슬롯 없음 = 1단) · services list·cards-2·cards-masonry · M2B-2b = portfolio grid-3·masonry·grid-2(공유 PortfolioGallery) · statistics/stats-3 · M2B-2c = testimonials/quotes-2. 나머지는 M2b.
 */
export const KIT_REGISTRY: Readonly<Record<string, KitSection>> = Object.freeze({
  "header/sticky-right-cta": HeaderStickyRightCta,
  "header/sticky-hamburger": HeaderStickyHamburger,
  "header/sticky-two-tier": HeaderStickyTwoTier,
  "header/transparent": HeaderTransparent,
  "hero/fullbleed-left": HeroFullbleedLeft,
  "hero/split": HeroSplit,
  "hero/center": HeroCenter,
  "hero/grid": HeroGrid,
  "hero/text": HeroText,
  "hero/image": HeroImage,
  "about/story": AboutStory,
  "about/text": AboutStory,
  "services/cards-2": ServicesCards2,
  "services/cards-3": ServicesCards3,
  "services/cards-masonry": ServicesCardsMasonry,
  "services/list": ServicesList,
  "statistics/stats-3": StatisticsStats3,
  "portfolio/grid-2": PortfolioGrid2,
  "portfolio/grid-3": PortfolioGrid3,
  "portfolio/masonry": PortfolioMasonry,
  "testimonials/quotes-2": TestimonialsQuotes2,
  "faq/accordion": FaqAccordion,
  "contact/form": ContactForm,
  "footer/biz-extended": FooterBizExtended,
  "footer/biz-extended-map": FooterBizExtendedMap,
  "footer/minimal": FooterMinimal,
  "footer/minimal-biz": FooterMinimalBiz,
});

export const kitFor = (section: Pick<SectionInstance, "type" | "variant">, registry: Readonly<Record<string, KitSection>> = KIT_REGISTRY): KitSection | undefined =>
  registry[`${section.type}/${section.variant}`];
