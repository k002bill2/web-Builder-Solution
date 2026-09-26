import type { BoardLoad, CompareBoardRepository } from "./compareBoardRepository";

/**
 * 비교 보드 저장소를 처음 쓸 때 불러온다 (deferredReferenceRepository와 같은 방식).
 * 메모리 구현은 zod·초안 계산·픽스처를 끌고 오므로 공통 청크(첫 화면 JS 예산, ADR-004) 밖에 둔다.
 * 불러오기에 실패하면 다음 호출에서 다시 시도한다.
 * `initial`을 주면 불러오기 전 보드 조회는 그 값을 돌려준다 — 메모리 구현은 불러오기 전 상태가 곧 초기 보드라
 * 트레이의 진입 조회가 무거운 청크를 첫 화면에 끌어오지 않게 한다(Codex R1). HTTP 구현으로 바꾸면 빼도 된다.
 */
export function createDeferredCompareBoardRepository(
  load: () => Promise<CompareBoardRepository>,
  initial?: BoardLoad,
): CompareBoardRepository {
  let pending: Promise<CompareBoardRepository> | undefined;
  const resolve = () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
  return {
    getBoard: async () => (pending === undefined && initial ? initial : (await resolve()).getBoard()),
    addReference: async (id) => (await resolve()).addReference(id),
    removeReference: async (id) => (await resolve()).removeReference(id),
    savePicks: async (picks, custom, revision) => (await resolve()).savePicks(picks, custom, revision),
    getComparison: async (ids) => (await resolve()).getComparison(ids),
    confirmProfile: async (revision, expectedLatest) => (await resolve()).confirmProfile(revision, expectedLatest),
    createProfileVersion: async (profileId, revision, expectedLatest) => (await resolve()).createProfileVersion(profileId, revision, expectedLatest),
    getProfileVersions: async (profileId) => (await resolve()).getProfileVersions(profileId),
  };
}
