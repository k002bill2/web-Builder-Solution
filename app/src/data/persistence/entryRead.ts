/**
 * 진입 읽기 몫 (ADR-007 3절 하이드레이션 1단 · 개정 1) — IDB 열기 + 단건 읽기 + 수제 schemaVersion 확인만.
 * 쓰기 큐·이행·zod·저장소 만들기는 여기 두지 않는다(조작 뒤 청크 `idbPersistence`). P1a-2가 진입 경로에 둔다.
 * 버전 없이 연다: 처음이면 저장소 없는 빈 DB(v1)가 생길 수 있어 쓰기 쪽 DB_VERSION은 2 이상(그 업그레이드가 저장소를 만든다).
 * 오류는 원 오류 그대로 던진다 — 진입은 실패하면 메모리로 시작하므로 INFRA 분류(`infra`, 사유 문구)는 조작 뒤 몫(P1a-1 REPORT 6항 · 진입 바이트).
 */
import { DB_NAME, checkEnvelope, type EnvelopeCheck, type StoreName } from "./envelope";
import type { DocHead, ProjectSnapshot } from "../projectRepository";
import type { StudioState } from "../studioStore";

export const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((ok, ko) => {
    request.onsuccess = () => ok(request.result);
    request.onerror = () => ko(request.error);
  });

/** 저장소가 아직 없으면(첫 실행) 연결을 닫고 undefined = 빈 진입. 다른 탭의 버전 올리기를 막지 않게 versionchange면 닫는다 */
export async function openForEntry(factory: IDBFactory = indexedDB, name = DB_NAME): Promise<IDBDatabase | undefined> {
  const db = await done(factory.open(name));
  db.onversionchange = () => db.close();
  if (!db.objectStoreNames.contains("studio")) {
    db.close();
    return undefined;
  }
  return db;
}

export async function readEntryRecord(db: IDBDatabase, store: StoreName, kind: string, id: string): Promise<EnvelopeCheck> {
  return checkEnvelope(await done(db.transaction(store).objectStore(store).get(id)), kind, id);
}

/** 상태 레코드(studio 저장소 "state") = StudioState(잡은 StoredJob 통째로 — 개정 1) + 프로젝트별 문서 머리(목록 hasDoc) */
export interface LocalState extends StudioState {
  readonly heads: ReadonlyMap<string, DocHead>;
}
/** 문서 레코드(docs 저장소, id = projectId) — 문서 + 스냅샷 목록 */
export interface DocRecord {
  readonly doc: DocHead;
  readonly snapshots: readonly ProjectSnapshot<DocHead>[];
}
/** 진입 결과 — 상태 없음 = 첫 실행(빈 상태) */
export interface LocalEntry {
  readonly state?: LocalState;
  readonly doc?: DocRecord;
}

/**
 * 진입 하이드레이션 읽기(E0 안1-min) — 상태 1건 + 진입 문서 1건, 봉투는 수제 schemaVersion 확인만(모양 검증은 조작 뒤 localSync).
 * undefined = 메모리로 시작(IndexedDB 없음·열기 실패·버전 불일치·깨진 봉투 — 쓰기 0, 더 새 레코드를 덮지 않는다). 연결은 읽고 닫는다.
 */
export async function readEntry(projectId: string | undefined, factory = typeof indexedDB === "undefined" ? undefined : indexedDB): Promise<LocalEntry | undefined> {
  const db = factory && (await openForEntry(factory));
  if (!db) return factory && {};
  try {
    const [state, doc] = [await readEntryRecord(db, "studio", "state", "state"), projectId ? await readEntryRecord(db, "docs", "doc", projectId) : undefined];
    if (state.status === "ok" && doc?.status !== "mismatch" && doc?.status !== "invalid")
      return { state: state.data as LocalState, ...(doc?.status === "ok" && { doc: doc.data as DocRecord }) };
    return state.status === "missing" ? {} : undefined;
  } finally {
    db.close();
  }
}
