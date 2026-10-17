/**
 * RS6-L4 CP2·CP4 — 버튼 1:1(RS6-AC-U8 · I6 8.2) · 버튼 1개 규칙(UX-5 2.2) · memory "저장 확인" DOM 0(U9) · 연타 1회(CE-4).
 */
import { fireEvent, render, screen } from "@testing-library/react";
import type { SaveCore } from "../../features/studio/save/saveCore";
import { describe, expect, it, vi } from "vitest";
import type { AutosaveState } from "../../features/studio/useAutosaveScheduler";
import { SaveStatus } from "./SaveStatus";

const failed = { phase: "failed", failure: "error" } as AutosaveState;
const fakeCore = (link = vi.fn()) => ({ link, save: vi.fn(), discard: vi.fn() }) as unknown as SaveCore;

describe("RS6-L4 SaveStatus 버튼", () => {
  it("readonly = '저장 확인' 1개 · 연타 = confirm(core.link) 1회 · aria-busy·aria-disabled(disabled 아님)", async () => {
    let finish: (value: unknown) => void = () => {};
    const link = vi.fn(() => new Promise((done) => (finish = done)));
    render(<SaveStatus state={failed} persistence="local" source={{ reason: "readonly" }} onRetry={vi.fn()} actions={{ core: fakeCore(link), report: vi.fn() }} />);
    const button = await screen.findByRole("button", { name: "저장 확인" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(link).toHaveBeenCalledTimes(1);
    expect(button.getAttribute("aria-busy")).toBe("true");
    expect(button.getAttribute("aria-disabled")).toBe("true");
    expect(button).not.toBeDisabled();
    expect(screen.queryByRole("button", { name: "다시 저장" })).toBeNull();
    finish(undefined);
  });

  it.each(["stale", "cleared"])("%s = '버리고 새로고침' 1개 · '다시 저장' 0", async (reason) => {
    render(<SaveStatus state={failed} persistence="local" source={{ reason }} onRetry={vi.fn()} actions={{ core: fakeCore(), report: vi.fn() }} />);
    expect(await screen.findByRole("button", { name: "버리고 새로고침" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다시 저장" })).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("readonly + 저장 전 변경 = '저장 확인' 숨김(MQ-5-3 A)", async () => {
    render(<SaveStatus state={failed} persistence="local" source={{ reason: "readonly", dirty: true }} onRetry={vi.fn()} actions={{ core: fakeCore(), report: vi.fn() }} />);
    await import("./SaveActions");
    await new Promise((done) => setTimeout(done, 0));
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("memory = '저장 확인' DOM 0 · '브라우저에 저장됨' 0 (U9)", async () => {
    render(<SaveStatus state={failed} persistence="memory" source={{ reason: "readonly" }} onRetry={vi.fn()} actions={{ core: fakeCore(), report: vi.fn() }} />);
    await import("./SaveActions");
    await new Promise((done) => setTimeout(done, 0));
    expect(screen.queryByRole("button", { name: "저장 확인" })).toBeNull();
    render(<SaveStatus state={{ phase: "saved", lastSavedAt: 0 } as AutosaveState} persistence="memory" onRetry={vi.fn()} now={() => 0} />);
    expect(document.body.textContent).not.toContain("브라우저에 저장됨");
  });

  it("failed(그 밖 reason) = '다시 저장' → retry 1회", () => {
    const onRetry = vi.fn();
    render(<SaveStatus state={failed} persistence="local" source={{ reason: "not-committed" }} onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "다시 저장" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
