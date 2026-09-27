import { useCallback, useEffect, useState } from "react";
import type { Project, ProjectRepository, ProjectSummary } from "../../data/projectRepository";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";

export interface ProjectListState {
  /** 로딩 중이면 null */
  readonly items: readonly ProjectSummary[] | null;
  /** 이름 바꾸기 결과(또는 STALE_PROJECT 최신값)로 한 줄을 갈아 끼운다 — 요약 필드(hasDoc 등)는 유지 */
  readonly replace: (project: Project) => void;
}

/** `/projects` 목록 (J-S01·J-S03·J-S04). 조회 실패는 가장 가까운 오류 경계로 던진다 */
export function useProjectList(repository: ProjectRepository): ProjectListState {
  const fail = useThrowToBoundary();
  const [items, setItems] = useState<readonly ProjectSummary[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    repository.listProjects().then(
      (list) => {
        if (!cancelled) setItems(list);
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [repository, fail]);
  const replace = useCallback((project: Project) => {
    setItems((current) => current && current.map((s) => (s.projectId === project.projectId ? { ...s, ...project } : s)));
  }, []);
  return { items, replace };
}
