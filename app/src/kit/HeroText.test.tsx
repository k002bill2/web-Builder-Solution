import { readFileSync } from "node:fs";
import { drawDoc, heroDoc, patch } from "../render/testing/drawKit";

/** hero/text (M2B-1a · SPEC-BOUND B-7 · KB-AC-18·19) — [U] 마크업·CSS 규칙. 왼쪽 끝·폭·200% 넘침 실측은 브라우저 */
const hero = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="hero/text"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");

describe("hero/text (B-7)", () => {
  it("킷 등록 · 구조: section 루트 1 · aria-labelledby = h1 id · 강조선 → 제목 → 부제 → CTA · 이미지·미디어 0 · 폴백 표식 0", () => {
    const c = drawDoc(heroDoc("text"));
    expect(c.querySelectorAll('[data-section="hero/text"]')).toHaveLength(1);
    const h = hero(c);
    expect(h.querySelector("[data-kit-marker]")).toBeNull();
    const h1 = h.querySelector("h1")!;
    expect(h.getAttribute("aria-labelledby")).toBe(h1.id);
    expect(h.querySelector('a[data-slot="cta"]')).toHaveAttribute("href", "#s-s-contact");
    expect(h.querySelectorAll("img, figure, [data-media]")).toHaveLength(0);
    expect(h.querySelector(".kit-hx-rule")!.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("KB-AC-18: 섹션 면 = 톤 면(base → bg · alt → surface) · 강조선 aria-hidden 글자 0 · 부제 = --kit-soft", () => {
    for (const [tone, surface] of [["alt", "surface"], ["base", "bg"]] as const) {
      const h = hero(drawDoc(heroDoc("text", { tone })));
      expect(h).toHaveAttribute("data-tone", tone);
      expect(h).toHaveAttribute("data-surface", surface);
      expect(h).toHaveClass("kit-body");
      const rule = h.querySelector(".kit-hx-rule")!;
      expect(rule).toHaveAttribute("aria-hidden", "true");
      expect(rule.textContent).toBe("");
      expect(h.querySelector('[data-slot="subtitle"]')).toHaveClass("kit-hx-lead");
    }
    expect(css()).toMatch(/\.kit-hx-rule \{[^}]*background: var\(--site-primary\)/);
  });

  it("KB-AC-19 규칙: lg 이상 제목 폭 ≤ 내용 폭 × 9/12 · 부제 폭 prose-max", () => {
    expect(css()).toMatch(/\.kit-hx--text \.kit-hx-title \{[^}]*max-width: calc\(100% \* 9 \/ 12\)/);
    expect(css()).toMatch(/\.kit-hx--text \.kit-hx-lead \{[^}]*max-width: var\(--site-prose-max\)/);
  });

  it("0.8 · 상한: 부제 빈 값 → 부제 0 · 빈 p 0 / 제목 40 · 부제 120 · CTA 16 그대로", () => {
    const e = hero(drawDoc(patch(heroDoc("text"), "s-hero", { subtitle: "" })));
    expect(e.querySelector('[data-slot="subtitle"]')).toBeNull();
    const [title, subtitle, cta] = ["가".repeat(40), "나".repeat(120), "다".repeat(16)];
    const f = hero(drawDoc(patch(heroDoc("text"), "s-hero", { title, subtitle, cta })));
    expect(["h1", '[data-slot="subtitle"]', '[data-slot="cta"]'].map((q) => f.querySelector(q)!.textContent)).toEqual([title, subtitle, cta]);
  });
});
