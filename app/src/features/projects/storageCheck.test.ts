/**
 * `/projects` 저장소 영역의 강등 재확인 (P1C-SPEC 1.7 · 1.8) — 진입 결과를 재사용하지 않고 스스로 다시 연다.
 * 가짜 IDBFactory(요청 객체 모양만)로 분기를 본다(jsdom에는 IndexedDB가 없다).
 */
import { describe, expect, it } from "vitest";
import { ENTRY_DB_NAME } from "../../data/persistence/entryRead";
import { STORAGE_DB_NAME, checkStorage, issueText } from "./storageCheck";

function fakeFactory(opts: { readonly fail?: boolean; readonly state?: unknown; readonly stores?: boolean } = {}) {
  const request = (result: unknown, error?: Error) => {
    const r: { result?: unknown; error?: Error; onsuccess?: () => void; onerror?: () => void } = {};
    setTimeout(() => {
      if (error) {
        r.error = error;
        r.onerror?.();
        return;
      }
      r.result = result;
      r.onsuccess?.();
    });
    return r;
  };
  const opened: string[] = [];
  const db = {
    closed: false,
    onversionchange: null as null | (() => void),
    objectStoreNames: { contains: (name: string) => opts.stores !== false && name === "studio" },
    close() {
      db.closed = true;
    },
    transaction: () => ({ objectStore: () => ({ get: (id: string) => request(id === "state" ? opts.state : undefined) }) }),
  };
  const factory = {
    open: (name: string) => {
      opened.push(name);
      return opts.fail ? request(undefined, new DOMException("blocked", "SecurityError")) : request(db);
    },
  } as unknown as IDBFactory;
  return { factory, db, opened };
}
const env = (schemaVersion: unknown, over: Record<string, unknown> = {}) => ({ schemaVersion, kind: "state", id: "state", data: {}, ...over });

describe("checkStorage (1.7 · 1.8)", () => {
  it("DB 이름은 진입 읽기와 같다", () => {
    expect(STORAGE_DB_NAME).toBe(ENTRY_DB_NAME);
  });

  it("IndexedDB 없음 → none", async () => {
    expect(await checkStorage(undefined)).toBe("none");
  });

  it("열기 실패(사설 창·저장 차단) → blocked", async () => {
    const { factory } = fakeFactory({ fail: true });
    expect(await checkStorage(factory)).toBe("blocked");
  });

  it("저장 버전 > 앱 → newer · 연결은 닫는다", async () => {
    const { factory, db, opened } = fakeFactory({ state: env(99) });
    expect(await checkStorage(factory)).toBe("newer");
    expect(opened).toEqual([ENTRY_DB_NAME]);
    expect(db.closed).toBe(true);
  });

  it("깨진 봉투·더 낮은 버전(이행 실패와 같음) → invalid", async () => {
    expect(await checkStorage(fakeFactory({ state: { nope: 1 } }).factory)).toBe("invalid");
    expect(await checkStorage(fakeFactory({ state: env(1, { kind: "doc" }) }).factory)).toBe("invalid");
    expect(await checkStorage(fakeFactory({ state: env(0) }).factory)).toBe("invalid");
  });

  it("정상 봉투·레코드 없음·저장소 없음 → ok(이상 없음) · 다른 탭의 버전 올리기를 막지 않게 닫는다", async () => {
    const ok = fakeFactory({ state: env(1) });
    expect(await checkStorage(ok.factory)).toBe("ok");
    expect(ok.db.closed).toBe(true);
    expect(await checkStorage(fakeFactory({ state: undefined }).factory)).toBe("ok");
    const empty = fakeFactory({ stores: false });
    expect(await checkStorage(empty.factory)).toBe("ok");
    expect(empty.db.closed).toBe(true);
  });
});

describe("issueText (SPEC 문장 그대로)", () => {
  it("1.7 · 1.8 문장", () => {
    expect(issueText("none")).toBe("이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다 — 새로고침하거나 탭을 닫으면 사라집니다");
    expect(issueText("blocked")).toBe("브라우저 저장소에 접근하지 못해 이 탭에만 저장합니다 — 사설·시크릿 창이거나 사이트 데이터 저장이 꺼져 있을 수 있습니다");
    expect(issueText("invalid")).toBe("저장된 데이터를 읽지 못해 이 탭에만 저장합니다 — 계속 이렇다면 '이 브라우저 데이터 지우기'로 비울 수 있습니다");
    expect(issueText("newer")).toBe(
      "이 브라우저의 저장 데이터는 더 새 버전의 앱에서 저장되어 읽지 못했습니다 — 새로고침해 최신 앱을 받으세요. 그 전까지 이 탭의 변경은 저장되지 않습니다",
    );
  });

  it("재확인에 이상이 없는데 메모리로 시작했으면(경합) W1 강등 문장으로 대신한다", () => {
    expect(issueText("ok")).toBe("이 브라우저에 저장할 수 없어 새로고침하면 프로젝트가 사라집니다");
  });
});
