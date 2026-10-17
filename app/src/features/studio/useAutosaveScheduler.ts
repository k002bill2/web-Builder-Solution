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
 * - 그 밖의 예외(저장소 오류 아님 · `STALE_DOC` 포함) → `failed`. `stale` 단계·`resume()`은 RS7-A(B-RS-07)에서 제거 — 제품 도달 0.
 * - `failure`는 해결되지 않은 실패 종류로, 성공한 저장만 지운다(saving·dirty 동안 유지) — 연속 실패 알림 1회의 근거.
 *   실패를 지운 성공 상태에는 `recovered: true`.
 * - `settle()` = 저장소가 이미 정리한 뒤(복원 채택·저장 확인) — 미저장 변경을 저장된 것으로 보고 `saved`(저장 0회).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { projectErrorCode, type ProjectPersistence } from "../../data/projectRepository";
import { watchSaving } from "./save/liveness";

export type AutosavePhase = "idle" | "dirty" | "saving" | "saved" | "failed" | "offline";
export type AutosaveFailure = "error" | "offline";

export interface AutosaveState {
  readonly phase: AutosavePhase;
  /** 마지막으로 저장에 성공한 시각(`now()` 값) */
  readonly lastSavedAt?: number;
  /** 해결되지 않은 실패 종류 — 성공한 저장만 지운다 */
  readonly failure?: AutosaveFailure;
  /** 실패를 지운 첫 성공 상태 */
  readonly recovered?: boolean;
  /** LV-1 감시 표지(`save/liveness.ts` watchSaving — phase는 saving 그대로): 저장이 `SAVE_SLOW_MS`를 넘김 */
  readonly slow?: true;
  /** LV-1 감시 표지: 저장이 `SAVE_HANG_MS`를 넘김 — 그 저장 차례 번호(재마운트가 같은 정지를 다시 알리지 않게) */
  readonly hang?: number;
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
  /** 돌려주는 값 = 재시도 직후 단계(떠나기 대기가 effect 전에 읽는다, B-RS-01) */
  retry(): AutosavePhase;
  setOnline(online: boolean): void;
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

/** E-S10 — 메모리는 늘(새로고침하면 문서가 사라진다), 서버·로컬(ADR-007 P1)은 저장 전 변경·저장 중·실패·오프라인일 때만.
 * RS6-L3b(I6 3.1-2): 실제 경고는 코어 레지스트리(`memoryProjectRepository`)가 같은 규칙(코어 dirty·inflight · memory 늘)으로 소유한다 — 이 훅은 등록하지 않는다 */
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
    this.armTimers();
    if (this.state.phase === "idle" || this.state.phase === "saved") {
      this.emit({ phase: "dirty", lastSavedAt: this.state.lastSavedAt });
    }
  }

  retry(): AutosavePhase {
    if (!(this.disposed || this.saving || !this.pending())) this.flush();
    return this.state.phase;
  }

  setOnline(online: boolean): void {
    if (this.disposed) return;
    this.online = online;
    if (this.saving || !this.pending()) return;
    if (online) this.flush();
    else this.emitOffline();
  }

  settle(): void {
    if (this.disposed) return;
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
    if (this.disposed || this.saving || !this.pending()) return;
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
    const { lastSavedAt } = this.state;
    if (code === "NETWORK") {
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
  readonly retry: () => AutosavePhase | undefined;
  readonly settle: () => void;
}

/** 얇은 훅 — window online/offline 연결, unmount 정리. 떠나기 경고는 코어 레지스트리 몫(RS6-L3b · I6 3.1-2 — 리스너 중복 0) */
export function useAutosaveScheduler<T>({ save, debounceMs, maxWaitMs }: UseAutosaveOptions<T>): UseAutosave<T> {
  const [state, setState] = useState<AutosaveState>(IDLE);
  const saveRef = useRef(save);
  const schedulerRef = useRef<AutosaveScheduler<T> | null>(null);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  useEffect(() => {
    // LV-1 감시(RS6-L3a) — 표지(slow·hang)만 붙인다 · dispose 때 스케줄러와 함께 stop(L2 QA 7절 2)
    const watch = watchSaving(setState);
    const scheduler = createAutosaveScheduler<T>({
      save: (doc) => saveRef.current(doc),
      debounceMs,
      maxWaitMs,
      isOnline: () => navigator.onLine,
      onChange: watch.onChange,
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
      watch.stop();
      schedulerRef.current = null;
    };
  }, [debounceMs, maxWaitMs]);

  const change = useCallback((doc: T) => schedulerRef.current?.change(doc), []);
  const retry = useCallback(() => schedulerRef.current?.retry(), []);
  const settle = useCallback(() => schedulerRef.current?.settle(), []);
  return { state, change, retry, settle };
}
