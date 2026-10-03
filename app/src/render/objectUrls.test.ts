import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleDoc, SAMPLE_SECTIONS, withSections } from "../engine/testing/sampleDoc";
import { createObjectUrlCache, docImageIds } from "./objectUrls";

/** 이미지 전달 (M2A-2a K4 · m2a 0.9 · Opus B-1-7) — 부모가 Blob 자체를 보내고 렌더 문서가 자기 object URL을 만든다 · 문서에서 빠진 이미지는 해제 */
const ID_A = "11111111-1111-4111-8111-111111111111";
const ID_B = "22222222-2222-4222-8222-222222222222";
let n = 0;
const urlApi = { createObjectURL: vi.fn(() => `blob:null/${++n}`), revokeObjectURL: vi.fn() };
afterEach(() => {
  vi.clearAllMocks();
  n = 0;
});

describe("object URL 보관 (K4)", () => {
  it("문서가 쓰는 id에 Blob이 있으면 URL을 만든다 · 같은 Blob이면 다시 만들지 않는다", () => {
    const cache = createObjectUrlCache(urlApi);
    const blob = new Blob(["a"], { type: "image/png" });
    expect(cache.sync({ [ID_A]: blob }, new Set([ID_A]))).toEqual({ [ID_A]: "blob:null/1" });
    expect(cache.sync({ [ID_A]: blob }, new Set([ID_A]))).toEqual({ [ID_A]: "blob:null/1" });
    expect(urlApi.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it("교체(같은 id 다른 Blob) → 옛 URL 해제 후 새 URL · 문서에서 빠짐 → 해제 · Blob 없음 → URL 없음", () => {
    const cache = createObjectUrlCache(urlApi);
    cache.sync({ [ID_A]: new Blob(["a"]), [ID_B]: new Blob(["b"]) }, new Set([ID_A, ID_B]));
    expect(cache.sync({ [ID_A]: new Blob(["a2"]), [ID_B]: new Blob(["b"]) }, new Set([ID_A]))).toEqual({ [ID_A]: "blob:null/3" });
    expect(urlApi.revokeObjectURL.mock.calls.map(([u]) => u).sort()).toEqual(["blob:null/1", "blob:null/2"]);
    expect(cache.sync({}, new Set([ID_A]))).toEqual({});
    expect(urlApi.revokeObjectURL).toHaveBeenLastCalledWith("blob:null/3");
  });

  it("clear → 남은 URL 전부 해제(렌더 문서 내림)", () => {
    const cache = createObjectUrlCache(urlApi);
    cache.sync({ [ID_A]: new Blob(["a"]) }, new Set([ID_A]));
    cache.clear();
    expect(urlApi.revokeObjectURL).toHaveBeenCalledWith("blob:null/1");
  });

  it("docImageIds — 켜진 이미지 슬롯의 로컬 id만(플레이스홀더·꺼짐 제외)", () => {
    const hero = SAMPLE_SECTIONS[1]!;
    const about = SAMPLE_SECTIONS[2]!;
    const doc = withSections(sampleDoc(), [
      { ...hero, slots: { ...hero.slots, image: { kind: "image", enabled: true, source: ID_A as never, alt: "가게 전경", decorative: false } } },
      { ...about, slots: { ...about.slots, image: { kind: "image", enabled: false, source: ID_B as never, alt: "", decorative: true } } },
    ]);
    expect([...docImageIds(doc)]).toEqual([ID_A]);
    expect([...docImageIds(sampleDoc())]).toEqual([]);
  });
});
