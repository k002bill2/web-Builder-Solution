import { describe, expect, it } from "vitest";
import { checkFileType, exceedsFileSize, formatFromMagic, formatMegabytes, MAX_FILE_BYTES } from "./fileType";
import { makeGif, makeHeic, makeJpeg, makePng, makeSvg, makeWebp } from "./fixtures/imageBytes";
import { ingestErrorMessage } from "./messages";

const jpeg = makeJpeg({ width: 10, height: 10 });
const png = makePng({ width: 10, height: 10 });
const webp = makeWebp({ kind: "VP8", width: 10, height: 10 });

describe("V1 확장자 (IMG-AC-01)", () => {
  it.each([
    ["a.JPG", "image/jpeg", jpeg, "jpeg"],
    ["b.jpeg", "image/jpeg", jpeg, "jpeg"],
    ["c.Png", "image/png", png, "png"],
    ["d.webp", "image/webp", webp, "webp"],
  ] as const)("%s 는 대소문자 무시로 통과한다", (name, type, bytes, expected) => {
    expect(checkFileType(name, type, bytes)).toBe(expected);
  });

  it.each(["a.svg", "a.gif", "a.heic", "noext"])("%s 는 거른다", (name) => {
    expect(checkFileType(name, "image/jpeg", jpeg)).toBeNull();
  });
});

describe("V2·V3 MIME·매직 3신호 일치 (IMG-AC-01)", () => {
  it("MIME 빈 값 + 올바른 매직은 V3에 맡겨 통과한다", () => {
    expect(checkFileType("photo.webp", "", webp)).toBe("webp");
  });

  it(".png 이름의 JPEG 바이트는 TYPE_MISMATCH(null)", () => {
    expect(checkFileType("photo.png", "image/png", jpeg)).toBeNull();
  });

  it("MIME이 다른 형식을 가리키면 null", () => {
    expect(checkFileType("photo.jpg", "image/png", jpeg)).toBeNull();
  });

  it.each([
    ["SVG", "logo.svg", "image/svg+xml", makeSvg()],
    ["GIF", "anim.gif", "image/gif", makeGif()],
    ["HEIC", "IMG_0001.heic", "image/heic", makeHeic()],
    ["HEIC를 .jpg로 바꾼 것", "IMG_0001.jpg", "image/jpeg", makeHeic()],
  ] as const)("%s fixture는 거른다", (_label, name, type, bytes) => {
    expect(checkFileType(name, type, bytes)).toBeNull();
  });

  it.each([
    ["JPEG", jpeg, "jpeg"],
    ["PNG", png, "png"],
    ["WebP", webp, "webp"],
    ["16바이트 미만 RIFF", webp.subarray(0, 10), null],
  ] as const)("매직 바이트 %s → %s", (_label, bytes, expected) => {
    expect(formatFromMagic(bytes)).toBe(expected);
  });
});

describe("V4 파일 크기 10MB (IMG-AC-02)", () => {
  it("10MB(10 × 1024 × 1024 바이트)는 통과한다", () => {
    expect(MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
    expect(exceedsFileSize(MAX_FILE_BYTES)).toBe(false);
  });

  it("10MB + 1B는 실패하고 소수 1자리 MB로 적는다", () => {
    expect(exceedsFileSize(MAX_FILE_BYTES + 1)).toBe(true);
    expect(formatMegabytes(MAX_FILE_BYTES + 1)).toBe("10.0MB");
  });

  it("실패 문구 = SPEC 2.3 그대로 (12.4MB)", () => {
    const detail = formatMegabytes(Math.round(12.4 * 1024 * 1024));
    expect(ingestErrorMessage({ ok: false, code: "TOO_LARGE", detail })).toBe("10MB까지 쓸 수 있습니다 (12.4MB)");
  });

  it("형식 실패 문구 = SPEC 2.3 그대로", () => {
    expect(ingestErrorMessage({ ok: false, code: "TYPE_MISMATCH" })).toBe("JPEG·PNG·WebP 이미지만 쓸 수 있습니다");
  });

  it("화소·읽기 실패 문구 = SPEC 2.3 그대로", () => {
    expect(ingestErrorMessage({ ok: false, code: "TOO_MANY_PIXELS", detail: "8000 × 6000" })).toBe(
      "4천만 화소까지 쓸 수 있습니다 (8000 × 6000)",
    );
    expect(ingestErrorMessage({ ok: false, code: "DECODE_FAILED" })).toBe("이미지 파일을 읽을 수 없습니다");
  });
});
