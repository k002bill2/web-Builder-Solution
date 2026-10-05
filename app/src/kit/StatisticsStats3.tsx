import { bodySurface, headingId } from "./body";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

/**
 * statistics/stats-3 (SPEC-BODY B1-8) — 제목 h2 → 수치 목록(`ul role=list`, 번호 순서). li 안 = 수치 → 설명(보이는 순서 = 읽는 순서, dl·h3 0).
 * 수치는 슬롯 글자 그대로(서식·count-up 0). 수치 빈 값 → 그 칸 생략 · 설명 빈 값 → 설명만 생략 · 칸 0 → 목록 생략(0.8).
 */
export function StatisticsStats3({ section, root }: KitSectionProps) {
  const heading = slotText(section, "heading");
  const id = headingId(section);
  const items = [1, 2, 3].flatMap((n) => {
    const value = slotText(section, `stat${n}Value`);
    return value ? [{ n, value, label: slotText(section, `stat${n}Label`) }] : [];
  });
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={id} className="kit-body kit-statistics">
      <div className="kit-wrap kit-services-inner">
        {heading && (
          <h2 id={id} data-slot="heading" className="kit-title">
            {heading}
          </h2>
        )}
        {items.length > 0 && (
          <ul role="list" className="kit-stats">
            {items.map(({ n, value, label }) => (
              <li key={n} className="kit-stat">
                <p data-slot={`stat${n}Value`} className="kit-stat-value">
                  {value}
                </p>
                {label && (
                  <p data-slot={`stat${n}Label`} className="kit-stat-label">
                    {label}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
