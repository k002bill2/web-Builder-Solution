import { ServicesCards } from "./ServicesCards";
import type { KitSectionProps } from "./types";

/**
 * services/cards-3 (M2A-2b B3 · m2a K1-4) — 머리(제목 + 소개) → 카드 3개 목록(`ul role=list`, 번호 순서).
 * 마크업 = 공유 `ServicesCards`(M2B-2a — cards-2·cards-masonry와 같이 씀, 출력 그대로). md 이상 3열 같은 폭·같은 높이 · md 미만 1열.
 */
export const ServicesCards3 = (props: KitSectionProps) => <ServicesCards {...props} cards={[1, 2, 3]} />;
