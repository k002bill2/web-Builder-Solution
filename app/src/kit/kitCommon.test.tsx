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
    expect(fallbacks).toHaveLength(1);
    expect(s.querySelectorAll('[data-kit-marker="fallback"]')).toHaveLength(1);
    for (const kit of s.querySelectorAll("[data-kit]")) expect(kit.querySelector("[data-kit-marker]")).toBeNull();
    expect(s.querySelectorAll("[data-kit]")).toHaveLength(7);
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

describe("공통 K-AC — 7변형 문서 (M2A-2b B9 · 본문 4변형 포함)", () => {
  const MAX = {
    "s-header": { brand: "가".repeat(24), nav: "나".repeat(80), cta: "다".repeat(16) },
    "s-hero": { title: "라".repeat(40), subtitle: "마".repeat(120), cta: "바".repeat(16) },
    "s-about": { heading: "사".repeat(40), body: "아".repeat(400) },
    "s-services": { heading: "자".repeat(40), intro: "차".repeat(160), card1Title: "카".repeat(30), card1Body: "타".repeat(120), card2Title: "파".repeat(30), card2Body: "하".repeat(120), card3Title: "거".repeat(30), card3Body: "너".repeat(120) },
    "s-faq": { heading: "더".repeat(40), q1: "러".repeat(80), a1: "머".repeat(300), q2: "버".repeat(80), a2: "서".repeat(300), q3: "어".repeat(80), a3: "저".repeat(300) },
    "s-contact": { heading: "처".repeat(40), intro: "커".repeat(160), submit: "터".repeat(16), consent: "퍼".repeat(100) },
    "s-footer": { businessInfo: "허".repeat(200), links: "고".repeat(80), copyright: "노".repeat(60) },
  } as const;

  it("K-AC-03: 7변형 모든 글자 슬롯을 상한으로 채우면 각 data-slot textContent = 입력 그대로", () => {
    let doc = sampleDoc();
    for (const [id, slots] of Object.entries(MAX)) doc = patch(doc, id, slots);
    const s = drawDoc(doc).querySelector("[data-site-root]")!;
    for (const [id, slots] of Object.entries(MAX)) {
      const root = s.querySelector(`[data-instance-id="${id}"]`)!;
      expect(root, id).toHaveAttribute("data-kit");
      for (const [key, text] of Object.entries(slots)) {
        if (key === "nav") continue; // 메뉴는 · 나누기 항목(K-AC-14) — 조각 하나 = 원문
        const els = [...root.querySelectorAll(`[data-slot="${key}"]`)];
        expect(els.length, `${id}.${key}`).toBeGreaterThan(0);
        for (const el of els) expect(el.textContent, `${id}.${key}`).toBe(text);
      }
    }
    expect(s.querySelector('[data-slot="nav"]')!.textContent).toBe(MAX["s-header"].nav);
  });

  it("K-AC-04: 선택 슬롯 빈 값(hero subtitle · about image 끔 · services intro·card2Body · contact intro · footer links·copyright) → 해당 요소 0 · 빈 p·li·ul 0", () => {
    let doc = patch(sampleDoc(), "s-hero", { subtitle: "" });
    doc = patch(doc, "s-about", { image: { kind: "image", enabled: false, source: "placeholder", alt: "", decorative: false } });
    doc = patch(doc, "s-services", { intro: "", card2Body: "" });
    doc = patch(doc, "s-contact", { intro: "" });
    doc = patch(doc, "s-footer", { links: "", copyright: "" });
    const s = drawDoc(doc).querySelector("[data-site-root]")!;
    const at = (id: string) => s.querySelector(`[data-instance-id="${id}"]`)!;
    expect(at("s-hero").querySelector('[data-slot="subtitle"]')).toBeNull();
    expect(at("s-about").querySelectorAll("figure, [data-media], img")).toHaveLength(0);
    expect(at("s-services").querySelector('[data-slot="intro"], [data-slot="card2Body"]')).toBeNull();
    expect(at("s-contact").querySelector('[data-slot="intro"]')).toBeNull();
    expect(at("s-footer").querySelectorAll('[data-slot="links"], [data-slot="copyright"], hr')).toHaveLength(0);
    for (const root of s.querySelectorAll("[data-kit]")) {
      expect([...root.querySelectorAll("p, li, h1, h2, h3, address, a, span, summary, label")].filter((el) => el.textContent!.trim() === "")).toHaveLength(0);
      expect([...root.querySelectorAll("ul")].filter((ul) => ul.children.length === 0)).toHaveLength(0);
    }
  });

  it("K-AC-05: 7변형 문서 — 빈·# 링크 0 · CTA·메뉴 앵커 대상이 문서 안(contact 킷 섹션 id)", () => {
    const s = site();
    expect(s.querySelectorAll('a[href="#"], a[href=""], a:not([href]), a[href^="javascript:"]')).toHaveLength(0);
    expect(s.querySelector('[data-section="contact/form"]')).toHaveAttribute("id", "s-s-contact");
    for (const a of s.querySelectorAll('a[href^="#s-"]')) expect(s.querySelector(`#${CSS.escape(a.getAttribute("href")!.slice(1))}`)).not.toBeNull();
    expect([...s.querySelectorAll("a[data-slot=cta]")].every((a) => a.getAttribute("href") === "#s-s-contact")).toBe(true);
  });

  it("K-AC-09: 섹션 루트 = section aria-labelledby(본문·hero) · 본문 4변형 h2 각 1 · h1 1 · 랜드마크 header·main·footer 1씩 · main 안 form 1(contact)", () => {
    const s = site();
    for (const type of ["about/story", "services/cards-3", "faq/accordion", "contact/form"]) {
      const root = s.querySelector(`[data-section="${type}"]`)!;
      expect(root.tagName, type).toBe("SECTION");
      expect(root.querySelectorAll("h2"), type).toHaveLength(1);
      expect(root.getAttribute("aria-labelledby"), type).toBe(root.querySelector("h2")!.id);
      expect(root.closest("main"), type).not.toBeNull();
    }
    expect(s.querySelectorAll("h1")).toHaveLength(1);
    expect(s.querySelectorAll("header")).toHaveLength(1);
    expect(s.querySelectorAll("main")).toHaveLength(1);
    expect(s.querySelectorAll("footer")).toHaveLength(1);
    expect(s.querySelectorAll("main form")).toHaveLength(1);
  });
});

