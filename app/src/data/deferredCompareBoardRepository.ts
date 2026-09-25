import type { CompareBoardRepository } from "./compareBoardRepository";

/**
 * 비교 보드 저장소를 처음 쓸 때 불러온다 (deferredReferenceRepository와 같은 방식).
 * 메모리 구현은 zod·초안 계산·픽스처를 끌고 오므로 공통 청크(첫 화면 JS 예산, ADR-004) 밖에 둔다.
 * 불러오기에 실패하면 다음 호출에서 다시 시도한다.
 */
export function createDeferredCompareBoardRepository(load: () => Promise<CompareBoardRepository>): CompareBoardRepository {
  let pending: Promise<CompareBoardRepository> | undefined;
  const resolve = () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
  return {
    getBoard: async () => (await resolve()).getBoard(),
    addReference: async (id) => (await resolve()).addReference(id),
    removeReference: async (id) => (await resolve()).removeReference(id),
    savePicks: async (picks, custom, revision) => (await resolve()).savePicks(picks, custom, revision),
    getComparison: async (ids) => (await resolve()).getComparison(ids),
    confirmProfile: async (revision) => (await resolve()).confirmProfile(revision),
    createProfileVersion: async (profileId, revision) => (await resolve()).createProfileVersion(profileId, revision),
    getProfileVersions: async (profileId) => (await resolve()).getProfileVersions(profileId),
  };
}
