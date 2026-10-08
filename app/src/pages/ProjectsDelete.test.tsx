/**
 * `/projects` 프로젝트 삭제 화면 배선 (P1D-SPEC 1.3 J-S12·J-S16 · 1.5 · 1.6 · AC-D06(프로젝트) · D07(프로젝트)).
 * 흐름 실행부는 주입(jsdom에 IndexedDB 없음) — IDB 트랜잭션은 deleteProject.test · Ego Lite.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { createLinkNetwork } from "../data/persistence/fakeTabLink";
import type { ProjectPersistence, ProjectRepository, ProjectSummary } from "../data/projectRepository";
import type { DeleteDeps, RunResult } from "../features/projects/deleteProject";
import { DELETED_NOTICE_KEY, ProjectsPage } from "./ProjectsPage";

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

function session(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: vi.fn((k: string) => map.get(k) ?? null),
    setItem: vi.fn((k: string, v: string) => void map.set(k, v)),
    removeItem: vi.fn((k: string) => void map.delete(k)),
    has: (k: string) => map.has(k),
  };
}

function renderPage(persistence: ProjectPersistence, over: { run?: DeleteDeps["run"]; store?: ReturnType<typeof session> } = {}) {
  const store = over.store ?? session();
  const go = vi.fn();
  const run = over.run ?? vi.fn(async (): Promise<RunResult> => "done");
  const deps: DeleteDeps = { locks: undefined, factory: {} as IDBFactory, link: createLinkNetwork().tab(), session: store, go, run };
  render(
    <MemoryRouter>
      <ProjectsPage repository={repository(persistence)} session={store} deleteDeps={deps} />
    </MemoryRouter>,
  );
  return { store, go, run };
}

const notice = () => screen.getByRole("status", { name: "프로젝트 알림" });

describe("J-S12 줄 '삭제' 버튼 (AC-D07 프로젝트)", () => {
  it("local = 줄마다 이름 바꾸기 다음 '삭제'(aria-label '{이름} 삭제' · data-delete-for)", async () => {
    renderPage("local");
    const button = await screen.findByRole("button", { name: "프로젝트 1 삭제" });
    expect(button).toHaveTextContent("삭제");
    expect(button).toHaveAttribute("data-delete-for", "project-1");
    const row = button.closest("li")!;
    const labels = within(row).getAllByRole("button").map((b) => b.textContent);
    expect(labels.slice(-3)).toEqual(["이름 바꾸기", "파일로 내보내기", "삭제"]);
    expect(screen.getByRole("button", { name: "프로젝트 2 삭제" })).toBeInTheDocument();
  });

  it("memory(강등) = '삭제' 숨김", async () => {
    renderPage("memory");
    await screen.findByRole("button", { name: "프로젝트 1 이름 바꾸기" });
    expect(screen.queryByRole("button", { name: /삭제$/ })).not.toBeInTheDocument();
  });
});

describe("확인 대화상자 열기·닫기 (AC-D06 프로젝트)", () => {
  it("삭제 → 대화상자(문서 있으면 3줄) · 포커스 취소 · Esc = 닫힘 + 포커스 그 줄 '삭제'", async () => {
    renderPage("local");
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 삭제" }));
    const dialog = await screen.findByRole("dialog", { name: "'프로젝트 1' 프로젝트를 지울까요?" });
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(3);
    expect(within(dialog).getByRole("button", { name: "취소" })).toHaveFocus();
    // jsdom은 Esc 키로 cancel을 내지 않는다 — 기존 대화상자 테스트처럼 cancel 이벤트(실제 Esc는 Ego Lite 실측)
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "프로젝트 1 삭제" })).toHaveFocus();
  });

  it("문서 없는 프로젝트 = 목록 2줄", async () => {
    renderPage("local");
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 2 삭제" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByRole("listitem")).toHaveLength(2);
  });

  it("이름 바꾸는 줄에서 삭제 → 이름 초안 취소 · 대화상자 포커스 유지(이름 바꾸기로 끌려가지 않음)", async () => {
    renderPage("local");
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 이름 바꾸기" }));
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "프로젝트 1 삭제" }));
    const dialog = await screen.findByRole("dialog");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "취소" })).toHaveFocus();
  });

  it("프로젝트 지우기 → 실행부(projectId) · 1회 키 = 이름 · /projects 새로고침 이동", async () => {
    const { run, store, go } = renderPage("local");
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 1 삭제" }));
    await userEvent.click(await screen.findByRole("button", { name: "프로젝트 지우기" }));
    await waitFor(() => expect(go).toHaveBeenCalledWith("/projects"));
    expect(run).toHaveBeenCalledWith(expect.anything(), "project-1");
    expect(store.setItem).toHaveBeenCalledWith(DELETED_NOTICE_KEY, "프로젝트 1");
  });
});

describe("J-S16 새로고침 뒤 알림 1회 · h1 포커스", () => {
  it("키 있음 → 프로젝트 알림 \"'{이름}' 프로젝트를 지웠습니다\" · 키 삭제 · h1 포커스(tabIndex -1)", async () => {
    const store = session({ [DELETED_NOTICE_KEY]: "카페" });
    renderPage("local", { store });
    await waitFor(() => expect(notice()).toHaveTextContent("'카페' 프로젝트를 지웠습니다"));
    expect(store.has(DELETED_NOTICE_KEY)).toBe(false);
    const h1 = screen.getByRole("heading", { level: 1, name: "프로젝트" });
    expect(h1).toHaveAttribute("tabindex", "-1");
    expect(h1).toHaveFocus();
  });

  it("키 없음 → 알림 0 · h1 포커스·tabIndex 0", async () => {
    renderPage("local");
    await screen.findByRole("button", { name: "프로젝트 1 삭제" });
    expect(notice()).toHaveTextContent("");
    const h1 = screen.getByRole("heading", { level: 1, name: "프로젝트" });
    expect(h1).not.toHaveAttribute("tabindex");
    expect(h1).not.toHaveFocus();
  });
});
