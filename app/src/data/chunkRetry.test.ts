/**
 * F1 (D-2A4-01·02) — 조작 뒤 청크 로더. 브라우저는 실패한 동적 import를 URL 단위로 기억한다(같은 import()는 요청 없이 거부, Chromium 실측).
 * 재시도 URL은 오류 문장이 아니라 **로더 함수 소스**(빌드 출력의 `import(`./<청크>-<해시>.js`)`)에서 읽는다 — WebKit처럼 오류에 URL이 없어도 같다.
 */
import { describe, expect, it, vi } from "vitest";
import { retryableImport } from "./chunkRetry";

const MODULE = Object.freeze({ ok: true });
const WEBKIT = () => new TypeError("Importing a module script failed.");
/** 빌드 출력 모양의 로더 — Vite preload 래퍼 안의 정적 import(). 소스 문자열만 흉내 내고 실제 호출은 `result` */
const built = (file: string, result: () => Promise<unknown>) =>
  Object.assign(vi.fn(result), { toString: () => `()=>i(()=>import(\`./${file}\`),__vite__mapDeps([0,1]))` });
/** 이 모듈 기준 절대 URL — `new URL(`./${…}`, import.meta.url)` 템플릿은 Vite가 자산 URL로 바꾸므로 문자열을 이어 붙인다 */
const retryUrl = (file: string, n: number) => `${new URL("./" + file, import.meta.url).href}?retry=${n}`;

describe("retryableImport — 실패 캐시 우회", () => {
  it("첫 시도는 정적 import() 1회, 성공하면 모듈을 기억해 다시 받지 않는다", async () => {
    const load = built("ok-A1.js", () => Promise.resolve(MODULE));
    const fresh = vi.fn();
    const loader = retryableImport(load, fresh);
    await expect(loader()).resolves.toBe(MODULE);
    await expect(loader()).resolves.toBe(MODULE);
    expect(load).toHaveBeenCalledTimes(1);
    expect(fresh).not.toHaveBeenCalled();
  });

  it("정적 import()가 실패하면 원래 오류 그대로 → 다음 호출은 같은 청크를 새 URL(?retry=1)로 받아 성공, 그 뒤 요청 0 — 오류에 URL이 없어도(WebKit)", async () => {
    const error = WEBKIT();
    const load = built("memoryBoardConfirm-B2.js", () => Promise.reject(error));
    const fresh = vi.fn(() => Promise.resolve(MODULE));
    const loader = retryableImport(load, fresh);
    await expect(loader()).rejects.toBe(error);
    await expect(loader()).resolves.toBe(MODULE);
    await expect(loader()).resolves.toBe(MODULE);
    expect(fresh.mock.calls).toEqual([[retryUrl("memoryBoardConfirm-B2.js", 1)]]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("새 URL도 실패하면 번호를 올린다(?retry=2) — 실패한 ?retry=1도 캐시되므로. 두 번 연속 실패는 오류 그대로", async () => {
    const load = built("carryOverPanel-C3.js", () => Promise.reject(WEBKIT()));
    const fresh = vi.fn().mockRejectedValueOnce(WEBKIT()).mockResolvedValueOnce(MODULE);
    const loader = retryableImport(load, fresh);
    await expect(loader()).rejects.toThrow("Importing a module script failed.");
    await expect(loader()).rejects.toThrow("Importing a module script failed.");
    await expect(loader()).resolves.toBe(MODULE);
    expect(fresh.mock.calls.map(([url]) => url)).toEqual([retryUrl("carryOverPanel-C3.js", 1), retryUrl("carryOverPanel-C3.js", 2)]);
  });

  it("같은 청크를 받는 로더가 둘이면 상태를 나눈다 — 한쪽이 새 URL로 받은 뒤 다른 쪽 첫 호출은 캐시된 정적 import()를 부르지 않는다", async () => {
    const first = built("boardInput-D4.js", () => Promise.reject(WEBKIT()));
    const second = built("boardInput-D4.js", () => Promise.reject(WEBKIT()));
    const fresh = vi.fn(() => Promise.resolve(MODULE));
    const a = retryableImport(first, fresh);
    const b = retryableImport(second, fresh);
    await a().catch(() => undefined);
    await expect(a()).resolves.toBe(MODULE);
    await expect(b()).resolves.toBe(MODULE);
    expect(second).not.toHaveBeenCalled();
    expect(fresh).toHaveBeenCalledTimes(1);
  });

  it("소스에서 청크 파일을 못 읽으면(개발 서버·Vitest `import(\"./x\")`, 다른 디렉터리·절대 URL) 새 URL을 만들지 않고 정적 import()를 다시 부른다", async () => {
    for (const source of ['() => import("./memoryBoardConfirm")', "()=>import(`../x/evil-E5.js`)", '()=>import("https://evil.example/assets/a-E6.js")']) {
      const load = Object.assign(vi.fn(() => Promise.reject(WEBKIT())), { toString: () => source });
      const fresh = vi.fn();
      const loader = retryableImport(load, fresh);
      await loader().catch(() => undefined);
      await loader().catch(() => undefined);
      expect(load).toHaveBeenCalledTimes(2);
      expect(fresh).not.toHaveBeenCalled();
    }
  });

  it("같은 시점의 겹친 호출은 요청 하나를 나눠 받는다", async () => {
    const load = built("shared-F7.js", () => Promise.resolve(MODULE));
    const loader = retryableImport(load, vi.fn());
    await Promise.all([loader(), loader()]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
