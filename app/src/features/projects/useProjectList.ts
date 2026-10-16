import { useCallback, useEffect, useState } from "react";
import type { Project, ProjectRepository, ProjectSummary } from "../../data/projectRepository";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";

export interface ProjectListState {
  /** 로딩 중이면 null */
  readonly items: readonly ProjectSummary[] | null;
  /** 이름 바꾸기 결과(또는 STALE_PROJECT 최신값)로 한 줄을 갈아 끼운다 — 요약 필드(hasDoc 등)는 유지 */
  readonly replace: (project: Project) => void;
  /** 목록을 다시 조회한다(미확인 재시도 성공 뒤 hasDoc·변경 시각 반영 — RESTART SPEC-4 5.2) */
  readonly reload: () => void;
}

/** `/projects` 목록 (J-S01·J-S03·J-S04). 조회 실패는 가장 가까운 오류 경계로 던진다 */
export function useProjectList(repository: ProjectRepository): ProjectListState {
  const fail = useThrowToBoundary();
  const [items, setItems] = useState<readonly ProjectSummary[] | null>(null);
  const [round, setRound] = useState(0);
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
  }, [repository, fail, round]);
  const replace = useCallback((project: Project) => {
    setItems((current) => current && current.map((s) => (s.projectId === project.projectId ? { ...s, ...project } : s)));
  }, []);
  return { items, replace, reload: useCallback(() => setRound((n) => n + 1), []) };
}
