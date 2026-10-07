/**
 * 이미지 레코드 (ADR-007 3절 (a) `images` · P1b) — 조작 뒤 청크 몫(싱크 쓰기 · 복원 본문). 진입 청크는 import하지 않는다.
 * - 키 = `[projectId, localId]`를 봉투 문자열 id `projectId/localId`로(writeQueue 레코드 키·어댑터 키 = 봉투 id).
 * - 값 = 변형본 Blob 전부 + 메타(width·height·format·bytes) — imageStore 메타 WeakMap은 Blob 정체성 기반이라 복원되지 않는다(2절 7).
 * - 쓰기 = 문서 레코드와 같은 트랜잭션(문서가 참조하는데 이미지가 없는 저장 상태를 만들지 않는다). 정리 = 2a-05 5.9 참조 집합(`retainedIds`) 그대로.
 * - 읽기 검증 = 저장(변환기) 규칙과 1:1 — 형식 목록·바이트 서명(formatFromMagic)·폭 사다리(widthLadder)·변 길이·픽셀 한도·bytes = 변형본 합.
 */
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { formatFromMagic } from "../../features/studio/images/ingest/fileType";
import { exceedsPixelLimit, MAX_SIDE } from "../../features/studio/images/ingest/header";
import { widthLadder } from "../../features/studio/images/ingest/ladder";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { imageMeta, retainedIds } from "../../features/studio/images/store/imageStore";
import type { RenderImages } from "../../features/studio/images/store/types";
import { SCHEMA_VERSION, checkEnvelope } from "./envelope";
import type { DocRecord } from "./entryRead";
import type { WriteOp } from "./studioPersistence";

export const imageRecordId = (projectId: string, localId: string) => `${projectId}/${localId}`;

/** 저장된 문서·스냅샷의 참조 집합(5.9 — 되돌릴 문서는 영속하지 않으므로 빠진다) */
export const recordRefs = (record: DocRecord): ReadonlySet<string> =>
  retainedIds(record.doc as unknown as PageDoc, undefined, record.snapshots.map((s) => s.doc as unknown as PageDoc));

/** 문서 쓰기에 얹을 이미지 op — put = 참조 ∩ 맵 − 저장됨 · delete = 이 프로젝트의 저장 id 중 참조 밖 */
export function imageOps(projectId: string, record: DocRecord, images: RenderImages | undefined, stored: ReadonlySet<string>): WriteOp[] {
  const prefix = imageRecordId(projectId, "");
  // 넣을 것(맵)도 지울 것(이 프로젝트 저장 id)도 없으면 참조 집합을 재지 않는다
  if (!images && ![...stored].some((id) => id.startsWith(prefix))) return [];
  const refs = recordRefs(record);
  const puts = [...refs].flatMap((localId): WriteOp[] => {
    const id = imageRecordId(projectId, localId);
    const held = images?.[localId];
    const meta = held && imageMeta(held);
    if (stored.has(id) || !meta) return [];
    const { variants, width, height, format, bytes } = meta;
    return [{ type: "put", store: "images", record: { schemaVersion: SCHEMA_VERSION, kind: "image", id, data: { variants, width, height, format, bytes } } }];
  });
  const deletes = [...stored].flatMap((id): WriteOp[] => (id.startsWith(prefix) && !refs.has(id.slice(prefix.length)) ? [{ type: "delete", store: "images", id }] : []));
  return [...puts, ...deletes];
}

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
