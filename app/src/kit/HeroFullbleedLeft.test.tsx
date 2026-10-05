import type { ImageSlotValue } from "../engine/contracts/pageDoc";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";

/** hero/fullbleed-left (M2A-2a K6 · m2a K1-2) — [U] 마크업. 390 미디어 띠 위치·실측은 K9 브라우저 */
const ID = "11111111-1111-4111-8111-111111111111";
const hero = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="hero/fullbleed-left"]')!;
const img = (over: Partial<ImageSlotValue>): ImageSlotValue => ({ kind: "image", enabled: true, source: ID as ImageSlotValue["source"], alt: "가게 전경", decorative: false, ...over });

describe("hero/fullbleed-left (K1-2)", () => {
  it("구조: section aria-labelledby = h1 id · 제목·부제·CTA(첫 contact 앵커) · DOM 순서 h1 → 미디어 (K-AC-21 DOM)", () => {
    const h = hero(drawDoc());
    expect(h.tagName).toBe("SECTION");
    expect(h.getAttribute("aria-labelledby")).toBe("h-s-hero");
    const h1 = h.querySelector("h1")!;
    expect(h1.id).toBe("h-s-hero");
    expect(h1).toHaveAttribute("data-slot", "title");
    expect(h.querySelector('[data-slot="subtitle"]')!.tagName).toBe("P");
    expect(h.querySelector('a[data-slot="cta"]')).toHaveAttribute("href", "#s-s-contact");
    const media = h.querySelector("[data-media]")!;
    expect(h1.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("K-AC-20: 글자 3요소의 가장 가까운 면 = 카피 패널(primary) — 미디어 층 안 글자 0", () => {
    const h = hero(drawDoc());
    for (const el of [h.querySelector("h1")!, h.querySelector('[data-slot="subtitle"]')!, h.querySelector('[data-slot="cta"]')!])
      expect(el.parentElement!.closest("[data-surface]")).toHaveAttribute("data-surface", "primary");
    expect(h.querySelector("[data-media]")!.textContent).toBe("");
  });

  it("K-AC-20: 이미지 끔 → 미디어 요소 0, 섹션 면 = primary", () => {
    const h = hero(drawDoc(patch(sampleDoc(), "s-hero", { image: img({ enabled: false }) })));
    expect(h.querySelectorAll("[data-media], img")).toHaveLength(0);
    expect(h).toHaveAttribute("data-surface", "primary");
  });

  it("K-AC-22: 로컬 이미지(URL 있음) → img[alt=슬롯 alt] + width·height · 즉시 로드 · 장식이면 alt=''", () => {
    const h = hero(drawDoc(patch(sampleDoc(), "s-hero", { image: img({}) }), { [ID]: "blob:null/abc" }));
    const el = h.querySelector("img")!;
    expect(el).toHaveAttribute("src", "blob:null/abc");
    expect(el).toHaveAttribute("alt", "가게 전경");
    expect(el).toHaveAttribute("width");
    expect(el).toHaveAttribute("height");
    expect(el).toHaveAttribute("fetchpriority", "high");
    expect(el).not.toHaveAttribute("loading");
    const deco = hero(drawDoc(patch(sampleDoc(), "s-hero", { image: img({ decorative: true, alt: "무시" }) }), { [ID]: "blob:null/abc" }));
    expect(deco.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("K-AC-22 · MQ-5: 플레이스홀더(또는 Blob 미도착) → 자체 그래픽 요소(SPEC m2c 4절) aria-hidden, img 0", () => {
    for (const doc of [sampleDoc(), patch(sampleDoc(), "s-hero", { image: img({}) })]) {
      const h = hero(drawDoc(doc));
      expect(h.querySelectorAll("img")).toHaveLength(0);
      expect(h.querySelector("[data-media]")).toHaveAttribute("aria-hidden", "true");
      expect(h.querySelector("[data-media]")).toHaveAttribute("data-media", "art");
    }
  });

  it("0.8 · K-AC-04: 부제 빈 값 → 부제 요소 0 · 빈 p 0 / K-AC-03 상한(제목 40 · 부제 120 · CTA 16) 그대로", () => {
    const empty = hero(drawDoc(patch(sampleDoc(), "s-hero", { subtitle: "   " })));
    expect(empty.querySelector('[data-slot="subtitle"]')).toBeNull();
    expect([...empty.querySelectorAll("p")].filter((p) => p.textContent === "")).toHaveLength(0);
    const [title, subtitle, cta] = ["가".repeat(40), "나".repeat(120), "다".repeat(16)];
    const full = hero(drawDoc(patch(sampleDoc(), "s-hero", { title, subtitle, cta })));
    expect([full.querySelector("h1")!.textContent, full.querySelector('[data-slot="subtitle"]')!.textContent, full.querySelector('[data-slot="cta"]')!.textContent]).toEqual([title, subtitle, cta]);
  });
});
