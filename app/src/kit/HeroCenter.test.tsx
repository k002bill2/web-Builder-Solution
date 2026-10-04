import { readFileSync } from "node:fs";
import { drawDoc, heroDoc, patch } from "../render/testing/drawKit";

/** hero/center (M2B-1a · SPEC-BOUND B-5 · KB-AC-13·14) — [U] 마크업·CSS 규칙. 가운데 축 실측은 브라우저 */
const hero = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="hero/center"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");

describe("hero/center (B-5)", () => {
  it("킷 등록 · 구조: section 루트 1 · aria-labelledby = h1 id · 제목 → 부제 → CTA · 이미지·미디어 0 · 폴백 표식 0", () => {
    const c = drawDoc(heroDoc("center"));
    expect(c.querySelectorAll('[data-section="hero/center"]')).toHaveLength(1);
    const h = hero(c);
    expect(h.tagName).toBe("SECTION");
    expect(h.querySelector("[data-kit-marker]")).toBeNull();
    const h1 = h.querySelector("h1")!;
    expect(h.getAttribute("aria-labelledby")).toBe(h1.id);
    expect(h.querySelector('a[data-slot="cta"]')).toHaveAttribute("href", "#s-s-contact");
    expect(h.querySelectorAll("img, figure, [data-media]")).toHaveLength(0);
  });

  it("KB-AC-13: 톤 base·alt 두 문서에서 같다 — 섹션 면 primary(data-surface) · 제목·부제 = primary 면 글자 클래스 · CTA = 뒤집기(on-primary 면 / primary 글자)", () => {
    const shapes = (["base", "alt"] as const).map((tone) => {
      const h = hero(drawDoc(heroDoc("center", { tone })));
      expect(h).toHaveAttribute("data-surface", "primary");
      expect(h.classList.contains("kit-body")).toBe(false);
      return [h.className, ...["h1", '[data-slot="subtitle"]', '[data-slot="cta"]'].map((q) => h.querySelector(q)!.className)];
    });
    expect(shapes[0]).toEqual(shapes[1]);
    expect(shapes[0]).toEqual(["kit-hx kit-hx--center", "kit-hero-title", "kit-hero-lead", "kit-hero-cta"]);
    const rule = css().match(/\.kit-hx--center \{([^}]*)\}/)![1]!;
    expect(rule).toMatch(/background: var\(--site-primary\)/);
    expect(rule).toMatch(/color: var\(--site-on-primary\)/);
    expect(css()).toMatch(/\.kit-hero-cta \{[^}]*background: var\(--site-on-primary\);[^}]*color: var\(--site-primary\)/);
  });

  it("KB-AC-14 규칙: 가운데 정렬 · 카피 폭 상한 prose-max", () => {
    expect(css()).toMatch(/\.kit-hx-center \{[^}]*max-width: var\(--site-prose-max\)[^}]*text-align: center/);
  });

  it("0.8 · 상한: 부제 빈 값 → 부제 0 / 제목 40 · 부제 120 · CTA 16 그대로", () => {
    expect(hero(drawDoc(patch(heroDoc("center"), "s-hero", { subtitle: "" }))).querySelector('[data-slot="subtitle"]')).toBeNull();
    const [title, subtitle, cta] = ["가".repeat(40), "나".repeat(120), "다".repeat(16)];
    const f = hero(drawDoc(patch(heroDoc("center"), "s-hero", { title, subtitle, cta })));
    expect(["h1", '[data-slot="subtitle"]', '[data-slot="cta"]'].map((q) => f.querySelector(q)!.textContent)).toEqual([title, subtitle, cta]);
  });
});
