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
import type { LocalEntry } from "./persistence/entryRead";
import type { LocalSync } from "./persistence/localSync";
import type { StudioStore } from "./studioStore";
import type { ImageKeeper, RenderImages } from "../features/studio/images/store/types";

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
  /** 로컬 영속(ADR-007 P1) — 진입 결과(봉투 확인만) + 조작 뒤 싱크(공유 로더). 없으면 메모리 */
  readonly local?: { readonly entry: LocalEntry; readonly sync: () => Promise<LocalSync> };
}

/** 조작 뒤 청크 — 판정·상태·어댑터·엔진. "편집 시작"·저장 때만 받는다(진입 직후 청크 크기 유지) */
const loadDocBook = retryableImport(() => import("./memoryDocBook"));

/** 로컬 영속 싱크 열기(조작 뒤 — DocBook 청크와 함께 받는다) */
/** 이미지 복원 본문(ADR-007 P1b) — 편집 틀 마운트 때 자동(로컬 영속만) · 별도 청크 */
const loadImageRestore = retryableImport(() => import("./persistence/imageRestore"));

export const openLocal = async (entry: LocalEntry) => (await loadDocBook()).openLocalSync(entry);

export function createMemoryProjectRepository(options: MemoryProjectOptions): ProjectRepository & ImageKeeper {
  const { store, now = () => new Date().toISOString(), generators = {}, local } = options;
  const entry = local?.entry;
  const counts = new Map<ProjectMethod, number>();
  /** 편집 틀 이미지 맵(프로젝트별) — 문서 쓰기 트랜잭션이 참조 이미지를 함께 쓴다(P1b) */
  const maps = new Map<string, RenderImages | undefined>();
  /** 문서 쓰기 본문 — 청크를 받은 뒤 1개. 받기 전 문서 = 진입 읽기 문서·머리(로컬 영속)뿐 — 본문은 싱크 시드로 시작한다 */
  let book: DocBook | undefined;
  const bookOf = createSharedLoader(async () => {
    const [mod, sync] = await Promise.all([loadDocBook(), local?.sync()]);
    return (book = mod.createDocBook(store, now, sync));
  });
  /** 문서 쓰기가 끝난 뒤 그 프로젝트 레코드를 IDB 커밋까지 기다린다(Codex 제약 3 — "저장됨"은 이 뒤) */
  /** 맵은 부를 때 잡아 둔다 — 저장 중 편집기를 떠나 등록이 풀려도 그 저장은 이미지까지 쓴다(BRIEF-R2 ②) */
  const kept = <T>(projectId: string, work: Promise<T>, held = maps.get(projectId)) =>
    local ? work.then(async (result) => (await (await local.sync()).flush(projectId, book!, maps.get(projectId) ?? held), result)) : work;

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
      kept(args[0], bookOf().then((docs) => call(method, (commit) => (docs[method] as (a: typeof args, c: () => void) => ReturnType<DocBook[K]>)(args, commit))));
  /** 쓰기 전 읽기(getDoc·listSnapshots) — 진입 레코드(문서 + 스냅샷). 진입 문서가 아닌데 머리가 있으면(/projects → 앱 안 이동) 시드를 기다린다 */
  const entered = async (projectId: string) => {
    const first = entry?.doc?.doc.projectId === projectId ? entry.doc : undefined;
    if (!book && !first && entry?.state?.heads.has(projectId)) await bookOf();
    return first;
  };
  const projectOf = (projectId: string) => store.projects().find((p) => p.projectId === projectId);
  /** 마지막 변경 = 이름·문서 저장·프로필 새 버전 중 최신 (8.1) */
  const summaryOf = (project: Project): ProjectSummary => {
    const latest = store.versions(project.profileId).at(-1);
    const doc = book?.docOf(project.projectId) ?? entry?.state?.heads.get(project.projectId);
    const updatedAt = [project.updatedAt, latest?.createdAt ?? "", doc?.updatedAt ?? ""].reduce((a, b) => (b > a ? b : a));
    const docPart = doc ? { hasDoc: true, docProfileVersion: doc.profileVersion, candidateId: doc.candidateId, docSavedAt: doc.updatedAt } : { hasDoc: false };
    return { ...project, updatedAt, latestProfileVersion: latest?.version ?? 0, ...docPart };
  };

  return {
    persistence: local ? "local" : "memory",
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
    getDoc: async (projectId) => {
      const first = await entered(projectId);
      return call("getDoc", () => book?.docOf(projectId) ?? first?.doc);
    },
    // kept를 청크 받기 전에 부른다 — 맵을 저장 요청 시점에 잡는다(BRIEF-R2 ②)
    saveDoc: (projectId, expectedRevision, doc) => kept(projectId, bookOf().then((docs) => call("saveDoc", (commit) => docs.save(projectId, expectedRevision, doc, commit)))),
    startDoc: (projectId, profileVersion, candidateId, mode, expectedRevision) =>
      kept(projectId, bookOf().then((docs) => call("startDoc", (commit) => docs.start({ projectId, profileVersion, candidateId, mode, expectedRevision }, commit)))),
    listSnapshots: async (projectId) => {
      const first = await entered(projectId);
      return book?.snapshotsOf(projectId) ?? first?.snapshots ?? [];
    },
    createSnapshot: write("createSnapshot"),
    restoreSnapshot: write("restoreSnapshot"),
    resolveConflict: write("resolveConflict"),
    // 8.3.2 — 판정·쓰기·잡 실행 본문은 조작 뒤 청크(memoryDocBook). 여기는 call 주입(delay·fail)만 넘긴다
    requestExport: (projectId, format, docRevision) =>
      kept(projectId, bookOf().then((docs) => docs.requestExport({ projectId, format, docRevision }, generators[format], (work) => call("requestExport", work)))),
    getExportJob: async (jobId) => book?.jobOf(jobId),
    ...(local && {
      images: (projectId: string, map: RenderImages | undefined, publish: Parameters<NonNullable<ImageKeeper["images"]>>[2]) => {
        maps.set(projectId, map);
        // 복원 끝에 한 번 더 부른다 — 그 사이 저장된 최신 문서·스냅샷으로 한도를 잰다(BRIEF-R2 ③)
        if (!map) void entered(projectId).then(async (first) => (await loadImageRestore()).restoreImages(projectId, () => (book ? { doc: book.docOf(projectId), snapshots: book.snapshotsOf(projectId) } : first), publish)).catch(() => undefined);
        // 편집 틀 effect cleanup — 편집기를 떠나면 등록을 푼다(Blob·메타가 앱 수명 동안 남지 않게 · Codex r1 P2)
        return () => maps.delete(projectId);
      },
    }),
  };
}
