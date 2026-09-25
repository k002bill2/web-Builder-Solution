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
      <AppHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="focus:outline-none">
        <RouteErrorBoundary key={pathname}>
          <Suspense fallback={<LoadingState />}>
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </main>
    </div>
  );
}
