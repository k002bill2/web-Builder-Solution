/**
 * 프로젝트 메모리 구현 (DS-2A-05 8.3) — 보드·프로필과 같은 store를 읽는다. 프로젝트는 보드 확정 트랜잭션이 만든다(12.2).
 * 편집 문서·스냅샷(restart)·멱등 기록은 이 저장소 인스턴스가 가진다(store 하나당 로더 1개 — memoryStudio `createSharedLoader`).
 * - startDoc(8.3.1): 모양 → 멱등 키 → NOT_FOUND(프로젝트·버전·안·restart 문서) → DOC_EXISTS·STALE_DOC → 어댑터(8.2.1, 표 밖·엔진 거부 =
 *   UNKNOWN_VARIANT 쓰기 0) → 문서(+ restart 스냅샷) + 멱등 기록. 판정 3~5는 await 없는 한 동기 구간, `commit` 실패면 변화 0.
 * - saveDoc(8.3): 모양(L4 검증) → 멱등 키 (revision, hash) → NOT_FOUND → STALE_DOC(최신 동봉) → 저장(revision +1).
 * - 쓰기 본문(어댑터·엔진·L4 검증)은 조작 뒤 청크 `startDocWrite` — 동기 구간 앞에서 받는다(받기 실패 = 쓰기 0).
 * - `delay`·`fail` 주입 = `phase: request | commit | response`(보드·프로필 구현과 같은 모양). 시각은 주입 `now()` — 쓰기당 1회.
 */
import { validateProjectName } from "../domain/projectName";
import type { CandidatePlan } from "../domain/generation";
import { retryableImport } from "./chunkRetry";
import { MEMORY_GENERATOR_VERSION } from "./memoryGenerationRepository";
import {
  ProjectRepositoryError,
  type DocHead,
  type Project,
  type ProjectRepository,
  type ProjectSnapshot,
  type ProjectSummary,
  type StartDocMode,
  type StartDocResult,
} from "./projectRepository";
import { deepFreeze, type StudioReader, type StudioStore } from "./studioStore";

export type ProjectMethod = "getDoc" | "saveDoc" | "startDoc";
export interface ProjectCall {
  readonly method: ProjectMethod;
  /** 메서드별 1부터 */
  readonly seq: number;
  /** commit = 쓰기 뒤 커밋 앞(`fail`만) */
  readonly phase: "request" | "commit" | "response";
}

export interface MemoryProjectOptions {
  readonly store: StudioStore;
  readonly now?: () => string;
  readonly delay?: (call: ProjectCall) => Promise<void> | void | undefined;
  readonly fail?: (call: ProjectCall) => Error | undefined;
}

interface DocState {
  readonly docs: ReadonlyMap<string, DocHead>;
  readonly snapshots: ReadonlyMap<string, readonly ProjectSnapshot<DocHead>[]>;
  /** 프로젝트마다 마지막으로 성공한 startDoc 1건(8.3.1) */
  readonly starts: ReadonlyMap<string, { readonly key: string; readonly result: StartDocResult<DocHead> }>;
  /** 프로젝트마다 마지막으로 성공한 saveDoc 1건 — 키 (revision, hash) */
  readonly saves: ReadonlyMap<string, { readonly key: string; readonly doc: DocHead }>;
}

/** 조작 뒤 청크 — "편집 시작"·저장 때만 받는다 */
const loadDocWrites = retryableImport(() => import("./startDocWrite"));

const fail = (code: "NOT_FOUND" | "SCHEMA_INVALID", message: string) => new ProjectRepositoryError(code, message);
const isMode = (mode: unknown): mode is StartDocMode => mode === "create" || mode === "restart";
const isVersion = (n: unknown): n is number => typeof n === "number" && Number.isSafeInteger(n) && n >= 1;

/** 판정 3 — (계열, 버전)의 생성 잡과 그 안의 구조안. 잡 키는 생성 저장소와 같다(profileId|version|library|generator) */
function planOf(store: StudioReader, project: Project, profileVersion: number, candidateId: string) {
  const record = store.versions(project.profileId).find((v) => v.version === profileVersion);
  if (!record) throw fail("NOT_FOUND", `프로필 v${profileVersion}`);
  const job = store.jobByKey([project.profileId, profileVersion, record.base.library_version, MEMORY_GENERATOR_VERSION].join("|"))?.job;
  const found = job?.candidates.find((c) => c.id === candidateId);
  if (!job || found?.status !== "succeeded") throw fail("NOT_FOUND", `${candidateId}안`);
  return { job, plan: found.plan as CandidatePlan };
}

export function createMemoryProjectRepository(options: MemoryProjectOptions): ProjectRepository {
  const { store, now = () => new Date().toISOString() } = options;
  const counts = new Map<ProjectMethod, number>();
  let state: DocState = { docs: new Map(), snapshots: new Map(), starts: new Map(), saves: new Map() };

  /** work는 동기 — `commit()`을 부른 뒤에만 state를 바꾼다(던지면 변화 0) */
  async function call<T>(method: ProjectMethod, work: (commit: () => void) => T): Promise<T> {
    const seq = (counts.get(method) ?? 0) + 1;
    counts.set(method, seq);
    await options.delay?.({ method, seq, phase: "request" });
    const failure = options.fail?.({ method, seq, phase: "request" });
    if (failure) throw failure;
    const result = work(() => {
      const commitFailure = options.fail?.({ method, seq, phase: "commit" });
      if (commitFailure) throw commitFailure;
    });
    await options.delay?.({ method, seq, phase: "response" });
    const lost = options.fail?.({ method, seq, phase: "response" });
    if (lost) throw lost;
    return result;
  }

  const missing = (projectId: string) => Promise.reject(new ProjectRepositoryError("NOT_FOUND", projectId));
  const projectOf = (projectId: string) => store.projects().find((p) => p.projectId === projectId);
  /** 마지막 변경 = 이름·문서 저장·프로필 새 버전 중 최신 (8.1) */
  const summaryOf = (project: Project): ProjectSummary => {
    const latest = store.versions(project.profileId).at(-1);
    const doc = state.docs.get(project.projectId);
    const updatedAt = [project.updatedAt, latest?.createdAt ?? "", doc?.updatedAt ?? ""].reduce((a, b) => (b > a ? b : a));
    const docPart = doc ? { hasDoc: true, docProfileVersion: doc.profileVersion, candidateId: doc.candidateId, docSavedAt: doc.updatedAt } : { hasDoc: false };
    return { ...project, updatedAt, latestProfileVersion: latest?.version ?? 0, ...docPart };
  };

  return {
    persistence: "memory",
    listProjects: async () => store.projects().map(summaryOf).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getProject: async (projectId) => {
      const project = projectOf(projectId);
      return project && Object.freeze({ ...project, updatedAt: summaryOf(project).updatedAt });
    },
    renameProject: async (projectId, expectedRevision, name) =>
      store.transact((tx) => {
        const checked = validateProjectName(name);
        if (!checked.ok) throw new ProjectRepositoryError("SCHEMA_INVALID", checked.message);
        const project = tx.projects().find((p) => p.projectId === projectId);
        if (!project) throw new ProjectRepositoryError("NOT_FOUND", projectId);
        if (project.revision !== expectedRevision) throw new ProjectRepositoryError("STALE_PROJECT", `revision ${expectedRevision} ≠ ${project.revision}`, { project });
        const next: Project = { ...project, name: checked.name, revision: project.revision + 1, updatedAt: now() };
        tx.putProject(next);
        return next;
      }),
    getDoc: (projectId) => call("getDoc", () => state.docs.get(projectId)),
    saveDoc: async (projectId, expectedRevision, doc) => {
      const writes = await loadDocWrites();
      return call("saveDoc", (commit) => {
        if (!Number.isSafeInteger(expectedRevision)) throw fail("SCHEMA_INVALID", `revision ${expectedRevision}`);
        const checked = writes.checkSaveDoc(projectId, doc);
        if (!checked.ok) throw fail("SCHEMA_INVALID", checked.message);
        const key = `${expectedRevision}|${doc.hash}`;
        const last = state.saves.get(projectId);
        if (last?.key === key) return last.doc;
        const current = state.docs.get(projectId);
        if (!projectOf(projectId) || !current) throw fail("NOT_FOUND", projectId);
        if (current.revision !== expectedRevision) throw new ProjectRepositoryError("STALE_DOC", `revision ${expectedRevision} ≠ ${current.revision}`, { doc: current });
        const saved = deepFreeze({ ...doc, revision: current.revision + 1, updatedAt: now() });
        commit();
        state = { ...state, docs: new Map(state.docs).set(projectId, saved), saves: new Map(state.saves).set(projectId, { key, doc: saved }) };
        return saved;
      });
    },
    startDoc: async (projectId, profileVersion, candidateId, mode, expectedRevision) => {
      const writes = await loadDocWrites();
      return call("startDoc", (commit) => {
        // 1 모양
        if (typeof projectId !== "string" || !isVersion(profileVersion) || typeof candidateId !== "string" || !isMode(mode)) throw fail("SCHEMA_INVALID", "startDoc 인자");
        if (mode === "restart" && !(typeof expectedRevision === "number" && Number.isSafeInteger(expectedRevision))) throw fail("SCHEMA_INVALID", "restart는 expectedRevision 필수");
        // 2 멱등 키
        const key = JSON.stringify([projectId, mode, profileVersion, candidateId, mode === "restart" ? expectedRevision : null]);
        const last = state.starts.get(projectId);
        if (last?.key === key) return last.result;
        // 3 NOT_FOUND
        const project = projectOf(projectId);
        if (!project) throw fail("NOT_FOUND", projectId);
        const { job, plan } = planOf(store, project, profileVersion, candidateId);
        const current = state.docs.get(projectId);
        if (mode === "restart" && !current) throw fail("NOT_FOUND", `${projectId} 문서`);
        // 4 문서 상태
        if (mode === "create" && current) throw new ProjectRepositoryError("DOC_EXISTS", projectId, { doc: current });
        if (current && current.revision !== expectedRevision) throw new ProjectRepositoryError("STALE_DOC", `revision ${expectedRevision} ≠ ${current.revision}`, { doc: current });
        // 5 쓰기 — 어댑터(8.2.1) · restart = 스냅샷 + 교체(revision 현재 + 1) · 멱등 기록 — 한 번에
        const updatedAt = now();
        const made = writes.writeStartDoc({ candidateId, sections: plan.sections, libraryVersion: job.libraryVersion, generatorVersion: job.generatorVersion, profileVersion, projectId, updatedAt });
        if (!made.ok) throw new ProjectRepositoryError("UNKNOWN_VARIANT", made.reason, { alert: made.alert });
        const doc: DocHead = deepFreeze(current ? { ...made.doc, revision: current.revision + 1 } : made.doc);
        const result: StartDocResult<DocHead> = deepFreeze({ doc, changes: made.changes, ...(made.changeNotice && { changeNotice: made.changeNotice }) });
        const snapshots = state.snapshots.get(projectId) ?? [];
        const kept: readonly ProjectSnapshot<DocHead>[] = current
          ? [...snapshots, deepFreeze({ snapshotId: `snapshot-${snapshots.length + 1}`, projectId, kind: "auto", reason: "restart", name: "새로 시작 전", createdAt: updatedAt, doc: current, profileVersion: current.profileVersion, candidateId: current.candidateId, hash: current.hash })]
          : snapshots;
        commit();
        state = {
          ...state,
          docs: new Map(state.docs).set(projectId, doc),
          snapshots: new Map(state.snapshots).set(projectId, kept),
          starts: new Map(state.starts).set(projectId, { key, result }),
        };
        return result;
      });
    },
    listSnapshots: async (projectId) => state.snapshots.get(projectId) ?? [],
    createSnapshot: missing,
    restoreSnapshot: missing,
    resolveConflict: missing,
    requestExport: missing,
    getExportJob: async () => undefined,
  };
}
