import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppProviders } from "./app/AppProviders";
import { AppRoutes } from "./app/routes";
import { createDeferredReferenceRepository } from "./data/deferredReferenceRepository";
import { createMemoryReferenceRepository } from "./data/referenceRepository";
import "./index.css";

const root = document.getElementById("root");
if (!root) throw new Error("#root 요소를 찾을 수 없습니다");

// 픽스처는 초기 JS 예산(90KB gzip)에서 빼고 첫 조회 때 받는다 (그룹 C)
const repository = createDeferredReferenceRepository(async () => {
  const [{ referenceFixtures }, { referenceDetailFixtures }] = await Promise.all([
    import("./fixtures/references"),
    import("./fixtures/referenceDetails"),
  ]);
  return createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);
});

createRoot(root).render(
  <StrictMode>
    <AppProviders repository={repository}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
);
