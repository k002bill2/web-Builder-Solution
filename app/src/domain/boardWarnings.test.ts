import { describe, expect, it } from "vitest";
import { boardOf, resultsOf } from "../test/compareFixtures";
import { togglePick } from "./boardPicks";
import { evaluateBoardWarnings } from "./boardWarnings";
import type { CompareBoard, ComparisonResult } from "./compareBoard";
import { AA_BODY_RATIO, contrastRatio } from "./contrast";
import { buildProfileDraft } from "./profileDraft";

function warningsOf(board: CompareBoard, results: readonly ComparisonResult[]) {
  const draft = buildProfileDraft(board, results, "1.4");
  if (draft.status !== "ready") throw new Error("Hero가 필요합니다");
  return evaluateBoardWarnings(board, results, draft);
}

const IDS = ["ref-a", "ref-b", "ref-c"];
const results = resultsOf(IDS);

describe("R-07 모션 상한", () => {
  it("AC-11: 모션 '높음'이면 정보 경고 '생성 상한이 L2라 '중간'으로 적용됩니다'", () => {
    const ids = ["ref-a", "ref-d"];
    const warning = warningsOf(boardOf(ids, { hero: "ref-a", motion: "ref-d" }), resultsOf(ids)).find((w) => w.rule === "R-07");
    expect(warning).toMatchObject({ tone: "info", message: "생성 상한이 L2라 '중간'으로 적용됩니다" });
  });
});

describe("R-08 대비 (SPEC 3.4)", () => {
  it("A 팔레트(5.58:1)는 C-1 경고가 없다", () => {
    expect(warningsOf(boardOf(IDS, { hero: "ref-a" }), results).filter((w) => w.rule === "R-08")).toEqual([]);
  });

  it("AC-12(계산): 사용자 대표색 #C9A96E → 원인·수치·보정값", () => {
    const board = boardOf(IDS, { hero: "ref-a" }, { custom: { primaryColor: "#C9A96E" } });
    const warning = warningsOf(board, results).find((w) => w.check === "C-1");
    expect(warning).toMatchObject({ rule: "R-08", tone: "warning", ratio: "2.2:1" });
    expect(warning!.message).toBe("사용자 대표색 위 흰 글자 대비가 2.2:1로 기준 4.5:1보다 낮습니다(버튼·어두운 카드).");
    const fix = warning!.fixes[0];
    expect(fix).toMatchObject({ kind: "use-corrected-primary", actionLabel: "보정값 쓰기", from: "#C9A96E" });
    expect(fix?.kind === "use-corrected-primary" && contrastRatio(fix.hex, "#FFFFFF")).toBeGreaterThanOrEqual(AA_BODY_RATIO);
  });

  it("F 팔레트를 고르면 출처를 'F 팔레트'로 적는다 (3.24:1 → 3.2:1)", () => {
    const ids = ["ref-a", "ref-b", "ref-c", "ref-d", "ref-e", "ref-f"];
    const warning = warningsOf(boardOf(ids, { hero: "ref-a", palette: "ref-f" }), resultsOf(ids)).find((w) => w.check === "C-1");
    expect(warning!.message).toBe("F 팔레트 대표색 위 흰 글자 대비가 3.2:1로 기준 4.5:1보다 낮습니다(버튼·어두운 카드).");
  });

  it("C-3: 어두운 카드 대비가 낮으면 밝은 카드 열을 대체안으로 준다", () => {
    const warning = warningsOf(boardOf(IDS, { hero: "ref-a", card: "ref-b" }), results).find((w) => w.check === "C-3");
    expect(warning!.fixes).toEqual([
      { kind: "pick-column", rowId: "card", referenceId: "ref-a", columnLabel: "A", actionLabel: "A의 카드로 바꾸기" },
      { kind: "pick-column", rowId: "card", referenceId: "ref-c", columnLabel: "C", actionLabel: "C의 카드로 바꾸기" },
    ]);
  });
});

describe("R-12 사업자정보 Footer (AC-13)", () => {
  it("AC-13: Footer를 B(미니멀 · 링크만)로 고르면 경고 + 사업자정보 Footer가 있는 열로 바꾸기, 누르면 C로 바뀐다", () => {
    const board = boardOf(IDS, { hero: "ref-a", footer: "ref-b" });
    const warning = warningsOf(board, results).find((w) => w.rule === "R-12");
    expect(warning).toMatchObject({ tone: "warning", message: "발행 전에 사업자정보가 있는 푸터가 필요합니다" });
    const toC = warning!.fixes.find((f) => f.kind === "pick-column" && f.referenceId === "ref-c");
    expect(toC).toEqual({ kind: "pick-column", rowId: "footer", referenceId: "ref-c", columnLabel: "C", actionLabel: "C의 Footer로 바꾸기" });
    const applied = togglePick(board, results, "footer", "ref-c");
    expect(applied.ok && applied.picks.footer).toBe("ref-c");
    const after = { ...board, picks: applied.ok ? applied.picks : board.picks };
    expect(warningsOf(after, results).find((w) => w.rule === "R-12")).toBeUndefined();
  });

  it("보드에 사업자정보 Footer 열이 없으면 확정 시 확장 변형으로 바꾼다는 안내", () => {
    const ids = ["ref-b", "ref-d"];
    const warning = warningsOf(boardOf(ids, { hero: "ref-b" }), resultsOf(ids)).find((w) => w.rule === "R-12");
    expect(warning!.fixes).toEqual([{ kind: "auto-business-variant", variant: "minimal-biz", message: "확정 시 같은 모양의 사업자정보 확장 변형으로 바꿉니다" }]);
  });
});

describe("R-15 재바인딩 안내", () => {
  it("서로 다른 레퍼런스에서 2개 이상 고르면 정보 한 줄", () => {
    const warning = warningsOf(boardOf(IDS, { hero: "ref-a", card: "ref-c" }), results).find((w) => w.rule === "R-15");
    expect(warning).toMatchObject({ tone: "info", message: "고른 요소는 모두 초안의 팔레트·폰트로 다시 칠해집니다" });
  });
});
