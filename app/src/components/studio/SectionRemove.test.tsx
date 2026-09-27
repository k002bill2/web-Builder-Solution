import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProfileSeries, ProfileVersion } from "../../domain/profile";
import type { DesignProfileInput } from "../../domain/compareBoard";
import { sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** K4 삭제·되돌리기 (E-AC-19 · SPEC 5.4 · 6.3 · 6.4 · Q7) */
afterEach(restoreViewport);

const nav = () => within(screen.getByRole("navigation", { name: "섹션" }));
const rowIds = () => [...screen.getByRole("navigation", { name: "섹션" }).querySelectorAll("[data-row-id]")].map((b) => b.getAttribute("data-row-id"));
const row = (id: string) => screen.getByRole("navigation", { name: "섹션" }).querySelector<HTMLElement>(`[data-row-id="${id}"]`)!;
const pick = (name: string) => act(() => void fireEvent.click(nav().getByRole("button", { name: new RegExp(`^${name}`) })));
const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));
const notice = () => screen.getByRole("status", { name: "편집 알림" });
const undoButton = () => screen.queryByRole("button", { name: "되돌리기" });
const ORIGINAL = ["s-header", "s-hero", "s-about", "s-services", "s-faq", "s-contact", "s-cta", "s-footer"];

function version(purpose: "booking" | "inquiry"): ProfileVersion {
  return {
    profileId: "profile-1",
    version: 2,
    origin: "adjust",
    baseReferenceId: "ref-1",
    base: { motion_preset: "L1" } as DesignProfileInput,
    adjustments: { purpose },
    createdAt: "2026-09-27T00:00:00.000Z",
  };
}
const seriesOf = (purpose: "booking" | "inquiry"): ProfileSeries => ({ profileId: "profile-1", versions: [version(purpose)], latestVersion: 2 });

async function remove() {
  await act(async () => void fireEvent.click(editPanel().getByRole("button", { name: "삭제" })));
}

describe("삭제 — 즉시 · 알림 줄 · 포커스 (E-AC-19)", () => {
  it("확인 없이 삭제 → 알림 줄 'Services를 삭제했습니다'(status 글자) + 형제 버튼 '되돌리기' · 포커스 = 다음 줄", async () => {
    await openStudio();
    pick("Services");
    await remove();
    await screen.findByText("Services를 삭제했습니다");
    expect(rowIds()).toEqual(ORIGINAL.filter((id) => id !== "s-services"));
    expect(notice()).toHaveTextContent("Services를 삭제했습니다");
    expect(within(notice()).queryByRole("button")).toBeNull();
    expect(undoButton()).toBeInTheDocument();
    expect(row("s-faq")).toHaveFocus();
    expect(row("s-faq")).toHaveAttribute("aria-current", "true");
  });

  it("되돌리기 → 같은 instanceId·같은 값·같은 위치 + 선택·포커스 복원 + 알림, 알림 줄 버튼 사라짐", async () => {
    await openStudio();
    pick("Services");
    const title = editPanel().getAllByRole("textbox")[0]!;
    act(() => void fireEvent.change(title, { target: { value: "우리 서비스 새 제목" } }));
    await remove();
    await screen.findByText("Services를 삭제했습니다");
    await act(async () => void fireEvent.click(undoButton()!));
    await screen.findByText("Services를 되돌렸습니다");
    expect(rowIds()).toEqual(ORIGINAL);
    expect(row("s-services")).toHaveFocus();
    expect(row("s-services")).toHaveAttribute("aria-current", "true");
    expect(editPanel().getAllByRole("textbox")[0]).toHaveValue("우리 서비스 새 제목");
    expect(undoButton()).toBeNull();
  });

  it("다음 연산(이동)·필드 입력 뒤에는 알림 줄 '되돌리기'가 없다 (Q7)", async () => {
    await openStudio();
    pick("Services");
    await remove();
    await screen.findByText("Services를 삭제했습니다");
    await act(async () => void fireEvent.click(editPanel().getByRole("button", { name: "위로" })));
    // Services(4번째)를 지운 뒤 FAQ가 4번째 → 위로 = 3번째
    await screen.findByText("FAQ를 3번째로 옮겼습니다");
    expect(undoButton()).toBeNull();

    pick("About");
    await remove();
    await screen.findByText("About을 삭제했습니다");
    expect(undoButton()).toBeInTheDocument();
    act(() => void fireEvent.change(editPanel().getAllByRole("textbox")[0]!, { target: { value: "바뀐 제목" } }));
    expect(undoButton()).toBeNull();
  });

  it("마지막 줄(Footer 앞 CTA Band) 삭제 → 다음 줄 Footer로 포커스 · 본문 5개가 되어도 막지 않는다", async () => {
    await openStudio();
    pick("CTA Band");
    await remove();
    await screen.findByText("CTA Band를 삭제했습니다");
    expect(row("s-footer")).toHaveFocus();
    pick("FAQ");
    expect(editPanel().getByRole("button", { name: "삭제" })).not.toHaveAttribute("aria-disabled");
  });
});

describe("삭제할 수 없는 섹션 — 5.4 표 (E-AC-19)", () => {
  it("Header · Footer · Hero — aria-disabled + 이유, 눌러도 그대로", async () => {
    await openStudio();
    for (const [name, reason] of [
      ["Header", "Header는 페이지에 꼭 하나 있어야 합니다 (R-01)"],
      ["Footer", "Footer는 페이지에 꼭 하나 있어야 합니다 (R-01)"],
      ["Hero", "Hero는 첫 본문으로 꼭 있어야 합니다 (R-02)"],
    ] as const) {
      pick(name);
      const button = editPanel().getByRole("button", { name: "삭제" });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAccessibleDescription(reason);
      await act(async () => void fireEvent.click(button));
    }
    expect(rowIds()).toEqual(ORIGINAL);
    expect(editPanel().queryByRole("link", { name: "프로필에서 목적 바꾸기" })).toBeNull();
  });

  it("목적 '예약'(문서 v2 조정) · 유일한 예약 Contact → R-04 이유 + '프로필에서 목적 바꾸기' 링크", async () => {
    const doc = withSections(sampleDoc(), sampleDoc().sections.map((s) => (s.type === "contact" ? section("contact", "booking", "s-contact") : s)));
    await openStudio({ doc, series: seriesOf("booking") });
    pick("Contact");
    const button = await editPanel().findByRole("button", { name: "삭제" });
    await screen.findByText("목적이 '예약'이라 Contact(예약)가 필요합니다 (R-04)");
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("목적이 '예약'이라 Contact(예약)가 필요합니다 (R-04)");
    expect(editPanel().getByRole("link", { name: "프로필에서 목적 바꾸기" })).toHaveAttribute("href", "/profile/profile-1?v=2");
  });

  it("목적 '문의' — cta-band·contact 중 남은 하나만 R-03, 둘 다 있으면 삭제 가능", async () => {
    await openStudio({ series: seriesOf("inquiry") });
    pick("Contact");
    await screen.findByRole("button", { name: "삭제" });
    expect(editPanel().getByRole("button", { name: "삭제" })).not.toHaveAttribute("aria-disabled");
    await remove();
    await screen.findByText("Contact를 삭제했습니다");
    pick("CTA Band");
    expect(editPanel().getByRole("button", { name: "삭제" })).toHaveAttribute("aria-disabled", "true");
    expect(editPanel().getByRole("button", { name: "삭제" })).toHaveAccessibleDescription("목적이 '문의'라 문의 섹션이 하나는 필요합니다 (R-03)");
    expect(editPanel().getByRole("link", { name: "프로필에서 목적 바꾸기" })).toBeInTheDocument();
  });
});

describe("배치별 포커스 — 대상 줄이 보이는 곳으로 (6.4)", () => {
  it("<1024 '편집' 탭에서 삭제 → '섹션' 탭으로 바꾼 뒤 다음 줄", async () => {
    await openStudio({ width: 390 });
    pick("Services");
    act(() => void fireEvent.click(screen.getByRole("tab", { name: "편집" })));
    await act(async () => void fireEvent.click(within(screen.getByRole("tabpanel", { name: "편집" })).getByRole("button", { name: "삭제" })));
    await screen.findByText("Services를 삭제했습니다");
    expect(screen.getByRole("tab", { name: "섹션" })).toHaveAttribute("aria-selected", "true");
    expect(row("s-faq")).toHaveFocus();
  });

  it("1024 — 접힌 '섹션 목록 · 순서'를 펼친 뒤 다음 줄", async () => {
    await openStudio({ width: 1024 });
    act(() => void fireEvent.change(screen.getByRole("combobox", { name: "섹션" }), { target: { value: "s-services" } }));
    await remove();
    await screen.findByText("Services를 삭제했습니다");
    expect(row("s-faq").closest("details")).toHaveAttribute("open");
    expect(row("s-faq")).toHaveFocus();
  });
});
