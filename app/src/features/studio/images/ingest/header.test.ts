import { describe, expect, it } from "vitest";
import { insertExifApp1, makeJpeg, makePng, makeWebp } from "./fixtures/imageBytes";
import { exceedsPixelLimit, MAX_PIXELS, MAX_SIDE, readImageHeader } from "./header";

describe("PNG IHDR·알파 (IMG-AC-03·05)", () => {
  it("IHDR에서 폭·높이를 읽고 RGB는 투명 없음", () => {
    expect(readImageHeader("png", makePng({ width: 1600, height: 1067 }))).toEqual({ width: 1600, height: 1067, alpha: false });
  });

  it.each([4, 6])("색 유형 %i = 투명 있음", (colorType) => {
    expect(readImageHeader("png", makePng({ width: 8, height: 4, colorType }))?.alpha).toBe(true);
  });

  it("tRNS 청크(eXIf 뒤에 있어도) = 투명 있음", () => {
    expect(readImageHeader("png", makePng({ width: 8, height: 4, colorType: 3, trns: true, exif: true }))?.alpha).toBe(true);
  });

  it("잘린 IHDR = null", () => {
    expect(readImageHeader("png", makePng({ width: 8, height: 4 }).subarray(0, 20))).toBeNull();
  });
});

describe("JPEG SOFn (IMG-AC-03)", () => {
  it("SOF0 기준선", () => {
    expect(readImageHeader("jpeg", makeJpeg({ width: 4000, height: 3000 }))).toEqual({ width: 4000, height: 3000, alpha: false });
  });

  it("SOF2 프로그레시브", () => {
    expect(readImageHeader("jpeg", makeJpeg({ width: 640, height: 480, sof: 0xc2 }))).toEqual({ width: 640, height: 480, alpha: false });
  });

  it("EXIF APP1 + 큰 APP2 뒤의 SOF도 세그먼트를 걸어 찾는다", () => {
    const bytes = makeJpeg({ width: 300, height: 200, exif: { orientation: 6, gps: true }, padding: 60000 });
    expect(readImageHeader("jpeg", bytes)).toEqual({ width: 300, height: 200, alpha: false });
  });

  it("SOF 전에 잘린 헤더 = null", () => {
    const bytes = makeJpeg({ width: 300, height: 200, padding: 100 });
    expect(readImageHeader("jpeg", bytes.subarray(0, 60))).toBeNull();
  });
});

describe("WebP VP8·VP8L·VP8X (IMG-AC-03·05)", () => {
  it("VP8 손실 = 투명 없음", () => {
    expect(readImageHeader("webp", makeWebp({ kind: "VP8", width: 1920, height: 1080 }))).toEqual({ width: 1920, height: 1080, alpha: false });
  });

  it("VP8L 무손실 = 투명 있음(SPEC 2.4-1)", () => {
    expect(readImageHeader("webp", makeWebp({ kind: "VP8L", width: 300, height: 7 }))).toEqual({ width: 300, height: 7, alpha: true });
  });

  it.each([true, false])("VP8X 알파 플래그 %s", (alpha) => {
    expect(readImageHeader("webp", makeWebp({ kind: "VP8X", width: 9000, height: 4000, alpha }))).toEqual({ width: 9000, height: 4000, alpha });
  });

  it("잘린 VP8X = null", () => {
    expect(readImageHeader("webp", makeWebp({ kind: "VP8X", width: 10, height: 10 }).subarray(0, 26))).toBeNull();
  });
});

describe("V5 화소 한도 (IMG-AC-03)", () => {
  it("40,000,000 화소 정확히는 통과", () => {
    expect(MAX_PIXELS).toBe(40_000_000);
    expect(exceedsPixelLimit(8000, 5000)).toBe(false);
  });

  it("40,000,000 + 1행은 실패", () => {
    expect(exceedsPixelLimit(8000, 5001)).toBe(true);
  });

  it("한 변 16,384는 통과", () => {
    expect(MAX_SIDE).toBe(16_384);
    expect(exceedsPixelLimit(16_384, 100)).toBe(false);
  });

  it("한 변 16,385는 실패(화소 수가 작아도)", () => {
    expect(exceedsPixelLimit(100, 16_385)).toBe(true);
  });

  it("폭 또는 높이 0 = 못 읽음(null)", () => {
    expect(readImageHeader("png", makePng({ width: 0, height: 10 }))).toBeNull();
  });
});

describe("fixture 생성기 insertExifApp1", () => {
  it("SOI 바로 뒤에 APP1 EXIF를 끼워도 헤더는 그대로 읽힌다", () => {
    const tagged = insertExifApp1(makeJpeg({ width: 120, height: 80 }), { orientation: 6, gps: true });
    expect([tagged[2], tagged[3]]).toEqual([0xff, 0xe1]);
    expect(readImageHeader("jpeg", tagged)).toEqual({ width: 120, height: 80, alpha: false });
  });

  it("JPEG가 아니면 던진다", () => {
    expect(() => insertExifApp1(makePng({ width: 1, height: 1 }), {})).toThrow();
  });
});
