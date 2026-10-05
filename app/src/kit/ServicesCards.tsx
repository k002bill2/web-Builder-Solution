import { bodySurface, headingId } from "./body";
import { ServicesHead } from "./servicesHead";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

interface CardsOptions {
  /** 카드 번호 목록 — 번호 순서 = DOM 순서(KD-AC-07) */
  readonly cards: readonly number[];
  /** 목록 변형 class(배치만 다름 — 스타일은 class 선택자, 7절). 없음 = cards-3 */
  readonly mod?: string;
  /** 판정 표시(SPEC B1-4 data-layout) — 스타일 선택자로 쓰지 않는다 */
  readonly layout?: string;
}

/**
 * services 카드 공통 (K1-4 · B1-3 · B1-4) — 머리(제목 + 소개) → 카드 목록(`ul role=list`, 번호 순서). 카드는 링크·버튼 아님(포커스 0).
 * 카드 면은 프로필 카드 톤 × 섹션 톤(kit.css `--kit-card-face`). 빈 카드 제목 = 카드는 남기고 h3만 생략(배치 유지, 0.8).
 */
export function ServicesCards({ section, root, cards, mod, layout }: Pick<KitSectionProps, "section" | "root"> & CardsOptions) {
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={headingId(section)} className="kit-body kit-services">
      <div className="kit-wrap kit-services-inner">
        <ServicesHead section={section} />
        <ul role="list" data-layout={layout} className={mod ? `kit-cards ${mod}` : "kit-cards"}>
          {cards.map((n) => {
            const title = slotText(section, `card${n}Title`);
            const body = slotText(section, `card${n}Body`);
            return (
              <li key={n} data-surface="card" className="kit-card">
                {title && (
                  <h3 data-slot={`card${n}Title`} className="kit-card-title">
                    {title}
                  </h3>
                )}
                {body && (
                  <p data-slot={`card${n}Body`} className="kit-card-body">
                    {body}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/** services/cards-2 (B1-3) — cards-3의 카드 수 2 · md 이상 2열 같은 폭·같은 높이 · md 미만 1열 */
export const ServicesCards2 = (props: KitSectionProps) => <ServicesCards {...props} cards={[1, 2]} mod="kit-cards--2" />;
