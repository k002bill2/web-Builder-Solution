import { render, screen } from "@testing-library/react";
import { lazy } from "react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { AppLayout } from "./AppLayout";

// 끝나지 않는 lazy 라우트 — 모듈 캐시와 무관하게 Suspense fallback을 계속 보여 준다
const NeverLoads = lazy(() => new Promise<never>(() => {}));

describe("AppLayout — 라우트 청크를 불러오는 동안 (그룹 C)", () => {
  it("빈 화면 대신 보이는 로딩 상태를 알린다", async () => {
    render(
      <MemoryRouter initialEntries={["/slow"]}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="slow" element={<NeverLoads />} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("불러오는 중");
    expect(screen.getByRole("main")).toContainElement(status);
  });
});
