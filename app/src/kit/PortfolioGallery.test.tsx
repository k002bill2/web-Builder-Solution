import { readFileSync } from "node:fs";
import type { ImageSlotValue, SlotValue } from "../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "../render/testing/drawKit";
import { SAMPLE_KIT_TOKENS } from "../render/testing/sampleKitTokens";

/** portfolio/grid-3 · grid-2 · masonry (M2B-2b · SPEC-BODY B1-5~7 · 0.2-3) — 공유 PortfolioGallery. 열 수·칸 비율·다단 실측(KD-AC-14·15 [B])은 P-B */
const ID = "22222222-2222-4222-8222-222222222222";
const img = (over: Partial<ImageSlotValue> = {}): ImageSlotValue => ({ kind: "image", enabled: true, source: ID as ImageSlotValue["source"], alt: "작업 사진", decorative: false, ...over });
const off = img({ enabled: false });
const galleryDoc = (variant: string, slots: Readonly<Record<string, SlotValue>> = {}) =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => {
      if (s.instanceId !== "s-services") return s;
      const base = section("portfolio", variant, "s-portfolio", { tone: "alt" });
      return { ...base, slots: { ...base.slots, ...slots } };
    }),
  );
const portfolio = (c: HTMLElement, variant: string) => c.querySelector<HTMLElement>(`[data-section="portfolio/${variant}"]`)!;
const figures = (s: HTMLElement) => [...s.querySelectorAll("figure")];
const css = () => readFileSync("src/kit/kit.css", "utf8");
const cssSection = (marker: string) => {
  const at = css().indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("\n}\n", at));
};

describe("portfolio 공통 (KD-AC-13)", () => {
  it("KD-AC-13 · KD-AC-08 [U]: grid-3 킷 · h2 1 · h3 0 · 그라디언트 칸 3 = figure[aria-hidden=true] 번호 순서 · img 0 · ul·figcaption 0 · 포커스 0", () => {
    const s = portfolio(drawDoc(galleryDoc("grid-3")), "grid-3");
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-portfolio");
    expect(s.querySelector("h2")).toHaveAttribute("id", "h-s-portfolio");
    expect(s.querySelectorAll("h2")).toHaveLength(1);
    expect(s.querySelectorAll("h3")).toHaveLength(0);
    const gallery = s.querySelector('[data-layout="grid"]')!;
    expect(gallery).toHaveClass("kit-gallery", "kit-gallery--3");
    expect(figures(s).map((f) => f.dataset.slot)).toEqual(["image1", "image2", "image3"]);
    for (const f of figures(s)) {
      expect(f).toHaveAttribute("aria-hidden", "true");
      expect(f.parentElement).toBe(gallery);
    }
    expect(s.querySelectorAll("img, ul, li, figcaption")).toHaveLength(0);
    expect(s.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
  });

  it("KD-AC-13 [U]: 로컬 이미지 칸 = img[alt=슬롯 alt] + width·height(프로필 media_ratio, 없으면 4:5) · lazy · figure 트리 안 · 장식 = alt='' · 그라디언트 칸만 aria-hidden", () => {
    const urls = { [ID]: "blob:null/abc" };
    const s = portfolio(drawDoc(galleryDoc("grid-3", { image1: img(), image3: img({ decorative: true }) }), urls), "grid-3");
    const [one, two, three] = figures(s);
    expect(one).not.toHaveAttribute("aria-hidden");
    expect(one!.querySelector("img")).toHaveAttribute("alt", "작업 사진");
    expect([one!.querySelector("img")!.getAttribute("width"), one!.querySelector("img")!.getAttribute("height")]).toEqual(["4", "5"]);
    expect(one!.querySelector("img")).toHaveAttribute("loading", "lazy");
    expect(two).toHaveAttribute("aria-hidden", "true");
    expect(two!.querySelector("img")).toBeNull();
    expect(three).not.toHaveAttribute("aria-hidden");
    expect(three!.querySelector("img")).toHaveAttribute("alt", "");
    const wide = portfolio(drawDoc(galleryDoc("grid-2", { image1: img() }), urls, { ...SAMPLE_KIT_TOKENS, mediaRatio: "16:9" }), "grid-2");
    const el = wide.querySelector("img")!;
    expect([el.getAttribute("width"), el.getAttribute("height")]).toEqual(["16", "9"]);
  });

  it("KD-AC-13 · KD-AC-04 · KD-AC-03 [U]: figure 수 = 켜진 이미지 수(꺼진 칸 생략, 순서 유지) · 셋 다 꺼짐 → 갤러리 요소 0(머리만) · 소개 빈 값 → 0 · 상한 글자 그대로", () => {
    const one = portfolio(drawDoc(galleryDoc("grid-3", { image2: off })), "grid-3");
    expect(figures(one).map((f) => f.dataset.slot)).toEqual(["image1", "image3"]);
    const none = portfolio(drawDoc(galleryDoc("grid-3", { image1: off, image2: off, image3: off, intro: " " })), "grid-3");
    expect(none.querySelectorAll("figure, [data-layout], .kit-gallery, [data-media]")).toHaveLength(0);
    expect(none.querySelector('[data-slot="intro"]')).toBeNull();
    expect(none.querySelector("h2")).not.toBeNull();
    expect([...none.querySelectorAll("p, h2, div")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
    const texts = { heading: "가".repeat(40), intro: "나".repeat(160) };
    const full = portfolio(drawDoc(galleryDoc("masonry", texts)), "masonry");
    for (const [key, text] of Object.entries(texts)) expect(full.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
  });
});

describe("portfolio/grid-2 (B1-7)", () => {
  it("KD-AC-13 · KD-AC-14 [U]: figure 최대 2(image1·image2) · data-layout grid · 변형 class kit-gallery--2 · 하나 꺼짐 → 1칸", () => {
    const s = portfolio(drawDoc(galleryDoc("grid-2")), "grid-2");
    expect(s).toHaveAttribute("data-kit");
    expect(s.querySelector('[data-layout="grid"]')).toHaveClass("kit-gallery", "kit-gallery--2");
    expect(figures(s).map((f) => f.dataset.slot)).toEqual(["image1", "image2"]);
    expect(figures(portfolio(drawDoc(galleryDoc("grid-2", { image1: off })), "grid-2")).map((f) => f.dataset.slot)).toEqual(["image2"]);
  });
});

describe("portfolio/masonry (B1-6)", () => {
  it("KD-AC-15 · KD-AC-07 [U]: data-layout masonry · class kit-gallery--masonry · DOM 1·2·3 · 칸 비율 슬롯 번호 고정 1:1·16:9·4:5(프로필 media_ratio 무관) · 꺼진 칸 뒤도 자기 비율", () => {
    const urls = { [ID]: "blob:null/abc" };
    const tokens = { ...SAMPLE_KIT_TOKENS, mediaRatio: "16:9" as const };
    const s = portfolio(drawDoc(galleryDoc("masonry", { image1: img(), image2: img(), image3: img() }), urls, tokens), "masonry");
    expect(s.querySelector('[data-layout="masonry"]')).toHaveClass("kit-gallery", "kit-gallery--masonry");
    expect(figures(s).map((f) => f.dataset.slot)).toEqual(["image1", "image2", "image3"]);
    const sizes = (c: HTMLElement) => [...c.querySelectorAll("img")].map((el) => `${el.getAttribute("width")}:${el.getAttribute("height")}`);
    expect(sizes(s)).toEqual(["1:1", "16:9", "4:5"]);
    expect([...s.querySelectorAll("[data-media]")].map((el) => [...el.classList].find((c) => c.startsWith("kit-r")))).toEqual(["kit-r1x1", "kit-r16x9", "kit-r4x5"]);
    const gap = portfolio(drawDoc(galleryDoc("masonry", { image1: img(), image2: off, image3: img() }), urls, tokens), "masonry");
    expect(sizes(gap)).toEqual(["1:1", "4:5"]);
    const grad = portfolio(drawDoc(galleryDoc("masonry")), "masonry");
    expect([...grad.querySelectorAll('[data-media="gradient"]')].map((el) => [...el.classList].find((c) => c.startsWith("kit-r")))).toEqual(["kit-r1x1", "kit-r16x9", "kit-r4x5"]);
  });

  it("KD-AC-14 · 15 · 07 [U]: grid md 이상 3·2열 고정 트랙(auto-fit 0) · masonry md 이상 CSS 다단 2 · 칸 break-inside avoid · 고정 비율 class · 선택자 = class(data-layout·nth-child 0) · 재배치 0", () => {
    const block = cssSection("/* portfolio/grid-3 · grid-2 · masonry");
    expect(block).toMatch(/\.kit-gallery--3 \{\s*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/);
    expect(block).toMatch(/\.kit-gallery--2 \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(block).toMatch(/\.kit-gallery--masonry \{\s*display: block;\s*columns: 2;/);
    expect(block).toMatch(/\.kit-gallery--masonry > \.kit-gallery-cell \{\s*break-inside: avoid;/);
    expect(block).toMatch(/\.kit-r1x1 \{\s*aspect-ratio: 1;\s*\}/);
    expect(block).toMatch(/\.kit-r16x9 \{\s*aspect-ratio: 16 \/ 9;\s*\}/);
    expect(block).toMatch(/\.kit-r4x5 \{\s*aspect-ratio: 4 \/ 5;\s*\}/);
    expect(block).toMatch(/\.kit-gallery-media \{[^}]*aspect-ratio: var\(--site-media-ratio\);/);
    expect(block).not.toMatch(/data-layout|\border\s*:|-reverse|grid-area|grid-row|grid-template-rows|auto-fit|auto-fill|nth-child|column-span/);
  });
});
