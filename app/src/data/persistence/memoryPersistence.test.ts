/**
 * StudioPersistence 메모리 가짜 (ADR-007 P6 A) — 계약 테스트 등록 + 가짜 고유 주입(커밋 지연·실패 = 전부 아니면 전무).
 */
import { describe, expect, it } from "vitest";
import { persistenceContract } from "../../test/persistenceContract";
import { SCHEMA_VERSION } from "./envelope";
import { createMemoryPersistence } from "./studioPersistence";

persistenceContract("메모리 가짜", async () => createMemoryPersistence());

const rec = (id: string, data: unknown) => ({ schemaVersion: SCHEMA_VERSION, kind: "doc", id, data });

describe("메모리 가짜 주입", () => {
  it("커밋 지연: commit이 끝나기 전에는 write가 settle되지 않고 레코드도 보이지 않는다", async () => {
    let release!: () => void;
    const p = createMemoryPersistence({ commit: () => new Promise<void>((ok) => (release = ok)) });
    let settled = false;
    const writing = p.write([{ type: "put", store: "docs", record: rec("a", 1) }]).then(() => (settled = true));
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(await p.get("docs", "a")).toBeUndefined();
    release();
    await writing;
    expect(settled).toBe(true);
    expect(await p.get("docs", "a")).toEqual(rec("a", 1));
  });

  it("실패 주입 → INFRA로 reject · 그 트랜잭션의 쓰기 0건(전부 아니면 전무) · 다음 쓰기는 정상", async () => {
    const p = createMemoryPersistence({ fail: (seq) => (seq === 2 ? new DOMException("가득 참", "QuotaExceededError") : undefined) });
    await p.write([{ type: "put", store: "docs", record: rec("a", 1) }]);
    await expect(
      p.write([
        { type: "put", store: "docs", record: rec("a", 2) },
        { type: "put", store: "docs", record: rec("b", 3) },
      ]),
    ).rejects.toMatchObject({ code: "INFRA" });
    expect(await p.getAll("docs")).toEqual([rec("a", 1)]);
    await p.write([{ type: "put", store: "docs", record: rec("b", 4) }]);
    expect(await p.getAll("docs")).toEqual([rec("a", 1), rec("b", 4)]);
  });

  it("close 뒤 읽기·쓰기 → INFRA", async () => {
    const p = createMemoryPersistence();
    p.close();
    await expect(p.get("docs", "a")).rejects.toMatchObject({ code: "INFRA" });
    await expect(p.write([{ type: "delete", store: "docs", id: "a" }])).rejects.toMatchObject({ code: "INFRA" });
  });
});
