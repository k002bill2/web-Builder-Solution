/**
 * 조작 뒤 청크 로더 (F1 · QA D-2A4-01·02). 브라우저는 실패한 동적 import를 URL 단위로 기억해, 네트워크가 돌아와도
 * 같은 import()는 요청 없이 거부한다(Chromium 실측) — 그래서 실패 뒤에는 같은 청크를 새 URL(`?retry=N`, 매번 증가)로 받는다.
 *  - 새 URL은 오류 문장이 아니라 **로더 함수 소스**에서 읽는다: 빌드 출력은 `()=>i(()=>import(`./<청크>-<해시>.js`),…)`라
 *    우리 번들 안의 리터럴이다(WebKit처럼 오류에 URL이 없어도 같다). 청크는 모두 `assets/` 한 곳이라 이 모듈 URL 기준으로 푼다.
 *    `./이름.js` 모양이 아니면(개발 서버·Vitest) 새 URL을 만들지 않고 정적 import()를 다시 부른다(지금과 같은 동작).
 *  - 받은 모듈은 기억해 다시 받지 않는다. 상태는 청크 파일별로 나눈다 — 같은 청크를 받는 다른 로더가 캐시된 정적 import()로 다시 실패하지 않게.
 *  - 한계: 실패한 것이 청크의 정적 의존 청크면 복구되지 않는다(의존 청크 URL은 그대로). 빌드 출력 모양이 바뀌면 조용히 지금 동작으로 돌아간다.
 * 실패 시점에 이미 받아져 있어야 하므로 로더와 같은 진입 직후 청크에 들어간다 — 짧게 둔다.
 */
const chunks = new Map<string, { loaded?: Promise<unknown>; retries: number }>();

export function retryableImport<M>(load: () => Promise<M>, importUrl = (url: string): Promise<M> => import(/* @vite-ignore */ url)): () => Promise<M> {
  const file = /import\([`'"]\.\/([\w-]+\.js)[`'"]\)/.exec(String(load))?.[1];
  const state = (file && chunks.get(file)) || { retries: 0 };
  if (file) chunks.set(file, state);
  return () =>
    (state.loaded ??= (file && state.retries ? importUrl(`${new URL(file, import.meta.url).href}?retry=${state.retries}`) : load()).catch(
      (error: unknown) => {
        state.loaded = undefined;
        state.retries += 1;
        throw error;
      },
    )) as Promise<M>;
}
