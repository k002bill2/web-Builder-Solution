import { lazy } from "react";
import { Navigate, useRoutes, type RouteObject } from "react-router";
import { AppLayout } from "../components/layout/AppLayout";

// 라우트 단위 코드 분할 (M1-UI-01-FIX 그룹 C). 로딩 중 화면은 AppLayout의 Suspense가 맡는다.
const CatalogPage = lazy(() => import("../pages/CatalogPage").then((m) => ({ default: m.CatalogPage })));
const ReferenceDetailPage = lazy(() =>
  import("../pages/ReferenceDetailPage").then((m) => ({ default: m.ReferenceDetailPage })),
);
const CompareBoardPage = lazy(() => import("../pages/CompareBoardPage").then((m) => ({ default: m.CompareBoardPage })));
const ProfilePage = lazy(() => import("../pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const ProjectsRoute = lazy(() => import("../pages/ProjectsRoute").then((m) => ({ default: m.ProjectsRoute })));
const StudioPage = lazy(() => import("../pages/StudioPage").then((m) => ({ default: m.StudioPage })));

/**
 * 선언형 라우트(`useRoutes`). data router(`createBrowserRouter`)는 react-router 번들만 gzip 약 32KB라
 * 초기 JS 예산 90KB를 넘겨 쓰지 않는다 (PROGRESS.md 0단계 실측).
 */
export function createAppRoutes(): RouteObject[] {
  return [
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/catalog" replace /> },
        { path: "catalog", element: <CatalogPage /> },
        { path: "references/:id", element: <ReferenceDetailPage /> },
        { path: "compare", element: <CompareBoardPage /> },
        // 프로필 목록은 /projects가 잇는다(DS-2A-05 12.1 · EQ-4) — 자리표시 편집기도 목록으로
        { path: "profile", element: <Navigate to="/projects" replace /> },
        { path: "profile/:profileId", element: <ProfilePage /> },
        { path: "projects", element: <ProjectsRoute /> },
        { path: "studio", element: <Navigate to="/projects" replace /> },
        { path: "studio/:projectId", element: <StudioPage /> },
        { path: "*", element: <Navigate to="/catalog" replace /> },
      ],
    },
  ];
}

const APP_ROUTES = createAppRoutes();

/** BrowserRouter(앱)·MemoryRouter(테스트) 안에서 라우트 트리를 그린다. */
export function AppRoutes() {
  return useRoutes(APP_ROUTES);
}
