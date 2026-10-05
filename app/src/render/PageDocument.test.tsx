import { render } from "@testing-library/react";
import type { SectionInstance } from "../engine/contracts/pageDoc";
import { sampleDoc } from "../engine/testing/sampleDoc";
import type { KitSectionProps } from "../kit/types";
import { KIT_REGISTRY, kitFor } from "../kit/registry";
import { PageDocument } from "./PageDocument";
import { SAMPLE_KIT_TOKENS } from "./testing/sampleKitTokens";

/** 렌더 문서 뼈대 · 섹션 분기 (M2A-2a K3 · m2a 0.12 · 3.1 · K-AC-09·16) — 레지스트리를 주입해 킷 변형과 무관하게 검사 */
const Stub = ({ section, root }: KitSectionProps) => {
  const Tag = section.type === "header" ? "header" : section.type === "footer" ? "footer" : "section";
  return (
    <Tag {...root}>
      {section.type === "hero" && <h1>제목</h1>}
    </Tag>
  );
};
const STUB = { "header/sticky-right-cta": Stub, "hero/fullbleed-left": Stub, "footer/biz-extended": Stub };
const draw = (registry = STUB, kitTokens = SAMPLE_KIT_TOKENS) => render(<PageDocument doc={sampleDoc()} kitTokens={kitTokens} registry={registry} />).container;

describe("렌더 문서 뼈대 (K-AC-09 · 0.12)", () => {
  it("사이트 루트 바로 아래 header(1) · main(1) · footer(1) 형제 — main 안에 header·footer 0 · hero·본문·폴백은 main 안 · h1 = 1", () => {
    const site = draw().querySelector("[data-site-root]")!;
    expect([...site.children].map((el) => el.tagName)).toEqual(["HEADER", "MAIN", "FOOTER"]);
    const main = site.querySelector(":scope > main")!;
    expect(main.querySelectorAll("header, footer")).toHaveLength(0);
    expect(main.querySelector('[data-instance-id="s-hero"]')).not.toBeNull();
    expect(main.querySelector('[data-instance-id="s-about"]')).not.toBeNull();
    expect(site.querySelectorAll("h1")).toHaveLength(1);
  });

  it("킷 섹션 루트 = id s-<instanceId> · data-section type/variant · data-instance-id(사각형 보고) · data-kit", () => {
    const hero = draw().querySelector<HTMLElement>("#s-s-hero")!;
    expect(hero.dataset.section).toBe("hero/fullbleed-left");
    expect(hero.dataset.instanceId).toBe("s-hero");
    expect(hero).toHaveAttribute("data-kit");
  });

  it("폴백 섹션마다 표식 [data-kit-marker=fallback] 1개 '구조 미리보기' · data-fallback · 킷 섹션에는 0 (K-AC-16)", () => {
    const c = draw();
    const fallbacks = [...c.querySelectorAll<HTMLElement>('[data-fallback="true"]')];
    expect(fallbacks.map((el) => el.dataset.instanceId)).toEqual(["s-about", "s-services", "s-faq", "s-contact", "s-cta"]);
    for (const el of fallbacks) {
      expect(el.querySelectorAll('[data-kit-marker="fallback"]')).toHaveLength(1);
      expect(el.querySelector('[data-kit-marker="fallback"]')).toHaveTextContent("구조 미리보기");
    }
    for (const el of c.querySelectorAll("[data-kit]")) expect(el.querySelectorAll("[data-kit-marker]")).toHaveLength(0);
  });

  it("킷 토큰 없음 → 킷 섹션 0 · 모든 섹션 폴백(중립 토큰) — header·footer도 main 안 폴백", () => {
    const c = render(<PageDocument doc={sampleDoc()} registry={STUB} />).container;
    expect(c.querySelectorAll("[data-kit]")).toHaveLength(0);
    expect(c.querySelectorAll('[data-fallback="true"]')).toHaveLength(sampleDoc().sections.length);
    expect([...c.querySelector("[data-site-root]")!.children].map((el) => el.tagName)).toEqual(["MAIN"]);
  });

  it("레지스트리 = M2A-2a 3변형 + M2A-2b 본문(about/story …) + M2B-1a hero 5변형(split·center·grid·text·image) + M2B-1b header 3 · footer 3(sticky-hamburger …) · 모르는 쌍 undefined", () => {
    expect(Object.keys(KIT_REGISTRY).sort()).toEqual(["about/story", "about/text", "contact/form", "faq/accordion", "footer/biz-extended", "footer/biz-extended-map", "footer/minimal", "footer/minimal-biz", "header/sticky-hamburger", "header/sticky-right-cta", "header/sticky-two-tier", "header/transparent", "hero/center", "hero/fullbleed-left", "hero/grid", "hero/image", "hero/split", "hero/text", "services/cards-2", "services/cards-3", "services/list"]);
    expect(kitFor({ type: "hero", variant: "no-such-variant" } as SectionInstance)).toBeUndefined();
  });
});
