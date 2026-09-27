/**
 * 보드·프로필·생성 메모리 구현을 store 하나로 만든다 (DS-2A-04 6.3 이음새). 앱은 main의 deferred 로더가,
 * 테스트는 renderApp이 렌더마다 부른다 — 모듈 싱글턴이 아니라서 id가 늘 `profile-1`부터다.
 */
import type { CompareBoardRepository } from "./compareBoardRepository";
import { createMemoryCompareBoardRepository, type MemoryCompareBoardOptions } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository, type MemoryGenerationOptions } from "./memoryGenerationRepository";
import { createMemoryProfileRepository, type MemoryProfileOptions } from "./memoryProfileRepository";
import type { GenerationRepository } from "./generationRepository";
import type { ProfileRepository } from "./profileRepository";
import type { ProjectRepository } from "./projectRepository";
import { createSharedLoader } from "./sharedLoader";
import { createStudioStore } from "./studioStore";

export interface MemoryStudio {
  readonly board: CompareBoardRepository;
  /** 조회·조정 범위·조정 저장·되돌리기 전체 — 앱 deferred 래퍼·컨텍스트도 같은 인터페이스 (2a-04b2) */
  readonly profiles: ProfileRepository;
  /** 3안 생성 잡(2a-04c) — 같은 store에서 저장된 버전을 읽는다 */
  readonly generations: GenerationRepository;
  /**
   * 프로젝트 저장소(2a-05) — 보드·프로필 진입 직후 합계에 싣지 않게 `/projects`·`/studio`가 처음 부를 때 받는다.
   * 부를 때마다 같은 인스턴스(목록 화면이 식별자로 다시 조회한다)
   */
  readonly projects: () => Promise<ProjectRepository>;
}

export function createMemoryStudio(
  board: Omit<MemoryCompareBoardOptions, "store">,
  profiles: Omit<MemoryProfileOptions, "store"> = {},
  generations: Omit<MemoryGenerationOptions, "store"> = {},
): MemoryStudio {
  const store = createStudioStore();
  return {
    board: createMemoryCompareBoardRepository({ ...board, store }),
    profiles: createMemoryProfileRepository({ ...profiles, store }),
    generations: createMemoryGenerationRepository({ ...generations, store }),
    projects: createSharedLoader(async () => (await import("./memoryProjectRepository")).createMemoryProjectRepository({ store, ...(board.now && { now: board.now }) })),
  };
}
