/**
 * 내보내기 파일 만들기 (P2-SPEC 2.1 · 3.2 메모리 규칙 ③ · 3.6 자기 거절 파일 금지) — 큰 문자열 1개를 만들지 않고 조각 배열 → `new Blob(parts)`.
 * 이미지는 변형본 1개씩 base64(패딩 있는 표준·줄바꿈 0)로 바꾼다. 가져오기 ①·⑤와 같은 한도를 넘으면 내려받기 0(EX-12).
 */
import type { DocRecord } from "../../data/persistence/entryRead";
import type { Project } from "../../data/projectRepository";
import type { ProfileVersion } from "../../domain/profile";
import type { IngestedImage } from "../studio/images/ingest/types";
import { EXPORT_TOO_LARGE, FILE_FORMAT, FORMAT_VERSION, MAX_FILE_BYTES, MAX_IMAGE_BYTES, MAX_IMAGE_COUNT, SCHEMA } from "./format";

/** IDB에 커밋된 그 프로젝트(3.6 읽기 결과) */
export interface ExportSource {
  readonly project: Project;
  readonly series: readonly ProfileVersion[];
  readonly doc: DocRecord | null;
  readonly images: readonly { readonly localId: string; readonly image: IngestedImage }[];
  readonly exportedAt: string;
}
export type ExportResult = { readonly ok: true; readonly blob: Blob } | { readonly ok: false; readonly message: string };

export const exportLimitHolds = ({ count, bytes, size }: { readonly count: number; readonly bytes: number; readonly size: number }): boolean =>
  count <= MAX_IMAGE_COUNT && bytes <= MAX_IMAGE_BYTES && size <= MAX_FILE_BYTES;

const CHUNK = 0x8000;
async function base64Of(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  const pieces: string[] = [];
  for (let i = 0; i < bytes.length; i += CHUNK) pieces.push(String.fromCharCode(...bytes.subarray(i, i + CHUNK)));
  return btoa(pieces.join(""));
}

async function imagePart({ localId, image }: ExportSource["images"][number]): Promise<string> {
  const variants: Array<readonly [string, string]> = [];
  for (const [width, blob] of Object.entries(image.variants)) if (blob) variants.push([width, await base64Of(blob)]);
  const { width, height, format, bytes } = image;
  return JSON.stringify({ localId, width, height, format, bytes, variants: Object.fromEntries(variants) });
}

export async function encodeProjectFile(source: ExportSource): Promise<ExportResult> {
  const count = source.images.length;
  const bytes = source.images.reduce((sum, { image }) => sum + image.bytes, 0);
  const tooLarge = { ok: false, message: EXPORT_TOO_LARGE } as const;
  if (!exportLimitHolds({ count, bytes, size: 0 })) return tooLarge;
  const { project, series, doc, exportedAt } = source;
  const head = JSON.stringify({ format: FILE_FORMAT, formatVersion: FORMAT_VERSION, schemaVersion: SCHEMA, exportedAt, project, series, doc });
  const parts: string[] = [`${head.slice(0, -1)},"images":[`];
  for (const [i, entry] of source.images.entries()) parts.push(`${i === 0 ? "" : ","}${await imagePart(entry)}`);
  parts.push("]}");
  const blob = new Blob(parts, { type: "application/json" });
  return exportLimitHolds({ count, bytes, size: blob.size }) ? { ok: true, blob } : tooLarge;
}
