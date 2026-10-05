import { bodySurface, headingId } from "./body";
import { HeroCopy, TONE_COPY } from "./heroCopy";
import { Media } from "./Media";
import { slotImage } from "./text";
import type { KitSectionProps } from "./types";

/**
 * hero/grid (SPEC-BOUND B-6) — 카피(섹션 톤 면) + 타일 격자: A = 사용자 이미지 1회(없으면 그라디언트) · B = primary · C = ink 장식 타일(aria-hidden, 글자 0).
 * lg 이상 2단 5 : 7 · md~lg 1단(카피 위 · 3칸) · md 미만 A만(4:3). 이미지 끔 = 타일 격자 전체 생략 · 카피 1단 prose-max.
 */
export function HeroGrid({ section, links, images, root }: KitSectionProps) {
  const image = slotImage(section, "image");
  const heading = headingId(section);
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={heading} className={`kit-body kit-hx kit-hx--grid${image ? "" : " kit-hx--solo"}`}>
      <div className="kit-wrap kit-hx-grid">
        <div className="kit-hx-copy">
          <HeroCopy section={section} links={links} heading={heading} cls={TONE_COPY} />
        </div>
        {image && (
          <div className="kit-hx-tiles">
            <Media image={image} images={images} ratio={[4, 5]} first className="kit-hx-tile kit-hx-tile--a" section={section} slot="image" />
            <div aria-hidden="true" className="kit-hx-tile kit-hx-tile--b" />
            <div aria-hidden="true" className="kit-hx-tile kit-hx-tile--c" />
          </div>
        )}
      </div>
    </section>
  );
}
