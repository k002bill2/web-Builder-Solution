/**
 * 이미지 자동 복원 본문 (ADR-007 부록 Codex 제약 2 · P1b) — 편집 틀 마운트(맵 없음)에 조작 없이 받는 별도 청크. 진입 청크에는 로더만 둔다.
 * 저장된 문서·스냅샷의 참조 집합(5.9)만 읽어 레코드를 저장 규칙과 1:1로 검증(readImageRecord)하고, 슬롯 목표 폭 변형본으로 맵을 만든다(`addImage` —
 * 메타 WeakMap 재구성). 조립한 맵이 한도(checkLimits) 밖이면 아무것도 넣지 않는다. 읽지 못한 id는 맵에 없음 = 기존 잃은 이미지 경로(QB-10).
 */
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { IngestedImage } from "../../features/studio/images/ingest/types";
import { addImage, checkLimits, slotTarget } from "../../features/studio/images/store/imageStore";
import type { ImageHost, RenderImages } from "../../features/studio/images/store/types";
import { done, openForEntry, type DocRecord } from "./entryRead";
import { imageRecordId, readImageRecord, recordRefs } from "./imageRecord";

/** IDB 단건 읽기(진입 읽기 연결 함수 재사용) — 키마다 연결을 열지 않게 복원 1회에 연결 1개. 테스트가 메모리 가짜로 바꿔 끼운다 */
export const IMAGE_READ = {
  read: undefined as ((key: string) => Promise<unknown>) | undefined,
  async open(): Promise<{ read: (key: string) => Promise<unknown>; close: () => void }> {
    if (this.read) return { read: this.read, close: () => undefined };
    const db = await openForEntry();
    if (!db?.objectStoreNames.contains("images")) {
      db?.close();
      return { read: async () => undefined, close: () => undefined };
    }
    return { read: (key) => done(db.transaction("images").objectStore("images").get(key)), close: () => db.close() };
  },
};

/** 그 id를 참조하는 첫 슬롯(문서 → 스냅샷 순)의 동봉 폭 — 슬롯을 못 찾으면 가장 큰 폭 */
const targetOf = (docs: readonly PageDoc[], localId: string) => {
  for (const doc of docs)
    for (const section of doc.sections)
      for (const value of Object.values(section.slots)) if (typeof value === "object" && value.source === localId) return slotTarget(section.type, section.variant);
  return 1920;
};

export async function restoreImages(projectId: string, record: Partial<DocRecord> | undefined, publish: ImageHost[1]): Promise<void> {
  if (!record?.doc) return;
  const full = { doc: record.doc, snapshots: record.snapshots ?? [] };
  const ids = [...recordRefs(full)];
  if (ids.length === 0) return;
  const doc = full.doc as unknown as PageDoc;
  const snapshots = full.snapshots.map((s) => s.doc as unknown as PageDoc);
  const reader = await IMAGE_READ.open();
  let found: ReadonlyArray<readonly [string, IngestedImage | undefined]>;
  try {
    found = await Promise.all(ids.map(async (localId) => [localId, await readImageRecord(await reader.read(imageRecordId(projectId, localId)), imageRecordId(projectId, localId))] as const));
  } finally {
    reader.close();
  }
  const restored = found.reduce<RenderImages>((acc, [localId, image]) => (image ? addImage(acc, localId, image, targetOf([doc, ...snapshots], localId)) : acc), {});
  if (Object.keys(restored).length === 0 || !checkLimits(doc, undefined, restored, snapshots).ok) return;
  publish((prev) => (prev ? { ...restored, ...prev } : restored));
}
