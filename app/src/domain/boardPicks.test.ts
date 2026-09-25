import { describe, expect, it } from "vitest";
import { boardOf, catalogWithdrawing, resultsOf } from "../test/compareFixtures";
import { pickAllFrom, pickAnnouncement, releaseUnavailablePicks, togglePick } from "./boardPicks";
import { PICKABLE_ROW_IDS } from "./compareBoard";

const IDS = ["ref-a", "ref-b", "ref-c"];
const results = resultsOf(IDS);

describe("선택 규칙 P-1~P-4·P-6", () => {
  it("P-1·P-6: 선택은 레퍼런스 id로 저장하고, 같은 행의 다른 열을 누르면 교체한다", () => {
    const first = togglePick(boardOf(IDS), results, "hero", "ref-b");
    expect(first).toMatchObject({ ok: true, picks: { hero: "ref-b" }, change: { kind: "picked", rowId: "hero", to: "ref-b" } });
    const second = togglePick(boardOf(IDS, { hero: "ref-b" }), results, "hero", "ref-c");
    expect(second).toMatchObject({ ok: true, picks: { hero: "ref-c" }, change: { kind: "replaced", from: "ref-b", to: "ref-c" } });
  });

  it("P-2: 선택된 열을 다시 누르면 해제한다", () => {
    const result = togglePick(boardOf(IDS, { hero: "ref-c", card: "ref-a" }), results, "hero", "ref-c");
    expect(result).toMatchObject({ ok: true, picks: { card: "ref-a" }, change: { kind: "unpicked", from: "ref-c" } });
  });

  it("P-3: info 행은 선택할 수 없다", () => {
    expect(togglePick(boardOf(IDS), results, "sectionCount", "ref-a")).toEqual({ ok: false, reason: "info-row" });
    expect(togglePick(boardOf(IDS), results, "quality", "ref-a")).toEqual({ ok: false, reason: "info-row" });
  });

  it("P-4: 값이 '없음'이거나 라이브러리에 없는 변형이면 선택할 수 없다", () => {
    const noFooter = results.map((r) =>
      r.referenceId === "ref-b" && r.comparison
        ? { ...r, comparison: { ...r.comparison, cells: { ...r.comparison.cells, footer: { label: "없음", binding: null } } } }
        : r,
    );
    expect(togglePick(boardOf(IDS), noFooter, "footer", "ref-b")).toEqual({ ok: false, reason: "empty-cell" });
  });

  it("보드에 없는 열·회수된 열은 선택할 수 없다", () => {
    expect(togglePick(boardOf(IDS), results, "hero", "ref-d")).toEqual({ ok: false, reason: "not-in-board" });
    const withdrawn = resultsOf(IDS, catalogWithdrawing("ref-b"));
    expect(togglePick(boardOf(IDS), withdrawn, "hero", "ref-b")).toEqual({ ok: false, reason: "unavailable-column" });
  });

  it("입력 picks를 변경하지 않는다", () => {
    const board = boardOf(IDS, { hero: "ref-a" });
    togglePick(board, results, "hero", "ref-b");
    expect(board.picks).toEqual({ hero: "ref-a" });
  });
});

describe("A-4 선택 알림 문장", () => {
  const board = boardOf(IDS);
  it("선택·교체·해제", () => {
    expect(pickAnnouncement(board, { kind: "picked", rowId: "hero", to: "ref-b" })).toBe("Hero 구성: B 선택");
    expect(pickAnnouncement(board, { kind: "replaced", rowId: "hero", from: "ref-b", to: "ref-c" })).toBe("Hero 구성: B → C");
    expect(pickAnnouncement(board, { kind: "unpicked", rowId: "hero", from: "ref-c" })).toBe("Hero 구성 선택 해제");
  });
});

describe("P-5 이 레퍼런스로 전부 선택", () => {
  it("AC-07(데이터): 선택이 없을 때 A로 전부 선택하면 선택 가능한 10행이 모두 A이고 안내가 없다", () => {
    const result = pickAllFrom(boardOf(IDS), results, "ref-a");
    expect(PICKABLE_ROW_IDS.map((row) => result.picks[row])).toEqual(PICKABLE_ROW_IDS.map(() => "ref-a"));
    expect(result.replacedCount).toBe(0);
    expect(result.notice).toBeNull();
  });

  it("다른 열 선택 N개만 세어 안내하고, 되돌리기용 이전 선택을 돌려준다", () => {
    const before = { hero: "ref-b", card: "ref-b", footer: "ref-c", menu: "ref-a" } as const;
    const result = pickAllFrom(boardOf(IDS, before), results, "ref-a");
    expect(result.replacedCount).toBe(3);
    expect(result.notice).toBe("기존 선택 3개를 A로 바꿨습니다");
    expect(result.previous).toEqual(before);
  });

  it("값이 없는 행은 건너뛰고 그 행의 기존 선택은 유지한다", () => {
    const noFooter = results.map((r) =>
      r.referenceId === "ref-a" && r.comparison
        ? { ...r, comparison: { ...r.comparison, cells: { ...r.comparison.cells, footer: { label: "없음", binding: null } } } }
        : r,
    );
    const result = pickAllFrom(boardOf(IDS, { footer: "ref-c" }), noFooter, "ref-a");
    expect(result.picks.footer).toBe("ref-c");
    expect(result.replacedCount).toBe(0);
  });
});

describe("AC-15(데이터) 회수·삭제된 열의 선택 자동 해제 (S-08·S-09)", () => {
  it("AC-15: 회수된 B에서 고른 선택은 해제되고 경고 문장을 돌려준다", () => {
    const board = boardOf(IDS, { hero: "ref-b", card: "ref-b", footer: "ref-c" });
    const result = releaseUnavailablePicks(board, resultsOf(IDS, catalogWithdrawing("ref-b")));
    expect(result.picks).toEqual({ footer: "ref-c" });
    expect(result.released).toEqual([
      { referenceId: "ref-b", label: "B", status: "withdrawn", rows: ["hero", "card"], notice: "B가 회수되어 Hero·카드 선택을 해제했습니다" },
    ]);
  });

  it("AC-15: 없는 레퍼런스(삭제됨)도 같은 방식으로 해제한다", () => {
    const board = boardOf(["ref-a", "ref-gone"], { hero: "ref-gone" });
    const result = releaseUnavailablePicks(board, resultsOf(["ref-a", "ref-gone"]));
    expect(result.picks).toEqual({});
    expect(result.released[0]).toMatchObject({ status: "missing", notice: "B를 찾을 수 없어 Hero 선택을 해제했습니다" });
  });

  it("해제할 것이 없으면 같은 picks와 빈 목록", () => {
    const board = boardOf(IDS, { hero: "ref-a" });
    expect(releaseUnavailablePicks(board, results)).toEqual({ picks: board.picks, released: [] });
  });
});
