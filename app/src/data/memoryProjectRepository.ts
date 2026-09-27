/**
 * 프로젝트 메모리 구현 (DS-2A-05 8.3) — 0단계(번들 실측) 자리: 로더 배선만 확인한다.
 * store에 프로젝트가 아직 없으므로 목록은 비고, 쓰기는 NOT_FOUND다. 1단계에서 store 프로젝트 레코드로 채운다.
 */
import { ProjectRepositoryError, type ProjectRepository } from "./projectRepository";

/** 1단계에서 공유 store(`StudioStore`)를 인자로 받는다 */
export function createMemoryProjectRepository(): ProjectRepository {
  const missing = (projectId: string) => Promise.reject(new ProjectRepositoryError("NOT_FOUND", projectId));
  return {
    persistence: "memory",
    listProjects: () => Promise.resolve([]),
    getProject: () => Promise.resolve(undefined),
    renameProject: missing,
    getDoc: () => Promise.resolve(undefined),
    saveDoc: missing,
    startDoc: missing,
    listSnapshots: () => Promise.resolve([]),
    createSnapshot: missing,
    restoreSnapshot: missing,
    resolveConflict: missing,
    requestExport: missing,
    getExportJob: () => Promise.resolve(undefined),
  };
}
