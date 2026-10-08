/**
 * 가져오기 ⑤ 이미지 (P2-SPEC 3.3 ⑤ · Jarvis 채택 결정 2 · THREATS T4 "디코드·재인코딩 재통과").
 * 한도(디코드 전, IM-5) → 레코드 규칙(readImageRecord와 같은 규칙: 형식·변·픽셀·사다리·bytes 합·머리 서명 + 엄격 base64, IM-6)
 * → 변형본마다 디코드 성공 + 치수 = 사다리 → **업로드 경로와 같은 인코더**(IngestDeps.encode · chooseFormat 설정)로 다시 인코딩한 바이트를 돌려준다.
 * 재인코딩이 덧붙은 바이트(폴리글롯)·메타데이터를 지운다. 변형본은 1개씩 디코드하고 bitmap은 성공·실패 모두 닫는다.
 */
import { browserIngestDeps, type IngestBitmap, type IngestDeps } from "../studio/images/ingest/deps";
import { formatFromMagic } from "../studio/images/ingest/fileType";
import { chooseFormat, type EncodeChoice } from "../studio/images/ingest/format";
import { variantHeight, widthLadder } from "../studio/images/ingest/ladder";
import { exceedsPixelLimit, MAX_SIDE } from "../studio/images/ingest/limits";
import type { ImageFormat } from "../studio/images/ingest/types";
import { MAX_IMAGE_BYTES, MAX_IMAGE_COUNT, failure, type CheckFailure } from "./format";

/** 검사·재인코딩을 마친 이미지 — 변형본 = 재인코딩 Blob(키 = 사다리 폭) · bytes = 새 변형본 합 */
export interface CheckedImage {
  readonly localId: string;
  readonly width: number;
  readonly height: number;
  readonly format: ImageFormat;
  readonly bytes: number;
  readonly variants: Readonly<Record<string, Blob>>;
}

/** 업로드 경로(ingestImage)가 그 형식을 고를 때와 같은 설정 — 품질 값을 따로 두지 않는다 */
const ENCODERS: Readonly<Record<ImageFormat, EncodeChoice>> = { webp: chooseFormat(false, true), jpeg: chooseFormat(false, false), png: chooseFormat(true, false) };
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const MAGIC_BYTES = 16;

type Loose = Record<string, unknown>;
const isSide = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= MAX_SIDE;
const isFormat = (v: unknown): v is ImageFormat => typeof v === "string" && Object.hasOwn(ENCODERS, v);

/** 엄격 base64 → 바이트 · 규칙 밖 = undefined */
function decodeBase64(text: unknown): Uint8Array | undefined {
  if (typeof text !== "string" || !BASE64.test(text)) return undefined;
  try {
    return Uint8Array.from(atob(text), (c) => c.charCodeAt(0));
  } catch {
    return undefined;
  }
}

const headOf = async (blob: Blob) => formatFromMagic(new Uint8Array(await blob.slice(0, MAGIC_BYTES).arrayBuffer()));

/** 레코드 규칙 → 원본 변형본 Blob(사다리 순) · 규칙 밖 = undefined */
async function ruledVariants(image: Loose): Promise<readonly (readonly [number, Blob])[] | undefined> {
  const { width, height, format, bytes, variants } = image;
  if (!isSide(width) || !isSide(height) || exceedsPixelLimit(width, height) || !isFormat(format) || !variants || typeof variants !== "object") return undefined;
  const ladder = widthLadder(width);
  const entries = Object.entries(variants as Loose);
  if (entries.length !== ladder.length || entries.some(([w], i) => w !== String(ladder[i]))) return undefined;
  const decoded = entries.map(([, text]) => decodeBase64(text));
  if (decoded.some((b) => b === undefined)) return undefined;
  const blobs = decoded.map((b) => new Blob([b as BlobPart], { type: `image/${format}` }));
  if (bytes !== blobs.reduce((sum, blob) => sum + blob.size, 0)) return undefined;
  const heads = await Promise.all(blobs.map(headOf));
  return heads.every((f) => f === format) ? ladder.map((w, i) => [w, blobs[i]!] as const) : undefined;
}

/** 변형본 1개 — 디코드 · 치수 = 사다리 · 같은 인코더로 재인코딩(형식 그대로) */
async function reencode(blob: Blob, width: number, height: number, source: { width: number; height: number; format: ImageFormat }, deps: IngestDeps): Promise<Blob> {
  let bitmap: IngestBitmap | undefined;
  try {
    bitmap = await deps.createImageBitmap(blob, {});
    if (bitmap.width !== width || bitmap.height !== height) throw new Error(`치수 ${bitmap.width} × ${bitmap.height}`);
    const choice = ENCODERS[source.format];
    const out = await deps.encode(bitmap, choice.type, choice.quality);
    if (out.type !== choice.type || (await headOf(out)) !== source.format) throw new Error(`인코딩 형식 ${out.type}`);
    return out;
  } finally {
    bitmap?.close();
  }
}

async function checkOne(image: Loose, deps: IngestDeps): Promise<CheckedImage | undefined> {
  const ruled = await ruledVariants(image);
  if (!ruled) return undefined;
  const source = { width: image.width as number, height: image.height as number, format: image.format as ImageFormat };
  const variants: Array<readonly [string, Blob]> = [];
  try {
    for (const [w, blob] of ruled) variants.push([String(w), await reencode(blob, w, variantHeight(source.width, source.height, w), source, deps)]);
  } catch {
    return undefined;
  }
  return { localId: image.localId as string, ...source, bytes: variants.reduce((sum, [, b]) => sum + b.size, 0), variants: Object.fromEntries(variants) };
}

const idOk = (image: unknown, i: number, all: readonly unknown[]): image is Loose => {
  const id = (image as Loose | null)?.localId;
  return typeof id === "string" && id !== "" && !id.includes("/") && all.findIndex((o) => (o as Loose | null)?.localId === id) === i;
};

export async function checkImages(images: readonly unknown[], deps: IngestDeps = browserIngestDeps): Promise<{ readonly ok: true; readonly images: readonly CheckedImage[] } | CheckFailure> {
  if (images.length > MAX_IMAGE_COUNT) return failure("IM-5");
  if (!images.every(idOk) || !images.every((im) => Number.isSafeInteger(im.bytes) && (im.bytes as number) >= 0)) return failure("IM-6");
  if (images.reduce((sum, im) => sum + (im.bytes as number), 0) > MAX_IMAGE_BYTES) return failure("IM-5");
  const checked: CheckedImage[] = [];
  for (const image of images) {
    const one = await checkOne(image, deps);
    if (!one) return failure("IM-6");
    checked.push(one);
  }
  return checked.reduce((sum, im) => sum + im.bytes, 0) > MAX_IMAGE_BYTES ? failure("IM-5") : { ok: true, images: checked };
}
