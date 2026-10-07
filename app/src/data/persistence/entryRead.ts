/**
 * 진입 읽기 몫 (ADR-007 3절 하이드레이션 1단 · 개정 1) — IDB 열기 + 단건 읽기 + 수제 schemaVersion 확인만.
 * 쓰기 큐·이행·zod·저장소 만들기는 여기 두지 않는다(조작 뒤 청크 `idbPersistence`). P1a-2가 진입 경로에 둔다.
 * 버전 없이 연다: 처음이면 저장소 없는 빈 DB(v1)가 생길 수 있어 쓰기 쪽 DB_VERSION은 2 이상(그 업그레이드가 저장소를 만든다).
 */
import { DB_NAME, checkEnvelope, type EnvelopeCheck, type StoreName } from "./envelope";
import { toInfra } from "./infra";

export const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((ok, ko) => {
    request.onsuccess = () => ok(request.result);
    request.onerror = () => ko(request.error);
  });

/** 저장소가 아직 없으면(첫 실행) 연결을 닫고 undefined = 빈 진입. 다른 탭의 버전 올리기를 막지 않게 versionchange면 닫는다 */
export async function openForEntry(factory: IDBFactory = indexedDB, name = DB_NAME): Promise<IDBDatabase | undefined> {
  let db: IDBDatabase;
  try {
    db = await done(factory.open(name));
  } catch (error) {
    throw toInfra(error, "열기");
  }
  db.onversionchange = () => db.close();
  if (!db.objectStoreNames.contains("studio")) {
    db.close();
    return undefined;
  }
  return db;
}

export async function readEntryRecord(db: IDBDatabase, store: StoreName, kind: string, id: string): Promise<EnvelopeCheck> {
  try {
    return checkEnvelope(await done(db.transaction(store).objectStore(store).get(id)), kind, id);
  } catch (error) {
    throw toInfra(error, "읽기");
  }
}
