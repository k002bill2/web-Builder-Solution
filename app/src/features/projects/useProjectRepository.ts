import { useEffect, useState } from "react";
import { useProjectLoader } from "../../data/ProfileRepositoryContext";
import type { ProjectRepository } from "../../data/projectRepository";
import { useThrowToBoundary } from "../../data/useThrowToBoundary";

/** 프로젝트 저장소를 처음 쓸 때 받는다(S-B3 로더 핸들). 받기 전 undefined, 실패는 오류 경계로(J-S03 · E-S04) */
export function useProjectRepository(): ProjectRepository | undefined {
  const load = useProjectLoader();
  const fail = useThrowToBoundary();
  const [repository, setRepository] = useState<ProjectRepository>();
  useEffect(() => {
    let cancelled = false;
    load().then(
      (loaded) => {
        if (!cancelled) setRepository(() => loaded);
      },
      (error: unknown) => {
        if (!cancelled) fail(error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [load, fail]);
  return repository;
}
