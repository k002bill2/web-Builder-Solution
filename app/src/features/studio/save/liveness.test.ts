/**
 * RS6-L2 CP1 — LV-1 저장 감시(RS6-AC-U4). 스케줄러 층은 가짜 타이머(시간 = 상수 참조, 리터럴 0), 코어 층은 testRig `hold`(commit 지연 주입).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAutosaveScheduler, type AutosaveState } from "../useAutosaveScheduler";
import { SAVE_HANG_MS, SAVE_SLOW_MS, watchSaving } from "./liveness";
import { edited, startedRig, ticks } from "./testRig";

const DEBOUNCE = 100;

function pendingSaves() {
  const calls: { doc: string; resolve: () => void; reject: (e: unknown) => void }[] = [];
  const save = (doc: string) => new Promise<void>((resolve, reject) => void calls.push({ doc, resolve, reject }));
  return { calls, save };
}

function rig(watch = true) {
  const states: AutosaveState[] = [];
  const saves = pendingSaves();
  const record = (st: AutosaveState) => void states.push(st);
  const watcher = watchSaving(record);
  const s = createAutosaveScheduler<string>({ save: saves.save, debounceMs: DEBOUNCE, maxWaitMs: 10 * DEBOUNCE, onChange: watch ? watcher.onChange : record });
  const last = () => states[states.length - 1]!;
  return { s, states, saves, last, watcher };
}

describe("RS6-L2 CP1 · LV-1 스케줄러 감시", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("U4 T_slow 전 = saving · T_slow 뒤 = saving + slow · 추가 save 제출 0", async () => {
    const { s, saves, last } = rig();
    s.change("A");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    expect(saves.calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(SAVE_SLOW_MS - 1);
    expect(last()).toMatchObject({ phase: "saving" });
    expect(last().slow).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(last()).toMatchObject({ phase: "saving", slow: true });
    expect(saves.calls).toHaveLength(1);
  });

  it("U4 slow 중 편집 계속 수용 · 디바운스·maxWait가 지나도 save 1개 · 해제 뒤 최신 1회", async () => {
    const { s, saves, last } = rig();
    s.change("A");
    await vi.advanceTimersByTimeAsync(DEBOUNCE + SAVE_SLOW_MS);
    s.change("B");
    s.change("C");
    await vi.advanceTimersByTimeAsync(20 * DEBOUNCE);
    expect(saves.calls.map((c) => c.doc)).toEqual(["A"]);
    expect(last()).toMatchObject({ phase: "saving", slow: true });
    saves.calls[0]!.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(saves.calls.map((c) => c.doc)).toEqual(["A", "C"]);
    expect(last()).toMatchObject({ phase: "saving" });
    expect(last().slow).toBeUndefined();
  });

  it("T_slow 전에 끝난 저장(성공·실패)은 뒤에 slow 표지를 덮지 않는다", async () => {
    const ok = rig();
    ok.s.change("A");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    ok.saves.calls[0]!.resolve();
    await vi.advanceTimersByTimeAsync(SAVE_HANG_MS * 2);
    expect(ok.states.some((st) => st.slow || st.hang !== undefined)).toBe(false);
    expect(ok.last()).toMatchObject({ phase: "saved" });

    const bad = rig();
    bad.s.change("A");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    bad.saves.calls[0]!.reject(new Error("x"));
    await vi.advanceTimersByTimeAsync(SAVE_HANG_MS * 2);
    expect(bad.states.some((st) => st.slow || st.hang !== undefined)).toBe(false);
    expect(bad.last()).toMatchObject({ phase: "failed" });
  });

  it("dispose + stop 뒤 감시 타이머 발화 0", async () => {
    const { s, states, watcher } = rig();
    s.change("A");
    await vi.advanceTimersByTimeAsync(DEBOUNCE);
    const n = states.length;
    s.dispose();
    watcher.stop();
    await vi.advanceTimersByTimeAsync(SAVE_HANG_MS * 2);
    expect(states).toHaveLength(n);
  });

  it("watch 없음(기본) = 지금 동작 그대로 — 오래 걸려도 표지 0", async () => {
    const { s, states } = rig(false);
    s.change("A");
    await vi.advanceTimersByTimeAsync(DEBOUNCE + SAVE_HANG_MS * 2);
    expect(states.map((st) => st.phase)).toEqual(["dirty", "saving"]);
    expect(states.some((st) => st.slow || st.hang !== undefined)).toBe(false);
  });
});

describe("RS6-L2 CP1 · LV-1 코어 view() = saving 출처", () => {
  it("U4 commit 지연 주입 → view().inflight 1 · 편집 수용(mark 증가) · 해제 뒤 newer · inflight 0", async () => {
    const { db, core, doc } = await startedRig();
    const c = core();
    c.edit(edited(doc, "A"));
    expect(c.view()).toMatchObject({ mark: 1, inflight: 0, dirty: true });
    const gate = db.hold();
    const saving = c.save();
    expect(c.view().inflight).toBe(1);
    // 제출 문서 동결(connect 뒤) 이후 = commit 대기 중 편집
    await ticks();
    c.edit(edited(doc, "B"));
    expect(c.view()).toMatchObject({ mark: 2, inflight: 1, dirty: true });
    gate.release();
    expect(await saving).toMatchObject({ status: "saved", newer: true });
    expect(c.view()).toMatchObject({ mark: 2, inflight: 0, dirty: true });
    expect(c.view().doc.meta.title).toBe("B");
  });
});
