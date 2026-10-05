import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "../render/testing/drawKit";

/** services/cards-2 · cards-masonry (M2B-2a · SPEC-BODY B1-3·B1-4) — 공유 ServicesCards(카드 번호 목록). 같은 행·같은 높이·다단 실측(KD-AC-11·12 [B])은 P-B */
const cardsDoc = (variant: string, slots: Readonly<Record<string, string>> = {}) =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => {
      if (s.instanceId !== "s-services") return s;
      const base = section("services", variant, "s-services", { tone: "alt" });
      return { ...base, slots: { ...base.slots, ...slots } };
    }),
  );
const services = (c: HTMLElement, variant: string) => c.querySelector<HTMLElement>(`[data-section="services/${variant}"]`)!;
const css = () => readFileSync("src/kit/kit.css", "utf8");
const cssSection = (marker: string) => {
  const at = css().indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("\n}\n", at));
};

describe("services/cards-2 (B1-3)", () => {
  it("KD-AC-11 · KD-AC-08 [U]: 킷 · 머리 → ul[role=list] > li 2개(번호 순서) · 각 h3 + 설명 · h2 1 · 포커스 0 · cards-3과 같은 카드 class", () => {
    const s = services(drawDoc(cardsDoc("cards-2")), "cards-2");
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-services");
    expect(s.querySelectorAll("h2")).toHaveLength(1);
    const list = s.querySelector("ul")!;
    expect(list).toHaveAttribute("role", "list");
    expect(list).toHaveClass("kit-cards", "kit-cards--2");
    const cards = [...list.children];
    expect(cards.map((li) => li.className)).toEqual(["kit-card", "kit-card"]);
    cards.forEach((li, i) => {
      expect(li.querySelector("h3")).toHaveAttribute("data-slot", `card${i + 1}Title`);
      expect(li.querySelector("p")).toHaveAttribute("data-slot", `card${i + 1}Body`);
    });
    expect(s.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
  });

  it("KD-AC-11 [U]: md 이상 2열 같은 폭(행 늘이기 = grid 기본 stretch) · md 미만 1열(.kit-cards 기본) · 재배치 0", () => {
    const block = cssSection("/* services/cards-2");
    expect(block).toMatch(/@media \(width >= 48rem\) \{\s*\.kit-cards--2 \{\s*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
    expect(block).not.toMatch(/\border\s*:|-reverse|grid-area|grid-row|align-items/);
  });

  it("KD-AC-03 · KD-AC-04 [U]: 상한 글자 그대로 · 소개·card2Body 빈 값 → 요소 0 · 카드 제목 빈 값 → 카드 남고 h3 0 · 빈 p·h 0", () => {
    const texts = { heading: "가".repeat(40), intro: "나".repeat(160), card1Title: "다".repeat(30), card1Body: "라".repeat(120), card2Title: "마".repeat(30), card2Body: "바".repeat(120) };
    const full = services(drawDoc(cardsDoc("cards-2", texts)), "cards-2");
    for (const [key, text] of Object.entries(texts)) expect(full.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
    const s = services(drawDoc(cardsDoc("cards-2", { intro: "", card2Body: " ", card1Title: "" })), "cards-2");
    expect(s.querySelector('[data-slot="intro"]')).toBeNull();
    const cards = [...s.querySelectorAll("li")];
    expect(cards).toHaveLength(2);
    expect(cards[0]!.querySelector("h3")).toBeNull();
    expect(cards[1]!.querySelector("p")).toBeNull();
    expect([...s.querySelectorAll("p, h2, h3")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });
});
