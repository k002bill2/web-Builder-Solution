import type { ImageSlotValue } from "../engine/contracts/pageDoc";

/**
 * 이미지 슬롯 (m2a 0.9 · MQ-5) — 로컬 이미지 URL이 있으면 `img`(alt = 슬롯 alt, 장식 = ""), 없으면 토큰 그라디언트(`aria-hidden`, 글자 0).
 * width·height = 비율값(자리 이동 0). hero = 즉시 로드 + fetchpriority high, 그 밖 = lazy.
 */
export function Media({
  image,
  images,
  ratio,
  first,
  className,
}: {
  readonly image: ImageSlotValue;
  readonly images: Readonly<Record<string, string>>;
  readonly ratio: readonly [number, number];
  readonly first?: boolean;
  readonly className: string;
}) {
  const url = typeof image.source === "string" ? images[image.source] : undefined;
  if (!url) return <div data-media="gradient" aria-hidden="true" className={`kit-gradient ${className}`} />;
  return (
    <img
      data-media="image"
      src={url}
      alt={image.decorative ? "" : image.alt}
      width={ratio[0]}
      height={ratio[1]}
      {...(first ? { fetchPriority: "high" as const } : { loading: "lazy" as const })}
      className={`kit-img ${className}`}
    />
  );
}
