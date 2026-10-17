/**
 * B-RS-15 — `retryRow` 폴백: 클릭~청크 로드 사이에 기억이 풀리거나(다른 확인·U16) 코어가 clean이면 이번 클릭은 저장 0이다.
 * 저장 0인데 "다시 저장했습니다"(성공 문구)를 내지 않는다 — ok(행 새로고침) + 무문구.
 */
import { afterEach, describe, expect, it } from "vitest";
import { discardAndReload } from "../pending/pendingWrites";
import { PROJECT, startedRig } from "../studio/save/testRig";
import { retryRow } from "./pendingRetry";

afterEach(() => discardAndReload(() => undefined));

describe("retryRow 폴백 — 거짓 성공 문구 0", () => {
  it("기억·코어 모두 없음 → ok(새로고침) · 무문구 · 쓰기 0", async () => {
    const { db, repo } = await startedRig();
    const writes = db.ops.length;
    expect(await retryRow(repo, PROJECT)).toEqual({ ok: true, text: "" });
    expect(db.ops.length).toBe(writes);
  });

  it("코어 clean · 기억 없음 → ok(새로고침) · 무문구 · save 0", async () => {
    const { db, repo, core } = await startedRig();
    core();
    const writes = db.ops.length;
    expect(await retryRow(repo, PROJECT)).toEqual({ ok: true, text: "" });
    expect(db.ops.length).toBe(writes);
  });
});
