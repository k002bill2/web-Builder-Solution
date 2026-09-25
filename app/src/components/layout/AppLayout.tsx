import { Outlet } from "react-router";
import { AppHeader } from "./AppHeader";

export function AppLayout() {
  return (
    <div className="min-h-dvh bg-background-normal text-label-normal">
      <AppHeader />
      <Outlet />
    </div>
  );
}
