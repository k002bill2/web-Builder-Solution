import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../../data/memoryCompareBoardRepository";
import { createMemoryReferenceRepository } from "../../data/referenceRepository";
import { referenceDetailFixtures } from "../../fixtures/referenceDetails";
import { referenceFixtures } from "../../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { renderApp } from "../../test/renderApp";

const references = () => createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);
const boardRepo = (ids: readonly string[] = [], picks = {}) =>
  createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(ids, picks) });
const tray = () => screen.getByRole("region", { name: "비교 트레이" });
const chipNames = () => within(tray()).queryAllByRole("button", { name: /비교에서 제거$/ }).map((b) => b.getAttribute("aria-label"));

describe("트레이 = 보드의 열 목록 (SPEC 1.1·8.1)", () => {
  it("보드에 담긴 열이 담긴 순서대로 카탈로그 트레이에 보인다", async () => {
    renderApp("/catalog", references(), boardRepo(["ref-c", "ref-a"]));
    await waitFor(() => expect(chipNames()).toEqual(["동네 치과 클리닉 비교에서 제거", "모던 카페 브랜드 비교에서 제거"]));
    expect(tray()).toHaveTextContent("비교 보드 2 / 6");
  });

  it("카탈로그에서 추가하면 보드 저장소에 열 문자와 함께 담긴다", async () => {
    const board = boardRepo();
    renderApp("/catalog", references(), board);
    await userEvent.click(await screen.findByRole("button", { name: "모던 카페 브랜드 비교 추가" }));
    await userEvent.click(screen.getByRole("button", { name: "동네 치과 클리닉 비교 추가" }));
    await waitFor(async () =>
      expect((await board.getBoard()).board.columns).toEqual([
        { referenceId: "ref-a", label: "A" },
        { referenceId: "ref-c", label: "B" },
      ]),
    );
  });

  it("AC-08(데이터): 트레이에서 빼면 보드에서 그 열의 선택도 해제되고 남은 열 문자는 그대로다 (P-7)", async () => {
    const board = boardRepo(["ref-a", "ref-b", "ref-c"], { hero: "ref-a", card: "ref-b" });
    renderApp("/catalog", references(), board);
    await userEvent.click(await within(tray()).findByRole("button", { name: "프리미엄 헤어살롱 비교에서 제거" }));
    await waitFor(async () => {
      const { board: current } = await board.getBoard();
      expect(current.picks).toEqual({ hero: "ref-a" });
      expect(current.columns).toEqual([
        { referenceId: "ref-a", label: "A" },
        { referenceId: "ref-c", label: "C" },
      ]);
    });
  });

  it("상세의 비교 추가도 같은 보드에 담는다", async () => {
    const board = boardRepo(["ref-a"]);
    renderApp("/references/ref-b", references(), board);
    await userEvent.click(await screen.findByRole("button", { name: "비교 추가" }));
    await waitFor(async () => expect((await board.getBoard()).board.columns.map((c) => c.referenceId)).toEqual(["ref-a", "ref-b"]));
  });
});
