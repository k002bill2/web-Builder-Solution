/**
 * `/projects` 프로젝트 삭제 흐름 (P1D-SPEC 1.3 삭제 범위 1~4 · 잠금 · J-S16·J-S17 · MQ-D1 A) — 조작 뒤 청크(대화상자와 함께 받는다).
 * IDB를 직접 한 트랜잭션(`studio`·`docs`·`images`·`meta` readwrite)으로 고친다 — 저장소 메서드가 아니다.
 * 1. state 봉투 확인(mismatch·invalid → unreadable, 쓰기 0) · 그 프로젝트 없음 → gone(이미 지워짐 = 성공과 같게).
 * 2. 새 상태: 프로젝트·머리·계열(F = profileId)·조정 기록·확정 기록·잡 제거 · `seq` = max(기존, 지운 번호) · `gen` = meta generation + 1.
 * 3. put state · put meta generation(같은 값) · delete docs/P · delete images `${P}/` 접두(슬래시 포함 — project-10 무접촉).
 * 4. 커밋 뒤 `saved` 전송 → sessionStorage 1회 키 = 이름 → `/projects` 새로고침 이동.
 * 잠금은 지우기(clearBrowserData)와 같은 판정: 이 탭이 쓰기 탭이면 보유 잠금 안에서(이때만 싱크를 먼저 멈춘다) · 아니면 tryLock · 못 잡으면 busy.
 * `envelope`·`entryRead`·`idbPersistence`·`studioStore`는 import하지 않는다(진입·복원 closure에 공유 청크 — clearBrowserData 선례). 값은 리터럴 복제 + parity 테스트.
 */
import type { LocalState } from "../../data/persistence/entryRead";
import type { TabLink } from "../../data/persistence/tabLink";
import { tryLock, type WriterLocks } from "../../data/persistence/writerLock";
import type { StudioSeq } from "../../data/studioStore";
import { seqOf } from "../../data/seqId";

/** envelope.DB_NAME과 같은 값(테스트가 단언) */
export const DELETE_DB_NAME = "design-studio";
/** 새로고침 뒤 `/projects` "프로젝트 알림"이 "'{이름}' 프로젝트를 지웠습니다"를 1회 알리는 키(값 = 이름) */
export const DELETED_KEY = "design-studio-deleted";
const SCHEMA = 1;
const GENERATION = "generation";
const STORES = ["studio", "docs", "images", "meta"];

type MutableState = { -readonly [K in keyof LocalState]-?: NonNullable<LocalState[K]> };
export type PlanResult = { readonly status: "unreadable" } | { readonly status: "gone" } | { readonly status: "ok"; readonly state: MutableState; readonly gen: number };

const envelopeData = (record: unknown, kind: string): { ok: true; data: unknown } | { ok: false } | undefined => {
  if (record === undefined) return undefined;
  const env = record as { schemaVersion?: unknown; kind?: unknown; id?: unknown } | null;
  if (!env || typeof env !== "object" || env.kind !== kind || env.id !== kind || !("data" in env) || env.schemaVersion !== SCHEMA) return { ok: false };
  return { ok: true, data: (env as { data: unknown }).data };
};
const MAPS = ["series", "commits", "adjustCommits", "jobs", "projects"] as const;
const without = <V>(map: ReadonlyMap<string, V>, drop: (key: string, value: V) => boolean) => new Map([...map].filter(([k, v]) => !drop(k, v)));

/** 순수 판정(1·2단계) — state·meta 레코드 원본 → 새 상태 */
export function planDelete(stateRecord: unknown, metaRecord: unknown, projectId: string): PlanResult {
  const read = envelopeData(stateRecord, "state");
  if (read === undefined) return { status: "gone" };
  const data = read.ok ? (read.data as Partial<LocalState> | null) : null;
  if (!data || typeof data !== "object" || MAPS.some((key) => !(data[key] instanceof Map)) || (data.heads !== undefined && !(data.heads instanceof Map))) return { status: "unreadable" };
  const state = data as LocalState;
  const target = state.projects.get(projectId);
  if (!target) return { status: "gone" };
  const profileId = target.profileId;
  const jobs = without(state.jobs, (_, stored) => stored.job.profileId === profileId);
  const deletedJob = Math.max(0, ...[...state.jobs.keys()].filter((id) => !jobs.has(id)).map((id) => seqOf("job", id)));
  const old: Partial<StudioSeq> = state.seq ?? {};
  const seq: StudioSeq = {
    project: Math.max(old.project ?? 0, seqOf("project", projectId)),
    profile: Math.max(old.profile ?? 0, seqOf("profile", profileId)),
    job: Math.max(old.job ?? 0, deletedJob),
  };
  const meta = envelopeData(metaRecord, GENERATION);
  const gen = (meta?.ok && typeof meta.data === "number" ? meta.data : 0) + 1;
  return {
    status: "ok",
    gen,
    state: {
      ...state,
      projects: without(state.projects, (id) => id === projectId),
      heads: without(state.heads ?? new Map(), (id) => id === projectId),
      series: without(state.series, (id) => id === profileId),
      adjustCommits: without(state.adjustCommits, (id) => id === profileId),
      commits: without(state.commits, (_, c) => c.profileId === profileId),
      jobs,
      seq,
      gen,
    },
  };
}

/** 그 프로젝트 이미지 키 — `${projectId}/` 접두(슬래시 포함) */
export const projectImageKeys = (keys: readonly IDBValidKey[], projectId: string): string[] =>
  keys.filter((key): key is string => typeof key === "string" && key.startsWith(`${projectId}/`));

const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((ok, ko) => {
    request.onsuccess = () => ok(request.result);
    request.onerror = () => ko(request.error);
  });

export type RunResult = "done" | "gone" | "unreadable";

/** IDB 한 트랜잭션(1~3단계) — 커밋 확인 뒤 done. 트랜잭션 실패는 거부(전부 아니면 전무) */
export async function runDelete(factory: IDBFactory, projectId: string): Promise<RunResult> {
  const db = await done(factory.open(DELETE_DB_NAME));
  db.onversionchange = () => db.close();
  try {
    if (!STORES.every((name) => db.objectStoreNames.contains(name))) return "gone";
    const tx = db.transaction(STORES, "readwrite");
    const committed = new Promise<void>((ok, ko) => {
      tx.oncomplete = () => ok();
      tx.onerror = () => ko(tx.error);
      tx.onabort = () => ko(tx.error ?? new DOMException("abort", "AbortError"));
    });
    committed.catch(() => undefined);
    const [studio, docs, images, meta] = STORES.map((name) => tx.objectStore(name));
    // 트랜잭션 안에서는 IDB 요청만 기다린다(다른 await는 자동 커밋을 부른다)
    const [state, generation, keys] = await Promise.all([done(studio!.get("state")), done(meta!.get(GENERATION)), done(images!.getAllKeys())]);
    const plan = planDelete(state, generation, projectId);
    if (plan.status !== "ok") {
      tx.abort();
      return plan.status;
    }
    try {
      studio!.put({ schemaVersion: SCHEMA, kind: "state", id: "state", data: plan.state }, "state");
      meta!.put({ schemaVersion: SCHEMA, kind: GENERATION, id: GENERATION, data: plan.gen }, GENERATION);
      docs!.delete(projectId);
      projectImageKeys(keys, projectId).forEach((key) => images!.delete(key));
    } catch (error) {
      tx.abort();
      throw error;
    }
    await committed;
    return "done";
  } finally {
    db.close();
  }
}

export interface DeleteDeps {
  readonly locks: WriterLocks | undefined;
  readonly factory: IDBFactory;
  readonly link: TabLink;
  readonly session: Pick<Storage, "setItem"> | undefined;
  /** 새로고침 이동(메모리 store를 버린다 — 남은 메모리가 지운 것을 다시 쓰지 않게) */
  readonly go: (path: string) => void;
  /** IDB 실행부 — 테스트 주입(기본 runDelete) */
  readonly run?: (factory: IDBFactory, projectId: string) => Promise<RunResult>;
}

/** stopped = 이 탭 싱크를 멈췄다(쓰기 탭이었음) — 실패 뒤 닫으면 새로고침 이동(멈춘 싱크로 조용히 저장 0이 되는 경로 차단) */
export interface DeleteResult {
  readonly status: "done" | "busy" | "unreadable" | "failed";
  readonly stopped: boolean;
}

export function createDeleter({ locks, factory, link, session, go, run = runDelete }: DeleteDeps) {
  /** writer = 이 탭 싱크가 보유한 잠금(멈춘 뒤에도 탭 수명 동안 보유) · 함수 = 삭제가 잡은 잠금 */
  let held: "writer" | (() => void) | undefined;
  let stopped = false;
  const release = () => {
    if (typeof held === "function") {
      held();
      held = undefined;
    }
  };
  return {
    async remove(projectId: string, name: string): Promise<DeleteResult> {
      const own = link.own();
      if (own?.isWriter()) {
        held = "writer";
        own.stop();
        stopped = true;
      }
      if (!held && locks) {
        held = await tryLock(locks);
        if (!held) return { status: "busy", stopped };
      }
      let result: RunResult;
      try {
        result = await run(factory, projectId);
      } catch {
        release();
        return { status: "failed", stopped };
      }
      if (result === "unreadable") {
        release();
        return { status: "unreadable", stopped };
      }
      if (result === "done") link.post({ type: "saved" });
      try {
        session?.setItem(DELETED_KEY, name);
      } catch {
        // 저장 불가 — 알림 1회만 잃는다
      }
      go("/projects");
      return { status: "done", stopped };
    },
  };
}

export type Deleter = ReturnType<typeof createDeleter>;

/** 탭(링크)당 1개 — 보유 잠금·멈춤은 대화상자 수명이 아니라 탭 수명 상태(clearerFor와 같은 이유 — Codex r1) */
const perTab = new WeakMap<TabLink, Deleter>();
export function deleterFor(deps: DeleteDeps): Deleter {
  const found = perTab.get(deps.link);
  if (found) return found;
  const made = createDeleter(deps);
  perTab.set(deps.link, made);
  return made;
}
