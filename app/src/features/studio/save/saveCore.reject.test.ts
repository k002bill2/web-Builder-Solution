/**
 * RS6-L2 · L1 QA note 3 — 포트 `mode()`·`verify()`가 throw해도 `save()`·`confirm()`은 reject하지 않고 결과(`failed{infra}`)를 돌려준다.
 * 거짓 "저장됨" 0(savedMark·confirmed 전진 0)도 함께 고정한다.
 */
import { describe, expect, it } from "vitest";
import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { createSaveCore, type CorePort } from "./saveCore";
import { PROJECT, confirmOf, edited } from "./testRig";

const boom = () => Promise.reject(new DOMException("injected", "InvalidStateError"));

function coreWith(port: Partial<CorePort>) {
  const doc = sampleDoc();
  const full: CorePort = { mode: async () => "writer", head: async () => doc, commit: async () => undefined, verify: async () => true, ...port };
  const c = createSaveCore(doc, async () => ({ projectId: PROJECT, port: full, now: () => "2026-10-17T00:00:00.000Z", book: (d) => d, align: () => undefined, io: (await import("./coreIo")).coreIo }));
  return { c, doc };
}

describe("RS6-L2 · L1 QA note 3 — save·confirm reject 0", () => {
  it("save: mode() throw → failed{infra} · dirty 유지 · confirmed 그대로(hydrated)", async () => {
    const { c, doc } = coreWith({ mode: boom });
    c.edit(edited(doc, "B"));
    await expect(c.save()).resolves.toEqual({ status: "failed", reason: "infra", newer: false });
    expect([c.view().dirty, c.view().confirmed?.proof]).toEqual([true, "hydrated"]);
  });

  it("confirm(dirty): save 안 mode() throw → failed{infra}", async () => {
    const { c, doc } = coreWith({ mode: boom });
    c.edit(edited(doc, "B"));
    await expect(confirmOf(c)).resolves.toEqual({ status: "failed", reason: "infra" });
  });

  it("confirm(깨끗함): mode() throw → failed{infra}", async () => {
    const { c } = coreWith({ mode: boom });
    await expect(confirmOf(c)).resolves.toEqual({ status: "failed", reason: "infra" });
  });

  it("confirm(깨끗함): verify() throw → failed{infra}", async () => {
    const { c } = coreWith({ verify: boom });
    await expect(confirmOf(c)).resolves.toEqual({ status: "failed", reason: "infra" });
  });

  it("confirm(dirty): 저장 뒤 verify() throw → failed{infra} · 커밋은 됐으므로 dirty 0 · 영구 확인 아님", async () => {
    const { c, doc } = coreWith({ verify: boom });
    c.edit(edited(doc, "B"));
    await expect(confirmOf(c)).resolves.toEqual({ status: "failed", reason: "infra" });
    expect([c.view().dirty, c.view().confirmed?.proof]).toEqual([false, "committed"]);
  });
});
