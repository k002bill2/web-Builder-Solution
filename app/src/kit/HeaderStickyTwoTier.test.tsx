import { readFileSync } from "node:fs";
import { boundDoc, drawDoc, patch } from "../render/testing/drawKit";

/** header/sticky-two-tier (SPEC-BOUND B-2) — [U] 마크업 · KB-AC-05 · D-3 선택자. 폭별 보임(KB-AC-04)·앵커 이동(KB-AC-06)은 브라우저 */
const doc = () => boundDoc("header", "sticky-two-tier");
const header = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="header/sticky-two-tier"]')!;
const utilities = (h: HTMLElement) => [...h.querySelectorAll<HTMLElement>('ul[data-slot="utility"]')];

describe("header/sticky-two-tier (B-2)", () => {
  it("구조: 보조 줄(div, 랜드마크 아님) → 바(브랜드 · 바 nav · '메뉴' 버튼) → 시트(닫기 · nav → 구분선 → 보조 목록) · nav '주 메뉴' 두 벌 · 보조 목록 두 벌", () => {
    const h = header(drawDoc(doc()));
    expect(h.tagName).toBe("HEADER");
    expect(h).toHaveClass("kit-header", "kit-header--two-tier");
    expect([...h.children].map((el) => el.className)).toEqual(["kit-tier", "kit-bar", "kit-sheet"]);
    const tier = h.querySelector(".kit-tier")!;
    expect(tier.tagName).toBe("DIV");
    expect(tier.querySelectorAll("nav")).toHaveLength(0);
    expect(tier.hasAttribute("data-always")).toBe(false);
    const bar = h.querySelector(".kit-bar")!;
    expect(bar.querySelector('nav[aria-label="주 메뉴"]')).not.toBeNull();
    expect(bar.querySelector("button")).toHaveAttribute("popovertarget", "m-s-header");
    const sheet = h.querySelector<HTMLElement>("[popover]")!;
    expect([...sheet.children].map((el) => el.tagName)).toEqual(["BUTTON", "NAV", "HR", "UL"]);
    expect(h.querySelectorAll('nav[aria-label="주 메뉴"]')).toHaveLength(2);
    expect(utilities(h)).toHaveLength(2);
    expect(utilities(h).every((ul) => ul.closest("nav") === null)).toBe(true);
  });

  it("KB-AC-05: utility 기본 '로그인 · 고객센터'(대상 섹션 없음) → 목록마다 li > span 2 · a 0", () => {
    const h = header(drawDoc(doc()));
    for (const ul of utilities(h)) {
      expect(ul.querySelectorAll("li > span")).toHaveLength(2);
      expect(ul.querySelectorAll("a")).toHaveLength(0);
      expect([...ul.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["로그인", "고객센터"]);
    }
  });

  it("KB-AC-05: utility 빈 값 → 보조 목록 ul 0(두 벌) · 보조 줄 0 · 시트 구분선 0", () => {
    const h = header(drawDoc(patch(doc(), "s-header", { utility: " · " })));
    expect(utilities(h)).toHaveLength(0);
    expect(h.querySelectorAll(".kit-tier, hr")).toHaveLength(0);
    expect(h.querySelectorAll('nav[aria-label="주 메뉴"]')).toHaveLength(2);
  });

  it("0.10: 보조 항목이 본문 섹션 제목과 같으면 앵커(시트 안 a[href^='#'] — r4.12 스크립트 대상)", () => {
    const titled = drawDoc(doc()).querySelector('[data-section="faq/accordion"] h2')!.textContent!;
    const h = header(drawDoc(patch(doc(), "s-header", { utility: `${titled} · 로그인` })));
    expect(utilities(h).map((ul) => [...ul.querySelectorAll("li")].map((li) => li.firstElementChild!.tagName))).toEqual([["A", "SPAN"], ["A", "SPAN"]]);
    expect(utilities(h).map((ul) => ul.querySelector("a")!.getAttribute("href"))).toEqual(["#s-s-faq", "#s-s-faq"]);
  });

  it("nav 빈 값 → 주 메뉴·버튼·시트 0 · utility 있으면 보조 줄이 모든 폭에서 보임(data-always)", () => {
    const h = header(drawDoc(patch(doc(), "s-header", { nav: "  " })));
    expect(h.querySelectorAll("nav, button, [popover]")).toHaveLength(0);
    expect(h.querySelector(".kit-tier")).toHaveAttribute("data-always", "");
    expect(utilities(h)).toHaveLength(1);
  });

  it("D-3 (MQ-B5): kit.css 문서 수준 1줄 — 선택자 = data-site-root · 변형 클래스 · data-kit(정적 HTML 보존)만 · 마크업이 header를 사이트 루트 바로 아래에 둔다", () => {
    const css = readFileSync("src/kit/kit.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const rule = css.match(/([^{}\n]*:has\([^{}\n]*)\{([^}]*)\}/)!;
    expect(rule[1]!.trim()).toBe("[data-site-root]:has(> .kit-header--two-tier) [data-kit]");
    expect(rule[2]).toMatch(/scroll-margin-top:\s*calc\(var\(--site-header-offset\) \+ var\(--site-hit-min\)\)/);
    expect(css.match(/:has\(/g)).toHaveLength(1);
    const site = drawDoc(doc()).querySelector("[data-site-root]")!;
    expect(site.querySelector(":scope > .kit-header--two-tier")).not.toBeNull();
  });
});
