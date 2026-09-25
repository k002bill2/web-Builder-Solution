import { Suspense } from "react";
import { Outlet } from "react-router";
import { useRouteScroll } from "../../app/useRouteScroll";
import { AppHeader } from "./AppHeader";
import { LoadingState } from "./LoadingState";
import { MAIN_CONTENT_ID, SkipLinks } from "./SkipLinks";

export function AppLayout() {
  useRouteScroll();
  return (
    <div className="min-h-dvh bg-background-normal text-label-normal">
      <SkipLinks />
      <AppHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="focus:outline-none">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
