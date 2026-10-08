/**
 * 프로젝트 파일 가져오기 대화상자 (P2-SPEC 4.2 I-S02~I-S08 · AC-P02(쓰기 0) · AC-P08(포커스·재낭독)).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CheckedFile, CheckResult } from "../../features/projectFile/checkFile";
import type { ImportResult } from "../../features/projectFile/writeImport";
import { createLinkNetwork } from "../../data/persistence/fakeTabLink";
import { fileOf, jsonFile, seedFile } from "../../test/projectFileFixtures";
import ImportProjectFileDialog from "./ImportProjectFileDialog";
import ImportProjectFileDialogSlot from "./ImportProjectFileDialogSlot";

const IM2 = "프로젝트 파일이 아닙니다 — 이 앱의 '파일로 내보내기'로 만든 .json 파일을 고르세요";
const IM4 = "파일 내용이 손상되어 가져올 수 없습니다";
const IM9 = "다른 탭에서 편집 중이라 가져오지 못했습니다 — 그 탭을 닫은 뒤 다시 시도하세요";
const IM10 = "가져오지 못했습니다 — 다시 시도하세요";
const IM11 = "브라우저 저장 공간이 부족해 가져오지 못했습니다 — 쓰지 않는 프로젝트를 지운 뒤 다시 시도하세요";
const RELOAD = " 이 화면을 새로 불러옵니다.";

function deferred<T>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

const checkedFile = (over: Partial<CheckedFile> = {}): CheckedFile =>
  ({
    exportedAt: "2026-10-07T03:00:00.000Z",
    project: { projectId: "project-1", profileId: "profile-1", name: "카페 온도", baseReferenceId: "r", revision: 1, createdAt: "", updatedAt: "" },
    series: [],
    doc: { doc: {}, snapshots: [{}, {}] },
    images: [{}],
    size: 3 * 1024 * 1024 - 5,
    ...over,
  }) as unknown as CheckedFile;
const ok = (file = checkedFile()): CheckResult => ({ ok: true, file });
const result = (status: ImportResult["status"], stopped = false): ImportResult => ({ status, stopped });
const FILE = fileOf("{}");

function open(check: () => Promise<CheckResult>, write = vi.fn(async () => result("done"))) {
  const onClose = vi.fn();
  const onPickAgain = vi.fn();
  render(<ImportProjectFileDialog file={FILE} check={check} write={write} onPickAgain={onPickAgain} onClose={onClose} />);
  return { onClose, onPickAgain, write };
}

describe("ImportProjectFileDialog", () => {
  it("I-S02 확인 중 — h2 접근 이름 · '파일을 확인하는 중…' · 버튼 = 취소만(포커스)", () => {
    open(() => new Promise(() => undefined));
    expect(screen.getByRole("dialog", { name: "프로젝트 파일 가져오기" })).toHaveAttribute("open");
    expect(screen.getByText("파일을 확인하는 중…")).toBeInTheDocument();
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual(["취소"]);
    expect(screen.getByRole("button", { name: "취소" })).toHaveFocus();
  });

  it("I-S03 요약 — IM-12 · IM-13 목록 · IM-14 · 포커스 = 가져오기", async () => {
    open(async () => ok());
    expect(await screen.findByText("'카페 온도' 프로젝트를 새 프로젝트로 추가합니다.")).toBeInTheDocument();
    const day = new Date("2026-10-07T03:00:00.000Z");
    const ymd = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
    expect(screen.getAllByRole("listitem").map((li) => li.textContent)).toEqual(["편집 문서 있음", "스냅샷 2개", "이미지 1개", "파일 3.0MB", `${ymd} 내보냄`]);
    expect(screen.getByText("지금 있는 프로젝트는 바뀌지 않습니다. 같은 파일을 다시 가져오면 프로젝트가 하나 더 생깁니다.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "가져오기" })).toHaveFocus();
  });

  it("문서 없음 = '편집 문서 없음' · 스냅샷 0개", async () => {
    open(async () => ok(checkedFile({ doc: null, images: [] })));
    await screen.findByRole("button", { name: "가져오기" });
    expect(screen.getAllByRole("listitem").map((li) => li.textContent).slice(0, 3)).toEqual(["편집 문서 없음", "스냅샷 0개", "이미지 0개"]);
  });

  it.each([
    [1, "파일 1KB"],
    [1024, "파일 1KB"],
    [1025, "파일 2KB"],
    [13_115, "파일 13KB"],
    [1_048_575, "파일 1024KB"],
    [1_048_576, "파일 1.0MB"],
    [1_048_577, "파일 1.1MB"],
    [52_428_800, "파일 50.0MB"],
  ])("IM-13 파일 크기(Jarvis 결정 2) — %iB = '%s'", async (size, label) => {
    open(async () => ok(checkedFile({ size })));
    await screen.findByRole("button", { name: "가져오기" });
    expect(screen.getAllByRole("listitem")[3].textContent).toBe(label);
  });

  it("I-S04 검증 실패 — alert 문장 · 버튼 '다른 파일 고르기'(포커스)·'닫기' · 다시 고르기 = 닫고 onPickAgain", async () => {
    const t = open(async () => ({ ok: false, code: "IM-2", message: IM2 }));
    expect(await screen.findByRole("alert")).toHaveTextContent(IM2);
    expect(screen.queryByText("파일을 확인하는 중…")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다른 파일 고르기" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "다른 파일 고르기" }));
    expect(t.onPickAgain).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("dialog", { hidden: true })).not.toHaveAttribute("open");
    await userEvent.click(screen.getByRole("button", { name: "닫기", hidden: true }));
    expect(t.onClose).toHaveBeenCalledWith(false);
  });

  it("I-S05·I-S06 쓰는 중 '가져오는 중…' aria-disabled · Esc 무시 · 연타 1회 · 실패 alert 시도마다 새 노드 · busy/quota/failed 문장", async () => {
    const pending = deferred<ImportResult>();
    const write = vi.fn().mockReturnValueOnce(pending.promise).mockResolvedValueOnce(result("quota")).mockResolvedValueOnce(result("failed"));
    const t = open(async () => ok(), write);
    const button = await screen.findByRole("button", { name: "가져오기" });
    await userEvent.click(button);
    await userEvent.click(button);
    expect(write).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "가져오는 중…" })).toHaveAttribute("aria-disabled", "true");
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
    expect(t.onClose).not.toHaveBeenCalled();
    await act(async () => pending.resolve(result("busy")));
    const first = screen.getByRole("alert");
    expect(first).toHaveTextContent(IM9);
    await userEvent.click(screen.getByRole("button", { name: "가져오기" }));
    expect(screen.getByRole("alert")).toHaveTextContent(IM11);
    expect(screen.getByRole("alert")).not.toBe(first);
    await userEvent.click(screen.getByRole("button", { name: "가져오기" }));
    expect(screen.getByRole("alert")).toHaveTextContent(IM10);
  });

  it("멈춘 뒤 실패 → 문장 끝 새로고침 안내 · 닫으면 onClose(true)", async () => {
    const t = open(async () => ok(), vi.fn(async () => result("failed", true)));
    await userEvent.click(await screen.findByRole("button", { name: "가져오기" }));
    expect(screen.getByRole("alert")).toHaveTextContent(IM10 + RELOAD);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(t.onClose).toHaveBeenCalledWith(true);
  });

  it("성공 = 새로고침 이동 중 — '가져오는 중…' 유지 · alert 0", async () => {
    open(async () => ok(), vi.fn(async () => result("done")));
    await userEvent.click(await screen.findByRole("button", { name: "가져오기" }));
    expect(screen.getByRole("button", { name: "가져오는 중…" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("I-S08 확인 중 취소 → 닫힘 · onClose(false) · 늦은 확인 결과는 버린다(쓰기 0)", async () => {
    const pending = deferred<CheckResult>();
    const t = open(() => pending.promise);
    await userEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(t.onClose).toHaveBeenCalledWith(false);
    await act(async () => pending.resolve(ok()));
    expect(screen.queryByRole("button", { name: "가져오기", hidden: true })).not.toBeInTheDocument();
    expect(t.write).not.toHaveBeenCalled();
  });
});

describe("ImportProjectFileDialogSlot — AC-P02 거절 = IDB 쓰기 호출 0", () => {
  const deps = () => {
    const factory = { open: vi.fn() } as unknown as IDBFactory & { open: ReturnType<typeof vi.fn> };
    return { locks: undefined, factory, link: createLinkNetwork().tab(), session: { setItem: vi.fn() }, go: vi.fn() };
  };

  it("JSON 아님 → IM-2 · 손상 레코드(계열 비어 있음) → IM-4 · 둘 다 factory.open 0 · 키 0 · 이동 0", async () => {
    for (const [file, text] of [
      [fileOf('{"format":'), IM2],
      [jsonFile(seedFile({ series: [] })), IM4],
    ] as const) {
      const d = deps();
      const view = render(<ImportProjectFileDialogSlot file={file} deps={d} onPickAgain={vi.fn()} onClose={vi.fn()} />);
      expect(await screen.findByRole("alert")).toHaveTextContent(text);
      expect(screen.queryByRole("button", { name: "가져오기" })).not.toBeInTheDocument();
      expect(d.factory.open).not.toHaveBeenCalled();
      expect(d.session.setItem).not.toHaveBeenCalled();
      expect(d.go).not.toHaveBeenCalled();
      view.unmount();
    }
  });
});
