import { sampleDoc } from "../engine/testing/sampleDoc";
import { drawDoc, patch } from "../render/testing/drawKit";

/** footer/biz-extended (M2A-2a K7 · m2a K1-7) */
const footer = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="footer/biz-extended"]')!;

describe("footer/biz-extended (K1-7)", () => {
  it("K-AC-31: footer 루트 · 면 ink(data-surface) · address 1(사업자정보) · 하단 링크 = li 글자(a 0) · 저작권 p", () => {
    const f = footer(drawDoc(patch(sampleDoc(), "s-footer", { links: " 이용약관 ·· 개인정보처리방침 " })));
    expect(f.tagName).toBe("FOOTER");
    expect(f.id).toBe("s-s-footer");
    expect(f).toHaveAttribute("data-surface", "ink");
    expect(f.querySelectorAll("address")).toHaveLength(1);
    expect(f.querySelector("address")).toHaveAttribute("data-slot", "businessInfo");
    expect([...f.querySelectorAll('ul[data-slot="links"] > li')].map((li) => li.textContent)).toEqual(["이용약관", "개인정보처리방침"]);
    expect(f.querySelectorAll("a")).toHaveLength(0);
    expect(f.querySelector('p[data-slot="copyright"]')).toHaveTextContent("© 브랜드 이름");
    expect(f.querySelectorAll("[data-divider]")).toHaveLength(1);
  });

  it("K-AC-31 · K-AC-04: copyright 빈 값 → 저작권 줄·구분선 0 / links 빈 값 → 목록 0(빈 ul·li 0)", () => {
    const noCopy = footer(drawDoc(patch(sampleDoc(), "s-footer", { copyright: "" })));
    expect(noCopy.querySelectorAll('[data-slot="copyright"], [data-divider]')).toHaveLength(0);
    const noLinks = footer(drawDoc(patch(sampleDoc(), "s-footer", { links: " · " })));
    expect(noLinks.querySelectorAll("ul, li")).toHaveLength(0);
  });

  it("K-AC-03: 사업자정보 200자(줄바꿈 포함) · 링크 80 · 저작권 60자가 그대로", () => {
    const businessInfo = `${"가".repeat(99)}\n${"나".repeat(100)}`;
    const copyright = "다".repeat(60);
    const f = footer(drawDoc(patch(sampleDoc(), "s-footer", { businessInfo, copyright })));
    expect(f.querySelector("address")!.textContent).toBe(businessInfo);
    expect(f.querySelector('[data-slot="copyright"]')!.textContent).toBe(copyright);
  });
});
