import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { lazy } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReferenceRepository } from "../../data/referenceRepository";
import { renderApp } from "../../test/renderApp";
import { AppLayout } from "./AppLayout";

// 배포로 이전 청크가 사라졌거나 네트워크가 끊긴 상황
const BrokenChunk = lazy(() => Promise.reject(new Error("Failed to fetch dynamically imported module")));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("AppLayout — 라우트 청크 로드 실패 (Codex R1)", () => {
  it("앱 전체가 사라지지 않고 헤더를 유지한 채 오류와 복구 방법을 알린다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={["/broken"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="broken" element={<BrokenChunk />} />
            <Route path="ok" element={<p>다른 화면</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("화면을 불러오지 못했습니다");
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새로고침" })).toBeInTheDocument();

    // 다른 화면으로 이동하면 오류 상태를 벗어난다
    await userEvent.click(screen.getByRole("link", { name: "카탈로그" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("저장소 조회 실패 (Codex R2 — 지연 로드한 데이터 청크 실패)", () => {
  const failing: ReferenceRepository = {
    list: () => Promise.reject(new Error("데이터 청크 로드 실패")),
    getById: () => Promise.reject(new Error("데이터 청크 로드 실패")),
    getDetail: () => Promise.reject(new Error("데이터 청크 로드 실패")),
    getSimilar: () => Promise.reject(new Error("데이터 청크 로드 실패")),
  };

  it.each(["/catalog", "/references/ref-a"])("%s: 빈 목록·무한 로딩 대신 오류와 복구 방법을 알린다", async (path) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderApp(path, failing);
    expect(await screen.findByRole("alert")).toHaveTextContent("화면을 불러오지 못했습니다");
    expect(screen.getByRole("button", { name: "새로고침" })).toBeInTheDocument();
  });
});
