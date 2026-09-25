import { render } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate, type Location, type NavigateFunction } from "react-router";
import { AppProviders } from "../app/AppProviders";
import { AppRoutes } from "../app/routes";
import { createMemoryReferenceRepository, type ReferenceRepository } from "../data/referenceRepository";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
// lazy 라우트 모듈을 미리 로드해 둔다 — 첫 테스트의 콜드 변환이 findBy 대기 시간(1초)을 넘지 않게 한다
import "../pages/CatalogPage";
import "../pages/PlaceholderPage";
import "../pages/ReferenceDetailPage";

/** 테스트에서 읽는 라우터 상태. data router의 `router.state.location`과 같은 모양을 유지한다. */
export interface TestRouter {
  readonly state: { readonly location: Location };
  readonly navigate: NavigateFunction;
}

function RouterProbe({ onRender }: { readonly onRender: (location: Location, navigate: NavigateFunction) => void }) {
  onRender(useLocation(), useNavigate());
  return null;
}

/** 실제 라우트 트리를 메모리 라우터로 렌더한다. URL 검증은 router.state.location 으로 한다. */
export function renderApp(
  path: string,
  repository: ReferenceRepository = createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures),
): { readonly router: TestRouter } {
  let current: { location: Location; navigate: NavigateFunction } | null = null;
  const probe = (location: Location, navigate: NavigateFunction) => {
    current = { location, navigate };
  };
  const latest = () => {
    if (!current) throw new Error("라우터가 아직 렌더되지 않았습니다");
    return current;
  };
  render(
    <AppProviders repository={repository}>
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
