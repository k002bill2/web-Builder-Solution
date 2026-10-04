import { readFileSync } from "node:fs";
import { boundDoc, drawDoc, patch } from "../render/testing/drawKit";

/** footer/minimal-biz (SPEC-BOUND B-11) — [U] KB-AC-28 · 구조 · [G] 사업자정보 ink. minimal과 계산 스타일 같음(KB-AC-29)은 브라우저 */
const doc = () => boundDoc("footer", "minimal-biz");
const footer = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="footer/minimal-biz"]')!;
const css = readFileSync("src/kit/kit.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("footer/minimal-biz (B-11)", () => {
  it("KB-AC-28: address 1 · 저작권 요소 0 · 면 표시 bg · minimal과 같은 루트 클래스(같은 면·위 경계 규칙)", () => {
    const f = footer(drawDoc(doc()));
    expect(f.tagName).toBe("FOOTER");
    expect(f.id).toBe("s-s-footer");
    expect(f.dataset.surface).toBe("bg");
    const minimal = drawDoc(boundDoc("footer", "minimal")).querySelector('[data-section="footer/minimal"]')!;
    expect(f.className).toBe(minimal.className);
    expect(f.firstElementChild!.className).toBe(minimal.firstElementChild!.className);
    expect(f.querySelectorAll("address")).toHaveLength(1);
    expect(f.querySelector("address")).toHaveTextContent("상호 · 사업자등록번호");
    expect(f.querySelectorAll('[data-slot="copyright"], hr')).toHaveLength(0);
    expect([...f.firstElementChild!.children].map((el) => el.tagName)).toEqual(["ADDRESS", "UL"]);
  });

  it("KB-AC-28 [G]: 사업자정보 글자 ink(muted로 낮추지 않음) · 줄바꿈 기본(pre-line 안 씀)", () => {
    const rule = css.match(/\n\s*\.kit-footer-min \.kit-footer-info\s*\{([^}]*)\}/)?.[1] ?? "";
    expect(rule).toMatch(/color:\s*var\(--site-ink\)/);
    expect(rule).toMatch(/white-space:\s*normal/);
  });

  it("빈 슬롯: links 빈 값 → 사업자정보만 · businessInfo 빈 값 → address 0 · footer 면 남음", () => {
    expect([...footer(drawDoc(patch(doc(), "s-footer", { links: "" }))).querySelectorAll("address, ul")].map((el) => el.tagName)).toEqual(["ADDRESS"]);
    const noInfo = footer(drawDoc(patch(doc(), "s-footer", { businessInfo: "  " })));
    expect(noInfo.querySelectorAll("address")).toHaveLength(0);
    expect(noInfo.id).toBe("s-s-footer");
  });
});
