import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { AppProviders } from "./app/AppProviders";
import { createAppRoutes } from "./app/routes";
import { createMemoryReferenceRepository } from "./data/referenceRepository";
import { referenceFixtures } from "./fixtures/references";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root 요소를 찾을 수 없습니다");

const router = createBrowserRouter(createAppRoutes());
const repository = createMemoryReferenceRepository(referenceFixtures);

createRoot(root).render(
  <StrictMode>
    <AppProviders repository={repository}>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
