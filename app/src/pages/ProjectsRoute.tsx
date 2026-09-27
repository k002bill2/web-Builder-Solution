import { useEffect } from "react";
import { brand } from "../brand/brand.config";
import { LoadingState } from "../components/layout/LoadingState";
import { useProjectRepository } from "../features/projects/useProjectRepository";
import { ProjectsPage } from "./ProjectsPage";

/** `/projects` 라우트 — 저장소 로더를 풀어 목록 화면에 안정된 인스턴스를 넘긴다 (2.2 · a1-α 연결 지점 2) */
export function ProjectsRoute() {
  const repository = useProjectRepository();
  useEffect(() => {
    document.title = `프로젝트 · ${brand.name}`;
  }, []);
  return repository ? <ProjectsPage repository={repository} /> : <LoadingState />;
}
