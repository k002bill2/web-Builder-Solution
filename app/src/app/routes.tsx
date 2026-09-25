import { Navigate, type RouteObject } from "react-router";
import { AppLayout } from "../components/layout/AppLayout";
import { CatalogPage } from "../pages/CatalogPage";
import { PlaceholderPage } from "../pages/PlaceholderPage";

export function createAppRoutes(): RouteObject[] {
  return [
    {
      element: <AppLayout />,
      children: [
        { index: true, element: <Navigate to="/catalog" replace /> },
        { path: "catalog", element: <CatalogPage /> },
        { path: "references/:id", element: <PlaceholderPage title="레퍼런스 상세" screen="1a-02" /> },
        { path: "compare", element: <PlaceholderPage title="비교 보드" screen="1a-03" /> },
        { path: "profile", element: <PlaceholderPage title="디자인 프로필 · 3안 생성" screen="1a-04" /> },
        { path: "studio", element: <PlaceholderPage title="편집기" screen="1a-05" /> },
        { path: "*", element: <Navigate to="/catalog" replace /> },
      ],
    },
  ];
}
