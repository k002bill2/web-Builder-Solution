import { Media } from "./Media";
import { slotImage, slotText } from "./text";
import type { KitSectionProps } from "./types";

/**
 * hero/fullbleed-left (M2A-2a K6 · m2a K1-2) — 미디어 층(섹션 전체) 위 단색 `primary` 카피 패널. 글자는 늘 패널 위(이미지 위 글자 0, 0.3).
 * DOM = 카피 → 미디어. md 미만은 미디어 띠(4:3) 위 · 패널 아래 두 단(kit.css). 이미지 끔 = 미디어 0, 섹션 면 primary. 높이는 비율·내용만(vh 0).
 */
export function HeroFullbleedLeft({ section, links, images, root }: KitSectionProps) {
  const title = slotText(section, "title");
  const subtitle = slotText(section, "subtitle");
  const cta = slotText(section, "cta");
  const image = slotImage(section, "image");
  const heading = `h-${section.instanceId}`;
  return (
    <section {...root} aria-labelledby={heading} data-surface="primary" className={`kit-hero${image ? "" : " kit-hero--plain"}`}>
      <div className="kit-hero-copy">
        <div data-surface="primary" className="kit-hero-panel">
          {title && (
            <h1 id={heading} data-slot="title" className="kit-hero-title">
              {title}
            </h1>
          )}
          {subtitle && (
            <p data-slot="subtitle" className="kit-hero-lead">
              {subtitle}
            </p>
          )}
          {cta &&
            (links.cta ? (
              <a href={links.cta} data-slot="cta" className="kit-hero-cta">
                {cta}
              </a>
            ) : (
              <span data-slot="cta" className="kit-hero-cta">
                {cta}
              </span>
            ))}
        </div>
      </div>
      {image && <Media image={image} images={images} ratio={[16, 9]} first className="kit-hero-media" />}
    </section>
  );
}
