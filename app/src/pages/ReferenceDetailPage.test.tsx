import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import type { DesignReference } from "../domain/reference";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { renderApp } from "../test/renderApp";

const heading = (name: string) => screen.findByRole("heading", { level: 1, name });
const search = (router: { state: { location: { search: string } } }) => new URLSearchParams(router.state.location.search);
const panel = () => screen.getByRole("tabpanel");
const refA = referenceFixtures[0]!;
const detailA = referenceDetailFixtures["ref-a"]!;

describe("ReferenceDetailPage (1a-02, FR-CAT-03)", () => {
  it("필수 영역을 모두 보여준다: 브레드크럼·제목·라이선스·메타·태그·미리보기·탭·점수·액션·유사 레퍼런스", async () => {
    renderApp("/references/ref-a");
    expect(await heading("모던 카페 브랜드")).toBeInTheDocument();

    const breadcrumb = screen.getByRole("navigation", { name: "브레드크럼" });
    expect(within(breadcrumb).getByRole("link", { name: "카탈로그" })).toHaveAttribute("href", "/catalog");

    expect(screen.getByText("internal")).toBeInTheDocument();
    expect(
      screen.getByText("카페·F&B · 풀블리드 히어로 · 20~30대 여성 타깃 · 우리 섹션 라이브러리 v1.4로 제작"),
    ).toBeInTheDocument();
    for (const tag of ["미니멀", "따뜻한", "예약 유도", "모션 낮음"]) expect(screen.getByText(tag)).toBeInTheDocument();

    expect(screen.getByRole("img", { name: /모던 카페 브랜드 미리보기/ })).toBeInTheDocument();
    expect(screen.getByText("자체 렌더 미리보기 — 외부 캡처를 사용하지 않습니다")).toBeInTheDocument();

    const tabs = within(screen.getByRole("tablist", { name: "상세 보기" })).getAllByRole("tab");
    expect(tabs.map((t) => t.textContent)).toEqual(["섹션 구성", "토큰", "모바일", "점수 이력"]);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");

    expect(within(panel()).getByRole("heading", { name: "섹션 구성 · 8개" })).toBeInTheDocument();
    const sections = within(panel()).getAllByRole("listitem");
    expect(sections.map((li) => li.textContent)).toEqual(
      detailA.sections.map((s, i) => `${String(i + 1).padStart(2, "0")}${s.name}${s.variant}`),
    );

    const scores = screen.getByRole("region", { name: "점수" });
    expect(within(scores).getByText("96")).toBeInTheDocument();
    expect(within(scores).getByText("92")).toBeInTheDocument();
    expect(within(scores).getByText("측정 2026.09.20 · Lighthouse 12")).toBeInTheDocument();

    for (const name of ["템플릿으로 가져오기", "저장", "비교 추가"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }

    const similar = screen.getByRole("region", { name: "유사 레퍼런스" });
    for (const group of ["유사 업종", "유사 콘셉트", "유사 레이아웃"]) {
      expect(within(similar).getByRole("heading", { name: group })).toBeInTheDocument();
    }
    expect(within(similar).getAllByRole("link", { name: "로컬 베이커리" })).toHaveLength(3);
    expect(within(similar).queryByRole("link", { name: "모던 카페 브랜드" })).not.toBeInTheDocument();
  });

  it("토큰·모바일·점수 이력 탭을 전환하고 URL 쿼리(tab)에 남긴다", async () => {
    const { router } = renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");

    await userEvent.click(screen.getByRole("tab", { name: "토큰" }));
    expect(search(router).get("tab")).toBe("tokens");
    expect(within(panel()).getByRole("heading", { name: "토큰 요약" })).toBeInTheDocument();
    expect(within(panel()).getByRole("img", { name: `팔레트 ${detailA.palette.map((p) => p.hex).join(" · ")}` })).toBeInTheDocument();
    expect(within(panel()).getByText(`대표 ${refA.colorPalette.primary} · 본문 대비 7.2:1`)).toBeInTheDocument();
    expect(within(panel()).getByText("Pretendard")).toBeInTheDocument();
    expect(within(panel()).getByText("제목 700 / 본문 400 · 스케일 1.25")).toBeInTheDocument();
    expect(within(panel()).getByText("8pt · 낮음")).toBeInTheDocument();
    expect(within(panel()).getByText("섹션 간격 96px · 페이드 200ms")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "모바일" }));
    expect(search(router).get("tab")).toBe("mobile");
    expect(within(panel()).getAllByRole("listitem").map((li) => li.textContent)).toEqual([...detailA.mobileFlow]);

    await userEvent.click(screen.getByRole("tab", { name: "점수 이력" }));
    expect(search(router).get("tab")).toBe("scores");
    expect(within(panel()).getByText("2026.09.20")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "섹션 구성" }));
    expect(router.state.location.search).toBe("");
  });

  it("새로고침(초기 URL)하면 선택한 탭을 복원하고, 모르는 탭 값은 기본 탭으로 둔다", async () => {
    renderApp("/references/ref-a?tab=mobile");
    await heading("모던 카페 브랜드");
    expect(screen.getByRole("tab", { name: "모바일" })).toHaveAttribute("aria-selected", "true");
    expect(within(panel()).getByText("하단 고정 CTA")).toBeInTheDocument();
  });

  it("모르는 탭 값은 섹션 구성 탭으로 연다", async () => {
    renderApp("/references/ref-a?tab=nope");
    await heading("모던 카페 브랜드");
    expect(screen.getByRole("tab", { name: "섹션 구성" })).toHaveAttribute("aria-selected", "true");
  });

  it("없는 id는 404 안내와 카탈로그 링크를 보여준다", async () => {
    renderApp("/references/ref-zz");
    expect(await heading("레퍼런스를 찾을 수 없습니다")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "카탈로그로 돌아가기" })).toHaveAttribute("href", "/catalog");
  });

  it("비노출(external_observed) 레퍼런스도 404로 처리한다 (FR-CAT-04)", async () => {
    const hidden: DesignReference = { ...refA, id: "ref-x", key: "X", title: "외부 관찰 카페", licenseStatus: "external_observed" };
    renderApp(
      "/references/ref-x",
      createMemoryReferenceRepository([...referenceFixtures, hidden], { ...referenceDetailFixtures, "ref-x": detailA }),
    );
    expect(await heading("레퍼런스를 찾을 수 없습니다")).toBeInTheDocument();
    expect(screen.queryByText("외부 관찰 카페")).not.toBeInTheDocument();
  });

  it("유사 레퍼런스를 누르면 해당 상세로 바뀌고 이전 레퍼런스 내용이 남지 않는다", async () => {
    const { router } = renderApp("/references/ref-a?tab=mobile");
    await heading("모던 카페 브랜드");
    const similar = screen.getByRole("region", { name: "유사 레퍼런스" });
    await userEvent.click(within(similar).getAllByRole("link", { name: "로컬 베이커리" })[0]!);
    expect(await heading("로컬 베이커리")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/references/ref-f");
    expect(screen.queryByRole("heading", { level: 1, name: "모던 카페 브랜드" })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "섹션 구성" })).toHaveAttribute("aria-selected", "true");
    expect(within(screen.getByRole("region", { name: "점수" })).getByText(String(referenceFixtures[5]!.scores.accessibility))).toBeInTheDocument();
  });

  it("템플릿으로 가져오기는 다음 단계 안내만 한다", async () => {
    const { router } = renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    await userEvent.click(screen.getByRole("button", { name: "템플릿으로 가져오기" }));
    expect(screen.getByRole("status")).toHaveTextContent("다음 단계");
    expect(router.state.location.pathname).toBe("/references/ref-a");
  });
});

describe("상세 ↔ 카탈로그 상태 공유", () => {
  it("카탈로그 카드 이름을 누르면 상세로 이동한다", async () => {
    const { router } = renderApp("/catalog");
    await userEvent.click(await screen.findByRole("link", { name: "동네 치과 클리닉" }));
    expect(await heading("동네 치과 클리닉")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/references/ref-c");
  });

  it("상세에서 저장·비교 추가한 상태가 카탈로그 카드와 트레이에 그대로 보인다", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    await userEvent.click(screen.getByRole("button", { name: "저장" }));
    expect(screen.getByRole("button", { name: "저장" })).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: "비교 추가" }));
    expect(screen.getByRole("button", { name: "비교 중, 비교에서 빼기" })).toHaveTextContent("비교 중");

    await userEvent.click(within(screen.getByRole("navigation", { name: "브레드크럼" })).getByRole("link", { name: "카탈로그" }));
    expect(await screen.findByRole("button", { name: "모던 카페 브랜드 저장" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "모던 카페 브랜드 비교 중, 비교에서 빼기" })).toBeInTheDocument();
    const tray = screen.getByRole("region", { name: "비교 트레이" });
    await waitFor(() => expect(within(tray).getByText("모던 카페 브랜드")).toBeInTheDocument());
  });

  it("카탈로그에서 담은 비교 상태가 상세에 보이고, 상세에서 빼면 트레이에서도 빠진다", async () => {
    renderApp("/catalog");
    await userEvent.click(await screen.findByRole("button", { name: "로컬 베이커리 비교 추가" }));
    await userEvent.click(screen.getByRole("link", { name: "로컬 베이커리" }));
    await heading("로컬 베이커리");
    await userEvent.click(screen.getByRole("button", { name: "비교 중, 비교에서 빼기" }));
    expect(screen.getByRole("button", { name: "비교 추가" })).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("navigation", { name: "브레드크럼" })).getByRole("link", { name: "카탈로그" }));
    expect(await screen.findByRole("button", { name: "로컬 베이커리 비교 추가" })).toBeInTheDocument();
  });

  it("트레이가 6개로 차 있으면 상세에서의 7번째 비교 추가를 막고 안내한다", async () => {
    const seventh: DesignReference = { ...refA, id: "ref-g", key: "G", slug: "g", title: "일곱째 레퍼런스" };
    renderApp(
      "/catalog",
      createMemoryReferenceRepository([...referenceFixtures, seventh], { ...referenceDetailFixtures, "ref-g": detailA }),
    );
    for (const r of referenceFixtures) {
      await userEvent.click(await screen.findByRole("button", { name: `${r.title} 비교 추가` }));
    }
    await userEvent.click(screen.getByRole("link", { name: "일곱째 레퍼런스" }));
    await heading("일곱째 레퍼런스");
    await userEvent.click(screen.getByRole("button", { name: "비교 추가" }));
    expect(screen.getByRole("status")).toHaveTextContent("비교 보드에는 최대 6개까지 담을 수 있습니다");
    expect(screen.getByRole("button", { name: "비교 추가" })).toBeInTheDocument();
  });

  it("상세 화면에서는 GNB의 카탈로그를 현재 위치로 표시한다", async () => {
    renderApp("/references/ref-a");
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    expect(within(nav).getByRole("link", { name: "카탈로그" })).toHaveAttribute("aria-current", "page");
  });
});
