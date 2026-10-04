import { headingId } from "./body";
import { HeroCopy, PRIMARY_COPY } from "./heroCopy";
import type { KitSectionProps } from "./types";

/**
 * hero/center (SPEC-BOUND B-5) — 섹션 전체 `primary` 단색 면(톤과 무관) · 카피 가운데 정렬, 폭 상한 prose-max. 글자·CTA = fullbleed-left 패널과 같은 조합(C-1).
 * 이미지 슬롯 없음 · 장식 0. 위아래 여백 = lg section-gap + s6 · md section-gap · md 미만 section-gap-narrow(kit-wrap).
 */
export function HeroCenter({ section, links, root }: KitSectionProps) {
  const heading = headingId(section);
  return (
    <section {...root} aria-labelledby={heading} data-surface="primary" className="kit-hx kit-hx--center">
      <div className="kit-wrap kit-hx-center">
        <HeroCopy section={section} links={links} heading={heading} cls={PRIMARY_COPY} />
      </div>
    </section>
  );
}
