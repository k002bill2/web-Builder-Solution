import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderApp } from "../test/renderApp";

// jsdom은 스크롤을 구현하지 않는다 — scrollY를 쓰기 가능하게 두고 scrollTo가 그 값을 바꾸게 한다
let scrollTo: ReturnType<typeof vi.fn>;

function setScrollY(y: number) {
  Object.defineProperty(window, "scrollY", { value: y, writable: true, configurable: true });
}

/** 사용자가 스크롤한 것처럼 위치를 바꾸고 scroll 이벤트를 보낸다. */
function userScrollsTo(y: number) {
  setScrollY(y);
  window.dispatchEvent(new Event("scroll"));
}

const heading = (name: string) => screen.findByRole("heading", { level: 1, name });

beforeEach(() => {
  setScrollY(0);
  scrollTo = vi.fn((...args: unknown[]) => {
    const [first, second] = args;
    setScrollY(typeof first === "object" && first !== null ? ((first as ScrollToOptions).top ?? 0) : Number(second));
  });
  vi.stubGlobal("scrollTo", scrollTo);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setScrollY(0);
});

describe("라우트 이동 시 스크롤 제어 (그룹 D)", () => {
  it("카탈로그를 내린 뒤 상세로 들어가면 맨 위에서 시작한다", async () => {
    renderApp("/catalog");
    const card = await screen.findByRole("link", { name: "동네 치과 클리닉" });
    userScrollsTo(2500);
    await userEvent.click(card);
    await heading("동네 치과 클리닉");
    expect(window.scrollY).toBe(0);
  });

  it("상세에서 유사 레퍼런스로 옮겨 가도 맨 위에서 시작한다", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    userScrollsTo(900);
    const similar = screen.getByRole("region", { name: "유사 레퍼런스" });
    await userEvent.click(within(similar).getAllByRole("link", { name: "로컬 베이커리" })[0]!);
    await heading("로컬 베이커리");
    expect(window.scrollY).toBe(0);
  });

  it("카탈로그 필터를 바꾸면 현재 위치를 유지한다", async () => {
    const { router } = renderApp("/catalog");
    await screen.findByRole("link", { name: "동네 치과 클리닉" });
    userScrollsTo(600);
    await userEvent.click(screen.getByRole("checkbox", { name: "미니멀" }));
    expect(new URLSearchParams(router.state.location.search).has("concept")).toBe(true);
    expect(window.scrollY).toBe(600);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("상세에서 뒤로 가면 카탈로그의 이전 위치로 돌아간다", async () => {
    const { router } = renderApp("/catalog");
    await screen.findByRole("link", { name: "동네 치과 클리닉" });
    userScrollsTo(1200);
    await userEvent.click(screen.getByRole("link", { name: "동네 치과 클리닉" }));
    await heading("동네 치과 클리닉");
    userScrollsTo(300);

    await act(async () => {
      await router.navigate(-1);
    });
    await screen.findByRole("link", { name: "동네 치과 클리닉" });
    expect(router.state.location.pathname).toBe("/catalog");
    expect(window.scrollY).toBe(1200);
  });

  it("필터를 바꾼 뒤 스크롤 없이 상세에 갔다 돌아와도 필터 적용 후 위치로 돌아간다", async () => {
    const { router } = renderApp("/catalog");
    await screen.findByRole("link", { name: "동네 치과 클리닉" });
    userScrollsTo(700);
    await userEvent.click(screen.getByRole("checkbox", { name: "미니멀" }));
    await userEvent.click(await screen.findByRole("link", { name: "모던 카페 브랜드" }));
    await heading("모던 카페 브랜드");

    await act(async () => {
      await router.navigate(-1);
    });
    await screen.findByRole("link", { name: "모던 카페 브랜드" });
    expect(router.state.location.search).toContain("concept");
    expect(window.scrollY).toBe(700);
  });
});
