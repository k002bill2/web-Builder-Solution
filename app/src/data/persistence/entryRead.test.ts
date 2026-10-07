/**
 * 진입 읽기 (ADR-007 하이드레이션 1단 · 개정 9 결정 4) — 수제 schemaVersion 확인만. 가짜 IDBFactory(요청 객체 모양만)로 분기를 본다.
 * undefined = 메모리(쓰기 0 — 더 새 레코드·깨진 봉투를 덮지 않는다) · {} = 첫 실행(local, 빈 상태).
 */
import { describe, expect, it } from "vitest";
import { SCHEMA_VERSION } from "./envelope";
import { readEntry } from "./entryRead";

function fakeFactory(stores?: Record<string, Record<string, unknown>>) {
  const request = (result: unknown) => {
    const r: { result?: unknown; onsuccess?: () => void } = {};
    setTimeout(() => {
      r.result = result;
      r.onsuccess?.();
    });
    return r;
  };
  const db = {
    closed: false,
    objectStoreNames: { contains: (name: string) => !!stores && name in stores },
    close() {
      db.closed = true;
    },
    transaction: (store: string) => ({ objectStore: () => ({ get: (id: string) => request(stores?.[store]?.[id]) }) }),
  };
  return { factory: { open: () => request(db) } as unknown as IDBFactory, db };
}
const env = (kind: string, id: string, data: unknown, schemaVersion = SCHEMA_VERSION) => ({ schemaVersion, kind, id, data });

describe("readEntry", () => {
  it("IndexedDB 없음(jsdom) → undefined = 메모리", async () => {
    expect(typeof indexedDB).toBe("undefined");
    expect(await readEntry("project-1")).toBeUndefined();
  });

  it("첫 실행(저장소 없음) → {} = local 빈 상태 · 연결은 닫는다", async () => {
    const { factory, db } = fakeFactory();
    expect(await readEntry("project-1", factory)).toEqual({});
    expect(db.closed).toBe(true);
  });

  it("상태·진입 문서 봉투 ok → 그대로 · 연결 닫음", async () => {
    const state = { projects: new Map() };
    const doc = { doc: { projectId: "project-1" }, snapshots: [] };
    const { factory, db } = fakeFactory({ studio: { state: env("state", "state", state) }, docs: { "project-1": env("doc", "project-1", doc) } });
    expect(await readEntry("project-1", factory)).toEqual({ state, doc });
    expect(await readEntry(undefined, factory)).toEqual({ state });
    expect(db.closed).toBe(true);
  });

  it("상태 없음(저장소만 있음) → {} · 버전 불일치·깨진 봉투 → undefined(메모리, 덮기 0)", async () => {
    expect(await readEntry("project-1", fakeFactory({ studio: {}, docs: {} }).factory)).toEqual({});
    expect(await readEntry("project-1", fakeFactory({ studio: { state: env("state", "state", {}, SCHEMA_VERSION + 1) }, docs: {} }).factory)).toBeUndefined();
    expect(await readEntry("project-1", fakeFactory({ studio: { state: env("state", "state", {}) }, docs: { "project-1": env("doc", "project-1", {}, 0) } }).factory)).toBeUndefined();
    expect(await readEntry("project-1", fakeFactory({ studio: { state: { nope: true } }, docs: {} }).factory)).toBeUndefined();
  });
});
