/**
 * "새로 시작" 대화상자 청크 로더(RESTART SPEC r1 9절) — compareLoader와 같은 방식(chunkRetry를 import하지 않는 이유도 같다).
 * 실패하면 다음 호출은 새 URL(`?retry=N`)로 다시 받는다.
 */
type Restart = typeof import("./RestartDialog");
const load = (): Promise<Restart> => import("./RestartDialog");
/** 빌드 출력의 청크 파일 이름(`./RestartDialog-<해시>.js`). 개발 서버·Vitest는 없음 → 정적 import()를 다시 부른다 */
const file = /import\([`'"]\.\/([\w-]+\.js)[`'"]\)/.exec(String(load))?.[1];
let loaded: Promise<Restart> | undefined;
let retries = 0;
export const loadRestart = (): Promise<Restart> =>
  (loaded ??= (file && retries ? (import(/* @vite-ignore */ `${new URL(file, import.meta.url).href}?retry=${retries}`) as Promise<Restart>) : load()).catch(
    (error: unknown) => {
      loaded = undefined;
      retries += 1;
      throw error;
    },
  ));
