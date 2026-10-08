/**
 * 프로젝트 삭제 확인 대화상자 (P1D-SPEC 1.3 J-S13~J-S15 · 1.6 · AC-D06(프로젝트) · D08 UI).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DeleteProjectDialog from "./DeleteProjectDialog";
import type { DeleteResult } from "../../features/projects/deleteProject";

const BUSY = "다른 탭에서 편집 중이라 지우지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요";
const FAIL = "지우지 못했습니다 — 다시 시도하세요";
const UNREADABLE = "저장된 데이터를 읽지 못해 지우지 못했습니다 — '이 브라우저 데이터 지우기'로 비울 수 있습니다";
const RELOAD = " 이 화면을 새로 불러옵니다.";

function deferred() {
  let resolve!: (r: DeleteResult) => void;
  const promise = new Promise<DeleteResult>((r) => (resolve = r));
  return { promise, resolve };
}

const result = (status: DeleteResult["status"], stopped = false): DeleteResult => ({ status, stopped });

describe("DeleteProjectDialog", () => {
  it("J-S13 문구 · h2 접근 이름 · 목록 3줄 · 캡션 + FX-1 백업 문장 · 열 때 포커스 = 취소", () => {
    render(<DeleteProjectDialog name="카페 온도" hasDoc remove={vi.fn()} onClose={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "'카페 온도' 프로젝트를 지울까요?" });
    expect(dialog).toHaveAttribute("open");
    expect(screen.getByText("이 브라우저에서 아래 항목을 함께 지웁니다. 되돌릴 수 없습니다.")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["편집 문서와 스냅샷", "문서에 넣은 이미지", "확정한 프로필(모든 버전)과 만든 3안"]);
    expect(
      screen.getByText("다른 프로젝트와 내려받은 파일은 그대로 남습니다. 지운 뒤 이 화면을 새로 불러오므로 비교 보드와 보관함도 비워집니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("지우기 전에 각 프로젝트의 '파일로 내보내기'로 백업할 수 있습니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
    expect(screen.getByRole("button", { name: "프로젝트 지우기" })).toBeInTheDocument();
  });

  it("문서 없음 = '편집 문서와 스냅샷' 줄 생략", () => {
    render(<DeleteProjectDialog name="가" hasDoc={false} remove={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["문서에 넣은 이미지", "확정한 프로필(모든 버전)과 만든 3안"]);
  });

  it("Esc(cancel)·취소 = close() 먼저 → onClose(false) · 지우기 0", async () => {
    const remove = vi.fn();
    const onClose = vi.fn();
    const first = render(<DeleteProjectDialog name="가" hasDoc remove={remove} onClose={onClose} />);
    const dialog = screen.getByRole("dialog") as HTMLDialogElement;
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(dialog, cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledWith(false);
    expect(dialog.open).toBe(false);
    first.unmount();
    render(<DeleteProjectDialog name="가" hasDoc remove={remove} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect((screen.getByRole("dialog", { hidden: true }) as HTMLDialogElement).open).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it("J-S14 진행 중: '지우는 중…' aria-disabled · 연타 1회 · Esc 무시 · 성공은 라벨 유지(새로고침 이동 중)", async () => {
    const pending = deferred();
    const remove = vi.fn(() => pending.promise);
    const onClose = vi.fn();
    render(<DeleteProjectDialog name="가" hasDoc remove={remove} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 지우기" }));
    const busy = screen.getByRole("button", { name: "지우는 중…" });
    expect(busy).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(busy);
    expect(remove).toHaveBeenCalledTimes(1);
    const cancel = new Event("cancel", { cancelable: true });
    fireEvent(screen.getByRole("dialog"), cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => pending.resolve(result("done")));
    expect(screen.getByRole("button", { name: "지우는 중…" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("J-S15 busy·unreadable·failed = 대화상자 안 alert(시도마다 1개) + 버튼 복귀", async () => {
    const remove = vi
      .fn<() => Promise<DeleteResult>>()
      .mockResolvedValueOnce(result("busy"))
      .mockResolvedValueOnce(result("unreadable"))
      .mockResolvedValueOnce(result("failed"));
    render(<DeleteProjectDialog name="가" hasDoc remove={remove} onClose={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 지우기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(BUSY);
    const again = screen.getByRole("button", { name: "프로젝트 지우기" });
    expect(again).not.toHaveAttribute("aria-disabled");
    await userEvent.click(again);
    expect(await screen.findByRole("alert")).toHaveTextContent(UNREADABLE);
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 지우기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(FAIL);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("멈춘 뒤 실패(쓰기 탭) = 문장 끝 ' 이 화면을 새로 불러옵니다.' · 닫으면 onClose(true)(새로고침)", async () => {
    const remove = vi.fn<() => Promise<DeleteResult>>().mockResolvedValueOnce(result("failed", true));
    const onClose = vi.fn();
    render(<DeleteProjectDialog name="가" hasDoc remove={remove} onClose={onClose} />);
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 지우기" }));
    expect((await screen.findByRole("alert")).textContent).toBe(FAIL + RELOAD);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledWith(true);
  });
});
