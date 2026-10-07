import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProjectSnapshot } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** ER-AC-U4 (EDITOR-REST SPEC r1 3.5 · 7절) — 툴바 "더보기" 메뉴: 실행 취소 · 다시 실행 = 단축키와 같은 기능 · 비활성 이유 · 알림 · 메뉴 키보드 · Esc 포커스 복귀 */
afterEach(restoreViewport);

const navEl = () => screen.getByRole("navigation", { name: "섹션" });
const rowIds = () => [...navEl().querySelectorAll("[data-row-id]")].map((b) => b.getAttribute("data-row-id"));
const pick = (name: string) => act(() => void fireEvent.click(within(navEl()).getByRole("button", { name: new RegExp(`^${name}`) })));
const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));
const notice = () => screen.getByRole("status", { name: "편집 알림" });
const trigger = () => screen.getByRole("button", { name: "더보기" });
const key = (target: Element, init: KeyboardEventInit) => act(() => void fireEvent.keyDown(target, init));
const removeServices = async () => {
  pick("Services");
  await act(async () => void fireEvent.click(editPanel().getByRole("button", { name: "삭제" })));
  await waitFor(() => expect(notice()).toHaveTextContent("Services를 삭제했습니다"));
};
/** 키보드로 연다(Enter) — 메뉴 본문은 조작 뒤 청크라 나타날 때까지 기다린다 */
const openMenu = async (init: KeyboardEventInit = { key: "Enter" }) => {
  act(() => trigger().focus());
  key(trigger(), init);
  return within(await screen.findByRole("menu", { name: "더보기" }));
};

describe("툴바 '더보기' 버튼 — ER-AC-U4", () => {
  it("≥1280 툴바 순서 = 스냅샷 → 더보기 → 검사 · 내보내기 · aria-haspopup=menu · 닫힘 = aria-expanded false", async () => {
    await openStudio();
    const buttons = within(screen.getByRole("banner")).getAllByRole("button").map((b) => b.getAttribute("aria-label") ?? b.textContent);
    const at = (name: string) => buttons.indexOf(name);
    expect(at("스냅샷")).toBeGreaterThan(-1);
    expect(at("더보기")).toBe(at("스냅샷") + 1);
    expect(at("검사 · 내보내기")).toBe(at("더보기") + 1);
    expect(trigger()).toHaveAttribute("aria-haspopup", "menu");
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it.each([1024, 390])("%ipx 배치에도 '더보기'가 툴바에 있다", async (width) => {
    await openStudio({ width });
    expect(within(screen.getByRole("banner")).getByRole("button", { name: "더보기" })).toHaveAttribute("aria-haspopup", "menu");
  });
});

describe("메뉴 항목 · 비활성 이유 — ER-AC-U4", () => {
  it("빈 기록 = 두 항목 aria-disabled + 보이는 이유 '되돌릴 편집이 없습니다' · 눌러도 문서·알림 변화 0", async () => {
    await openStudio();
    const ids = rowIds();
    const menu = await openMenu();
    expect(trigger()).toHaveAttribute("aria-expanded", "true");
    const items = menu.getAllByRole("menuitem");
    expect(items.map((i) => i.getAttribute("aria-label"))).toEqual(["실행 취소", "다시 실행"]);
    for (const item of items) {
      expect(item).toHaveAttribute("aria-disabled", "true");
      expect(item).toHaveAccessibleDescription("되돌릴 편집이 없습니다");
      expect(item).toHaveTextContent("되돌릴 편집이 없습니다");
    }
    // 첫 항목에 포커스(Enter로 열기)
    expect(items[0]).toHaveFocus();
    act(() => void fireEvent.click(items[0]!));
    expect(rowIds()).toEqual(ids);
    expect(notice()).toHaveTextContent("");
  });

  it("삭제 → '실행 취소: Services 삭제' = 단축키와 같은 결과(행 복원 + 알림) · 닫힘 + 포커스 트리거 → '다시 실행: Services 삭제' → 다시 삭제", async () => {
    await openStudio();
    const ids = rowIds();
    await removeServices();
    const removed = rowIds();
    let menu = await openMenu();
    const undo = menu.getByRole("menuitem", { name: "실행 취소: Services 삭제" });
    expect(undo).not.toHaveAttribute("aria-disabled");
    expect(menu.getByRole("menuitem", { name: "다시 실행" })).toHaveAttribute("aria-disabled", "true");
    key(undo, { key: "Enter" });
    await waitFor(() => expect(rowIds()).toEqual(ids));
    expect(notice()).toHaveTextContent(/^실행 취소: Services 삭제$/);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");

    menu = await openMenu();
    const redo = menu.getByRole("menuitem", { name: "다시 실행: Services 삭제" });
    act(() => void fireEvent.click(redo));
    await waitFor(() => expect(rowIds()).toEqual(removed));
    expect(notice()).toHaveTextContent(/^다시 실행: Services 삭제$/);
    expect(trigger()).toHaveFocus();
  }, 10000);
});

describe("메뉴 키보드 — 화살표 · Home/End · Esc (ER SPEC 7절)", () => {
  it("ArrowDown/Up 순환 · Home/End · Esc = 닫힘 + 포커스 트리거", async () => {
    await openStudio();
    const menu = await openMenu();
    const [first, second] = menu.getAllByRole("menuitem");
    expect(first).toHaveFocus();
    key(first!, { key: "ArrowDown" });
    expect(second).toHaveFocus();
    key(second!, { key: "ArrowDown" });
    expect(first).toHaveFocus();
    key(first!, { key: "ArrowUp" });
    expect(second).toHaveFocus();
    key(second!, { key: "Home" });
    expect(first).toHaveFocus();
    key(first!, { key: "End" });
    expect(second).toHaveFocus();
    key(second!, { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveFocus();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });

  it("트리거 ArrowUp = 열고 마지막 항목 포커스 · ArrowDown = 첫 항목", async () => {
    await openStudio();
    let menu = await openMenu({ key: "ArrowUp" });
    expect(menu.getAllByRole("menuitem")[1]).toHaveFocus();
    key(menu.getAllByRole("menuitem")[1]!, { key: "Escape" });
    menu = await openMenu({ key: "ArrowDown" });
    expect(menu.getAllByRole("menuitem")[0]).toHaveFocus();
  });
});

describe("Codex r1 — 잠금 · 포커스", () => {
  it("스냅샷 미리보기 중(트리거 aria-disabled) ArrowDown/ArrowUp/Enter로 메뉴가 열리지 않는다", async () => {
    const snap: ProjectSnapshot<PageDoc> = { snapshotId: "snapshot-1", projectId: "project-1", kind: "manual", name: "수동 1", createdAt: "2026-10-06T05:02:00.000Z", doc: sampleDoc(), profileVersion: sampleDoc().profileVersion, candidateId: sampleDoc().candidateId, hash: "h" };
    await openStudio({ repository: { listSnapshots: async () => [snap] } });
    act(() => void fireEvent.click(screen.getByRole("button", { name: "스냅샷" })));
    const dialog = within(await screen.findByRole("dialog", { name: "스냅샷" }));
    const previewButton = await dialog.findByRole("button", { name: "수동 1 미리보기" });
    act(() => void fireEvent.click(previewButton));
    await screen.findByRole("heading", { name: "스냅샷 '수동 1'를 보고 있습니다 · 편집은 멈췄습니다" });
    await waitFor(() => expect(trigger()).toHaveAttribute("aria-disabled", "true"));
    for (const k of ["ArrowDown", "ArrowUp", "Enter"]) {
      await act(async () => void fireEvent.keyDown(trigger(), { key: k }));
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    }
    await act(async () => undefined);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("열기 직후(본문 청크 받기 전) 포커스가 다른 컨트롤로 가면 본문이 포커스를 빼앗지 않고 닫힌다", async () => {
    await openStudio();
    const h1 = screen.getByRole("heading", { level: 1 });
    act(() => trigger().focus());
    await act(async () => {
      fireEvent.keyDown(trigger(), { key: "Enter" });
      h1.focus();
    });
    await act(async () => undefined);
    expect(h1).toHaveFocus();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(trigger()).toHaveAttribute("aria-expanded", "false");
  });
});
