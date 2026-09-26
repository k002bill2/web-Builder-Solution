/**
 * DS-2A-04 3.3 대비 검사 C-1~C-5 · 역할별 보정 제안 · 충돌 (P-AC-05·06).
 * 기대값 = `docs/design/2a-04/contrast_calc_2a04.py` 출력(기준 레퍼런스 팔레트 + 같은 레퍼런스 카드 톤).
 */
import { describe, expect, it } from "vitest";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { formatRatio } from "./contrast";
import { checkProfileContrast, proposeCorrections } from "./profileContrast";

const inputOf = (id: string) => ({ palette: referenceDetailFixtures[id]!.palette, tone: referenceComparisonAttributes[id]!.card.surfaceTone });
const summary = (id: string) => {
  const { palette, tone } = inputOf(id);
  return checkProfileContrast(palette, tone, "aa").map((c) => `${c.id} ${formatRatio(c.ratio)} ${c.pass ? "통과" : "미달"}`);
};

describe("checkProfileContrast — 검사 5종, C-3은 어두운 카드에서만 (P-AC-05)", () => {
  it.each([
    ["ref-a", ["C-1 5.5:1 통과", "C-2 13.9:1 통과", "C-4 11.6:1 통과", "C-5 3.8:1 미달"]],
    ["ref-b", ["C-1 16.4:1 통과", "C-2 2.2:1 미달", "C-3 7.3:1 통과", "C-4 1.7:1 미달", "C-5 3.7:1 미달"]],
    ["ref-c", ["C-1 6.0:1 통과", "C-2 13.9:1 통과", "C-4 12.3:1 통과", "C-5 3.3:1 미달"]],
    ["ref-d", ["C-1 3.0:1 미달", "C-2 18.8:1 통과", "C-4 17.9:1 통과", "C-5 1.8:1 미달"]],
    ["ref-e", ["C-1 17.0:1 통과", "C-2 5.8:1 통과", "C-4 5.4:1 통과", "C-5 4.7:1 통과"]],
    ["ref-f", ["C-1 3.2:1 미달", "C-2 13.3:1 통과", "C-4 12.1:1 통과", "C-5 3.0:1 미달"]],
  ])("%s", (id, expected) => {
    expect(summary(id)).toEqual(expected);
  });

  it("강화(7.0)는 모든 검사에 같은 목표를 쓴다 — C-1도 7.0", () => {
    const { palette, tone } = inputOf("ref-a");
    expect(checkProfileContrast(palette, tone, "enhanced").map((c) => [c.id, c.pass, c.target])).toEqual([
      ["C-1", false, 7],
      ["C-2", true, 7],
      ["C-4", true, 7],
      ["C-5", false, 7],
    ]);
  });
});

describe("proposeCorrections — 역할마다 최저 대비 기준 한 번, 재계산해 새 미달이면 충돌 (P-AC-05·06)", () => {
  const proposals = (id: string, level: "aa" | "enhanced" = "aa") => {
    const { palette, tone } = inputOf(id);
    return proposeCorrections(palette, tone, level).map((p) => ({ role: p.role, to: p.to, conflict: p.conflict !== undefined }));
  };

  it.each([
    ["ref-a", [{ role: "muted", to: "#8E715B", conflict: false }]],
    ["ref-c", [{ role: "muted", to: "#4F76BD", conflict: false }]],
    ["ref-d", [{ role: "primary", to: "#00866A", conflict: false }, { role: "muted", to: "#28846E", conflict: false }]],
    ["ref-e", []],
    ["ref-f", [{ role: "primary", to: "#AF6300", conflict: false }, { role: "muted", to: "#996E41", conflict: false }]],
  ])("AA %s", (id, expected) => {
    expect(proposals(id)).toEqual(expected);
  });

  it("ref-a muted 보정 = C-5 3.8 → 4.5, 명도 −3.9%p, 보정 전·후 값", () => {
    const { palette, tone } = inputOf("ref-a");
    const [muted] = proposeCorrections(palette, tone, "aa");
    expect(muted).toMatchObject({ role: "muted", from: "#9A7B63", to: "#8E715B", basis: "C-5", checks: ["C-5"] });
    expect(formatRatio(muted!.before)).toBe("3.8:1");
    expect(formatRatio(muted!.after)).toBe("4.5:1");
    expect(muted!.lightnessDelta).toBeCloseTo(-3.9, 5);
  });

  it("ref-b(어두운 카드) ink는 충돌: 후보 #7E622F(C-4 기준)를 쓰면 C-3 7.3 → 2.8, muted는 #7B766E 보정", () => {
    const { palette, tone } = inputOf("ref-b");
    const [ink, muted] = proposeCorrections(palette, tone, "aa");
    expect(ink).toMatchObject({ role: "ink", from: "#C9A96E", to: "#7E622F", basis: "C-4", checks: ["C-2", "C-3", "C-4"] });
    expect(ink!.conflict?.map((b) => `${b.id} ${formatRatio(b.before)} → ${formatRatio(b.after)}`)).toEqual(["C-3 7.3:1 → 2.8:1"]);
    expect(muted).toMatchObject({ role: "muted", to: "#7B766E" });
    expect(muted!.conflict).toBeUndefined();
  });

  it("강화에서도 ref-b ink 충돌(#5B4722, C-3 1.8) · 강화 열 제안값", () => {
    const { palette, tone } = inputOf("ref-b");
    const [ink] = proposeCorrections(palette, tone, "enhanced");
    expect(ink).toMatchObject({ to: "#5B4722" });
    expect(ink!.conflict?.map((b) => formatRatio(b.after))).toEqual(["1.8:1"]);
    expect(proposals("ref-a", "enhanced")).toEqual([{ role: "primary", to: "#775033", conflict: false }, { role: "muted", to: "#6A5544", conflict: false }]);
    expect(proposals("ref-d", "enhanced").map((p) => p.to)).toEqual(["#006550", "#1E6353"]);
    expect(proposals("ref-e", "enhanced")).toEqual([{ role: "ink", to: "#4C22F0", conflict: false }, { role: "muted", to: "#565960", conflict: false }]);
  });
});
