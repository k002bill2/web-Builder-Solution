import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc, without } from "../render/testing/drawKit";

/** cta-band/banner (M2B-2c · SPEC-BODY B1-12) — 전체 폭 primary 띠 + 뒤집은 CTA. 같은 행/390 전체 폭·색 계산값 실측(KD-AC-21 [B])은 P-B */
const ctaDoc = (slots: Readonly<Record<string, string>> = {}, tone: "base" | "alt" = "base", base = sampleDoc()) =>
  withSections(
    base,
    base.sections.map((s) => (s.type === "cta-band" ? { ...s, tone, slots: { ...s.slots, ...slots } } : s)),
  );
const band = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="cta-band/banner"]')!;
const ctaOf = (c: HTMLElement) => band(c).querySelector<HTMLElement>('[data-slot="cta"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");
const cssSection = (marker: string) => {
  const at = css().indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("\n}\n", at));
};

describe("cta-band/banner (B1-12)", () => {
  it("KD-AC-21 · KD-AC-08 [U]: 킷 · 면 표시 primary(톤 base·alt 둘 다 — 톤 무관) · h2 1 · h3 0 · 순서 제목 → 본문 → CTA · CTA = a, 첫 contact 앵커", () => {
    for (const tone of ["base", "alt"] as const) {
      const s = band(drawDoc(ctaDoc({}, tone)));
      expect(s).toHaveAttribute("data-kit");
      expect(s).toHaveAttribute("data-surface", "primary");
      expect(s).toHaveAttribute("data-tone", tone);
      expect(s.getAttribute("aria-labelledby")).toBe("h-s-cta");
      expect(s.querySelector("h2")).toHaveAttribute("id", "h-s-cta");
      expect(s.querySelectorAll("h2")).toHaveLength(1);
      expect(s.querySelectorAll("h3, img, svg, button")).toHaveLength(0);
      expect([...s.querySelectorAll("[data-slot]")].map((el) => `${el.tagName}:${el.getAttribute("data-slot")}`)).toEqual(["H2:heading", "P:body", "A:cta"]);
      expect(s.querySelector("a")).toHaveAttribute("href", "#s-s-contact");
    }
  });

  it("KD-AC-21 [U]: CTA 대상 = 첫 contact(form·booking 무관) → 없으면 footer → 없으면 a 0 + 버튼 모양 span(포커스 0) · href='#' 0", () => {
    const booking = withSections(sampleDoc(), sampleDoc().sections.map((s) => (s.type === "contact" ? section("contact", "booking", "s-book") : s)));
    expect(ctaOf(drawDoc(booking))).toHaveAttribute("href", "#s-s-book");
    const noContact = without(sampleDoc(), "contact");
    expect(ctaOf(drawDoc(noContact))).toHaveAttribute("href", "#s-s-footer");
    const none = drawDoc(without(noContact, "footer"));
    const span = ctaOf(none);
    expect(span.tagName).toBe("SPAN");
    expect(span).not.toHaveAttribute("tabindex");
    expect(band(none).querySelectorAll("a, [tabindex], [href]")).toHaveLength(0);
    for (const doc of [sampleDoc(), booking, noContact]) expect(band(drawDoc(doc)).querySelectorAll('[href="#"]')).toHaveLength(0);
  });

  it("KD-AC-03 · KD-AC-04 [U]: 글자 = 슬롯 그대로(상한 40 · 120 · 16자) · body 빈 값 → p 0 · cta 빈 값 → CTA 0(글만 남은 띠) · 빈 p·a·span 0", () => {
    const texts = { heading: "가".repeat(40), body: "나".repeat(120), cta: "w".repeat(16) };
    const s = band(drawDoc(ctaDoc(texts)));
    for (const [key, text] of Object.entries(texts)) expect(s.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
    const empty = band(drawDoc(ctaDoc({ body: " ", cta: "" })));
    expect(empty.querySelectorAll('[data-slot="body"], [data-slot="cta"], a')).toHaveLength(0);
    expect(empty.querySelector("h2")).not.toBeNull();
    expect([...empty.querySelectorAll("p, a, span, h2")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("KD-AC-21 · 05 · 07 [G]: 띠 면 primary · 글자 on-primary · CTA 뒤집기(on-primary 면 · primary 글자 · hit-min · 버튼 radius) · 링 on-primary + 간격 primary · 위아래 section-gap-narrow(md 이상도) · md 이상 한 줄 · md 미만 CTA 전체 폭 · ink·bg·muted 글자 0 · 재배치 0", () => {
    const block = cssSection("/* cta-band/banner");
    expect(block).toMatch(/\.kit-band \{[^}]*background: var\(--site-primary\);[^}]*color: var\(--site-on-primary\);[^}]*--kit-ring: var\(--site-on-primary\);[^}]*--kit-ring-gap: var\(--site-primary\);/);
    expect(block).toMatch(/\.kit-band-wrap \{[^}]*padding: var\(--site-section-gap-narrow\) var\(--site-s4\);/);
    expect(block).toMatch(/\.kit-band-title \{[^}]*color: var\(--site-on-primary\);/);
    expect(block).toMatch(/\.kit-band-cta \{[^}]*min-height: var\(--site-hit-min\);[^}]*padding: var\(--site-s2\) var\(--site-s4\);[^}]*border-radius: var\(--site-radius-control\);[^}]*background: var\(--site-on-primary\);[^}]*color: var\(--site-primary\);[^}]*font-weight: var\(--site-weight-heading\);/);
    expect(block).toMatch(/\.kit-band-cta \{[^}]*justify-content: center;/);
    expect(block).toMatch(/@media \(width >= 48rem\) \{[^@]*\.kit-band-wrap \{[^}]*display: flex;[^}]*align-items: center;[^}]*padding: var\(--site-section-gap-narrow\) var\(--site-s6\);/);
    expect(block).not.toMatch(/data-layout|data-tone|\border\s*:|-reverse|grid-area|grid-row|nowrap|text-overflow|color: var\(--site-(ink|bg|muted)\)|--kit-soft|gradient|opacity/);
  });
});
