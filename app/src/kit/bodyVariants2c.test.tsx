import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { STATIC_MENU_SCRIPT, buildStaticHtml } from "../features/studio/staticHtml/staticMarkup";
import { drawDoc } from "../render/testing/drawKit";

/** M2B-2c 마감 — 본문 12변형 합본 문서 공통 (SPEC-BODY KD-AC-01·06·07·08 · 2c는 최종 12변형 합본도 검사, M2B-2 브리프 3절 P-B) */
const PAIRS = [
  ["about", "text"],
  ["services", "list"],
  ["services", "cards-2"],
  ["services", "cards-masonry"],
  ["portfolio", "grid-3"],
  ["portfolio", "masonry"],
  ["portfolio", "grid-2"],
  ["statistics", "stats-3"],
  ["testimonials", "quotes-2"],
  ["pricing", "tiers-2"],
  ["contact", "booking"],
  ["cta-band", "banner"],
] as const;
const FILES = ["AboutStory", "ServicesList", "ServicesCards", "PortfolioGallery", "StatisticsStats3", "TestimonialsQuotes2", "PricingTiers2", "ContactForm", "ContactBooking", "CtaBandBanner"];
/** header · hero · 본문 12(톤 base/alt 교대, R-05) · footer */
export const doc12 = () => {
  const [header, hero] = sampleDoc().sections;
  const footer = sampleDoc().sections.at(-1)!;
  const body = PAIRS.map(([type, variant], i) => section(type, variant, `s-12-${i}`, { tone: i % 2 ? "alt" : "base" }));
  return withSections(sampleDoc(), [header!, hero!, ...body, footer]);
};
const ofPair = (c: HTMLElement) => PAIRS.map(([type, variant]) => c.querySelector<HTMLElement>(`[data-section="${type}/${variant}"]`)!);
const css = readFileSync("src/kit/kit.css", "utf8");
const block = (marker: string) => {
  const at = css.indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css.slice(at, css.indexOf("\n}\n", at));
};
const MARKERS_2C = ["/* testimonials/quotes-2", "/* pricing/tiers-2", "/* cta-band/banner", "/* contact/form (K1-6"];

describe("M2B-2c 본문 12변형 합본", () => {
  it("12변형 모두 킷으로 그린다(폴백 표식 0) · 문서 순서 = 슬롯 순서 · cta-band CTA = 합본의 첫 contact(booking) 앵커", () => {
    const c = drawDoc(doc12());
    const sections = ofPair(c);
    for (const s of sections) expect(s).toHaveAttribute("data-kit");
    expect(c.querySelectorAll("[data-fallback], [data-kit-marker]")).toHaveLength(0);
    for (let i = 1; i < sections.length; i++) expect(sections[i - 1]!.compareDocumentPosition(sections[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(sections[11]!.querySelector('a[data-slot="cta"]')).toHaveAttribute("href", "#s-s-12-10");
  });

  it("KD-AC-06 [U]: 12변형 합본의 정적 HTML — script = r4.12 고정 인라인 1개(바이트 일치) · on* 속성 0", () => {
    const markup = drawDoc(doc12()).querySelector("[data-site-root]")!.outerHTML;
    const html = buildStaticHtml({ markup, css: "[data-kit]{display:block}", title: "제목", description: "설명" });
    const page = new DOMParser().parseFromString(html, "text/html");
    expect([...page.querySelectorAll("script")].map((s) => s.outerHTML)).toEqual([`<script>${STATIC_MENU_SCRIPT}</script>`]);
    expect([...page.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name)).filter((n) => n.startsWith("on"))).toEqual([]);
  });

  it("KD-AC-08 [U]: 섹션마다 h2 1 · h3는 cards-2·cards-masonry·pricing에만 · 문서 h1 = 1(hero) · 헤딩 건너뛰기 0", () => {
    const c = drawDoc(doc12());
    const withH3 = new Set(["services/cards-2", "services/cards-masonry", "pricing/tiers-2"]);
    for (const s of ofPair(c)) {
      const key = s.getAttribute("data-section")!;
      expect(s.querySelectorAll("h2"), key).toHaveLength(1);
      expect(s.querySelectorAll("h3").length > 0, key).toBe(withH3.has(key));
      expect(s.querySelectorAll("h4, h5, h6, h1"), key).toHaveLength(0);
    }
    expect(c.querySelectorAll("h1")).toHaveLength(1);
  });

  it("KD-AC-07 [G]: 2c 변형 CSS 블록(후기·가격·CTA·예약 묶음)에 order·*-reverse·grid-area·grid-row 재배치 0", () => {
    for (const marker of MARKERS_2C) expect(block(marker), marker).not.toMatch(/\border\s*:|-reverse|grid-area|grid-row/);
  });

  it("KD-AC-01 [G]: 12변형 킷 파일 React 상태·효과·이벤트 prop 0 · 2c CSS 블록 transition·animation·scroll-behavior·vh류·hex·px 0", () => {
    for (const name of FILES) {
      const src = readFileSync(`src/kit/${name}.tsx`, "utf8");
      expect(src, name).not.toMatch(/\b(useState|useReducer|useEffect|useLayoutEffect|useRef|useCallback)\b|\bon[A-Z]\w*\s*=/);
    }
    for (const marker of MARKERS_2C) expect(block(marker), marker).not.toMatch(/transition|animation|scroll-behavior|\d(d|s|l)?v(h|w|min|max)\b|#[0-9a-fA-F]{3,8}\b|\d+px\b/);
  });
});
