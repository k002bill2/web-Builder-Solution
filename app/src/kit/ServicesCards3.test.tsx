import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";

/** services/cards-3 (M2A-2b B3 · m2a K1-4) — [U] 마크업 · 카드 면 규칙(kit.css). 같은 행·같은 높이 실측(K-AC-25 [B])은 B10 */
const services = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="services/cards-3"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");
/** kit.css 안 선택자 블록 본문 */
const block = (selector: string) => {
  const at = css().indexOf(`${selector} {`);
  expect(at, selector).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("}", at));
};

describe("services/cards-3 (K1-4)", () => {
  it("K-AC-25 [U]: section aria-labelledby = h2 · 머리(제목·소개) → ul[role=list] > li 3개, 각 h3 + 설명 (번호 순서)", () => {
    const s = services(drawDoc());
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-services");
    expect(s.querySelector("h2")).toHaveAttribute("id", "h-s-services");
    expect(s.querySelector('[data-slot="intro"]')!.tagName).toBe("P");
    const list = s.querySelector("ul")!;
    expect(list).toHaveAttribute("role", "list");
    const cards = [...list.children];
    expect(cards.map((li) => li.tagName)).toEqual(["LI", "LI", "LI"]);
    cards.forEach((li, i) => {
      expect(li.querySelector("h3")).toHaveAttribute("data-slot", `card${i + 1}Title`);
      expect(li.querySelector("p")).toHaveAttribute("data-slot", `card${i + 1}Body`);
    });
    expect(s.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
  });

  it("섹션 톤 표시: base → data-surface bg · alt → surface (카드 면 변수가 갈리는 기준)", () => {
    expect(services(drawDoc())).toHaveAttribute("data-tone", "alt");
    const base = withSections(sampleDoc(), sampleDoc().sections.map((x) => (x.type === "services" ? section("services", "cards-3", "s-services") : x)));
    expect(services(drawDoc(base))).toHaveAttribute("data-surface", "bg");
  });

  it("K-AC-26 [U]: 카드 면 = 섹션 톤별 카드 면 변수(base → card-face-base · alt → card-face-alt) · 카드 글자 ink · 카드 안 muted 0 · 소개 글자 base muted / alt ink", () => {
    expect(block(".kit-body")).toContain("--kit-card-face: var(--site-card-face-base)");
    expect(block('.kit-body[data-tone="alt"]')).toContain("--kit-card-face: var(--site-card-face-alt)");
    const card = block(".kit-card");
    expect(card).toContain("background: var(--kit-card-face)");
    expect(card).toContain("color: var(--site-ink)");
    expect(css().match(/\.kit-card[^{]*\{[^}]*\}/g)!.join("\n")).not.toContain("--site-muted");
    expect(block(".kit-body")).toContain("--kit-soft: var(--site-muted)");
    expect(block('.kit-body[data-tone="alt"]')).toContain("--kit-soft: var(--site-ink)");
    expect(block(".kit-services-intro")).toContain("color: var(--kit-soft)");
  });

  it("K-AC-04: 소개 빈 값 → 소개 0 · card2Body 빈 값 → 카드 2는 제목만 · 카드 제목 빈 값 → 카드는 남고 h3 0 · 빈 p·li 0", () => {
    const s = services(drawDoc(patch(sampleDoc(), "s-services", { intro: "", card2Body: " ", card3Title: "" })));
    expect(s.querySelector('[data-slot="intro"]')).toBeNull();
    const cards = [...s.querySelectorAll("li")];
    expect(cards).toHaveLength(3);
    expect(cards[1]!.querySelector("p")).toBeNull();
    expect(cards[1]!.querySelector("h3")).not.toBeNull();
    expect(cards[2]!.querySelector("h3")).toBeNull();
    expect([...s.querySelectorAll("p, h2, h3")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("K-AC-03: 상한 글자(제목 40 · 소개 160 · 카드 제목 30 · 설명 120) 그대로", () => {
    const texts = { heading: "가".repeat(40), intro: "나".repeat(160), card1Title: "다".repeat(30), card1Body: "라".repeat(120), card3Title: "마".repeat(30), card3Body: "바".repeat(120) };
    const s = services(drawDoc(patch(sampleDoc(), "s-services", texts)));
    for (const [key, text] of Object.entries(texts)) expect(s.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
  });
});
