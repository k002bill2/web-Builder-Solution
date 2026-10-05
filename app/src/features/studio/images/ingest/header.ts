/**
 * V5 디코드 전 헤더 파서 (SPEC 2.3·2.4-1). PNG IHDR(+tRNS) · JPEG SOFn(세그먼트 길이로 걸음) · WebP VP8/VP8L/VP8X.
 * 압축 폭탄 방어 = 디코드 전에 폭·높이를 읽어 거른다. 못 읽거나 폭·높이 0이면 null(→ DECODE_FAILED).
 */
import type { ImageFormat } from "./types";

export interface ImageHeader {
  readonly width: number;
  readonly height: number;
  /** 투명 있음: PNG 색 유형 4·6 또는 tRNS · WebP VP8X 알파 플래그 또는 VP8L. JPEG = 없음. */
  readonly alpha: boolean;
}

export const MAX_PIXELS = 40_000_000;
export const MAX_SIDE = 16_384;

export const exceedsPixelLimit = (width: number, height: number): boolean =>
  width > MAX_SIDE || height > MAX_SIDE || width * height > MAX_PIXELS;

const u16be = (b: Uint8Array, i: number): number => ((b[i] ?? 0) << 8) | (b[i + 1] ?? 0);
const u32be = (b: Uint8Array, i: number): number => (u16be(b, i) * 0x10000 + u16be(b, i + 2)) >>> 0;
const u16le = (b: Uint8Array, i: number): number => (b[i] ?? 0) | ((b[i + 1] ?? 0) << 8);
const u24le = (b: Uint8Array, i: number): number => u16le(b, i) | ((b[i + 2] ?? 0) << 16);
const u32le = (b: Uint8Array, i: number): number => (u16le(b, i) + u16le(b, i + 2) * 0x10000) >>> 0;
const tag = (b: Uint8Array, i: number): string => String.fromCharCode(b[i] ?? 0, b[i + 1] ?? 0, b[i + 2] ?? 0, b[i + 3] ?? 0);

const valid = (width: number, height: number, alpha: boolean): ImageHeader | null =>
  width > 0 && height > 0 ? { width, height, alpha } : null;

function readPng(b: Uint8Array): ImageHeader | null {
  // 서명 8 + IHDR(길이 4 · 이름 4 · 데이터 13 · CRC 4)
  if (b.length < 33 || tag(b, 12) !== "IHDR") return null;
  const width = u32be(b, 16);
  const height = u32be(b, 20);
  const colorType = b[25];
  let alpha = colorType === 4 || colorType === 6;
  let offset = 33;
  while (!alpha && offset + 8 <= b.length) {
    const type = tag(b, offset + 4);
    if (type === "IDAT" || type === "IEND") break;
    if (type === "tRNS") alpha = true;
    offset += 12 + u32be(b, offset);
  }
  return valid(width, height, alpha);
}

/** SOF0~SOF15 중 DHT(C4)·JPG(C8)·DAC(CC) 제외 */
const isSof = (marker: number): boolean => marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
/** 길이 없는 마커: TEM(01) · RST0~7(D0~D7) */
const isStandalone = (marker: number): boolean => marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7);

function readJpeg(b: Uint8Array): ImageHeader | null {
  let offset = 2;
  while (offset < b.length) {
    if (b[offset] !== 0xff) return null;
    while (b[offset] === 0xff) offset += 1; // 채움 바이트
    const marker = b[offset];
    offset += 1;
    if (marker === undefined || marker === 0xd9 || marker === 0xda) return null; // SOF 전에 EOI·SOS
    if (isStandalone(marker)) continue;
    if (offset + 2 > b.length) return null;
    const length = u16be(b, offset);
    if (length < 2) return null;
    if (isSof(marker)) {
      if (offset + 7 > b.length) return null;
      return valid(u16be(b, offset + 5), u16be(b, offset + 3), false);
    }
    offset += length;
  }
  return null;
}

function readWebp(b: Uint8Array): ImageHeader | null {
  const chunk = tag(b, 12);
  const data = 20;
  if (chunk === "VP8 ") {
    if (b.length < data + 10 || b[data + 3] !== 0x9d || b[data + 4] !== 0x01 || b[data + 5] !== 0x2a) return null;
    return valid(u16le(b, data + 6) & 0x3fff, u16le(b, data + 8) & 0x3fff, false);
  }
  if (chunk === "VP8L") {
    if (b.length < data + 5 || b[data] !== 0x2f) return null;
    const bits = u32le(b, data + 1);
    return valid((bits & 0x3fff) + 1, ((bits >>> 14) & 0x3fff) + 1, true);
  }
  if (chunk === "VP8X") {
    if (b.length < data + 10) return null;
    return valid(u24le(b, data + 4) + 1, u24le(b, data + 7) + 1, ((b[data] ?? 0) & 0x10) !== 0);
  }
  return null;
}

export function readImageHeader(format: ImageFormat, bytes: Uint8Array): ImageHeader | null {
  if (format === "png") return readPng(bytes);
  if (format === "jpeg") return readJpeg(bytes);
  return readWebp(bytes);
}
