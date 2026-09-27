/**
 * 3안 카드·표 청크 로더 (PROFILE-HEADROOM-2) — 잡이 있을 때·"3안 만들기" onClick 미리 받기. 테스트가 실패를 주입하는 이음새.
 * 실패 뒤 다시 부르면 같은 청크를 새 URL(`?retry=N`)로 받는다 — `retryableImport`(data/chunkRetry, F1)와 같은 방식이다.
 * chunkRetry를 import하지 않는 이유: 엔진 청크가 정적 import하면 chunkRetry가 따로 떨어져 공통·모든 화면이 +0.02~0.04KB(실측, logs/h1-measure.txt).
 */
type Results = typeof import("./CandidateResults");

const load = (): Promise<Results> => import("./CandidateResults");
/** 빌드 출력의 청크 파일 이름(`./CandidateResults-<해시>.js`). 개발 서버·Vitest는 없음 → 정적 import()를 다시 부른다 */
const file = /import\([`'"]\.\/([\w-]+\.js)[`'"]\)/.exec(String(load))?.[1];
let loaded: Promise<Results> | undefined;
let retries = 0;

export const loadCandidateResults = (): Promise<Results> =>
  (loaded ??= (file && retries ? (import(/* @vite-ignore */ `${new URL(file, import.meta.url).href}?retry=${retries}`) as Promise<Results>) : load()).catch(
    (error: unknown) => {
      loaded = undefined;
      retries += 1;
      throw error;
    },
  ));
