/**
 * "이 브라우저 데이터 지우기" 흐름 1~5 (P1C-SPEC 1.6 · AC-C04·C05) — 잠금 · cleared 전송 · 연결 닫기 · deleteDatabase · 1회 키 · 새로고침 이동.
 * IDBFactory.deleteDatabase는 이벤트를 손으로 발화하는 가짜(jsdom에 IndexedDB 없음).
 */
import { describe, expect, it, vi } from "vitest";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { createLinkNetwork } from "../../data/persistence/fakeTabLink";
import { WRITER_LOCK } from "../../data/persistence/writerLock";
import { CLEARED_KEY, CLEAR_DB_NAME, clearerFor, createClearer } from "./clearBrowserData";
import { DB_NAME } from "../../data/persistence/envelope";
import { CLEARED_NOTICE_KEY } from "../../components/projects/BrowserStorageSection";

type Req = { onsuccess?: () => void; onblocked?: () => void; onerror?: () => void };

function fakeFactory() {
  const requests: { name: string; req: Req }[] = [];
  const factory = {
    deleteDatabase: vi.fn((name: string) => {
      const req: Req = {};
      requests.push({ name, req });
      return req as unknown as IDBOpenDBRequest;
    }),
  } as unknown as IDBFactory;
  const last = () => requests[requests.length - 1]!.req;
  return { factory, requests, last };
}

const flushAll = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

function setup(over: { locks?: ReturnType<ReturnType<typeof createLockRegistry>["tab"]> | null } = {}) {
  const browser = createLockRegistry();
  const net = createLinkNetwork();
  const link = net.tab();
  const { factory, requests, last } = fakeFactory();
  const session = { setItem: vi.fn() };
  const go = vi.fn();
  const locks = over.locks === null ? undefined : (over.locks ?? browser.tab());
  const clearer = createClearer({ locks, factory, link, session, go });
  return { browser, net, link, factory, requests, last, session, go, locks, clearer };
}

describe("지우기 흐름 (SPEC 1.6)", () => {
  it("1회 키 = 영역이 읽는 키(영역은 조작 뒤 청크를 싣지 않으려고 리터럴)", () => {
    expect(CLEARED_NOTICE_KEY).toBe(CLEARED_KEY);
  });

  it("지우는 DB 이름 = 영속 DB 이름(리터럴 복제 parity)", () => {
    expect(CLEAR_DB_NAME).toBe(DB_NAME);
  });

  it("성공: 잠금 → cleared 전송 → deleteDatabase(design-studio) → 1회 키 → /projects 새로고침 이동", async () => {
    const t = setup();
    const result = t.clearer.clear();
    await flushAll();
    expect(t.net.sent()).toEqual([{ type: "cleared" }]);
    expect(t.requests.map((r) => r.name)).toEqual(["design-studio"]);
    expect(t.browser.held()).toEqual([WRITER_LOCK]);
    expect(t.go).not.toHaveBeenCalled();
    t.last().onsuccess?.();
    expect(await result).toBe("done");
    expect(t.session.setItem).toHaveBeenCalledWith(CLEARED_KEY, "1");
    expect(t.go).toHaveBeenCalledTimes(1);
    expect(t.go).toHaveBeenCalledWith("/projects");
  });

  it("다른 탭이 잠금 보유(편집 중) = busy · 전송·삭제 0 (AC-C04)", async () => {
    const t = setup();
    const other = t.browser.tab();
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise(() => undefined));
    await flushAll();
    expect(await t.clearer.clear()).toBe("busy");
    expect(t.net.sent()).toEqual([]);
    expect(t.requests).toHaveLength(0);
    expect(t.go).not.toHaveBeenCalled();
  });

  it("같은 탭이 쓰기 탭(잠금 보유) = 잠금을 다시 요청하지 않고 보유 잠금 안에서 지운다 — 거짓 '다른 탭 편집 중' 0 (D2 함정 회귀)", async () => {
    const t = setup();
    // 이 탭이 먼저 편집해 잠금을 잡았다(끝나지 않는 Promise로 보유) — 같은 탭 재요청은 Web Locks 재진입 불가로 null
    void t.locks!.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise(() => undefined));
    const stop = vi.fn();
    t.link.attach({ isWriter: () => true, stop });
    const result = t.clearer.clear();
    await flushAll();
    expect(stop).toHaveBeenCalledTimes(1);
    expect(t.requests).toHaveLength(1);
    t.last().onsuccess?.();
    expect(await result).toBe("done");
    expect(t.go).toHaveBeenCalledWith("/projects");
  });

  it("자기 싱크 stop은 cleared 전송·삭제보다 먼저", async () => {
    const t = setup();
    const order: string[] = [];
    t.link.attach({ isWriter: () => false, stop: () => order.push("stop") });
    const post = t.link.post;
    t.link.post = (m) => (order.push(`post:${m.type}`), post(m));
    (t.factory.deleteDatabase as ReturnType<typeof vi.fn>).mockImplementationOnce((name: string) => {
      order.push("delete");
      const req: Req = {};
      t.requests.push({ name, req });
      return req;
    });
    void t.clearer.clear();
    await flushAll();
    expect(order).toEqual(["stop", "post:cleared", "delete"]);
  });

  it("onblocked = busy(같은 alert 문장) · 늦게 온 onsuccess도 성공 흐름 · 대기 중 재시도는 두 번째 삭제를 내지 않는다", async () => {
    const t = setup();
    const first = t.clearer.clear();
    await flushAll();
    t.last().onblocked?.();
    expect(await first).toBe("busy");
    expect(t.go).not.toHaveBeenCalled();
    expect(await t.clearer.clear()).toBe("busy");
    expect(t.requests).toHaveLength(1);
    t.last().onsuccess?.();
    expect(t.session.setItem).toHaveBeenCalledWith(CLEARED_KEY, "1");
    expect(t.go).toHaveBeenCalledWith("/projects");
  });

  it("clearerFor = 탭(링크)당 1개 — 대화상자를 닫았다 다시 열어도 같은 지우기(보유 잠금·대기 중 요청 유지) · 다른 탭 링크는 별개", () => {
    const t = setup();
    const deps = { locks: t.locks, factory: t.factory, link: t.link, session: t.session, go: t.go };
    const first = clearerFor(deps);
    expect(clearerFor({ ...deps })).toBe(first);
    expect(clearerFor({ ...deps, link: t.net.tab() })).not.toBe(first);
  });

  it("대기 중(onblocked) 대화상자를 닫았다 다시 열어도 두 번째 삭제 요청 0", async () => {
    const t = setup();
    const deps = { locks: t.locks, factory: t.factory, link: t.link, session: t.session, go: t.go };
    const first = clearerFor(deps).clear();
    await flushAll();
    t.last().onblocked?.();
    expect(await first).toBe("busy");
    expect(await clearerFor({ ...deps }).clear()).toBe("busy");
    expect(t.requests).toHaveLength(1);
  });

  it("onerror = failed · 잠금을 놓는다 · 이동 0 · 다시 시도하면 새 삭제 요청", async () => {
    const t = setup();
    const first = t.clearer.clear();
    await flushAll();
    t.last().onerror?.();
    expect(await first).toBe("failed");
    expect(t.browser.held()).toEqual([]);
    expect(t.go).not.toHaveBeenCalled();
    const again = t.clearer.clear();
    await flushAll();
    expect(t.requests).toHaveLength(2);
    t.last().onsuccess?.();
    expect(await again).toBe("done");
  });

  it("deleteDatabase가 동기로 던져도 failed · 잠금을 놓는다", async () => {
    const t = setup();
    (t.factory.deleteDatabase as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new DOMException("x", "SecurityError");
    });
    expect(await t.clearer.clear()).toBe("failed");
    expect(t.browser.held()).toEqual([]);
  });

  it("navigator.locks 없음 = 잠금 없이 진행(어느 탭도 쓰지 않음 — ADR-007 개정 2 보충)", async () => {
    const t = setup({ locks: null });
    const result = t.clearer.clear();
    await flushAll();
    t.last().onsuccess?.();
    expect(await result).toBe("done");
  });
});
