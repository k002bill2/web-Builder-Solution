import { bodySurface, headingId } from "./body";
import { HeroCopy, TONE_COPY } from "./heroCopy";
import type { KitSectionProps } from "./types";

/**
 * hero/text (SPEC-BOUND B-7) — 섹션 톤 면 · 왼쪽 정렬 한 열 · 강조선(primary 짧은 가로 막대, 장식 aria-hidden) → 제목 → 부제 → CTA.
 * 새 타입 단계 0 — lg 이상 제목 폭 9/12로 큰 제목을 2줄 안팎에 · 부제 prose-max · 위아래 lg section-gap + s6. 이미지 슬롯 없음.
 */
export function HeroText({ section, links, root }: KitSectionProps) {
  const heading = headingId(section);
  return (
    <section {...root} {...bodySurface(section)} aria-labelledby={heading} className="kit-body kit-hx kit-hx--text">
      <div className="kit-wrap kit-hx-copy">
        <div aria-hidden="true" className="kit-hx-rule" />
        <HeroCopy section={section} links={links} heading={heading} cls={TONE_COPY} />
      </div>
    </section>
  );
}
