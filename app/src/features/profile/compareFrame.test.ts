/**
 * M2B-5 SPEC 5 · CMP-AC-U3 — 비교 프레임 다리의 수신 판정: 그 프레임의 contentWindow에서 온 메시지만, 모양 검사(readRenderMessage) 통과만.
 */
import { describe, expect, it } from "vitest";
import { frameMessage } from "./compareFrame";

describe("비교 프레임 수신 판정 (CMP-AC-U3)", () => {
  it("다른 프레임·창에서 온 메시지 = 무시 · 모양 틀림 = 무시 · 그 프레임 + 올바른 모양만 읽는다", () => {
    const mine = document.createElement("iframe");
    const other = document.createElement("iframe");
    document.body.append(mine, other);
    const from = (source: MessageEventSource | null, data: unknown) => new MessageEvent("message", { data, source });
    expect(frameMessage(from(other.contentWindow, { type: "ready" }), mine)).toBeUndefined();
    expect(frameMessage(from(window, { type: "ready" }), mine)).toBeUndefined();
    expect(frameMessage(from(mine.contentWindow, { type: "rects", rects: [["x", null, 0, 0, "w", 1]] }), mine)).toBeUndefined();
    expect(frameMessage(from(mine.contentWindow, { type: "ready" }), null)).toBeUndefined();
    expect(frameMessage(from(mine.contentWindow, { type: "ready" }), mine)).toEqual({ type: "ready" });
    expect(frameMessage(from(mine.contentWindow, { type: "error", code: "NO_KIT_TOKENS" }), mine)).toEqual({ type: "error", code: "NO_KIT_TOKENS" });
    mine.remove();
    other.remove();
  });
});
