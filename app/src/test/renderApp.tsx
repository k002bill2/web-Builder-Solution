import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AppProviders } from "../app/AppProviders";
import { createAppRoutes } from "../app/routes";
import { createMemoryReferenceRepository, type ReferenceRepository } from "../data/referenceRepository";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";

/** 실제 라우트 트리를 메모리 라우터로 렌더한다. URL 검증은 router.state.location 으로 한다. */
export function renderApp(
  path: string,
  repository: ReferenceRepository = createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures),
) {
  const router = createMemoryRouter(createAppRoutes(), { initialEntries: [path] });
  render(
    <AppProviders repository={repository}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return { router };
}
