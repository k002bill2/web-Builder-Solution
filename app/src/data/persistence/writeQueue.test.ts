/**
 * 직렬 쓰기 큐 (ADR-007 부록 Codex 제약 3) — 저장 성공 = 커밋 확인 뒤 resolve · 실패 = 미확인 기록 유지 · 멱등 재시도 = 미확인 재제출 · 순서 보장.
 * 메모리 가짜에 커밋 지연·실패를 주입해 본다.
 */
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "./envelope";
import { createMemoryPersistence, type MemoryPersistenceOptions, type WriteOp } from "./studioPersistence";
import { createWriteQueue } from "./writeQueue";

const put = (id: string, data: unknown): WriteOp => ({ type: "put", store: "docs", record: { schemaVersion: SCHEMA_VERSION, kind: "doc", id, data } });
const valueOf = async (p: ReturnType<typeof createMemoryPersistence>, id: string) => ((await p.get("docs", id)) as { data: unknown } | undefined)?.data;
const flush = async () => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

function setup(options: MemoryPersistenceOptions = {}) {
  const writes: number[] = [];
  const persistence = createMemoryPersistence({
    ...options,
    commit: async (seq) => {
      writes.push(seq);
      await options.commit?.(seq);
    },
  });
  return { persistence, writes, queue: createWriteQueue(persistence) };
}

describe("직렬 쓰기 큐", () => {
  it("커밋 확인 전에는 settle되지 않는다 · 확인 뒤 resolve, 상태 pending → 없음(확인됨)", async () => {
    let release!: () => void;
    const { persistence, queue } = setup({ commit: () => new Promise<void>((ok) => (release = ok)) });
    let settled = false;
    const saving = queue.submit("save-1", [put("a", 1)]).then(() => (settled = true));
    await flush();
    expect(settled).toBe(false);
    expect(queue.status("save-1")).toBe("pending");
    release();
    await saving;
    expect(settled).toBe(true);
    expect(queue.status("save-1")).toBeUndefined();
    expect(await valueOf(persistence, "a")).toBe(1);
  });

  it("순서 보장: 앞 쓰기가 느려도 뒤 쓰기는 앞 커밋 뒤에 시작 · 같은 레코드 최종값 = 뒤 쓰기", async () => {
    const gates: (() => void)[] = [];
    const { persistence, writes, queue } = setup({ commit: (seq) => (seq === 1 ? new Promise<void>((ok) => gates.push(ok)) : undefined) });
    const first = queue.submit("save-1", [put("a", "앞")]);
    const second = queue.submit("save-2", [put("a", "뒤")]);
    await flush();
    expect(writes).toEqual([1]);
    gates[0]!();
    await Promise.all([first, second]);
    expect(writes).toEqual([1, 2]);
    expect(await valueOf(persistence, "a")).toBe("뒤");
  });

  it("실패 → INFRA reject + 미확인 기록 유지 · 실패 뒤 다음 요청은 막히지 않고 처리", async () => {
    const { persistence, queue } = setup({ fail: (seq) => (seq === 1 ? new DOMException("x", "QuotaExceededError") : undefined) });
    const failed = queue.submit("save-1", [put("a", 1)]);
    const next = queue.submit("save-2", [put("b", 2)]);
    await expect(failed).rejects.toMatchObject({ code: "INFRA" });
    await next;
    expect(queue.status("save-1")).toBe("unconfirmed");
    expect(queue.unconfirmed()).toEqual(["save-1"]);
    expect(await valueOf(persistence, "a")).toBeUndefined();
    expect(await valueOf(persistence, "b")).toBe(2);
  });

  it("멱등 재시도 = 미확인 기록 재제출(호출자는 새 쓰기 없이 키만) → 커밋되면 확인 · 미확인이 없으면 쓰기 0으로 resolve", async () => {
    const { persistence, writes, queue } = setup({ fail: (seq) => (seq === 1 ? new Error("tx abort") : undefined) });
    await expect(queue.submit("save-1", [put("a", 1), put("b", 1)])).rejects.toMatchObject({ code: "INFRA" });
    await queue.retry("save-1");
    expect(writes).toEqual([1, 2]);
    expect(queue.unconfirmed()).toEqual([]);
    expect(await valueOf(persistence, "a")).toBe(1);
    expect(await valueOf(persistence, "b")).toBe(1);
    await queue.retry("save-1");
    await queue.retry("없는-키");
    expect(writes).toEqual([1, 2]);
  });

  it("재시도도 실패하면 다시 reject · 미확인 유지", async () => {
    const { queue } = setup({ fail: (seq) => (seq <= 2 ? new Error("x") : undefined) });
    await expect(queue.submit("save-1", [put("a", 1)])).rejects.toMatchObject({ code: "INFRA" });
    await expect(queue.retry("save-1")).rejects.toMatchObject({ code: "INFRA" });
    expect(queue.unconfirmed()).toEqual(["save-1"]);
    await queue.retry("save-1");
    expect(queue.unconfirmed()).toEqual([]);
  });

  it("뒤 요청이 같은 레코드를 쓰면 앞 요청의 미확인 기록에서 그 레코드는 빠진다 — 앞 요청 재시도가 옛 값으로 덮지 않음", async () => {
    const { persistence, queue } = setup({ fail: (seq) => (seq === 1 ? new Error("x") : undefined) });
    await expect(queue.submit("save-1", [put("a", "옛"), put("b", "옛")])).rejects.toMatchObject({ code: "INFRA" });
    await queue.submit("save-2", [put("a", "새")]);
    await queue.retry("save-1");
    expect(await valueOf(persistence, "a")).toBe("새");
    expect(await valueOf(persistence, "b")).toBe("옛");
    expect(queue.unconfirmed()).toEqual([]);
  });

  it("앞 요청이 진행 중일 때 뒤 요청이 같은 레코드를 제출하고 앞 요청이 실패 → 앞 요청 미확인 기록에 그 레코드 없음(전부 덮이면 미확인 0)", async () => {
    const { persistence, queue } = setup({ fail: (seq) => (seq === 1 ? new Error("x") : undefined) });
    const first = queue.submit("save-1", [put("a", "옛")]);
    const second = queue.submit("save-2", [put("a", "새")]);
    await expect(first).rejects.toMatchObject({ code: "INFRA" });
    await second;
    expect(queue.unconfirmed()).toEqual([]);
    expect(queue.status("save-1")).toBeUndefined();
    expect(await valueOf(persistence, "a")).toBe("새");
  });

  it("같은 요청 키 재제출 = 새 쓰기 + 남은 미확인 기록(다른 레코드)을 합쳐 한 트랜잭션", async () => {
    const { persistence, queue } = setup({ fail: (seq) => (seq === 1 ? new Error("x") : undefined) });
    await expect(queue.submit("doc-save", [put("a", 1), put("b", 1)])).rejects.toMatchObject({ code: "INFRA" });
    await queue.submit("doc-save", [put("a", 2)]);
    expect(await valueOf(persistence, "a")).toBe(2);
    expect(await valueOf(persistence, "b")).toBe(1);
    expect(queue.unconfirmed()).toEqual([]);
  });
});
