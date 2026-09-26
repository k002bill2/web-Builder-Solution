import { vi } from "vitest";
import { retryableImport } from "../data/chunkRetry";

/** WebKit 오류 문장 — URL이 없다 (F1은 오류 문장에 기대지 않는다) */
export const moduleScriptFailed = () => new TypeError("Importing a module script failed.");

/**
 * 브라우저 실패 캐시 흉내 (F1 · D-2A4-01·02) — 정적 import()는 한 번 실패하면 계속 실패(요청 없이 거부)하고,
 * 새 URL(`?retry=N`) 요청만 네트워크 상태(`network.failures`만큼 더 실패)에 따라 실제 모듈을 준다.
 * 정적 로더의 소스 문자열은 빌드 출력 모양(`import(`./<청크>-<해시>.js`)`) — retryableImport가 여기서 청크 파일을 읽는다.
 * 청크 재시도 상태는 파일 이름별 모듈 수준이라 테스트마다 다른 `file`을 쓴다.
 */
export function cachedChunkFailure<M>(file: string, actual: () => Promise<M>, network = { failures: 0 }) {
  const staticImport = Object.assign(vi.fn((): Promise<M> => Promise.reject(moduleScriptFailed())), {
    toString: () => `()=>i(()=>import(\`./${file}\`),__vite__mapDeps([0]))`,
  });
  const retries: string[] = [];
  const importUrl = (url: string): Promise<M> => {
    retries.push(url);
    if (network.failures > 0) {
      network.failures -= 1;
      return Promise.reject(moduleScriptFailed());
    }
    return actual();
  };
  return { loader: retryableImport(staticImport, importUrl), staticImport, retries };
}
