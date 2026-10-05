/**
 * V1~V4 형식·크기 검사 (SPEC 2.3 · TR-SEC-04). 확장자·MIME·매직 바이트 세 신호가 같은 형식을 가리켜야 통과한다.
 * MIME 빈 값(일부 OS)은 V3에 맡긴다.
 */
import type { ImageFormat } from "./types";

/** 10MB(MQ-C1 ★A). 명세에 단위가 없어 10 × 1024 × 1024 바이트(너그러운 쪽)로 둔다 — 문구의 MB도 같은 단위. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MEGABYTE = 1024 * 1024;

const EXTENSIONS: Readonly<Record<string, ImageFormat>> = { jpg: "jpeg", jpeg: "jpeg", png: "png", webp: "webp" };
const MIME_TYPES: Readonly<Record<string, ImageFormat>> = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp" };

export function formatFromName(name: string): ImageFormat | null {
  const dot = name.lastIndexOf(".");
  if (dot < 0) return null;
  return EXTENSIONS[name.slice(dot + 1).toLowerCase()] ?? null;
}

export function formatFromMime(type: string): ImageFormat | null | "empty" {
  if (type === "") return "empty";
  return MIME_TYPES[type.toLowerCase()] ?? null;
}

const startsWith = (bytes: Uint8Array, offset: number, pattern: readonly number[]): boolean =>
  bytes.length >= offset + pattern.length && pattern.every((b, k) => bytes[offset + k] === b);

const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

/** 앞 16바이트(이상)에서 형식을 읽는다. */
export function formatFromMagic(head: Uint8Array): ImageFormat | null {
  if (startsWith(head, 0, JPEG_MAGIC)) return "jpeg";
  if (startsWith(head, 0, PNG_MAGIC)) return "png";
  if (head.length >= 16 && startsWith(head, 0, RIFF) && startsWith(head, 8, WEBP)) return "webp";
  return null;
}

export function checkFileType(name: string, type: string, head: Uint8Array): ImageFormat | null {
  const byName = formatFromName(name);
  if (byName === null) return null;
  const byMime = formatFromMime(type);
  if (byMime === null || (byMime !== "empty" && byMime !== byName)) return null;
  return formatFromMagic(head) === byName ? byName : null;
}

export const exceedsFileSize = (size: number): boolean => size > MAX_FILE_BYTES;

export const formatMegabytes = (bytes: number): string => `${(bytes / MEGABYTE).toFixed(1)}MB`;
