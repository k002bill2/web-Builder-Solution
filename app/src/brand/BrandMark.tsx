type BrandMarkSize = 22 | 24;

const SIZE_CLASS: Record<BrandMarkSize, string> = {
  22: "size-5.5",
  24: "size-6",
};

/** 임시 로고 — 중립 단색 사각 마크 (ADR-002 플레이스홀더). 확정 로고로 교체 시 brand.config.ts의 Logo만 바꾼다. */
export function BrandMark({ size = 24 }: { size?: BrandMarkSize }) {
  return <span aria-hidden="true" className={`inline-block flex-none rounded-sm bg-label-normal ${SIZE_CLASS[size]}`} />;
}
