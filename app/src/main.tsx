import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppProviders } from "./app/AppProviders";
import { AppRoutes } from "./app/routes";
import { createDeferredCompareBoardRepository } from "./data/deferredCompareBoardRepository";
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

// 비교 보드 저장소(zod·초안 계산·비교 픽스처)도 공통 청크 밖에서 첫 호출 때 받는다 (ADR-004)
const boardRepository = createDeferredCompareBoardRepository(async () => {
  const [{ createMemoryCompareBoardRepository }, { referenceFixtures }, { referenceDetailFixtures }, { referenceComparisonAttributes }] =
    await Promise.all([
      import("./data/memoryCompareBoardRepository"),
      import("./fixtures/references"),
      import("./fixtures/referenceDetails"),
      import("./fixtures/referenceComparisons"),
    ]);
  return createMemoryCompareBoardRepository({
    catalog: { references: referenceFixtures, details: referenceDetailFixtures, attributes: referenceComparisonAttributes },
  });
});

createRoot(root).render(
  <StrictMode>
    <AppProviders repository={repository} boardRepository={boardRepository}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
);
