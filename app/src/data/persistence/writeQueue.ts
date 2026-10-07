/**
 * 직렬 쓰기 큐 (ADR-007 3절 쓰기 방식 · 부록 Codex 제약 3) — 메모리 store가 커밋한 변경을 요청 단위로 한 트랜잭션씩 기록한다.
 * - 성공 = 커밋 확인: `persistence.write`가 resolve(IDB complete)한 뒤에만 resolve. SaveStatus "저장됨"은 이 뒤에만(P1a-2 배선).
 * - 순서: 앞 요청이 끝난(성공·실패) 뒤 다음 요청을 쓴다 — 같은 레코드는 뒤 쓰기가 앞 쓰기를 덮는다.
 * - 실패: INFRA로 reject하고 그 요청의 쓰기를 "미확인"으로 남긴다. 실패가 큐를 막지는 않는다(다음 요청은 그대로 처리).
 * - 멱등 재시도: 메모리 쪽 멱등 기록 때문에 재시도가 새 쓰기를 만들지 않으므로 `retry(요청 키)`가 미확인 기록을 재제출한다.
 *   같은 요청 키로 `submit`하면 새 쓰기에 남은 미확인 기록을 합쳐 한 트랜잭션으로 낸다.
 * - 최신 의도: 뒤에 제출된 요청이 같은 (저장소, id)를 쓰면 앞 요청의 미확인 기록에서 그 레코드는 빠진다 — 재시도가 옛 값으로 덮지 않는다.
 */
import type { StudioPersistence, WriteOp } from "./studioPersistence";

export type WriteStatus = "pending" | "unconfirmed";

export interface WriteQueue {
  submit(key: string, ops: readonly WriteOp[]): Promise<void>;
  /** 미확인 기록 재제출 · 진행 중이면 그 Promise · 둘 다 없으면(확인됨·덮임) 쓰기 0으로 resolve */
  retry(key: string): Promise<void>;
  /** 확인됐거나 모르는 키 = undefined */
  status(key: string): WriteStatus | undefined;
  /** 미확인 기록이 있는 요청 키(실패 순) */
  unconfirmed(): readonly string[];
}

interface Failed {
  readonly key: string;
  readonly seq: number;
  readonly ops: readonly WriteOp[];
}

const recordKey = (op: WriteOp) => `${op.store}\u0000${op.type === "put" ? op.record.id : op.id}`;

export function createWriteQueue(persistence: StudioPersistence): WriteQueue {
  let tail: Promise<unknown> = Promise.resolve();
  let seq = 0;
  /** 레코드 → 그 레코드를 마지막으로 제출한 요청 순번 */
  const latest = new Map<string, number>();
  const pending = new Map<string, Promise<void>>();
  let failed: readonly Failed[] = [];

  const stillLatest = (ops: readonly WriteOp[], s: number) => ops.filter((op) => latest.get(recordKey(op)) === s);

  function submit(key: string, ops: readonly WriteOp[]): Promise<void> {
    seq += 1;
    const s = seq;
    const fresh = new Set(ops.map(recordKey));
    const carried = failed.filter((f) => f.key === key).flatMap((f) => stillLatest(f.ops, f.seq).filter((op) => !fresh.has(recordKey(op))));
    const all = [...ops, ...carried];
    all.forEach((op) => latest.set(recordKey(op), s));
    failed = failed.flatMap((f) => {
      if (f.key === key) return [];
      const kept = stillLatest(f.ops, f.seq);
      return kept.length ? [{ ...f, ops: kept }] : [];
    });

    const run = tail.then(() => persistence.write(all));
    tail = run.catch(() => undefined);
    const promise: Promise<void> = run.then(
      () => {
        if (pending.get(key) === promise) pending.delete(key);
      },
      (error: unknown) => {
        if (pending.get(key) === promise) pending.delete(key);
        const kept = stillLatest(all, s);
        if (kept.length) failed = [...failed, { key, seq: s, ops: kept }];
        throw error;
      },
    );
    pending.set(key, promise);
    return promise;
  }

  return {
    submit,
    retry: (key) => {
      if (failed.some((f) => f.key === key)) return submit(key, []);
      return pending.get(key) ?? Promise.resolve();
    },
    status: (key) => (pending.has(key) ? "pending" : failed.some((f) => f.key === key) ? "unconfirmed" : undefined),
    unconfirmed: () => [...new Set(failed.map((f) => f.key))],
  };
}
