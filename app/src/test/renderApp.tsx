import { render } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate, type Location, type NavigateFunction } from "react-router";
import { AppProviders } from "../app/AppProviders";
import { AppRoutes } from "../app/routes";
import type { CompareBoardRepository } from "../data/compareBoardRepository";
import type { GenerationRepository } from "../data/generationRepository";
import { createMemoryStudio } from "../data/memoryStudio";
import type { ProfileRepository } from "../data/profileRepository";
import type { ProjectRepository } from "../data/projectRepository";
import { createMemoryReferenceRepository, type ReferenceRepository } from "../data/referenceRepository";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG } from "./compareFixtures";
// lazy 라우트 모듈을 미리 로드해 둔다 — 첫 테스트의 콜드 변환이 findBy 대기 시간(1초)을 넘지 않게 한다
import "../pages/CatalogPage";
import "../pages/CompareBoardPage";
import "../pages/ProfilePage";
import "../pages/ProjectsRoute";
import "../pages/ReferenceDetailPage";
import "../pages/StudioPage";
import "../data/memoryProjectRepository";

/** 테스트에서 읽는 라우터 상태. data router의 `router.state.location`과 같은 모양을 유지한다. */
export interface TestRouter {
  readonly state: { readonly location: Location };
  readonly navigate: NavigateFunction;
}

function RouterProbe({ onRender }: { readonly onRender: (location: Location, navigate: NavigateFunction) => void }) {
  onRender(useLocation(), useNavigate());
  return null;
}

/**
 * 실제 라우트 트리를 메모리 라우터로 렌더한다. URL 검증은 router.state.location 으로 한다.
 * 보드·프로필·생성 저장소를 넘기지 않으면 렌더마다 store 하나로 새로 만든다(id가 늘 `profile-1`부터, DS-2A-04 6.3).
 */
export function renderApp(
  path: string,
  repository: ReferenceRepository = createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures),
  boardRepository?: CompareBoardRepository,
  profileRepository?: ProfileRepository,
  generationRepository?: GenerationRepository,
  /** 보드·프로필과 같은 store의 프로젝트 저장소(DS-2A-05 12.4) — 넘기지 않으면 렌더마다 새 store의 것 */
  projects?: () => Promise<ProjectRepository>,
): { readonly router: TestRouter } {
  const studio = createMemoryStudio({ catalog: FIXTURE_CATALOG });
  let current: { location: Location; navigate: NavigateFunction } | null = null;
  const probe = (location: Location, navigate: NavigateFunction) => {
    current = { location, navigate };
  };
  const latest = () => {
    if (!current) throw new Error("라우터가 아직 렌더되지 않았습니다");
    return current;
  };
  render(
    <AppProviders repository={repository} boardRepository={boardRepository ?? studio.board} profileRepository={profileRepository ?? studio.profiles}
      generations={() => Promise.resolve(generationRepository ?? studio.generations)} projects={projects ?? studio.projects}
    >
      <MemoryRouter initialEntries={[path]}>
        <RouterProbe onRender={probe} />
        <AppRoutes />
      </MemoryRouter>
    </AppProviders>,
  );
  return {
    router: {
      get state() {
        return { location: latest().location };
      },
      navigate: ((...args: Parameters<NavigateFunction>) => latest().navigate(...args)) as NavigateFunction,
    },
  };
}
