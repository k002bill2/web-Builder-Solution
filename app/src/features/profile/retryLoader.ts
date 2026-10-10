/**
 * 프로필 엔진 청크의 조작 뒤 청크 로더 공용 본문(RESTART MQ-S7 ★A 감량 — compare·candidateResults·restart 로더가 같은 본문을 손 복제하던 것을 하나로).
 * 실패 뒤 다시 부르면 같은 청크를 새 URL(`?retry=N`)로 받는다 — `retryableImport`(data/chunkRetry, F1)와 같은 방식이다.
 * chunkRetry를 import하지 않는 이유: 엔진 청크가 정적 import하면 chunkRetry가 따로 떨어져 공통·모든 화면이 +0.02~0.04KB(실측, logs/h1-measure.txt).
 */
export function retryLoader<T>(load: () => Promise<T>): () => Promise<T> {
  /** 빌드 출력의 청크 파일 이름(`./<이름>-<해시>.js`). 개발 서버·Vitest는 없음 → 정적 import()를 다시 부른다 */
  const file = /import\([`'"]\.\/([\w-]+\.js)[`'"]\)/.exec(String(load))?.[1];
  let loaded: Promise<T> | undefined;
  let retries = 0;
  return () =>
    (loaded ??= (file && retries ? (import(/* @vite-ignore */ `${new URL(file, import.meta.url).href}?retry=${retries}`) as Promise<T>) : load()).catch(
      (error: unknown) => {
        loaded = undefined;
        retries += 1;
        throw error;
      },
    ));
}
