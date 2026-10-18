/**
 * M3-1 추천 화면 (RECO-SPEC 3절 · RECO-AC-08~13·16) — `/catalog?tab=rec`. 후보는 생성 레퍼런스 포함 21개(실제 카드 로더).
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, onTestFinished, vi } from "vitest";
import type { CompareBoardRepository } from "../data/compareBoardRepository";
import { createMemoryCompareBoardRepository, type MemoryCompareBoardOptions } from "../data/memoryCompareBoardRepository";
import { COMPARE_LIMIT_NOTICE } from "../features/compare/compareTray";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const T_REC_01 = "/catalog?tab=rec&industry=medical&purpose=booking&audience=family";
const WRITES = ["addReference", "removeReference", "savePicks", "confirmProfile", "createProfileVersion"] as const;

function spiedBoard(options: Partial<MemoryCompareBoardOptions> = {}) {
  const repo = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a"], { hero: "ref-a" }), ...options });
  const spies = Object.fromEntries(WRITES.map((m) => [m, vi.spyOn(repo, m)])) as Record<(typeof WRITES)[number], ReturnType<typeof vi.spyOn>>;
  const writes = () => WRITES.reduce((n, m) => n + spies[m].mock.calls.length, 0);
  return { repo: repo as CompareBoardRepository, spies, writes };
}

const results = () => screen.findByRole("region", { name: "추천 결과" });
const cards = async () => within(await results()).findAllByRole("article");

describe("추천 화면 (RECO-SPEC 3.2·3.4)", () => {
  it("T-REC-01 브리프: 카드 3장(1~3위·총점·근거 요약) + '추천 2개 더 보기'로 4·5위", async () => {
    renderApp(T_REC_01);
    expect(await screen.findByRole("heading", { level: 1, name: "추천" })).toBeInTheDocument();
    await waitFor(async () => expect(await cards()).toHaveLength(3));
    const first = (await cards())[0]!;
    expect(within(first).getByText("1위")).toBeInTheDocument();
    expect(within(first).getByText(/^\d+점$/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "추천 2개 더 보기" }));
    expect(await cards()).toHaveLength(5);
    expect(within((await cards())[4]!).getByText("5위")).toBeInTheDocument();
  });

  it("근거 펼치기는 aria-expanded 버튼 + 7항목 목록, 포커스는 버튼에 머문다", async () => {
    renderApp(T_REC_01);
    const first = (await cards())[0]!;
    const toggle = within(first).getByRole("button", { name: "근거 펼치기" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveFocus();
    const list = document.getElementById(toggle.getAttribute("aria-controls")!)!;
    expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    expect(within(list).getAllByText(/^(접근성|성능) /)).toHaveLength(2);
  });

  it("RECO-AC-08: 업종·목적 둘 다 없으면 근거 부족 + 고르기 버튼이 업종 칩·목적 그룹으로 포커스", async () => {
    // 툴바 칩은 focus-visible이면 scrollIntoView(jsdom 없음) — 이 테스트에서만 대체
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: () => undefined });
    onTestFinished(() => void delete (Element.prototype as Partial<Element>).scrollIntoView);
    renderApp("/catalog?tab=rec&audience=family");
    expect(await screen.findByText("업종이나 목적을 고르면 추천을 계산합니다.")).toBeInTheDocument();
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    await userEvent.click(screen.getByRole("button", { name: "업종 고르기" }));
    expect(screen.getByRole("group", { name: "업종" })).toContainElement(document.activeElement as HTMLElement);
    await userEvent.click(screen.getByRole("button", { name: "목적 고르기" }));
    await waitFor(() => expect((document.activeElement as HTMLElement).closest("fieldset")?.querySelector("legend")?.textContent).toBe("콘텐츠 목적"));
  });

  it("RECO-AC-09: 진입·근거 펼치기·필터 변경만으로 보드 쓰기 0", async () => {
    const { repo, writes } = spiedBoard();
    renderApp(T_REC_01, undefined, repo);
    const first = (await cards())[0]!;
    await userEvent.click(within(first).getByRole("button", { name: "근거 펼치기" }));
    await userEvent.click(within(screen.getByRole("group", { name: "업종" })).getByRole("button", { name: /뷰티/ }));
    await waitFor(async () => expect(await cards()).not.toHaveLength(0));
    expect(writes()).toBe(0);
    expect((await repo.getBoard()).board.picks).toEqual({ hero: "ref-a" });
  });

  it("RECO-AC-12: 페이지 status 1(트레이 status 공유) · 추천 영역 alert 0(정상) · 새 aria-live 0", async () => {
    renderApp(T_REC_01);
    await cards();
    expect(screen.getAllByRole("status")).toHaveLength(1);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
    expect(document.querySelectorAll("[aria-live]")).toHaveLength(0);
  });
});

describe("승인 후 적용 (RECO-SPEC 3.3 · AC-10·11·16)", () => {
  it("미리보기 '취소'면 쓰기 0 · '적용'이면 저장 확인 뒤 적용됨 + status, 되돌리기는 적용 전과 깊은 동일", async () => {
    const { repo, writes } = spiedBoard();
    const before = (await repo.getBoard()).board;
    renderApp(T_REC_01, undefined, repo);
    const first = (await cards())[0]!;
    const title = within(first).getByRole("heading", { level: 3 }).textContent!;
    const apply = within(first).getByRole("button", { name: "이 추천 적용" });

    await userEvent.click(apply);
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getAllByRole("listitem").length).toBeGreaterThan(0);
    expect(within(dialog).getByText(/^Hero · 모던 카페 브랜드 →/)).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "취소" })).toHaveFocus();
    await userEvent.click(within(dialog).getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(writes()).toBe(0);
    expect(apply).toHaveFocus();

    await userEvent.click(apply);
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "적용" }));
    const undo = await within(first).findByRole("button", { name: "되돌리기" });
    expect(within(first).getByText("적용됨")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(`${title} 추천을 적용했습니다.`);
    await waitFor(() => expect(undo).toHaveFocus());
    const applied = (await repo.getBoard()).board;
    const id = applied.columns.at(-1)!.referenceId;
    expect(Object.values(applied.picks)).toHaveLength(10);
    expect(new Set(Object.values(applied.picks))).toEqual(new Set([id]));

    await userEvent.click(undo);
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent(`${title} 추천 적용을 되돌렸습니다.`));
    const reverted = (await repo.getBoard()).board;
    expect(reverted.picks).toEqual(before.picks);
    expect(reverted.columns).toEqual(before.columns);
    await waitFor(() => expect(within(first).getByRole("button", { name: "이 추천 적용" })).toHaveFocus());
  });

  it("RECO-AC-16: 선택 저장 실패면 '적용됨' 0 · alert 1 + 다시 시도 → 재시도는 선택 저장만", async () => {
    let failOnce = true;
    const { repo, spies } = spiedBoard({
      fail: (call) => {
        if (call.method === "savePicks" && call.phase === "request" && failOnce) {
          failOnce = false;
          return new Error("저장 실패");
        }
        return undefined;
      },
    });
    renderApp(T_REC_01, undefined, repo);
    const first = (await cards())[0]!;
    await userEvent.click(within(first).getByRole("button", { name: "이 추천 적용" }));
    await userEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "적용" }));
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("추천을 적용하지 못했습니다.");
    expect(within(first).queryByText("적용됨")).toBeNull();
    expect(spies.addReference).toHaveBeenCalledTimes(1);
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(await within(first).findByText("적용됨")).toBeInTheDocument();
    expect(spies.addReference).toHaveBeenCalledTimes(1);
    expect(spies.savePicks).toHaveBeenCalledTimes(2);
    expect(screen.queryAllByRole("alert")).toHaveLength(0);
  });

  it("RECO-AC-11: 열 6개 꽉 참 + 미포함이면 적용 비활성 + 이유", async () => {
    const full = ["ref-a", "ref-b", "ref-d", "ref-e", "ref-f", "gen-beauty-1"];
    const { repo } = spiedBoard({ initialBoard: boardOf(full) });
    renderApp(T_REC_01, undefined, repo);
    await waitFor(async () => {
      const card = (await cards()).find((c) => !full.some((id) => within(c).queryByRole("link", { name: "" })?.getAttribute("href")?.endsWith(id)))!;
      expect(within(card).getByRole("button", { name: "이 추천 적용" })).toHaveAttribute("aria-disabled", "true");
    });
    expect(screen.getAllByText(COMPARE_LIMIT_NOTICE).length).toBeGreaterThan(0);
  });
});
