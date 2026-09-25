import type { ComparisonAttributes } from "../domain/comparisonCells";

/**
 * 비교 보드 속성 (SPEC 8.5 데이터 공백 — 상세 픽스처에 없는 값).
 * - A·B·C: 목업 `rowDefs`(Design Studio Mockups.dc.html 628~640행)의 메뉴·CTA·카드·이미지 비율·모바일·Footer 값.
 * - D·E·F: 목업에 없어 **임시값**이다. 상세 픽스처의 섹션·모바일 흐름과 맞췄다.
 * - sectionPlan: 상세 `sections`를 TRD 4.4 SectionType으로 옮긴 것. 유형이 없는 섹션(의료진·시간표 등)은
 *   가장 가까운 유형 + 변형 이름으로 적었다(임시). A는 SPEC 8.5에 따라 끝에 footer/biz-extended를 넣었다
 *   (상세 픽스처는 목업 1a-02와 같게 8개 그대로 둔다).
 */
export const referenceComparisonAttributes: Readonly<Record<string, ComparisonAttributes>> = Object.freeze({
  "ref-a": {
    sectionPlan: [
      { type: "header", variant: "sticky-right-cta" },
      { type: "hero", variant: "fullbleed-left" },
      { type: "about", variant: "split" },
      { type: "services", variant: "grid-3" },
      { type: "portfolio", variant: "masonry" },
      { type: "testimonials", variant: "carousel" },
      { type: "faq", variant: "accordion" },
      { type: "contact", variant: "map-form" },
      { type: "footer", variant: "biz-extended" },
    ],
    menuLabel: "5개 · 우측 CTA",
    cta: { label: "히어로 좌측 하단", value: "hero-inline" },
    card: { label: "보더 · 16px", style: "bordered-lg", surfaceTone: "light" },
    imageRatio: "16:9",
    mobile: { label: "단일 컬럼 · 하단 CTA", value: "single-column-bottom-cta" },
    paletteNote: "크림",
  },
  "ref-b": {
    sectionPlan: [
      { type: "header", variant: "sticky-hamburger" },
      { type: "hero", variant: "split" },
      { type: "services", variant: "grid-3" },
      { type: "portfolio", variant: "masonry" },
      { type: "testimonials", variant: "carousel" },
      { type: "contact", variant: "form" },
      { type: "footer", variant: "minimal" },
    ],
    menuLabel: "4개 · 모바일 햄버거",
    cta: { label: "헤더 우측 고정", value: "header-fixed" },
    card: { label: "엘리베이티드 · 다크", style: "elevated", surfaceTone: "dark" },
    imageRatio: "4:5",
    mobile: { label: "단일 컬럼 · 스티키 CTA", value: "single-column-sticky-cta" },
    paletteNote: "골드",
  },
  "ref-c": {
    sectionPlan: [
      { type: "header", variant: "sticky-two-tier" },
      { type: "hero", variant: "center" },
      { type: "about", variant: "split" },
      { type: "services", variant: "grid-3" },
      { type: "about", variant: "team-grid-3" },
      { type: "faq", variant: "accordion" },
      { type: "services", variant: "notice-list" },
      { type: "contact", variant: "map-form" },
      { type: "footer", variant: "biz-extended-map" },
    ],
    menuLabel: "6개 · 2단",
    cta: { label: "히어로 중앙", value: "hero-center" },
    card: { label: "보더 · 12px", style: "bordered-md", surfaceTone: "light" },
    imageRatio: "1:1",
    mobile: { label: "2컬럼 카드", value: "two-column-cards" },
    paletteNote: "화이트",
  },
  "ref-d": {
    sectionPlan: [
      { type: "header", variant: "transparent" },
      { type: "hero", variant: "grid" },
      { type: "services", variant: "grid-3" },
      { type: "services", variant: "schedule-table" },
      { type: "about", variant: "team-carousel" },
      { type: "pricing", variant: "cards" },
      { type: "contact", variant: "form" },
      { type: "footer", variant: "minimal" },
    ],
    menuLabel: "5개 · 투명 헤더",
    cta: { label: "하단 고정 버튼", value: "sticky-bottom" },
    card: { label: "엘리베이티드 · 라이트", style: "elevated", surfaceTone: "light" },
    imageRatio: "4:5",
    mobile: { label: "단일 컬럼 · 하단 탭 메뉴", value: "single-column-bottom-tabs" },
    paletteNote: "민트",
  },
  "ref-e": {
    sectionPlan: [
      { type: "header", variant: "sticky-right-cta" },
      { type: "hero", variant: "text" },
      { type: "services", variant: "list" },
      { type: "about", variant: "team-grid-2" },
      { type: "portfolio", variant: "case-list" },
      { type: "portfolio", variant: "insights-grid-3" },
      { type: "contact", variant: "form" },
      { type: "footer", variant: "biz-extended" },
    ],
    menuLabel: "4개 · 우측 상담 CTA",
    cta: { label: "헤더 우측 고정", value: "header-fixed" },
    card: { label: "플랫 · 구분선", style: "flat", surfaceTone: "light" },
    imageRatio: "16:9",
    mobile: { label: "단일 컬럼 · 아코디언 목록", value: "single-column-accordion" },
    paletteNote: "바이올렛",
  },
  "ref-f": {
    sectionPlan: [
      { type: "header", variant: "sticky-right-cta" },
      { type: "hero", variant: "image" },
      { type: "services", variant: "grid-3" },
      { type: "about", variant: "split" },
      { type: "portfolio", variant: "masonry" },
      { type: "contact", variant: "order-form" },
      { type: "contact", variant: "map-form" },
      { type: "footer", variant: "biz-extended" },
    ],
    menuLabel: "5개 · 우측 주문 CTA",
    cta: { label: "히어로 좌측 하단", value: "hero-inline" },
    card: { label: "보더 · 16px", style: "bordered-lg", surfaceTone: "light" },
    imageRatio: "1:1",
    mobile: { label: "2컬럼 카드 · 하단 주문 CTA", value: "two-column-cards-bottom-cta" },
    paletteNote: "오렌지",
  },
});
