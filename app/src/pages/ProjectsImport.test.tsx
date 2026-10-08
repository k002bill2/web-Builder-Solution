/**
 * `/projects` 가져오기 성공 알림·포커스 (P2-SPEC I-S07 · IM-15 · AC-P08 화면·포커스).
 * 줄 찾기 = 기존 `data-rename-for={projectId}` → 그 줄(li)의 첫 행동 — SPEC의 새 `data-project-row`는 L2 파일(ProjectRow)이라 이 레인에서 붙이지 않는다.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ProjectPersistence, ProjectRepository, ProjectSummary } from "../data/projectRepository";
import { IMPORTED_KEY } from "../features/projectFile/writeImport";
import { IMPORTED_NOTICE_KEY, ProjectsPage } from "./ProjectsPage";

const summary = (n: number, hasDoc: boolean, name = `프로젝트 ${n}`): ProjectSummary =>
  Object.freeze({
    projectId: `project-${n}`,
    name,
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
const repository = (persistence: ProjectPersistence, items: readonly ProjectSummary[]): ProjectRepository => ({
  persistence,
  listProjects: vi.fn(async () => items),
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

function renderPage(store: ReturnType<typeof session>, items: readonly ProjectSummary[] = ITEMS) {
  return render(
    <MemoryRouter>
      <ProjectsPage repository={repository("local", items)} session={store} />
    </MemoryRouter>,
  );
}

const notice = () => screen.getByRole("status", { name: "프로젝트 알림" });
const imported = (projectId: string, name: string) => session({ [IMPORTED_NOTICE_KEY]: JSON.stringify({ projectId, name }) });
const h1 = () => screen.getByRole("heading", { level: 1, name: "프로젝트" });

describe("I-S07 가져오기 성공 — 새로고침 뒤 IM-15 1회 · 가져온 줄 포커스", () => {
  it("키 리터럴 = writeImport.IMPORTED_KEY (조작 뒤 청크를 페이지에 싣지 않으려고 복제)", () => {
    expect(IMPORTED_NOTICE_KEY).toBe(IMPORTED_KEY);
  });

  it("키 있음 → \"'{이름}' 프로젝트를 가져왔습니다\" · 키 삭제 · 포커스 = 그 줄 첫 행동 '편집기 열기'", async () => {
    const store = imported("project-1", "프로젝트 1");
    renderPage(store);
    await waitFor(() => expect(screen.getByRole("link", { name: "프로젝트 1 편집기 열기" })).toHaveFocus());
    expect(notice()).toHaveTextContent("'프로젝트 1' 프로젝트를 가져왔습니다");
    expect(store.has(IMPORTED_NOTICE_KEY)).toBe(false);
  });

  it("문서 없는 줄 → 포커스 = '프로필 보기'", async () => {
    renderPage(imported("project-2", "프로젝트 2"));
    await waitFor(() => expect(screen.getByRole("link", { name: "프로젝트 2 프로필 보기" })).toHaveFocus());
  });

  it("같은 이름 줄 2개 → 이름이 아니라 projectId 줄(새 project-3)로", async () => {
    const items = [summary(2, true, "카페"), summary(3, true, "카페")];
    renderPage(imported("project-3", "카페"), items);
    await waitFor(() => expect(document.activeElement?.closest("li")?.querySelector("[data-rename-for]")).toHaveAttribute("data-rename-for", "project-3"));
    expect(document.activeElement).toHaveTextContent("편집기 열기");
    expect(notice()).toHaveTextContent("'카페' 프로젝트를 가져왔습니다");
  });

  it("줄을 못 찾음 → 알림은 1회 · 포커스 = h1(tabIndex -1)", async () => {
    renderPage(imported("project-9", "사라진"));
    await screen.findByRole("link", { name: "프로젝트 1 편집기 열기" });
    await waitFor(() => expect(h1()).toHaveFocus());
    expect(h1()).toHaveAttribute("tabindex", "-1");
    expect(notice()).toHaveTextContent("'사라진' 프로젝트를 가져왔습니다");
  });

  it("다시 그리면(키 삭제 뒤) 알림 0 · 포커스 이동 0", async () => {
    const store = imported("project-1", "프로젝트 1");
    const first = renderPage(store);
    await waitFor(() => expect(notice()).toHaveTextContent("가져왔습니다"));
    first.unmount();
    renderPage(store);
    await screen.findByRole("link", { name: "프로젝트 1 편집기 열기" });
    expect(notice()).toHaveTextContent("");
    expect(document.body).toHaveFocus();
    expect(h1()).not.toHaveAttribute("tabindex");
  });

  it("모양이 틀린 키(JSON 아님·필드 없음) → 키 삭제 · 알림 0 · 포커스 이동 0", async () => {
    for (const bad of ["{", JSON.stringify({ name: "이름만" }), JSON.stringify({ projectId: 3, name: "x" })]) {
      const store = session({ [IMPORTED_NOTICE_KEY]: bad });
      const view = renderPage(store);
      await screen.findByRole("link", { name: "프로젝트 1 편집기 열기" });
      expect(store.has(IMPORTED_NOTICE_KEY)).toBe(false);
      expect(notice()).toHaveTextContent("");
      expect(document.body).toHaveFocus();
      view.unmount();
    }
  });
});
