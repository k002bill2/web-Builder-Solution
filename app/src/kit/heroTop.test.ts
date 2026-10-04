import type { ImageSlotValue, PageDoc } from "../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../engine/testing/sampleDoc";
import { heroDoc, patch, without } from "../render/testing/drawKit";
import { kitLinks } from "./text";

/** D-1 heroTop (SPEC-BOUND 0.2 · B-3 표) — 문서의 첫 본문 섹션이 hero이면 그 맨 위 면. 문서 데이터만 읽는다 [U] */
const imageOff = (doc: PageDoc): PageDoc => {
  const image = doc.sections.find((s) => s.instanceId === "s-hero")!.slots.image as ImageSlotValue;
  return patch(doc, "s-hero", { image: { ...image, enabled: false } });
};
const top = (doc: PageDoc) => kitLinks(doc).heroTop;

describe("kitLinks.heroTop (D-1)", () => {
  it("fullbleed-left: 이미지 켬(플레이스홀더 포함) = media · 끔 = primary", () => {
    expect(top(sampleDoc())).toBe("media");
    expect(top(imageOff(sampleDoc()))).toBe("primary");
  });

  it("split·grid·text = 섹션 톤 면(base → bg · alt → surface) — 이미지 켬·끔 무관", () => {
    for (const v of ["split", "grid", "text"]) {
      expect(top(heroDoc(v, { tone: "alt" })), v).toBe("surface");
      expect(top(heroDoc(v, { tone: "base" })), v).toBe("bg");
    }
    expect(top(imageOff(heroDoc("split", { tone: "alt" })))).toBe("surface");
  });

  it("center = primary(톤 무관) · image 켬 = media · image 끔 = 섹션 톤 면", () => {
    expect(top(heroDoc("center", { tone: "base" }))).toBe("primary");
    expect(top(heroDoc("center", { tone: "alt" }))).toBe("primary");
    expect(top(heroDoc("image", { tone: "alt" }))).toBe("media");
    expect(top(imageOff(heroDoc("image", { tone: "alt" })))).toBe("surface");
    expect(top(imageOff(heroDoc("image", { tone: "base" })))).toBe("bg");
  });

  it("값 없음: 첫 본문이 hero 아님(about) · hero 변형을 모름(킷 없음) · 섹션이 header뿐", () => {
    expect(top(without(sampleDoc(), "hero"))).toBeUndefined();
    const unknown = withSections(sampleDoc(), sampleDoc().sections.map((s) => (s.type === "hero" ? { ...s, variant: "no-such-variant" } : s)));
    expect(top(unknown)).toBeUndefined();
    expect(top(withSections(sampleDoc(), [section("header", "transparent", "s-header")]))).toBeUndefined();
  });

  it("첫 본문 = header 다음 첫 섹션 — hero가 두 번째 본문이면 값 없음 · header가 없어도 첫 섹션이 hero면 계산", () => {
    const [header, hero, about, ...rest] = sampleDoc().sections;
    expect(top(withSections(sampleDoc(), [header!, about!, hero!, ...rest]))).toBeUndefined();
    expect(top(withSections(sampleDoc(), [hero!, about!, ...rest]))).toBe("media");
  });
});
