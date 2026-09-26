import { sampleDoc } from "../testing/sampleDoc";
import { canonicalJson, fnv1a64, hashDoc } from "./hash";

function reverseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).reverse().map(([k, v]) => [k, reverseKeys(v)]));
  }
  return value;
}

describe("hashDoc (동기 · 결정적)", () => {
  it("FNV-1a 64 알려진 값", () => {
    expect(fnv1a64("")).toBe("cbf29ce484222325");
    expect(fnv1a64("a")).toBe("af63dc4c8601ec8c");
  });

  it("canonicalJson: 키 정렬 · 배열 순서 유지 · undefined 키 생략", () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 3, c: undefined }] })).toBe('{"a":[2,{"d":3}],"b":1}');
  });

  it("같은 문서는 같은 해시, 형식은 fnv1a64:<16진 16자>", () => {
    const h = hashDoc(sampleDoc());
    expect(h).toMatch(/^fnv1a64:[0-9a-f]{16}$/);
    expect(hashDoc(sampleDoc())).toBe(h);
  });

  it("키 순서만 다른 같은 문서 = 같은 해시", () => {
    const doc = sampleDoc();
    expect(hashDoc(reverseKeys(doc) as typeof doc)).toBe(hashDoc(doc));
  });

  it("슬롯 1글자 다르면 다른 해시", () => {
    const doc = sampleDoc();
    const [header, hero, ...rest] = doc.sections;
    const changed = { ...doc, sections: [header!, { ...hero!, slots: { ...hero!.slots, title: `${hero!.slots.title as string}!` } }, ...rest] };
    expect(hashDoc(changed)).not.toBe(hashDoc(doc));
  });

  it("값이 undefined인 키 = 키 없음", () => {
    const doc = sampleDoc();
    expect(hashDoc({ ...doc, extra: undefined } as typeof doc)).toBe(hashDoc(doc));
  });

  it("hash · revision · updatedAt만 다르면 같은 해시(내용 해시)", () => {
    const doc = sampleDoc();
    expect(hashDoc({ ...doc, hash: "x", revision: 99, updatedAt: "2030-01-01T00:00:00.000Z" })).toBe(hashDoc(doc));
  });

  it("섹션 순서·프로필 버전·메타가 다르면 다른 해시", () => {
    const doc = sampleDoc();
    const base = hashDoc(doc);
    expect(hashDoc({ ...doc, sections: [...doc.sections].reverse() })).not.toBe(base);
    expect(hashDoc({ ...doc, profileVersion: 3 })).not.toBe(base);
    expect(hashDoc({ ...doc, meta: { ...doc.meta, title: "다른 제목" } })).not.toBe(base);
  });

  it("한글·이모지(UTF-8) 1글자 차이도 구분", () => {
    expect(fnv1a64("가")).not.toBe(fnv1a64("각"));
    expect(fnv1a64("😀")).not.toBe(fnv1a64("😁"));
  });
});
