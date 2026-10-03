import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { RenderApp } from "./RenderApp";
import { SAMPLE_KIT_TOKENS } from "./testing/sampleKitTokens";

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
    fromParent({ type: "render", doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS });
    fromParent({ type: "render", doc: { ...sampleDoc(), sections: "x" }, kitTokens: SAMPLE_KIT_TOKENS });
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

  it("킷 토큰 없음 → error{NO_KIT_TOKENS} · 킷 섹션은 그리지 않고 폴백 섹션(중립 토큰)은 계속 그린다 · rects 보고 (MQ-1)", () => {
    const { container } = render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: sampleDoc() });
    expect(sent("error")).toEqual([{ type: "error", code: "NO_KIT_TOKENS" }]);
    expect(container.querySelectorAll("[data-kit]")).toHaveLength(0);
    expect(container.querySelectorAll('[data-fallback="true"]').length).toBeGreaterThan(0);
    expect(sent("rects").length).toBeGreaterThan(0);
  });

  it("킷 토큰 있음 → error 0 · 폴백 팔레트 = kitTokens.palette · 사이트 변수 --site-* 적용", () => {
    const { container } = render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS });
    expect(sent("error")).toEqual([]);
    const fallback = container.querySelector<HTMLElement>("[data-fallback-root]")!;
    expect(fallback.style.getPropertyValue("--canvas-primary")).toBe(SAMPLE_KIT_TOKENS.palette.primary);
    const site = container.querySelector<HTMLElement>("[data-site-root]")!;
    expect(site.style.getPropertyValue("--site-primary")).toBe(SAMPLE_KIT_TOKENS.palette.primary);
  });

  it("render{images} → 문서가 쓰는 이미지에 object URL · 다음 문서에서 빠지면 해제 (K4)", () => {
    const create = vi.fn(() => "blob:null/1");
    const revoke = vi.fn();
    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const id = "11111111-1111-4111-8111-111111111111";
    const hero = sampleDoc().sections[1]!;
    const withImage = { ...sampleDoc(), sections: sampleDoc().sections.map((s) => (s === hero ? { ...s, slots: { ...s.slots, image: { kind: "image", enabled: true, source: id, alt: "가게", decorative: false } } } : s)) };
    render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: withImage, kitTokens: SAMPLE_KIT_TOKENS, images: { [id]: new Blob(["x"]) } });
    expect(create).toHaveBeenCalledTimes(1);
    fromParent({ type: "render", doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS, images: { [id]: new Blob(["x"]) } });
    expect(revoke).toHaveBeenCalledWith("blob:null/1");
  });

  it("킷 링크 누름 → 이동 막음(편집 캔버스) + click{header} · 메뉴 시트 안 앵커면 시트 hidePopover (K1-1 6)", () => {
    const { container } = render(<RenderApp host={window} />);
    fromParent({ type: "render", doc: sampleDoc(), kitTokens: SAMPLE_KIT_TOKENS });
    const sheet = container.querySelector<HTMLElement>("[popover]")!;
    const hide = vi.fn();
    Object.assign(sheet, { hidePopover: hide });
    const link = sheet.querySelector<HTMLAnchorElement>('a[href="#s-s-about"]')!;
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    act(() => void link.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(hide).toHaveBeenCalledTimes(1);
    expect(sent("click")).toEqual([{ type: "click", instanceId: "s-header" }]);
  });
});
