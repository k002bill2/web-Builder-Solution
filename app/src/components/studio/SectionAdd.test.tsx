import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** K5 섹션 추가 (E-AC-18 · SPEC 5.3 · 5.15 · E-S11·S12) */
afterEach(restoreViewport);

const nav = () => within(screen.getByRole("navigation", { name: "섹션" }));
const rowIds = () => [...screen.getByRole("navigation", { name: "섹션" }).querySelectorAll("[data-row-id]")].map((b) => b.getAttribute("data-row-id"));
const row = (id: string) => screen.getByRole("navigation", { name: "섹션" }).querySelector<HTMLElement>(`[data-row-id="${id}"]`)!;
const pickRow = (name: string) => act(() => void fireEvent.click(nav().getByRole("button", { name: new RegExp(`^${name}`) })));
const addButton = () => screen.getByRole("button", { name: "섹션 추가" });

async function openDialog() {
  await act(async () => void fireEvent.click(addButton()));
  return within(await screen.findByRole("dialog", { name: "섹션 추가" }));
}

async function addSection(typeName: string, variantLabel?: string) {
  const dialog = await openDialog();
  act(() => void fireEvent.click(dialog.getByRole("radio", { name: new RegExp(`^${typeName}`) })));
  if (variantLabel) act(() => void fireEvent.click(dialog.getByRole("radio", { name: variantLabel })));
  await act(async () => void fireEvent.click(dialog.getByRole("button", { name: "추가" })));
}

describe("섹션 추가 대화상자 (E-AC-18)", () => {
  it("열면 첫 입력(첫 추가 가능 유형) 포커스 · 유형 → 변형 → 추가 · 중복 불가 유형 aria-disabled + 이유", async () => {
    await openStudio();
    const dialog = await openDialog();
    const types = within(dialog.getByRole("group", { name: "유형" }));
    expect(types.getByRole("radio", { name: /^About/ })).toHaveFocus();
    expect(types.getByRole("radio", { name: /^About/ })).toBeChecked();
    for (const [name, reason] of [
      ["Header", "Header는 하나만 둘 수 있습니다"],
      ["Hero", "Hero는 하나만 둘 수 있습니다"],
      ["Footer", "Footer는 하나만 둘 수 있습니다"],
    ] as const) {
      expect(types.getByRole("radio", { name: new RegExp(`^${name}`) })).toHaveAttribute("aria-disabled", "true");
      expect(dialog.getByRole("group", { name: "유형" })).toHaveAccessibleDescription(expect.stringContaining(reason));
    }
    // 유형을 바꾸면 그 유형의 변형 목록(이름표) — 키가 아니다
    act(() => void fireEvent.click(types.getByRole("radio", { name: /^Services/ })));
    const variants = within(dialog.getByRole("group", { name: "변형" }));
    expect(variants.getByRole("radio", { name: "카드 3개" })).toBeChecked();
    expect(variants.getByRole("radio", { name: "목록형" })).toBeInTheDocument();
    expect(variants.queryByRole("radio", { name: "cards-3" })).toBeNull();
  });

  it("추가 → 선택 섹션 바로 뒤 · 새 섹션 선택 · 포커스 = 새 줄 · 알림 'FAQ를 4번째에 추가했습니다'", async () => {
    await openStudio();
    pickRow("About");
    await addSection("FAQ");
    await screen.findByText("FAQ를 4번째에 추가했습니다");
    expect(screen.queryByRole("dialog")).toBeNull();
    const ids = rowIds();
    expect(ids).toHaveLength(9);
    const added = ids[3]!;
    expect(["s-header", "s-hero", "s-about"]).toEqual(ids.slice(0, 3));
    expect(ids.slice(4)).toEqual(["s-services", "s-faq", "s-contact", "s-cta", "s-footer"]);
    expect(row(added)).toHaveFocus();
    expect(row(added)).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("heading", { level: 2, name: "편집 · FAQ" })).toBeInTheDocument();
  });

  it("넣는 자리 3규칙 — 페이지 정보·Header 선택 → Hero 뒤 · Footer 선택 → Footer 앞 · 변형 고르기", async () => {
    await openStudio();
    act(() => void fireEvent.click(nav().getByRole("button", { name: /^페이지 정보/ })));
    await addSection("Pricing");
    await screen.findByText("Pricing을 3번째에 추가했습니다");
    pickRow("Header");
    await addSection("Statistics");
    await screen.findByText("Statistics를 3번째에 추가했습니다");
    pickRow("Footer");
    await addSection("Services", "목록형");
    await screen.findByText("Services를 10번째에 추가했습니다");
    const ids = rowIds();
    expect(ids.at(-1)).toBe("s-footer");
    expect(nav().getByRole("button", { name: /^Services\s*목록형/ })).toHaveAttribute("aria-current", "true");
  });

  it("취소·Esc → 문서 그대로 · 포커스 = '섹션 추가'", async () => {
    await openStudio();
    const dialog = await openDialog();
    act(() => void fireEvent.click(dialog.getByRole("button", { name: "취소" })));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(addButton()).toHaveFocus();
    await openDialog();
    act(() => void fireEvent(screen.getByRole("dialog", { name: "섹션 추가" }), new Event("cancel", { cancelable: true })));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(addButton()).toHaveFocus();
    expect(rowIds()).toHaveLength(8);
  });

  it("본문 9개(R-01) → '섹션 추가' aria-disabled + 이유 · 눌러도 대화상자 없음", async () => {
    const base = sampleDoc();
    const extra = [section("pricing", "tiers-2", "s-x1"), section("statistics", "stats-3", "s-x2"), section("testimonials", "quotes-2", "s-x3")];
    const doc = withSections(base, [...base.sections.slice(0, -1), ...extra, base.sections.at(-1)!]);
    await openStudio({ doc });
    expect(addButton()).toHaveAttribute("aria-disabled", "true");
    expect(addButton()).toHaveAccessibleDescription("본문 섹션은 9개까지입니다 (R-01) — 하나를 지우면 추가할 수 있습니다");
    await act(async () => void fireEvent.click(addButton()));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("<1024 — '섹션' 탭 안 '섹션 추가' → 새 줄('섹션' 탭) 포커스", async () => {
    await openStudio({ width: 390 });
    pickRow("About");
    await addSection("FAQ");
    await screen.findByText("FAQ를 4번째에 추가했습니다");
    expect(screen.getByRole("tab", { name: "섹션" })).toHaveAttribute("aria-selected", "true");
    expect(row(rowIds()[3]!)).toHaveFocus();
  });
});
