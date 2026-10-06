import { getSectionDefinition } from "../engine/sections/registry";
import { SAMPLE_COPY } from "../data/sampleCopy";
import { generatedReferenceFixtures } from "../fixtures/generatedReferences";
import { referenceFixtures } from "../fixtures/references";
import { buildThumbnail } from "./entry";
import { referenceRenderInput } from "./referenceDoc";

/** B-M3P-01 — 썸네일 문구가 업종·레퍼런스를 구분한다(QB-01: h1 21/21 동일이었다). 문구는 썸네일 렌더 입력에서만 — sampleCopy·편집기 경로 그대로 */
const CSS = "[data-site-root]{color:red}";
const REFS = [...referenceFixtures, ...generatedReferenceFixtures];
const h1Of = (svg: string) => [...svg.matchAll(/<h1[^>]*>([^<]*)<\/h1>/g)].map((m) => m[1]!);
const slotOf = (id: string, type: string, key: string) => {
  const section = referenceRenderInput(id).doc.sections.find((s) => s.type === type);
  return section ? (section.slots[key] as string | undefined) : undefined;
};

describe("썸네일 문구 (B-M3P-01)", () => {
  it("21장 SVG의 hero h1이 장마다 다르다 — 고유 수 = 21 ≥ 업종 수, 기본 예시 문구 0", () => {
    const h1s = REFS.map((r) => h1Of(buildThumbnail(r.id, CSS).svg));
    for (const list of h1s) expect(list).toHaveLength(1);
    const titles = h1s.map((list) => list[0]!);
    expect(new Set(titles).size).toBe(21);
    expect(new Set(titles).size).toBeGreaterThanOrEqual(new Set(REFS.map((r) => r.industry)).size);
    expect(titles).not.toContain(SAMPLE_COPY["hero/title"]);
  });

  it("같은 업종 안에서도 h1이 다르고, 첫 톤이 다르면 부제도 다르다", () => {
    for (const industry of new Set(REFS.map((r) => r.industry))) {
      const same = REFS.filter((r) => r.industry === industry);
      const titles = same.map((r) => slotOf(r.id, "hero", "title"));
      expect(new Set(titles).size, industry).toBe(same.length);
      for (const a of same) for (const b of same) {
        if (a.visualTags[0] !== b.visualTags[0]) expect(slotOf(a.id, "hero", "subtitle"), `${a.id}·${b.id}`).not.toBe(slotOf(b.id, "hero", "subtitle"));
      }
    }
  });

  it("섹션 제목이 업종마다 다르다 — 업종 6개 = 서비스 제목 6종, 예시 문구와 다름", () => {
    const headings = new Map(REFS.map((r) => [r.industry, slotOf(r.id, "services", "heading") ?? slotOf(r.id, "about", "heading")]));
    expect(headings.size).toBe(6);
    expect(new Set(headings.values()).size).toBe(6);
    for (const h of headings.values()) expect([SAMPLE_COPY["services/heading"], SAMPLE_COPY["about/heading"]]).not.toContain(h);
  });

  it("넣은 문구는 슬롯 권장 글자 수 이하 · URL·마크업 0", () => {
    for (const r of REFS) {
      const { doc } = referenceRenderInput(r.id);
      for (const s of doc.sections) {
        const def = getSectionDefinition(s.type, s.variant)!;
        for (const slot of def.slots) {
          const text = s.slots[slot.key];
          if (typeof text !== "string") continue;
          expect([...text].length, `${r.id} ${s.type}/${slot.key}`).toBeLessThanOrEqual(slot.recommendedLength ?? slot.maxLength);
          expect(text, `${r.id} ${s.type}/${slot.key}`).not.toMatch(/https?:|\/\/|<|data:/i);
        }
      }
    }
  });
});
