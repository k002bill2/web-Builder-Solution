import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConflictCallout } from "./ConflictCallout";

describe("ConflictCallout (E-S09 · E-AC-10)", () => {
  it("제목(최신 revision) · 문장 · 두 버튼 · 정적 영역(role 없음 — alert는 SaveStatus 1곳)", async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn();
    const { container } = render(<ConflictCallout latestRevision={12} onChoose={onChoose} />);
    expect(screen.getByRole("heading", { name: "다른 곳에서 이 문서가 바뀌었습니다(r12)" })).toBeInTheDocument();
    expect(screen.getByText("내 편집은 그대로 두었습니다")).toBeInTheDocument();
    expect(container.querySelector("[role=alert],[role=status],[aria-live]")).toBeNull();
    expect(container.querySelector("[data-tone=warning]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "내 편집으로 저장" }));
    await user.click(screen.getByRole("button", { name: "다른 편집 불러오기" }));
    expect(onChoose.mock.calls).toEqual([["mine"], ["theirs"]]);
  });

  it("최신 revision을 모르면 revision 표기 없이 · busy면 두 버튼 비활성", () => {
    render(<ConflictCallout busy onChoose={() => undefined} />);
    expect(screen.getByRole("heading", { name: "다른 곳에서 이 문서가 바뀌었습니다" })).toBeInTheDocument();
    for (const name of ["내 편집으로 저장", "다른 편집 불러오기"]) expect(screen.getByRole("button", { name })).toBeDisabled();
  });
});
