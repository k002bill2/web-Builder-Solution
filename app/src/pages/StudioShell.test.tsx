import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Project, ProjectRepository } from "../data/projectRepository";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { renderApp } from "../test/renderApp";

/** 편집기 틀 (EDITOR-A2-SHELL S2~S6 — E-AC-03·04·05·13·14·15·16) */
const PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};

/** 화면이 쓰는 조회·저장만 — 나머지 메서드는 이 테스트에서 부르지 않는다 */
function stubProjects() {
  const repository = {
    persistence: "memory",
    getProject: async (id: string) => (id === PROJECT.projectId ? PROJECT : undefined),
    getDoc: async (id: string) => (id === PROJECT.projectId ? sampleDoc() : undefined),
    saveDoc: async (_id: string, revision: number, doc: object) => ({ ...doc, revision: revision + 1 }),
  } as unknown as ProjectRepository;
  return () => Promise.resolve(repository);
}

const original = window.matchMedia;
/** Tailwind 기준 폭(rem)으로 matchMedia를 흉내 낸다 — jsdom에는 matchMedia가 없다(CompareBoardResponsive.test와 같은 방식) */
function setViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*([\d.]+)rem/.exec(query)?.[1] ?? 0) * 16;
    return {
      matches: width >= min,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  }) as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = original;
});

async function open(width?: number) {
  if (width !== undefined) setViewport(width);
  const { router } = renderApp("/catalog", undefined, undefined, undefined, undefined, stubProjects());
  act(() => void router.navigate("/studio/project-1"));
  await screen.findByRole("heading", { level: 1, name: PROJECT.name });
  return router;
}

describe("집중 모드 툴바 (S2 · E-AC-03)", () => {
  it("주 메뉴 nav 없음 · header 1개 · 돌아가기 → /projects · h1 = 이름 · document.title = '<이름> 편집'", async () => {
    await open();
    expect(screen.queryByRole("navigation", { name: "주 메뉴" })).toBeNull();
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "프로젝트로 돌아가기" })).toHaveAttribute("href", "/projects");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(`${PROJECT.name} 편집`);
  });
});
