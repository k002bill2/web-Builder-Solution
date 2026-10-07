import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import { AppProviders } from "./app/AppProviders";
import { AppRoutes } from "./app/routes";
import { createDeferredCompareBoardRepository } from "./data/deferredCompareBoardRepository";
import { createDeferredProfileRepository } from "./data/deferredProfileRepository";
import { createDeferredReferenceRepository } from "./data/deferredReferenceRepository";
import { emptyBoard } from "./domain/compareBoard";
import { createMemoryReferenceRepository } from "./data/referenceRepository";
import { createSharedLoader } from "./data/sharedLoader";
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

// 보드·프로필·생성·프로젝트 저장소(공유 store)는 공통 청크 밖에서 처음 쓸 때 받는다 (ADR-004). store 하나 — 보드 확정한 버전을
// 프로필 화면이 읽는다 (DS-2A-04 6.3). 보드·생성·프로젝트 구현은 그 안에서 다시 처음 부를 때 받는다(STUDIO-SLIM, deferredStudio).
// 보드 로드 전의 보드 조회(트레이 진입)는 빈 보드 — 메모리 구현은 새로고침하면 비어 있다.
const loadStudio = createSharedLoader(async () =>
  (await import("./data/deferredStudio")).loadDeferredStudio(async () => {
    const [{ referenceFixtures }, { referenceDetailFixtures }, { referenceComparisonAttributes }] = await Promise.all([
      import("./fixtures/references"),
      import("./fixtures/referenceDetails"),
      import("./fixtures/referenceComparisons"),
    ]);
    return { references: referenceFixtures, details: referenceDetailFixtures, attributes: referenceComparisonAttributes };
  }),
);
const boardRepository = createDeferredCompareBoardRepository(async () => (await loadStudio()).board(), {
  board: emptyBoard("board-current", ""),
  released: [],
});
const profileRepository = createDeferredProfileRepository(async () => (await loadStudio()).profiles);
// 3안 생성·프로젝트 저장소는 로더 핸들만 — 위임 래퍼는 공통 청크에 두지 않는다(2a-04c)
const generations = async () => (await loadStudio()).generations();
const projects = async () => (await loadStudio()).projects();

createRoot(root).render(
  <StrictMode>
    <AppProviders repository={repository} boardRepository={boardRepository} profileRepository={profileRepository} generations={generations} projects={projects}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  </StrictMode>,
);
