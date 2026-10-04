import { boundDoc, drawDoc, patch } from "../render/testing/drawKit";

/** header/sticky-hamburger (SPEC-BOUND B-1) — [U] 마크업 · KB-AC-03. 폭별 버튼·시트 판 위치(KB-AC-01·02)는 브라우저 */
const doc = () => boundDoc("header", "sticky-hamburger");
const header = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="header/sticky-hamburger"]')!;

describe("header/sticky-hamburger (B-1)", () => {
  it("구조: header 루트(id s-…) · 변형 클래스 · 바 = 브랜드 + '메뉴' 버튼만(바 안 nav 0) · 메뉴 한 벌 = 시트 안 nav '주 메뉴' · '닫기' hide", () => {
    const h = header(drawDoc(doc()));
    expect(h.tagName).toBe("HEADER");
    expect(h.id).toBe("s-s-header");
    expect(h).toHaveClass("kit-header", "kit-header--burger");
    const bar = h.querySelector(".kit-bar")!;
    expect([...bar.children].map((el) => el.textContent)).toEqual(["브랜드 이름", "메뉴"]);
    expect(bar.querySelectorAll("nav")).toHaveLength(0);
    const sheet = h.querySelector<HTMLElement>("[popover]")!;
    expect(sheet.id).toBe("m-s-header");
    expect(bar.querySelector("button")).toHaveAttribute("popovertarget", "m-s-header");
    const navs = h.querySelectorAll('nav[aria-label="주 메뉴"]');
    expect(navs).toHaveLength(1);
    expect(sheet.contains(navs[0]!)).toBe(true);
    const close = sheet.querySelector("button")!;
    expect(close).toHaveTextContent("닫기");
    expect(close).toHaveAttribute("popovertargetaction", "hide");
    expect(h.querySelectorAll("[data-cta]")).toHaveLength(0);
  });

  it("0.10 메뉴 항목: 본문 섹션 제목과 같은 항목만 앵커(시트 안 a[href^='#'] — r4.12 스크립트 대상), 나머지 글자", () => {
    const h = header(drawDoc(patch(doc(), "s-header", { nav: "소개 · 회사" })));
    const items = [...h.querySelectorAll("[popover] nav li")];
    expect(items.map((li) => li.firstElementChild!.tagName)).toEqual(["A", "SPAN"]);
    expect(items[0]!.firstElementChild).toHaveAttribute("href", "#s-s-about");
  });

  it("KB-AC-03: nav 빈 값 → button[popovertarget] 0 · [popover] 0 · nav 0 · 바에 브랜드만", () => {
    const h = header(drawDoc(patch(doc(), "s-header", { nav: " · " })));
    expect(h.querySelectorAll("button[popovertarget]")).toHaveLength(0);
    expect(h.querySelectorAll("[popover]")).toHaveLength(0);
    expect(h.querySelectorAll("nav")).toHaveLength(0);
    expect(h.querySelector(".kit-bar")!.textContent).toBe("브랜드 이름");
  });

  it("0.8 brand 빈 값 → 브랜드 p 0 · 버튼은 그대로", () => {
    const h = header(drawDoc(patch(doc(), "s-header", { brand: "  " })));
    expect(h.querySelectorAll("p")).toHaveLength(0);
    expect(h.querySelector(".kit-bar button")).toHaveTextContent("메뉴");
  });
});
