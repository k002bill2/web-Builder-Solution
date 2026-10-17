/**
 * RS6-L1 CP4 — 동기 생성 · 포트 늦게 붙이기(INTEGRATE-6 2.2-2 ①③) · memory 모드(I5 — DocBook 커밋 뒤 not-persistent, h2-61 제품판).
 */
import { describe, expect, it } from "vitest";
import { createSaveCore, type CoreLink } from "./saveCore";
import { PROJECT, confirmOf, deferred, edited, startedRig, ticks } from "./testRig";

describe("RS6-L1 CP4 · 포트 늦게 붙이기", () => {
  it("포트 로드 전 edit·view·acquire·release 동기 동작 · save = 포트 대기(진행 중 dirty 유지) · 로드 실패 = failed{unavailable} → 다음 save가 다시 받음", async () => {
    const { doc, repo } = await startedRig();
    const loading = deferred();
    let attempt = 0;
    const real = repo.core!(PROJECT, doc);
    const c = createSaveCore(doc, async () => {
      attempt += 1;
      if (attempt === 1) throw new Error("chunk");
      await loading.promise;
      return real.link((_io, _s, link) => link) as Promise<CoreLink>;
    });
    expect(c.edit(edited(doc, "A"))).toBe(1);
    expect([c.view().doc.meta.title, c.view().dirty]).toEqual(["A", true]);
    expect(c.acquire("m")).toBe(1);
    c.release(1);
    expect(await c.save()).toEqual({ status: "failed", reason: "unavailable", newer: false });
    let settled = false;
    const saving = c.save().then((r) => ((settled = true), r));
    await ticks();
    expect([settled, c.view().dirty]).toEqual([false, true]);
    loading.release();
    expect(await saving).toMatchObject({ status: "saved" });
    expect(c.view().dirty).toBe(false);
  });
});

describe("RS6-L1 CP4 · memory 모드(I5)", () => {
  it("h2-61 save = DocBook 메모리 커밋 뒤 failed{not-persistent} · 연속 저장 STALE 0 · confirm failed · 영속 증명 없음", async () => {
    const { repo, core, doc } = await startedRig({ memory: true });
    expect(repo.persistence).toBe("memory");
    const c = core();
    c.edit(edited(doc, "A"));
    expect(await c.save()).toMatchObject({ status: "failed", reason: "not-persistent" });
    c.edit(edited(doc, "B"));
    expect(await c.save()).toMatchObject({ status: "failed", reason: "not-persistent" });
    const mem = await repo.getDoc(PROJECT);
    expect([mem?.revision, mem?.meta.title]).toEqual([doc.revision + 2, "B"]);
    expect(c.view().dirty).toBe(false);
    expect(c.view().confirmed?.proof).toBe("hydrated");
    expect(await confirmOf(c)).toEqual({ status: "failed", reason: "not-persistent" });
  });
});
