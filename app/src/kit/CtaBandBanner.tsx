import { headingId } from "./body";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

/**
 * cta-band/banner (SPEC-BODY B1-12) — 전체 폭 primary 띠(섹션 톤 base·alt와 무관, hero와 같은 예외) · 글(제목 h2 → 본문) → CTA(뒤집기: on-primary 면 · primary 글자).
 * CTA 대상 = 첫 contact(form·booking 무관) → footer → 없으면 버튼 모양 글자 span(포커스 0) — m2a 0.10(kitLinks). href="#" 0.
 * 본문 빈 값 → 생략 · CTA 빈 값 → 글만 남은 띠(0.8).
 */
export function CtaBandBanner({ section, links, root }: KitSectionProps) {
  const heading = slotText(section, "heading");
  const body = slotText(section, "body");
  const cta = slotText(section, "cta");
  const id = headingId(section);
  return (
    <section {...root} data-tone={section.tone} data-surface="primary" aria-labelledby={id} className="kit-band">
      <div className="kit-band-wrap">
        <div className="kit-band-text">
          {heading && (
            <h2 id={id} data-slot="heading" className="kit-band-title">
              {heading}
            </h2>
          )}
          {body && (
            <p data-slot="body" className="kit-band-body">
              {body}
            </p>
          )}
        </div>
        {cta &&
          (links.cta ? (
            <a href={links.cta} data-slot="cta" className="kit-band-cta">
              {cta}
            </a>
          ) : (
            <span data-slot="cta" className="kit-band-cta">
              {cta}
            </span>
          ))}
      </div>
    </section>
  );
}
