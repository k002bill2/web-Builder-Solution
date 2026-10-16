/** 하네스 공용 — 영속 경계는 제품 메모리 영속(트랜잭션 전부-아니면-전무 · structuredClone). 실제 IndexedDB 엔진 아님. */
import { createMemoryPersistence, type StudioPersistence, type WriteOp } from "../../../../app/src/data/persistence/studioPersistence";
import type { CoreDoc, WriterCheck } from "../core/saveCore";

export interface Deferred {
  readonly promise: Promise<void>;
  release(): void;
}
export const deferred = (): Deferred => {
  let release = () => undefined as void;
  const promise = new Promise<void>((r) => (release = r));
  return { promise, release };
};

/** write 호출 n번째(1부터)의 커밋 앞을 막거나(hold) 실패시킨다(failAt) — 실제 쓰기는 제품 createMemoryPersistence가 한다 */
export function harnessDb() {
  const holds = new Map<number, Deferred>();
  const fails = new Map<number, unknown>();
  const seen: number[] = [];
  const ops: (readonly WriteOp[])[] = [];
  const inner: StudioPersistence = createMemoryPersistence({
    commit: (n) => {
      seen.push(n);
      return holds.get(n)?.promise;
    },
    fail: (n) => fails.get(n),
  });
  // 제출된 op 기록만 덧붙인다 — 커밋·실패는 inner(제품 구현)가 판정
  const persistence: StudioPersistence = { ...inner, write: (batch) => (ops.push(batch), inner.write(batch)) };
  return {
    persistence,
    seen,
    ops,
    hold(n: number) {
      const d = deferred();
      holds.set(n, d);
      return d;
    },
    failAt(n: number, name: "QuotaExceededError" | "AbortError") {
      fails.set(n, new DOMException("injected", name));
    },
  };
}

export const writerAlways: WriterCheck = { mode: async () => "writer" };
export const docOf = (revision: number, body: string, imageIds: readonly string[] = []): CoreDoc => ({ revision, body, imageIds });
export const blobOf = (text: string) => new Blob([text], { type: "image/png" });
export const ticks = async (n = 20) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0));
};
/** 조건이 참이 될 때까지 매크로태스크를 돈다(최대 200) */
export async function until(check: () => boolean) {
  for (let i = 0; i < 200 && !check(); i += 1) await new Promise((r) => setTimeout(r, 0));
  if (!check()) throw new Error("until: 조건 미충족");
}
