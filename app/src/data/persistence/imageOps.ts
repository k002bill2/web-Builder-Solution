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

/**
 * 문서 쓰기에 얹을 이미지 op — put = 참조 ∩ 맵 − 커밋 확인됨(settled) · delete = 이 프로젝트의 있을 수 있는 id(known = 확인됨 ∪ 진행 중) 중 참조 밖.
 * 진행 중(미확인) put은 settled가 아니므로 다시 낸다(같은 키 put 멱등 — 앞 트랜잭션 성공에 기대지 않는다 · Codex r2 P1)
 */
export function imageOps(projectId: string, record: DocRecord, images: RenderImages | undefined, settled: ReadonlySet<string>, known: ReadonlySet<string> = settled): WriteOp[] {
  const prefix = imageRecordId(projectId, "");
  // 넣을 것(맵)도 지울 것(이 프로젝트 저장 id)도 없으면 참조 집합을 재지 않는다
  if (!images && ![...known].some((id) => id.startsWith(prefix))) return [];
  const refs = recordRefs(record);
  const puts = [...refs].flatMap((localId): WriteOp[] => {
    const id = imageRecordId(projectId, localId);
    const held = images?.[localId];
    const meta = held && imageMeta(held);
    if (settled.has(id) || !meta) return [];
    const { variants, width, height, format, bytes } = meta;
    return [{ type: "put", store: "images", record: { schemaVersion: SCHEMA_VERSION, kind: "image", id, data: { variants, width, height, format, bytes } } }];
  });
  const deletes = [...known].flatMap((id): WriteOp[] => (id.startsWith(prefix) && !refs.has(id.slice(prefix.length)) ? [{ type: "delete", store: "images", id }] : []));
  return [...puts, ...deletes];
}
