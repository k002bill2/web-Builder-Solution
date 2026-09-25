import type { ReferenceRepository } from "./referenceRepository";

/**
 * 실제 저장소를 처음 쓸 때 불러오는 저장소 (M1-UI-01-FIX 그룹 C).
 * 픽스처처럼 큰 데이터를 초기 JS 청크에서 빼기 위한 것으로, 인터페이스가 이미 Promise라 화면은 차이를 모른다.
 * 불러오기에 실패하면 다음 호출에서 다시 시도한다.
 */
export function createDeferredReferenceRepository(load: () => Promise<ReferenceRepository>): ReferenceRepository {
  let pending: Promise<ReferenceRepository> | undefined;
  const resolve = () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
  return {
    list: async (query) => (await resolve()).list(query),
    getById: async (id) => (await resolve()).getById(id),
    getDetail: async (id) => (await resolve()).getDetail(id),
    getSimilar: async (id) => (await resolve()).getSimilar(id),
  };
}
