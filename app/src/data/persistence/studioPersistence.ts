/**
 * 영속 어댑터 (ADR-007 3절 (a) · P6 A) — 저장소별 봉투 레코드 읽기와 트랜잭션 단위 쓰기.
 * 구현 = IndexedDB(`idbPersistence`) · 메모리 가짜(아래, 단위 테스트용). 열기는 각 구현의 팩토리가 맡는다.
 */
import type { Envelope, StoreName } from "./envelope";
import { toInfra } from "./infra";

export type WriteOp =
  | { readonly type: "put"; readonly store: StoreName; readonly record: Envelope }
  | { readonly type: "delete"; readonly store: StoreName; readonly id: string };

export interface StudioPersistence {
  /** 봉투 확인 전 원본 레코드(확인은 호출자 — checkEnvelope·zod) · 없으면 undefined */
  get(store: StoreName, id: string): Promise<unknown>;
  /** 키 오름차순 */
  getAll(store: StoreName): Promise<readonly unknown[]>;
  /** 한 트랜잭션 — 커밋 완료(IDB complete) 뒤에만 resolve, 실패면 INFRA로 reject하고 쓰기 0건 */
  write(ops: readonly WriteOp[]): Promise<void>;
  close(): void;
}

export interface MemoryPersistenceOptions {
  /** 쓰기 트랜잭션 실패 주입 — seq는 write 호출 순번(1부터) */
  readonly fail?: (seq: number) => unknown;
  /** 커밋 지연 주입 — 이 Promise가 끝나야 커밋되고 resolve */
  readonly commit?: (seq: number) => Promise<void> | void;
}

type Tables = ReadonlyMap<StoreName, ReadonlyMap<string, unknown>>;

/** 메모리 가짜 — IDB처럼 넣을 때·읽을 때 structured clone(별칭·동결 차이를 숨기지 않는다), 트랜잭션은 전부 아니면 전무 */
export function createMemoryPersistence(options: MemoryPersistenceOptions = {}): StudioPersistence {
  let tables: Tables = new Map();
  let closed = false;
  let seq = 0;
  const live = (action: string) => {
    if (closed) throw toInfra(new DOMException("closed", "InvalidStateError"), action);
  };

  return {
    get: async (store, id) => {
      live("읽기");
      return structuredClone(tables.get(store)?.get(id));
    },
    getAll: async (store) => {
      live("읽기");
      const rows = [...(tables.get(store) ?? new Map<string, unknown>())].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      return rows.map(([, value]) => structuredClone(value));
    },
    write: async (ops) => {
      live("저장");
      seq += 1;
      const n = seq;
      const records = ops.map((op) => (op.type === "put" ? { ...op, record: structuredClone(op.record) } : op));
      await options.commit?.(n);
      const failure = options.fail?.(n);
      if (failure) throw toInfra(failure, "저장");
      // 커밋 시점 상태 위에 순서대로 — 겹친 트랜잭션은 IDB처럼 커밋 순서로 쌓인다
      const staged = new Map(tables);
      for (const op of records) {
        const table = new Map(staged.get(op.store));
        if (op.type === "put") table.set(op.record.id, op.record);
        else table.delete(op.id);
        staged.set(op.store, table);
      }
      tables = staged;
    },
    close: () => {
      closed = true;
    },
  };
}
