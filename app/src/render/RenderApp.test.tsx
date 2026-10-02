import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { RenderApp } from "./RenderApp";

/**
 * 렌더 문서 메시지 수신기 (M2A-1 R3 · Opus R2 B-1-6). 단위 테스트에서는 최상위 창이라 `window.parent === window` —
 * 부모 메시지는 source = window로 보내고, 렌더 → 부모 메시지는 window.postMessage 감시로 읽는다.
 */
let posted: unknown[] = [];
beforeEach(() => {
  posted = [];
  vi.spyOn(window, "postMessage").mockImplementation((data: unknown) => void posted.push(data));
});
afterEach(() => vi.restoreAllMocks());

const fromParent = (data: unknown, source: MessageEventSource | null = window) => act(() => void window.dispatchEvent(new MessageEvent("message", { data, source })));
const sent = (type: string) => posted.filter((m) => (m as { type: string }).type === type);

describe("렌더 문서 수신기", () => {
  it("탑재하면 ready 1회", () => {
    render(<RenderApp host={window} />);
    expect(sent("ready")).toEqual([{ type: "ready" }]);
  });

  it("render{doc} → validatePageDoc 통과 문서를 그리고 rects를 보고한다(섹션마다 instanceId · 슬롯 키 null)", () => {
    const { container } = render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: sampleDoc() });
    expect(container.querySelectorAll("[data-instance-id]")).toHaveLength(sampleDoc().sections.length);
    const rects = sent("rects").at(-1) as { rects: unknown[][] };
    expect(rects.rects.filter((r) => r[1] === null).map((r) => r[0])).toEqual(sampleDoc().sections.map((s) => s.instanceId));
    for (const r of rects.rects) expect(r.slice(2).every((n) => typeof n === "number")).toBe(true);
  });

  it("검증 실패 문서 → error{INVALID_DOC} · 그리지 않는다(이전 그림도 지운다)", () => {
    const { container } = render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: sampleDoc() });
    fromParent({ type: "render", doc: { ...sampleDoc(), sections: "x" } });
    expect(sent("error")).toEqual([{ type: "error", code: "INVALID_DOC" }]);
    expect(container.querySelectorAll("[data-instance-id]")).toHaveLength(0);
  });

  it("부모가 아닌 출처 · 모양이 틀린 메시지는 무시한다", () => {
    const { container } = render(<RenderApp host={window} />);
    const other = document.createElement("iframe");
    document.body.append(other);
    fromParent({ type: "render", doc: sampleDoc() }, other.contentWindow);
    fromParent({ type: "render" });
    fromParent({ type: "paint", doc: sampleDoc() });
    fromParent("render");
    expect(container.querySelectorAll("[data-instance-id]")).toHaveLength(0);
    expect(sent("error")).toEqual([]);
    other.remove();
  });

  it("섹션 누름 → click{instanceId}(안쪽 요소를 눌러도 섹션 id)", () => {
    const { container } = render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: sampleDoc() });
    fireEvent.click(container.querySelector('[data-instance-id="s-about"] p')!);
    expect(sent("click")).toEqual([{ type: "click", instanceId: "s-about" }]);
  });

  it("viewport{width} · select{instanceId} → 사각형을 다시 보고한다", () => {
    render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: sampleDoc() });
    const before = sent("rects").length;
    fromParent({ type: "viewport", width: 390 });
    fromParent({ type: "select", instanceId: "s-about" });
    expect(sent("rects").length).toBeGreaterThan(before);
    expect(screen.queryByText(/^About · /)).toBeNull();
  });
});
