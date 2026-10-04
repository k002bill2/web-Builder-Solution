import { bodySurface, headingId } from "./body";
import { HeroCopy, TONE_COPY } from "./heroCopy";
import { Media } from "./Media";
import { slotImage } from "./text";
import type { KitSectionProps } from "./types";

/**
 * hero/split (SPEC-BOUND B-4) — 카피(섹션 톤 면) | 이미지 칸(figure, 비율 = 프로필 media_ratio · md 미만 4:3 띠). 이미지 위 글자 0.
 * lg 이상 2단 6 : 6 · md~lg 7 : 5 · md 미만 1단(카피 → 이미지). 이미지 끔 = 1단 · 카피 폭 prose-max(kit-hx--solo).
 */
export function HeroSplit({ section, links, images, mediaRatio, root }: KitSectionProps) {
  const image = slotImage(section, "image");
  const heading = headingId(section);
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={heading} className={`kit-body kit-hx kit-hx--split${image ? "" : " kit-hx--solo"}`}>
      <div className="kit-wrap kit-hx-grid">
        <div className="kit-hx-copy">
          <HeroCopy section={section} links={links} heading={heading} cls={TONE_COPY} />
        </div>
        {image && (
          <figure className="kit-hx-figure">
            <Media image={image} images={images} ratio={mediaRatio} first className="kit-hx-split-img" />
          </figure>
        )}
      </div>
    </section>
  );
}
