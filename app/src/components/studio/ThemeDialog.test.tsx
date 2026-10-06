import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { FAIL, PASS, themeSeries } from "../../features/studio/testing/themeSeries";
import ThemeDialog from "./ThemeDialog";

/** ER-AC-T2 (EDITOR-REST SPEC r1 3.1 · 7절) — 테마 바꾸기 대화상자: 버전 줄 · 대비 결과 글자 · 현재 버전 비활성 · 포커스 · Esc */
const SERIES = themeSeries([{ palette: FAIL }, { palette: PASS }, { palette: PASS, adjustments: { contrast: "enhanced" } }]);

function open(initial = 2) {
  const onApply = vi.fn();
  const onCancel = vi.fn();
  render(<ThemeDialog doc={sampleDoc({ profileVersion: 2 })} series={SERIES} initial={initial} onApply={onApply} onCancel={onCancel} />);
  return { dialog: within(screen.getByRole("dialog", { name: "테마 바꾸기" })), onApply, onCancel };
}

describe("ThemeDialog — ER-AC-T2", () => {
  it("버전 줄 = 최신 먼저 · 조정 요약 · 대비 결과 글자 · 현재 버전 표시 · 열 때 포커스 = 선택 라디오", () => {
    const { dialog } = open();
    const radios = dialog.getAllByRole("radio");
    expect(radios.map((r) => r.getAttribute("value"))).toEqual(["3", "2", "1"]);
    expect(dialog.getByRole("radio", { name: "v3 · 조정: 대비 강화 · 대비 통과" })).toBeInTheDocument();
    expect(dialog.getByRole("radio", { name: "v2 · 조정 없음 · 대비 통과 · 지금 쓰는 테마" })).toHaveFocus();
    expect(dialog.getByRole("radio", { name: /^v1 · 조정 없음 · 대비 미달 \d+$/ })).toBeInTheDocument();
  });

  it("현재 버전을 고르면 '바꾸기' aria-disabled + 이유(누르면 0) · 다른 버전 → onApply(그 버전)", () => {
    const { dialog, onApply } = open();
    const apply = dialog.getByRole("button", { name: "바꾸기" });
    expect(apply).toHaveAttribute("aria-disabled", "true");
    expect(apply).toHaveAccessibleDescription("지금 쓰는 테마입니다");
    act(() => void fireEvent.click(apply));
    expect(onApply).not.toHaveBeenCalled();
    act(() => void fireEvent.click(dialog.getByRole("radio", { name: /^v3/ })));
    expect(apply).not.toHaveAttribute("aria-disabled");
    act(() => void fireEvent.click(apply));
    expect(onApply).toHaveBeenCalledWith(3);
  });

  it("미리 고른 버전(대비 줄에서 연 경우) = 그 라디오 선택·포커스 · Esc = 취소", () => {
    const { dialog, onCancel } = open(3);
    expect(dialog.getByRole("radio", { name: /^v3/ })).toBeChecked();
    expect(dialog.getByRole("radio", { name: /^v3/ })).toHaveFocus();
    act(() => void fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true })));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
