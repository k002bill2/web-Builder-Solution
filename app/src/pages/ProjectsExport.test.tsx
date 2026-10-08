/**
 * `/projects` 프로젝트 파일 내보내기 화면 배선 (P2-SPEC 1.2 · 1.3 · 1.4 · 4.1 X-S04·X-S06 · AC-P07(내보내기) · AC-P08(내보내기)).
 * 읽기·내려받기는 주입(jsdom에 IndexedDB·object URL 없음) — 인코딩은 실제 encodeProjectFile. IDB는 readProject.test · Ego Lite.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ExportDeps } from "../components/projects/ExportProjectFileDialogSlot";
import { createLinkNetwork } from "../data/persistence/fakeTabLink";
import type { Project, ProjectPersistence, ProjectRepository, ProjectSummary } from "../data/projectRepository";
import type { ProfileVersion } from "../domain/profile";
import type { DeleteDeps } from "../features/projects/deleteProject";
import { projectFileName, type ReadResult } from "../features/projectFile/readProject";
import { ProjectsPage } from "./ProjectsPage";

const summary = (n: number, hasDoc: boolean): ProjectSummary =>
  Object.freeze({
    projectId: `project-${n}`,
    name: `프로젝트 ${n}`,
    revision: 1,
    profileId: `profile-${n}`,
    baseReferenceId: "ref-1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: `2026-09-2${n}T11:00:00.000Z`,
    latestProfileVersion: 1,
    hasDoc,
  });
const ITEMS = Object.freeze([summary(1, true), summary(2, false)]);

const unused = () => {
  throw new Error("쓰지 않는 저장소 메서드");
};
const repository = (persistence: ProjectPersistence): ProjectRepository => ({
  persistence,
  listProjects: vi.fn(async () => ITEMS),
  getProject: unused,
  renameProject: unused,
  getDoc: unused,
  saveDoc: unused,
  startDoc: unused,
  listSnapshots: unused,
  createSnapshot: unused,
  deleteSnapshot: unused,
  restoreSnapshot: unused,
  resolveConflict: unused,
  requestExport: unused,
  getExportJob: unused,
});

/** 2026-10-08 23:30 로컬 — 파일명 날짜는 로컬(UTC면 다음 날이 될 수 있는 시각) */
const NOW = new Date(2026, 9, 8, 23, 30);
const SOURCE: Extract<ReadResult, { status: "ok" }>["source"] = {
  project: summary(1, true) as unknown as Project,
  series: [{ profileId: "profile-1", version: 1 } as unknown as ProfileVersion],
  doc: null,
  images: [],
};

function renderPage(persistence: ProjectPersistence, read: ExportDeps["read"] = vi.fn(async (): Promise<ReadResult> => ({ status: "ok", source: SOURCE }))) {
  const download = vi.fn();
  const exportDeps: ExportDeps = { factory: {} as IDBFactory, now: () => NOW, download, read };
  const deleteDeps: DeleteDeps = { locks: undefined, factory: {} as IDBFactory, link: createLinkNetwork().tab(), session: undefined, go: vi.fn() };
  render(
    <MemoryRouter>
      <ProjectsPage repository={repository(persistence)} deleteDeps={deleteDeps} exportDeps={exportDeps} />
    </MemoryRouter>,
  );
  return { download, read };
}

const notice = () => screen.getByRole("status", { name: "프로젝트 알림" });
const EX9 = "'프로젝트 1' 프로젝트 파일을 내려받았습니다";

describe("1.2 줄 '파일로 내보내기' 버튼 (AC-P07 내보내기)", () => {
  it("local = 줄마다 '삭제' 앞(aria-label '{이름} 파일로 내보내기' · data-export-for)", async () => {
    renderPage("local");
    const button = await screen.findByRole("button", { name: "프로젝트 1 파일로 내보내기" });
    expect(button).toHaveTextContent("파일로 내보내기");
    expect(button).toHaveAttribute("data-export-for", "project-1");
    const labels = within(button.closest("li")!).getAllByRole("button").map((b) => b.textContent);
    expect(labels.slice(-2)).toEqual(["파일로 내보내기", "삭제"]);
    expect(screen.getByRole("button", { name: "프로젝트 2 파일로 내보내기" })).toBeInTheDocument();
  });

  it("memory(강등) = 숨김", async () => {
    renderPage("memory");
    await screen.findByRole("button", { name: "프로젝트 1 이름 바꾸기" });
    expect(screen.queryByRole("button", { name: /파일로 내보내기$/ })).not.toBeInTheDocument();
  });
});

describe("1.3 파일 이름", () => {
  it("`${exportFileStem(이름)}_project_YYYYMMDD.json` — 로컬 날짜", () => {
    expect(projectFileName("강남 카페", NOW)).toBe("강남-카페_project_20261008.json");
    expect(projectFileName("a/b", new Date(2026, 0, 2, 0, 5))).toBe("a-b_project_20260102.json");
    expect(projectFileName("", NOW)).toBe("page_project_20261008.json");
  });
});

describe("4.1 대화상자 열기·닫기·성공 (AC-P08 내보내기)", () => {
  it("열면 포커스 '파일 만들기' · Esc = 닫힘 + 포커스 그 줄 '파일로 내보내기' · 읽기 0", async () => {
    const { read } = renderPage("local");
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 파일로 내보내기" }));
    const dialog = await screen.findByRole("dialog", { name: "'프로젝트 1' 프로젝트를 파일로 내보낼까요?" });
    expect(within(dialog).getByRole("button", { name: "파일 만들기" })).toHaveFocus();
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "프로젝트 1 파일로 내보내기" })).toHaveFocus();
    expect(read).not.toHaveBeenCalled();
    expect(notice()).toHaveTextContent("");
  });

  it("이름 바꾸는 줄에서 내보내기 → 이름 초안 취소 · 포커스 '파일 만들기' 유지", async () => {
    renderPage("local");
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 이름 바꾸기" }));
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 1 파일로 내보내기" }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "파일 만들기" })).toHaveFocus();
  });

  it("파일 만들기 → 읽기(projectId) · 내려받기(JSON Blob·파일명) · 닫힘 · EX-9 1회 · 포커스 그 줄 '파일로 내보내기'", async () => {
    const { read, download } = renderPage("local");
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 파일로 내보내기" }));
    await userEvent.click(await screen.findByRole("button", { name: "파일 만들기" }));
    await waitFor(() => expect(download).toHaveBeenCalledTimes(1));
    expect(read).toHaveBeenCalledWith(expect.anything(), "project-1");
    const [blob, fileName] = download.mock.calls[0]! as [Blob, string];
    expect(fileName).toBe("프로젝트-1_project_20261008.json");
    expect(blob.type).toBe("application/json");
    const parsed = JSON.parse(await blob.text()) as Record<string, unknown>;
    expect(parsed).toMatchObject({ format: "design-studio-project", formatVersion: 1, schemaVersion: 1, exportedAt: NOW.toISOString(), doc: null, images: [] });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(notice()).toHaveTextContent(EX9);
    expect(within(notice()).getAllByText(EX9)).toHaveLength(1);
    expect(screen.getByRole("button", { name: "프로젝트 1 파일로 내보내기" })).toHaveFocus();
  });

  it("읽기 실패(EX-7) → 대화상자 유지 · alert · 알림 0 · 내려받기 0", async () => {
    const { download } = renderPage("local", vi.fn(async (): Promise<ReadResult> => ({ status: "gone" })));
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 파일로 내보내기" }));
    await userEvent.click(await screen.findByRole("button", { name: "파일 만들기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("이 프로젝트를 찾지 못했습니다");
    expect(download).not.toHaveBeenCalled();
    expect(notice()).toHaveTextContent("");
  });

  it("읽기 예외 → EX-10", async () => {
    renderPage(
      "local",
      vi.fn(async (): Promise<ReadResult> => {
        throw new Error("boom");
      }),
    );
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 파일로 내보내기" }));
    await userEvent.click(await screen.findByRole("button", { name: "파일 만들기" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("파일을 만들지 못했습니다 — 다시 시도하세요");
  });
});
