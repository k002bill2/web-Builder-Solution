import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import type { ThemeApplyDeps } from "../../features/studio/themeText";
import { FAIL, PASS, themeSeries } from "../../features/studio/testing/themeSeries";
import ThemeDialog from "./ThemeDialog";

/** ER-AC-T2 (EDITOR-REST SPEC r1 3.1 · 7절) — 테마 바꾸기 대화상자: 버전 줄 · 대비 결과 글자 · 현재 버전 비활성 · 포커스 · Esc */
const SERIES = themeSeries([{ palette: FAIL }, { palette: PASS }, { palette: PASS, adjustments: { contrast: "enhanced" } }]);

async function open(pickPass = false) {
  const doc = sampleDoc({ profileVersion: 2 });
  const run = vi.fn<ThemeApplyDeps["run"]>(async (op) => ({
    ok: true,
    before: doc,
    result: { doc: { ...doc, profileVersion: op.kind === "theme" ? op.profileVersion : 0 }, instanceId: "", index: -1, lostSlotKeys: [], values: { compared: 5, changed: [] } },
  }));
  const deps = { run, series: SERIES, sectionName: (s: { type: string }) => s.type, onNotice: vi.fn(), onUndoable: vi.fn() };
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <ThemeDialog doc={doc} profileId="profile-1" pickPass={pickPass} deps={deps} onClose={onClose} />
    </MemoryRouter>,
  );
  const dialog = within(screen.getByRole("dialog", { name: "테마 바꾸기" }));
  await dialog.findAllByRole("radio");
  return { dialog, deps, onClose };
}

describe("ThemeDialog — ER-AC-T2", () => {
  it("버전 줄 = 최신 먼저 · 조정 요약 · 대비 결과 글자 · 현재 버전 표시 · 열 때 포커스 = 선택 라디오", async () => {
    const { dialog } = await open();
    expect(dialog.getAllByRole("radio").map((r) => r.getAttribute("value"))).toEqual(["3", "2", "1"]);
    expect(dialog.getByRole("radio", { name: "v3 · 조정: 대비 강화 · 대비 통과" })).toBeInTheDocument();
    expect(dialog.getByRole("radio", { name: "v2 · 조정 없음 · 대비 통과 · 지금 쓰는 테마" })).toHaveFocus();
    expect(dialog.getByRole("radio", { name: /^v1 · 조정 없음 · 대비 미달 \d+$/ })).toBeInTheDocument();
  });

  it("현재 버전을 고르면 '바꾸기' aria-disabled + 이유(누르면 0) · 다른 버전 → 닫고 theme 연산 1회(기록 스택·되돌리기 대상)", async () => {
    const { dialog, deps, onClose } = await open();
    const apply = dialog.getByRole("button", { name: "바꾸기" });
    expect(apply).toHaveAttribute("aria-disabled", "true");
    expect(apply).toHaveAccessibleDescription("지금 쓰는 테마입니다");
    act(() => void fireEvent.click(apply));
    expect(deps.run).not.toHaveBeenCalled();
    act(() => void fireEvent.click(dialog.getByRole("radio", { name: /^v3/ })));
    expect(apply).not.toHaveAttribute("aria-disabled");
    await act(async () => void fireEvent.click(apply));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(true);
    expect(deps.run).toHaveBeenCalledWith({ kind: "theme", profileVersion: 3 }, "테마 바꾸기", true);
    expect(deps.onNotice).toHaveBeenCalledWith("테마를 프로필 v3으로 바꿨습니다 · 슬롯 값 5개 모두 그대로입니다");
    expect(deps.onUndoable).toHaveBeenCalledWith(expect.objectContaining({ text: "테마를 프로필 v2로 되돌렸습니다" }));
  });

  it("대비 줄에서 염(pickPass) = 대비 통과 최신 버전 선택·포커스 · Esc = 닫기", async () => {
    const { dialog, onClose } = await open(true);
    expect(dialog.getByRole("radio", { name: /^v3/ })).toBeChecked();
    expect(dialog.getByRole("radio", { name: /^v3/ })).toHaveFocus();
    act(() => void fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true })));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(false);
  });
});
