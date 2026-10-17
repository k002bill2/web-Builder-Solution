/**
 * RS6-L2 CP3 — `T_hang` alert 1회 · 레이아웃 재마운트 재발화 0(UX5-AC-01 · I6 8.4). 문구 본문은 L4 — 키(`SAVE_HANG_ALERT`)와
 * `role=alert`·`aria-busy` 결선만 단언한다. 상태 열은 실제 스케줄러 + watchSaving(가짜 타이머 · 시간 = 상수 참조)에서 받는다.
 */
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SaveStatus } from "../../../components/studio/SaveStatus";
import { createAutosaveScheduler, type AutosaveState } from "../useAutosaveScheduler";
import { SAVE_HANG_ALERT } from "./alertKeys";
import { SAVE_HANG_MS, watchSaving } from "./liveness";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

const DEBOUNCE = 100;
const at = (state: AutosaveState) => <SaveStatus state={state} persistence="local" onRetry={() => undefined} />;
const hangKey = () => screen.getByRole("alert").getAttribute("data-alert-key");

/** 스케줄러 상태 열 — 저장은 끝나지 않는다(정지) */
function stalled() {
  const states: AutosaveState[] = [];
  const watcher = watchSaving((st) => void states.push(st));
  const s = createAutosaveScheduler<string>({ save: () => new Promise(() => undefined), debounceMs: DEBOUNCE, onChange: watcher.onChange });
  return { s, states, last: () => states[states.length - 1]! };
}

describe("RS6-L2 CP3 · T_hang alert", () => {
  it("저장 정지 → T_hang 전 키 0 · T_hang 뒤 alert 키 1회 · 이후 다시 그려도 그대로 1개", async () => {
    const { s, last } = stalled();
    const { rerender } = render(at({ phase: "idle" }));
    s.change("A");
    await act(() => vi.advanceTimersByTimeAsync(DEBOUNCE));
    rerender(at(last()));
    expect(hangKey()).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(SAVE_HANG_MS - 1));
    rerender(at(last()));
    expect(last()).toMatchObject({ phase: "saving", slow: true });
    expect(hangKey()).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(1));
    rerender(at(last()));
    expect(hangKey()).toBe(SAVE_HANG_ALERT);
    rerender(at({ ...last() }));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(hangKey()).toBe(SAVE_HANG_ALERT);
  });

  it("레이아웃 재마운트(같은 정지) → alert 키 재발화 0 · 다음 정지(새 차례)는 다시 1회", async () => {
    const { s, last } = stalled();
    s.change("A");
    await act(() => vi.advanceTimersByTimeAsync(DEBOUNCE + SAVE_HANG_MS));
    const hung = last();
    expect(hung.hang).toBe(1);
    const first = render(at({ phase: "saving" }));
    first.rerender(at(hung));
    expect(hangKey()).toBe(SAVE_HANG_ALERT);
    first.unmount();
    const again = render(at(hung));
    expect(hangKey()).toBeNull();
    again.rerender(at({ phase: "saving", slow: true, hang: 2 }));
    expect(hangKey()).toBe(SAVE_HANG_ALERT);
  });

  it("aria-busy = 저장 중(slow 포함)만 · 끝나면 해제", () => {
    const { rerender } = render(at({ phase: "saving" }));
    expect(screen.getByText("저장 중…")).toHaveAttribute("aria-busy", "true");
    // RS6-L4 CP1: slow = LV-1 꼬리(I6 3절) — 글자는 바뀌어도 aria-busy는 그대로
    rerender(at({ phase: "saving", slow: true }));
    expect(screen.getByText("저장 중… · 브라우저 응답이 늦습니다")).toHaveAttribute("aria-busy", "true");
    rerender(at({ phase: "saved", lastSavedAt: Date.now() }));
    expect(screen.getByText(/이 브라우저에 저장됨/)).not.toHaveAttribute("aria-busy");
  });
});
