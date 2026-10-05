import { HeroCopy, PRIMARY_COPY } from "./heroCopy";
import { Media } from "./Media";
import { slotImage } from "./text";
import type { KitSectionProps } from "./types";

/**
 * hero/fullbleed-left (M2A-2a K6 · m2a K1-2) — 미디어 층(섹션 전체) 위 단색 `primary` 카피 패널. 글자는 늘 패널 위(이미지 위 글자 0, 0.3).
 * DOM = 카피 → 미디어. md 미만은 미디어 띠(4:3) 위 · 패널 아래 두 단(kit.css). 이미지 끔 = 미디어 0, 섹션 면 primary. 높이는 비율·내용만(vh 0).
 */
export function HeroFullbleedLeft({ section, links, images, root }: KitSectionProps) {
  const image = slotImage(section, "image");
  const heading = `h-${section.instanceId}`;
  return (
    <section {...root} aria-labelledby={heading} data-surface="primary" className={`kit-hero${image ? "" : " kit-hero--plain"}`}>
      <div className="kit-hero-copy">
        <div data-surface="primary" className="kit-hero-panel">
          <HeroCopy section={section} links={links} heading={heading} cls={PRIMARY_COPY} />
        </div>
      </div>
      {image && <Media image={image} images={images} ratio={[16, 9]} first className="kit-hero-media" section={section} slot="image" />}
    </section>
  );
}
