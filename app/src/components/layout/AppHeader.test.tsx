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

  it("로고·주 메뉴 링크는 DS 2중 링(--focus-ring)을 쓰고, 링이 잘리지 않게 여백을 둔다 (D-V22-01)", async () => {
    renderApp("/catalog");
    await screen.findByRole("heading", { level: 1 });
    const header = banner();
    const logo = within(header).getByRole("link", { name: brand.name });
    const nav = within(header).getByRole("navigation", { name: "주 메뉴" });
    for (const link of [logo, ...within(nav).getAllByRole("link")]) {
      expect(hasClass(link, "focus-visible:shadow-(--focus-ring)")).toBe(true);
      expect(hasClass(link, "focus-visible:outline-none")).toBe(true);
    }
    // 로고가 헤더 높이 전체(h-13)면 링 위쪽이 뷰포트 밖으로 나간다 — 세로 여백으로 행 높이만 유지
    expect(hasClass(logo, "h-13")).toBe(false);
    // <768 스크롤 영역: 안쪽 여백(위·좌우)을 같은 음수 여백으로 상쇄 · ≥768: overflow 해제
    for (const name of ["-mx-1", "px-1", "-mt-1", "pt-1", "md:overflow-visible"]) expect(hasClass(nav, name)).toBe(true);
  });
});
