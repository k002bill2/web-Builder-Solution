import { readFileSync } from "node:fs";
import type { ImageSlotValue, PageDoc } from "../engine/contracts/pageDoc";
import { boundDoc, drawDoc, patch } from "../render/testing/drawKit";
import { serializeSite } from "../render/serializeSite";

/** footer/biz-extended-map (SPEC-BOUND B-9) — [U] KB-AC-23·25 · 구조. 배치(KB-AC-24)는 브라우저. 지도 = 이미지 슬롯 하나 · 외부 요청 0 */
const ID = "22222222-2222-4222-8222-222222222222";
const img = (over: Partial<ImageSlotValue> = {}): ImageSlotValue => ({ kind: "image", enabled: true, source: ID as ImageSlotValue["source"], alt: "매장 위치 지도", decorative: false, ...over });
const doc = () => boundDoc("footer", "biz-extended-map");
const footer = (c: HTMLElement) => c.querySelector<HTMLElement>('[data-section="footer/biz-extended-map"]')!;

describe("footer/biz-extended-map (B-9)", () => {
  it("구조: footer 루트(id) · ink 면 · 위 줄 = 글 칸(사업자정보 address → 하단 링크) + 지도 칸(figure) · 구분선 → 저작권", () => {
    const f = footer(drawDoc(doc()));
    expect(f.tagName).toBe("FOOTER");
    expect(f.id).toBe("s-s-footer");
    expect(f.dataset.surface).toBe("ink");
    expect(f).toHaveClass("kit-footer", "kit-footer--map");
    const top = f.querySelector(".kit-footer-top")!;
    expect([...top.children].map((el) => el.tagName)).toEqual(["DIV", "FIGURE"]);
    expect([...top.firstElementChild!.children].map((el) => el.tagName)).toEqual(["ADDRESS", "UL"]);
    expect(f.querySelector("hr + p")).toHaveTextContent("© 브랜드 이름");
  });

  it("KB-AC-23: 플레이스홀더 → 지도 칸 자체 그래픽(SPEC m2c 4절) aria-hidden · img 0 · iframe·script 0", () => {
    const f = footer(drawDoc(doc()));
    const fig = f.querySelector("figure")!;
    expect(fig.querySelectorAll("img")).toHaveLength(0);
    expect(fig.querySelector('[data-media="art"]')).toHaveAttribute("aria-hidden", "true");
    expect(f.querySelectorAll("iframe, script")).toHaveLength(0);
  });

  it("KB-AC-23: 사용자 이미지 → 렌더 문서 img[src] = blob:만 · lazy · alt = 슬롯 대체텍스트(장식이면 '') · 정적 HTML 직렬화 = data:만 · http(s) 0", async () => {
    const d: PageDoc = patch(doc(), "s-footer", { map: img() });
    const container = drawDoc(d, { [ID]: "blob:null/map" });
    const map = footer(container).querySelector("figure img")!;
    expect(map.getAttribute("src")).toBe("blob:null/map");
    expect(map).toHaveAttribute("loading", "lazy");
    expect(map).toHaveAttribute("alt", "매장 위치 지도");
    expect(map).toHaveAttribute("width", "4");
    expect(map).toHaveAttribute("height", "3");
    const html = (await serializeSite(container, async () => "data:image/png;base64,AAAA"))!;
    const out = new DOMParser().parseFromString(html, "text/html");
    const srcs = [...out.querySelectorAll('[data-section="footer/biz-extended-map"] img')].map((el) => el.getAttribute("src"));
    expect(srcs).toEqual(["data:image/png;base64,AAAA"]);
    expect(html).not.toMatch(/https?:\/\//);
    const deco = footer(drawDoc(patch(doc(), "s-footer", { map: img({ decorative: true }) }), { [ID]: "blob:null/map" }));
    expect(deco.querySelector("img")).toHaveAttribute("alt", "");
  });

  it("KB-AC-25: map 꺼짐 → figure 0 · 위 줄 = biz-extended와 같은 2단(사업자정보 · 링크가 위 줄 직계 형제)", () => {
    const off = footer(drawDoc(patch(doc(), "s-footer", { map: { ...img(), enabled: false } })));
    expect(off.querySelectorAll("figure")).toHaveLength(0);
    expect([...off.querySelector(".kit-footer-top")!.children].map((el) => el.tagName)).toEqual(["ADDRESS", "UL"]);
    expect(off).not.toHaveClass("kit-footer--map");
  });

  it("빈 슬롯: links 빈 값 → 글 칸에 사업자정보만 · copyright 빈 값 → 구분선·저작권 0", () => {
    const f = footer(drawDoc(patch(doc(), "s-footer", { links: "", copyright: " " })));
    expect([...f.querySelector(".kit-footer-top > div")!.children].map((el) => el.tagName)).toEqual(["ADDRESS"]);
    expect(f.querySelectorAll("hr, p")).toHaveLength(0);
  });

  it("KB-AC-30 [G]: 파일·지도 CSS에 iframe·외부 URL 0", () => {
    expect(readFileSync("src/kit/FooterBizExtendedMap.tsx", "utf8")).not.toMatch(/iframe|https?:\/\//);
  });
});
