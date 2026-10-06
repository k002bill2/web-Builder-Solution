import { generatedReferenceDetailFixtures } from "../fixtures/generatedReferenceDetails";
import { referenceRenderInput } from "./referenceDoc";

/** B-M3P-02 — 생성 레퍼런스 상세 "섹션 구성" = 실제 렌더(썸네일·편집기 같은 문서) 섹션 1:1 (렌더 = 진실). QB-02: About team-grid-3 vs 렌더 이야기+이미지 · 7개 vs 8개 */
const NAME_OF: Readonly<Record<string, string>> = {
  header: "Header", hero: "Hero", about: "About", services: "Services", portfolio: "Portfolio", statistics: "Statistics",
  testimonials: "Testimonials", pricing: "Pricing", faq: "FAQ", contact: "Contact", "cta-band": "CTA", footer: "Footer",
};

describe("생성 상세 섹션 구성 ↔ 렌더 섹션 (B-M3P-02)", () => {
  const ids = Object.keys(generatedReferenceDetailFixtures);
  it("15개 전부 — 길이·순서·이름·변형이 렌더 문서와 같다(Footer 포함)", () => {
    expect(ids).toHaveLength(15);
    for (const id of ids) {
      const rendered = referenceRenderInput(id).doc.sections.map((s) => ({ name: NAME_OF[s.type], variant: s.variant }));
      expect(generatedReferenceDetailFixtures[id]!.sections, id).toEqual(rendered);
    }
  });
  it("gen-beauty-1: About = story(이야기 + 이미지) · 8개 · 마지막 Footer", () => {
    const { sections } = generatedReferenceDetailFixtures["gen-beauty-1"]!;
    expect(sections.find((s) => s.name === "About")?.variant).toBe("story");
    expect(sections).toHaveLength(8);
    expect(sections.at(-1)?.name).toBe("Footer");
  });
});
