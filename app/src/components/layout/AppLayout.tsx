import { Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import { useRouteScroll } from "../../app/useRouteScroll";
import { AppHeader } from "./AppHeader";
import { LoadingState } from "./LoadingState";
import { RouteErrorBoundary } from "./RouteErrorBoundary";
import { MAIN_CONTENT_ID, SkipLinks } from "./SkipLinks";

export function AppLayout() {
  useRouteScroll();
  const { pathname } = useLocation();
  return (
    <div className="min-h-dvh bg-background-normal text-label-normal">
      <SkipLinks />
      {/* 편집기는 GNB 없는 집중 모드 — 건너뛰기·main·오류 경계·Suspense는 그대로 (DS-2A-05 S-B2 · Q4) */}
      {!pathname.startsWith("/studio/") && <AppHeader />}
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="focus:outline-none">
        <RouteErrorBoundary resetKey={pathname}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>
    </div>
  );
}
