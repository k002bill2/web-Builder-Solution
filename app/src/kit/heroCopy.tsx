import { slotText } from "./text";
import type { KitSectionProps } from "./types";

/** 카피 클래스 묶음 — 면 primary(fullbleed-left 패널 · center) = `kit-hero-*` / 섹션 톤 면(split·grid·text·image) = `kit-hx-*` */
export const PRIMARY_COPY = { title: "kit-hero-title", lead: "kit-hero-lead", cta: "kit-hero-cta" } as const;
export const TONE_COPY = { title: "kit-hx-title", lead: "kit-hx-lead", cta: "kit-cta kit-hx-cta" } as const;

/**
 * hero 카피 블록 (m2a K1-2 · SPEC-BOUND 2절 공통) — h1(id = aria-labelledby 대상) → 부제 → CTA(대상 0.10, 없으면 버튼 모양 글자). 빈 슬롯 생략(0.8).
 * hero 6변형이 같은 마크업을 쓰고 면에 맞는 클래스 묶음만 바꾼다.
 */
export function HeroCopy({
  section,
  links,
  heading,
  cls,
}: Pick<KitSectionProps, "section" | "links"> & { readonly heading: string; readonly cls: { readonly title: string; readonly lead: string; readonly cta: string } }) {
  const title = slotText(section, "title");
  const subtitle = slotText(section, "subtitle");
  const cta = slotText(section, "cta");
  return (
    <>
      {title && (
        <h1 id={heading} data-slot="title" className={cls.title}>
          {title}
        </h1>
      )}
      {subtitle && (
        <p data-slot="subtitle" className={cls.lead}>
          {subtitle}
        </p>
      )}
      {cta &&
        (links.cta ? (
          <a href={links.cta} data-slot="cta" className={cls.cta}>
            {cta}
          </a>
        ) : (
          <span data-slot="cta" className={cls.cta}>
            {cta}
          </span>
        ))}
    </>
  );
}
