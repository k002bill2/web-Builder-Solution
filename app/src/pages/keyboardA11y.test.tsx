import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderApp } from "../test/renderApp";

const expectCardCount = (n: number) => waitFor(() => expect(screen.queryAllByRole("article")).toHaveLength(n));
const tray = () => screen.getByRole("region", { name: "비교 트레이" });
const search = (router: { state: { location: { search: string } } }) => new URLSearchParams(router.state.location.search);
const tabStops = (container: HTMLElement, role: "radio" | "tab") =>
  within(container)
    .getAllByRole(role)
    .filter((el) => el.tabIndex >= 0);

async function addToTray(...names: string[]) {
  for (const name of names) await userEvent.click(screen.getByRole("button", { name: `${name} 비교 추가` }));
}

describe("비교 트레이 칩 제거 후 포커스 (QA-1A-01 D07)", () => {
  it("다음 칩 → 이전 칩 → 트레이 영역 순으로 포커스가 이동한다", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
    await addToTray("동네 치과 클리닉", "부티크 법률사무소", "모던 카페 브랜드");

    // 가운데 칩 제거 → 다음 칩(모던 카페 브랜드)
    within(tray()).getByRole("button", { name: "부티크 법률사무소 비교에서 제거" }).focus();
    await userEvent.keyboard("{Enter}");
    expect(within(tray()).getByRole("button", { name: "모던 카페 브랜드 비교에서 제거" })).toHaveFocus();

    // 마지막 칩 제거 → 이전 칩(동네 치과 클리닉)
    await userEvent.keyboard("{Enter}");
    expect(within(tray()).getByRole("button", { name: "동네 치과 클리닉 비교에서 제거" })).toHaveFocus();

    // 하나 남은 칩 제거 → 트레이 영역
    await userEvent.keyboard("{Enter}");
    expect(tray()).toHaveFocus();
    expect(document.body).not.toHaveFocus();
  });
});

describe("카드 이름 링크 포커스 표시 (QA-1A-01 D08)", () => {
  it("다른 컨트롤과 같은 --focus-ring을 쓴다", async () => {
    renderApp("/catalog");
    const link = await screen.findByRole("link", { name: "동네 치과 클리닉" });
    expect(link.className).toContain("focus-visible:shadow-(--focus-ring)");
    expect(link.className).toContain("focus-visible:outline-none");
  });
});

describe("모션 강도 radiogroup — roving tabindex (A01)", () => {
  it("Tab 정지점은 선택된 라디오 하나다", async () => {
    renderApp("/catalog?motion=mid");
    await expectCardCount(2);
    const group = screen.getByRole("radiogroup", { name: "모션 강도" });
    expect(tabStops(group, "radio").map((r) => r.textContent)).toEqual(["중간"]);
  });

  it("←/→·↑/↓로 이동하며 선택하고, Home/End로 처음·끝을 고른다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    const group = screen.getByRole("radiogroup", { name: "모션 강도" });
    const radio = (name: string) => within(group).getByRole("radio", { name });

    radio("전체").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(radio("낮음")).toHaveFocus();
    expect(radio("낮음")).toHaveAttribute("aria-checked", "true");
    expect(search(router).get("motion")).toBe("low");

    await userEvent.keyboard("{ArrowDown}");
    expect(radio("중간")).toHaveFocus();
    expect(search(router).get("motion")).toBe("mid");

    await userEvent.keyboard("{ArrowUp}{ArrowLeft}");
    expect(radio("전체")).toHaveFocus();
    expect(search(router).get("motion")).toBeNull();

    // 처음에서 ←는 끝으로 순환
    await userEvent.keyboard("{ArrowLeft}");
    expect(radio("높음")).toHaveFocus();

    await userEvent.keyboard("{Home}");
    expect(radio("전체")).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(radio("높음")).toHaveFocus();
    expect(search(router).get("motion")).toBe("high");
    expect(tabStops(group, "radio").map((r) => r.textContent)).toEqual(["높음"]);
  });
});

describe("정렬 radiogroup — roving tabindex (V2-AC-20, 카탈로그 탭 삭제로 A02 대체)", () => {
  it("Tab 정지점은 선택된 정렬 하나이고, 방향키로 이동하며 URL sort를 바꾼다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    const group = screen.getByRole("radiogroup", { name: "정렬" });
    const radio = (name: string) => within(group).getByRole("radio", { name });
    expect(tabStops(group, "radio").map((r) => r.textContent)).toEqual(["점수순"]);
    radio("점수순").focus();
    await userEvent.keyboard("{ArrowRight}");
    expect(radio("최신순")).toHaveFocus();
    expect(search(router).get("sort")).toBe("latest");
    await userEvent.keyboard("{Home}");
    expect(radio("점수순")).toHaveFocus();
    expect(search(router).get("sort")).toBeNull();
  });
});

describe("상세 탭 tablist (A02)", () => {
  it("상세 화면(1a-02)의 탭도 같은 방식으로 동작한다", async () => {
    const { router } = renderApp("/references/ref-a");
    await screen.findByRole("heading", { level: 1, name: "모던 카페 브랜드" });
    const list = screen.getByRole("tablist", { name: "상세 보기" });
    expect(tabStops(list, "tab").map((t) => t.textContent)).toEqual(["섹션 구성"]);
    within(list).getByRole("tab", { name: "섹션 구성" }).focus();
    await userEvent.keyboard("{ArrowRight}{Enter}");
    expect(within(list).getByRole("tab", { name: "토큰" })).toHaveFocus();
    expect(within(list).getByRole("tab", { name: "토큰" })).toHaveAttribute("aria-selected", "true");
    expect(search(router).get("tab")).toBe("tokens");
  });
});

describe("건너뛰기 링크 (A03)", () => {
  it("첫 Tab에 '본문으로 건너뛰기'가 나오고, 누르면 main으로 포커스가 간다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.tab();
    const skip = screen.getByRole("link", { name: "본문으로 건너뛰기" });
    expect(skip).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
    expect(router.state.location.pathname).toBe("/catalog");
    expect(router.state.location.hash).toBe("");
  });

  it("카탈로그에서는 두 번째 Tab의 '결과로 건너뛰기'로 레퍼런스 목록에 바로 간다", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "결과로 건너뛰기" })).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("region", { name: "레퍼런스 목록" })).toHaveFocus();
    // 다음 Tab은 결과 영역 안의 첫 컨트롤(첫 카드 — 결과 탭은 v2에서 삭제)
    await userEvent.tab();
    expect(screen.getAllByRole("article")[0]).toContainElement(document.activeElement as HTMLElement);
  });

  it("상세 화면에도 '본문으로 건너뛰기'가 있고, '결과로 건너뛰기'는 없다", async () => {
    renderApp("/references/ref-a");
    await screen.findByRole("heading", { level: 1, name: "모던 카페 브랜드" });
    await userEvent.tab();
    expect(screen.getByRole("link", { name: "본문으로 건너뛰기" })).toHaveFocus();
    expect(screen.queryByRole("link", { name: "결과로 건너뛰기" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("main")).toHaveFocus();
  });
});
