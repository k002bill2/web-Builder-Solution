import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type ProjectRepository, type ProjectSnapshot, type SnapshotKind } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** P1D-SPEC 1.1 D-S01~D-S08 · AC-D06(스냅샷) · AC-D07(스냅샷) · AC-D08(스냅샷 UI alert) — 수동 줄 삭제 · 확인 대화상자 · 보관 캡션 */
const CAPTION = "자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 '지금 상태 저장'으로 만드세요";
const FAIL = "지우지 못했습니다 — 다시 시도하세요";

/** 브라우저 top layer 흉내 — 맨 위 열린 modal 밖 요소는 포커스를 못 받는다(inert). close()를 먼저 해야 아래 대화상자로 포커스가 간다 */
let spy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  const focus = HTMLElement.prototype.focus;
  spy = vi.spyOn(HTMLElement.prototype, "focus").mockImplementation(function (this: HTMLElement, options?: FocusOptions) {
    const open = document.querySelectorAll("dialog[open]");
    const top = open[open.length - 1];
    if (top && !top.contains(this)) return;
    focus.call(this, options);
  });
});
afterEach(() => {
  spy.mockRestore();
  restoreViewport();
});

function repo(kinds: readonly SnapshotKind[]) {
  const doc = sampleDoc();
  let snaps: ProjectSnapshot<PageDoc>[] = kinds.map((kind, i) => ({
    snapshotId: `snapshot-${i + 1}`,
    projectId: "project-1",
    kind,
    ...(kind === "auto" && { reason: "export" as const }),
    name: kind === "manual" ? `수동 ${i + 1}` : `자동 ${i + 1}`,
    createdAt: "2026-10-06T05:02:00.000Z",
    doc,
    profileVersion: doc.profileVersion,
    candidateId: doc.candidateId,
    hash: "h",
  }));
  const deleted: string[] = [];
  let next: () => Promise<void> = async () => undefined;
  let saving: () => Promise<void> = async () => undefined;
  const repository: Partial<ProjectRepository> = {
    saveDoc: async (_id, revision, doc) => {
      await saving();
      return { ...(doc as PageDoc), revision: revision + 1 };
    },
    listSnapshots: async () => [...snaps],
    deleteSnapshot: async (_id, snapshotId) => {
      deleted.push(snapshotId);
      await next();
      snaps = snaps.filter((s) => s.snapshotId !== snapshotId);
    },
  };
  return { repository, deleted, then: (run: () => Promise<void>) => void (next = run), save: (run: () => Promise<void>) => void (saving = run) };
}

async function openDialog() {
  act(() => void fireEvent.click(screen.getByRole("button", { name: "스냅샷" })));
  return within(await screen.findByRole("dialog", { name: "스냅샷" }));
}
async function askDelete(dialog: ReturnType<typeof within>, name: string) {
  act(() => void fireEvent.click(dialog.getByRole("button", { name: `${name} 삭제` })));
  return within(await screen.findByRole("dialog", { name: "스냅샷을 지울까요?" }));
}
const confirmGone = () => expect(screen.queryByRole("dialog", { name: "스냅샷을 지울까요?" })).toBeNull();
const notice = () => screen.getByRole("status", { name: "편집 알림" });
const previewHeading = (name: string) => screen.queryByRole("heading", { name: `스냅샷 '${name}'를 보고 있습니다 · 편집은 멈췄습니다` });
/** 페이지 정보 줄을 골라 SEO 제목을 바꾼다 — 미저장 변경 → 미리보기가 저장(flushed)을 기다린다 */
const type = (value: string) => {
  if (!document.getElementById("page-info-title")) act(() => void fireEvent.click(screen.getAllByText("페이지 정보")[0]!));
  act(() => void fireEvent.change(document.getElementById("page-info-title")!, { target: { value } }));
};

describe("AC-D07 버튼 노출 · D-S01 캡션", () => {
  it("수동 줄에만 '삭제'(자동·게시 0) · 캡션은 목록 바로 위", async () => {
    await openStudio({ repository: repo(["manual", "auto", "published", "manual"]).repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 4");
    expect(dialog.getAllByRole("button", { name: /삭제$/ }).map((b) => b.getAttribute("aria-label"))).toEqual(["수동 4 삭제", "수동 1 삭제"]);
    const caption = dialog.getByText(CAPTION);
    expect(caption.nextElementSibling).toBe(dialog.getByRole("list", { name: "스냅샷 목록" }));
  });

  it("목록이 비어도 캡션 표시", async () => {
    await openStudio({ repository: repo([]).repository });
    const dialog = await openDialog();
    await dialog.findByText("아직 스냅샷이 없습니다");
    expect(dialog.getByText(CAPTION)).toBeInTheDocument();
  });
});

describe("AC-D06 확인 대화상자 · 포커스", () => {
  it("열면 h2 · 본문 · 캡션 · 포커스 '취소' → Esc 1회 = 확인만 닫힘 · 스냅샷 대화상자 유지 · 포커스 그 줄 '삭제'", async () => {
    const r = repo(["manual", "manual", "manual"]);
    await openStudio({ repository: r.repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 2");
    const confirm = await askDelete(dialog, "수동 2");
    expect(confirm.getByText(/^'수동 2'\(수동 · \d\d:\d\d\)을 지웁니다\. 되돌릴 수 없습니다\.$/)).toBeInTheDocument();
    expect(confirm.getByText("이 스냅샷에만 있던 이미지도 함께 지워집니다.")).toBeInTheDocument();
    expect(confirm.getByRole("button", { name: "취소" })).toHaveFocus();
    act(() => void fireEvent(screen.getByRole("dialog", { name: "스냅샷을 지울까요?" }), new Event("cancel", { cancelable: true })));
    confirmGone();
    expect(screen.getByRole("dialog", { name: "스냅샷" })).toBeInTheDocument();
    expect(dialog.getByRole("button", { name: "수동 2 삭제" })).toHaveFocus();
    expect(r.deleted).toEqual([]);
  });

  it("'취소' = 확인만 닫힘 · 포커스 그 줄 '삭제'", async () => {
    await openStudio({ repository: repo(["manual"]).repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 1");
    const confirm = await askDelete(dialog, "수동 1");
    act(() => void fireEvent.click(confirm.getByRole("button", { name: "취소" })));
    confirmGone();
    expect(dialog.getByRole("button", { name: "수동 1 삭제" })).toHaveFocus();
  });

  it("지우기 성공 → 확인 닫힘 · 목록에서 빠짐 · 편집 알림 1회 · 포커스 = 다음 줄 '미리보기' → 마지막 줄이면 이전 줄 → 하나뿐이면 이름 입력", async () => {
    const r = repo(["manual", "manual", "manual"]);
    await openStudio({ repository: r.repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 2");
    // 표시 순서 = 최신 먼저: 수동 3 · 수동 2 · 수동 1
    const sure2 = (await askDelete(dialog, "수동 2")).getByRole("button", { name: "지우기" });
    act(() => void fireEvent.click(sure2));
    await waitFor(() => expect(dialog.queryByText("수동 2")).toBeNull());
    confirmGone();
    expect(r.deleted).toEqual(["snapshot-2"]);
    expect(notice()).toHaveTextContent("스냅샷 '수동 2'를 지웠습니다");
    await waitFor(() => expect(dialog.getByRole("button", { name: "수동 1 미리보기" })).toHaveFocus());

    const sure1 = (await askDelete(dialog, "수동 1")).getByRole("button", { name: "지우기" });
    act(() => void fireEvent.click(sure1));
    await waitFor(() => expect(dialog.getByRole("button", { name: "수동 3 미리보기" })).toHaveFocus());

    const sure3 = (await askDelete(dialog, "수동 3")).getByRole("button", { name: "지우기" });
    act(() => void fireEvent.click(sure3));
    await waitFor(() => expect(dialog.getByRole("textbox")).toHaveFocus());
    expect(dialog.getByText(CAPTION)).toBeInTheDocument();
  });

  it("지우는 중 = '지우는 중…' aria-disabled · 연타·Esc 무시", async () => {
    const r = repo(["manual", "manual"]);
    let release!: () => void;
    r.then(() => new Promise<void>((resolve) => (release = resolve)));
    await openStudio({ repository: r.repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 2");
    const confirm = await askDelete(dialog, "수동 2");
    act(() => void fireEvent.click(confirm.getByRole("button", { name: "지우기" })));
    const busy = confirm.getByRole("button", { name: "지우는 중…" });
    expect(busy).toHaveAttribute("aria-disabled", "true");
    act(() => void fireEvent.click(busy));
    act(() => void fireEvent(screen.getByRole("dialog", { name: "스냅샷을 지울까요?" }), new Event("cancel", { cancelable: true })));
    expect(screen.getByRole("dialog", { name: "스냅샷을 지울까요?" })).toBeInTheDocument();
    expect(r.deleted).toEqual(["snapshot-2"]);
    await act(async () => release());
    await waitFor(confirmGone);
  });
});

describe("AC-D08 실패 → 확인 대화상자 안 alert(시도마다 새로)", () => {
  it("INFRA 실패 → alert 문장 · 확인 유지 · 버튼 복귀 → 다시 실패 = 새 alert 요소 → 재시도 성공", async () => {
    const r = repo(["manual"]);
    let fail = true;
    r.then(async () => {
      if (fail) throw new ProjectRepositoryError("INFRA", "저장 실패");
    });
    await openStudio({ repository: r.repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 1");
    const confirm = await askDelete(dialog, "수동 1");
    act(() => void fireEvent.click(confirm.getByRole("button", { name: "지우기" })));
    const first = await confirm.findByRole("alert");
    expect(first).toHaveTextContent(FAIL);
    expect(confirm.getByRole("button", { name: "지우기" })).not.toHaveAttribute("aria-disabled");
    act(() => void fireEvent.click(confirm.getByRole("button", { name: "지우기" })));
    await waitFor(() => expect(confirm.getByRole("alert")).not.toBe(first));
    expect(confirm.getByRole("alert")).toHaveTextContent(FAIL);
    fail = false;
    act(() => void fireEvent.click(confirm.getByRole("button", { name: "지우기" })));
    await waitFor(confirmGone);
    expect(notice()).toHaveTextContent("스냅샷 '수동 1'를 지웠습니다");
  });
});

describe("Codex r1 P2 — 삭제 확인과 저장·미리보기 직렬화", () => {
  it("미저장 변경 → '미리보기' 저장 대기 중 '삭제' = 확인 열림 0 · 삭제 0 → 저장 끝나면 미리보기", async () => {
    const r = repo(["manual", "manual"]);
    let release!: () => void;
    r.save(() => new Promise<void>((resolve) => (release = resolve)));
    await openStudio({ repository: r.repository });
    type("방금 입력");
    const dialog = await openDialog();
    await dialog.findByText("수동 2");
    act(() => void fireEvent.click(dialog.getByRole("button", { name: "수동 2 미리보기" })));
    act(() => void fireEvent.click(dialog.getByRole("button", { name: "수동 2 삭제" })));
    confirmGone();
    await act(async () => release());
    expect(await screen.findByRole("heading", { name: "스냅샷 '수동 2'를 보고 있습니다 · 편집은 멈췄습니다" })).toBeInTheDocument();
    confirmGone();
    expect(r.deleted).toEqual([]);
  });

  it("지우는 중 '미리보기'·'지금 상태 저장' = 진입 0(미리보기 0 · 저장 0)", async () => {
    const r = repo(["manual", "manual"]);
    let release!: () => void;
    r.then(() => new Promise<void>((resolve) => (release = resolve)));
    const create = vi.fn();
    r.repository.createSnapshot = create;
    await openStudio({ repository: r.repository });
    const dialog = await openDialog();
    await dialog.findByText("수동 2");
    const confirm = await askDelete(dialog, "수동 2");
    act(() => void fireEvent.click(confirm.getByRole("button", { name: "지우기" })));
    await act(async () => void fireEvent.click(dialog.getByRole("button", { name: "수동 1 미리보기" })));
    await act(async () => void fireEvent.click(dialog.getByRole("button", { name: "지금 상태 저장" })));
    expect(previewHeading("수동 1")).toBeNull();
    expect(create).not.toHaveBeenCalled();
    await act(async () => release());
    await waitFor(confirmGone);
    expect(previewHeading("수동 1")).toBeNull();
    expect(create).not.toHaveBeenCalled();
    expect(r.deleted).toEqual(["snapshot-2"]);
  });
});
