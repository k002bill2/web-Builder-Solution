/**
 * 앱(main)의 보드·프로필·생성·프로젝트 저장소를 store 하나로 만든다 — 프로필만 바로, 보드·생성·프로젝트는 처음 부를 때 받는다(STUDIO-SLIM).
 * `/studio`·`/projects` 진입은 프로필 조회·프로젝트만 부르므로 보드(초안 계산·비교 픽스처)·생성 구현을 진입 직후 합계에 싣지 않는다.
 * 테스트의 동기 생성 경로는 memoryStudio(createMemoryStudio) 그대로다.
 */
import type { CompareBoardRepository } from "./compareBoardRepository";
import type { ComparisonCatalog } from "../domain/comparisonCells";
import type { GenerationRepository } from "./generationRepository";
import { createMemoryProfileRepository } from "./memoryProfileRepository";
import type { ProfileRepository } from "./profileRepository";
import type { ProjectRepository } from "./projectRepository";
import { createSharedLoader } from "./sharedLoader";
import { createStudioStore } from "./studioStore";

export interface DeferredStudio {
  readonly profiles: ProfileRepository;
  readonly board: () => Promise<CompareBoardRepository>;
  readonly generations: () => Promise<GenerationRepository>;
  readonly projects: () => Promise<ProjectRepository>;
}

/** 구현 모듈 import — 테스트가 호출 기록을 보려고 바꿔 끼운다 */
export const STUDIO_IMPORTS = {
  board: () => import("./memoryCompareBoardRepository"),
  generations: () => import("./memoryGenerationRepository"),
  projects: () => import("./memoryProjectRepository"),
};

export function createDeferredStudio(loadCatalog: () => Promise<ComparisonCatalog>, imports: typeof STUDIO_IMPORTS = STUDIO_IMPORTS): DeferredStudio {
  const store = createStudioStore();
  return {
    profiles: createMemoryProfileRepository({ store }),
    board: createSharedLoader(async () => {
      const [{ createMemoryCompareBoardRepository }, catalog] = await Promise.all([imports.board(), loadCatalog()]);
      return createMemoryCompareBoardRepository({ catalog, store });
    }),
    generations: createSharedLoader(async () => (await imports.generations()).createMemoryGenerationRepository({ store })),
    projects: createSharedLoader(async () => (await imports.projects()).createMemoryProjectRepository({ store })),
  };
}
