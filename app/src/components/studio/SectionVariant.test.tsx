import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileSeries } from "../../domain/profile";
import { diffSlots } from "../../engine/ops/diff";
import { getSectionDefinition } from "../../engine/sections/registry";
import { sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** K6 변형 교체 (E-AC-20 · SPEC 5.5 · E-S16 · 6.4) */
afterEach(restoreViewport);

const nav = () => within(screen.getByRole("navigation", { name: "섹션" }));
const row = (id: string) => screen.getByRole("navigation", { name: "섹션" }).querySelector<HTMLElement>(`[data-row-id="${id}"]`)!;
const pickRow = (name: string) => act(() => void fireEvent.click(nav().getByRole("button", { name: new RegExp(`^${name}`) })));
const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));

/** SPEC 5.5 캡션 = diffSlots 결과(같은 키·같은 종류 = 유지) */
function caption(type: "services" | "contact", from: string, to: string) {
  const diff = diffSlots(getSectionDefinition(type, from)!.slots, getSectionDefinition(type, to)!.slots);
  return diff.lost.length === 0 ? "슬롯 모두 유지" : `유지 ${diff.kept.length} · 잃음 ${diff.lost.length} (${diff.lost.map((e) => e.label).join(", ")})`;
}

async function openVariants() {
  const details = editPanel().getByText("변형 바꾸기").closest("details")!;
  await act(async () => {
    details.open = true;
    details.dispatchEvent(new Event("toggle"));
  });
  return within(await editPanel().findByRole("radiogroup", { name: "변형" }));
}

describe("변형 교체 (E-AC-20)", () => {
  it("머리 '변형: <이름표>' · 펼치면 라디오 + 캡션 '유지 N · 잃음 M (이름)' = diffSlots · 키는 화면에 없음", async () => {
    await openStudio();
    pickRow("Services");
    expect(editPanel().getByText("변형: 카드 3개")).toBeInTheDocument();
    const list = await openVariants();
    expect(list.getByRole("radio", { name: "카드 3개" })).toBeChecked();
    expect(list.getByRole("radio", { name: "카드 3개" })).toHaveAccessibleDescription("슬롯 모두 유지");
    expect(list.getByRole("radio", { name: "목록형" })).toHaveAccessibleDescription(caption("services", "cards-3", "list"));
    expect(caption("services", "cards-3", "list")).toMatch(/^유지 \d+ · 잃음 [1-9]\d* \(/);
    expect(screen.queryByText(/cards-3|\blist\b/)).toBeNull();
  });

  it("고르면 바로 적용 · 알림 '목록형으로 바꿨습니다 · 잃은 슬롯 M개(…)' · 포커스는 라디오 · 되돌리기 → 원래 변형·값", async () => {
    await openStudio();
    pickRow("Services");
    const title = editPanel().getAllByRole("textbox")[0]!;
    act(() => void fireEvent.change(title, { target: { value: "바꾸기 전 제목" } }));
    const list = await openVariants();
    const lost = diffSlots(getSectionDefinition("services", "cards-3")!.slots, getSectionDefinition("services", "list")!.slots).lost;
    const radio = list.getByRole("radio", { name: "목록형" });
    radio.focus();
    await act(async () => void fireEvent.click(radio));
    const text = `목록형으로 바꿨습니다 · 잃은 슬롯 ${lost.length}개(${lost.map((e) => e.label).join(", ")})`;
    await screen.findByText(text);
    expect(screen.getByRole("status", { name: "편집 알림" })).toHaveTextContent(text);
    expect(list.getByRole("radio", { name: "목록형" })).toBeChecked();
    expect(list.getByRole("radio", { name: "목록형" })).toHaveFocus();
    expect(row("s-services")).toHaveTextContent("목록형");
    expect(editPanel().getByText("변형: 목록형")).toBeInTheDocument();

    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "되돌리기" })));
    await screen.findByText("카드 3개로 되돌렸습니다");
    expect(row("s-services")).toHaveTextContent("카드 3개");
    expect(row("s-services")).toHaveFocus();
    expect(editPanel().getAllByRole("textbox")[0]).toHaveValue("바꾸기 전 제목");
    expect(screen.queryByRole("button", { name: "되돌리기" })).toBeNull();
  });

  it("목적 '예약'의 유일한 예약 변형 → 다른 변형 aria-disabled + R-04 이유(그룹 설명)", async () => {
    const doc = withSections(sampleDoc(), sampleDoc().sections.map((s) => (s.type === "contact" ? section("contact", "booking", "s-contact") : s)));
    const series: ProfileSeries = {
      profileId: "profile-1",
      latestVersion: 2,
      versions: [
        { profileId: "profile-1", version: 2, origin: "adjust", baseReferenceId: "ref-1", base: { motion_preset: "L1" } as DesignProfileInput, adjustments: { purpose: "booking" }, createdAt: "2026-09-27T00:00:00.000Z" },
      ],
    };
    await openStudio({ doc, series });
    pickRow("Contact");
    await screen.findByText("목적이 '예약'이라 Contact(예약)가 필요합니다 (R-04)");
    const list = await openVariants();
    expect(list.getByRole("radio", { name: "문의 폼" })).toHaveAttribute("aria-disabled", "true");
    expect(editPanel().getByRole("radiogroup", { name: "변형" })).toHaveAccessibleDescription(expect.stringContaining("목적이 '예약'이라 Contact(예약)가 필요합니다 (R-04)"));
  });
});
