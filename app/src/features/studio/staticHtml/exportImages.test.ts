import type { ImageSlotValue, PageDoc, SectionInstance } from "../../../engine/contracts/pageDoc";
import { sampleDoc, section, withSections } from "../../../engine/testing/sampleDoc";
import { docImageIds } from "../../../render/objectUrls";
import { addImage } from "../images/store/imageStore";
import { exportImages, imageReader, lostImageText, type ReadImage } from "./exportImages";

/** SPEC m2c 5.1 — 내보내기 동봉 이미지: 쓰는 id만 · id당 파생본 1장(pickVariant, 목표 = 그 id를 쓰는 슬롯들의 동봉 단계 중 가장 큰 값) · 없으면 잃은 이미지 */
const ID = "11111111-1111-4111-8111-111111111111";
const ID2 = "22222222-2222-4222-8222-222222222222";
const withSource = (s: SectionInstance, key: string, id: string, enabled = true): SectionInstance => ({
  ...s,
  slots: { ...s.slots, [key]: { ...(s.slots[key] as ImageSlotValue), source: id as ImageSlotValue["source"], enabled } },
});
const docOf = (...sections: SectionInstance[]): PageDoc => withSections(sampleDoc(), sections);
const hero = (id: string) => withSource(section("hero", "fullbleed-left", "s-hero"), "image", id);
const gallery = (id: string) => withSource(section("portfolio", "grid-3", "s-p"), "image1", id);
const variantsOf = (...widths: number[]) => Object.fromEntries(widths.map((w) => [w, new Blob([String(w)])]));
const reader = (variants: Record<number, Blob>, width: number): ReadImage => (id) => (id === ID ? { variants, width, height: 600 } : undefined);
const widthOf = async (image: { readonly blob: Blob } | undefined) => Number(await image!.blob.text());

describe("exportImages (SPEC m2c 5.1 · IMG-AC-23)", () => {
  it("500폭 원본 → hero·갤러리 모두 500", async () => {
    const read = reader(variantsOf(500), 500);
    expect(await widthOf(exportImages(docOf(hero(ID)), read).images[ID])).toBe(500);
    expect(await widthOf(exportImages(docOf(gallery(ID)), read).images[ID])).toBe(500);
  });

  it("1500폭 원본 → hero 1500 · 갤러리 640 · 값 = {고른 Blob, 원본 폭·높이}", async () => {
    const read = reader(variantsOf(640, 1280, 1500), 1500);
    expect(await widthOf(exportImages(docOf(hero(ID)), read).images[ID])).toBe(1500);
    const { images } = exportImages(docOf(gallery(ID)), read);
    expect(await widthOf(images[ID])).toBe(640);
    expect(images[ID]).toMatchObject({ width: 1500, height: 600 });
  });

  it("같은 id를 두 슬롯이 쓰면 큰 쪽(hero 1920) 기준 · id당 1장", async () => {
    const { images } = exportImages(docOf(gallery(ID), hero(ID)), reader(variantsOf(640, 1280, 1920), 3000));
    expect(Object.keys(images)).toEqual([ID]);
    expect(await widthOf(images[ID])).toBe(1920);
  });

  it("쓰는 id만 보낸다 — 꺼진 슬롯 · 문서에 없는 보관소 id 0 · 키 집합 = 렌더 docImageIds", () => {
    const doc = docOf(hero(ID), withSource(section("about", "story", "s-about"), "image", ID2, false));
    const read: ReadImage = () => ({ variants: variantsOf(640), width: 640, height: 480 });
    const { images, lost } = exportImages(doc, read);
    expect(new Set(Object.keys(images))).toEqual(docImageIds(doc));
    expect(Object.keys(images)).toEqual([ID]);
    expect(lost).toBe(0);
  });

  it("잃은 이미지(보관소에 없음 · 파생본 0) = 보내지 않고 개수만 · 문구(5.2)", () => {
    const doc = docOf(hero(ID), gallery(ID2));
    expect(exportImages(doc, () => undefined)).toEqual({ images: {}, lost: 2 });
    expect(exportImages(doc, (id) => (id === ID ? { variants: {}, width: 1, height: 1 } : undefined))).toEqual({ images: {}, lost: 2 });
    expect(lostImageText(2)).toBe("이미지 2장을 다시 골라야 해 자체 그래픽으로 넣었습니다");
  });

  it("imageReader — 편집 틀 images 맵 + 보관소 메타 → 파생본 전부 · 없는 id·빈 맵 = undefined", () => {
    const variants = variantsOf(640, 1280, 1920);
    const images = addImage({}, ID, { variants, width: 2400, height: 1600, format: "webp", bytes: 9 } as unknown as Parameters<typeof addImage>[2], 640);
    expect(imageReader(images)(ID)).toEqual({ variants, width: 2400, height: 1600 });
    expect(imageReader(images)(ID2)).toBeUndefined();
    expect(imageReader(undefined)(ID)).toBeUndefined();
  });
});
