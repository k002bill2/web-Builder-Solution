import { bodySurface, headingId } from "./body";
import { ServicesHead } from "./servicesHead";
import { slotText, splitItems } from "./text";
import type { KitSectionProps } from "./types";

/**
 * services/list (M2B-2a · SPEC-BODY B1-2) — 머리(제목 + 소개) → 이름 목록(`ul role=list`, 항목 위 구분선). 항목은 헤딩·링크 아님.
 * `items` 나누기 = 0.10 `splitItems`(가운뎃점만 — 줄바꿈은 구분자 아님, 조각 글자 그대로 · 접힘은 CSS) · 조각 0 → ul 생략.
 * lg 이상 2단(머리 5 : 목록 7) · md~lg 1단 + 목록 2열(CSS 다단, 문서 순서) · md 미만 1단 1열.
 */
export function ServicesList({ section, root }: KitSectionProps) {
  const items = splitItems(slotText(section, "items"));
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={headingId(section)} className="kit-body kit-services">
      <div className="kit-wrap kit-services-inner kit-list-grid">
        <ServicesHead section={section} />
        {items.length > 0 && (
          <ul role="list" className="kit-list">
            {items.map((item, i) => (
              <li key={i} className="kit-list-item">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
