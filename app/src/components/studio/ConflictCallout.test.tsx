import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConflictCallout } from "./ConflictCallout";

describe("ConflictCallout (E-S09 · E-AC-10)", () => {
  it("제목(최신 revision) · 문장 · 두 버튼 · 정적 영역(role 없음 — alert는 SaveStatus 1곳)", async () => {
    const user = userEvent.setup();
    const onChoose = vi.fn(() => Promise.resolve());
    const heading = { current: null };
    const { container } = render(<ConflictCallout latestRevision={12} resolve={onChoose} heading={heading} onNotice={vi.fn()} refresh={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "다른 곳에서 이 문서가 바뀌었습니다(r12)" })).toBeInTheDocument();
    expect(screen.getByText("내 편집은 그대로 두었습니다. 고르기 전에는 저장하지 않습니다.")).toBeInTheDocument();
    expect(container.querySelector("[role=alert],[role=status],[aria-live]")).toBeNull();
    expect(container.querySelector("[data-tone=warning]")).not.toBeNull();
    await user.click(screen.getByRole("button", { name: "내 편집으로 저장" }));
    await screen.findByRole("button", { name: "다른 편집 불러오기", busy: false });
    await user.click(screen.getByRole("button", { name: "다른 편집 불러오기" }));
    expect(onChoose.mock.calls).toEqual([["mine"], ["theirs"]]);
  });

  it("최신 revision을 모르면 revision 표기 없이 · 진행 중이면 두 버튼 aria-disabled(포커스 유지 — UX5-AC-07)", async () => {
    const user = userEvent.setup();
    render(<ConflictCallout resolve={() => new Promise(() => undefined)} heading={{ current: null }} onNotice={vi.fn()} refresh={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "다른 곳에서 이 문서가 바뀌었습니다" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "내 편집으로 저장" }));
    for (const name of ["내 편집으로 저장", "다른 편집 불러오기"]) expect(screen.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
  });

  it("성공 = 편집기 제목으로 포커스 + 결과 알림 1문장 · refresh 1회 / 실패 = 누른 버튼 포커스 유지 + 실패 알림(UX5-AC-05)", async () => {
    const user = userEvent.setup();
    const h = document.createElement("h1");
    h.tabIndex = -1;
    document.body.append(h);
    const onNotice = vi.fn();
    const refresh = vi.fn();
    const resolve = vi.fn().mockRejectedValueOnce(new Error("no")).mockResolvedValueOnce(undefined);
    render(<ConflictCallout resolve={resolve} heading={{ current: h }} onNotice={onNotice} refresh={refresh} />);
    const mine = screen.getByRole("button", { name: "내 편집으로 저장" });
    expect(mine).toHaveAccessibleDescription("바뀐 문서는 스냅샷 '충돌 보존'으로 남기고 내 초안으로 덮어씁니다");
    await user.click(mine);
    await screen.findByRole("button", { name: "내 편집으로 저장", busy: false });
    expect(mine).toHaveFocus();
    expect(onNotice).toHaveBeenLastCalledWith("충돌을 해결하지 못했습니다 — 다시 골라 주세요");
    expect(refresh).not.toHaveBeenCalled();
    await user.click(mine);
    await vi.waitFor(() => expect(h).toHaveFocus());
    expect(onNotice).toHaveBeenLastCalledWith("내 초안으로 저장했습니다 — 바뀐 문서는 스냅샷 '충돌 보존'에 남겼습니다");
    expect(refresh).toHaveBeenCalledTimes(1);
    h.remove();
  });
});
