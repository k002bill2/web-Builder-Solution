/**
 * 가능 여부 이유 문장 — SPEC 5.2·5.4 표 · 5.3 · E-S12 문구를 따옴표 안 글자 그대로 옮긴다(조립하지 않는다).
 * `reasons.test.ts`가 SPEC 원문과 대조한다. INFERRED_REASONS는 표에 없는 경우를 같은 문형으로 유추한 문장이다(REPORT 표시).
 */
export const REASONS = Object.freeze({
  /** E-S12 */
  addBodyLimit: "본문 섹션은 9개까지입니다 (R-01) — 하나를 지우면 추가할 수 있습니다",
  /** 5.3 — Footer 문장 그대로, Header·Hero는 "Hero도 같음" 유추 */
  addFooterOnce: "Footer는 하나만 둘 수 있습니다",
  addHeaderOnce: "Header는 하나만 둘 수 있습니다",
  addHeroOnce: "Hero는 하나만 둘 수 있습니다",
  /** 5.2 표 */
  moveAboveHero: "Hero 위로는 옮길 수 없습니다 (R-02 Hero는 첫 본문)",
  moveHero: "Hero는 첫 본문 자리에 고정됩니다 (R-02)",
  moveHeader: "Header는 맨 위에 고정됩니다",
  moveFooter: "Footer는 맨 아래에 고정됩니다",
  moveBelowFooter: "Footer 아래로는 옮길 수 없습니다",
  /** Hero가 없는 문서의 첫 본문 — 유추 */
  moveAboveHeader: "Header 위로는 옮길 수 없습니다",
  /** 5.4 표 */
  removeHeader: "Header는 페이지에 꼭 하나 있어야 합니다 (R-01)",
  removeFooter: "Footer는 페이지에 꼭 하나 있어야 합니다 (R-01)",
  removeHero: "Hero는 첫 본문으로 꼭 있어야 합니다 (R-02)",
  removeBooking: "목적이 '예약'이라 Contact(예약)가 필요합니다 (R-04)",
  removeInquiry: "목적이 '문의'라 문의 섹션이 하나는 필요합니다 (R-03)",
});

export type ReasonKey = keyof typeof REASONS;

/** SPEC에 문장이 없어 같은 문형으로 유추한 것 */
export const INFERRED_REASONS: readonly ReasonKey[] = ["addHeaderOnce", "addHeroOnce", "moveAboveHeader", "removeFooter"];
