import { SECTION_LIBRARY } from "../../domain/sectionLibrary";

/**
 * 렌더러(킷)가 있는 변형 키 `type/variant` (M2A-2b B7 · m2a 3.2 C · MQ-3) — 부모(편집기)는 킷을 import하지 않으므로 데이터 상수로 둔다.
 * M2B-1b부터 바깥 3유형(header·hero·footer)은 라이브러리 변형 전부를 렌더한다 → 라이브러리에서 파생 + 본문 쌍 나열(/studio 진입 gzip — 18쌍 나열 대비 −58 B, dev/active/m2b-1b/logs/p1-budget.txt · M2B-2a 본문 8쌍 끝 상태 +5 B, dev/active/m2b-2a/logs/p1-budget.txt · M2B-2b 본문 12쌍 끝 상태 +26 B, dev/active/m2b-2b/logs/p1-budget.txt).
 * 킷 레지스트리 키와 같은 집합인지는 `src/test/renderedVariants.test.ts`가 대조한다(라이브러리에 킷 없는 바깥 변형이 늘면 실패). 캔버스 캡션(3.4)·변형 목록 표시가 같이 쓴다.
 */
export const RENDERED_VARIANTS: readonly string[] = Object.freeze([
  ...Object.entries(SECTION_LIBRARY.sections).flatMap(([type, variants]) => Object.keys(variants).map((variant) => `${type}/${variant}`)),
  "about/story",
  "about/text",
  "contact/form",
  "faq/accordion",
  "portfolio/grid-2",
  "portfolio/grid-3",
  "portfolio/masonry",
  "pricing/tiers-2",
  "services/cards-2",
  "services/cards-3",
  "services/cards-masonry",
  "services/list",
  "statistics/stats-3",
  "testimonials/quotes-2",
]);
