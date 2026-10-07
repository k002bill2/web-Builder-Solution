/**
 * StudioPersistence IndexedDB 구현 (ADR-007 3절 (a)) — 브라우저 API 직접(새 의존성 0), 트랜잭션 1개 = Promise 1개.
 * 조작 뒤 청크 몫: 저장소 만들기·버전 이행(`onupgradeneeded`)·쓰기. 진입 읽기는 `entryRead`(작게 분리).
 * 쓰기 resolve = 트랜잭션 complete 이벤트(Codex 제약 3 — 저장 성공 = IDB 커밋 확인). 오류·abort·blocked·quota = INFRA.
 * jsdom에는 IndexedDB가 없어 트랜잭션 동작은 브라우저 실측 몫이고, 단위 테스트는 업그레이드 단계·오류 분류만 본다.
 */
import { DB_NAME, STORE_NAMES } from "./envelope";
import { done } from "./entryRead";
import { toInfra } from "./infra";
import type { StudioPersistence, WriteOp } from "./studioPersistence";

/** 1 = 진입 읽기가 버전 없이 열어 생길 수 있는 빈 DB · 2 = 3절 저장소 7개 */
export const DB_VERSION = 2;

type UpgradeTarget = {
  readonly objectStoreNames: { contains(name: string): boolean };
  createObjectStore(name: string): unknown;
};

/** 버전별 단계 — 인덱스 i = 버전 i+1로 올리는 단계. 다음 이행은 여기에 단계를 더하고 DB_VERSION을 올린다 */
const STEPS: readonly ((db: UpgradeTarget) => void)[] = [
  () => {},
  (db) => STORE_NAMES.filter((name) => !db.objectStoreNames.contains(name)).forEach((name) => db.createObjectStore(name)),
];

export function upgradeDatabase(db: UpgradeTarget, oldVersion: number, newVersion: number) {
  STEPS.slice(oldVersion, newVersion).forEach((step) => step(db));
}

type OpTarget = {
  objectStore(name: string): { put(value: unknown, key: string): unknown; delete(key: string): unknown };
  abort(): void;
};

/** 트랜잭션에 ops를 순서대로 — 중간 op가 동기로 던지면(DataCloneError 등) abort해 앞 put이 자동 커밋되지 않게 한다(전부 아니면 전무) */
export function applyOps(tx: OpTarget, ops: readonly WriteOp[]) {
  try {
    for (const op of ops) {
      if (op.type === "put") tx.objectStore(op.store).put(op.record, op.record.id);
      else tx.objectStore(op.store).delete(op.id);
    }
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // 이미 끝난 트랜잭션 — 원래 오류를 던진다
    }
    throw error;
  }
}

const txDone = (tx: IDBTransaction) =>
  new Promise<void>((ok, ko) => {
    tx.oncomplete = () => ok();
    tx.onerror = () => ko(tx.error);
    tx.onabort = () => ko(tx.error ?? new DOMException("aborted", "AbortError"));
  });

export async function openIdbPersistence(factory: IDBFactory = indexedDB, name = DB_NAME): Promise<StudioPersistence> {
  const db = await new Promise<IDBDatabase>((ok, ko) => {
    let blocked = false;
    const request = factory.open(name, DB_VERSION);
    request.onupgradeneeded = (event) => upgradeDatabase(request.result, event.oldVersion, event.newVersion ?? DB_VERSION);
    request.onblocked = () => {
      blocked = true;
      ko(new DOMException("blocked", "BlockedError"));
    };
    // blocked로 이미 실패를 돌려준 뒤 늦게 열리면 닫는다 — 남은 연결이 다음 업그레이드를 막지 않게
    request.onsuccess = () => (blocked ? request.result.close() : ok(request.result));
    request.onerror = () => ko(request.error);
  }).catch((error: unknown) => {
    throw toInfra(error, "열기");
  });
  db.onversionchange = () => db.close();

  const read = async <T>(work: () => IDBRequest<T>) => {
    try {
      return await done(work());
    } catch (error) {
      throw toInfra(error, "읽기");
    }
  };

  return {
    get: (store, id) => read(() => db.transaction(store).objectStore(store).get(id)),
    getAll: (store) => read(() => db.transaction(store).objectStore(store).getAll()),
    write: async (ops) => {
      if (ops.length === 0) return;
      try {
        const tx = db.transaction([...new Set(ops.map((op) => op.store))], "readwrite");
        const committed = txDone(tx);
        committed.catch(() => undefined); // applyOps가 던지면 abort된 committed는 기다리지 않는다
        applyOps(tx, ops);
        await committed;
      } catch (error) {
        throw toInfra(error, "저장");
      }
    },
    close: () => db.close(),
  };
}
