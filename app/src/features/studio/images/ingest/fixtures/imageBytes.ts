/**
 * 자체 제작 fixture 바이트 생성기 (M2C-1 · SPEC 2.3·8.1 · PLAN 3절 "fixture는 자체 제작만").
 * 외부 이미지·실사진 0 — 형식 서명·헤더·EXIF 태그를 손으로 붙인 최소 바이트만 만든다.
 * 헤더 파서·형식 검사 단위 테스트용이며, QA는 `insertExifApp1`을 캔버스로 만든 실 JPEG에 붙여 브라우저 실측(IMG-AC-06·07)에 쓴다.
 */

const ascii = (text: string): number[] => Array.from(text, (ch) => ch.charCodeAt(0));
const u16be = (n: number): number[] => [(n >>> 8) & 0xff, n & 0xff];
const u32be = (n: number): number[] => [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff];
const u16le = (n: number): number[] => [n & 0xff, (n >>> 8) & 0xff];
const u24le = (n: number): number[] => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff];
const u32le = (n: number): number[] => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff];

const CRC_TABLE: readonly number[] = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: readonly number[]): number {
  let c = 0xffffffff;
  for (const b of bytes) c = (CRC_TABLE[(c ^ b) & 0xff] ?? 0) ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: readonly number[]): number[] {
  const body = [...ascii(type), ...data];
  return [...u32be(data.length), ...body, ...u32be(crc32(body))];
}

export const PNG_SIGNATURE: readonly number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

export interface PngOptions {
  readonly width: number;
  readonly height: number;
  /** 0 회색 · 2 RGB · 3 팔레트 · 4 회색+알파 · 6 RGBA */
  readonly colorType?: number;
  readonly trns?: boolean;
  readonly exif?: boolean;
}

export function makePng({ width, height, colorType = 2, trns = false, exif = false }: PngOptions): Uint8Array {
  const ihdr = [...u32be(width), ...u32be(height), 8, colorType, 0, 0, 0];
  return Uint8Array.from([
    ...PNG_SIGNATURE,
    ...pngChunk("IHDR", ihdr),
    ...(exif ? pngChunk("eXIf", tiffExif({ orientation: 1, gps: true })) : []),
    ...(trns ? pngChunk("tRNS", [0, 0]) : []),
    ...pngChunk("IDAT", [0x78, 0x9c, 0x03, 0x00, 0x00, 0x00, 0x00, 0x01]),
    ...pngChunk("IEND", []),
  ]);
}

export interface ExifOptions {
  readonly orientation?: number;
  readonly gps?: boolean;
}

/** TIFF(빅엔디언) 본문: IFD0에 방향(0x0112)·GPS IFD 포인터(0x8825), GPS IFD에 위도 기준 'N'(0x0001). */
function tiffExif({ orientation = 1, gps = false }: ExifOptions): number[] {
  const entries = gps ? 2 : 1;
  const ifd0Size = 2 + entries * 12 + 4;
  const gpsOffset = 8 + ifd0Size;
  const orientationEntry = [...u16be(0x0112), ...u16be(3), ...u32be(1), ...u16be(orientation), 0, 0];
  const gpsPointer = gps ? [...u16be(0x8825), ...u16be(4), ...u32be(1), ...u32be(gpsOffset)] : [];
  const gpsIfd = gps ? [...u16be(1), ...u16be(0x0001), ...u16be(2), ...u32be(2), ...ascii("N"), 0, 0, 0, ...u32be(0)] : [];
  return [...ascii("MM"), ...u16be(42), ...u32be(8), ...u16be(entries), ...orientationEntry, ...gpsPointer, ...u32be(0), ...gpsIfd];
}

/** JPEG APP1 EXIF 세그먼트(FF E1 길이 "Exif\0\0" + TIFF). */
export function exifApp1(options: ExifOptions): number[] {
  const payload = [...ascii("Exif"), 0, 0, ...tiffExif(options)];
  return [0xff, 0xe1, ...u16be(payload.length + 2), ...payload];
}

/** 이미 있는 JPEG(SOI로 시작) 바로 뒤에 APP1 EXIF를 끼운다 — QA가 캔버스로 만든 JPEG에 방향·GPS 태그를 붙일 때 쓴다. */
export function insertExifApp1(jpeg: Uint8Array, options: ExifOptions): Uint8Array {
  if (jpeg[0] !== 0xff || jpeg[1] !== 0xd8) throw new Error("JPEG(SOI)가 아닙니다");
  return Uint8Array.from([0xff, 0xd8, ...exifApp1(options), ...jpeg.subarray(2)]);
}

export interface JpegOptions {
  readonly width: number;
  readonly height: number;
  /** SOFn 마커 둘째 바이트 — 0xC0 기준선 · 0xC2 프로그레시브 */
  readonly sof?: number;
  readonly exif?: ExifOptions;
  /** SOF 앞에 끼울 APP2 채움 바이트 수(큰 메타데이터 뒤의 SOF를 찾는지) */
  readonly padding?: number;
}

export function makeJpeg({ width, height, sof = 0xc0, exif, padding = 0 }: JpegOptions): Uint8Array {
  const app2 = padding > 0 ? [0xff, 0xe2, ...u16be(padding + 2), ...new Array<number>(padding).fill(0)] : [];
  const sofSegment = [0xff, sof, ...u16be(17), 8, ...u16be(height), ...u16be(width), 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1];
  const sos = [0xff, 0xda, ...u16be(12), 3, 1, 0, 2, 0x11, 3, 0x11, 0, 0x3f, 0];
  return Uint8Array.from([0xff, 0xd8, ...(exif ? exifApp1(exif) : []), ...app2, ...sofSegment, ...sos, 0x00, 0xff, 0xd9]);
}

export type WebpKind = "VP8" | "VP8L" | "VP8X";

export interface WebpOptions {
  readonly kind: WebpKind;
  readonly width: number;
  readonly height: number;
  /** VP8X 알파 플래그(0x10) */
  readonly alpha?: boolean;
}

function webpChunk({ kind, width, height, alpha = false }: WebpOptions): number[] {
  if (kind === "VP8") {
    const data = [0x10, 0x02, 0x00, 0x9d, 0x01, 0x2a, ...u16le(width & 0x3fff), ...u16le(height & 0x3fff), 0, 0];
    return [...ascii("VP8 "), ...u32le(data.length), ...data];
  }
  if (kind === "VP8L") {
    const bits = ((width - 1) & 0x3fff) | (((height - 1) & 0x3fff) << 14) | ((alpha ? 1 : 0) << 28);
    const data = [0x2f, ...u32le(bits >>> 0), 0];
    return [...ascii("VP8L"), ...u32le(data.length), ...data];
  }
  const data = [alpha ? 0x10 : 0x00, 0, 0, 0, ...u24le(width - 1), ...u24le(height - 1)];
  return [...ascii("VP8X"), ...u32le(data.length), ...data];
}

export function makeWebp(options: WebpOptions): Uint8Array {
  const body = [...ascii("WEBP"), ...webpChunk(options)];
  return Uint8Array.from([...ascii("RIFF"), ...u32le(body.length), ...body]);
}

export const makeGif = (): Uint8Array => Uint8Array.from([...ascii("GIF89a"), ...u16le(1), ...u16le(1), 0, 0, 0, 0x3b]);
export const makeSvg = (): Uint8Array => Uint8Array.from(ascii('<svg xmlns="http://www.w3.org/2000/svg"/>'));
export const makeHeic = (): Uint8Array => Uint8Array.from([...u32be(24), ...ascii("ftypheic"), ...u32be(0), ...ascii("mif1heic")]);

export const toFile = (bytes: Uint8Array, name: string, type: string): File =>
  new File([bytes.slice().buffer as ArrayBuffer], name, { type });

/** 바이트 안에 패턴이 몇 번 나오는지 — EXIF·GPS 흔적 검사용 */
export function countPattern(haystack: Uint8Array, pattern: readonly number[]): number {
  let count = 0;
  for (let i = 0; i + pattern.length <= haystack.length; i += 1) {
    if (pattern.every((b, k) => haystack[i + k] === b)) count += 1;
  }
  return count;
}
