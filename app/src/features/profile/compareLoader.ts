/**
 * 3안 실렌더 비교 청크 로더 (M2B-5 SPEC 1.1 · 3.1) — "3안 실제 화면으로 비교" onClick·"다시 시도" onClick에서만 부른다(조작 뒤). 테스트가 실패를 주입하는 이음새.
 * 실패 뒤 다시 부르면 같은 청크를 새 URL(`?retry=N`)로 받는다 — candidateResultsLoader와 같은 방식(chunkRetry를 import하지 않는 이유도 같다).
 */
type Compare = typeof import("./CompareDialog");

const load = (): Promise<Compare> => import("./CompareDialog");
/** 빌드 출력의 청크 파일 이름(`./CompareDialog-<해시>.js`). 개발 서버·Vitest는 없음 → 정적 import()를 다시 부른다 */
const file = /import\([`'"]\.\/([\w-]+\.js)[`'"]\)/.exec(String(load))?.[1];
let loaded: Promise<Compare> | undefined;
let retries = 0;

export const loadCompare = (): Promise<Compare> =>
  (loaded ??= (file && retries ? (import(/* @vite-ignore */ `${new URL(file, import.meta.url).href}?retry=${retries}`) as Promise<Compare>) : load()).catch(
    (error: unknown) => {
      loaded = undefined;
      retries += 1;
      throw error;
    },
  ));
