import type { ImageSlotValue } from "../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";
import { SAMPLE_KIT_TOKENS } from "../render/testing/sampleKitTokens";

/** about/story (M2A-2b B2 · m2a K1-3) — [U] 마크업. 2단 ↔ 1단 · 비율 실측(K-AC-23·24)은 B10 브라우저 */
const ID = "11111111-1111-4111-8111-111111111111";
const about = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="about/story"]')!;
const img = (over: Partial<ImageSlotValue>): ImageSlotValue => ({ kind: "image", enabled: true, source: ID as ImageSlotValue["source"], alt: "작업실 모습", decorative: false, ...over });

describe("about/story (K1-3)", () => {
  it("킷 섹션: section aria-labelledby = h2 id · 제목·본문 data-slot · DOM 순서 글 → 이미지(figure) · figcaption 0", () => {
    const a = about(drawDoc());
    expect(a).toHaveAttribute("data-kit");
    expect(a.tagName).toBe("SECTION");
    expect(a.id).toBe("s-s-about");
    expect(a.getAttribute("aria-labelledby")).toBe("h-s-about");
    const h2 = a.querySelector("h2")!;
    expect(h2.id).toBe("h-s-about");
    expect(h2).toHaveAttribute("data-slot", "heading");
    const body = a.querySelector('[data-slot="body"]')!;
    expect(body.tagName).toBe("P");
    const figure = a.querySelector("figure")!;
    expect(body.compareDocumentPosition(figure) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(a.querySelector("figcaption")).toBeNull();
  });

  it("섹션 톤: base → 면 bg · alt → 면 surface (data-tone · data-surface)", () => {
    const base = about(drawDoc());
    expect(base).toHaveAttribute("data-tone", "base");
    expect(base).toHaveAttribute("data-surface", "bg");
    const alt = about(drawDoc(withSections(sampleDoc(), sampleDoc().sections.map((s) => (s.type === "about" ? section("about", "story", "s-about", { tone: "alt" }) : s)))));
    expect(alt).toHaveAttribute("data-tone", "alt");
    expect(alt).toHaveAttribute("data-surface", "surface");
  });

  it("K-AC-22: 로컬 이미지 → img[alt] + width·height = 프로필 비율 · lazy · 장식이면 alt=''", () => {
    const a = about(drawDoc(patch(sampleDoc(), "s-about", { image: img({}) }), { [ID]: "blob:null/abc" }));
    const el = a.querySelector("img")!;
    expect(el).toHaveAttribute("alt", "작업실 모습");
    expect([el.getAttribute("width"), el.getAttribute("height")]).toEqual(["4", "5"]);
    expect(el).toHaveAttribute("loading", "lazy");
    expect(el).not.toHaveAttribute("fetchpriority");
    const wide = about(drawDoc(patch(sampleDoc(), "s-about", { image: img({}) }), { [ID]: "blob:null/abc" }, { ...SAMPLE_KIT_TOKENS, mediaRatio: "16:9" }));
    expect([wide.querySelector("img")!.getAttribute("width"), wide.querySelector("img")!.getAttribute("height")]).toEqual(["16", "9"]);
    const deco = about(drawDoc(patch(sampleDoc(), "s-about", { image: img({ decorative: true }) }), { [ID]: "blob:null/abc" }));
    expect(deco.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("K-AC-22 · MQ-5: 플레이스홀더 → 그라디언트 aria-hidden, img 0", () => {
    const a = about(drawDoc());
    expect(a.querySelectorAll("img")).toHaveLength(0);
    expect(a.querySelector("[data-media]")).toHaveAttribute("data-media", "gradient");
    expect(a.querySelector("[data-media]")).toHaveAttribute("aria-hidden", "true");
  });

  it("K-AC-23 [U]·K-AC-04: 이미지 끔 → figure·미디어 0 · 1단 표시(data-layout single) · 빈 요소 0", () => {
    const two = about(drawDoc());
    expect(two).toHaveAttribute("data-layout", "split");
    const one = about(drawDoc(patch(sampleDoc(), "s-about", { image: img({ enabled: false }) })));
    expect(one.querySelectorAll("figure, [data-media], img")).toHaveLength(0);
    expect(one).toHaveAttribute("data-layout", "single");
    expect([...one.querySelectorAll("p, h2, div")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("K-AC-03: 상한 글자(제목 40 · 본문 400, 줄바꿈 포함) 그대로", () => {
    const [heading, body] = ["가".repeat(40), `${"나".repeat(200)}\n${"다".repeat(199)}`];
    const a = about(drawDoc(patch(sampleDoc(), "s-about", { heading, body })));
    expect([a.querySelector("h2")!.textContent, a.querySelector('[data-slot="body"]')!.textContent]).toEqual([heading, body]);
  });
});
