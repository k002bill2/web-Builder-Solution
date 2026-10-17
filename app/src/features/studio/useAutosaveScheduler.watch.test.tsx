/**
 * RS6-L3a CP1 감시 결선(L2 QA 7절 2 · RS6-L2 REPORT 4절 2) — 훅이 `watchSaving(setState)`을 쓰고 dispose 때 스케줄러와 함께 `stop()`.
 * 표지만 붙는다(phase `saving` 그대로) · 언마운트 뒤 남은 감시 타이머 0.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SAVE_HANG_MS, SAVE_SLOW_MS } from "./save/liveness";
import { useAutosaveScheduler } from "./useAutosaveScheduler";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RS6-L3a CP1 · useAutosaveScheduler 감시 결선", () => {
  it("저장이 SAVE_SLOW_MS를 넘으면 slow · SAVE_HANG_MS면 hang 차례 — phase는 saving 그대로", async () => {
    const { result } = renderHook(() => useAutosaveScheduler<string>({ save: () => new Promise(() => undefined), persistence: "local", debounceMs: 10 }));
    act(() => result.current.change("a"));
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(result.current.state).toMatchObject({ phase: "saving" });
    expect(result.current.state.slow).toBeUndefined();
    await act(() => vi.advanceTimersByTimeAsync(SAVE_SLOW_MS));
    expect(result.current.state).toMatchObject({ phase: "saving", slow: true });
    await act(() => vi.advanceTimersByTimeAsync(SAVE_HANG_MS - SAVE_SLOW_MS));
    expect(result.current.state).toMatchObject({ phase: "saving", slow: true, hang: 1 });
  });

  it("저장 중 언마운트 = 스케줄러 dispose + 감시 stop — 남은 타이머 0", async () => {
    const { result, unmount } = renderHook(() => useAutosaveScheduler<string>({ save: () => new Promise(() => undefined), persistence: "local", debounceMs: 10 }));
    act(() => result.current.change("a"));
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(result.current.state.phase).toBe("saving");
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
