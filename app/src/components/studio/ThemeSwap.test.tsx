import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";
import { FAIL, PASS, themeSeries } from "../../features/studio/testing/themeSeries";

/** ER-AC-T3~T6 (EDITOR-REST SPEC r1 3.1 · 3.3 · 7절) — 편집기 연결: 진입 · 적용 · 알림 · 되돌리기 · E-S18 · 대비 줄 행동 */
afterEach(restoreViewport);

const themeRegion = () => within(screen.getByRole("region", { name: "테마" }));
const notice = () => screen.getByRole("status", { name: "편집 알림" });
const contrastRow = () => document.querySelector<HTMLElement>('[data-gate-row="contrast"]')!;
/** 게이트 결과(진입 직후 자동 계산)가 그려질 때까지 */
const gateDrawn = () => waitFor(() => expect(contrastRow()).not.toBeNull());

async function swapTo(version: number, opener = () => themeRegion().getByRole("button", { name: "테마 바꾸기" })) {
  act(() => void fireEvent.click(opener()));
  const dialog = within(await screen.findByRole("dialog", { name: "테마 바꾸기" }));
  const radio = await dialog.findByRole("radio", { name: new RegExp(`^v${version} `) });
  act(() => void fireEvent.click(radio));
  await act(async () => void fireEvent.click(dialog.getByRole("button", { name: "바꾸기" })));
}

describe("테마 영역 · E-S18 — ER-AC-T5", () => {
  it("문서 v < 계열 최신 → 캡션 '프로필 v3가 새로 있습니다' + 버튼이 이유로 받음 · '프로필 보기' href에 ?v=문서 버전", async () => {
    await openStudio({ doc: sampleDoc({ profileVersion: 2 }), series: themeSeries([{ palette: PASS }, { palette: PASS }, { palette: PASS }]) });
    const caption = await themeRegion().findByText("프로필 v3가 새로 있습니다");
    expect(themeRegion().getByRole("button", { name: "테마 바꾸기" })).toHaveAccessibleDescription(caption.textContent!);
    expect(themeRegion().getByRole("link", { name: "프로필 보기" })).toHaveAttribute("href", "/profile/profile-1?v=2");
  });

  it("문서 v = 최신 → 캡션 0(버튼은 있음)", async () => {
    await openStudio({ doc: sampleDoc({ profileVersion: 2 }), series: themeSeries([{ palette: PASS }, { palette: PASS }]) });
    await themeRegion().findByRole("button", { name: "테마 바꾸기" });
    expect(themeRegion().queryByText(/새로 있습니다/)).toBeNull();
  });
});

describe("배치별 대화상자 1개 — Codex F r1 P2-1", () => {
  it.each([390, 1024])("폭 %ipx → '테마 바꾸기'를 누르면 대화상자가 정확히 1개", async (width) => {
    await openStudio({ width, doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: PASS }, { palette: PASS }]) });
    act(() => void fireEvent.click(themeRegion().getByRole("button", { name: "테마 바꾸기" })));
    expect(await screen.findAllByRole("dialog", { name: "테마 바꾸기" })).toHaveLength(1);
  });
});

describe("적용 · 되돌리기 — ER-AC-T3 · T4", () => {
  it("적용 → 알림 1문장 '…슬롯 값 N개 모두 그대로입니다' · 캔버스 킷 토큰 = 새 버전 팔레트 · 포커스 '테마 바꾸기' · 대비 줄 재계산", async () => {
    const { frame } = await openStudio({ doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: FAIL }, { palette: PASS }]) });
    await gateDrawn();
    await waitFor(() => expect(within(contrastRow()).getAllByText(/^차단 \d+$/).length).toBe(1));
    await swapTo(2);
    await waitFor(() => expect(notice()).toHaveTextContent(/^테마를 프로필 v2로 바꿨습니다 · 슬롯 값 \d+개 모두 그대로입니다$/));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(themeRegion().getByRole("button", { name: "테마 바꾸기" })).toHaveFocus();
    await waitFor(() => expect(frame.lastKitTokens()?.palette.muted).toBe(PASS.muted));
    await waitFor(() => expect(within(contrastRow()).getByText("통과")).toBeInTheDocument(), { timeout: 2000 });
  });

  it("목적이 바뀌어 필수 섹션 차단이 생기면 두 번째 문장(섹션 자동 추가 0)", async () => {
    const doc = sampleDoc({ profileVersion: 1 });
    await openStudio({ doc, series: themeSeries([{ palette: PASS }, { palette: PASS, adjustments: { purpose: "booking" } }]) });
    await swapTo(2);
    await waitFor(() => expect(notice()).toHaveTextContent(/ · 목적이 '예약'으로 바뀌어 필수 섹션 \d+건이 차단입니다$/));
    expect(screen.getByRole("navigation", { name: "섹션" }).querySelectorAll("[data-row-id]").length).toBe(doc.sections.length);
  });

  it("알림 줄 '되돌리기' → 원래 버전(캔버스·Tag) · 알림 '테마를 프로필 v1로 되돌렸습니다' · 선택 그대로", async () => {
    const { frame } = await openStudio({ doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: FAIL }, { palette: PASS }]) });
    await swapTo(2);
    await waitFor(() => expect(frame.lastKitTokens()?.palette.muted).toBe(PASS.muted));
    const selectedBefore = screen.getByRole("heading", { level: 2, name: /^편집 · / }).textContent;
    act(() => void fireEvent.click(screen.getByRole("button", { name: "되돌리기" })));
    expect(notice()).toHaveTextContent("테마를 프로필 v1로 되돌렸습니다");
    expect(themeRegion().getByText("프로필 v1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /^편집 · / }).textContent).toBe(selectedBefore);
    await waitFor(() => expect(frame.lastKitTokens()?.palette.muted).toBe(FAIL.muted));
  });
});

describe("게이트 대비 줄 행동 — ER-AC-T6", () => {
  it("통과 버전 있음 → '테마 바꾸기'(그 버전을 미리 고른 대화상자) + '프로필에서 보정' 링크(?v=문서 버전)", async () => {
    await openStudio({ doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: FAIL }, { palette: PASS }, { palette: FAIL }]) });
    await gateDrawn();
    const action = await within(contrastRow()).findByRole("button", { name: "테마 바꾸기" });
    expect(within(contrastRow()).getByRole("link", { name: "프로필에서 보정" })).toHaveAttribute("href", "/profile/profile-1?v=1");
    act(() => void fireEvent.click(action));
    const dialog = within(await screen.findByRole("dialog", { name: "테마 바꾸기" }));
    expect(await dialog.findByRole("radio", { name: /^v2 / })).toBeChecked();
    expect(dialog.getByRole("radio", { name: /^v2 / })).toHaveFocus();
    act(() => void fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true })));
    expect(action).toHaveFocus();
  });

  it("대비 줄에서 연 대화상자로 통과 버전 적용 → 줄 버튼이 사라져도 포커스는 테마 영역 '테마 바꾸기'(Codex F r1 P2-2)", async () => {
    await openStudio({ doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: FAIL }, { palette: PASS }]) });
    await gateDrawn();
    const action = await within(contrastRow()).findByRole("button", { name: "테마 바꾸기" });
    await swapTo(2, () => action);
    await waitFor(() => expect(within(contrastRow()).getByText("통과")).toBeInTheDocument(), { timeout: 2000 });
    expect(within(contrastRow()).queryByRole("button", { name: "테마 바꾸기" })).toBeNull();
    expect(themeRegion().getByRole("button", { name: "테마 바꾸기" })).toHaveFocus();
  });

  it("통과 버전 없음 → 대화상자 안 캡션 + '프로필에서 보정' 링크 · 현재 버전 선택('바꾸기' aria-disabled) — 판정은 조작 뒤(SPEC 3.3 첫 화면 0)", async () => {
    await openStudio({ doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: FAIL }, { palette: FAIL }]) });
    await gateDrawn();
    expect(within(contrastRow()).getByRole("link", { name: "프로필에서 보정" })).toHaveAttribute("href", "/profile/profile-1?v=1");
    const action = await within(contrastRow()).findByRole("button", { name: "테마 바꾸기" });
    act(() => void fireEvent.click(action));
    const dialog = within(await screen.findByRole("dialog", { name: "테마 바꾸기" }));
    expect(await dialog.findByText(/^대비를 통과하는 프로필 버전이 아직 없습니다 — 프로필에서 보정값을 쓰고 저장한 뒤 테마를 바꾸세요/)).toBeInTheDocument();
    expect(dialog.getByRole("link", { name: "프로필에서 보정" })).toHaveAttribute("href", "/profile/profile-1?v=1");
    expect(dialog.getByRole("radio", { name: /^v1 / })).toBeChecked();
    expect(dialog.getByRole("button", { name: "바꾸기" })).toHaveAttribute("aria-disabled", "true");
  });

  it.each([1280, 390])("폭 %ipx 되돌리기를 키보드로 실행(버튼이 사라짐) → 포커스 = 테마 영역 '테마 바꾸기'(B-ER-04 · body로 떨어지지 않음 · <1024는 '편집' 탭에서 눌러도 '섹션' 탭으로)", async (width) => {
    await openStudio({ width, doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: FAIL }, { palette: PASS }]) });
    await swapTo(2);
    if (width < 1024) act(() => void fireEvent.click(screen.getByRole("tab", { name: "편집" })));
    const undo = await screen.findByRole("button", { name: "되돌리기" });
    act(() => undo.focus());
    act(() => void fireEvent.click(undo));
    expect(screen.queryByRole("button", { name: "되돌리기" })).toBeNull();
    await waitFor(() => expect(themeRegion().getByRole("button", { name: "테마 바꾸기" })).toHaveFocus());
  });
});

describe("알림 줄 보이기 — B-ER-11", () => {
  it("390 테마 적용 → '되돌리기' 있는 알림 줄을 scrollIntoView({block:'nearest'})(즉시 · 모션 0) · 포커스는 옮기지 않음(테마 영역 '테마 바꾸기')", async () => {
    // jsdom에는 scrollIntoView가 없다 — 이 테스트 동안만 둔다
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    try {
      await openStudio({ width: 390, doc: sampleDoc({ profileVersion: 1 }), series: themeSeries([{ palette: FAIL }, { palette: PASS }]) });
      const line = () => notice().parentElement;
      await themeRegion().findByRole("button", { name: "테마 바꾸기" });
      expect(scroll.mock.contexts).not.toContain(line());
      await swapTo(2);
      await screen.findByRole("button", { name: "되돌리기" });
      await waitFor(() => expect(scroll.mock.contexts).toContain(line()));
      expect(scroll.mock.calls[scroll.mock.contexts.indexOf(line())]).toEqual([{ block: "nearest" }]);
      await waitFor(() => expect(themeRegion().getByRole("button", { name: "테마 바꾸기" })).toHaveFocus());
    } finally {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });
});
