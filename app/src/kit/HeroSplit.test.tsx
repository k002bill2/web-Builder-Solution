import { readFileSync } from "node:fs";
import type { ImageSlotValue } from "../engine/contracts/pageDoc";
import { drawDoc, heroDoc, patch, withUnknownCta } from "../render/testing/drawKit";

/** hero/split (M2B-1a · SPEC-BOUND B-4 · KB-AC-10~12) — [U] 마크업. 같은 행 배치·비율 실측은 브라우저 */
const ID = "11111111-1111-4111-8111-111111111111";
const hero = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="hero/split"]')!;
const img = (over: Partial<ImageSlotValue> = {}): ImageSlotValue => ({ kind: "image", enabled: true, source: ID as ImageSlotValue["source"], alt: "가게 전경", decorative: false, ...over });
const css = () => readFileSync("src/kit/kit.css", "utf8");

describe("hero/split (B-4)", () => {
  it("킷 등록 · 구조: section 루트 1 · aria-labelledby = h1 id · 제목 → 부제 → CTA(첫 contact 앵커) → figure(미디어) DOM 순서 · 폴백 표식 0 (KB-AC-33)", () => {
    const c = drawDoc(withUnknownCta(heroDoc("split"))); // M2B-2c 이관: 폴백 예시 = cta-band 자리 no-such-variant
    expect(c.querySelectorAll('[data-section="hero/split"]')).toHaveLength(1);
    const h = hero(c);
    expect(h.tagName).toBe("SECTION");
    expect(h).toHaveAttribute("data-kit");
    expect(h.querySelector("[data-kit-marker]")).toBeNull();
    expect(c.querySelectorAll('[data-fallback="true"]')).toHaveLength(1); // cta-band 자리(no-such-variant)만
    const h1 = h.querySelector("h1")!;
    expect(h.getAttribute("aria-labelledby")).toBe(h1.id);
    expect(h.querySelector('a[data-slot="cta"]')).toHaveAttribute("href", "#s-s-contact");
    const order = [h1, h.querySelector('[data-slot="subtitle"]')!, h.querySelector('[data-slot="cta"]')!, h.querySelector("figure")!];
    for (let i = 1; i < order.length; i++) expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(h.querySelector("figure [data-media]")).not.toBeNull();
  });

  it("KB-AC-11: 섹션 면 = 톤 면(alt → surface · base → bg) · data-tone 루트 · h1·부제의 가장 가까운 면 = 섹션 루트 · 부제 글자 = --kit-soft(base muted · alt ink)", () => {
    for (const [tone, surface] of [["alt", "surface"], ["base", "bg"]] as const) {
      const h = hero(drawDoc(heroDoc("split", { tone })));
      expect(h).toHaveAttribute("data-tone", tone);
      expect(h).toHaveAttribute("data-surface", surface);
      expect(h.classList.contains("kit-body")).toBe(true);
      for (const el of [h.querySelector("h1")!, h.querySelector('[data-slot="subtitle"]')!]) expect(el.parentElement!.closest("[data-surface]")).toBe(h);
      expect(h.querySelector('[data-slot="subtitle"]')).toHaveClass("kit-hx-lead");
    }
    expect(css()).toMatch(/\.kit-hx-lead \{[^}]*color: var\(--kit-soft\)/);
  });

  it("KB-AC-12: 이미지 끔 → figure·미디어 0 · 1단 표시(kit-hx--solo) — 카피 폭 prose-max 규칙", () => {
    const h = hero(drawDoc(patch(heroDoc("split"), "s-hero", { image: img({ enabled: false }) })));
    expect(h.querySelectorAll("figure, [data-media], img")).toHaveLength(0);
    expect(h).toHaveClass("kit-hx--solo");
    expect(css()).toMatch(/\.kit-hx--solo \.kit-hx-copy \{[^}]*max-width: var\(--site-prose-max\)/);
  });

  it("B-4 5: 로컬 이미지 → img(alt · fetchpriority high · width/height = 프로필 media_ratio) / 플레이스홀더 → 그라디언트 aria-hidden", () => {
    const h = hero(drawDoc(patch(heroDoc("split"), "s-hero", { image: img() }), { [ID]: "blob:null/abc" }));
    const el = h.querySelector("figure img")!;
    expect(el).toHaveAttribute("alt", "가게 전경");
    expect(el).toHaveAttribute("fetchpriority", "high");
    expect([el.getAttribute("width"), el.getAttribute("height")]).toEqual(["4", "5"]);
    const p = hero(drawDoc(heroDoc("split")));
    expect(p.querySelectorAll("img")).toHaveLength(0);
    expect(p.querySelector("[data-media]")).toHaveAttribute("aria-hidden", "true");
  });

  it("0.8 · 상한: 부제 빈 값 → 부제 0 · 빈 p 0 / 제목 40 · 부제 120 · CTA 16 그대로", () => {
    const e = hero(drawDoc(patch(heroDoc("split"), "s-hero", { subtitle: " " })));
    expect(e.querySelector('[data-slot="subtitle"]')).toBeNull();
    expect([...e.querySelectorAll("p")].filter((x) => x.textContent === "")).toHaveLength(0);
    const [title, subtitle, cta] = ["가".repeat(40), "나".repeat(120), "다".repeat(16)];
    const f = hero(drawDoc(patch(heroDoc("split"), "s-hero", { title, subtitle, cta })));
    expect(["h1", '[data-slot="subtitle"]', '[data-slot="cta"]'].map((q) => f.querySelector(q)!.textContent)).toEqual([title, subtitle, cta]);
  });
});
