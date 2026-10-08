/**
 * "이 브라우저 데이터 지우기" 대화상자 (P1C-SPEC 1.6 · AC-C08) — 문구 · 열 때 포커스 "취소" · Esc 취소 · 진행 중 aria-disabled·Esc 무시 · 실패 alert.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import ClearDataDialog from "./ClearDataDialog";
import type { ClearResult } from "../../features/projects/clearBrowserData";

const BUSY_TEXT = "다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요";
const FAIL_TEXT = "지우지 못했습니다 — 다시 시도하세요";

function deferred() {
  let resolve!: (r: ClearResult) => void;
  const promise = new Promise<ClearResult>((r) => (resolve = r));
  return { promise, resolve };
}

describe("ClearDataDialog", () => {
  it("SPEC 1.6 문구 · h2 접근 이름 · 열 때 포커스 = 취소 · P2 백업 문장 숨김", () => {
    render(<ClearDataDialog count={3} clear={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "이 브라우저 데이터를 지울까요?" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("이 브라우저에 저장된 아래 항목을 모두 지웁니다. 되돌릴 수 없습니다.")).toBeInTheDocument();
    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items).toEqual(["프로젝트 3개와 각 편집 문서", "스냅샷", "문서에 넣은 이미지", "확정한 프로필(모든 버전)과 만든 3안"]);
    expect(screen.getByText("비교 보드와 보관함은 따로 저장하지 않아 지운 뒤 함께 비워집니다. 내려받은 파일은 그대로 남습니다.")).toBeInTheDocument();
    expect(screen.queryByText(/백업할 수 있습니다/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "모두 지우기" })).toBeInTheDocument();
  });

  it("프로젝트 0개 = 목록 첫 항목 '프로젝트'", () => {
    render(<ClearDataDialog count={0} clear={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getAllByRole("listitem")[0]).toHaveTextContent(/^프로젝트$/);
  });

  it("Esc(cancel) = 취소로 닫힘 · 취소 버튼도 닫힘 · 지우기 0", async () => {
    const clear = vi.fn();
    const onClose = vi.fn();
    const first = render(<ClearDataDialog count={1} clear={clear} onClose={onClose} />);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onClose).toHaveBeenCalledTimes(1);
    // 여는 쪽이 언마운트하기 전에 modal을 먼저 닫는다(여는 버튼 포커스 복귀 — Codex r1)
    expect(dialog.open).toBe(false);
    first.unmount();
    render(<ClearDataDialog count={1} clear={clear} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect((screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement).open).toBe(false);
    expect(clear).not.toHaveBeenCalled();
  });

  it("진행 중: '지우는 중…' aria-disabled · 다시 눌러도 1회 · Esc 무시", async () => {
    const pending = deferred();
    const clear = vi.fn(() => pending.promise);
    const onClose = vi.fn();
    render(<ClearDataDialog count={1} clear={clear} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "모두 지우기" }));
    const busy = screen.getByRole("button", { name: "지우는 중…" });
    expect(busy).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(busy);
    expect(clear).toHaveBeenCalledTimes(1);
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => pending.resolve("done"));
    // 성공 = 새로고침 이동 중 — 라벨 유지
    expect(screen.getByRole("button", { name: "지우는 중…" })).toBeInTheDocument();
  });

  it("busy = 대화상자 안 alert(SPEC 문장) + 버튼 복귀(재시도) · failed = 실패 문장", async () => {
    const clear = vi.fn<() => Promise<ClearResult>>().mockResolvedValueOnce("busy").mockResolvedValueOnce("failed");
    render(<ClearDataDialog count={1} clear={clear} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "모두 지우기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(BUSY_TEXT);
    const again = screen.getByRole("button", { name: "모두 지우기" });
    expect(again).not.toHaveAttribute("aria-disabled");
    await userEvent.click(again);
    expect(await screen.findByRole("alert")).toHaveTextContent(FAIL_TEXT);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
