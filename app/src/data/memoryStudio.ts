/**
 * 보드·프로필 메모리 구현을 store 하나로 만든다 (DS-2A-04 6.3 이음새). 앱은 main의 deferred 로더가,
 * 테스트는 renderApp이 렌더마다 부른다 — 모듈 싱글턴이 아니라서 id가 늘 `profile-1`부터다.
 */
import type { CompareBoardRepository } from "./compareBoardRepository";
import { createMemoryCompareBoardRepository, type MemoryCompareBoardOptions } from "./memoryCompareBoardRepository";
import { createMemoryProfileRepository, type MemoryProfileOptions } from "./memoryProfileRepository";
import type { ProfileRepository } from "./profileRepository";
import { createStudioStore } from "./studioStore";

export interface MemoryStudio {
  readonly board: CompareBoardRepository;
  /** 조정 범위·저장까지 전체 — 앱 deferred 래퍼·컨텍스트는 아직 읽기 몫(ProfileReadRepository)만 넘긴다 (b2에서 넓힘) */
  readonly profiles: ProfileRepository;
}

export function createMemoryStudio(
  board: Omit<MemoryCompareBoardOptions, "store">,
  profiles: Omit<MemoryProfileOptions, "store"> = {},
): MemoryStudio {
  const store = createStudioStore();
  return { board: createMemoryCompareBoardRepository({ ...board, store }), profiles: createMemoryProfileRepository({ ...profiles, store }) };
}
