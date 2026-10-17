import { act, render, renderHook, screen } from "@testing-library/react";
import { useEffect, useRef, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ProjectPersistence } from "../../data/projectRepository";
import { saveAnnouncement, saveStatusText } from "./saveStatusText";
import { useAutosaveScheduler, type AutosaveState } from "./useAutosaveScheduler";

function deferred() {
  let resolve!: (value?: unknown) => void;
  const promise = new Promise<unknown>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function unloadBlocked(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

// RS6-L3b(I6 3.1-2 · D6-11): 떠나기 경고 소유 = 코어 레지스트리 — 이 훅의 memory·server·실패·STALE 등록 단언 3건은
// `useDocSaveLeave.test.tsx` "탭 수준 경고"(실제 저장소 레지스트리)로 이전했다. 여기서는 훅이 등록하지 않음(리스너 중복 0)만 본다
describe("useAutosaveScheduler — beforeunload (E-AC-12 → 레지스트리)", () => {
  it("훅은 beforeunload를 등록하지 않는다(memory·server · 변경·실패 모두) — 경고는 코어 레지스트리", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>().mockRejectedValueOnce(new Error("x"));
    const memory = renderHook(() => useAutosaveScheduler<string>({ save: () => Promise.resolve(), persistence: "memory" }));
    expect(unloadBlocked()).toBe(false);
    memory.unmount();
    const { result, unmount } = renderHook(() => useAutosaveScheduler<string>({ save, persistence: "server" }));
    act(() => result.current.change("a"));
    expect(unloadBlocked()).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.state.phase).toBe("failed");
    expect(unloadBlocked()).toBe(false);
    unmount();
  });

  it("unmount — 리스너 해제, 타이머가 남아도 저장하지 않는다", async () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const save = vi.fn(() => Promise.resolve());
    const { result, unmount } = renderHook(() => useAutosaveScheduler<string>({ save, persistence: "memory" }));
    act(() => result.current.change("a"));
    unmount();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(save).not.toHaveBeenCalled();
    expect(add.mock.calls.filter(([t]) => t === "beforeunload")).toHaveLength(0);
    for (const type of ["online", "offline"]) {
      const added = add.mock.calls.filter(([t]) => t === type).map(([, fn]) => fn);
      const removed = remove.mock.calls.filter(([t]) => t === type).map(([, fn]) => fn);
      expect(added.length).toBeGreaterThan(0);
      for (const fn of added) expect(removed).toContain(fn);
    }
    add.mockRestore();
    remove.mockRestore();
  });

  it("window offline → offline, online → 저장 1회 (E-AC-09)", async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result, unmount } = renderHook(() => useAutosaveScheduler<string>({ save, persistence: "server" }));
    act(() => window.dispatchEvent(new Event("offline")));
    act(() => result.current.change("a"));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(save).not.toHaveBeenCalled();
    expect(result.current.state.phase).toBe("offline");
    act(() => window.dispatchEvent(new Event("online")));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.state.phase).toBe("saved");
    unmount();
  });

  it("최신 save 콜백을 쓴다", async () => {
    const saveA = vi.fn(() => Promise.resolve());
    const saveB = vi.fn(() => Promise.resolve());
    const { result, rerender, unmount } = renderHook(
      ({ save }) => useAutosaveScheduler<string>({ save, persistence: "server" }),
      { initialProps: { save: saveA } },
    );
    act(() => result.current.change("a"));
    rerender({ save: saveB });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(saveA).not.toHaveBeenCalled();
    expect(saveB).toHaveBeenCalledWith("a");
    unmount();
  });
});

/** 테스트 전용 — 상태 글자는 라이브 영역 밖, 알림은 role=status/alert로만 (E-AC-08·09) */
function SaveStatusHarness({
  save,
  persistence,
  onReady,
  clock = () => Date.now(),
}: {
  save: (doc: string) => Promise<unknown>;
  persistence: ProjectPersistence;
  clock?: () => number;
  onReady: (api: { change: (d: string) => void; retry: () => void }) => void;
}) {
  const { state, change, retry } = useAutosaveScheduler<string>({ save, persistence });
  const prev = useRef<AutosaveState>(state);
  const [notice, setNotice] = useState<{ status: string; alert: string }>({ status: "", alert: "" });
  useEffect(() => {
    const a = saveAnnouncement(prev.current, state);
    prev.current = state;
    if (a) setNotice((n) => (a.kind === "alert" ? { ...n, alert: a.text } : { ...n, status: a.text }));
  }, [state]);
  useEffect(() => {
    onReady({ change, retry });
  }, [onReady, change, retry]);
  return (
    <div>
      <span data-testid="status-text">{saveStatusText(state, persistence, clock())}</span>
      <div role="status">{notice.status}</div>
      <div role="alert">{notice.alert}</div>
    </div>
  );
}

describe("저장 상태 표시 — 라이브 영역 (E-AC-08 · E-AC-09)", () => {
  it("평상시 저장: 글자 전이는 영역 밖, status 영역 글자 변화 0", async () => {
    let api!: { change: (d: string) => void; retry: () => void };
    render(<SaveStatusHarness save={() => Promise.resolve()} persistence="memory" onReady={(a) => (api = a)} />);
    const status = screen.getByRole("status");
    const text = screen.getByTestId("status-text");
    expect(status.contains(text)).toBe(false);
    expect(screen.getByRole("alert").contains(text)).toBe(false);
    act(() => api.change("a"));
    expect(text).toHaveTextContent("저장 전 변경 있음");
    expect(status).toHaveTextContent("");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await act(() => vi.advanceTimersByTimeAsync(12_000));
    act(() => api.change("b"));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(text.textContent).toMatch(/^이 탭에 저장됨 · /);
    expect(status).toHaveTextContent("");
    expect(screen.getByRole("alert")).toHaveTextContent("");
  });

  it("저장 중 글자 '저장 중…'", async () => {
    const pending = deferred();
    let api!: { change: (d: string) => void; retry: () => void };
    render(<SaveStatusHarness save={() => pending.promise} persistence="memory" onReady={(a) => (api = a)} />);
    act(() => api.change("a"));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByTestId("status-text")).toHaveTextContent("저장 중…");
    pending.resolve();
    await act(() => vi.advanceTimersByTimeAsync(12_000));
    expect(screen.getByTestId("status-text")).toHaveTextContent("이 탭에 저장됨");
  });

  it("연속 2회 실패에도 alert 1회, 다시 저장 성공 → '다시 저장했습니다'", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("x"))
      .mockRejectedValueOnce(new Error("y"))
      .mockResolvedValue(undefined);
    let api!: { change: (d: string) => void; retry: () => void };
    const alertTexts: string[] = [];
    render(<SaveStatusHarness save={save} persistence="server" onReady={(a) => (api = a)} />);
    const alert = screen.getByRole("alert");
    const observer = new MutationObserver(() => alertTexts.push(alert.textContent ?? ""));
    observer.observe(alert, { childList: true, subtree: true, characterData: true });
    act(() => api.change("a"));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByTestId("status-text")).toHaveTextContent("저장하지 못했습니다");
    act(() => api.retry());
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("a");
    expect(alertTexts.filter((t) => t === "저장하지 못했습니다")).toHaveLength(1);
    act(() => api.retry());
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByRole("status")).toHaveTextContent("다시 저장했습니다");
    expect(screen.getByTestId("status-text")).toHaveTextContent("저장됨 · 방금");
    observer.disconnect();
  });
});
