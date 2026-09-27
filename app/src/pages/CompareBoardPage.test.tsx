import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CompareBoardError } from "../data/compareBoardRepository";
import { createMemoryCompareBoardRepository, type MemoryCompareBoardOptions } from "../data/memoryCompareBoardRepository";
import type { Picks } from "../domain/compareBoard";
import { derivePalette } from "../domain/palette";
import { SECTION_LIBRARY, type SectionLibrary } from "../domain/sectionLibrary";
import { COMPARE_LIMIT_NOTICE } from "../features/compare/compareTray";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { referenceFixtures } from "../fixtures/references";
import { deferred } from "../test/deferred";
import { FIXTURE_CATALOG, LOW_CONTRAST_PRIMARY, UNLISTED_FONT, boardOf, catalogWithFont, catalogWithdrawing } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const THREE = ["ref-a", "ref-b", "ref-c"];
const SIX = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"];
const references = () => createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);
const boardRepo = (ids: readonly string[] = THREE, picks: Picks = {}, options: Partial<MemoryCompareBoardOptions> = {}) =>
  createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(ids, picks), ...options });

async function openBoard(repo = boardRepo()) {
  const view = renderApp("/compare", references(), repo);
  await screen.findByRole("heading", { level: 1, name: "비교 보드" });
  return { ...view, repo };
}

const pick = (row: string, column: string) => screen.getByRole("button", { name: `${row}: ${column}의 요소 선택` });
const allPicks = () => screen.queryAllByRole("button", { name: /의 요소 선택$/ });
const status = () => screen.getByRole("status", { name: "선택 알림" });
const draftItem = (label: string) => within(screen.getByRole("list", { name: "초안 항목" })).getByRole("listitem", { name: label });
const confirmButton = () => screen.getByRole("button", { name: /확정 \(v\d\)$/ });
const savedBoard = async (repo: ReturnType<typeof boardRepo>) => (await repo.getBoard()).board;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("진입·빈 보드 (S-01·S-03·A-7)", () => {
  it("AC-20: document.title이 '비교 보드 · …'이고 포커스가 h1", async () => {
    await openBoard();
    expect(document.title).toBe("비교 보드 · Design Studio");
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "비교 보드" })).toHaveFocus());
  });

  it("AC-01: 0개면 빈 상태 제목과 '카탈로그에서 고르기'가 있고 표·확정 버튼이 없다", async () => {
    const { router } = await openBoard(boardRepo([]));
    expect(screen.getByRole("heading", { name: "비교할 레퍼런스가 없습니다" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /확정/ })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "카탈로그에서 고르기" }));
    expect(router.state.location.pathname).toBe("/catalog");
  });

  it("AC-02: 1개면 열 1개, 행 선택 버튼 0개, '하나 더 담으면' 안내, '이 레퍼런스로 프로필 만들기'로 확정 가능", async () => {
    await openBoard(boardRepo(["ref-a"]));
    expect(screen.getAllByRole("columnheader")).toHaveLength(1);
    expect(allPicks()).toHaveLength(0);
    expect(screen.getByText(/하나 더 담으면 항목별로 골라 조합할 수 있습니다/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /^이 레퍼런스로 프로필 만들기/ }));
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
  });

  it("AC-03(화면): 3개면 columnheader 3개 + rowheader 12개", async () => {
    await openBoard();
    expect(screen.getByRole("table", { name: "레퍼런스 3개, 비교 항목 12개" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(3);
    expect(screen.getAllByRole("rowheader")).toHaveLength(12);
  });

  it("S-02: 불러오기에 실패하면 alert + 다시 시도로 복구", async () => {
    const repo = boardRepo();
    const getBoard = vi.spyOn(repo, "getBoard");
    // 트레이의 진입 조회·재동기화가 먼저 2번 부르고, 3번째가 화면의 조회다
    getBoard.mockRejectedValueOnce(new Error("네트워크")).mockRejectedValueOnce(new Error("네트워크")).mockRejectedValueOnce(new Error("네트워크"));
    renderApp("/compare", references(), repo);
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("비교 보드를 불러오지 못했습니다");
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByRole("table")).toBeInTheDocument();
  });
});

describe("선택 (P-1·P-2·A-4)", () => {
  it("AC-04: B 열 Hero를 누르면 선택됨, 초안 Hero 출처 B, 알림 'Hero 구성: B 선택'", async () => {
    await openBoard();
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    expect(pick("Hero 구성", "B 프리미엄 헤어살롱")).toHaveAttribute("aria-pressed", "true");
    expect(pick("Hero 구성", "B 프리미엄 헤어살롱")).toHaveTextContent("선택됨");
    expect(draftItem("Hero 구성")).toHaveTextContent("B · 프리미엄 헤어살롱");
    expect(status()).toHaveTextContent("Hero 구성: B 선택");
  });

  it("AC-05: Hero가 B일 때 C를 누르면 B는 해제, C 선택, 알림 'Hero 구성: B → C'", async () => {
    await openBoard(boardRepo(THREE, { hero: "ref-b" }));
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    expect(pick("Hero 구성", "B 프리미엄 헤어살롱")).toHaveAttribute("aria-pressed", "false");
    expect(pick("Hero 구성", "C 동네 치과 클리닉")).toHaveAttribute("aria-pressed", "true");
    expect(status()).toHaveTextContent("Hero 구성: B → C");
  });

  it("AC-06: 선택된 C를 다시 누르면 해제, 초안 Hero 'Hero를 먼저 고르세요', 확정 aria-disabled + 이유", async () => {
    await openBoard(boardRepo(THREE, { hero: "ref-c", card: "ref-b" }));
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    expect(pick("Hero 구성", "C 동네 치과 클리닉")).toHaveAttribute("aria-pressed", "false");
    expect(draftItem("Hero 구성")).toHaveTextContent("Hero를 먼저 고르세요");
    expect(confirmButton()).toHaveAttribute("aria-disabled", "true");
    expect(confirmButton()).toHaveAccessibleDescription("Hero를 하나 고르면 확정할 수 있습니다");
    // A-8: 누르면 이유를 알림 영역에 다시 읽힌다
    await userEvent.click(confirmButton());
    expect(status()).toHaveTextContent("Hero를 하나 고르면 확정할 수 있습니다");
  });

  it("AC-07: A 열 '전부 선택'이면 선택 가능한 10행이 모두 A이고 확정 결과 section_plan이 A의 sectionPlan과 같다", async () => {
    const repo = boardRepo();
    const { router } = await openBoard(repo);
    await userEvent.click(screen.getAllByRole("button", { name: /^이 레퍼런스로 전부 선택/ })[0]!);
    const pressed = allPicks().filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(10);
    expect(pressed.every((b) => /A 모던 카페 브랜드/.test(b.getAttribute("aria-label") ?? ""))).toBe(true);
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    const [v1] = await repo.getProfileVersions("profile-1");
    expect(v1!.base.section_plan).toEqual(referenceComparisonAttributes["ref-a"]!.sectionPlan);
  });

  it("P-5: 다른 열 선택을 덮어쓰면 '기존 선택 N개를 A로 바꿨습니다 · 되돌리기'", async () => {
    await openBoard(boardRepo(THREE, { hero: "ref-b", card: "ref-b" }));
    await userEvent.click(screen.getAllByRole("button", { name: /^이 레퍼런스로 전부 선택/ })[0]!);
    expect(screen.getByText("기존 선택 2개를 A로 바꿨습니다", { ignore: "[role=status] *" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "되돌리기" }));
    expect(pick("Hero 구성", "B 프리미엄 헤어살롱")).toHaveAttribute("aria-pressed", "true");
    expect(pick("메뉴 구조", "A 모던 카페 브랜드")).toHaveAttribute("aria-pressed", "false");
  });

  it("AC-09(화면): Hero=A만 고르면 나머지 9개 항목이 A 값 + '기본값'", async () => {
    await openBoard(boardRepo(THREE, { hero: "ref-a" }));
    const items = within(screen.getByRole("list", { name: "초안 항목" })).getAllByRole("listitem");
    expect(items.filter((li) => /기본값 · A/.test(li.textContent ?? ""))).toHaveLength(9);
  });
});

describe("열 빼기 (P-7·A-6)", () => {
  it("AC-08: Hero=A·카드=B에서 B를 빼면 카드 선택 해제, 알림, A·C 열 문자는 그대로 — 다음 선택도 저장된다", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a", card: "ref-b" });
    await openBoard(repo);
    await userEvent.click(screen.getByRole("button", { name: "프리미엄 헤어살롱 비교에서 빼기" }));
    await waitFor(() => expect(status()).toHaveTextContent("B를 빼서 카드 선택 해제"));
    const headers = screen.getAllByRole("columnheader");
    expect(headers.map((h) => h.textContent?.charAt(0))).toEqual(["A", "C"]);
    expect(draftItem("카드 스타일")).toHaveTextContent("기본값 · A");
    // 빼기 뒤 포커스는 다음 열의 빼기 버튼 (A-6)
    expect(screen.getByRole("button", { name: "동네 치과 클리닉 비교에서 빼기" })).toHaveFocus();
    await userEvent.click(pick("모션", "C 동네 치과 클리닉"));
    await waitFor(async () => expect((await savedBoard(repo)).picks).toEqual({ hero: "ref-a", motion: "ref-c" }));
  });

  it("S-08 1.3: 카탈로그에서 뺀 열의 해제 안내는 보드로 돌아왔을 때 한 번만 보인다", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a", card: "ref-b" });
    const { router } = renderApp("/catalog", references(), repo);
    const tray = await screen.findByRole("region", { name: "비교 트레이" });
    await userEvent.click(await within(tray).findByRole("button", { name: "프리미엄 헤어살롱 비교에서 제거" }));
    await waitFor(async () => expect((await savedBoard(repo)).columns).toHaveLength(2));
    await userEvent.click(within(tray).getByRole("button", { name: "비교 보드 열기" }));
    expect(router.state.location.pathname).toBe("/compare");
    expect(await screen.findByText("B를 빼서 카드 선택 해제")).toBeInTheDocument();
    await act(() => router.navigate("/catalog"));
    await act(() => router.navigate("/compare"));
    await screen.findByRole("table");
    expect(screen.queryByText("B를 빼서 카드 선택 해제")).not.toBeInTheDocument();
  });
});

describe("경고 (R-07·R-08·R-12) · 사용자 스타일", () => {
  it("AC-11(화면): 모션 '높음'(D) → 정보 Callout, 확정된 motion_preset은 L2", async () => {
    const repo = boardRepo(["ref-a", "ref-d"], { hero: "ref-a" });
    await openBoard(repo);
    await userEvent.click(pick("모션", "B 필라테스 스튜디오"));
    expect(screen.getByRole("heading", { level: 3, name: "모션 상한 적용" })).toBeInTheDocument();
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(async () => expect((await repo.getProfileVersions("profile-1"))[0]?.base.motion_preset).toBe("L2"));
  });

  it("AC-12·AC-24: 낮은 대비 대표색 → 수치·보정값 쓰기, 확정 가능, 저장된 color_tokens는 역할 팔레트 전체이고 보드가 계산한 색과 같다", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a" });
    const { router } = await openBoard(repo);
    await userEvent.type(screen.getByRole("textbox", { name: "대표색" }), LOW_CONTRAST_PRIMARY);
    await userEvent.tab();
    const callout = screen.getByRole("heading", { level: 3, name: "대비 부족" }).closest("[data-tone]") as HTMLElement;
    expect(callout).toHaveTextContent(/\d\.\d:1/);
    expect(within(callout).getByRole("button", { name: "보정값 쓰기" })).toBeInTheDocument();
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    const [v1] = await repo.getProfileVersions("profile-1");
    const palette = derivePalette(LOW_CONTRAST_PRIMARY, referenceDetailFixtures["ref-a"]!.palette);
    expect(Object.keys(v1!.base.color_tokens).filter((k) => !k.startsWith("$")).sort()).toEqual(["bg", "ink", "muted", "primary", "surface"]);
    for (const { role, hex } of palette) expect(v1!.base.color_tokens[role].$value).toBe(hex);
  });

  it("AC-12: '보정값 쓰기'를 누르면 대표색 입력이 보정 hex로 바뀌고 대비 경고가 사라진다", async () => {
    await openBoard(boardRepo(THREE, { hero: "ref-a" }));
    const input = screen.getByRole("textbox", { name: "대표색" });
    await userEvent.type(input, LOW_CONTRAST_PRIMARY);
    await userEvent.tab();
    await userEvent.click(screen.getByRole("button", { name: "보정값 쓰기" }));
    expect(input).not.toHaveValue(LOW_CONTRAST_PRIMARY);
    expect((input as HTMLInputElement).value).toMatch(/^#[0-9A-F]{6}$/);
    expect(screen.queryByRole("heading", { level: 3, name: "대비 부족" })).not.toBeInTheDocument();
  });

  it("AC-13(화면): Footer=B(미니멀)이면 R-12 경고, 'C의 Footer로 바꾸기'를 누르면 Footer가 C", async () => {
    await openBoard(boardRepo(THREE, { hero: "ref-a", footer: "ref-b" }));
    expect(screen.getByRole("heading", { level: 3, name: "사업자정보 푸터 필요" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "C의 Footer로 바꾸기" }));
    expect(pick("Footer", "C 동네 치과 클리닉")).toHaveAttribute("aria-pressed", "true");
  });

  it("AC-14(화면): 대표색 'abc'는 저장되지 않고 aria-invalid", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a" });
    await openBoard(repo);
    const input = screen.getByRole("textbox", { name: "대표색" });
    await userEvent.type(input, "abc");
    await userEvent.tab();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect((await savedBoard(repo)).custom).toEqual({});
  });
});

describe("회수·한도·권리 경계", () => {
  it("AC-15: 회수된 B는 '사용 불가', 선택 버튼 0개, B에서 고른 선택은 해제되고 경고 Callout", async () => {
    const repo = createMemoryCompareBoardRepository({ catalog: catalogWithdrawing("ref-b"), initialBoard: boardOf(THREE, { hero: "ref-a", card: "ref-b" }) });
    await openBoard(repo);
    expect(screen.getAllByRole("columnheader")[1]).toHaveTextContent("사용 불가");
    expect(screen.queryAllByRole("button", { name: /B 프리미엄 헤어살롱의 요소 선택$/ })).toHaveLength(0);
    expect(screen.getByText("B가 회수되어 카드 선택을 해제했습니다")).toBeInTheDocument();
    expect(draftItem("카드 스타일")).toHaveTextContent("기본값 · A");
  });

  it("AC-16: 6개면 '가득 참', '레퍼런스 추가'는 이동하지 않고 알림 영역에 한도 안내", async () => {
    const { router } = await openBoard(boardRepo(SIX));
    expect(screen.getByText(/6 \/ 6개 · 가득 참/)).toBeInTheDocument();
    const add = screen.getByRole("button", { name: "레퍼런스 추가" });
    expect(add).toHaveAttribute("aria-disabled", "true");
    await userEvent.click(add);
    expect(router.state.location.pathname).toBe("/compare");
    expect(status()).toHaveTextContent(COMPARE_LIMIT_NOTICE);
  });

  it("FIX-R1: 가득 찬 '레퍼런스 추가'는 확정 버튼과 같은 비활성 스타일(aria-disabled 토큰 클래스)", async () => {
    await openBoard(boardRepo(SIX));
    const disabledStyle = (el: HTMLElement) => [...el.classList].filter((c) => c.startsWith("aria-disabled:"));
    expect(disabledStyle(confirmButton()).length).toBeGreaterThan(0);
    expect(disabledStyle(screen.getByRole("button", { name: "레퍼런스 추가" }))).toEqual(disabledStyle(confirmButton()));
  });

  it("AC-22: URL 입력 필드가 없고 '레퍼런스 추가'는 /catalog로만 간다", async () => {
    const { router } = await openBoard();
    expect(document.querySelectorAll('input[type="url"]')).toHaveLength(0);
    expect(screen.getAllByRole("textbox").map((t) => t.getAttribute("aria-label") ?? t.closest("label")?.textContent)).toEqual(["대표색"]);
    await userEvent.click(screen.getByRole("button", { name: "레퍼런스 추가" }));
    expect(router.state.location.pathname).toBe("/catalog");
  });

  it("AC-26: B Footer 변형이 현재 라이브러리에 없으면 '현재 라이브러리에 없는 변형', 선택 버튼 없음, library_version은 getComparison 값", async () => {
    const footers = Object.fromEntries(Object.entries(SECTION_LIBRARY.sections.footer).filter(([variant]) => variant !== "minimal"));
    const library: SectionLibrary = { ...SECTION_LIBRARY, version: "2.0", sections: { ...SECTION_LIBRARY.sections, footer: footers } };
    const repo = boardRepo(THREE, { hero: "ref-a" }, { library });
    const { router } = await openBoard(repo);
    const footerRow = screen.getByRole("rowheader", { name: /^Footer/ }).closest("tr")!;
    const cells = within(footerRow).getAllByRole("cell");
    expect(cells[1]).toHaveTextContent("현재 라이브러리에 없는 변형");
    expect(within(cells[1]!).queryByRole("button")).not.toBeInTheDocument();
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    const { libraryVersion } = await repo.getComparison(THREE);
    expect((await repo.getProfileVersions("profile-1"))[0]!.base.library_version).toBe(libraryVersion);
  });

  it("D1: 허용 목록 밖 폰트 셀은 '라이선스 확인 중'이고 선택 버튼이 없다", async () => {
    await openBoard(createMemoryCompareBoardRepository({ catalog: catalogWithFont("ref-b"), initialBoard: boardOf(THREE) }));
    const fontRow = screen.getByRole("rowheader", { name: /^폰트/ }).closest("tr")!;
    const b = within(fontRow).getAllByRole("cell")[1]!;
    expect(b).toHaveTextContent(`${UNLISTED_FONT} 700 / 400 · 라이선스 확인 중`);
    expect(within(b).queryByRole("button")).not.toBeInTheDocument();
  });
});

describe("저장·확정 (S-12~S-17)", () => {
  it("AC-17: '프로필 확정 (v1)'을 연타해도 confirmProfile은 1회, 성공하면 /profile/:id", async () => {
    const gate = deferred();
    const repo = boardRepo(THREE, { hero: "ref-a" }, {
      delay: (call) => (call.method === "confirmProfile" && call.phase === "response" ? gate.promise : undefined),
    });
    const confirm = vi.spyOn(repo, "confirmProfile");
    const { router } = await openBoard(repo);
    const button = confirmButton();
    await userEvent.dblClick(button);
    await userEvent.click(button);
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(pick("Hero 구성", "B 프리미엄 헤어살롱")).toHaveAttribute("aria-disabled", "true");
    await act(async () => gate.resolve());
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("AC-18: 선택 5개 → 초안 비우기 → 0개 + 포커스가 되돌리기 → 되돌리면 5개 복원", async () => {
    await openBoard(boardRepo(THREE, { hero: "ref-a", menu: "ref-b", cta: "ref-c", card: "ref-b", footer: "ref-c" }));
    const pressedCount = () => allPicks().filter((b) => b.getAttribute("aria-pressed") === "true").length;
    expect(pressedCount()).toBe(5);
    await userEvent.click(screen.getByRole("button", { name: "초안 비우기" }));
    expect(pressedCount()).toBe(0);
    expect(screen.getByText("선택 5개를 비웠습니다", { ignore: "[role=status] *" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "되돌리기" })).toHaveFocus();
    await userEvent.click(screen.getByRole("button", { name: "되돌리기" }));
    expect(pressedCount()).toBe(5);
  });

  it("AC-23: 저장이 끝나기 전 확정은 막히고(이유 '선택을 저장하는 중입니다'), 저장 뒤 확정은 B가 반영된 revision으로 호출된다", async () => {
    const gate = deferred();
    const repo = boardRepo(THREE, { hero: "ref-a" }, {
      delay: (call) => (call.method === "savePicks" && call.phase === "response" ? gate.promise : undefined),
    });
    const confirm = vi.spyOn(repo, "confirmProfile");
    await openBoard(repo);
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    expect(screen.getByText("저장 중…")).toBeInTheDocument();
    expect(confirmButton()).toHaveAttribute("aria-disabled", "true");
    expect(confirmButton()).toHaveAccessibleDescription("선택을 저장하는 중입니다");
    await userEvent.click(confirmButton());
    expect(confirm).not.toHaveBeenCalled();
    await act(async () => gate.resolve());
    await waitFor(() => expect(screen.getByText("저장됨")).toBeInTheDocument());
    const saved = await savedBoard(repo);
    expect(saved.picks.hero).toBe("ref-b");
    await userEvent.click(confirmButton());
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(saved.revision, 0));
  });

  it("S-12: 저장에 실패하면 '저장하지 못했습니다 · 다시 시도'(alert), 다시 시도하면 저장된다", async () => {
    let failOnce = true;
    const repo = boardRepo(THREE, {}, {
      fail: (call) => {
        if (call.method !== "savePicks" || !failOnce) return undefined;
        failOnce = false;
        return new Error("네트워크");
      },
    });
    await openBoard(repo);
    await userEvent.click(pick("Hero 구성", "A 모던 카페 브랜드"));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("저장하지 못했습니다");
    expect(confirmButton()).toHaveAccessibleDescription("저장하지 못한 선택이 있습니다 · 다시 시도");
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    await waitFor(async () => expect((await savedBoard(repo)).picks).toEqual({ hero: "ref-a" }));
    expect(await screen.findByText("저장됨")).toBeInTheDocument();
  });

  it("S-14: 확정 오류(STALE_BOARD)면 최신 보드를 다시 받아 표시하고 안내한다", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a" });
    const latest = boardOf(THREE, { hero: "ref-c" }, { revision: 9 });
    vi.spyOn(repo, "confirmProfile").mockRejectedValueOnce(new CompareBoardError("STALE_BOARD", "revision", latest));
    await openBoard(repo);
    await userEvent.click(confirmButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("다른 곳에서 바뀐 선택을 불러왔습니다. 확인 후 다시 확정하세요");
    expect(pick("Hero 구성", "C 동네 치과 클리닉")).toHaveAttribute("aria-pressed", "true");
  });

  it("AC-25·S-15·S-16: v1 확정 뒤 돌아와 선택을 바꾸면 '새 버전으로 확정 (v2)' → 같은 프로필의 새 버전, v1은 그대로", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a" });
    const createVersion = vi.spyOn(repo, "createProfileVersion");
    const { router } = await openBoard(repo);
    await userEvent.click(confirmButton());
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    const v1 = (await repo.getProfileVersions("profile-1"))[0]!;
    await act(() => router.navigate("/compare"));
    expect(await screen.findByText("v1 확정됨")).toBeInTheDocument();
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(screen.getByText("v1 이후 변경됨")).toBeInTheDocument());
    await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v2)" })).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(screen.getByRole("button", { name: "새 버전으로 확정 (v2)" }));
    await waitFor(() => expect(createVersion).toHaveBeenCalledWith("profile-1", expect.any(Number), 1));
    const versions = await repo.getProfileVersions("profile-1");
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
    expect(versions[0]).toEqual(v1);
  });

  it("S-15(FIX-R1): v1 확정 뒤 바뀐 내용이 없으면 '새 버전으로 확정 (v2)'는 aria-disabled + 이유, 눌러도 새 버전을 만들지 않는다", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a" });
    const createVersion = vi.spyOn(repo, "createProfileVersion");
    const confirm = vi.spyOn(repo, "confirmProfile");
    const { router } = await openBoard(repo);
    await userEvent.click(confirmButton());
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    await act(() => router.navigate("/compare"));
    expect(await screen.findByText("v1 확정됨")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "새 버전으로 확정 (v2)" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("확정한 뒤 바뀐 내용이 없습니다");
    await userEvent.click(button);
    expect(createVersion).not.toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("S-15·S-16(FIX-R1): v1 뒤 B로 바꿨다 A로 되돌리면 확정한 선택과 같아 막히고, 다시 B로 바꾸면 새 버전 1회", async () => {
    const repo = boardRepo(THREE, { hero: "ref-a" });
    const createVersion = vi.spyOn(repo, "createProfileVersion");
    const { router } = await openBoard(repo);
    await userEvent.click(confirmButton());
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"));
    await act(() => router.navigate("/compare"));
    await screen.findByText("v1 확정됨");
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    await userEvent.click(pick("Hero 구성", "A 모던 카페 브랜드"));
    await waitFor(async () => expect((await savedBoard(repo)).picks).toEqual({ hero: "ref-a" }));
    await waitFor(() => expect(confirmButton()).toHaveAccessibleDescription("확정한 뒤 바뀐 내용이 없습니다"));
    expect(screen.getByText("v1 확정됨")).toBeInTheDocument();
    await userEvent.click(confirmButton());
    expect(createVersion).not.toHaveBeenCalled();
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(createVersion).toHaveBeenCalledTimes(1));
  });
});

describe("Codex R1 회귀", () => {
  it("Codex R1 [P1]: 확정 실패 안내의 '다시 시도'는 지금의 저장 상태로 검사한다 — 저장 중이면 확정하지 않는다", async () => {
    const gate = deferred();
    const repo = boardRepo(THREE, { hero: "ref-a" }, {
      delay: (call) => (call.method === "savePicks" && call.phase === "response" ? gate.promise : undefined),
    });
    const confirm = vi.spyOn(repo, "confirmProfile").mockRejectedValueOnce(new Error("네트워크"));
    await openBoard(repo);
    await userEvent.click(confirmButton());
    await screen.findByRole("alert");
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    expect(screen.getByText("저장 중…")).toBeInTheDocument();
    await userEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "다시 시도" }));
    expect(confirm).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(status()).toHaveTextContent("선택을 저장하는 중입니다"));
    await act(async () => gate.resolve());
  });

  it("Codex R1 [P2]: 카탈로그에서 추가한 직후 보드로 가면 추가가 끝난 뒤의 보드를 조회한다", async () => {
    const gate = deferred();
    const repo = boardRepo(THREE, {}, {
      delay: (call) => (call.method === "addReference" && call.phase === "request" ? gate.promise : undefined),
    });
    const { router } = renderApp("/catalog", references(), repo);
    await userEvent.click(await screen.findByRole("button", { name: "필라테스 스튜디오 비교 추가" }));
    await act(() => router.navigate("/compare"));
    await act(async () => gate.resolve());
    expect(await screen.findByRole("table", { name: "레퍼런스 4개, 비교 항목 12개" })).toBeInTheDocument();
  });

  it("Codex R1 [P2]: 저장 중 열을 빼고 앞 저장이 STALE로 서버 선택에 맞춰지면 서버 선택 기준으로 뺀다", async () => {
    const gate = deferred();
    const repo = boardRepo(THREE, { hero: "ref-a" }, {
      delay: (call) => (call.method === "savePicks" && call.seq === 1 && call.phase === "request" ? gate.promise : undefined),
    });
    await openBoard(repo);
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    // 화면 저장이 도착하기 전에 다른 곳에서 먼저 저장한다 — 서버 선택 Hero=C·카드=B
    await repo.savePicks({ hero: "ref-c", card: "ref-b" }, {}, (await savedBoard(repo)).revision);
    await userEvent.click(screen.getByRole("button", { name: "프리미엄 헤어살롱 비교에서 빼기" }));
    await act(async () => gate.resolve());
    await waitFor(async () => expect((await savedBoard(repo)).columns.map((c) => c.referenceId)).toEqual(["ref-a", "ref-c"]));
    await waitFor(() => expect(pick("Hero 구성", "C 동네 치과 클리닉")).toHaveAttribute("aria-pressed", "true"));
    await waitFor(async () => expect((await savedBoard(repo)).picks).toEqual({ hero: "ref-c" }));
  });
});

describe("진입 경로 (단계 6)", () => {
  it("카탈로그 트레이의 '비교 보드 열기'는 /compare로 간다", async () => {
    const { router } = renderApp("/catalog", references(), boardRepo(["ref-a"]));
    const tray = await screen.findByRole("region", { name: "비교 트레이" });
    await userEvent.click(within(tray).getByRole("button", { name: "비교 보드 열기" }));
    expect(router.state.location.pathname).toBe("/compare");
    expect(await screen.findByRole("heading", { level: 1, name: "비교 보드" })).toBeInTheDocument();
  });
});
