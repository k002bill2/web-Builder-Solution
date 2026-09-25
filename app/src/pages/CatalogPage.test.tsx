import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import type { DesignReference } from "../domain/reference";
import { referenceFixtures } from "../fixtures/references";
import { renderApp } from "../test/renderApp";

const cards = () => screen.queryAllByRole("article");
const titles = () => cards().map((c) => within(c).getByRole("heading").textContent);
const expectCardCount = (n: number) => waitFor(() => expect(cards()).toHaveLength(n));
const tray = () => screen.getByRole("region", { name: "비교 트레이" });

describe("CatalogPage (1a-01)", () => {
  it("필터 없이 진입하면 노출 가능한 레퍼런스 6개를 보여준다", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
  });

  it("업종 칩을 누르면 카드가 줄고 URL 쿼리에 남는다 (FR-CAT-01)", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("button", { name: "카페·F&B" }));
    await expectCardCount(2);
    expect(titles()).toEqual(["모던 카페 브랜드", "로컬 베이커리"]);
    expect(new URLSearchParams(router.state.location.search).get("industry")).toBe("cafe-fnb");
    expect(screen.getByRole("button", { name: "카페·F&B" })).toHaveAttribute("aria-pressed", "true");
  });

  it("체크박스 필터는 그룹 안 OR로 URL에 쌓인다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("checkbox", { name: "미니멀" }));
    await expectCardCount(1);
    await userEvent.click(screen.getByRole("checkbox", { name: "대담한" }));
    await expectCardCount(2);
    expect(new URLSearchParams(router.state.location.search).get("concept")).toBe("minimal,bold");
  });

  it("모션 강도를 고르면 해당 카드만 남고 URL에 반영된다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("radio", { name: "낮음" }));
    await expectCardCount(3);
    expect(new URLSearchParams(router.state.location.search).get("motion")).toBe("low");
  });

  it("새로고침(초기 URL)하면 필터 상태를 복원한다", async () => {
    renderApp("/catalog?industry=cafe-fnb&concept=warm&motion=low");
    await expectCardCount(1);
    expect(titles()).toEqual(["모던 카페 브랜드"]);
    expect(screen.getByRole("button", { name: "카페·F&B" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("checkbox", { name: "따뜻한" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "미니멀" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "낮음" })).toHaveAttribute("aria-checked", "true");
  });

  it("색상·디바이스 그룹은 레일 맨 아래, 모션 강도 다음에 있다", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
    const rail = screen.getByRole("complementary", { name: "필터" });
    const headings = [...rail.querySelectorAll("legend, span.ds-label")].map((el) => el.textContent);
    expect(headings.slice(-3)).toEqual(["모션 강도", "색상", "디바이스"]);
  });

  it("색상 계열·디바이스를 고르면 카드가 줄고 URL 쿼리에 남는다 (FR-CAT-01)", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("checkbox", { name: "따뜻한 계열" }));
    await expectCardCount(2);
    expect(titles()).toEqual(["모던 카페 브랜드", "로컬 베이커리"]);
    await userEvent.click(screen.getByRole("checkbox", { name: "데스크톱" }));
    await expectCardCount(1);
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("color")).toBe("warm");
    expect(params.get("device")).toBe("desktop");
  });

  it("새로고침(초기 URL)하면 색상·디바이스 필터를 복원한다", async () => {
    const { router } = renderApp("/catalog?color=cool,neutral&device=desktop");
    await expectCardCount(2);
    expect(titles()).toEqual(["동네 치과 클리닉", "부티크 법률사무소"]);
    expect(screen.getByRole("checkbox", { name: "차가운 계열" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "무채색" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "따뜻한 계열" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "데스크톱" })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "필터 초기화" }));
    await expectCardCount(6);
    expect(router.state.location.search).toBe("");
  });

  it("알 수 없는 쿼리 값은 무시한다", async () => {
    renderApp("/catalog?industry=unknown&concept=nope&color=pink&device=tv");
    await expectCardCount(6);
  });

  it("정렬을 바꾸면 순서와 URL이 바뀐다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    expect(titles()[0]).toBe("동네 치과 클리닉");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "정렬" }), "latest");
    await waitFor(() => expect(titles()[0]).toBe("로컬 베이커리"));
    expect(new URLSearchParams(router.state.location.search).get("sort")).toBe("latest");
  });

  it("초기화는 필터 쿼리를 지우고 전체를 보여준다", async () => {
    const { router } = renderApp("/catalog?industry=beauty&audience=b2b");
    await expectCardCount(0);
    expect(screen.getByText("조건에 맞는 레퍼런스가 없습니다")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "필터 초기화" }));
    await expectCardCount(6);
    expect(router.state.location.search).toBe("");
  });

  it("저장한 레퍼런스는 저장함 탭에서 모아 본다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("button", { name: "프리미엄 헤어살롱 저장" }));
    await userEvent.click(screen.getByRole("tab", { name: /저장함/ }));
    await expectCardCount(1);
    expect(titles()).toEqual(["프리미엄 헤어살롱"]);
    expect(new URLSearchParams(router.state.location.search).get("tab")).toBe("saved");
  });

  it("비교 추가·해제가 하단 트레이에 반영된다 (FR-CMP-02)", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
    expect(within(tray()).getByText("0")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "모던 카페 브랜드 비교 추가" }));
    await waitFor(() => expect(within(tray()).getByText("모던 카페 브랜드")).toBeInTheDocument());
    expect(within(tray()).getByText("1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "모던 카페 브랜드 비교 중, 비교에서 빼기" })).toHaveTextContent("비교 중");

    await userEvent.click(within(tray()).getByRole("button", { name: "모던 카페 브랜드 비교에서 제거" }));
    await waitFor(() => expect(within(tray()).queryByText("모던 카페 브랜드")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "모던 카페 브랜드 비교 추가" })).toHaveTextContent("비교 추가");
  });

  it("7번째 비교 추가는 막고 안내한다", async () => {
    const seventh: DesignReference = { ...referenceFixtures[0]!, id: "ref-g", key: "G", slug: "g", title: "일곱째 레퍼런스" };
    renderApp("/catalog", createMemoryReferenceRepository([...referenceFixtures, seventh]));
    await expectCardCount(7);
    for (const r of referenceFixtures) {
      await userEvent.click(screen.getByRole("button", { name: `${r.title} 비교 추가` }));
    }
    await waitFor(() => expect(within(tray()).getByText("6")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "일곱째 레퍼런스 비교 추가" }));
    expect(screen.getByRole("status")).toHaveTextContent("비교 보드에는 최대 6개까지 담을 수 있습니다");
    expect(screen.getByRole("button", { name: "일곱째 레퍼런스 비교 추가" })).toHaveTextContent("비교 추가");
    expect(within(tray()).queryByText("일곱째 레퍼런스")).not.toBeInTheDocument();
  });
});

describe("라우팅", () => {
  it("/ 는 /catalog 로 이동한다", async () => {
    const { router } = renderApp("/");
    await waitFor(() => expect(router.state.location.pathname).toBe("/catalog"));
  });

  it.each([
    ["/compare", "비교 보드"],
    ["/profile", "디자인 프로필 · 3안 생성"],
    ["/studio", "편집기"],
  ])("%s 는 다음 단계 자리표시 페이지다", async (path, title) => {
    renderApp(path);
    expect(await screen.findByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    expect(screen.getByText(/다음 단계에서 구현됩니다/)).toBeInTheDocument();
  });

  it("보관함(/catalog?tab=saved)에서는 GNB의 보관함만 현재 위치로 표시한다", async () => {
    renderApp("/catalog?tab=saved");
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    expect(within(nav).getByRole("link", { name: "보관함" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "카탈로그" })).not.toHaveAttribute("aria-current");
  });

  it("카탈로그에서는 GNB의 카탈로그만 현재 위치로 표시한다", async () => {
    renderApp("/catalog?industry=beauty");
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    expect(within(nav).getByRole("link", { name: "카탈로그" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "보관함" })).not.toHaveAttribute("aria-current");
  });

  it("비교 보드 열기는 /compare 로 이동한다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("button", { name: "비교 보드 열기" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/compare"));
  });
});
