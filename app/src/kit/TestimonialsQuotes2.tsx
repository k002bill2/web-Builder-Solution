import { bodySurface, headingId } from "./body";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

/**
 * testimonials/quotes-2 (SPEC-BODY B1-9) — 제목 h2 → 후기 카드 목록(`ul role=list`, 번호 순서). 카드 = li > figure > blockquote(후기) + figcaption(작성자).
 * 작성자는 blockquote 밖 평문(cite 요소·cite 속성 0 — MQ-B5). 카드 면 = services 카드(.kit-card) 재사용 · 별점·사진·인용 부호 장식 0.
 * 후기 빈 값 → 그 카드 생략 · 작성자 빈 값 → figcaption 생략 · 카드 0 → 목록 생략(0.8).
 */
export function TestimonialsQuotes2({ section, root }: KitSectionProps) {
  const heading = slotText(section, "heading");
  const id = headingId(section);
  const items = [1, 2].flatMap((n) => {
    const quote = slotText(section, `quote${n}`);
    return quote ? [{ n, quote, author: slotText(section, `author${n}`) }] : [];
  });
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={id} className="kit-body kit-quotes">
      <div className="kit-wrap kit-services-inner">
        {heading && (
          <h2 id={id} data-slot="heading" className="kit-title">
            {heading}
          </h2>
        )}
        {items.length > 0 && (
          <ul role="list" className="kit-cards kit-cards--2">
            {items.map(({ n, quote, author }) => (
              <li key={n} data-surface="card" className="kit-card">
                <figure className="kit-quote-figure">
                  <blockquote className="kit-quote">
                    <p data-slot={`quote${n}`} className="kit-quote-text">
                      {quote}
                    </p>
                  </blockquote>
                  {author && (
                    <figcaption data-slot={`author${n}`} className="kit-quote-author">
                      {author}
                    </figcaption>
                  )}
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
