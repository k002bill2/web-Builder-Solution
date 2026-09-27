/**
 * 프로젝트 메모리 구현 (DS-2A-05 8.3) — 보드·프로필과 같은 store를 읽고 쓴다. 프로젝트는 보드 확정 트랜잭션이 만든다(12.2).
 * 편집 문서(`getDoc`·`startDoc` 등)는 아직 없다: `startDoc`은 엔진 `createDocFromCandidate`의 세 번째 인자(Q-17, 미승인)와
 * engine import 가드에 걸려 a1-β에서 구현하지 않는다 — 문서 없음(E-S03)만 돌려준다.
 */
import { validateProjectName } from "../domain/projectName";
import { ProjectRepositoryError, type Project, type ProjectRepository, type ProjectSummary } from "./projectRepository";
import type { StudioStore } from "./studioStore";

export interface MemoryProjectOptions {
  readonly store: StudioStore;
  readonly now?: () => string;
}

export function createMemoryProjectRepository({ store, now = () => new Date().toISOString() }: MemoryProjectOptions): ProjectRepository {
  const missing = (projectId: string) => Promise.reject(new ProjectRepositoryError("NOT_FOUND", projectId));
  /** 마지막 변경 = 이름·프로필 새 버전 중 최신 (8.1) */
  const summaryOf = (project: Project): ProjectSummary => {
    const latest = store.versions(project.profileId).at(-1);
    const updatedAt = latest && latest.createdAt > project.updatedAt ? latest.createdAt : project.updatedAt;
    return { ...project, updatedAt, latestProfileVersion: latest?.version ?? 0, hasDoc: false };
  };
  return {
    persistence: "memory",
    listProjects: async () => store.projects().map(summaryOf).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    getProject: async (projectId) => {
      const project = store.projects().find((p) => p.projectId === projectId);
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
    getDoc: async () => undefined,
    saveDoc: missing,
    startDoc: missing,
    listSnapshots: async () => [],
    createSnapshot: missing,
    restoreSnapshot: missing,
    resolveConflict: missing,
    requestExport: missing,
    getExportJob: async () => undefined,
  };
}
