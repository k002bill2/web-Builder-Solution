import { describe, expect, it } from "vitest";
import { cachedChunkFailure } from "../../test/chunkFailureCache";
import { exportChunk } from "./exportFlowFails";
import { trackExportChunk } from "./exportFlowLoader";

/** B-M4A-08 — 내보내기 청크 연속 실패 횟수(새로고침 안내 판정). 브라우저 실패 캐시는 cachedChunkFailure가 흉내 낸다 */
describe("내보내기 청크 로드 실패 횟수 (B-M4A-08)", () => {
  it("첫 로드 실패 1회 → 다시 시도는 같은 청크를 다른 URL(?retry=1)로 받아 성공", async () => {
    exportChunk.fails = 0;
    const flow = { requestExportOnce: () => undefined };
    const { loader, staticImport, retries } = cachedChunkFailure("exportFlow-B8a.js", async () => flow);
    const load = trackExportChunk(loader);
    await expect(load()).rejects.toThrow("Importing a module script failed.");
    expect(exportChunk.fails).toBe(1);
    await expect(load()).resolves.toBe(flow);
    expect(staticImport).toHaveBeenCalledTimes(1);
    expect(retries).toEqual([expect.stringMatching(/\/exportFlow-B8a\.js\?retry=1$/)]);
  });

  it("2회 연속 실패 → 횟수 2(새로고침 안내) · 매번 다른 URL(?retry=1, ?retry=2)", async () => {
    exportChunk.fails = 0;
    const network = { failures: 1 };
    const { loader, retries } = cachedChunkFailure("exportFlow-B8b.js", async () => ({}), network);
    const load = trackExportChunk(loader);
    await expect(load()).rejects.toThrow();
    await expect(load()).rejects.toThrow();
    expect(exportChunk.fails).toBe(2);
    await load();
    expect(retries).toEqual([expect.stringMatching(/\?retry=1$/), expect.stringMatching(/\?retry=2$/)]);
  });
});
