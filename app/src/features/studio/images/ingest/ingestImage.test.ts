import { describe, expect, it, vi } from "vitest";
import { browserIngestDeps, type IngestBitmap, type IngestDeps } from "./deps";
import { MAX_FILE_BYTES } from "./fileType";
import { countPattern, makeGif, makeJpeg, makePng, makeWebp, toFile } from "./fixtures/imageBytes";
import { ingestImage } from "./ingestImage";

class FakeBitmap implements IngestBitmap {
  closed = false;
  constructor(
    readonly width: number,
    readonly height: number,
  ) {}
  close(): void {
    this.closed = true;
  }
}

interface FakeOptions {
  /** 디코드 결과 크기(방향 적용 뒤) — 없으면 헤더와 같은 크기를 쓰도록 호출 쪽이 넣는다 */
  readonly decoded: { readonly width: number; readonly height: number };
  readonly webp?: boolean;
  readonly decodeFails?: boolean;
  readonly encodeFails?: boolean;
}

function fakeDeps({ decoded, webp = true, decodeFails = false, encodeFails = false }: FakeOptions) {
  const bitmaps: FakeBitmap[] = [];
  const encodedSources: unknown[] = [];
  const createImageBitmap = vi.fn((source: Blob | IngestBitmap, options: ImageBitmapOptions) => {
    if (source instanceof Blob) {
      if (decodeFails) return Promise.reject(new Error("decode"));
      const bitmap = new FakeBitmap(decoded.width, decoded.height);
      bitmaps.push(bitmap);
      return Promise.resolve(bitmap);
    }
    const bitmap = new FakeBitmap(options.resizeWidth ?? source.width, options.resizeHeight ?? source.height);
    bitmaps.push(bitmap);
    return Promise.resolve(bitmap);
  });
  const encode = vi.fn((bitmap: IngestBitmap, type: string) => {
    encodedSources.push(bitmap);
    if (encodeFails && bitmap.width > 1) return Promise.reject(new Error("encode"));
    const actual = type === "image/webp" && !webp ? "image/png" : type;
    return Promise.resolve(new Blob([`enc ${bitmap.width}x${bitmap.height}`], { type: actual }));
  });
  const deps: IngestDeps = { createImageBitmap, encode };
  return { deps, bitmaps, encodedSources, createImageBitmap, encode };
}

const bytesOf = async (blob: Blob): Promise<Uint8Array> => new Uint8Array(await blob.arrayBuffer());

describe("ingestImage 조립", () => {
  it("3000폭 JPEG → 640·1280·1920 WebP · 메타 = 디코드 크기 · bytes = 파생본 합계 (IMG-AC-04)", async () => {
    const fake = fakeDeps({ decoded: { width: 3000, height: 2000 } });
    const result = await ingestImage(toFile(makeJpeg({ width: 3000, height: 2000 }), "a.jpg", "image/jpeg"), fake.deps);
    if (!result.ok) throw new Error(result.code);
    const { variants, width, height, format, bytes } = result.image;
    expect(Object.keys(variants).map(Number)).toEqual([640, 1280, 1920]);
    expect([width, height, format]).toEqual([3000, 2000, "webp"]);
    expect(variants[1280]?.type).toBe("image/webp");
    expect(bytes).toBe(Object.values(variants).reduce((sum, blob) => sum + (blob?.size ?? 0), 0));
  });

  it("V1 실패(GIF) = TYPE_MISMATCH · 디코드 호출 0", async () => {
    const fake = fakeDeps({ decoded: { width: 1, height: 1 } });
    await expect(ingestImage(toFile(makeGif(), "a.gif", "image/gif"), fake.deps)).resolves.toEqual({ ok: false, code: "TYPE_MISMATCH" });
    expect(fake.createImageBitmap).not.toHaveBeenCalled();
  });

  it("V4 실패(10MB + 1B) = TOO_LARGE + 소수 1자리 MB · 디코드 호출 0", async () => {
    const head = makeJpeg({ width: 10, height: 10 });
    const file = new File([head.slice().buffer as ArrayBuffer, new Uint8Array(MAX_FILE_BYTES + 1 - head.length)], "big.jpg", { type: "image/jpeg" });
    const fake = fakeDeps({ decoded: { width: 10, height: 10 } });
    await expect(ingestImage(file, fake.deps)).resolves.toEqual({ ok: false, code: "TOO_LARGE", detail: "10.0MB" });
    expect(fake.createImageBitmap).not.toHaveBeenCalled();
  });

  it("V5 실패(8000 × 5001) = TOO_MANY_PIXELS · 디코드 함수 호출 0 (IMG-AC-03 스파이)", async () => {
    const fake = fakeDeps({ decoded: { width: 8000, height: 5001 } });
    const file = toFile(makeWebp({ kind: "VP8X", width: 8000, height: 5001 }), "big.webp", "image/webp");
    await expect(ingestImage(file, fake.deps)).resolves.toEqual({ ok: false, code: "TOO_MANY_PIXELS", detail: "8000 × 5001" });
    expect(fake.createImageBitmap).not.toHaveBeenCalled();
  });

  it("잘린 헤더 = DECODE_FAILED · 디코드 함수 호출 0", async () => {
    const fake = fakeDeps({ decoded: { width: 10, height: 10 } });
    const file = toFile(makePng({ width: 10, height: 10 }).subarray(0, 24), "cut.png", "image/png");
    await expect(ingestImage(file, fake.deps)).resolves.toEqual({ ok: false, code: "DECODE_FAILED" });
    expect(fake.createImageBitmap).not.toHaveBeenCalled();
  });

  it.each(["앞 16바이트", "전체 바이트"])("파일 읽기 실패(%s · NotReadableError) = DECODE_FAILED 결과(reject 아님)", async (stage) => {
    const file = toFile(makePng({ width: 10, height: 10 }), "gone.png", "image/png");
    const unreadable = (): Promise<ArrayBuffer> => Promise.reject(new DOMException("gone", "NotReadableError"));
    if (stage === "앞 16바이트") {
      vi.spyOn(file, "slice").mockReturnValue(Object.assign(new Blob(), { arrayBuffer: unreadable }));
    } else {
      vi.spyOn(file, "arrayBuffer").mockImplementation(unreadable);
    }
    const fake = fakeDeps({ decoded: { width: 10, height: 10 } });
    await expect(ingestImage(file, fake.deps)).resolves.toEqual({ ok: false, code: "DECODE_FAILED" });
    expect(fake.createImageBitmap).not.toHaveBeenCalled();
  });

  it("V6 디코드 실패 = DECODE_FAILED", async () => {
    const fake = fakeDeps({ decoded: { width: 10, height: 10 }, decodeFails: true });
    await expect(ingestImage(toFile(makePng({ width: 10, height: 10 }), "a.png", "image/png"), fake.deps)).resolves.toEqual({
      ok: false,
      code: "DECODE_FAILED",
    });
  });

  it("방향: 디코드에 imageOrientation from-image 전달 · 메타·사다리 = 방향 적용 뒤 크기 (IMG-AC-07 [U])", async () => {
    const fake = fakeDeps({ decoded: { width: 200, height: 300 } });
    const file = toFile(makeJpeg({ width: 300, height: 200, exif: { orientation: 6 } }), "p.jpg", "image/jpeg");
    const result = await ingestImage(file, fake.deps);
    expect(fake.createImageBitmap).toHaveBeenCalledWith(file, expect.objectContaining({ imageOrientation: "from-image" }));
    if (!result.ok) throw new Error(result.code);
    expect([result.image.width, result.image.height]).toEqual([200, 300]);
    expect(Object.keys(result.image.variants).map(Number)).toEqual([200]);
  });

  it.each([
    ["JPEG APP1 EXIF + GPS", toFile(makeJpeg({ width: 500, height: 400, exif: { orientation: 1, gps: true } }), "e.jpg", "image/jpeg")],
    ["PNG eXIf + GPS", toFile(makePng({ width: 500, height: 400, exif: true }), "e.png", "image/png")],
  ])("EXIF 제거: %s — 축소가 없어도 재인코딩 · 결과에 Exif·eXIf·GPS 태그 0 (IMG-AC-06)", async (_label, file) => {
    const source = await bytesOf(file);
    expect(countPattern(source, [0x88, 0x25]) + countPattern(source, [0x45, 0x78, 0x69, 0x66])).toBeGreaterThan(0);
    const fake = fakeDeps({ decoded: { width: 500, height: 400 } });
    const result = await ingestImage(file, fake.deps);
    if (!result.ok) throw new Error(result.code);
    const variant = result.image.variants[500];
    expect(variant).toBeDefined();
    expect(variant).not.toBe(file);
    expect(fake.encodedSources).not.toContain(file);
    const out = await bytesOf(variant as Blob);
    expect(countPattern(out, [0x45, 0x78, 0x69, 0x66, 0, 0])).toBe(0);
    expect(countPattern(out, [0x65, 0x58, 0x49, 0x66])).toBe(0);
    expect(countPattern(out, [0x88, 0x25])).toBe(0);
  });

  it.each([
    ["투명 없는 JPEG", toFile(makeJpeg({ width: 800, height: 600 }), "a.jpg", "image/jpeg"), "jpeg", "image/jpeg"],
    ["색 유형 6 PNG", toFile(makePng({ width: 800, height: 600, colorType: 6 }), "a.png", "image/png"), "png", "image/png"],
  ])("WebP 미지원 인코더 + %s → %s (IMG-AC-05)", async (_label, file, format, type) => {
    const fake = fakeDeps({ decoded: { width: 800, height: 600 }, webp: false });
    const result = await ingestImage(file, fake.deps);
    if (!result.ok) throw new Error(result.code);
    expect(result.image.format).toBe(format);
    expect(Object.values(result.image.variants).map((blob) => blob?.type)).toEqual([type, type]);
  });

  it("원본 미보관: 모든 bitmap close · 결과에 File·파일 이름 없음 (IMG-AC-10)", async () => {
    const fake = fakeDeps({ decoded: { width: 3000, height: 2000 } });
    const file = toFile(makeJpeg({ width: 3000, height: 2000 }), "IMG_20261005_secret.jpg", "image/jpeg");
    const result = await ingestImage(file, fake.deps);
    expect(result.ok).toBe(true);
    expect(fake.bitmaps.length).toBeGreaterThan(1);
    expect(fake.bitmaps.every((bitmap) => bitmap.closed)).toBe(true);
    const seen: unknown[] = [];
    const walk = (value: unknown): void => {
      seen.push(value);
      if (value && typeof value === "object" && !(value instanceof Blob)) Object.values(value).forEach(walk);
    };
    walk(result);
    expect(seen.some((value) => value instanceof File)).toBe(false);
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("인코딩 실패 = DECODE_FAILED 이고 bitmap은 모두 close", async () => {
    const fake = fakeDeps({ decoded: { width: 3000, height: 2000 }, encodeFails: true });
    const result = await ingestImage(toFile(makeJpeg({ width: 3000, height: 2000 }), "a.jpg", "image/jpeg"), fake.deps);
    expect(result).toEqual({ ok: false, code: "DECODE_FAILED" });
    expect(fake.bitmaps.every((bitmap) => bitmap.closed)).toBe(true);
  });

  it("큰 원본은 반씩 단계 축소 — 한 번에 절반 아래로 줄이지 않는다", async () => {
    const fake = fakeDeps({ decoded: { width: 16_000, height: 2000 } });
    const result = await ingestImage(toFile(makeWebp({ kind: "VP8X", width: 16_000, height: 2000 }), "w.webp", "image/webp"), fake.deps);
    expect(result.ok).toBe(true);
    const resizes = fake.createImageBitmap.mock.calls.filter(([source, options]) => !(source instanceof Blob) && options.resizeWidth !== 1);
    expect(resizes.length).toBeGreaterThan(3);
    for (const [source, options] of resizes) {
      expect((options.resizeWidth ?? 0) * 2).toBeGreaterThanOrEqual((source as IngestBitmap).width);
      expect(options.resizeQuality).toBe("high");
    }
  });
});

describe("기본 브라우저 deps", () => {
  it("import 시점에 브라우저 전역을 건드리지 않고 함수 모양을 갖는다", () => {
    expect(typeof browserIngestDeps.createImageBitmap).toBe("function");
    expect(typeof browserIngestDeps.encode).toBe("function");
  });
});
