import { bodySurface, headingId } from "./body";
import { Media } from "./Media";
import { slotImage, slotText } from "./text";
import type { KitSectionProps } from "./types";

/**
 * about/story (M2A-2b B2 · m2a K1-3) — 글(제목 + 본문, 줄바꿈 그대로) · 이미지 칸(figure, 비율 = 프로필 media_ratio).
 * lg 이상 2단 같은 폭 · md~lg 7:5 · md 미만 1단(글 → 이미지). 이미지 끔 = 1단 · 글 폭 prose-max(data-layout single).
 */
export function AboutStory({ section, images, mediaRatio, root }: KitSectionProps) {
  const heading = slotText(section, "heading");
  const body = slotText(section, "body");
  const image = slotImage(section, "image");
  const id = headingId(section);
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={id} data-layout={image ? "split" : "single"} className="kit-body kit-about">
      <div className="kit-wrap kit-about-grid">
        <div className="kit-about-text">
          {heading && (
            <h2 id={id} data-slot="heading" className="kit-title">
              {heading}
            </h2>
          )}
          {body && (
            <p data-slot="body" className="kit-about-body">
              {body}
            </p>
          )}
        </div>
        {image && (
          <figure className="kit-about-media">
            <Media image={image} images={images} ratio={mediaRatio} className="kit-about-img" />
          </figure>
        )}
      </div>
    </section>
  );
}
