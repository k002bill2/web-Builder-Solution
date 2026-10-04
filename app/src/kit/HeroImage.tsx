import { bodySurface, headingId } from "./body";
import { HeroCopy, TONE_COPY } from "./heroCopy";
import { Media } from "./Media";
import { slotImage } from "./text";
import type { KitSectionProps } from "./types";

/**
 * hero/image (SPEC-BOUND B-8) — 전체 폭 미디어 띠(위) + 카피 띠(아래, 섹션 톤 면). DOM = 카피 → 미디어(제목 먼저), 보이는 순서는 그리드 영역 이름만.
 * 미디어 비율 lg 21:9 · md 16:9 · md 미만 4:3(vh 0). lg 이상 카피 2단(제목 7 : 부제 + CTA 5). 이미지 끔 = 미디어 0 · 카피 1열 prose-max.
 */
export function HeroImage({ section, links, images, root }: KitSectionProps) {
  const image = slotImage(section, "image");
  const heading = headingId(section);
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={heading} className={`kit-body kit-hx kit-hx--image${image ? "" : " kit-hx--solo"}`}>
      <div className="kit-wrap kit-hx-copy kit-hx-band">
        <HeroCopy section={section} links={links} heading={heading} cls={TONE_COPY} />
      </div>
      {image && <Media image={image} images={images} ratio={[16, 9]} first className="kit-hx-wide" />}
    </section>
  );
}
