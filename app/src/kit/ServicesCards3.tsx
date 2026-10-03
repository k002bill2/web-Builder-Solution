import { bodySurface, headingId } from "./body";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

const CARDS = [1, 2, 3] as const;

/**
 * services/cards-3 (M2A-2b B3 · m2a K1-4) — 머리(제목 + 소개) → 카드 3개 목록(`ul role=list`, 번호 순서). 카드는 링크·버튼 아님(포커스 0).
 * 카드 면은 프로필 카드 톤 × 섹션 톤(kit.css `--kit-card-face`). 빈 카드 제목 = 카드는 남기고 h3만 생략(3칸 배치 유지, 0.8).
 */
export function ServicesCards3({ section, root }: KitSectionProps) {
  const heading = slotText(section, "heading");
  const intro = slotText(section, "intro");
  const id = headingId(section);
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={id} className="kit-body kit-services">
      <div className="kit-wrap kit-services-inner">
        <div className="kit-services-head">
          {heading && (
            <h2 id={id} data-slot="heading" className="kit-title">
              {heading}
            </h2>
          )}
          {intro && (
            <p data-slot="intro" className="kit-services-intro">
              {intro}
            </p>
          )}
        </div>
        <ul role="list" className="kit-cards">
          {CARDS.map((n) => {
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
