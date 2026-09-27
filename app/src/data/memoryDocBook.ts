/**
 * 프로젝트 메모리 저장소의 문서 쓰기 본문 (DS-2A-05 8.3·8.3.1) — 조작 뒤 청크. "편집 시작"·저장 때만 받는다.
 * 저장소(`memoryProjectRepository`)는 진입 직후 청크(`/projects`·`/studio`)라 판정·상태 코드를 여기로 뺀다(C4 번들 누수 수정).
 * 문서가 하나라도 있으면 이 청크는 이미 받아져 있다 — 저장소는 청크를 받기 전에는 "문서 없음"으로 읽는다.
 * - start(8.3.1): 모양 → 멱등 키 → NOT_FOUND(프로젝트·버전·안·restart 문서) → DOC_EXISTS·STALE_DOC → 어댑터(8.2.1, 표 밖·엔진 거부 =
 *   UNKNOWN_VARIANT 쓰기 0) → 문서(+ restart 스냅샷) + 멱등 기록. 동기 — `commit()`을 부른 뒤에만 상태를 바꾼다(던지면 변화 0).
 * - save(8.3): 모양(L4 검증) → 멱등 키 (revision, hash) → NOT_FOUND → STALE_DOC(최신 동봉) → 저장(revision +1).
 */
import type { CandidatePlan } from "../domain/generation";
import { MEMORY_GENERATOR_VERSION } from "./generatorVersion";
import { ProjectRepositoryError, type DocHead, type Project, type ProjectSnapshot, type StartDocMode, type StartDocResult } from "./projectRepository";
import { checkSaveDoc, writeStartDoc } from "./startDocWrite";
import { deepFreeze, type StudioReader } from "./studioStore";

interface DocState {
  readonly docs: ReadonlyMap<string, DocHead>;
  readonly snapshots: ReadonlyMap<string, readonly ProjectSnapshot<DocHead>[]>;
  /** 프로젝트마다 마지막으로 성공한 startDoc 1건(8.3.1) */
  readonly starts: ReadonlyMap<string, { readonly key: string; readonly result: StartDocResult<DocHead> }>;
  /** 프로젝트마다 마지막으로 성공한 saveDoc 1건 — 키 (revision, hash) */
  readonly saves: ReadonlyMap<string, { readonly key: string; readonly doc: DocHead }>;
}

export interface DocBook {
  readonly docOf: (projectId: string) => DocHead | undefined;
  readonly snapshotsOf: (projectId: string) => readonly ProjectSnapshot<DocHead>[];
  readonly save: (projectId: string, expectedRevision: number, doc: DocHead, commit: () => void) => DocHead;
  readonly start: (
    args: { projectId: string; profileVersion: number; candidateId: string; mode: StartDocMode; expectedRevision?: number },
    commit: () => void,
  ) => StartDocResult<DocHead>;
}

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

export function createDocBook(store: StudioReader, now: () => string): DocBook {
  let state: DocState = { docs: new Map(), snapshots: new Map(), starts: new Map(), saves: new Map() };
  const projectOf = (projectId: string) => store.projects().find((p) => p.projectId === projectId);

  return {
    docOf: (projectId) => state.docs.get(projectId),
    snapshotsOf: (projectId) => state.snapshots.get(projectId) ?? [],
    save: (projectId, expectedRevision, doc, commit) => {
      if (!Number.isSafeInteger(expectedRevision)) throw fail("SCHEMA_INVALID", `revision ${expectedRevision}`);
      const checked = checkSaveDoc(projectId, doc);
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
    },
    start: ({ projectId, profileVersion, candidateId, mode, expectedRevision }, commit) => {
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
      if (mode === "create" && current)
        throw new ProjectRepositoryError("DOC_EXISTS", projectId, { doc: current, alert: `이미 편집 중인 문서를 엽니다 (${current.candidateId}안 · 프로필 v${current.profileVersion})` });
      if (current && current.revision !== expectedRevision) throw new ProjectRepositoryError("STALE_DOC", `revision ${expectedRevision} ≠ ${current.revision}`, { doc: current });
      // 5 쓰기 — 어댑터(8.2.1) · restart = 스냅샷 + 교체(revision 현재 + 1) · 멱등 기록 — 한 번에
      const updatedAt = now();
      const made = writeStartDoc({ candidateId, sections: plan.sections, libraryVersion: job.libraryVersion, generatorVersion: job.generatorVersion, profileVersion, projectId, updatedAt });
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
    },
  };
}
