// 킷 3변형 + 폴백이 섞인 문서의 공통 K-AC (M2A-2a K8 · m2a 4.1) — 브라우저 판정([B])은 K9
import { readFileSync } from "node:fs";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";

const site = () => drawDoc().querySelector<HTMLElement>("[data-site-root]")!;

describe("공통 K-AC — 3변형 + 폴백 혼합 문서", () => {
  it("K-AC-09: header(1) · main(1) · footer(1) 형제, hero·폴백 섹션은 main 안 · h1 = 1(hero) · 헤딩 건너뛰기 0", () => {
    const s = site();
    expect([...s.children].map((el) => el.tagName)).toEqual(["HEADER", "MAIN", "FOOTER"]);
    expect(s.querySelectorAll(":scope > header, :scope > main, :scope > footer")).toHaveLength(3);
    expect(s.querySelector("main")!.querySelectorAll("header, footer, nav")).toHaveLength(0);
    expect(s.querySelectorAll("h1")).toHaveLength(1);
    expect(s.querySelector("main h1")).not.toBeNull();
    // 카드 제목 h3는 h2 섹션(services) 안에서만 — 건너뛰기 0 (M2A-2b: 카드 h3 생김)
    for (const h3 of s.querySelectorAll("h3")) expect(h3.closest("section")!.querySelector("h2")).not.toBeNull();
    expect(s.querySelectorAll("h4, h5, h6")).toHaveLength(0);
  });

  it("K-AC-05: a[href='#'] · 빈 href · href 없음 · javascript: 0 · 모든 #s- 앵커의 대상 id가 문서 안에 있다", () => {
    const s = site();
    expect(s.querySelectorAll('a[href="#"], a[href=""], a:not([href]), a[href^="javascript:"]')).toHaveLength(0);
    const anchors = [...s.querySelectorAll<HTMLAnchorElement>('a[href^="#s-"]')];
    expect(anchors.length).toBeGreaterThan(0);
    for (const a of anchors) expect(s.querySelector(`#${CSS.escape(a.getAttribute("href")!.slice(1))}`)).not.toBeNull();
  });

  it("K-AC-16: 폴백 섹션마다 표식 1개 '구조 미리보기' · 킷 섹션 0 · 표식은 자기 고정 색 면", () => {
    const s = site();
    const fallbacks = [...s.querySelectorAll('[data-fallback="true"]')];
    expect(fallbacks).toHaveLength(3);
    expect(s.querySelectorAll('[data-kit-marker="fallback"]')).toHaveLength(3);
    for (const kit of s.querySelectorAll("[data-kit]")) expect(kit.querySelector("[data-kit-marker]")).toBeNull();
    expect(s.querySelectorAll("[data-kit]")).toHaveLength(5);
  });

  it("K-AC-03 · K-AC-04: 3변형 상한 글자 그대로 · 선택 슬롯 빈 값(hero subtitle · footer links·copyright) → 빈 p·li·ul 0", () => {
    let doc = patch(sampleDoc(), "s-header", { brand: "가".repeat(24), cta: "나".repeat(16) });
    doc = patch(doc, "s-hero", { title: "다".repeat(40), subtitle: "" });
    doc = patch(doc, "s-footer", { businessInfo: "라".repeat(200), links: "", copyright: "" });
    const s = drawDoc(doc).querySelector("[data-site-root]")!;
    for (const text of ["가".repeat(24), "나".repeat(16), "다".repeat(40), "라".repeat(200)]) expect(s.textContent).toContain(text);
    const kit = [...s.querySelectorAll("[data-kit]")];
    for (const root of kit) {
      expect([...root.querySelectorAll("p, li, h1, address, a, span")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
      expect([...root.querySelectorAll("ul")].filter((ul) => ul.children.length === 0)).toHaveLength(0);
    }
  });

  it("K-AC-11·36 [U 정적]: 킷 CSS 글자색은 ink·bg·on-primary·primary + 보조 글자 --kit-soft만 · muted 직접 글자 0 · 불투명도 0 (조합 실측은 브라우저)", () => {
    const css = readFileSync("src/kit/kit.css", "utf8");
    const colors = [...css.matchAll(/(?:^|[;\s{])color:\s*([^;]+);/g)].map(([, v]) => v!.trim());
    expect(new Set(colors)).toEqual(new Set(["var(--site-ink)", "var(--site-bg)", "var(--site-on-primary)", "var(--site-primary)", "var(--kit-soft)"]));
    expect(css).not.toMatch(/opacity|color:\s*var\(--site-muted\)/);
    // --kit-soft = muted는 base 톤(bg 면, C-5)에서만 · alt 톤(surface 면)은 ink (M2A-2b 본문 4변형)
    expect([...css.matchAll(/--kit-soft:\s*([^;]+);/g)].map(([, v]) => v)).toEqual(["var(--site-muted)", "var(--site-ink)"]);
    expect(css).toMatch(/\.kit-body \{[^}]*--kit-soft: var\(--site-muted\)/);
    expect(css).toMatch(/\.kit-body\[data-tone="alt"\] \{[^}]*--kit-soft: var\(--site-ink\)/);
  });
});
