import { THUMBNAIL_KEYS, thumbnailPath } from "./thumbnailKeys";

describe("THUMBNAIL_KEYS (M3P-2)", () => {
  it("테스트·dev = 빈 맵(와이어 유지) · 경로 = 같은 출처 /thumbs/{key}.svg", () => {
    expect(THUMBNAIL_KEYS).toEqual({});
    expect(Object.isFrozen(THUMBNAIL_KEYS)).toBe(true);
    expect(thumbnailPath("ref-a.0123abcd")).toBe("/thumbs/ref-a.0123abcd.svg");
  });
});
