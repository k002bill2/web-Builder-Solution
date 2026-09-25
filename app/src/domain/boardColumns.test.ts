import { describe, expect, it } from "vitest";
import { boardOf } from "../test/compareFixtures";
import { addColumn, removeColumn } from "./boardColumns";

describe("열 추가 (트레이 = 보드의 열 목록)", () => {
  it("비어 있는 가장 앞 문자로 끝에 추가하고 revision을 올린다", () => {
    const result = addColumn(boardOf(["ref-a"]), "ref-c");
    expect(result.ok).toBe(true);
    expect(result.board.columns).toEqual([
      { referenceId: "ref-a", label: "A" },
      { referenceId: "ref-c", label: "B" },
    ]);
    expect(result.board.revision).toBe(2);
  });

  it("중복은 거부한다", () => {
    const board = boardOf(["ref-a"]);
    expect(addColumn(board, "ref-a")).toEqual({ ok: false, reason: "duplicate", board });
  });

  it("6개가 차면 거부한다", () => {
    const board = boardOf(["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"]);
    expect(addColumn(board, "ref-x")).toEqual({ ok: false, reason: "limit", board });
  });
});

describe("P-7 열 빼기", () => {
  it("AC-08(데이터): Hero=A, 카드=B에서 B를 빼면 카드 선택만 해제되고 A·C 문자는 그대로다", () => {
    const board = boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a", card: "ref-b" });
    const { board: next, released } = removeColumn(board, "ref-b");
    expect(next.picks).toEqual({ hero: "ref-a" });
    expect(next.columns).toEqual([
      { referenceId: "ref-a", label: "A" },
      { referenceId: "ref-c", label: "C" },
    ]);
    expect(released).toEqual({ referenceId: "ref-b", label: "B", rows: ["card"], notice: "B를 빼서 카드 선택 해제" });
  });

  it("여러 행이 풀리면 짧은 이름을 행 순서대로 잇는다", () => {
    const board = boardOf(["ref-a", "ref-b"], { card: "ref-b", hero: "ref-b" });
    expect(removeColumn(board, "ref-b").released?.notice).toBe("B를 빼서 Hero·카드 선택 해제");
  });

  it("그 열의 선택이 없으면 알림이 없다", () => {
    expect(removeColumn(boardOf(["ref-a", "ref-b"], { hero: "ref-a" }), "ref-b").released).toBeUndefined();
  });

  it("없는 열이면 보드를 그대로 돌려준다", () => {
    const board = boardOf(["ref-a"]);
    expect(removeColumn(board, "ref-z").board).toBe(board);
  });

  it("입력 보드를 변경하지 않는다", () => {
    const board = boardOf(["ref-a", "ref-b"], { hero: "ref-b" });
    removeColumn(board, "ref-b");
    addColumn(board, "ref-c");
    expect(board.columns).toHaveLength(2);
    expect(board.picks).toEqual({ hero: "ref-b" });
  });
});
