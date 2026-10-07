/**
 * 자동 저장 스케줄러 (DS-2A-05 SPEC 5.10 · E-S06~E-S10). 문서 모양은 L4 엔진 계약이라 제네릭 `T`로 둔다 — engine import 0.
 *
 * 규칙
 * - 마지막 변경 2초 뒤(디바운스), 첫 미저장 변경부터 늦어도 30초(maxWait)에 저장한다.
 * - 저장은 한 번에 하나. 저장 중 변경은 모아서 끝난 뒤 저장 1회(최신 문서):
 *   저장 중에도 변경마다 디바운스·maxWait 타이머를 새로 잡는다(maxWait 기준 = 저장 시작 뒤 첫 변경).
 *   저장 중에 타이머가 끝나면 표시만 해 두고, 저장이 끝나는 즉시 한 번 더 저장한다.
 *   타이머가 아직이면 `dirty`로 남아 타이머대로 저장한다.
 * - 저장된 판정은 문서 동일성이 아니라 변경 카운터로 한다(저장 시작 뒤 변경이 있으면 여전히 미저장).
 * - 실패 → `failed`(문서 유지). 다음 변경(디바운스) 또는 `retry()`로 재시도. 실패 중 변경은 `failed` 글자를 유지한다.
 * - 오프라인: 저장 시점에 `setOnline(false)` 또는 `isOnline()`이 false면 저장하지 않고 `offline`.
 *   `NETWORK` 거부도 `offline` — 브라우저가 온라인이면 `online` 이벤트가 오지 않으므로 다음 변경·`retry()`가 다시 시도한다.
 *   `setOnline(true)` → 미저장 변경이 있으면 즉시 저장 1회. `setOnline(false)`는 미저장 변경이 있을 때만 바로 `offline`을 알린다.
 * - `STALE_DOC` → `stale`. 저장 중 변경이 있었어도 `stale`. `resume()` 전까지 변경은 기록만 하고 저장·재시도하지 않는다.
 *   `resume()` → 미저장 변경이 있으면 즉시 저장, 없으면 `saved`(또는 `idle`).
 * - 그 밖의 예외(저장소 오류 아님 포함) → `failed`.
 * - `failure`는 해결되지 않은 실패 종류로, 성공한 저장만 지운다(saving·dirty 동안 유지) — 연속 실패 알림 1회의 근거.
 *   실패를 지운 성공 상태에는 `recovered: true`.
 * - `settle()` = 충돌 해결(E-S09)로 저장소가 이미 정리한 뒤 — 미저장 변경을 저장된 것으로 보고 `saved`(STALE 해제, 저장 0회).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { projectErrorCode, type ProjectPersistence } from "../../data/projectRepository";

export type AutosavePhase = "idle" | "dirty" | "saving" | "saved" | "failed" | "offline" | "stale";
export type AutosaveFailure = "error" | "offline";

export interface AutosaveState {
  readonly phase: AutosavePhase;
  /** 마지막으로 저장에 성공한 시각(`now()` 값) */
  readonly lastSavedAt?: number;
  /** 해결되지 않은 실패 종류 — 성공한 저장만 지운다 */
  readonly failure?: AutosaveFailure;
  /** 실패를 지운 첫 성공 상태 */
  readonly recovered?: boolean;
}

export interface AutosaveOptions<T> {
  readonly save: (doc: T) => Promise<unknown>;
  readonly debounceMs?: number;
  readonly maxWaitMs?: number;
  readonly isOnline?: () => boolean;
  readonly onChange: (state: AutosaveState) => void;
  readonly now?: () => number;
}

export interface AutosaveScheduler<T> {
  change(doc: T): void;
  retry(): void;
  setOnline(online: boolean): void;
  resume(): void;
  settle(): void;
  dispose(): void;
}

export const AUTOSAVE_DEBOUNCE_MS = 2000;
export const AUTOSAVE_MAX_WAIT_MS = 30_000;
const IDLE: AutosaveState = Object.freeze({ phase: "idle" });

function makeState(fields: AutosaveState): AutosaveState {
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined);
  return Object.freeze(Object.fromEntries(entries) as unknown as AutosaveState);
}

/** E-S10 — 메모리는 늘(새로고침하면 문서가 사라진다), 서버·로컬(ADR-007 P1)은 저장 전 변경·저장 중·실패·오프라인·STALE일 때만 */
export function needsUnloadGuard(persistence: ProjectPersistence, phase: AutosavePhase): boolean {
  if (persistence === "memory") return true;
  return phase !== "idle" && phase !== "saved";
}

class Scheduler<T> implements AutosaveScheduler<T> {
  private doc: T | undefined;
  private version = 0;
  private savedVersion = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private maxWaitTimer: ReturnType<typeof setTimeout> | undefined;
  private saving = false;
  private flushAfterSave = false;
  private stale = false;
  private online = true;
  private disposed = false;
  private state: AutosaveState = IDLE;
  private readonly options: AutosaveOptions<T>;

  constructor(options: AutosaveOptions<T>) {
    this.options = options;
  }

  change(doc: T): void {
    if (this.disposed) return;
    this.doc = doc;
    this.version += 1;
    if (this.stale) return;
    this.armTimers();
    if (this.state.phase === "idle" || this.state.phase === "saved") {
      this.emit({ phase: "dirty", lastSavedAt: this.state.lastSavedAt });
    }
  }

  retry(): void {
    if (this.disposed || this.stale || this.saving || !this.pending()) return;
    this.flush();
  }

  setOnline(online: boolean): void {
    if (this.disposed) return;
    this.online = online;
    if (this.stale || this.saving || !this.pending()) return;
    if (online) this.flush();
    else this.emitOffline();
  }

  resume(): void {
    if (this.disposed || !this.stale) return;
    this.stale = false;
    if (this.pending()) {
      this.flush();
      return;
    }
    const { lastSavedAt, failure } = this.state;
    this.emit({ phase: lastSavedAt === undefined ? "idle" : "saved", lastSavedAt, failure });
  }

  settle(): void {
    if (this.disposed) return;
    this.stale = false;
    this.flushAfterSave = false;
    this.clearTimers();
    this.savedVersion = this.version;
    this.emit({ phase: "saved", lastSavedAt: (this.options.now ?? Date.now)() });
  }

  dispose(): void {
    this.disposed = true;
    this.clearTimers();
  }

  private pending(): boolean {
    return this.version > this.savedVersion;
  }

  private isOnline(): boolean {
    return this.online && (this.options.isOnline?.() ?? true);
  }

  private armTimers(): void {
    if (this.debounceTimer !== undefined) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.onTimer(), this.options.debounceMs ?? AUTOSAVE_DEBOUNCE_MS);
    if (this.maxWaitTimer === undefined) {
      this.maxWaitTimer = setTimeout(() => this.onTimer(), this.options.maxWaitMs ?? AUTOSAVE_MAX_WAIT_MS);
    }
  }

  private clearTimers(): void {
    if (this.debounceTimer !== undefined) clearTimeout(this.debounceTimer);
    if (this.maxWaitTimer !== undefined) clearTimeout(this.maxWaitTimer);
    this.debounceTimer = undefined;
    this.maxWaitTimer = undefined;
  }

  private onTimer(): void {
    if (this.saving) {
      this.clearTimers();
      this.flushAfterSave = true;
      return;
    }
    this.flush();
  }

  private flush(): void {
    this.clearTimers();
    if (this.disposed || this.stale || this.saving || !this.pending()) return;
    if (!this.isOnline()) {
      this.emitOffline();
      return;
    }
    this.startSave();
  }

  private startSave(): void {
    const version = this.version;
    this.saving = true;
    this.flushAfterSave = false;
    this.emit({ phase: "saving", lastSavedAt: this.state.lastSavedAt, failure: this.state.failure });
    this.options.save(this.doc as T).then(
      () => this.onSaved(version),
      (error: unknown) => this.onFailed(error),
    );
  }

  private onSaved(version: number): void {
    if (this.disposed) return;
    this.saving = false;
    this.savedVersion = Math.max(this.savedVersion, version);
    const recovered = this.state.failure !== undefined ? true : undefined;
    const lastSavedAt = (this.options.now ?? Date.now)();
    if (!this.pending()) {
      this.emit({ phase: "saved", lastSavedAt, recovered });
      return;
    }
    this.emit({ phase: "dirty", lastSavedAt, recovered });
    if (this.flushAfterSave) this.flush();
  }

  private onFailed(error: unknown): void {
    if (this.disposed) return;
    this.saving = false;
    this.flushAfterSave = false;
    const code = projectErrorCode(error);
    const { lastSavedAt, failure } = this.state;
    if (code === "STALE_DOC") {
      this.stale = true;
      this.clearTimers();
      this.emit({ phase: "stale", lastSavedAt, failure });
    } else if (code === "NETWORK") {
      this.emit({ phase: "offline", lastSavedAt, failure: "offline" });
    } else {
      this.emit({ phase: "failed", lastSavedAt, failure: "error" });
    }
  }

  private emitOffline(): void {
    this.emit({ phase: "offline", lastSavedAt: this.state.lastSavedAt, failure: "offline" });
  }

  private emit(fields: AutosaveState): void {
    this.state = makeState(fields);
    this.options.onChange(this.state);
  }
}

export function createAutosaveScheduler<T>(options: AutosaveOptions<T>): AutosaveScheduler<T> {
  return new Scheduler<T>(options);
}

export interface UseAutosaveOptions<T> {
  readonly save: (doc: T) => Promise<unknown>;
  readonly persistence: ProjectPersistence;
  readonly debounceMs?: number;
  readonly maxWaitMs?: number;
}

export interface UseAutosave<T> {
  readonly state: AutosaveState;
  readonly change: (doc: T) => void;
  readonly retry: () => void;
  readonly resume: () => void;
  readonly settle: () => void;
}

/** 얇은 훅 — window online/offline 연결, 떠나기 경고(needsUnloadGuard일 때만 등록), unmount 정리 */
export function useAutosaveScheduler<T>({ save, persistence, debounceMs, maxWaitMs }: UseAutosaveOptions<T>): UseAutosave<T> {
  const [state, setState] = useState<AutosaveState>(IDLE);
  const saveRef = useRef(save);
  const schedulerRef = useRef<AutosaveScheduler<T> | null>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    const scheduler = createAutosaveScheduler<T>({
      save: (doc) => saveRef.current(doc),
      debounceMs,
      maxWaitMs,
      isOnline: () => navigator.onLine,
      onChange: setState,
    });
    schedulerRef.current = scheduler;
    const goOnline = () => scheduler.setOnline(true);
    const goOffline = () => scheduler.setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      scheduler.dispose();
      schedulerRef.current = null;
    };
  }, [debounceMs, maxWaitMs]);

  const guard = needsUnloadGuard(persistence, state.phase);
  useEffect(() => {
    if (!guard) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [guard]);

  const change = useCallback((doc: T) => schedulerRef.current?.change(doc), []);
  const retry = useCallback(() => schedulerRef.current?.retry(), []);
  const resume = useCallback(() => schedulerRef.current?.resume(), []);
  const settle = useCallback(() => schedulerRef.current?.settle(), []);
  return { state, change, retry, resume, settle };
}
