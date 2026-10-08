/**
 * 두 파괴 흐름(지우기·프로젝트 삭제)의 탭 단위 잠금 소유 공유 (Codex r1 P2 — P1D-L3 후속).
 * 쓰기 탭에서 한 흐름이 실패해 싱크가 멈추면(isWriter=false) 다른 흐름이 자기 잠금을 다른 탭 편집으로 오인해 busy가 되던 경로를 고정한다.
 * 같은 링크(탭)에서 clearerFor·deleterFor를 함께 쓴다 — 잠금은 fakeLocks, deleteDatabase는 이벤트 손 발화 가짜.
 */
import { describe, expect, it, vi } from "vitest";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { createLinkNetwork } from "../../data/persistence/fakeTabLink";
import { WRITER_LOCK } from "../../data/persistence/writerLock";
import { clearerFor } from "./clearBrowserData";
import { deleterFor, type RunResult } from "./deleteProject";

type Req = { onsuccess?: () => void; onblocked?: () => void; onerror?: () => void };

const flushAll = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve();
};

function setup(over: { writer: boolean; run?: () => Promise<RunResult> }) {
  const browser = createLockRegistry();
  const locks = browser.tab();
  const link = createLinkNetwork().tab();
  let writer = false;
  const stop = vi.fn(() => void (writer = false));
  link.attach({ isWriter: () => writer, stop });
  if (over.writer) {
    // 싱크가 잠금을 보유한 쓰기 탭(끝나지 않는 Promise로 탭 수명 동안 보유 — 같은 탭 재요청은 null)
    void locks.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>(() => undefined));
    writer = true;
  }
  const requests: Req[] = [];
  const factory = {
    deleteDatabase: vi.fn(() => {
      const req: Req = {};
      requests.push(req);
      return req as unknown as IDBOpenDBRequest;
    }),
  } as unknown as IDBFactory;
  const run = vi.fn(over.run ?? (async (): Promise<RunResult> => "done"));
  const go = vi.fn();
  const clearer = clearerFor({ locks, factory, link, session: undefined, go });
  const deleter = deleterFor({ locks, factory, link, session: undefined, go, run });
  return { browser, locks, link, stop, requests, run, go, clearer, deleter };
}

describe("파괴 흐름 잠금 소유 공유 (Codex r1 P2)", () => {
  it("Codex 재현: 쓰기 탭 → 지우기 실패 → 취소 → 프로젝트 삭제 = 보유 잠금 안에서 done(busy 0) · 멈춘 싱크라 stopped", async () => {
    const t = setup({ writer: true });
    const clearing = t.clearer.clear();
    await flushAll();
    t.requests[0]!.onerror?.();
    expect(await clearing).toBe("failed");
    expect(t.link.own()?.isWriter()).toBe(false);
    // 지우기 실패 뒤에도 이 탭이 잠금을 보유(싱크 잠금) — 다른 탭 편집이 아니다
    expect(t.browser.holder(WRITER_LOCK)).toBe(t.locks);
    const request = vi.spyOn(t.locks, "request");
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "done", stopped: true });
    expect(request).not.toHaveBeenCalled();
    expect(t.run).toHaveBeenCalledTimes(1);
    expect(t.go).toHaveBeenCalledWith("/projects");
  });

  it("반대 순서: 쓰기 탭 → 삭제 실패 → 지우기 = 보유 잠금 안에서 진행(busy 0) · 성공 이동", async () => {
    const t = setup({ writer: true, run: async () => Promise.reject(new Error("tx")) });
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "failed", stopped: true });
    expect(t.link.own()?.isWriter()).toBe(false);
    const request = vi.spyOn(t.locks, "request");
    const clearing = t.clearer.clear();
    await flushAll();
    expect(request).not.toHaveBeenCalled();
    expect(t.requests).toHaveLength(1);
    t.requests[0]!.onsuccess?.();
    expect(await clearing).toBe("done");
    expect(t.go).toHaveBeenCalledWith("/projects");
  });

  it("쓰기 탭 아님: 지우기 실패(잡은 잠금 놓음) → 다른 탭이 잠금 보유 → 삭제 = busy · 실행 0", async () => {
    const t = setup({ writer: false });
    const clearing = t.clearer.clear();
    await flushAll();
    t.requests[0]!.onerror?.();
    expect(await clearing).toBe("failed");
    expect(t.browser.held()).toEqual([]);
    const other = t.browser.tab();
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>(() => undefined));
    await flushAll();
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "busy", stopped: true });
    expect(t.run).not.toHaveBeenCalled();
  });

  it("쓰기 탭 아님: 삭제 실패(잡은 잠금 놓음) → 다른 탭이 잠금 보유 → 지우기 = busy · 삭제 요청 0", async () => {
    const t = setup({ writer: false, run: async () => Promise.reject(new Error("tx")) });
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "failed", stopped: false });
    expect(t.browser.held()).toEqual([]);
    const other = t.browser.tab();
    void other.request(WRITER_LOCK, { ifAvailable: true }, () => new Promise<void>(() => undefined));
    await flushAll();
    expect(await t.clearer.clear()).toBe("busy");
    expect(t.requests).toHaveLength(0);
  });

  it("지우기 대기 중(onblocked — 삭제 요청이 남아 있음) → 프로젝트 삭제 = busy · 실행 0(대기 중 deleteDatabase 뒤에 끼어들지 않는다)", async () => {
    const t = setup({ writer: true });
    const clearing = t.clearer.clear();
    await flushAll();
    t.requests[0]!.onblocked?.();
    expect(await clearing).toBe("busy");
    await expect(t.deleter.remove("project-1", "가")).resolves.toEqual({ status: "busy", stopped: true });
    expect(t.run).not.toHaveBeenCalled();
  });
});
