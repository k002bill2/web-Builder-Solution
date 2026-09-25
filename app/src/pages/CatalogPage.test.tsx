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
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "정렬" })).getByRole("radio", { name: "최신순" }));
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

  it("저장한 레퍼런스는 GNB 보관함(?tab=saved)에서 모아 본다 (V2-AC-21)", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("button", { name: "프리미엄 헤어살롱 저장" }));
    const nav = screen.getByRole("navigation", { name: "주 메뉴" });
    await userEvent.click(within(nav).getByRole("link", { name: "보관함" }));
    await expectCardCount(1);
    expect(titles()).toEqual(["프리미엄 헤어살롱"]);
    expect(new URLSearchParams(router.state.location.search).get("tab")).toBe("saved");
    expect(screen.getByRole("heading", { level: 1, name: "보관함" })).toBeInTheDocument();
    expect(screen.getByText("저장한 레퍼런스 1개")).toBeInTheDocument();
    expect(within(nav).getByRole("link", { name: "보관함" })).toHaveAttribute("aria-current", "page");
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

describe("카탈로그 상단 v2 (SPEC 4.2 r2)", () => {
  it("탭이 없고 기본 보기는 h1 '레퍼런스 카탈로그' + 노출 레퍼런스 수다 (V2-AC-21)", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "레퍼런스 카탈로그" })).toBeInTheDocument();
    expect(screen.getByText("internal · licensed 레퍼런스 6개")).toBeInTheDocument();
  });

  it("?tab=rec 는 h1 '추천' + 안내 + '전체 보기' 링크, 링크는 tab만 지운다 (V2-AC-21)", async () => {
    const { router } = renderApp("/catalog?tab=rec&industry=beauty&sort=latest");
    expect(await screen.findByRole("heading", { level: 1, name: "추천" })).toBeInTheDocument();
    expect(screen.getByText("브리프 기반 추천은 다음 단계에서 제공됩니다.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "전체 보기" }));
    expect(await screen.findByRole("heading", { level: 1, name: "레퍼런스 카탈로그" })).toBeInTheDocument();
    const params = new URLSearchParams(router.state.location.search);
    expect(params.get("tab")).toBeNull();
    expect(params.get("industry")).toBe("beauty");
    expect(params.get("sort")).toBe("latest");
  });

  it("추천 받기는 ?tab=rec 로 바꾼다", async () => {
    const { router } = renderApp("/catalog");
    await expectCardCount(6);
    await userEvent.click(screen.getByRole("button", { name: "추천 받기" }));
    expect(new URLSearchParams(router.state.location.search).get("tab")).toBe("rec");
    expect(await screen.findByRole("heading", { level: 1, name: "추천" })).toBeInTheDocument();
  });

  it("정렬은 radiogroup '정렬'(점수순·최신순) 한 벌이고 URL sort를 복원한다 (V2-AC-20)", async () => {
    renderApp("/catalog?sort=latest");
    await expectCardCount(6);
    const groups = screen.getAllByRole("radiogroup", { name: "정렬" });
    expect(groups).toHaveLength(1);
    const radios = within(groups[0]!).getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual(["점수순", "최신순"]);
    expect(within(groups[0]!).getByRole("radio", { name: "최신순" })).toHaveAttribute("aria-checked", "true");
    expect(screen.queryByRole("combobox", { name: "정렬" })).not.toBeInTheDocument();
  });

  it("DOM 순서 = 업종 칩 → 정렬 → 레일 → 결과, 본문은 --layout-max-width 상한 안에 있다", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
    const order = [
      screen.getByRole("group", { name: "업종" }),
      screen.getByRole("radiogroup", { name: "정렬" }),
      screen.getByRole("complementary", { name: "필터" }),
      screen.getByRole("region", { name: "레퍼런스 목록" }),
    ];
    for (let i = 1; i < order.length; i++) {
      expect(order[i - 1]!.compareDocumentPosition(order[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    const body = screen.getByRole("region", { name: "레퍼런스 목록" }).closest('[class*="max-w-(--layout-max-width)"]');
    expect(body).not.toBeNull();
    expect(body).toContainElement(screen.getByRole("group", { name: "업종" }));
    expect(body).toContainElement(screen.getByRole("heading", { level: 1 }));
  });

  it("업종 칩 줄은 <1024 가로 스크롤(잘림 없음), 카드 그리드 클래스는 그대로다", async () => {
    renderApp("/catalog");
    await expectCardCount(6);
    const chips = screen.getByRole("group", { name: "업종" });
    expect(chips.className.split(/\s+/)).toEqual(expect.arrayContaining(["overflow-x-auto", "lg:flex-wrap"]));
    const grid = cards()[0]!.parentElement!;
    expect(grid.className).toBe("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3");
  });
});

describe("라우팅", () => {
  it("/ 는 /catalog 로 이동한다", async () => {
    const { router } = renderApp("/");
    await waitFor(() => expect(router.state.location.pathname).toBe("/catalog"));
  });

  it.each([
    // /compare는 M1-UI-03b에서 실제 화면이 됐다 — 확정 뒤 이동하는 /profile/:id 자리표시로 바꾼다
    ["/profile/profile-1", "디자인 프로필"],
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
