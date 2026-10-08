/**
 * `/projects` "이 브라우저 저장소" 영역 (P1C-SPEC 2절 1~3줄 · 1.7 · 1.8 · AC-C07·C10·C15).
 * 저장소 API·IDBFactory는 주입한다(jsdom에는 navigator.storage·indexedDB가 없다).
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BrowserStorageSection, type StorageApi } from "./BrowserStorageSection";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { createLinkNetwork } from "../../data/persistence/fakeTabLink";

const MB = 1024 ** 2;
const LOCAL_TEXT = "프로젝트·편집 문서·스냅샷·이미지를 이 브라우저에만 저장합니다. 공용 PC라면 다 쓴 뒤 지우세요.";
const EVICT_TEXT = "브라우저는 저장 공간이 부족하면 이 데이터를 지울 수 있습니다";
const KEPT_TEXT = "브라우저에 자동 삭제하지 않도록 요청해 두었습니다";
const REFUSED_TEXT = "브라우저가 요청을 받지 않았습니다";
const FULL_TEXT = "저장 공간이 부족하면 저장이 실패합니다 — 쓰지 않는 프로젝트의 이미지나 스냅샷을 지우세요";

function storageApi(over: Partial<StorageApi> = {}) {
  return {
    estimate: vi.fn(async () => ({ usage: 12.34 * MB, quota: 1000 * MB })),
    persisted: vi.fn(async () => false),
    persist: vi.fn(async () => true),
    ...over,
  };
}

const statusRegion = () => screen.getByRole("status", { name: "저장소 알림" });

describe("BrowserStorageSection — local (2절)", () => {
  it("h2 · 상태 문장 · 사용량 · 축출 문장 + 요청 버튼 — 진입만으로 persist() 호출 0 (AC-C15)", async () => {
    const storage = storageApi();
    render(<BrowserStorageSection persistence="local" storage={storage} />);
    expect(screen.getByRole("heading", { level: 2, name: "이 브라우저 저장소" })).toBeInTheDocument();
    expect(screen.getByText(LOCAL_TEXT)).toBeInTheDocument();
    expect(await screen.findByText("사용량 약 12.3MB")).toBeInTheDocument();
    expect(await screen.findByText(EVICT_TEXT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "자동 삭제 막기 요청" })).toBeInTheDocument();
    expect(storage.persist).not.toHaveBeenCalled();
    expect(screen.queryByText(FULL_TEXT)).not.toBeInTheDocument();
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("요청 → 받아들임: 문장 갱신 · 버튼 사라짐 · status 낭독", async () => {
    const storage = storageApi();
    render(<BrowserStorageSection persistence="local" storage={storage} />);
    await userEvent.click(await screen.findByRole("button", { name: "자동 삭제 막기 요청" }));
    expect(storage.persist).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(KEPT_TEXT, { selector: "p:not([role])" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "자동 삭제 막기 요청" })).not.toBeInTheDocument();
    expect(statusRegion()).toHaveTextContent(KEPT_TEXT);
  });

  it("요청 → 거절: 보이는 문장이 거절 문장으로 갱신 · 버튼 유지(다시 요청 가능) · status 낭독", async () => {
    const storage = storageApi({ persist: vi.fn(async () => false) });
    render(<BrowserStorageSection persistence="local" storage={storage} />);
    await userEvent.click(await screen.findByRole("button", { name: "자동 삭제 막기 요청" }));
    await waitFor(() => expect(statusRegion()).toHaveTextContent(REFUSED_TEXT));
    expect(screen.getByText(REFUSED_TEXT, { selector: "p:not([role])" })).toBeInTheDocument();
    expect(screen.queryByText(EVICT_TEXT)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "자동 삭제 막기 요청" })).toBeInTheDocument();
  });

  it("요청 → 오류도 거절 문장(오류 문구 0)", async () => {
    const storage = storageApi({ persist: vi.fn(async () => Promise.reject(new Error("x"))) });
    render(<BrowserStorageSection persistence="local" storage={storage} />);
    await userEvent.click(await screen.findByRole("button", { name: "자동 삭제 막기 요청" }));
    await waitFor(() => expect(statusRegion()).toHaveTextContent(REFUSED_TEXT));
    expect(screen.getByText(REFUSED_TEXT, { selector: "p:not([role])" })).toBeInTheDocument();
  });

  it("이미 persisted면 버튼 없이 요청해 둔 문장", async () => {
    render(<BrowserStorageSection persistence="local" storage={storageApi({ persisted: vi.fn(async () => true) })} />);
    expect(await screen.findByText(KEPT_TEXT)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "자동 삭제 막기 요청" })).not.toBeInTheDocument();
    expect(screen.queryByText(EVICT_TEXT)).not.toBeInTheDocument();
  });

  it("80% 이상이면 사용량 뒤 80% 문장 + 공간 부족 문장(1.7 할당량)", async () => {
    render(<BrowserStorageSection persistence="local" storage={storageApi({ estimate: vi.fn(async () => ({ usage: 80 * MB, quota: 100 * MB })) })} />);
    expect(await screen.findByText("사용량 약 80.0MB · 브라우저가 허용한 공간의 80% 이상")).toBeInTheDocument();
    expect(screen.getByText(FULL_TEXT)).toBeInTheDocument();
  });

  it("API 없음·거부 → 사용량 줄·요청 줄 숨김(오류 문구 0)", async () => {
    const { rerender } = render(<BrowserStorageSection persistence="local" storage={undefined} />);
    expect(screen.getByText(LOCAL_TEXT)).toBeInTheDocument();
    expect(screen.queryByText(/사용량/)).not.toBeInTheDocument();
    expect(screen.queryByText(EVICT_TEXT)).not.toBeInTheDocument();
    const rejecting = { estimate: vi.fn(async () => Promise.reject(new Error("no"))) };
    rerender(<BrowserStorageSection persistence="local" storage={rejecting} />);
    await waitFor(() => expect(rejecting.estimate).toHaveBeenCalled());
    expect(screen.queryByText(/사용량/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "자동 삭제 막기 요청" })).not.toBeInTheDocument();
  });
});

describe("BrowserStorageSection — 강등 (1.7 · 1.8 · AC-C10)", () => {
  it("IndexedDB 없음 → 저장소 불가 문장(cautionary) · 사용량·요청 줄 없음", async () => {
    const storage = storageApi();
    render(<BrowserStorageSection persistence="memory" storage={storage} factory={undefined} />);
    expect(
      await screen.findByRole("heading", { name: "이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다 — 새로고침하거나 탭을 닫으면 사라집니다" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(LOCAL_TEXT)).not.toBeInTheDocument();
    expect(screen.queryByText(/사용량/)).not.toBeInTheDocument();
    expect(storage.estimate).not.toHaveBeenCalled();
    expect(storage.persist).not.toHaveBeenCalled();
  });

  it("Codex r1 재현: 상태 정상 · 진입 문서 봉투만 더 새 버전(/studio/:id에서 강등 → /projects) → 1.8 문장 + 새로고침 버튼", async () => {
    const request = (result: unknown) => {
      const r: { result?: unknown; onsuccess?: () => void } = {};
      setTimeout(() => {
        r.result = result;
        r.onsuccess?.();
      });
      return r;
    };
    const db = {
      objectStoreNames: { contains: (name: string) => name === "studio" || name === "docs" },
      close: () => undefined,
      transaction: () => ({
        objectStore: () => ({
          get: () => request({ schemaVersion: 1, kind: "state", id: "state", data: {} }),
          getAllKeys: () => request(["p1"]),
          getAll: () => request([{ schemaVersion: 99, kind: "doc", id: "p1", data: {} }]),
        }),
      }),
    };
    const factory = { open: () => request(db) } as unknown as IDBFactory;
    const reload = vi.fn();
    render(<BrowserStorageSection persistence="memory" storage={storageApi()} factory={factory} reload={reload} />);
    expect(await screen.findByRole("heading", { name: /더 새 버전의 앱에서 저장되어 읽지 못했습니다/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "새로고침" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("newer → 1.8 문장 + 새로고침 버튼", async () => {
    const request = (result: unknown) => {
      const r: { result?: unknown; onsuccess?: () => void } = {};
      setTimeout(() => {
        r.result = result;
        r.onsuccess?.();
      });
      return r;
    };
    const db = {
      objectStoreNames: { contains: () => true },
      close: () => undefined,
      transaction: () => ({ objectStore: () => ({ get: () => request({ schemaVersion: 99, kind: "state", id: "state", data: {} }) }) }),
    };
    const factory = { open: () => request(db) } as unknown as IDBFactory;
    const reload = vi.fn();
    render(<BrowserStorageSection persistence="memory" storage={storageApi()} factory={factory} reload={reload} />);
    expect(await screen.findByRole("heading", { name: /더 새 버전의 앱에서 저장되어 읽지 못했습니다/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "새로고침" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });
});

describe("BrowserStorageSection — 이 브라우저 데이터 지우기 (1.6 · AC-C05·C08)", () => {
  type Req = { onsuccess?: () => void; onblocked?: () => void; onerror?: () => void };
  const CLEARED_TEXT = "이 브라우저 데이터를 지웠습니다";

  function clearDeps(stored: Record<string, string> = {}) {
    const requests: Req[] = [];
    const factory = { deleteDatabase: vi.fn(() => (requests.push({}), requests[requests.length - 1])) } as unknown as IDBFactory;
    const store = new Map(Object.entries(stored));
    const session = {
      getItem: vi.fn((k: string) => store.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => void store.set(k, v)),
      removeItem: vi.fn((k: string) => void store.delete(k)),
    };
    const net = createLinkNetwork();
    return { factory, requests, session, store, link: net.tab(), locks: createLockRegistry().tab(), go: vi.fn() };
  }

  it("IndexedDB 없음 = 버튼 숨김 · 있으면 프로젝트 0개여도 버튼(outline)", () => {
    const { unmount } = render(<BrowserStorageSection persistence="local" storage={storageApi()} factory={undefined} count={0} />);
    expect(screen.queryByRole("button", { name: "이 브라우저 데이터 지우기" })).not.toBeInTheDocument();
    unmount();
    const deps = clearDeps();
    render(<BrowserStorageSection persistence="local" storage={storageApi()} count={0} {...deps} />);
    expect(screen.getByRole("button", { name: "이 브라우저 데이터 지우기" })).toBeInTheDocument();
  });

  it("누르면 대화상자(조작 뒤 청크) · 프로젝트 N개 · 취소 → 닫히고 포커스 = 여는 버튼", async () => {
    const deps = clearDeps();
    render(<BrowserStorageSection persistence="local" storage={storageApi()} count={2} {...deps} />);
    const opener = screen.getByRole("button", { name: "이 브라우저 데이터 지우기" });
    await userEvent.click(opener);
    expect(await screen.findByRole("dialog", { name: "이 브라우저 데이터를 지울까요?" })).toBeInTheDocument();
    expect(screen.getByText("프로젝트 2개와 각 편집 문서")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
    expect(deps.factory.deleteDatabase).not.toHaveBeenCalled();
  });

  it("모두 지우기 → 삭제 성공 → 1회 키 저장 → /projects 새로고침 이동", async () => {
    const deps = clearDeps();
    render(<BrowserStorageSection persistence="local" storage={storageApi()} count={1} {...deps} />);
    await userEvent.click(screen.getByRole("button", { name: "이 브라우저 데이터 지우기" }));
    await userEvent.click(await screen.findByRole("button", { name: "모두 지우기" }));
    await waitFor(() => expect(deps.requests).toHaveLength(1));
    deps.requests[0]!.onsuccess?.();
    await waitFor(() => expect(deps.go).toHaveBeenCalledWith("/projects"));
    expect(deps.store.size).toBe(1);
  });

  it("새로고침 뒤 1회 키 → status '이 브라우저 데이터를 지웠습니다' 1회 · 키 삭제 → 다시 열면 없음", async () => {
    const deps = clearDeps({ "design-studio-cleared": "1" });
    const { unmount } = render(<BrowserStorageSection persistence="local" storage={storageApi()} count={0} {...deps} />);
    await waitFor(() => expect(statusRegion()).toHaveTextContent(CLEARED_TEXT));
    expect(deps.store.size).toBe(0);
    unmount();
    render(<BrowserStorageSection persistence="local" storage={storageApi()} count={0} {...deps} />);
    await Promise.resolve();
    expect(statusRegion()).not.toHaveTextContent(CLEARED_TEXT);
  });
});

describe("BrowserStorageSection — 다른 탭 알림 (1.5 · AC-C03)", () => {
  const SAVED_TEXT = "다른 탭에서 저장한 변경이 있습니다 — 새로고침하면 보입니다";
  const CLEARED_BY_OTHER = "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요";

  it("다른 탭 saved → 보이는 문장 + '새로고침' + status 1회 · 누르면 reload", async () => {
    const net = createLinkNetwork();
    const other = net.tab();
    const reload = vi.fn();
    render(<BrowserStorageSection persistence="local" storage={storageApi()} link={net.tab()} reload={reload} />);
    other.post({ type: "saved" });
    other.post({ type: "saved" });
    await waitFor(() => expect(statusRegion()).toHaveTextContent(SAVED_TEXT));
    expect(screen.getAllByText(SAVED_TEXT, { selector: "p:not([role]) *, p:not([role])" })).toHaveLength(1);
    await userEvent.click(screen.getByRole("button", { name: "새로고침" }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("다른 탭 cleared → 지워짐 문장 + '새로고침'", async () => {
    const net = createLinkNetwork();
    const other = net.tab();
    render(<BrowserStorageSection persistence="local" storage={storageApi()} link={net.tab()} reload={vi.fn()} />);
    other.post({ type: "cleared" });
    await waitFor(() => expect(statusRegion()).toHaveTextContent(CLEARED_BY_OTHER));
    expect(screen.getByRole("button", { name: "새로고침" })).toBeInTheDocument();
  });

  it("같은 탭(같은 링크)의 saved는 표시 0 — 탭당 채널 1개 공유", async () => {
    const net = createLinkNetwork();
    const mine = net.tab();
    render(<BrowserStorageSection persistence="local" storage={storageApi()} link={mine} reload={vi.fn()} />);
    mine.post({ type: "saved" });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.queryByText(SAVED_TEXT)).not.toBeInTheDocument();
  });

  it("언마운트하면 구독을 끊는다", async () => {
    const net = createLinkNetwork();
    const other = net.tab();
    const mine = net.tab();
    const listen = vi.spyOn(mine, "listen");
    const { unmount } = render(<BrowserStorageSection persistence="local" storage={storageApi()} link={mine} />);
    expect(listen).toHaveBeenCalledTimes(1);
    unmount();
    other.post({ type: "saved" });
    await new Promise((r) => setTimeout(r, 20));
  });
});
