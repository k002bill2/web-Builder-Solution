import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** K3 위로·아래로 (E-AC-17 · SPEC 5.2 · 6.4) */
afterEach(restoreViewport);

const sections = () => within(screen.getByRole("navigation", { name: "섹션" }));
const rowNames = () =>
  within(screen.getByRole("navigation", { name: "섹션" }).querySelector("ol")!)
    .getAllByRole("button")
    .filter((b) => b.hasAttribute("data-row-id"))
    .map((b) => b.getAttribute("data-row-id"));
const pick = (name: string) => act(() => void fireEvent.click(sections().getByRole("button", { name: new RegExp(`^${name}`) })));
const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));
const notice = () => screen.getByRole("status", { name: "편집 알림" });

/** 비활성 = aria-disabled + 보이는 이유(aria-describedby) */
function expectBlocked(button: HTMLElement, reason: string) {
  expect(button).toHaveAttribute("aria-disabled", "true");
  expect(button).toHaveAccessibleDescription(reason);
  expect(screen.getAllByText(reason).length).toBeGreaterThan(0);
}

describe("위로·아래로 — ≥1024 편집 패널 머리 (E-AC-17)", () => {
  it("아래로 → 순서 바뀜 · 알림 'About을 4번째로 옮겼습니다' · 포커스 그대로", async () => {
    await openStudio();
    pick("About");
    const down = editPanel().getByRole("button", { name: "아래로" });
    down.focus();
    await act(async () => void fireEvent.click(down));
    await screen.findByText("About을 4번째로 옮겼습니다");
    expect(rowNames()).toEqual(["s-header", "s-hero", "s-services", "s-about", "s-faq", "s-contact", "s-cta", "s-footer"]);
    expect(notice()).toHaveTextContent("About을 4번째로 옮겼습니다");
    expect(editPanel().getByRole("button", { name: "아래로" })).toHaveFocus();
    expect(sections().getByRole("button", { name: /^About/ })).toHaveAttribute("aria-current", "true");
  });

  it("5.2 경계 표 4행 — aria-disabled + 이유 문장, 눌러도 순서 그대로", async () => {
    await openStudio();
    pick("About");
    expectBlocked(editPanel().getByRole("button", { name: "위로" }), "Hero 위로는 옮길 수 없습니다 (R-02 Hero는 첫 본문)");
    act(() => void fireEvent.click(editPanel().getByRole("button", { name: "위로" })));
    pick("Hero");
    expectBlocked(editPanel().getByRole("button", { name: "위로" }), "Hero는 첫 본문 자리에 고정됩니다 (R-02)");
    expectBlocked(editPanel().getByRole("button", { name: "아래로" }), "Hero는 첫 본문 자리에 고정됩니다 (R-02)");
    pick("Header");
    expectBlocked(editPanel().getByRole("button", { name: "위로" }), "Header는 맨 위에 고정됩니다");
    expectBlocked(editPanel().getByRole("button", { name: "아래로" }), "Header는 맨 위에 고정됩니다");
    pick("Footer");
    expectBlocked(editPanel().getByRole("button", { name: "아래로" }), "Footer는 맨 아래에 고정됩니다");
    pick("CTA Band");
    expectBlocked(editPanel().getByRole("button", { name: "아래로" }), "Footer 아래로는 옮길 수 없습니다");
    expect(editPanel().getByRole("button", { name: "위로" })).not.toHaveAttribute("aria-disabled");
    expect(rowNames()).toEqual(["s-header", "s-hero", "s-about", "s-services", "s-faq", "s-contact", "s-cta", "s-footer"]);
    expect(notice()).toHaveTextContent("");
  });

  it("1024 2단도 같은 부품(편집 패널 머리)", async () => {
    await openStudio({ width: 1024 });
    act(() => void fireEvent.change(screen.getByRole("combobox", { name: "섹션" }), { target: { value: "s-faq" } }));
    const up = editPanel().getByRole("button", { name: "위로" });
    await act(async () => void fireEvent.click(up));
    await screen.findByText("FAQ를 4번째로 옮겼습니다");
    expect(editPanel().getByRole("button", { name: "위로" })).toHaveFocus();
  });
});

describe("위로·아래로 — <1024 '섹션' 탭·'편집' 탭 같은 부품 (E-AC-17)", () => {
  it("'섹션' 탭 선택 줄 옆 · '편집' 탭 머리 — 둘 다 같은 버튼, 섹션 탭에서 옮겨도 포커스·탭 그대로", async () => {
    await openStudio({ width: 390 });
    pick("Services");
    const sectionsPanel = within(screen.getByRole("tabpanel", { name: "섹션" }));
    const editTab = within(document.getElementById("studio-panel-edit")!);
    expect(sectionsPanel.getByRole("button", { name: "위로" })).toBeInTheDocument();
    expect(editTab.getByRole("button", { name: "위로", hidden: true })).toBeInTheDocument();
    const up = sectionsPanel.getByRole("button", { name: "위로" });
    up.focus();
    await act(async () => void fireEvent.click(up));
    await screen.findByText("Services를 3번째로 옮겼습니다");
    expect(screen.getByRole("tab", { name: "섹션" })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("tabpanel", { name: "섹션" })).getByRole("button", { name: "위로" })).toHaveFocus();
    expectBlocked(within(screen.getByRole("tabpanel", { name: "섹션" })).getByRole("button", { name: "위로" }), "Hero 위로는 옮길 수 없습니다 (R-02 Hero는 첫 본문)");
  });
});
