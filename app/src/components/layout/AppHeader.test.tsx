import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { brand } from "../../brand/brand.config";
import { CURRENT_USER } from "../../fixtures/currentUser";
import { renderApp } from "../../test/renderApp";

/** 앱 셸 헤더 = 문서 첫 banner (비교 보드 본문 안의 <header>도 banner로 잡힌다). */
const banner = () => screen.getAllByRole("banner")[0]!;
const hasClass = (el: HTMLElement, name: string) => el.className.split(/\s+/).includes(name);

describe("앱 셸 헤더 (v2 SPEC 4.1)", () => {
  it.each(["/catalog", "/catalog?tab=saved", "/references/ref-a", "/compare", "/profile"])(
    "%s 에서 헤더 구성이 같다: 브랜드·메뉴 4·새 프로젝트·아바타, 조직 공유 없음 (V2-AC-15)",
    async (path) => {
      renderApp(path);
      await screen.findByRole("heading", { level: 1 });
      const header = banner();
      expect(within(header).getByRole("link", { name: brand.name })).toHaveAttribute("href", "/catalog");
      const nav = within(header).getByRole("navigation", { name: "주 메뉴" });
      expect(within(nav).getAllByRole("link").map((a) => a.textContent)).toEqual(["카탈로그", "보관함", "비교 보드", "프로젝트"]);
      expect(within(header).getByRole("button", { name: "새 프로젝트" })).toBeInTheDocument();
      expect(within(header).getByRole("img", { name: CURRENT_USER.name })).toBeInTheDocument();
      expect(screen.queryByText(/조직 공유/)).not.toBeInTheDocument();
      expect(screen.getAllByRole("navigation", { name: "주 메뉴" })).toHaveLength(1);
    },
  );

  it("헤더 첫 줄 높이는 52px(h-13)이다", async () => {
    renderApp("/catalog");
    await screen.findByRole("heading", { level: 1 });
    const header = banner();
    expect(header.className).toMatch(/(^|\s|:)h-13(\s|$)/);
    expect(header.className).not.toMatch(/(^|\s|:)h-15(\s|$)/);
  });

  it("<768에서도 주 메뉴를 숨기지 않고 한 줄 가로 스크롤로 둔다 (V2-AC-16 · Q5)", async () => {
    renderApp("/catalog");
    await screen.findByRole("heading", { level: 1 });
    const nav = screen.getByRole("navigation", { name: "주 메뉴" });
    expect(hasClass(nav, "hidden")).toBe(false);
    expect(hasClass(nav, "overflow-x-auto")).toBe(true);
    expect(hasClass(nav, "whitespace-nowrap")).toBe(true);
  });
});
