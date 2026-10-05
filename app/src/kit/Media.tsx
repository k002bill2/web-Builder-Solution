import { createContext, createElement, useContext } from "react";
import type { ImageSlotValue, SectionInstance } from "../engine/contracts/pageDoc";
import { artSeed, artShapes } from "./art";

/** 내보내기 render(`loading: "eager"` — SPEC m2c 5.3-1) — hero 밖 img도 즉시 로드(화면 밖 숨은 iframe에서 lazy는 요청이 시작되지 않을 수 있다) */
export const EagerImages = createContext(false);

/**
 * 이미지 슬롯 (m2a 0.9 · MQ-5) — 로컬 이미지 URL이 있으면 `img`(alt = 슬롯 alt, 장식 = ""), 없으면 자체 그래픽 SVG(SPEC m2c 4절 — `aria-hidden`, 글자 0).
 * 자체 그래픽 시드 = (patternId, type, variant, slotKey) — 잃은 이미지(로컬 id인데 URL 없음)는 기본 무늬 "diagonal"(로컬 id는 시드에 넣지 않는다).
 * width·height = 비율값(자리 이동 0) · aspect = 원본 비율 칸(masonry)의 표시 비율. hero = 즉시 로드 + fetchpriority high, 그 밖 = lazy(내보내기는 즉시).
 */
export function Media({
  image,
  images,
  ratio,
  first,
  className,
  section,
  slot,
  aspect,
}: {
  readonly image: ImageSlotValue;
  readonly images: Readonly<Record<string, string>>;
  readonly ratio: readonly [number, number];
  readonly first?: boolean;
  readonly className: string;
  readonly section: SectionInstance;
  readonly slot: string;
  readonly aspect?: string;
}) {
  const eager = useContext(EagerImages);
  const url = typeof image.source === "string" ? images[image.source] : undefined;
  if (!url) {
    const pattern = typeof image.source === "object" ? image.source.patternId : "diagonal";
    const { shapes } = artShapes(artSeed(pattern, section.type, section.variant, slot));
    return (
      <div data-media="art" aria-hidden="true" className={`kit-art ${className}`}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
          {shapes.map((shape, i) => createElement(shape.tag, { key: i, className: shape.cls, ...shape.attrs }))}
        </svg>
      </div>
    );
  }
  return (
    <img
      data-media="image"
      src={url}
      alt={image.decorative ? "" : image.alt}
      width={ratio[0]}
      height={ratio[1]}
      {...(aspect && { style: { aspectRatio: aspect } })}
      {...(first ? { fetchPriority: "high" as const } : !eager && { loading: "lazy" as const })}
      className={`kit-img ${className}`}
    />
  );
}
