import { generatedReferenceDetailFixtures } from "../fixtures/generatedReferenceDetails";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
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
  it("큐레이션 6개도 — 상세 섹션 구성 = 렌더 문서 1:1 (B-M3P-05 · M3P-7 ★A 승인)", () => {
    const curated = Object.keys(referenceDetailFixtures);
    expect(curated).toHaveLength(6);
    for (const id of curated) {
      const rendered = referenceRenderInput(id).doc.sections.map((s) => ({ name: NAME_OF[s.type], variant: s.variant }));
      expect(referenceDetailFixtures[id]!.sections, id).toEqual(rendered);
    }
  });
  it("ref-a: 상세 마지막 = Footer(렌더와 같은 biz-extended)", () => {
    expect(referenceDetailFixtures["ref-a"]!.sections.at(-1)).toEqual({ name: "Footer", variant: "biz-extended" });
  });
  it("gen-beauty-1: About = story(이야기 + 이미지) · 8개 · 마지막 Footer", () => {
    const { sections } = generatedReferenceDetailFixtures["gen-beauty-1"]!;
    expect(sections.find((s) => s.name === "About")?.variant).toBe("story");
    expect(sections).toHaveLength(8);
    expect(sections.at(-1)?.name).toBe("Footer");
  });
});

/** B-M3P-08 — 렌더 문서에 같은 (유형, 엔진 변형) 섹션이 둘 이상 = 똑같이 보이는 섹션 중복(동네 치과 About 2개). 같은 유형·다른 변형은 렌더가 달라 허용 */
describe("렌더 문서 섹션 중복 0 — 21개 전수 (B-M3P-08)", () => {
  it("큐레이션 6 + 생성 15 — 같은 (type, 엔진 변형) 쌍이 두 번 나오는 문서 0", () => {
    const ids = [...Object.keys(referenceDetailFixtures), ...Object.keys(generatedReferenceDetailFixtures)];
    expect(ids).toHaveLength(21);
    const duplicates = ids.flatMap((id) => {
      const pairs = referenceRenderInput(id).doc.sections.map((s) => `${s.type}/${s.variant}`);
      return pairs.filter((p, i) => pairs.indexOf(p) !== i).map((p) => `${id}: ${p}`);
    });
    expect(duplicates).toEqual([]);
  });
});
