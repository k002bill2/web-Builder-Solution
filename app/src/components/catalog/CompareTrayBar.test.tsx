import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { referenceFixtures } from "../../fixtures/references";
import { CompareTrayBar } from "./CompareTrayBar";

type Props = Parameters<typeof CompareTrayBar>[0];

function renderPill(overrides: Partial<Props> = {}) {
  const props: Props = { references: [], notice: null, onRemove: vi.fn(), onOpen: vi.fn(), ...overrides };
  const view = render(
    <>
      <button type="button">바깥 버튼</button>
      <CompareTrayBar {...props} />
    </>,
  );
  const pill = screen.getByRole("region", { name: "비교 트레이" });
  const toggle = within(pill).getByRole("button", { name: /^비교 보드 \d+ \/ 6$/ });
  const list = document.getElementById(toggle.getAttribute("aria-controls") ?? "");
  return { ...props, ...view, pill, toggle, list };
}

describe("플로팅 비교 필 (SPEC 4.5 C-05 · V2-AC-24)", () => {
  it("0개여도 필이 있고, '비교 보드 0 / 6' 펼침 버튼은 접힌 채 목록을 가리킨다", () => {
    const { pill, toggle, list } = renderPill();
    expect(pill.tagName).toBe("SECTION");
    expect(toggle).toHaveAccessibleName("비교 보드 0 / 6");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toBeEnabled();
    expect(list).not.toBeNull();
    expect(list).toHaveClass("hidden");
  });

  it("'/ 6'은 역상 보조 글자 토큰으로 칠한다 (opacity 금지)", () => {
    const { toggle } = renderPill();
    const limit = within(toggle).getByText("/ 6");
    expect(limit).toHaveClass("text-inverse-label-alternative");
    expect(limit.className).not.toMatch(/opacity/);
  });

  it("펼치면 담긴 목록(제목 + 빼기)이 보이고, 다시 누르면 접힌다", async () => {
    const [a, b] = referenceFixtures;
    const { toggle, list, onRemove } = renderPill({ references: [a!, b!] });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(list).not.toHaveClass("hidden");
    const items = within(list!).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([a!.title, b!.title]);
    await userEvent.click(within(list!).getByRole("button", { name: `${b!.title} 비교에서 제거` }));
    expect(onRemove).toHaveBeenCalledWith(b!.id);
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(list).toHaveClass("hidden");
  });

  it("비어 있을 때 펼치면 담는 방법을 안내한다", async () => {
    const { toggle, list } = renderPill();
    await userEvent.click(toggle);
    expect(list).toHaveTextContent("카드의 ‘비교 추가’로 최대 6개까지 담을 수 있습니다");
  });

  it("Esc는 목록을 닫고 포커스를 펼침 버튼으로 돌려준다", async () => {
    const { toggle, list } = renderPill({ references: [referenceFixtures[0]!] });
    await userEvent.click(toggle);
    within(list!).getByRole("button", { name: /비교에서 제거$/ }).focus();
    await userEvent.keyboard("{Escape}");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
  });

  it("펼친 뒤 Tab(앞으로)으로 목록에 들어간다 — DOM에서 목록이 토글 다음 (D-V22-05)", async () => {
    const [a, b] = referenceFixtures;
    const { toggle } = renderPill({ references: [a!, b!] });
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab();
    expect(screen.getByRole("button", { name: `${a!.title} 비교에서 제거` })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: `${b!.title} 비교에서 제거` })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole("button", { name: "비교 보드 열기" })).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("포커스가 필 밖으로 나가면 목록을 닫는다 — 펼친 목록이 뒤 카드의 포커스를 가리지 않게 (2.4.11)", async () => {
    const { toggle } = renderPill({ references: [referenceFixtures[0]!] });
    await userEvent.click(toggle);
    expect(toggle).toHaveFocus();
    // 필 안(토글 → 목록 → 비교 보드 열기)에서 움직이는 동안은 열려 있다
    await userEvent.tab();
    expect(screen.getByRole("button", { name: /비교에서 제거$/ })).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab({ shift: true });
    expect(toggle).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    await userEvent.tab({ shift: true });
    expect(screen.getByRole("button", { name: "바깥 버튼" })).toHaveFocus();
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("'비교 보드' 버튼 이름은 '비교 보드 열기'이고 보이는 글자를 포함한다 (2.5.3)", async () => {
    const { pill, onOpen } = renderPill();
    const open = within(pill).getByRole("button", { name: "비교 보드 열기" });
    expect(open).toHaveTextContent("비교 보드");
    await userEvent.click(open);
    expect(onOpen).toHaveBeenCalled();
  });

  it("한도 알림은 필 위 role=status 말풍선이고, 알림 영역은 비어 있어도 숨기지 않는다", () => {
    const { pill, rerender } = renderPill();
    const status = within(pill).getByRole("status");
    expect(status).toBeEmptyDOMElement();
    expect(status.className).not.toMatch(/\bhidden\b/);
    rerender(
      <CompareTrayBar references={[]} notice="비교 보드에는 최대 6개까지 담을 수 있습니다" onRemove={vi.fn()} onOpen={vi.fn()} />,
    );
    expect(within(screen.getByRole("region", { name: "비교 트레이" })).getByRole("status")).toHaveTextContent(
      "비교 보드에는 최대 6개까지 담을 수 있습니다",
    );
  });

  it("필이 있는 동안 문서 scroll-padding-bottom으로 포커스 가림을 막고, 떠나면 되돌린다 (2.4.11)", () => {
    const { unmount } = renderPill();
    expect(document.documentElement.style.scrollPaddingBottom).toBe("calc(var(--spacing) * 24)");
    unmount();
    expect(document.documentElement.style.scrollPaddingBottom).toBe("");
  });
});
