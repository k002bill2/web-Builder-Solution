import type { ProfileReadRepository } from "./profileRepository";

/**
 * 프로필 저장소를 처음 쓸 때 불러온다 (deferredCompareBoardRepository와 같은 방식, SPEC 7 P-B2).
 * 메모리 구현·store는 공통 청크(첫 화면 JS 예산, ADR-004) 밖에 둔다. 불러오기에 실패하면 다음 호출에서 다시 시도한다.
 */
export function createDeferredProfileRepository(load: () => Promise<ProfileReadRepository>): ProfileReadRepository {
  let pending: Promise<ProfileReadRepository> | undefined;
  const resolve = () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
  return {
    listProfiles: async () => (await resolve()).listProfiles(),
    getProfile: async (profileId) => (await resolve()).getProfile(profileId),
    revertTo: async (profileId, version, expectedLatest) => (await resolve()).revertTo(profileId, version, expectedLatest),
  };
}
