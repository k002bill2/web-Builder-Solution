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
import { readEntry, type LocalEntry } from "./persistence/entryRead";
import type { LocalSync } from "./persistence/localSync";
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

/** 로컬 영속(ADR-007 P1) — 진입 결과 + 조작 뒤 싱크 열기(탭당 1개) */
export interface LocalStart {
  readonly entry: LocalEntry;
  readonly sync: (entry: LocalEntry) => Promise<LocalSync>;
}

/** 진입 하이드레이션(E0 안1-min) — main loadStudio가 진입 읽기를 기다린 뒤 store를 만든다. 읽기 실패·불일치 = 메모리(쓰기 0) */
export const loadDeferredStudio = async (loadCatalog: () => Promise<ComparisonCatalog>) => {
  const entry = await readEntry(/^\/studio\/([^/]+)/.exec(location.pathname)?.[1]).catch(() => undefined);
  return createDeferredStudio(loadCatalog, STUDIO_IMPORTS, entry && { entry, sync: async (e) => (await STUDIO_IMPORTS.projects()).openLocal(e) });
};

export function createDeferredStudio(loadCatalog: () => Promise<ComparisonCatalog>, imports: typeof STUDIO_IMPORTS = STUDIO_IMPORTS, local?: LocalStart): DeferredStudio {
  const state = local?.entry.state;
  const sync = local && createSharedLoader(() => local.sync(local.entry));
  const store = createStudioStore(state, sync && ((next) => void sync().then((s) => s.saveState(next), () => undefined)));
  return {
    profiles: createMemoryProfileRepository({ store }),
    board: createSharedLoader(async () => {
      const [{ createMemoryCompareBoardRepository }, catalog] = await Promise.all([imports.board(), loadCatalog()]);
      // 보드는 영속 범위 밖 — 새로고침마다 빈 보드라 세션별 id로 멱등 네임스페이스를 나눈다(Codex r2 P1)
      return createMemoryCompareBoardRepository({ catalog, store, ...(local && { boardId: `board-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}` }) });
    }),
    generations: createSharedLoader(async () => (await imports.generations()).createMemoryGenerationRepository({ store })),
    projects: createSharedLoader(async () => (await imports.projects()).createMemoryProjectRepository({ store, ...(local && sync && { local: { entry: local.entry, sync } }) })),
  };
}
