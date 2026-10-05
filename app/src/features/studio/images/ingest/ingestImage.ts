/**
 * 이미지 변환기 (SPEC 2.3~2.6 · PLAN 2절 공개 API). 검사 순서 고정 V1→V6 — 앞 단계 실패면 뒤 단계 안 함.
 * 디코드 전(V1~V5)에 형식·크기·화소를 거르고, 디코드(방향 적용) 뒤 폭 사다리마다 캔버스로 재인코딩한다.
 * 원본은 보관하지 않는다: 결과에는 파생본 Blob과 메타만 담고, 만든 bitmap은 성공·실패 모두 close.
 */
import { browserIngestDeps, type IngestBitmap, type IngestDeps } from "./deps";
import { exceedsFileSize, formatFromMagic, formatFromNameAndMime, formatMegabytes } from "./fileType";
import { chooseFormat, probeWebp, type EncodeChoice } from "./format";
import { exceedsPixelLimit, readImageHeader } from "./header";
import { variantHeight, widthLadder } from "./ladder";
import type { IngestedImage, IngestErrorCode, IngestResult } from "./types";

const MAGIC_BYTES = 16;
const WEBP_PROBE_QUALITY = 0.82;

const fail = (code: IngestErrorCode, detail?: string): IngestResult =>
  detail === undefined ? { ok: false, code } : { ok: false, code, detail };

/** 파일 읽기 실패(삭제·변경·저장 장치 끊김 — NotReadableError)는 null → DECODE_FAILED 결과로 돌려준다(reject 아님). */
const readBytes = (blob: Blob): Promise<Uint8Array | null> =>
  blob.arrayBuffer().then(
    (buffer) => new Uint8Array(buffer),
    () => null,
  );

interface ScaleState {
  /** `resizeWidth`가 무시되는 환경(SPEC 11절)으로 판명되면 그 뒤는 캔버스 단계 축소 */
  canvasFallback: boolean;
}

const sameSize = (bitmap: IngestBitmap, width: number, height: number): boolean => bitmap.width === width && bitmap.height === height;

/** 한 단계 축소. 결과 크기가 요청과 다르면 캔버스 대체로 바꾸고, 대체도 다르면 던진다(무한 반복 0). */
async function resizeStep(current: IngestBitmap, width: number, height: number, deps: IngestDeps, state: ScaleState): Promise<IngestBitmap> {
  if (!state.canvasFallback) {
    const next = await deps.createImageBitmap(current, { resizeWidth: width, resizeHeight: height, resizeQuality: "high" });
    if (sameSize(next, width, height)) return next;
    next.close();
    state.canvasFallback = true;
  }
  const drawn = await deps.drawScaled(current, width, height);
  if (sameSize(drawn, width, height)) return drawn;
  drawn.close();
  throw new Error(`축소 결과 크기 불일치: ${drawn.width} × ${drawn.height}`);
}

/** 목표 폭까지 반씩 단계 축소(한 번에 절반 아래로 줄이지 않는다). 만든 중간 bitmap은 `created`에 모아 호출 쪽이 닫는다. */
async function scaleTo(source: IngestBitmap, width: number, height: number, deps: IngestDeps, created: IngestBitmap[], state: ScaleState): Promise<IngestBitmap> {
  let current = source;
  while (current.width !== width) {
    const halving = current.width / 2 > width;
    const stepWidth = halving ? Math.ceil(current.width / 2) : width;
    const stepHeight = halving ? Math.max(1, Math.ceil(current.height / 2)) : height;
    current = await resizeStep(current, stepWidth, stepHeight, deps, state);
    created.push(current);
  }
  return current;
}

function detectWebp(bitmap: IngestBitmap, deps: IngestDeps, created: IngestBitmap[]): Promise<boolean> {
  return probeWebp(deps.encode, async () => {
    const tiny = await deps.createImageBitmap(bitmap, { resizeWidth: 1, resizeHeight: 1, resizeQuality: "high" });
    created.push(tiny);
    return deps.encode(tiny, "image/webp", WEBP_PROBE_QUALITY);
  });
}

async function encodeVariants(bitmap: IngestBitmap, alpha: boolean, deps: IngestDeps, created: IngestBitmap[]): Promise<IngestedImage> {
  const choice: EncodeChoice = chooseFormat(alpha, await detectWebp(bitmap, deps, created));
  const widths = widthLadder(bitmap.width).slice().reverse(); // 큰 폭부터 — 다음 단은 앞 단에서 줄인다
  const encoded: Array<readonly [number, Blob]> = [];
  const state: ScaleState = { canvasFallback: false };
  let source = bitmap;
  for (const width of widths) {
    source = await scaleTo(source, width, variantHeight(bitmap.width, bitmap.height, width), deps, created, state);
    const blob = await deps.encode(source, choice.type, choice.quality);
    if (blob.type !== choice.type) throw new Error(`인코딩 형식 불일치: ${blob.type}`);
    encoded.push([width, blob]);
  }
  const ascending = encoded.slice().reverse();
  return {
    variants: Object.fromEntries(ascending),
    width: bitmap.width,
    height: bitmap.height,
    format: choice.format,
    bytes: ascending.reduce((sum, [, blob]) => sum + blob.size, 0),
  };
}

export async function ingestImage(file: File, deps: IngestDeps = browserIngestDeps): Promise<IngestResult> {
  const format = formatFromNameAndMime(file.name, file.type); // V1·V2 — 바이트를 읽기 전
  if (format === null) return fail("TYPE_MISMATCH");
  const head = await readBytes(file.slice(0, MAGIC_BYTES));
  if (head === null) return fail("DECODE_FAILED");
  if (formatFromMagic(head) !== format) return fail("TYPE_MISMATCH"); // V3
  if (exceedsFileSize(file.size)) return fail("TOO_LARGE", formatMegabytes(file.size));
  const bytes = await readBytes(file);
  const header = bytes === null ? null : readImageHeader(format, bytes);
  if (header === null) return fail("DECODE_FAILED");
  if (exceedsPixelLimit(header.width, header.height)) return fail("TOO_MANY_PIXELS", `${header.width} × ${header.height}`);

  let bitmap: IngestBitmap;
  try {
    bitmap = await deps.createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return fail("DECODE_FAILED");
  }
  const created: IngestBitmap[] = [];
  try {
    return { ok: true, image: await encodeVariants(bitmap, header.alpha, deps, created) };
  } catch {
    return fail("DECODE_FAILED");
  } finally {
    created.forEach((each) => each.close());
    bitmap.close();
  }
}
