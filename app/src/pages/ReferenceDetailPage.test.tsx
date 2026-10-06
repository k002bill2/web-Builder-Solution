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
const infoPanel = () => screen.getByRole("region", { name: "레퍼런스 정보" });
const refA = referenceFixtures[0]!;
const detailA = referenceDetailFixtures["ref-a"]!;

describe("ReferenceDetailPage (2a-02 v2, FR-CAT-03)", () => {
  it("필수 영역을 모두 보여준다: 뒤로·미리보기 폭·미리보기·정보 패널(제목·메타·점수·태그·섹션·토큰·액션)·아래 영역", async () => {
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

  it("탭이 없고, 섹션 구성·토큰 요약이 정보 패널에 항상 보인다 (V2-AC-27)", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("tabpanel")).not.toBeInTheDocument();

    const info = infoPanel();
    expect(within(info).getByRole("heading", { level: 1, name: "모던 카페 브랜드" })).toBeInTheDocument();
    expect(within(info).getByRole("heading", { name: "섹션 구성 · 8개" })).toBeInTheDocument();
    const sections = within(within(info).getByRole("list", { name: "섹션 구성" })).getAllByRole("listitem");
    expect(sections.map((li) => li.textContent)).toEqual(
      detailA.sections.map((s, i) => `${String(i + 1).padStart(2, "0")}${s.name}${s.variant}`),
    );
    // 순번은 label-alternative (A11Y-01 3절 #7)
    expect(within(sections[0]!).getByText("01")).toHaveClass("text-label-alternative");

    expect(within(info).getByRole("heading", { name: "토큰 요약" })).toBeInTheDocument();
    // 견본 4칸 = 목업 순서(대표·면·글자·배경) — muted는 견본에 넣지 않는다
    const swatchHexes = (["primary", "surface", "ink", "bg"] as const).map((role) => detailA.palette.find((c) => c.role === role)!.hex);
    expect(swatchHexes).not.toContain(detailA.palette.find((c) => c.role === "muted")!.hex);
    const palette = within(info).getByRole("img", { name: `팔레트 ${swatchHexes.join(" · ")}` });
    expect(palette.children).toHaveLength(4);
    expect(within(info).getByText(swatchHexes.join(" · "))).toBeInTheDocument();
    // 기존 TokensPanel의 폰트·간격·모션·대비 값을 한 줄에 합친다
    expect(
      within(info).getByText("Pretendard 700/400 · 스케일 1.25 · 8pt · 섹션 간격 96px · 페이드 200ms · 본문 대비 7.2:1"),
    ).toBeInTheDocument();
  });

  it("미리보기 폭을 모바일로 바꿔도 섹션 구성·토큰 요약은 그대로 보인다 (V2-AC-27)", async () => {
    renderApp("/references/ref-a?view=mobile");
    await heading("모던 카페 브랜드");
    expect(within(infoPanel()).getByRole("heading", { name: "섹션 구성 · 8개" })).toBeInTheDocument();
    expect(within(infoPanel()).getByRole("heading", { name: "토큰 요약" })).toBeInTheDocument();
  });

  it("점수 3칸(접근성·성능·모션) — 숫자는 status-*-text 굵기 700 (V2-AC-30 · D-A11Y-N1)", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    const scores = screen.getByRole("region", { name: "점수" });
    for (const label of ["접근성", "성능", "모션"]) expect(within(scores).getByText(label)).toBeInTheDocument();
    for (const value of ["96", "92"]) {
      expect(within(scores).getByText(value)).toHaveClass("text-status-positive-text", "font-bold");
    }
    expect(within(scores).getByText("낮음")).toHaveClass("font-bold");
  });

  it("콘셉트·목적 태그는 버튼이 아니다 — 비대화형 Tag (V2-AC-31 · C-11)", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    for (const tag of ["미니멀", "따뜻한", "예약 유도", "모션 낮음"]) {
      const el = within(infoPanel()).getByText(tag);
      expect(el.closest("button, a, [role='button'], [tabindex]:not([tabindex='-1'])")).toBeNull();
      expect(screen.queryByRole("button", { name: tag })).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox", { name: tag })).not.toBeInTheDocument();
    }
  });

  it("콘셉트 태그 톤: 앞 둘만 violet, 나머지 중립, blue/orange 없음 — 의미는 글자로 (VISUAL-V2-APPLY 5, REPORT 1.3)", async () => {
    const threeTags: DesignReference = { ...refA, id: "ref-t", key: "T", title: "태그 셋 카페", visualTags: ["minimal", "warm", "bold"] };
    renderApp(
      "/references/ref-t",
      createMemoryReferenceRepository([...referenceFixtures, threeTags], { ...referenceDetailFixtures, "ref-t": detailA }),
    );
    await heading("태그 셋 카페");
    const panel = within(infoPanel());
    const tags = ["미니멀", "따뜻한", "대담한"].map((label) => panel.getByText(label));
    for (const tag of tags) expect(tag.className).not.toMatch(/accent-(blue|orange)/);
    expect(tags[0]).toHaveClass("text-accent-violet", "bg-accent-violet-bg");
    expect(tags[1]).toHaveClass("text-accent-violet", "bg-accent-violet-bg");
    expect(tags[2]).toHaveClass("text-label-neutral", "bg-fill-strong");
  });

  it("데스크톱(lg 2단)에서 주요 행동 묶음은 패널 바닥(lg:mt-auto), 모바일 흐름은 그대로 (VISUAL-V2-APPLY 5, REPORT 1.3)", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    expect(infoPanel()).toHaveClass("flex", "flex-col");
    const group = within(infoPanel()).getByRole("button", { name: "템플릿으로 가져오기" }).parentElement!;
    expect(group).toHaveClass("lg:mt-auto");
    expect(group).not.toHaveClass("mt-auto");
    expect(infoPanel().lastElementChild).toBe(group);
  });

  it("DOM 순서 = 보이는 순서: 뒤로 → 미리보기 폭 → 미리보기 → 정보 패널(h1) → 아래 영역", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    const ordered = [
      screen.getByRole("navigation", { name: "브레드크럼" }),
      screen.getByRole("radiogroup", { name: "미리보기 폭" }),
      screen.getByRole("img", { name: /모던 카페 브랜드 미리보기/ }),
      screen.getByRole("heading", { level: 1, name: "모던 카페 브랜드" }),
      screen.getByRole("region", { name: "유사 레퍼런스" }),
      screen.getByRole("heading", { name: "점수 이력" }),
    ];
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i - 1]!.compareDocumentPosition(ordered[i]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
  });

  it("아래 영역: 유사 레퍼런스 3그룹(각 ≤ 6)과 점수 이력이 탭 없이 보인다 (V2-AC-29 · C-07)", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    const similar = screen.getByRole("region", { name: "유사 레퍼런스" });
    const groups = within(similar).getAllByRole("list");
    expect(groups).toHaveLength(3);
    for (const g of groups) expect(within(g).getAllByRole("listitem").length).toBeLessThanOrEqual(6);

    const history = screen.getByRole("region", { name: "점수 이력" });
    expect(within(history).getByRole("table")).toBeInTheDocument();
    expect(within(history).getByText("2026.09.20")).toBeInTheDocument();
    expect(within(history).getByText("Lighthouse 12")).toBeInTheDocument();
  });
});

describe("미리보기 폭 (V2-AC-28)", () => {
  const radio = (name: string) => within(screen.getByRole("radiogroup", { name: "미리보기 폭" })).getByRole("radio", { name });

  it("radiogroup '미리보기 폭'(데스크톱·태블릿·모바일), 기본 데스크톱이고 URL에 view를 쓰지 않는다", async () => {
    const { router } = renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    const radios = within(screen.getByRole("radiogroup", { name: "미리보기 폭" })).getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual(["데스크톱", "태블릿", "모바일"]);
    expect(radio("데스크톱")).toHaveAttribute("aria-checked", "true");
    expect(router.state.location.search).toBe("");
    expect(screen.queryByRole("heading", { name: "모바일 구조" })).not.toBeInTheDocument();
  });

  it("폭을 바꾸면 URL view에 남기고, 모바일이면 모바일 와이어프레임과 모바일 구조 설명을 보인다", async () => {
    const { router } = renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");

    await userEvent.click(radio("모바일"));
    expect(search(router).get("view")).toBe("mobile");
    expect(radio("모바일")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("img", { name: /모던 카페 브랜드 미리보기 · 모바일/ })).toBeInTheDocument();
    const mobile = screen.getByRole("region", { name: "모바일 구조" });
    expect(within(mobile).getAllByRole("listitem").map((li) => li.textContent)).toEqual([...detailA.mobileFlow]);

    await userEvent.click(radio("태블릿"));
    expect(search(router).get("view")).toBe("tablet");
    expect(screen.getByRole("img", { name: /모던 카페 브랜드 미리보기 · 태블릿/ })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "모바일 구조" })).not.toBeInTheDocument();

    await userEvent.click(radio("데스크톱"));
    expect(router.state.location.search).toBe("");
  });

  it("새로고침(초기 URL)하면 view를 복원하고, 모르는 값은 데스크톱으로 연다", async () => {
    renderApp("/references/ref-a?view=tablet");
    await heading("모던 카페 브랜드");
    expect(radio("태블릿")).toHaveAttribute("aria-checked", "true");
  });

  it.each(["?view=nope", "?tab=tokens", "?tab=scores", "?tab=nope"])("%s → 데스크톱", async (query) => {
    renderApp(`/references/ref-a${query}`);
    await heading("모던 카페 브랜드");
    expect(radio("데스크톱")).toHaveAttribute("aria-checked", "true");
  });

  it("옛 북마크 ?tab=mobile은 view=mobile로 해석한다 — 모바일 선택 + 모바일 구조 설명", async () => {
    const { router } = renderApp("/references/ref-a?tab=mobile");
    await heading("모던 카페 브랜드");
    expect(radio("모바일")).toHaveAttribute("aria-checked", "true");
    expect(within(screen.getByRole("region", { name: "모바일 구조" })).getByText("하단 고정 CTA")).toBeInTheDocument();

    // 폭을 바꾸면 옛 tab 파라미터는 버리고 view만 남긴다
    await userEvent.click(radio("태블릿"));
    expect(router.state.location.search).toBe("?view=tablet");
  });

  it("view가 있으면 옛 tab보다 view를 따른다", async () => {
    renderApp("/references/ref-a?view=tablet&tab=mobile");
    await heading("모던 카페 브랜드");
    expect(radio("태블릿")).toHaveAttribute("aria-checked", "true");
  });

});

describe("ReferenceDetailPage — 404·이동", () => {
  it("없는 id는 404 안내와 카탈로그 링크를 보여준다", async () => {
    renderApp("/references/ref-zz");
    expect(await heading("레퍼런스를 찾을 수 없습니다")).toBeInTheDocument();
    const back = screen.getByRole("link", { name: "카탈로그로 돌아가기" });
    expect(back).toHaveAttribute("href", "/catalog");
    // 링크 글자는 대비용 primary-text (Q2), hover 유지
    expect(back).toHaveClass("text-primary-text", "hover:text-primary-hover");
    expect(back).not.toHaveClass("text-primary");
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
    const { router } = renderApp("/references/ref-a?view=mobile");
    await heading("모던 카페 브랜드");
    const similar = screen.getByRole("region", { name: "유사 레퍼런스" });
    await userEvent.click(within(similar).getAllByRole("link", { name: "로컬 베이커리" })[0]!);
    expect(await heading("로컬 베이커리")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/references/ref-f");
    expect(screen.queryByRole("heading", { level: 1, name: "모던 카페 브랜드" })).not.toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "데스크톱" })).toHaveAttribute("aria-checked", "true");
    expect(within(screen.getByRole("region", { name: "점수" })).getByText(String(!("status" in referenceFixtures[5]!.scores) && referenceFixtures[5]!.scores.accessibility))).toBeInTheDocument();
  });

  it("유사 레퍼런스의 응답이 늦어도 이전 레퍼런스 내용 대신 로딩 상태를 보인다 (경쟁 상태)", async () => {
    const memory = createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);
    // ref-f 응답만 테스트가 풀어 줄 때까지 붙잡는다
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const held = <T,>(id: string, read: () => Promise<T>) => (id === "ref-f" ? gate.then(read) : read());
    renderApp("/references/ref-a", {
      list: (query) => memory.list(query),
      getById: (id) => held(id, () => memory.getById(id)),
      getDetail: (id) => held(id, () => memory.getDetail(id)),
      getSimilar: (id) => held(id, () => memory.getSimilar(id)),
    });
    await heading("모던 카페 브랜드");
    const similar = screen.getByRole("region", { name: "유사 레퍼런스" });
    await userEvent.click(within(similar).getAllByRole("link", { name: "로컬 베이커리" })[0]!);

    expect(await screen.findByRole("status")).toHaveTextContent("불러오는 중");
    expect(screen.queryByRole("heading", { level: 1, name: "모던 카페 브랜드" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "점수" })).not.toBeInTheDocument();

    release();
    expect(await heading("로컬 베이커리")).toBeInTheDocument();
  });

  it("템플릿으로 가져오기는 다음 단계 안내만 한다", async () => {
    const { router } = renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    await userEvent.click(screen.getByRole("button", { name: "템플릿으로 가져오기" }));
    expect(screen.getByRole("status")).toHaveTextContent("다음 단계");
    expect(screen.queryByRole("link", { name: "보드 열기" })).not.toBeInTheDocument();
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
    // 가득 참에도 빼야 할 열을 고르러 갈 수 있게 "보드 열기" (A11Y-01 8절)
    expect(screen.getByRole("link", { name: "보드 열기" })).toHaveAttribute("href", "/compare");
    expect(screen.getByRole("button", { name: "비교 추가" })).toHaveFocus();
  });

  it("'비교 중'도 outline을 유지하고 check 아이콘 + 글자 '비교 중'으로 구분한다 (SPEC 4.3 · V2-AC-11)", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    const idle = screen.getByRole("button", { name: "비교 추가" });
    const idleClass = idle.className;
    const idleIcon = idle.querySelector("i")?.getAttribute("style");
    expect(idleClass).toContain("border-line-normal");
    await userEvent.click(idle);
    const active = screen.getByRole("button", { name: "비교 중, 비교에서 빼기" });
    expect(active).toHaveTextContent("비교 중");
    expect(active.className).toBe(idleClass);
    expect(active.querySelector("i")?.getAttribute("style")).not.toBe(idleIcon);

    const save = screen.getByRole("button", { name: "저장" });
    const saveClass = save.className;
    expect(save).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(save);
    expect(save).toHaveAttribute("aria-pressed", "true");
    expect(save.className).toBe(saveClass);
  });

  it("비교 추가 성공: '비교 보드에 담았습니다' 알림 + 알림 밖 형제 링크 '보드 열기', 포커스는 버튼에 (D-QA06 · A11Y-AC-17)", async () => {
    renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    const status = screen.getByRole("status");
    // 비어 있어도 접근성 트리에 남는다 — display:none(empty:hidden·hidden) 금지
    expect(status).toBeEmptyDOMElement();
    expect(status.className).not.toMatch(/(^|\s)(empty:)?hidden(\s|$)/);

    await userEvent.click(screen.getByRole("button", { name: "비교 추가" }));
    expect(status).toHaveTextContent("비교 보드에 담았습니다");
    const open = screen.getByRole("link", { name: "보드 열기" });
    expect(open).toHaveAttribute("href", "/compare");
    expect(status).not.toContainElement(open);
    expect(screen.getByRole("button", { name: "비교 중, 비교에서 빼기" })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "비교 중, 비교에서 빼기" }));
    expect(status).toHaveTextContent("비교 보드에서 뺐습니다");
    expect(screen.queryByRole("link", { name: "보드 열기" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "비교 추가" })).toHaveFocus();
  });

  it("'보드 열기'를 누르면 비교 보드로 간다", async () => {
    const { router } = renderApp("/references/ref-a");
    await heading("모던 카페 브랜드");
    await userEvent.click(screen.getByRole("button", { name: "비교 추가" }));
    await userEvent.click(screen.getByRole("link", { name: "보드 열기" }));
    expect(router.state.location.pathname).toBe("/compare");
  });

  it("상세 화면에서는 GNB의 카탈로그를 현재 위치로 표시한다", async () => {
    renderApp("/references/ref-a");
    const nav = await screen.findByRole("navigation", { name: "주 메뉴" });
    expect(within(nav).getByRole("link", { name: "카탈로그" })).toHaveAttribute("aria-current", "page");
  });
});

describe("유사 레퍼런스 긴 이름 (B-DET-02)", () => {
  const LONG_TITLE = "필라테스 스튜디오 리포머 그룹 레슨 강남 본점 예약 안내 페이지";

  it("30자 넘는 이름도 식별할 수 있게 2줄까지 보여 주고 전체 이름을 노출한다", async () => {
    expect(LONG_TITLE.length).toBeGreaterThanOrEqual(30);
    const records = referenceFixtures.map((r) => (r.id === "ref-f" ? { ...r, title: LONG_TITLE } : r));
    renderApp("/references/ref-a", createMemoryReferenceRepository(records, referenceDetailFixtures));
    await heading("모던 카페 브랜드");

    const similar = screen.getByRole("region", { name: "유사 레퍼런스" });
    const links = within(similar).getAllByRole("link", { name: LONG_TITLE });
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      // 2줄을 넘는 경우를 위해 포인터 툴팁으로도 전체 이름을 준다
      expect(link).toHaveAttribute("title", LONG_TITLE);
      const name = within(link).getByText(LONG_TITLE);
      expect(name).toHaveClass("line-clamp-2");
      expect(name).not.toHaveClass("truncate");
    }
  });
});
