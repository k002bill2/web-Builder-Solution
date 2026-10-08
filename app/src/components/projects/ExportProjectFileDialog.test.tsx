/**
 * 프로젝트 파일 내보내기 대화상자 (P2-SPEC 4.1 X-S01~X-S06 · 5절 EX 문구 · AC-P08(내보내기)).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EXPORT_TOO_LARGE } from "../../features/projectFile/format";
import ExportProjectFileDialog, { type MakeResult } from "./ExportProjectFileDialog";

const MB = 1024 * 1024;
const EX6 = "저장된 데이터를 읽지 못해 파일을 만들지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다";
const EX7 = "이 프로젝트를 찾지 못했습니다 — 다른 탭에서 지웠을 수 있습니다. 새로고침하세요";
const EX10 = "파일을 만들지 못했습니다 — 다시 시도하세요";

function deferred() {
  let resolve!: (r: MakeResult) => void;
  const promise = new Promise<MakeResult>((r) => (resolve = r));
  return { promise, resolve };
}
const blobOf = (size: number) => ({ size }) as Blob;

function renderDialog(over: { make?: () => Promise<MakeResult>; hasDoc?: boolean } = {}) {
  const save = vi.fn();
  const onClose = vi.fn();
  const make = vi.fn(over.make ?? (async (): Promise<MakeResult> => ({ status: "ok", blob: blobOf(10) })));
  render(<ExportProjectFileDialog name="카페 온도" hasDoc={over.hasDoc ?? true} make={make} save={save} onClose={onClose} />);
  const dialog = screen.getByRole("dialog", { name: "'카페 온도' 프로젝트를 파일로 내보낼까요?" }) as HTMLDialogElement;
  return { dialog, save, onClose, make };
}

describe("ExportProjectFileDialog", () => {
  it("X-S01 문구 · h2 접근 이름 · EX-3 목록 · EX-4·EX-5 캡션 · 열 때 포커스 = 파일 만들기", () => {
    const { dialog } = renderDialog();
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("이 프로젝트를 다른 브라우저나 기기에서 가져올 수 있는 파일 1개로 내려받습니다.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["편집 문서와 스냅샷", "문서에 넣은 이미지", "확정한 프로필(모든 버전)"]);
    expect(
      screen.getByText("마지막으로 저장된 내용이 들어갑니다. 비교 보드·보관함·만든 3안은 들어가지 않습니다 — 3안은 가져온 뒤 프로필 화면에서 다시 만들 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("파일에 이미지와 문구가 그대로 들어 있습니다 — 공유할 때 주의하세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "파일 만들기" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("실제 브라우저처럼 showModal()이 첫 포커스 대상(취소)으로 옮겨도 열린 뒤 포커스 = 파일 만들기 (Ego Lite 실측 회귀)", () => {
    const original = HTMLDialogElement.prototype.showModal;
    const spy = vi.spyOn(HTMLDialogElement.prototype, "showModal").mockImplementation(function (this: HTMLDialogElement) {
      original.call(this);
      this.querySelector<HTMLButtonElement>("button")?.focus();
    });
    try {
      renderDialog();
      expect(screen.getByRole("button", { name: "파일 만들기" })).toHaveFocus();
    } finally {
      spy.mockRestore();
    }
  });

  it("문서 없음 = '편집 문서와 스냅샷' 줄 생략", () => {
    renderDialog({ hasDoc: false });
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["문서에 넣은 이미지", "확정한 프로필(모든 버전)"]);
  });

  it("X-S06 Esc(cancel)·취소 = close() 먼저 → onClose(false) · 만들기 0", async () => {
    const first = renderDialog();
    const closedAtCall: boolean[] = [];
    first.onClose.mockImplementation(() => closedAtCall.push(!first.dialog.open));
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(first.dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(first.onClose).toHaveBeenCalledWith(false);
    expect(closedAtCall).toEqual([true]);
    expect(first.make).not.toHaveBeenCalled();
  });

  it("취소 버튼 = onClose(false)", async () => {
    const { onClose, dialog } = renderDialog();
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledWith(false);
    expect(dialog.open).toBe(false);
  });

  it("X-S02 만드는 중: '만드는 중…' aria-disabled · 연타 1회 · Esc 무시", async () => {
    const pending = deferred();
    const { dialog, make, onClose, save } = renderDialog({ make: () => pending.promise });
    await userEvent.click(screen.getByRole("button", { name: "파일 만들기" }));
    const busy = screen.getByRole("button", { name: "만드는 중…" });
    expect(busy).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(busy);
    expect(make).toHaveBeenCalledTimes(1);
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(onClose).not.toHaveBeenCalled();
    expect(dialog.open).toBe(true);
    pending.resolve({ status: "ok", blob: blobOf(1) });
    await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("X-S04 성공(50MB 미만) = 내려받기 → close() 먼저 → onClose(true)", async () => {
    const blob = blobOf(50 * MB - 1);
    const { dialog, save, onClose } = renderDialog({ make: async () => ({ status: "ok", blob }) });
    const order: string[] = [];
    save.mockImplementation(() => order.push(`save:${dialog.open}`));
    onClose.mockImplementation(() => order.push(`close:${dialog.open}`));
    await userEvent.click(screen.getByRole("button", { name: "파일 만들기" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledWith(true));
    expect(save).toHaveBeenCalledWith(blob);
    expect(order).toEqual(["save:true", "close:false"]);
  });

  it("X-S03 50MB 이상 = EX-8 캡션 + '내려받기'(포커스) · 누르면 내려받기 → onClose(true) · 취소면 내려받기 0", async () => {
    const blob = blobOf(50 * MB + 1);
    const first = renderDialog({ make: async () => ({ status: "ok", blob }) });
    await userEvent.click(screen.getByRole("button", { name: "파일 만들기" }));
    expect(await screen.findByText("파일이 51MB입니다 — 메일이나 메신저로 보내기 어려울 수 있습니다.")).toBeInTheDocument();
    const download = screen.getByRole("button", { name: "내려받기" });
    expect(download).toHaveFocus();
    expect(first.save).not.toHaveBeenCalled();
    await userEvent.click(download);
    expect(first.save).toHaveBeenCalledWith(blob);
    expect(first.onClose).toHaveBeenCalledWith(true);
  });

  it("X-S03 취소 = onClose(false) · 내려받기 0", async () => {
    const { save, onClose } = renderDialog({ make: async () => ({ status: "ok", blob: blobOf(50 * MB) }) });
    await userEvent.click(screen.getByRole("button", { name: "파일 만들기" }));
    await screen.findByRole("button", { name: "내려받기" });
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledWith(false);
    expect(save).not.toHaveBeenCalled();
  });

  it.each([
    ["unreadable", EX6],
    ["gone", EX7],
    ["failed", EX10],
    ["too-large", EXPORT_TOO_LARGE],
  ] as const)("X-S05 %s → 대화상자 유지 · role=alert 문장 · 버튼 복귀 · 내려받기 0", async (status, text) => {
    const { dialog, save, onClose } = renderDialog({ make: async () => ({ status }) });
    await userEvent.click(screen.getByRole("button", { name: "파일 만들기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(text);
    expect(dialog.open).toBe(true);
    expect(screen.getByRole("button", { name: "파일 만들기" })).not.toHaveAttribute("aria-disabled");
    expect(save).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("X-S05 같은 실패 재시도 = alert 노드를 새로 만든다(key 패턴 — 다시 낭독)", async () => {
    renderDialog({ make: async () => ({ status: "failed" }) });
    await userEvent.click(screen.getByRole("button", { name: "파일 만들기" }));
    const first = await screen.findByRole("alert");
    await userEvent.click(screen.getByRole("button", { name: "파일 만들기" }));
    await waitFor(() => expect(screen.getByRole("alert")).not.toBe(first));
    expect(screen.getByRole("alert")).toHaveTextContent(EX10);
  });
});
