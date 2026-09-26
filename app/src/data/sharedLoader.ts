/**
 * 여러 deferred 래퍼가 같은 로드 결과를 쓰게 한다 — main의 보드·프로필 저장소가 store 하나를 공유한다 (DS-2A-04 6.3).
 * 실패한 로드는 캐시하지 않는다(다음 호출에서 다시 시도, deferred 래퍼와 같은 규칙).
 */
export function createSharedLoader<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    });
    return pending;
  };
}
