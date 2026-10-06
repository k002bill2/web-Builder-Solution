/**
 * 프로젝트 메모리 구현 (DS-2A-05 8.3) — 보드·프로필과 같은 store를 읽는다. 프로젝트는 보드 확정 트랜잭션이 만든다(12.2).
 * 편집 문서·스냅샷(restart)·멱등 기록은 이 저장소 인스턴스가 가진다(store 하나당 로더 1개 — memoryStudio `createSharedLoader`).
 * - startDoc(8.3.1): 모양 → 멱등 키 → NOT_FOUND(프로젝트·버전·안·restart 문서) → DOC_EXISTS·STALE_DOC → 어댑터(8.2.1, 표 밖·엔진 거부 =
 *   UNKNOWN_VARIANT 쓰기 0) → 문서(+ restart 스냅샷) + 멱등 기록. 판정 3~5는 await 없는 한 동기 구간, `commit` 실패면 변화 0.
 * - saveDoc(8.3): 모양(L4 검증) → 멱등 키 (revision, hash) → NOT_FOUND → STALE_DOC(최신 동봉) → 저장(revision +1).
 * - 판정·상태·쓰기 본문(어댑터·엔진·L4 검증)은 조작 뒤 청크 `memoryDocBook` — 동기 구간 앞에서 받는다(받기 실패 = 쓰기 0).
 * - `delay`·`fail` 주입 = `phase: request | commit | response`(보드·프로필 구현과 같은 모양). 시각은 주입 `now()` — 쓰기당 1회.
 */
import { validateProjectName } from "../domain/projectName";
import { retryableImport } from "./chunkRetry";
import type { DocBook } from "./memoryDocBook";
import { createSharedLoader } from "./sharedLoader";
import { ProjectRepositoryError, type ExportGenerators, type Project, type ProjectRepository, type ProjectSummary } from "./projectRepository";
import type { StudioStore } from "./studioStore";

export type ProjectMethod = "getDoc" | "saveDoc" | "startDoc" | "requestExport" | "createSnapshot" | "restoreSnapshot" | "resolveConflict";
type SnapshotWrite = "createSnapshot" | "restoreSnapshot" | "resolveConflict";
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
  /** 형식별 생성기(8.3.2 6단계) — 기본 = 둘 다 없음(M2A-3a → `GENERATOR_UNAVAILABLE`). 3b가 `static-html`을 등록한다 */
  readonly generators?: ExportGenerators;
}

/** 조작 뒤 청크 — 판정·상태·어댑터·엔진. "편집 시작"·저장 때만 받는다(진입 직후 청크 크기 유지) */
const loadDocBook = retryableImport(() => import("./memoryDocBook"));

export function createMemoryProjectRepository(options: MemoryProjectOptions): ProjectRepository {
  const { store, now = () => new Date().toISOString(), generators = {} } = options;
  const counts = new Map<ProjectMethod, number>();
  /** 문서 쓰기 본문 — 청크를 받은 뒤 1개. 받기 전에는 문서가 있을 수 없다 */
  let book: DocBook | undefined;
  const bookOf = createSharedLoader(async () => (book = (await loadDocBook()).createDocBook(store, now)));

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

  /** 스냅샷 쓰기(ER SPEC 3.2) — 본문은 조작 뒤 청크(같은 이름 메서드). 청크를 받은 뒤 call 주입(delay·fail) 안에서 동기로 쓴다 */
  const write =
    <K extends SnapshotWrite>(method: K) =>
    (...args: Parameters<DocBook[K]>[0]) =>
      bookOf().then((docs) => call(method, (commit) => (docs[method] as (a: typeof args, c: () => void) => ReturnType<DocBook[K]>)(args, commit)));
  const projectOf = (projectId: string) => store.projects().find((p) => p.projectId === projectId);
  /** 마지막 변경 = 이름·문서 저장·프로필 새 버전 중 최신 (8.1) */
  const summaryOf = (project: Project): ProjectSummary => {
    const latest = store.versions(project.profileId).at(-1);
    const doc = book?.docOf(project.projectId);
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
    getDoc: (projectId) => call("getDoc", () => book?.docOf(projectId)),
    saveDoc: async (projectId, expectedRevision, doc) => {
      const docs = await bookOf();
      return call("saveDoc", (commit) => docs.save(projectId, expectedRevision, doc, commit));
    },
    startDoc: async (projectId, profileVersion, candidateId, mode, expectedRevision) => {
      const docs = await bookOf();
      return call("startDoc", (commit) => docs.start({ projectId, profileVersion, candidateId, mode, expectedRevision }, commit));
    },
    listSnapshots: async (projectId) => book?.snapshotsOf(projectId) ?? [],
    createSnapshot: write("createSnapshot"),
    restoreSnapshot: write("restoreSnapshot"),
    resolveConflict: write("resolveConflict"),
    // 8.3.2 — 판정·쓰기·잡 실행 본문은 조작 뒤 청크(memoryDocBook). 여기는 call 주입(delay·fail)만 넘긴다
    requestExport: async (projectId, format, docRevision) =>
      (await bookOf()).requestExport({ projectId, format, docRevision }, generators[format], (work) => call("requestExport", work)),
    getExportJob: async (jobId) => book?.jobOf(jobId),
  };
}
