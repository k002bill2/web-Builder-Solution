/**
 * 이미지 저장 op (ADR-007 3절 (a) · P1b) — 문서 쓰기 트랜잭션에 얹는다(localSync.flush). 싱크 쓰기 청크 몫 —
 * 자동 복원 청크(ADR-004 개정 11 "저장 데이터 복원 진입")가 받지 않도록 imageRecord(키·참조 집합·읽기 검증)와 나눴다.
 */
import { imageMeta } from "../../features/studio/images/store/imageStore";
import type { RenderImages } from "../../features/studio/images/store/types";
import { SCHEMA_VERSION } from "./envelope";
import type { DocRecord } from "./entryRead";
import { imageRecordId, recordRefs } from "./imageRecord";
import type { WriteOp } from "./studioPersistence";

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
