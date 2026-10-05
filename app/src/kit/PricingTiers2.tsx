import { bodySurface, headingId } from "./body";
import { ServicesHead } from "./servicesHead";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

/**
 * pricing/tiers-2 (SPEC-BODY B1-10) — 머리(제목 + 소개) → 요금제 카드 2개(`ul role=list`, 번호 순서). 카드 = 이름 h3 → 가격 → 설명(보이는 순서 = 읽는 순서).
 * 두 카드는 동등(추천 표식·한쪽 강조·카드별 버튼 0). 가격은 슬롯 글자 그대로(통화·단위 0) — 기본 "문의"도 숫자 가격과 같은 모양. 카드 면·2열 = services cards-2 재사용.
 * 이름·가격·설명 빈 값 → 그 요소만 생략, 카드는 남김(2칸 배치 유지, 0.8).
 */
export function PricingTiers2({ section, root }: KitSectionProps) {
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={headingId(section)} className="kit-body kit-pricing">
      <div className="kit-wrap kit-services-inner">
        <ServicesHead section={section} />
        <ul role="list" className="kit-cards kit-cards--2">
          {[1, 2].map((n) => {
            const name = slotText(section, `plan${n}Name`);
            const price = slotText(section, `plan${n}Price`);
            const body = slotText(section, `plan${n}Body`);
            return (
              <li key={n} data-surface="card" className="kit-card kit-plan">
                {name && (
                  <h3 data-slot={`plan${n}Name`} className="kit-card-title">
                    {name}
                  </h3>
                )}
                {price && (
                  <p data-slot={`plan${n}Price`} className="kit-plan-price">
                    {price}
                  </p>
                )}
                {body && (
                  <p data-slot={`plan${n}Body`} className="kit-card-body">
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
