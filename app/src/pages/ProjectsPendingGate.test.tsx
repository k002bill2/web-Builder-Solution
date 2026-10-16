/**
 * `/projects` 미확인 행 모듈(dynamic import)이 늦게 올 때 — 로딩 상태와 완료 화면(빈 상태·저장소 영역)이 겹치지 않는다.
 * 전체 실행에서 import가 늦으면 "알림 영역은 둘"이 `['프로젝트 알림', null, '저장소 알림']`로 깨지던 결함의 회귀(flaky-projects-alerts).
 */
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { ProjectRepository } from "../data/projectRepository";
import { ProjectsPage } from "./ProjectsPage";

const gate = vi.hoisted(() => {
  let open = () => {};
  const promise = new Promise<void>((resolve) => (open = resolve));
  return { promise, open: () => open() };
});

vi.mock("../features/projects/pendingRows", async (importOriginal) => {
  await gate.promise;
  return importOriginal();
});

const unused = () => {
  throw new Error("이 테스트에서 쓰지 않는 저장소 메서드");
};

const repository = {
  persistence: "memory",
  listProjects: async () => [],
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
  confirmDoc: unused,
} as ProjectRepository;

describe("ProjectsPage — 미확인 행 모듈이 늦게 올 때", () => {
  it("목록은 왔지만 모듈이 오기 전 = 로딩만(빈 상태·저장소 영역 없음) → 온 뒤 알림 영역은 둘(목록·저장소)", async () => {
    render(
      <MemoryRouter>
        <ProjectsPage repository={repository} now={() => new Date(0)} />
      </MemoryRouter>,
    );
    // 목록 조회(마이크로태스크)는 끝나고 모듈 import는 아직 막혀 있다
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: "이 브라우저 저장소" })).not.toBeInTheDocument();
    expect(screen.queryByText("프로젝트는 비교 보드에서 프로필을 확정하면 만들어집니다")).not.toBeInTheDocument();

    gate.open();
    expect(await screen.findByRole("heading", { level: 2, name: "이 브라우저 저장소" })).toBeInTheDocument();
    expect(screen.getByText("프로젝트는 비교 보드에서 프로필을 확정하면 만들어집니다")).toBeInTheDocument();
    expect(screen.queryByText("불러오는 중…")).not.toBeInTheDocument();
    expect(screen.getAllByRole("status").map((el) => el.getAttribute("aria-label"))).toEqual(["프로젝트 알림", "저장소 알림"]);
  });
});
