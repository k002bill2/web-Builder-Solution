/**
 * 이미지 레코드 (ADR-007 3절 (a) `images` · P1b) — 싱크 쓰기(imageOps)와 복원 본문이 함께 쓰는 키·참조 집합·읽기 검증. 진입 청크는 import하지 않는다.
 * 저장 전용 op 조립은 imageOps.ts — 자동 복원 청크(ADR-004 개정 11)가 받지 않게 나눴다.
 * - 키 = `[projectId, localId]`를 봉투 문자열 id `projectId/localId`로(writeQueue 레코드 키·어댑터 키 = 봉투 id).
 * - 값 = 변형본 Blob 전부 + 메타(width·height·format·bytes) — imageStore 메타 WeakMap은 Blob 정체성 기반이라 복원되지 않는다(2절 7).
 * - 쓰기 = 문서 레코드와 같은 트랜잭션(문서가 참조하는데 이미지가 없는 저장 상태를 만들지 않는다). 정리 = 2a-05 5.9 참조 집합(`retainedIds`) 그대로.
 * - 읽기 검증 = 저장(변환기) 규칙과 1:1 — 형식 목록·바이트 서명(formatFromMagic)·폭 사다리(widthLadder)·변 길이·픽셀 한도·bytes = 변형본 합.
 */
import { formatFromMagic } from "../../features/studio/images/ingest/fileType";
import { exceedsPixelLimit, MAX_SIDE } from "../../features/studio/images/ingest/limits";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { retainedIds } from "../../features/studio/images/store/imageStore";
import { checkEnvelope } from "./envelope";
import type { DocRecord } from "./entryRead";

/** 문서 모양 = imageStore가 받는 PageDoc — engine을 직접 import하지 않는다(engineImportGuard: data/ 허용 목록 밖) */
type PageDoc = Parameters<typeof retainedIds>[0];

export const imageRecordId = (projectId: string, localId: string) => `${projectId}/${localId}`;

/** 저장된 문서·스냅샷의 참조 집합(5.9 — 되돌릴 문서는 영속하지 않으므로 빠진다) */
export const recordRefs = (record: DocRecord): ReadonlySet<string> =>
  retainedIds(record.doc as unknown as PageDoc, undefined, record.snapshots.map((s) => s.doc as unknown as PageDoc));

const FORMATS: readonly string[] = ["jpeg", "png", "webp"];
const isSide = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 1 && (v as number) <= MAX_SIDE;

/** 레코드 → 변환기 결과 모양 · 저장 규칙 밖이면 undefined(잃은 이미지 경로) */
export async function readImageRecord(record: unknown, id: string): Promise<IngestedImage | undefined> {
  const env = checkEnvelope(record, "image", id);
  if (env.status !== "ok") return undefined;
  const data = env.data as Partial<IngestedImage> | null;
  const { variants, width, height, format, bytes } = data ?? {};
  if (!isSide(width) || !isSide(height) || exceedsPixelLimit(width, height) || !FORMATS.includes(format as string) || !variants || typeof variants !== "object") return undefined;
  const entries = Object.entries(variants);
  const ladder = widthLadder(width).map(String);
  if (entries.length !== ladder.length || entries.some(([w, blob], i) => w !== ladder[i] || !(blob instanceof Blob))) return undefined;
  const blobs = entries.map(([, blob]) => blob as Blob);
  if (bytes !== blobs.reduce((sum, blob) => sum + blob.size, 0)) return undefined;
  const heads = await Promise.all(blobs.map(async (blob) => formatFromMagic(new Uint8Array(await blob.slice(0, 16).arrayBuffer()))));
  return heads.every((f) => f === format) ? { variants: variants as IngestedImage["variants"], width, height, format: format as IngestedImage["format"], bytes } : undefined;
}
