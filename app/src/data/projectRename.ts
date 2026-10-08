import { validateProjectName } from "../domain/projectName";
import { ProjectRepositoryError, type Project } from "./projectRepository";
import type { StudioStore } from "./studioStore";

/**
 * 프로젝트 이름 바꾸기 본문(8.3 `renameProject`) — 조작 뒤 청크. /projects "이름 바꾸기" 저장 때만 받는다(ENTRY-SLIM — /studio 진입 closure에서 이름 규칙을 뺀다).
 * 한 동기 구간(transact): 이름 규칙 → 없음 → revision 확인 → 쓰기. 던지면 변화 0.
 */
export function renameProjectIn(store: StudioStore, now: () => string, projectId: string, expectedRevision: number, name: string): Project {
  return store.transact((tx) => {
    const checked = validateProjectName(name);
    if (!checked.ok) throw new ProjectRepositoryError("SCHEMA_INVALID", checked.message);
    const project = tx.projects().find((p) => p.projectId === projectId);
    if (!project) throw new ProjectRepositoryError("NOT_FOUND", projectId);
    if (project.revision !== expectedRevision) throw new ProjectRepositoryError("STALE_PROJECT", `revision ${expectedRevision} ≠ ${project.revision}`, { project });
    const next: Project = { ...project, name: checked.name, revision: project.revision + 1, updatedAt: now() };
    tx.putProject(next);
    return next;
  });
}
