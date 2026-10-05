import { bodySurface, headingId } from "./body";
import { Media } from "./Media";
import { ServicesHead } from "./servicesHead";
import { slotImage } from "./text";
import type { KitSectionProps } from "./types";

type Ratio = readonly [number, number];

interface GalleryOptions {
  /** 이미지 슬롯 번호 목록 — 번호 순서 = DOM 순서(KD-AC-07) */
  readonly cells: readonly number[];
  /** 갤러리 변형 class(배치만 다름 — 스타일은 class 선택자, 7절) */
  readonly mod: string;
  /** 판정 표시(SPEC B1-5~7 data-layout) — 스타일 선택자로 쓰지 않는다 */
  readonly layout: "grid" | "masonry";
  /** 칸 비율 고정(masonry, 슬롯 번호 순) — 없으면 프로필 media_ratio */
  readonly ratios?: readonly Ratio[];
}

/**
 * portfolio 갤러리 공통 (SPEC-BODY B1-5~7 · 0.2-3) — 머리(제목 + 소개) → 갤러리(켜진 이미지 칸마다 figure, 번호 순서). ul·figcaption 0 · 칸은 링크·버튼 아님.
 * 그라디언트 칸 = figure째 aria-hidden(트리 밖) · 로컬 이미지 = img alt + width·height(칸 비율). 켜진 칸 0 → 갤러리 생략(0.8).
 */
export function PortfolioGallery({ section, images, mediaRatio, root, cells, mod, layout, ratios }: Omit<KitSectionProps, "links"> & GalleryOptions) {
  const on = cells.flatMap((n, i) => {
    const image = slotImage(section, `image${n}`);
    return image ? [{ n, image, ratio: ratios?.[i] ?? mediaRatio }] : [];
  });
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={headingId(section)} className="kit-body kit-portfolio">
      <div className="kit-wrap kit-services-inner">
        <ServicesHead section={section} />
        {on.length > 0 && (
          <div data-layout={layout} className={`kit-gallery ${mod}`}>
            {on.map(({ n, image, ratio }) => {
              const real = typeof image.source === "string" && !!images[image.source];
              return (
                <figure key={n} data-slot={`image${n}`} aria-hidden={real ? undefined : "true"} className="kit-gallery-cell">
                  <Media image={image} images={images} ratio={ratio} className={ratios ? `kit-gallery-media kit-r${ratio.join("x")}` : "kit-gallery-media"} />
                </figure>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

/** portfolio/grid-3 (B1-5) — md 이상 3열 같은 폭(열 트랙 유지) · md 미만 1열 · 칸 비율 = media_ratio */
export const PortfolioGrid3 = (props: KitSectionProps) => <PortfolioGallery {...props} cells={[1, 2, 3]} mod="kit-gallery--3" layout="grid" />;

/** portfolio/grid-2 (B1-7) — grid-3의 열 수 2(image3 슬롯 없음) */
export const PortfolioGrid2 = (props: KitSectionProps) => <PortfolioGallery {...props} cells={[1, 2]} mod="kit-gallery--2" layout="grid" />;

/** portfolio/masonry (B1-6 · 0.2-2) — md 이상 CSS 2단 다단(단 배정 = 브라우저 균형) · 칸 비율 슬롯 번호 고정 1:1 · 16:9 · 4:5(원본 비율 메타 = M2c, MQ-B3) */
export const PortfolioMasonry = (props: KitSectionProps) => (
  <PortfolioGallery
    {...props}
    cells={[1, 2, 3]}
    mod="kit-gallery--masonry"
    layout="masonry"
    ratios={[
      [1, 1],
      [16, 9],
      [4, 5],
    ]}
  />
);
