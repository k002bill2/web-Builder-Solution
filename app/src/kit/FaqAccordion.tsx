import { bodySurface, headingId } from "./body";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

const ITEMS = [1, 2, 3] as const;

/**
 * faq/accordion (M2A-2b B4 · m2a K1-5) — 네이티브 `details/summary`(React 상태·스크립트 0). 모두 닫힘(open 0) · `name` 0(여러 답을 같이 열 수 있게) · 질문은 헤딩 아님.
 * 빈 질문 = 그 항목 전체 생략(열 수 없는 빈 줄 0) · 빈 답 = 질문만 남김(0.8). 답 글자 = 보조 글자(--kit-soft).
 */
export function FaqAccordion({ section, root }: KitSectionProps) {
  const heading = slotText(section, "heading");
  const id = headingId(section);
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={id} className="kit-body kit-faq">
      <div className="kit-wrap kit-faq-inner">
        {heading && (
          <h2 id={id} data-slot="heading" className="kit-title">
            {heading}
          </h2>
        )}
        <div className="kit-faq-list">
          {ITEMS.map((n) => {
            const question = slotText(section, `q${n}`);
            const answer = slotText(section, `a${n}`);
            if (!question) return null;
            return (
              <details key={n} className="kit-faq-item">
                <summary data-slot={`q${n}`} className="kit-faq-q">
                  {question}
                </summary>
                {answer && (
                  <div className="kit-faq-a">
                    <p data-slot={`a${n}`} className="kit-faq-answer">
                      {answer}
                    </p>
                  </div>
                )}
              </details>
            );
          })}
        </div>
      </div>
    </section>
  );
}
