import { headingId } from "./body";
import { slotText } from "./text";
import type { KitSectionProps } from "./types";

/** services 머리 (K1-4 · B1-2~4 공통) — 제목 h2 + 소개(빈 값 → 생략, 0.8) */
export function ServicesHead({ section }: Pick<KitSectionProps, "section">) {
  const heading = slotText(section, "heading");
  const intro = slotText(section, "intro");
  return (
    <div className="kit-services-head">
      {heading && (
        <h2 id={headingId(section)} data-slot="heading" className="kit-title">
          {heading}
        </h2>
      )}
      {intro && (
        <p data-slot="intro" className="kit-services-intro">
          {intro}
        </p>
      )}
    </div>
  );
}
