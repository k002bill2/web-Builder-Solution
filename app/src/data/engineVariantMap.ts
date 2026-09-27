/**
 * 구조안 변형 → 엔진 변형 대응표 (DS-2A-05 SPEC 8.2.1 · `docs/design/2a-05/VARIANT-MAP.md` 1~42행 · Q-21 A · r4.6 A3-Q3: 19·31·32행 그리드 축 변형 · r4.7 A3-Q6: 33행 portfolio/grid-2 그대로).
 * 표 리터럴은 이 파일에만 둔다 — 부르는 곳은 `startDocWrite`(조작 뒤 청크) 1곳. 키 = `type/variant` 쌍, 유형은 바꾸지 않는다.
 * 값 = [엔진 변형, 구조안 변형 이름표(바뀐 쌍 알림용 — 그대로인 행은 빈 값)]. engine을 import하지 않는다(engineImportGuard).
 */
import type { SectionType } from "../domain/compareBoard";

type Row = readonly [to: string, fromLabel: string];
const same = (type: SectionType, ...variants: string[]): [string, Row][] => variants.map((v) => [`${type}/${v}`, [v, ""]]);

export const ENGINE_VARIANT_MAP: Readonly<Record<string, Row>> = Object.freeze(
  Object.fromEntries([
    ...same("header", "sticky-right-cta", "sticky-hamburger", "sticky-two-tier", "transparent"),
    ...same("hero", "fullbleed-left", "split", "center", "grid", "text", "image"),
    ...same("footer", "biz-extended", "biz-extended-map", "minimal", "minimal-biz"),
    ["about/split", ["story", "2단 소개"]],
    ["about/team-grid-3", ["story", "팀 카드 3열"]],
    ["about/team-carousel", ["story", "팀 캐러셀"]],
    ["about/team-grid-2", ["story", "팀 카드 2열"]],
    ...same("about", "story", "text"),
    ["services/grid-3", ["cards-3", "3열"]],
    ["services/grid-2", ["cards-2", "2열"]],
    ["services/masonry", ["cards-masonry", "마소니"]],
    ["services/notice-list", ["list", "공지 목록"]],
    ["services/schedule-table", ["list", "일정 표"]],
    ...same("services", "list", "cards-3"),
    ["portfolio/case-list", ["grid-3", "사례 목록"]],
    ["portfolio/insights-grid-3", ["grid-3", "인사이트 3열"]],
    ...same("portfolio", "grid-3", "masonry", "grid-2"),
    ...same("statistics", "stats-3"),
    ["testimonials/carousel", ["quotes-2", "캐러셀"]],
    ...same("testimonials", "quotes-2"),
    ["pricing/cards", ["tiers-2", "카드형"]],
    ...same("pricing", "tiers-2"),
    ...same("faq", "accordion"),
    ["contact/map-form", ["form", "지도 + 폼"]],
    ["contact/order-form", ["form", "주문 폼"]],
    ...same("contact", "form", "booking"),
    ...same("cta-band", "banner"),
  ]),
);

/** 표 밖 쌍이면 undefined → UNKNOWN_VARIANT (8.2.1 (b)) */
export const mapVariant = (type: SectionType, variant: string): string | undefined => ENGINE_VARIANT_MAP[`${type}/${variant}`]?.[0];

/** 바뀐 쌍 알림의 구조안 변형 이름표 */
export const fromLabelOf = (type: SectionType, variant: string): string => ENGINE_VARIANT_MAP[`${type}/${variant}`]?.[1] || variant;
