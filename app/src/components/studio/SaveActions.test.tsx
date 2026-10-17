/**
 * RS6-L4 CP2 — 환경 reason 버튼 ↔ 코어 메서드 1:1(I6 8.2) · reject → 결과 매핑(거짓 확인 0) · 폐기 대화상자 포커스(I6 8.4 · UX5-AC-04·06).
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ConfirmResult, CoreIo, DiscardResult, SaveCore } from "../../features/studio/save/saveCore";
import { DISCARD_TIMEOUT_TEXT } from "../../features/studio/saveStatusText";
import { DISCARD_TIMEOUT_ALERT } from "../../features/studio/save/alertKeys";
import SaveActions from "./SaveActions";

const text = (reason: string) => `문구:${reason}`;
/** core.link = io(confirm·text)를 넘겨 run 1회 */
const confirmCore = (confirm: () => Promise<ConfirmResult>) =>
  ({ link: vi.fn((run: (io: CoreIo, s: unknown, link: unknown) => unknown) => Promise.resolve(run({ confirm, text } as unknown as CoreIo, {}, {}))), save: vi.fn(), discard: vi.fn() }) as unknown as SaveCore;

describe("RS6-L4 CP2 · 저장 확인(confirm 1:1)", () => {
  it.each<[string, () => Promise<ConfirmResult>, unknown]>([
    ["confirmed → report() = reason 지움", async () => ({ status: "confirmed", wrote: true, receipt: {} as never }), undefined],
    ["failed{readonly} → report(readonly + 문구)", async () => ({ status: "failed", reason: "readonly" }), { reason: "readonly", text: "문구:readonly" }],
    ["newer → report(newer)", async () => ({ status: "newer", receipt: {} as never }), { reason: "newer", text: "문구:newer" }],
    ["confirm reject → report(unavailable) — 거짓 확인 0", () => Promise.reject(new Error("boom")), { reason: "unavailable", text: "문구:unavailable" }],
  ])("%s", async (_, confirm, expected) => {
    const report = vi.fn();
    render(<SaveActions core={confirmCore(confirm)} reason="readonly" persistence="local" report={report} />);
    fireEvent.click(screen.getByRole("button", { name: "저장 확인" }));
    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenCalledWith(expected);
  });

  it("core.link 자체 reject → report(unavailable) · 버튼 busy 풀림", async () => {
    const report = vi.fn();
    const core = { link: vi.fn(() => Promise.reject(new Error("chunk"))), save: vi.fn(), discard: vi.fn() } as unknown as SaveCore;
    render(<SaveActions core={core} reason="readonly" persistence="local" report={report} />);
    const button = screen.getByRole("button", { name: "저장 확인" });
    fireEvent.click(button);
    await waitFor(() => expect(report).toHaveBeenCalledWith({ reason: "unavailable" }));
    expect(button).not.toHaveAttribute("aria-busy");
  });
});

describe("RS6-L4 CP2 · 버리고 새로고침(discard 1:1 · 폐기 확인)", () => {
  const discardCore = (discard: () => Promise<DiscardResult>) => ({ link: vi.fn(), save: vi.fn(), discard: vi.fn(discard) }) as unknown as SaveCore;
  const open = (core: SaveCore, reload = vi.fn()) => {
    render(<SaveActions core={core} reason="stale" persistence="local" report={vi.fn()} reload={reload} />);
    fireEvent.click(screen.getByRole("button", { name: "버리고 새로고침" }));
    return reload;
  };

  it("열면 alertdialog · 첫 포커스 '취소' · Esc = 닫힘 + 연 버튼으로 포커스 복귀 · discard 0", () => {
    const core = discardCore(vi.fn());
    open(core);
    const dialog = screen.getByRole("alertdialog", { name: "확인되지 않은 변경 버리기" });
    expect(dialog).toHaveAccessibleDescription(/사라집니다/);
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(screen.getByRole("button", { name: "버리고 새로고침" })).toHaveFocus();
    expect(core.discard).not.toHaveBeenCalled();
  });

  it("'버리기' 연타 = discard 1회 · discarded → reload", async () => {
    let finish: (r: DiscardResult) => void = () => {};
    const core = discardCore(() => new Promise((done) => (finish = done)));
    const reload = open(core);
    const run = screen.getByRole("button", { name: "버리기" });
    fireEvent.click(run);
    fireEvent.click(run);
    expect(core.discard).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "버리는 중…" })).toHaveAttribute("aria-busy", "true");
    await act(async () => finish({ status: "discarded", restored: {} as never }));
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("blocked{stale} = 코어가 막음 → reload가 초안을 버린다(I6 8.2)", async () => {
    const reload = open(discardCore(async () => ({ status: "blocked", reason: "stale" })));
    fireEvent.click(screen.getByRole("button", { name: "버리기" }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
  });

  it("blocked{timeout} → alert(DISCARD_TIMEOUT_ALERT 키 · 문구) · 포커스 '취소' · reload 0", async () => {
    const reload = open(discardCore(async () => ({ status: "blocked", reason: "timeout" })));
    fireEvent.click(screen.getByRole("button", { name: "버리기" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(DISCARD_TIMEOUT_TEXT);
    expect(alert).toHaveAttribute("data-alert-key", DISCARD_TIMEOUT_ALERT);
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    expect(reload).not.toHaveBeenCalled();
  });

  it("discard reject → '버리지 못했습니다' alert · reload 0(거짓 폐기 0)", async () => {
    const reload = open(discardCore(() => Promise.reject(new Error("io"))));
    fireEvent.click(screen.getByRole("button", { name: "버리기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("버리지 못했습니다 — 다시 시도해 주세요");
    expect(reload).not.toHaveBeenCalled();
  });
});
