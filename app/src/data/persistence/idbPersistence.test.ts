/**
 * IDB 구현의 순수 부분 — 업그레이드 단계(저장소 생성·버전 이행 골격)와 오류 분류(INFRA).
 * 트랜잭션·커밋 자체는 jsdom에 IndexedDB가 없어 브라우저 실측 몫(계약 테스트는 가짜에만 등록 — persistenceContract 머리 주석).
 */
import { describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError } from "../projectRepository";
import { DB_VERSION, applyOps, upgradeDatabase } from "./idbPersistence";
import { SCHEMA_VERSION, STORE_NAMES } from "./envelope";
import { toInfra } from "./infra";

function fakeDb(existing: readonly string[]) {
  const names = new Set(existing);
  const created: string[] = [];
  return {
    db: { objectStoreNames: { contains: (n: string) => names.has(n) }, createObjectStore: (n: string) => (created.push(n), names.add(n)) },
    created,
  };
}

describe("upgradeDatabase", () => {
  it("DB_VERSION ≥ 2 — 진입 읽기가 버전 없이 연 빈 v1 DB도 업그레이드를 거친다", () => {
    expect(DB_VERSION).toBeGreaterThanOrEqual(2);
  });

  it("처음(0 → 현재) · 진입이 만든 빈 v1(1 → 현재) → 저장소 7개 생성", () => {
    for (const old of [0, 1]) {
      const { db, created } = fakeDb([]);
      upgradeDatabase(db, old, DB_VERSION);
      expect(created).toEqual([...STORE_NAMES]);
    }
  });

  it("이미 있는 저장소는 다시 만들지 않는다(contains 가드) · 최신 버전이면 아무것도 안 함", () => {
    const partial = fakeDb(["meta", "studio"]);
    upgradeDatabase(partial.db, 1, DB_VERSION);
    expect(partial.created).toEqual(STORE_NAMES.filter((n) => n !== "meta" && n !== "studio"));
    const latest = fakeDb([]);
    upgradeDatabase(latest.db, DB_VERSION, DB_VERSION);
    expect(latest.created).toEqual([]);
  });
});

describe("toInfra", () => {
  it("quota·blocked·그 밖(Abort 등) → ProjectRepositoryError INFRA, 사유가 메시지에 남는다", () => {
    const quota = toInfra(new DOMException("x", "QuotaExceededError"), "저장");
    expect(quota).toBeInstanceOf(ProjectRepositoryError);
    expect(quota).toMatchObject({ code: "INFRA" });
    expect(quota.message).toContain("저장 공간");
    expect(toInfra(new DOMException("x", "BlockedError"), "열기").message).toContain("다른 탭");
    const abort = toInfra(new DOMException("x", "AbortError"), "저장");
    expect(abort).toMatchObject({ code: "INFRA" });
    expect(abort.message).toContain("저장");
    expect(toInfra(undefined, "열기")).toMatchObject({ code: "INFRA" });
  });

  it("이미 저장소 오류면 그대로", () => {
    const same = new ProjectRepositoryError("INFRA", "앞서 분류됨");
    expect(toInfra(same, "저장")).toBe(same);
  });
});

describe("applyOps (전부 아니면 전무)", () => {
  const put = (id: string) => ({ type: "put" as const, store: "docs" as const, record: { schemaVersion: SCHEMA_VERSION, kind: "doc", id, data: id } });

  it("중간 op가 동기로 던지면(DataCloneError 등) 트랜잭션을 abort하고 다시 던진다 — 앞 put이 자동 커밋되지 않게", () => {
    const store = { put: vi.fn((_v: unknown, key: string) => { if (key === "b") throw new DOMException("x", "DataCloneError"); }), delete: vi.fn() };
    const tx = { objectStore: () => store, abort: vi.fn() };
    expect(() => applyOps(tx, [put("a"), put("b"), put("c")])).toThrow("x");
    expect(tx.abort).toHaveBeenCalledTimes(1);
    expect(store.put).toHaveBeenCalledTimes(2);
  });

  it("정상이면 put(record, id)·delete(id)를 순서대로, abort 0", () => {
    const calls: string[] = [];
    const store = { put: (_v: unknown, key: string) => calls.push(`put:${key}`), delete: (key: string) => calls.push(`del:${key}`) };
    const tx = { objectStore: () => store, abort: vi.fn() };
    applyOps(tx, [put("a"), { type: "delete", store: "docs", id: "a" }, put("b")]);
    expect(calls).toEqual(["put:a", "del:a", "put:b"]);
    expect(tx.abort).not.toHaveBeenCalled();
  });
});
