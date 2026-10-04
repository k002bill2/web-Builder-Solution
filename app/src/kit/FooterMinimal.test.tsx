import { readFileSync } from "node:fs";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { boundDoc, drawDoc, patch, without } from "../render/testing/drawKit";

/** footer/minimal (SPEC-BOUND B-10) — [U] KB-AC-27 · 구조 · [G] KB-AC-26 면·글자 규칙. 계산 색은 브라우저(KB-AC-26 [B]) */
const doc = (base = sampleDoc()) => boundDoc("footer", "minimal", base);
const footer = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="footer/minimal"]')!;
const css = readFileSync("src/kit/kit.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const rule = (selector: string) => css.match(new RegExp(`(?:^|\\n)\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`))?.[1] ?? "";

describe("footer/minimal (B-10)", () => {
  it("구조: footer 루트(id) · bg 면 표시 · 한 줄 래퍼 = 저작권 p → 하단 링크 ul(DOM = 보이는 순서) · 링크 = 글자 항목", () => {
    const f = footer(drawDoc(doc()));
    expect(f.tagName).toBe("FOOTER");
    expect(f.id).toBe("s-s-footer");
    expect(f.dataset.surface).toBe("bg");
    expect(f).toHaveClass("kit-body", "kit-footer-min");
    expect(f.hasAttribute("data-tone")).toBe(false);
    expect(f).not.toHaveClass("kit-footer");
    const line = f.firstElementChild!;
    expect([...line.children].map((el) => el.tagName)).toEqual(["P", "UL"]);
    expect(line.firstElementChild).toHaveTextContent("© 브랜드 이름");
    expect([...f.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["이용약관", "개인정보처리방침"]);
    expect(f.querySelectorAll("a, address")).toHaveLength(0);
  });

  it("KB-AC-26 [G]: 면 bg(.kit-body 톤 없음) + 위 구분선 muted · 링크 글자 ink · 저작권 muted(--kit-soft) · 포커스 링 ink — ink 면 0", () => {
    expect(rule(".kit-body")).toMatch(/background:\s*var\(--site-bg\)/);
    expect(rule(".kit-body")).toMatch(/--kit-soft:\s*var\(--site-muted\)/);
    expect(rule(".kit-footer-min")).toMatch(/border-top:\s*var\(--site-stroke-1\) solid var\(--site-muted\)/);
    expect(rule(".kit-footer-min")).toMatch(/--kit-ring:\s*var\(--site-ink\)/);
    expect(rule(".kit-footer-min")).not.toMatch(/background:\s*var\(--site-ink\)/);
    expect(rule(".kit-footer-min .kit-footer-links")).toMatch(/color:\s*var\(--site-ink\)/);
    expect(rule(".kit-footer-min .kit-footer-copy")).toMatch(/color:\s*var\(--kit-soft\)/);
  });

  it("빈 슬롯: links 빈 값 → 저작권만 · copyright 빈 값 → 링크만", () => {
    expect([...footer(drawDoc(patch(doc(), "s-footer", { links: " · " }))).querySelectorAll("p, ul")].map((el) => el.tagName)).toEqual(["P"]);
    expect([...footer(drawDoc(patch(doc(), "s-footer", { copyright: "" }))).querySelectorAll("p, ul")].map((el) => el.tagName)).toEqual(["UL"]);
  });

  it("KB-AC-27: links·copyright 둘 다 빈 값 → footer#s-s-footer 1 · 자식 글자 요소 0 · CTA 폴백 href(#s-s-footer)의 대상 존재", () => {
    const c = drawDoc(patch(doc(without(sampleDoc(), "contact")), "s-footer", { links: "", copyright: "" }));
    expect(c.querySelectorAll("footer#s-s-footer")).toHaveLength(1);
    expect(footer(c).querySelectorAll("p, ul, li, address, span, a")).toHaveLength(0);
    expect(footer(c).textContent).toBe("");
    const cta = c.querySelector('[data-cta="bar"]')!;
    expect(cta).toHaveAttribute("href", "#s-s-footer");
    expect(c.querySelector(cta.getAttribute("href")!)).toBe(footer(c));
  });
});
