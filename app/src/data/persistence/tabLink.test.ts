/**
 * 탭 간 알림 링크 (P1C-SPEC 1.5) — 메시지 모양 검사(경계) · 같은 탭 손잡이 등록.
 */
import { describe, expect, it, vi } from "vitest";
import { createLinkNetwork } from "./fakeTabLink";
import { TAB_CHANNEL, createTabLink } from "./tabLink";

const settle = async () => {
  for (let i = 0; i < 5; i += 1) await Promise.resolve();
};

describe("tabLink", () => {
  it("채널 이름 = design-studio (SPEC 1.5)", () => {
    expect(TAB_CHANNEL).toBe("design-studio");
  });

  it("다른 탭만 받는다 · saved/cleared 외 모양은 버린다", async () => {
    const net = createLinkNetwork();
    const a = net.tab();
    const b = net.tab();
    const gotA = vi.fn();
    const gotB = vi.fn();
    a.listen(gotA);
    b.listen(gotB);
    a.post({ type: "cleared" });
    await settle();
    expect(gotA).not.toHaveBeenCalled();
    expect(gotB).toHaveBeenCalledWith({ type: "cleared" });
  });

  it("채널 메시지 검증 — 모르는 type·모양은 무시", () => {
    let deliver: (event: { data: unknown }) => void = () => undefined;
    const link = createTabLink({ postMessage: () => undefined, addEventListener: (_t, fn) => void (deliver = fn), removeEventListener: () => undefined });
    const got = vi.fn();
    const stop = link.listen(got);
    deliver({ data: { type: "hack" } });
    deliver({ data: "saved" });
    deliver({ data: null });
    deliver({ data: { type: "saved" } });
    expect(got).toHaveBeenCalledTimes(1);
    expect(got).toHaveBeenCalledWith({ type: "saved" });
    stop();
  });

  it("채널 없음(BroadcastChannel 미지원) = 보내기·받기 0, 손잡이는 동작", () => {
    const link = createTabLink(undefined);
    expect(() => link.post({ type: "saved" })).not.toThrow();
    expect(link.own()).toBeUndefined();
    const handle = { isWriter: () => true, stop: vi.fn() };
    const detach = link.attach(handle);
    expect(link.own()).toBe(handle);
    detach();
    expect(link.own()).toBeUndefined();
  });
});
