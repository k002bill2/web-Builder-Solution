/**
 * RS8-2 CP1(B-RS-09) — `view().reason` = 마지막 save 결과 사유(읽기 전용 · 포트·잠금 호출 0).
 * 기록 = save `failed{reason}`(memory `not-persistent`는 성공이라 기록 0) · 해제 = 다음 `saved` · not-persistent · discard(`discarded`) · rebase(`rebased`).
 * `/projects` 행이 첫 표시부터 이 값으로 사유 문구를 고른다 — `port.mode()`(readonly면 잠금 재요청) 대신(Codex P2).
 */
import { describe, expect, it } from "vitest";
import { sampleDoc } from "../../../engine/testing/sampleDoc";
import { rebase } from "./coreIo";
import { createSaveCore, type CorePort } from "./saveCore";
import { PROJECT, edited } from "./testRig";

/** 포트 mode 결과를 차례로 낸다(끝나면 writer) · commit 실패 1회 주입 */
function coreWith(modes: string[] = [], port: Partial<CorePort> = {}) {
  const doc = sampleDoc();
  const queue = [...modes];
  const calls = { mode: 0 };
  const full: CorePort = {
    mode: async () => ((calls.mode += 1), queue.shift() ?? "writer"),
    head: async () => doc,
    commit: async () => undefined,
    verify: async () => true,
    ...port,
  };
  const c = createSaveCore(doc, async () => ({ projectId: PROJECT, port: full, now: () => "2026-10-18T00:00:00.000Z", book: (d) => d, align: () => undefined, io: (await import("./coreIo")).coreIo }));
  return { c, doc, calls };
}

describe("RS8-2 CP1 — view().reason 기록·해제", () => {
  it("생성 직후 reason 없음", () => {
    expect(coreWith().c.view().reason).toBeUndefined();
  });

  it("save failed{readonly} → reason = readonly · view()는 포트 mode를 부르지 않는다 · 다음 saved → 해제", async () => {
    const { c, doc, calls } = coreWith(["readonly"]);
    c.edit(edited(doc, "B"));
    await expect(c.save()).resolves.toMatchObject({ status: "failed", reason: "readonly" });
    const before = calls.mode;
    expect(c.view()).toMatchObject({ dirty: true, reason: "readonly" });
    expect(calls.mode).toBe(before);
    await expect(c.save()).resolves.toMatchObject({ status: "saved" });
    expect(c.view()).toMatchObject({ dirty: false, reason: undefined });
  });

  it("마지막 결과가 이긴다 — stale 뒤 cleared → cleared · 편집(결과 아님)은 지우지 않는다", async () => {
    const { c, doc } = coreWith(["stale", "cleared"]);
    c.edit(edited(doc, "B"));
    await c.save();
    expect(c.view().reason).toBe("stale");
    await c.save();
    expect(c.view().reason).toBe("cleared");
    c.edit(edited(doc, "C"));
    expect(c.view().reason).toBe("cleared");
  });

  it("포트 판정 throw = failed{infra} → reason = infra · commit reject(image-missing) → reason = image-missing", async () => {
    let fail = true;
    const { c, doc } = coreWith([], {
      mode: () => (fail ? Promise.reject(new DOMException("injected", "InvalidStateError")) : Promise.resolve("writer")),
      commit: () => Promise.reject({ reason: "image-missing" }),
    });
    c.edit(edited(doc, "B"));
    await c.save();
    expect(c.view().reason).toBe("infra");
    fail = false;
    await c.save();
    expect(c.view().reason).toBe("image-missing");
  });

  it("memory 모드: 메모리 커밋 실패 → 그 reason · 다음 not-persistent(성공) → 해제", async () => {
    const doc = sampleDoc();
    let throwOnce = true;
    const c = createSaveCore(doc, async () => ({
      projectId: PROJECT,
      port: undefined,
      now: () => "2026-10-18T00:00:00.000Z",
      book: (d) => {
        if (throwOnce) {
          throwOnce = false;
          throw { reason: "conflict" };
        }
        return d;
      },
      align: () => undefined,
      io: (await import("./coreIo")).coreIo,
    }));
    c.edit(edited(doc, "B"));
    await expect(c.save()).resolves.toMatchObject({ status: "failed", reason: "conflict" });
    expect(c.view().reason).toBe("conflict");
    await expect(c.save()).resolves.toMatchObject({ status: "failed", reason: "not-persistent" });
    expect(c.view()).toMatchObject({ dirty: false, reason: undefined });
  });

  it("discard(discarded) → 해제 · blocked(초안 보존)면 그대로", async () => {
    const { c, doc } = coreWith(["stale"]);
    c.edit(edited(doc, "B"));
    await c.save();
    await expect(c.discard()).resolves.toMatchObject({ status: "discarded" });
    expect(c.view()).toMatchObject({ dirty: false, reason: undefined });

    const kept = coreWith(["readonly"], { verify: async () => false });
    kept.c.edit(edited(kept.doc, "B"));
    await kept.c.save();
    await expect(kept.c.discard()).resolves.toMatchObject({ status: "blocked" });
    expect(kept.c.view()).toMatchObject({ dirty: true, reason: "readonly" });
  });

  it("rebase(clean 맞춤) → 해제", async () => {
    const { c, doc } = coreWith(["readonly"]);
    c.edit(edited(doc, "B"));
    await c.save();
    const restored = { ...edited(doc, "복원"), revision: doc.revision + 5 };
    await c.link((_, s) => rebase(s, restored));
    expect(c.view()).toMatchObject({ dirty: false, reason: undefined, confirmed: { proof: "rebased" } });
  });

  it("rebase(mine · 요청 뒤 새 편집 → dirty 유지) → 해제(마지막 결과는 이 쓰기 성공)", async () => {
    const { c, doc } = coreWith(["readonly"]);
    c.edit(edited(doc, "B"));
    await c.save();
    const written = { ...edited(doc, "충돌 해결"), revision: doc.revision + 5 };
    c.edit(edited(doc, "그 뒤 편집"));
    await c.link((_, s) => rebase(s, written, true));
    expect(c.view()).toMatchObject({ dirty: true, reason: undefined, confirmed: { proof: "rebased" } });
  });
});
