import { Outlet } from "react-router";
import { AppHeader } from "./AppHeader";
import { MAIN_CONTENT_ID, SkipLinks } from "./SkipLinks";

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background-normal text-label-normal">
      <SkipLinks />
      <AppHeader />
      <main id={MAIN_CONTENT_ID} tabIndex={-1} className="focus:outline-none">
        <Outlet />
      </main>
    </div>
  );
}
