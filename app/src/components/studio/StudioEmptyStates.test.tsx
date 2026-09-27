import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { StudioNoDoc, StudioProjectNotFound } from "./StudioEmptyStates";

describe("StudioProjectNotFound (E-S02 · E-AC-01)", () => {
  it("h1 · 안내 문장 · 프로젝트 목록/비교 보드 링크, alert·GNB 없음", () => {
    render(
      <MemoryRouter>
        <StudioProjectNotFound />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "프로젝트를 찾을 수 없습니다" })).toBeInTheDocument();
    expect(screen.getByText("새로고침하면 프로젝트와 편집 내용이 사라집니다(서버 연결 전)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "프로젝트 목록" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "비교 보드로" })).toHaveAttribute("href", "/compare");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("navigation")).toBeNull();
    expect(screen.queryByRole("banner")).toBeNull();
  });
});

describe("StudioNoDoc (E-S03 · E-AC-02)", () => {
  it("h1 = 프로젝트 이름 · 안내 · 프로필에서 3안 고르기 링크", () => {
    render(
      <MemoryRouter>
        <StudioNoDoc projectName="카페 리뉴얼" profileId="prof-1" />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "카페 리뉴얼" })).toBeInTheDocument();
    expect(
      screen.getByText("아직 편집할 페이지가 없습니다 — 프로필에서 3안을 만들고 하나를 고르세요"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "프로필에서 3안 고르기" })).toHaveAttribute("href", "/profile/prof-1");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("긴 이름은 h1에서 자르지 않는다(전체 이름 그대로)", () => {
    const longName = "아주아주긴프로젝트이름".repeat(4);
    render(
      <MemoryRouter>
        <StudioNoDoc projectName={longName} profileId="prof-2" />
      </MemoryRouter>,
    );
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(longName);
    expect(h1.className).not.toMatch(/truncate|line-clamp/);
    expect(screen.getByRole("link", { name: "프로필에서 3안 고르기" })).toHaveAttribute("href", "/profile/prof-2");
  });
});
