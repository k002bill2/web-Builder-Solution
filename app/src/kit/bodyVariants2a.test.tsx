import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { STATIC_MENU_SCRIPT, buildStaticHtml } from "../features/studio/staticHtml/staticMarkup";
import { drawDoc, without } from "../render/testing/drawKit";

/** M2B-2a 4변형 공통 (SPEC-BODY KD-AC-06·07·08) — about/text · services/list · cards-2 · cards-masonry를 한 문서에 넣어 검사 */
const PAIRS = [
  ["about", "text"],
  ["services", "list"],
  ["services", "cards-2"],
  ["services", "cards-masonry"],
] as const;
const doc2a = () => {
  const base = without(sampleDoc(), "cta-band");
  const body = PAIRS.map(([type, variant], i) => section(type, variant, `s-2a-${i}`, { tone: i % 2 ? "alt" : "base" }));
  const sections = base.sections.filter((s) => s.type !== "about" && s.type !== "services");
  return withSections(base, [sections[0]!, sections[1]!, ...body, ...sections.slice(2)]);
};
const ofPair = (c: HTMLElement) => PAIRS.map(([type, variant]) => c.querySelector<HTMLElement>(`[data-section="${type}/${variant}"]`)!);

describe("M2B-2a 4변형 공통", () => {
  it("4변형 모두 킷으로 그린다(폴백 표식 0)", () => {
    const c = drawDoc(doc2a());
    for (const s of ofPair(c)) expect(s).toHaveAttribute("data-kit");
    expect(c.querySelectorAll("[data-fallback], [data-kit-marker]")).toHaveLength(0);
  });

  it("KD-AC-06 [U]: 4변형이 든 문서의 정적 HTML — script = r4.12 고정 인라인 1개(바이트 일치) · on* 속성 0", () => {
    const markup = drawDoc(doc2a()).querySelector("[data-site-root]")!.outerHTML;
    const html = buildStaticHtml({ markup, css: "[data-kit]{display:block}", title: "제목", description: "설명" });
    const page = new DOMParser().parseFromString(html, "text/html");
    expect([...page.querySelectorAll("script")].map((s) => s.outerHTML)).toEqual([`<script>${STATIC_MENU_SCRIPT}</script>`]);
    expect([...page.querySelectorAll("*")].flatMap((el) => [...el.attributes].map((a) => a.name)).filter((n) => n.startsWith("on"))).toEqual([]);
  });

  it("KD-AC-08 [U]: 섹션마다 h2 1 · h3는 cards-2·cards-masonry(카드 제목)에만 · about/text·list h3 0", () => {
    const [text, list, cards2, masonry] = ofPair(drawDoc(doc2a()));
    for (const s of [text, list, cards2, masonry]) expect(s!.querySelectorAll("h2")).toHaveLength(1);
    expect(text!.querySelectorAll("h3")).toHaveLength(0);
    expect(list!.querySelectorAll("h3")).toHaveLength(0);
    expect(cards2!.querySelectorAll("h3")).toHaveLength(2);
    expect(masonry!.querySelectorAll("h3")).toHaveLength(3);
  });

  it("KD-AC-07 [G]: 이번 변형 CSS 블록에 order·*-reverse·grid-area·grid-row 재배치 0", () => {
    const css = readFileSync("src/kit/kit.css", "utf8");
    for (const marker of ["/* services/cards-2", "/* services/cards-masonry", "/* services/list"]) {
      const at = css.indexOf(marker);
      expect(at, marker).toBeGreaterThan(-1);
      expect(css.slice(at, css.indexOf("\n}\n", at))).not.toMatch(/\border\s*:|-reverse|grid-area|grid-row/);
    }
  });
});
