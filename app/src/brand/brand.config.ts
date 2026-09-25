import { BrandMark } from "./BrandMark";

/** 제품 브랜드 설정 (ADR-002). 브랜드 교체 = 이 파일 + styles/tokens/brand.css 만 수정. */
export const brand = Object.freeze({
  name: "Design Studio",
  shortName: "DS",
  tagline: "업종에 맞는 좋은 사이트를 찾고, 근거와 함께 비교하세요",
  Logo: BrandMark,
});
