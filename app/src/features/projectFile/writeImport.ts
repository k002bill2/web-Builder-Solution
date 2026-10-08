/**
 * 가져오기 쓰기 (P2-SPEC 3.5) — 조작 뒤 청크("가져오기"를 눌러야 실행). 프로젝트 삭제(deleteProject) 흐름을 그대로 복제한다.
 * 1. 잠금 = tabLockHold(쓰기 탭이면 보유 잠금 + 싱크 멈춤 · 아니면 tryLock · 못 잡으면 busy IM-9).
 * 2. `open(DB, 2)` + 업그레이드(새 브라우저 = DB 없음·진입 읽기가 만든 빈 v1) → `studio·docs·images·meta` readwrite 한 트랜잭션.
 *    안에서는 IDB 요청만 await — 검증·디코드·재인코딩(checkFile)은 트랜잭션 전에 끝난 CheckedFile만 받는다.
 *    상태 봉투 읽기 불가 = IM-8 · 재매김 재검사 실패 = IM-4 (둘 다 abort, 쓰기 0) · 상태 없음 = 빈 상태에서 시작.
 * 3. 실패: QuotaExceededError = IM-11 · 그 밖 = IM-10(전부 아니면 전무).
 * 4. 커밋 뒤 `saved` → sessionStorage 1회 키(JSON {projectId, name}) → `/projects` 새로고침 이동.
 * `envelope`·`entryRead`·`idbPersistence`·`studioStore`는 값으로 import하지 않는다(6절 — 진입·복원 closure). 값은 리터럴 복제 + parity 테스트.
 */
import type { LocalState } from "../../data/persistence/entryRead";
import type { TabLink } from "../../data/persistence/tabLink";
import type { WriterLocks } from "../../data/persistence/writerLock";
import { IMPORT_BUSY_TEXT } from "../projects/dialogText";
import { tabLockHold } from "../projects/tabLockHold";
import type { CheckedFile } from "./checkFile";
import { IMPORT_MESSAGES } from "./format";
import { mergeImport, rekeyImport } from "./rekey";

/** envelope.DB_NAME · idbPersistence.DB_VERSION · envelope.STORE_NAMES와 같은 값(테스트가 단언) */
export const IMPORT_DB_NAME = "design-studio";
export const IMPORT_DB_VERSION = 2;
export const IMPORT_STORE_NAMES = ["meta", "studio", "docs", "snapshots", "images", "board", "saved"] as const;
/** 새로고침 뒤 `/projects` "프로젝트 알림" IM-15 1회 + 가져온 줄 포커스 키(값 = JSON {projectId, name}) */
export const IMPORTED_KEY = "design-studio-imported";
const SCHEMA = 1;
const GENERATION = "generation";
const STORES = ["studio", "docs", "images", "meta"];
const MAPS = ["series", "commits", "adjustCommits", "jobs", "projects"] as const;

type UpgradeTarget = { readonly objectStoreNames: { contains(name: string): boolean }; createObjectStore(name: string): unknown };

/** idbPersistence.upgradeDatabase와 같은 단계 — v2 = 저장소 7개(없는 것만) */
export function upgradeImportDb(db: UpgradeTarget, oldVersion: number, newVersion: number) {
  if (oldVersion < 2 && newVersion >= 2) IMPORT_STORE_NAMES.filter((name) => !db.objectStoreNames.contains(name)).forEach((name) => db.createObjectStore(name));
}

const done = <T>(request: IDBRequest<T>) =>
  new Promise<T>((ok, ko) => {
    request.onsuccess = () => ok(request.result);
    request.onerror = () => ko(request.error);
  });

/** 쓰기 쪽(idbPersistence)과 같은 열기 — blocked 뒤 늦게 열린 연결은 닫는다 */
const openDb = (factory: IDBFactory) =>
  new Promise<IDBDatabase>((ok, ko) => {
    let blocked = false;
    const request = factory.open(IMPORT_DB_NAME, IMPORT_DB_VERSION);
    request.onupgradeneeded = (event) => upgradeImportDb(request.result, event.oldVersion, event.newVersion ?? IMPORT_DB_VERSION);
    request.onblocked = () => {
      blocked = true;
      ko(new DOMException("blocked", "BlockedError"));
    };
    request.onsuccess = () => (blocked ? request.result.close() : ok(request.result));
    request.onerror = () => ko(request.error);
  });

const envelopeData = (record: unknown, kind: string): { ok: true; data: unknown } | { ok: false } => {
  const env = record as { schemaVersion?: unknown; kind?: unknown; id?: unknown } | null;
  if (!env || typeof env !== "object" || env.kind !== kind || env.id !== kind || !("data" in env) || env.schemaVersion !== SCHEMA) return { ok: false };
  return { ok: true, data: (env as { data: unknown }).data };
};

/** 상태 레코드 → 대상 상태 · undefined = 없음(빈 상태) · "unreadable" = 봉투·Map 모양 아님(deleteProject.planDelete와 같은 판정) */
function readState(record: unknown): LocalState | undefined | "unreadable" {
  if (record === undefined) return undefined;
  const read = envelopeData(record, "state");
  const data = read.ok ? (read.data as Partial<LocalState> | null) : null;
  if (!data || typeof data !== "object" || MAPS.some((key) => !(data[key] instanceof Map)) || (data.heads !== undefined && !(data.heads instanceof Map))) return "unreadable";
  return data as LocalState;
}

const generationOf = (record: unknown): number => {
  const meta = record === undefined ? undefined : envelopeData(record, GENERATION);
  return meta?.ok && typeof meta.data === "number" ? meta.data : 0;
};

export type ImportRun = { readonly status: "done"; readonly projectId: string; readonly name: string } | { readonly status: "unreadable" } | { readonly status: "corrupt" };

/** IDB 한 트랜잭션(3.5 ②) — 커밋 확인 뒤 done. 트랜잭션 실패는 거부(오류 이름 보존 — Quota 판정) */
export async function runImport(factory: IDBFactory, file: CheckedFile, now: string): Promise<ImportRun> {
  const db = await openDb(factory);
  db.onversionchange = () => db.close();
  try {
    const tx = db.transaction(STORES, "readwrite");
    const committed = new Promise<void>((ok, ko) => {
      tx.oncomplete = () => ok();
      tx.onerror = () => ko(tx.error);
      tx.onabort = () => ko(tx.error ?? new DOMException("abort", "AbortError"));
    });
    committed.catch(() => undefined);
    const [studio, docs, images, meta] = STORES.map((name) => tx.objectStore(name));
    // 트랜잭션 안에서는 IDB 요청만 기다린다(다른 await는 자동 커밋을 부른다)
    const [stateRecord, generation] = await Promise.all([done(studio!.get("state")), done(meta!.get(GENERATION))]);
    const target = readState(stateRecord);
    if (target === "unreadable") {
      tx.abort();
      return { status: "unreadable" };
    }
    const rekeyed = rekeyImport(file, target, now);
    if (!rekeyed.ok) {
      tx.abort();
      return { status: "corrupt" };
    }
    const { plan } = rekeyed;
    const gen = generationOf(generation) + 1;
    try {
      studio!.put({ schemaVersion: SCHEMA, kind: "state", id: "state", data: { ...mergeImport(target, plan), gen } }, "state");
      meta!.put({ schemaVersion: SCHEMA, kind: GENERATION, id: GENERATION, data: gen }, GENERATION);
      if (plan.doc) docs!.put({ schemaVersion: SCHEMA, kind: "doc", id: plan.projectId, data: plan.doc }, plan.projectId);
      for (const { key, image } of plan.images) {
        const { variants, width, height, format, bytes } = image;
        images!.put({ schemaVersion: SCHEMA, kind: "image", id: key, data: { variants, width, height, format, bytes } }, key);
      }
    } catch (error) {
      tx.abort();
      throw error;
    }
    await committed;
    return { status: "done", projectId: plan.projectId, name: plan.project.name };
  } finally {
    db.close();
  }
}

export interface ImportDeps {
  readonly locks: WriterLocks | undefined;
  readonly factory: IDBFactory;
  readonly link: TabLink;
  readonly session: Pick<Storage, "setItem"> | undefined;
  /** 새로고침 이동(메모리 store를 버린다 — 이 탭이 가져온 프로젝트가 빠진 상태를 덮어쓰지 않게) */
  readonly go: (path: string) => void;
  /** IDB 실행부 — 테스트 주입(기본 runImport) */
  readonly run?: (factory: IDBFactory, file: CheckedFile, now: string) => Promise<ImportRun>;
  readonly now?: () => string;
}

export type ImportStatus = "done" | "busy" | "unreadable" | "corrupt" | "quota" | "failed";
/** stopped = 이 탭 싱크를 멈췄다(쓰기 탭이었음) — 실패 뒤 닫으면 새로고침 이동 */
export interface ImportResult {
  readonly status: ImportStatus;
  readonly stopped: boolean;
}

const MESSAGES: Readonly<Record<Exclude<ImportStatus, "done">, string>> = {
  busy: IMPORT_BUSY_TEXT,
  unreadable: "저장된 데이터를 읽지 못해 가져오지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다",
  corrupt: IMPORT_MESSAGES["IM-4"],
  quota: "브라우저 저장 공간이 부족해 가져오지 못했습니다 — 쓰지 않는 프로젝트를 지운 뒤 다시 시도하세요",
  failed: "가져오지 못했습니다 — 다시 시도하세요",
};
/** IM-8~IM-11 · 재매김 재검사 실패 = IM-4 */
export const importMessage = (status: Exclude<ImportStatus, "done">): string => MESSAGES[status];

const isQuota = (error: unknown) => typeof error === "object" && error !== null && (error as { name?: unknown }).name === "QuotaExceededError";
const systemNow = () => new Date().toISOString();

export function createImporter({ locks, factory, link, session, go, run = runImport, now = systemNow }: ImportDeps) {
  /** 보유 잠금·멈춤은 탭 단위로 지우기·삭제와 공유(자기 잠금에 막혀 busy가 되지 않게 — deleteProject Codex r1) */
  const hold = tabLockHold(link, locks);
  return {
    async importFile(file: CheckedFile): Promise<ImportResult> {
      const writer = link.own()?.isWriter() ?? false;
      if (!(await hold.acquire())) return { status: "busy", stopped: hold.stopped };
      if (writer) hold.stop();
      const stopped = hold.stopped;
      let result: ImportRun;
      try {
        result = await run(factory, file, now());
      } catch (error) {
        hold.release();
        return { status: isQuota(error) ? "quota" : "failed", stopped };
      }
      if (result.status !== "done") {
        hold.release();
        return { status: result.status, stopped };
      }
      link.post({ type: "saved" });
      try {
        session?.setItem(IMPORTED_KEY, JSON.stringify({ projectId: result.projectId, name: result.name }));
      } catch {
        // 저장 불가 — 알림·포커스 1회만 잃는다
      }
      go("/projects");
      return { status: "done", stopped };
    },
  };
}

export type Importer = ReturnType<typeof createImporter>;

/** 탭(링크)당 1개 — deleterFor와 같은 이유 */
const perTab = new WeakMap<TabLink, Importer>();
export function importerFor(deps: ImportDeps): Importer {
  const found = perTab.get(deps.link);
  if (found) return found;
  const made = createImporter(deps);
  perTab.set(deps.link, made);
  return made;
}
