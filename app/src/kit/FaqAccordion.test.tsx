import { readFileSync } from "node:fs";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";

/** faq/accordion (M2A-2b B4 · m2a K1-5) — [U] 마크업. Enter/Space 열고 닫기(K-AC-27 [B])는 B10 */
const faq = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="faq/accordion"]')!;

describe("faq/accordion (K1-5)", () => {
  it("K-AC-27 [U]: section aria-labelledby = h2 · details 3개 모두 닫힘(open 0) · name 속성 0 · summary 안 헤딩 0 · 질문·답 data-slot", () => {
    const f = faq(drawDoc());
    expect(f).toHaveAttribute("data-kit");
    expect(f.getAttribute("aria-labelledby")).toBe("h-s-faq");
    expect(f.querySelector("h2")).toHaveAttribute("id", "h-s-faq");
    const items = [...f.querySelectorAll("details")];
    expect(items).toHaveLength(3);
    items.forEach((d, i) => {
      expect(d).not.toHaveAttribute("open");
      expect(d).not.toHaveAttribute("name");
      const summary = d.querySelector(":scope > summary")!;
      expect(summary).toHaveAttribute("data-slot", `q${i + 1}`);
      expect(summary.querySelector("h1, h2, h3, h4, h5, h6")).toBeNull();
      expect(d.querySelector(`[data-slot="a${i + 1}"]`)!.tagName).toBe("P");
    });
    expect(f.querySelectorAll("button, a, [tabindex]")).toHaveLength(0);
  });

  it("K-AC-28: q2 빈 값 → 그 details 0 · a3 빈 값 → summary만 있는 details", () => {
    const f = faq(drawDoc(patch(sampleDoc(), "s-faq", { q2: " ", a3: "" })));
    const items = [...f.querySelectorAll("details")];
    expect(items.map((d) => d.querySelector("summary")!.getAttribute("data-slot"))).toEqual(["q1", "q3"]);
    expect([...items[1]!.children].map((el) => el.tagName)).toEqual(["SUMMARY"]);
    expect([...f.querySelectorAll("p, div")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
  });

  it("K-AC-03: 상한 글자(질문 80 · 답 300, 줄바꿈 포함) 그대로 · 답 글자 = --kit-soft(base muted / alt ink) · 열림 모션 0", () => {
    const [q1, a1] = ["가".repeat(80), `${"나".repeat(150)}\n${"다".repeat(149)}`];
    const f = faq(drawDoc(patch(sampleDoc(), "s-faq", { q1, a1 })));
    expect([f.querySelector('[data-slot="q1"]')!.textContent, f.querySelector('[data-slot="a1"]')!.textContent]).toEqual([q1, a1]);
    const css = readFileSync("src/kit/kit.css", "utf8");
    expect(css).toMatch(/\.kit-faq-answer \{[^}]*color: var\(--kit-soft\)/);
    expect(css).not.toMatch(/details-content|interpolate-size/);
  });
});
