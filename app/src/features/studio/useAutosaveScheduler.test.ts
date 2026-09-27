import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError } from "../../data/projectRepository";
import { saveAnnouncement } from "./saveStatusText";
import { createAutosaveScheduler, needsUnloadGuard, type AutosaveState } from "./useAutosaveScheduler";

interface Deferred {
  readonly promise: Promise<unknown>;
  readonly resolve: (value?: unknown) => void;
  readonly reject: (error: unknown) => void;
}

function deferred(): Deferred {
  let resolve!: (value?: unknown) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<unknown>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function setup(save: (doc: string) => Promise<unknown>, isOnline: () => boolean = () => true) {
  const states: AutosaveState[] = [];
  const saveMock = vi.fn(save);
  const scheduler = createAutosaveScheduler<string>({
    save: saveMock,
    isOnline,
    onChange: (s) => states.push(s),
    now: () => Date.now(),
  });
  const last = (): AutosaveState => states[states.length - 1] ?? { phase: "idle" };
  return { scheduler, saveMock, states, last };
}

/** 실제로 내보낸 상태 열을 이웃 쌍으로 접어 알림을 모은다 */
function announcementsOf(states: readonly AutosaveState[]) {
  return states.flatMap((next, i) => {
    const prev: AutosaveState = states[i - 1] ?? { phase: "idle" };
    const a = saveAnnouncement(prev, next);
    return a ? [a] : [];
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createAutosaveScheduler — 타이밍 (E-AC-07)", () => {
  it("마지막 변경 2초 뒤 저장 1회(1999ms에는 아직 없음)", async () => {
    const { scheduler, saveMock, last } = setup(() => Promise.resolve());
    scheduler.change("a");
    expect(last().phase).toBe("dirty");
    await vi.advanceTimersByTimeAsync(1999);
    expect(saveMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith("a");
    expect(last().phase).toBe("saved");
    expect(last().lastSavedAt).toBe(Date.now());
    await vi.advanceTimersByTimeAsync(60_000);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("디바운스 중 새 변경은 타이머를 다시 잡는다", async () => {
    const { scheduler, saveMock } = setup(() => Promise.resolve());
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(1500);
    scheduler.change("b");
    await vi.advanceTimersByTimeAsync(1999);
    expect(saveMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith("b");
  });

  it("1초 간격 연속 입력 30초 → 첫 변경 30초 시점까지 저장 ≥ 1회(maxWait)", async () => {
    const { scheduler, saveMock } = setup(() => Promise.resolve());
    scheduler.change("v0");
    for (let i = 1; i < 30; i += 1) {
      await vi.advanceTimersByTimeAsync(1000);
      expect(saveMock).not.toHaveBeenCalled();
      scheduler.change(`v${i}`);
    }
    await vi.advanceTimersByTimeAsync(1000);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith("v29");
  });

  it("저장 중 변경 3개 → 끝난 뒤 저장 1회(마지막 문서), 그 뒤 추가 저장 없음", async () => {
    const first = deferred();
    const { scheduler, saveMock, last } = setup(vi.fn<(doc: string) => Promise<unknown>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(undefined));
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(last().phase).toBe("saving");
    scheduler.change("b");
    scheduler.change("c");
    scheduler.change("d");
    await vi.advanceTimersByTimeAsync(5000);
    expect(saveMock).toHaveBeenCalledTimes(1);
    first.resolve();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(saveMock).toHaveBeenCalledTimes(2);
    expect(saveMock).toHaveBeenLastCalledWith("d");
    expect(last().phase).toBe("saved");
  });

  it("저장 중 변경이 있고 디바운스가 아직이면 끝난 뒤 dirty로 남았다가 디바운스에 저장", async () => {
    const first = deferred();
    const { scheduler, saveMock, last } = setup(vi.fn<(doc: string) => Promise<unknown>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(undefined));
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.change("b");
    await vi.advanceTimersByTimeAsync(500);
    first.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(last().phase).toBe("dirty");
    await vi.advanceTimersByTimeAsync(1499);
    expect(saveMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(saveMock).toHaveBeenCalledTimes(2);
    expect(saveMock).toHaveBeenLastCalledWith("b");
  });
});

describe("createAutosaveScheduler — 실패·오프라인·STALE (E-S07~E-S09)", () => {
  it("실패 → failed(문서 유지), retry → 같은 문서로 저장 → saved(recovered)", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ProjectRepositoryError("INFRA", "boom"))
      .mockResolvedValue(undefined);
    const { scheduler, saveMock, last } = setup(save);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(last()).toMatchObject({ phase: "failed", failure: "error" });
    await vi.advanceTimersByTimeAsync(60_000);
    expect(saveMock).toHaveBeenCalledTimes(1);
    scheduler.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(saveMock).toHaveBeenCalledTimes(2);
    expect(saveMock).toHaveBeenLastCalledWith("a");
    expect(last()).toMatchObject({ phase: "saved", recovered: true });
    expect(last().failure).toBeUndefined();
  });

  it("다른 예외(저장소 오류 아님)도 failed", async () => {
    const { scheduler, last } = setup(() => Promise.reject(new Error("chunk")));
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(last().phase).toBe("failed");
  });

  it("연속 2회 실패 + 다시 저장 성공: 실제 상태 열에서 alert 1회 · '다시 저장했습니다' 1회 (E-AC-09)", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("x"))
      .mockRejectedValueOnce(new Error("y"))
      .mockResolvedValue(undefined);
    const { scheduler, states, last } = setup(save);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.change("b");
    await vi.advanceTimersByTimeAsync(2000);
    expect(last().phase).toBe("failed");
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("b");
    scheduler.retry();
    await vi.advanceTimersByTimeAsync(0);
    const announcements = announcementsOf(states);
    expect(announcements.filter((a) => a.kind === "alert")).toEqual([{ kind: "alert", text: "저장하지 못했습니다" }]);
    expect(announcements.filter((a) => a.kind === "status")).toEqual([{ kind: "status", text: "다시 저장했습니다" }]);
  });

  it("실패 뒤 다음 변경은 디바운스로 재시도한다", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new Error("x"))
      .mockResolvedValue(undefined);
    const { scheduler, last } = setup(save);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.change("b");
    expect(last().phase).toBe("failed");
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(last()).toMatchObject({ phase: "saved", recovered: true });
  });

  it("저장 시점에 오프라인이면 저장하지 않고 offline, 연결되면 저장 1회", async () => {
    let online = false;
    const { scheduler, saveMock, last } = setup(() => Promise.resolve(), () => online);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(saveMock).not.toHaveBeenCalled();
    expect(last()).toMatchObject({ phase: "offline", failure: "offline" });
    scheduler.change("b");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(saveMock).not.toHaveBeenCalled();
    online = true;
    scheduler.setOnline(true);
    await vi.advanceTimersByTimeAsync(0);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(saveMock).toHaveBeenCalledWith("b");
    await vi.advanceTimersByTimeAsync(60_000);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(last()).toMatchObject({ phase: "saved", recovered: true });
  });

  it("setOnline(false)는 isOnline()이 true여도 저장을 막는다", async () => {
    const { scheduler, saveMock, last } = setup(() => Promise.resolve());
    scheduler.setOnline(false);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(saveMock).not.toHaveBeenCalled();
    expect(last().phase).toBe("offline");
  });

  it("변경이 없을 때 online → 저장하지 않는다", async () => {
    const { scheduler, saveMock } = setup(() => Promise.resolve());
    scheduler.setOnline(false);
    scheduler.setOnline(true);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(saveMock).not.toHaveBeenCalled();
  });

  it("NETWORK 거부 → offline(status 1회), 다음 변경은 다시 시도한다", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ProjectRepositoryError("NETWORK", "down"))
      .mockRejectedValueOnce(new ProjectRepositoryError("NETWORK", "down"))
      .mockResolvedValue(undefined);
    const { scheduler, states, last } = setup(save);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(last()).toMatchObject({ phase: "offline", failure: "offline" });
    scheduler.change("b");
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(last().phase).toBe("offline");
    const offlineNotices = announcementsOf(states).filter((a) => a.text === "오프라인 — 연결되면 저장합니다");
    expect(offlineNotices).toHaveLength(1);
  });

  it("STALE_DOC → stale, 이후 변경은 저장 0회, resume → 즉시 저장", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ProjectRepositoryError("STALE_DOC", "stale"))
      .mockResolvedValue(undefined);
    const { scheduler, states, last } = setup(save);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    expect(last().phase).toBe("stale");
    scheduler.change("b");
    scheduler.retry();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(last().phase).toBe("stale");
    scheduler.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("b");
    expect(last().phase).toBe("saved");
    expect(announcementsOf(states).filter((a) => a.kind === "alert")).toHaveLength(1);
  });

  it("저장 중 변경이 있어도 STALE_DOC 거부면 stale", async () => {
    const first = deferred();
    const { scheduler, saveMock, last } = setup(vi.fn<(doc: string) => Promise<unknown>>()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValue(undefined));
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.change("b");
    first.reject(new ProjectRepositoryError("STALE_DOC", "stale"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(last().phase).toBe("stale");
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("resume — 저장 못 한 변경이 남아 있으면 즉시 다시 저장", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ProjectRepositoryError("STALE_DOC", "stale"))
      .mockResolvedValue(undefined);
    const { scheduler, last } = setup(save);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.resume();
    await vi.advanceTimersByTimeAsync(0);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("a");
    expect(last().phase).toBe("saved");
  });

  it("retry — 저장할 것이 없거나 저장 중이면 아무것도 하지 않는다", async () => {
    const first = deferred();
    const { scheduler, saveMock } = setup(vi.fn<(doc: string) => Promise<unknown>>().mockReturnValue(first.promise));
    scheduler.retry();
    expect(saveMock).not.toHaveBeenCalled();
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("dispose — 타이머를 지우고 진행 중 저장이 끝나도 onChange를 부르지 않는다", async () => {
    const first = deferred();
    const { scheduler, saveMock, states } = setup(vi.fn<(doc: string) => Promise<unknown>>().mockReturnValue(first.promise));
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.change("b");
    const count = states.length;
    scheduler.dispose();
    first.resolve();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(states).toHaveLength(count);
    expect(saveMock).toHaveBeenCalledTimes(1);
  });

  it("상태 객체는 매번 새 객체다(불변)", async () => {
    const { scheduler, states } = setup(() => Promise.resolve());
    scheduler.change("a");
    scheduler.change("b");
    await vi.advanceTimersByTimeAsync(2000);
    const unique = new Set(states);
    expect(unique.size).toBe(states.length);
    expect(states.every((s) => Object.isFrozen(s))).toBe(true);
  });
});

describe("needsUnloadGuard (E-S10)", () => {
  it("메모리는 늘 true, 서버는 저장 전 변경·저장 중·실패·오프라인·STALE일 때만", () => {
    for (const phase of ["idle", "dirty", "saving", "saved", "failed", "offline", "stale"] as const) {
      expect(needsUnloadGuard("memory", phase)).toBe(true);
    }
    expect(needsUnloadGuard("server", "idle")).toBe(false);
    expect(needsUnloadGuard("server", "saved")).toBe(false);
    for (const phase of ["dirty", "saving", "failed", "offline", "stale"] as const) {
      expect(needsUnloadGuard("server", phase)).toBe(true);
    }
  });
});

describe("createAutosaveScheduler — settle (E-S09 충돌 해결 뒤, EDITOR-A2-FIELDS F4)", () => {
  it("STALE 중 settle → 미저장 변경을 저장된 것으로 정리 · saved · 저장 0회 · 다음 변경은 다시 디바운스 저장", async () => {
    const save = vi.fn<(doc: string) => Promise<unknown>>()
      .mockRejectedValueOnce(new ProjectRepositoryError("STALE_DOC", "stale"))
      .mockResolvedValue(undefined);
    const { scheduler, states, last } = setup(save);
    scheduler.change("a");
    await vi.advanceTimersByTimeAsync(2000);
    scheduler.change("b");
    expect(last().phase).toBe("stale");
    scheduler.settle();
    expect(last()).toMatchObject({ phase: "saved" });
    expect(last().lastSavedAt).toBe(Date.now());
    await vi.advanceTimersByTimeAsync(60_000);
    expect(save).toHaveBeenCalledTimes(1);
    expect(announcementsOf(states).filter((a) => a.kind === "alert")).toHaveLength(1);
    scheduler.change("c");
    await vi.advanceTimersByTimeAsync(2000);
    expect(save).toHaveBeenCalledTimes(2);
    expect(save).toHaveBeenLastCalledWith("c");
  });

  it("dispose 뒤 settle은 아무것도 하지 않는다", () => {
    const { scheduler, states } = setup(() => Promise.resolve());
    scheduler.dispose();
    scheduler.settle();
    expect(states).toHaveLength(0);
  });
});
