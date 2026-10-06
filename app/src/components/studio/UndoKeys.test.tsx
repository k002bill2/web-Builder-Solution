import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { ProjectSnapshot } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** ER-AC-U1 · U2 · C1 (EDITOR-REST SPEC r1 3.5 · 7절) — 편집 틀 단축키: 실행 취소 · 다시 실행 · 알림 1문장 · 입력칸 가로채기 0 · 포커스 유실 0 */
afterEach(restoreViewport);

const navEl = () => screen.getByRole("navigation", { name: "섹션" });
const rowIds = () => [...navEl().querySelectorAll("[data-row-id]")].map((b) => b.getAttribute("data-row-id"));
const row = (id: string) => navEl().querySelector<HTMLElement>(`[data-row-id="${id}"]`)!;
const pick = (name: string) => act(() => void fireEvent.click(within(navEl()).getByRole("button", { name: new RegExp(`^${name}`) })));
const editPanel = () => within(screen.getByRole("region", { name: /^편집 · / }));
const notice = () => screen.getByRole("status", { name: "편집 알림" });
/** keyDown → 기본 동작이 막히지 않았으면 true(fireEvent 반환값) */
const key = async (init: KeyboardEventInit, target: Element = document.body) => {
  let passed = true;
  await act(async () => {
    passed = fireEvent.keyDown(target, init);
  });
  return passed;
};
const CTRL_Z = { key: "z", code: "KeyZ", ctrlKey: true };
const removeServices = async () => {
  pick("Services");
  await act(async () => void fireEvent.click(editPanel().getByRole("button", { name: "삭제" })));
  await waitFor(() => expect(notice()).toHaveTextContent("Services를 삭제했습니다"));
};

describe("단축키 실행 취소 · 다시 실행 — ER-AC-U1 · C1", () => {
  it("삭제 → (자동 저장 뒤) Ctrl+Z = 직전 문서 + '실행 취소: Services 삭제' · Shift+Ctrl+Z = 다시 + '다시 실행: Services 삭제' · ⌘+Z · Ctrl+Y", async () => {
    const { saved } = await openStudio();
    const ids = rowIds();
    await removeServices();
    const removed = rowIds();
    expect(removed).toHaveLength(ids.length - 1);
    await waitFor(() => expect(saved.length).toBeGreaterThan(0), { timeout: 4000 });
    expect(await key(CTRL_Z)).toBe(false);
    await waitFor(() => expect(rowIds()).toEqual(ids));
    expect(notice()).toHaveTextContent(/^실행 취소: Services 삭제$/);
    await key({ ...CTRL_Z, key: "Z", shiftKey: true });
    await waitFor(() => expect(rowIds()).toEqual(removed));
    expect(notice()).toHaveTextContent(/^다시 실행: Services 삭제$/);
    await key({ key: "z", code: "KeyZ", metaKey: true });
    await waitFor(() => expect(rowIds()).toEqual(ids));
    await key({ key: "y", code: "KeyY", ctrlKey: true });
    await waitFor(() => expect(rowIds()).toEqual(removed));
  }, 10000);

  it("다시 실행으로 포커스한 줄이 사라지면 포커스 = h2 '섹션'(유실 0)", async () => {
    await openStudio();
    const ids = rowIds();
    await removeServices();
    const removed = rowIds();
    await key(CTRL_Z);
    await waitFor(() => expect(rowIds()).toEqual(ids));
    const restored = ids.find((id) => !removed.includes(id))!;
    act(() => row(restored).focus());
    await key({ ...CTRL_Z, shiftKey: true }, row(restored));
    await waitFor(() => expect(rowIds()).not.toContain(restored));
    await waitFor(() => expect(document.getElementById("studio-sections-heading")).toHaveFocus());
  });
});

describe("스냅샷 미리보기 복귀 뒤 — Codex r1 P2", () => {
  it("섹션 삭제 → 미리보기 → 편집으로 돌아가기 → Ctrl+Z = 복원 + '실행 취소: Services 삭제' · Shift+Ctrl+Z = 다시 삭제", async () => {
    const snap: ProjectSnapshot<PageDoc> = { snapshotId: "snapshot-1", projectId: "project-1", kind: "manual", name: "수동 1", createdAt: "2026-10-06T05:02:00.000Z", doc: sampleDoc(), profileVersion: sampleDoc().profileVersion, candidateId: sampleDoc().candidateId, hash: "h" };
    await openStudio({ repository: { listSnapshots: async () => [snap] } });
    const ids = rowIds();
    await removeServices();
    const removed = rowIds();
    act(() => void fireEvent.click(screen.getByRole("button", { name: "스냅샷" })));
    const dialog = within(await screen.findByRole("dialog", { name: "스냅샷" }));
    const previewButton = await dialog.findByRole("button", { name: "수동 1 미리보기" });
    act(() => void fireEvent.click(previewButton));
    await screen.findByRole("heading", { name: "스냅샷 '수동 1'를 보고 있습니다 · 편집은 멈췄습니다" });
    act(() => void fireEvent.click(screen.getByRole("button", { name: "편집으로 돌아가기" })));
    await waitFor(() => expect(rowIds()).toEqual(removed));
    expect(await key(CTRL_Z)).toBe(false);
    await waitFor(() => expect(rowIds()).toEqual(ids));
    expect(notice()).toHaveTextContent(/^실행 취소: Services 삭제$/);
    await key({ ...CTRL_Z, key: "Z", shiftKey: true });
    await waitFor(() => expect(rowIds()).toEqual(removed));
  }, 10000);
});

describe("입력칸 · 스택 밖 변경 — ER-AC-U2", () => {
  it("글자 입력칸 안 Ctrl+Z = 가로채지 않음(defaultPrevented false) · 문서 그대로", async () => {
    await openStudio();
    await removeServices();
    const removed = rowIds();
    const input = editPanel().getAllByRole("textbox")[0]!;
    expect(await key(CTRL_Z, input)).toBe(true);
    expect(rowIds()).toEqual(removed);
  });

  it("스택 밖 변경(필드 글자) 뒤 Ctrl+Z = 문서를 되돌리지 않는다 — 입력한 글자를 덮지 않음", async () => {
    await openStudio();
    await removeServices();
    const removed = rowIds();
    const input = editPanel().getAllByRole("textbox")[0]! as HTMLInputElement;
    act(() => void fireEvent.change(input, { target: { value: "새 제목" } }));
    await key(CTRL_Z);
    expect(rowIds()).toEqual(removed);
    expect((editPanel().getAllByRole("textbox")[0] as HTMLInputElement).value).toBe("새 제목");
  });
});
