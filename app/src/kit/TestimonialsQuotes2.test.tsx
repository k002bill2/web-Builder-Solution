import { readFileSync } from "node:fs";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { drawDoc } from "../render/testing/drawKit";

/** testimonials/quotes-2 (M2B-2c · SPEC-BODY B1-9) — 후기 카드 2개. 2열/1열 실측(KD-AC-17 [B])은 P-B */
const quotesDoc = (slots: Readonly<Record<string, string>> = {}, tone: "base" | "alt" = "base") =>
  withSections(
    sampleDoc(),
    sampleDoc().sections.map((s) => {
      if (s.instanceId !== "s-services") return s;
      const base = section("testimonials", "quotes-2", "s-quotes", { tone });
      return { ...base, slots: { ...base.slots, ...slots } };
    }),
  );
const quotes = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="testimonials/quotes-2"]')!;
const css = () => readFileSync("src/kit/kit.css", "utf8");
const cssSection = (marker: string) => {
  const at = css().indexOf(marker);
  expect(at, marker).toBeGreaterThan(-1);
  return css().slice(at, css().indexOf("\n}\n", at));
};

describe("testimonials/quotes-2 (B1-9)", () => {
  it("KD-AC-17 · KD-AC-08 [U]: 킷 · h2 1 · ul[role=list] > li 2 > figure > blockquote(p) + figcaption · cite 요소·blockquote[cite] 0 · 작성자 글자는 blockquote 밖 · h3 0 · 포커스 0", () => {
    const s = quotes(drawDoc(quotesDoc({ author1: "김고객", author2: "이고객" })));
    expect(s).toHaveAttribute("data-kit");
    expect(s.getAttribute("aria-labelledby")).toBe("h-s-quotes");
    expect(s.querySelector("h2")).toHaveAttribute("id", "h-s-quotes");
    expect(s.querySelectorAll("h2")).toHaveLength(1);
    expect(s.querySelectorAll("h3, cite, blockquote[cite], img, svg")).toHaveLength(0);
    const list = s.querySelector("ul")!;
    expect(list).toHaveAttribute("role", "list");
    const items = [...list.children];
    expect(items).toHaveLength(2);
    items.forEach((li, i) => {
      expect(li.tagName).toBe("LI");
      expect(li).toHaveAttribute("data-surface", "card");
      expect([...li.children].map((el) => el.tagName)).toEqual(["FIGURE"]);
      const figure = li.firstElementChild!;
      expect([...figure.children].map((el) => `${el.tagName}:${el.getAttribute("data-slot") ?? ""}`)).toEqual(["BLOCKQUOTE:", `FIGCAPTION:author${i + 1}`]);
      expect([...figure.querySelector("blockquote")!.children].map((el) => `${el.tagName}:${el.getAttribute("data-slot")}`)).toEqual([`P:quote${i + 1}`]);
      expect(figure.querySelector("blockquote")!.textContent).not.toContain(i ? "이고객" : "김고객");
    });
    expect(s.querySelectorAll("a, button, [tabindex]")).toHaveLength(0);
  });

  it("KD-AC-03 [U]: 후기·작성자 글자 = 슬롯 그대로(상한 200 · 30자 · 줄바꿈 보존)", () => {
    const texts = { heading: "가".repeat(40), quote1: "나".repeat(200), quote2: "첫 줄\n둘째 줄", author1: "w".repeat(30), author2: " 고객 " };
    const s = quotes(drawDoc(quotesDoc(texts)));
    for (const [key, text] of Object.entries(texts)) expect(s.querySelector(`[data-slot="${key}"]`)!.textContent).toBe(text);
  });

  it("KD-AC-17 · KD-AC-04 [U]: quoteN 빈 값 → 그 li 0(남은 카드 순서 유지) · authorN 빈 값 → figcaption 0 · 후기 전부 빈 값 → ul 0 · 빈 p·li·figcaption 0", () => {
    const s = quotes(drawDoc(quotesDoc({ quote1: " ", author2: "" })));
    const items = [...s.querySelectorAll("li")];
    expect(items).toHaveLength(1);
    expect(items[0]!.querySelector("[data-slot]")).toHaveAttribute("data-slot", "quote2");
    expect(s.querySelectorAll("figcaption")).toHaveLength(0);
    expect(s.querySelector('[data-slot="author1"]')).toBeNull();
    const none = quotes(drawDoc(quotesDoc({ quote1: "", quote2: "" })));
    expect(none.querySelectorAll("ul, li, figure")).toHaveLength(0);
    expect(none.querySelector("h2")).not.toBeNull();
    expect([...s.querySelectorAll("p, li, h2, figcaption")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("KD-AC-17 · 05 · 07 [G]: 카드 면 재사용(.kit-card) · md 이상 2열 같은 폭 · figure 세로 flex · 작성자 아래 붙음(margin-top auto) · blockquote 여백 0·기울임 0 · pre-line · 후기 lead(md) · 작성자 제목 굵기 · 글자 ink · muted·primary 0 · 재배치 0", () => {
    const block = cssSection("/* testimonials/quotes-2");
    expect(block).toMatch(/\.kit-quote-figure \{[^}]*display: flex;[^}]*flex-direction: column;[^}]*flex: 1;/);
    expect(block).toMatch(/\.kit-quote-text \{[^}]*margin: 0;[^}]*font-style: normal;[^}]*white-space: pre-line;[^}]*color: var\(--site-ink\);/);
    expect(block).toMatch(/\.kit-quote-author \{[^}]*margin-top: auto;[^}]*font-weight: var\(--site-weight-heading\);[^}]*color: var\(--site-ink\);/);
    expect(block).toMatch(/@media \(width >= 48rem\) \{[^@]*\.kit-quote-text \{\s*font-size: var\(--site-t1\);/);
    expect(block).not.toMatch(/data-layout|\border\s*:|-reverse|grid-area|grid-row|nowrap|text-overflow|--site-muted|--kit-soft|--site-primary|content:/);
  });
});
