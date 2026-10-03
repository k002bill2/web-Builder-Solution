import { sampleDoc } from "../engine/testing/sampleDoc";
import { drawDoc, patch, without } from "../render/testing/drawKit";

/** header/sticky-right-cta (M2A-2a K5 · m2a K1-1) — [U] 마크업. 폭 전환·popover 동작은 K9 브라우저 */
const header = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="header/sticky-right-cta"]')!;

describe("header/sticky-right-cta (K1-1)", () => {
  it("구조: header 루트(id s-…) · 브랜드 p · 바 nav '주 메뉴' + 시트 nav '주 메뉴'(두 벌) · '메뉴' 버튼 popovertarget = 시트 · 시트 '닫기' hide", () => {
    const h = header(drawDoc());
    expect(h.tagName).toBe("HEADER");
    expect(h.id).toBe("s-s-header");
    expect(h.querySelector('p[data-slot="brand"]')).toHaveTextContent("브랜드 이름");
    const navs = h.querySelectorAll('nav[aria-label="주 메뉴"]');
    expect(navs).toHaveLength(2);
    const sheet = h.querySelector<HTMLElement>("[popover]")!;
    expect(sheet.id).toBe("m-s-header");
    expect(sheet.contains(navs[1]!)).toBe(true);
    expect(sheet.contains(navs[0]!)).toBe(false);
    const open = [...h.querySelectorAll("button")].find((b) => b.textContent === "메뉴")!;
    expect(open).toHaveAttribute("type", "button");
    expect(open).toHaveAttribute("popovertarget", "m-s-header");
    expect(sheet.contains(open)).toBe(false);
    const close = [...sheet.querySelectorAll("button")].find((b) => b.textContent === "닫기")!;
    expect(close).toHaveAttribute("popovertarget", "m-s-header");
    expect(close).toHaveAttribute("popovertargetaction", "hide");
    // 시트 순서: 닫기 → 메뉴 → CTA(맨 아래)
    expect([...sheet.querySelectorAll("button, nav, [data-cta]")].map((el) => el.tagName === "NAV" ? "nav" : el.textContent)).toEqual(["닫기", "nav", "문의하기"]);
  });

  it("K-AC-14: nav ' 소개 ·· 서비스 · ' → 항목 2개 — 본문 섹션 제목과 같은 항목만 a(앵커), 나머지 span", () => {
    const c = drawDoc(patch(sampleDoc(), "s-header", { nav: " 소개 ·· 서비스 · 회사 " }));
    const items = [...header(c).querySelectorAll('nav:not([popover] nav) li')];
    expect(items.map((li) => li.textContent)).toEqual(["소개", "서비스", "회사"]);
    expect(items.map((li) => li.firstElementChild!.tagName)).toEqual(["A", "A", "SPAN"]);
    expect(items[0]!.firstElementChild).toHaveAttribute("href", "#s-s-about");
    expect(items[1]!.firstElementChild).toHaveAttribute("href", "#s-s-services");
    expect(header(c).querySelectorAll("[popover] nav li")).toHaveLength(3);
  });

  it("K-AC-13: CTA = 바(md 이상) + 시트 맨 아래(md 미만) — href = 첫 contact 앵커 → 없으면 footer → 둘 다 없으면 링크 아닌 글자", () => {
    const ctas = (c: HTMLElement) => [...header(c).querySelectorAll<HTMLElement>("[data-cta]")];
    const c = drawDoc();
    expect(ctas(c).map((el) => [el.dataset.cta, el.tagName, el.getAttribute("href")])).toEqual([
      ["bar", "A", "#s-s-contact"],
      ["sheet", "A", "#s-s-contact"],
    ]);
    expect(ctas(drawDoc(without(sampleDoc(), "contact"))).map((el) => el.getAttribute("href"))).toEqual(["#s-s-footer", "#s-s-footer"]);
    const none = drawDoc(without(without(sampleDoc(), "contact"), "footer"));
    expect(ctas(none).map((el) => el.tagName)).toEqual(["SPAN", "SPAN"]);
  });

  it("0.8 빈 슬롯: nav 빈 값 → nav·'메뉴' 버튼·시트 0, CTA는 바에 늘 보임 · cta 빈 값 → CTA 0", () => {
    const noNav = header(drawDoc(patch(sampleDoc(), "s-header", { nav: " · " })));
    expect(noNav.querySelectorAll("nav, [popover], button")).toHaveLength(0);
    expect(noNav.querySelector('[data-cta="bar"]')).toHaveAttribute("data-always", "");
    const noCta = header(drawDoc(patch(sampleDoc(), "s-header", { cta: "  " })));
    expect(noCta.querySelectorAll("[data-cta]")).toHaveLength(0);
    expect(noCta.querySelectorAll("nav")).toHaveLength(2);
  });

  it("K-AC-03 상한 글자: brand 24 · nav 80 · cta 16자가 잘리지 않고 그대로 · 링크에 '#'·빈 href 0", () => {
    const brand = "가".repeat(24);
    const nav = Array.from({ length: 8 }, (_, i) => `메뉴${i}항목`).join(" · ").slice(0, 80);
    const cta = "나".repeat(16);
    const h = header(drawDoc(patch(sampleDoc(), "s-header", { brand, nav, cta })));
    expect(h.querySelector('[data-slot="brand"]')!.textContent).toBe(brand);
    expect(h.querySelector('[data-cta="bar"]')!.textContent).toBe(cta);
    expect(h.querySelectorAll('a[href="#"], a[href=""], a:not([href])')).toHaveLength(0);
  });
});
