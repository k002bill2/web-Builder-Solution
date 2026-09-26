/**
 * DS-2A-04 2a-04b1 — 적용된 값·필드 단위 이어받기 순수 함수 (SPEC 6.1-3 겹침 판정 표 · 6.4 · P-AC-38·39 ①).
 * 보드 초안(buildProfileDraft)으로 base를 만든다 — 보드 패널과 저장소가 같은 입력으로 부르는 값.
 */
import { describe, expect, it } from "vitest";
import { boardOf, resultsOf } from "../test/compareFixtures";
import type { DesignProfileInput, Picks } from "./compareBoard";
import type { PaletteCorrection, ProfileAdjustments } from "./profile";
import { adjustmentCount, carryOverAdjustments, effectiveProfile, normalizeAdjustments } from "./profileAdjustments";
import { buildProfileDraft } from "./profileDraft";
import { SECTION_LIBRARY } from "./sectionLibrary";

const IDS = ["ref-a", "ref-b", "ref-c"];

function baseOf(picks: Picks): DesignProfileInput {
  const draft = buildProfileDraft(boardOf(IDS, picks), resultsOf(IDS), SECTION_LIBRARY.version);
  if (draft.status !== "ready") throw new Error("Hero 선택이 필요합니다");
  return draft.profile;
}

/** ref-a Hero · 모션 ref-a(L1) · 밝은 카드 */
const A = baseOf({ hero: "ref-a" });
/** ref-b 팔레트(ink #C9A96E) + 밝은 카드(ref-a) — SPEC 3.3 ref-b ink 보정 #7E622F가 충돌 없이 나오는 조합 */
const B_PALETTE_LIGHT = baseOf({ hero: "ref-a", palette: "ref-b", card: "ref-a" });
const INK_FIX: PaletteCorrection = { role: "ink", from: "#C9A96E", to: "#7E622F", check: "C-4" };
const MUTED_FIX: PaletteCorrection = { role: "muted", from: "#9A7B63", to: "#8E715B", check: "C-5" };

describe("effectiveProfile — 적용된 값 = base + 조정 (6.1-2)", () => {
  it("조정이 없으면 base 그대로(같은 참조)", () => {
    expect(effectiveProfile(A, {})).toBe(A);
  });

  it("밀도 촘촘 = 섹션 간격 × 0.75를 8의 배수로 내림(96 → 72), 모션 덮어쓰기, 보정은 그 역할 색만 바꾼다", () => {
    expect(A.spacing_tokens.sectionGap).toBe(96);
    const applied = effectiveProfile(A, { density: "compact", motion: "L2", corrections: [MUTED_FIX], contrast: "enhanced", purpose: "booking" });
    expect(applied.spacing_tokens).toEqual({ grid: A.spacing_tokens.grid, sectionGap: 72 });
    expect(applied.motion_preset).toBe("L2");
    expect(applied.color_tokens.muted.$value).toBe("#8E715B");
    expect(applied.color_tokens.ink).toEqual(A.color_tokens.ink);
    // 대비·목적은 생성 입력이라 DesignProfileInput 값은 바꾸지 않는다
    expect({ ...applied, spacing_tokens: A.spacing_tokens, motion_preset: A.motion_preset, color_tokens: A.color_tokens }).toEqual(A);
    // 입력 불변
    expect(A.spacing_tokens.sectionGap).toBe(96);
    expect(A.color_tokens.muted.$value).toBe("#9A7B63");
  });

  it("밀도 여유는 보드 값 그대로", () => {
    expect(effectiveProfile(A, { density: "comfortable" }).spacing_tokens.sectionGap).toBe(96);
  });
});

describe("normalizeAdjustments · adjustmentCount — 개수 단위: 조정 키 1 · 보정 항목 1 (6.1-3)", () => {
  it("빈 보정 배열·undefined 키는 없는 것과 같고, 키 순서와 무관하다", () => {
    expect(normalizeAdjustments({ corrections: [], density: undefined })).toEqual({});
    expect(JSON.stringify(normalizeAdjustments({ motion: "L2", density: "compact" }))).toBe(JSON.stringify(normalizeAdjustments({ density: "compact", motion: "L2" })));
  });

  it("밀도·대비·모션·목적 각 1 + 보정 항목 수", () => {
    expect(adjustmentCount({})).toBe(0);
    expect(adjustmentCount({ corrections: [] })).toBe(0);
    expect(adjustmentCount({ density: "compact", contrast: "aa", motion: "L0", purpose: "none", corrections: [INK_FIX, MUTED_FIX] })).toBe(6);
  });
});

describe("carryOverAdjustments — 겹침 판정 표 (6.1-3 · P-AC-39 ①)", () => {
  const plan = (confirmedBase: DesignProfileInput, adjustments: ProfileAdjustments, nextBase: DesignProfileInput) =>
    carryOverAdjustments(confirmedBase, adjustments, nextBase);

  it("모션: 보드 모션이 같으면 이어받음", () => {
    const next = baseOf({ hero: "ref-c" });
    expect(next.motion_preset).toBe(A.motion_preset);
    expect(plan(A, { motion: "L2" }, next)).toEqual({ kept: [{ key: "motion" }], dropped: [], adjustments: { motion: "L2" } });
  });

  it("모션: 보드에서 모션을 바꾸면 지움(board-changed) — 덮어쓰기 값이 새 보드 값과 같아도 지운다", () => {
    const next = baseOf({ hero: "ref-a", motion: "ref-b" });
    expect(next.motion_preset).not.toBe(A.motion_preset);
    expect(plan(A, { motion: next.motion_preset }, next)).toEqual({ kept: [], dropped: [{ key: "motion", reason: "board-changed" }], adjustments: {} });
  });

  it.each([
    ["밀도", { density: "compact" }, "density"],
    ["대비", { contrast: "enhanced" }, "contrast"],
    ["목적", { purpose: "booking" }, "purpose"],
  ] as const)("%s: 겹치는 보드 필드가 없어 보드를 바꿔도 항상 이어받음", (_label, adjustments, key) => {
    const next = baseOf({ hero: "ref-b", motion: "ref-b", palette: "ref-c", card: "ref-b" });
    expect(plan(A, adjustments, next)).toEqual({ kept: [{ key }], dropped: [], adjustments });
  });

  it("보정 (a): 새 base의 그 역할 값 ≠ from이면 지움(palette-changed), 같으면 이어받음(대소문자 무관)", () => {
    const samePalette = baseOf({ hero: "ref-c", palette: "ref-a" });
    const lower = { ...MUTED_FIX, from: MUTED_FIX.from.toLowerCase() };
    expect(plan(A, { corrections: [lower] }, samePalette)).toEqual({ kept: [{ key: "correction", role: "muted" }], dropped: [], adjustments: { corrections: [lower] } });
    const otherPalette = baseOf({ hero: "ref-a", palette: "ref-c" });
    expect(plan(A, { corrections: [MUTED_FIX] }, otherPalette)).toEqual({
      kept: [],
      dropped: [{ key: "correction", role: "muted", reason: "palette-changed" }],
      adjustments: {},
    });
  });

  it("보정 (b): ref-b 팔레트 ink 보정 #7E622F — 밝은 카드면 이어받고, 어두운 카드로 바꾸면 C-3 7.3 → 2.8이라 지움(new-contrast-failure) (P-AC-39 ③)", () => {
    const light = baseOf({ hero: "ref-a", palette: "ref-b", card: "ref-c" });
    expect(plan(B_PALETTE_LIGHT, { corrections: [INK_FIX] }, light).kept).toEqual([{ key: "correction", role: "ink" }]);
    const dark = baseOf({ hero: "ref-a", palette: "ref-b", card: "ref-b" });
    expect(dark.component_choices.card_style?.surfaceTone).toBe("dark");
    expect(plan(B_PALETTE_LIGHT, { corrections: [INK_FIX], density: "compact" }, dark)).toEqual({
      kept: [{ key: "density" }],
      dropped: [{ key: "correction", role: "ink", reason: "new-contrast-failure" }],
      adjustments: { density: "compact" },
    });
  });

  it("보정 (b)의 검사 목표는 이어받는 대비 조정을 따른다 — 강화(7.0)에서 통과하던 검사가 없으면 새 미달도 없다", () => {
    const dark = baseOf({ hero: "ref-a", palette: "ref-b", card: "ref-b" });
    // C-3 원값 7.3은 강화 7.0도 통과 → 보정 2.8은 새 미달이라 여전히 지운다
    expect(plan(B_PALETTE_LIGHT, { corrections: [INK_FIX], contrast: "enhanced" }, dark).dropped).toEqual([{ key: "correction", role: "ink", reason: "new-contrast-failure" }]);
  });

  it("비교 기준은 confirmedBase다 — 최신 base와 달라도 보드에서 안 바꾼 필드는 '바뀐 필드'가 아니다 (P-AC-39 ⑥ 근거)", () => {
    const confirmedWithL2 = baseOf({ hero: "ref-a", motion: "ref-b" });
    const nextHeroOnly = baseOf({ hero: "ref-c", motion: "ref-b" });
    // 최신 base가 A(L1)였더라도 기준은 확정 버전 base(L2) — Hero만 바꿨으면 모션 조정은 이어진다
    expect(plan(confirmedWithL2, { motion: "L0" }, nextHeroOnly).kept).toEqual([{ key: "motion" }]);
    expect(plan(A, { motion: "L0" }, nextHeroOnly).dropped).toEqual([{ key: "motion", reason: "board-changed" }]);
  });

  it("전 종류 한 번에: 순서 = 밀도·대비·모션·목적·보정, adjustments = kept만(정규화)", () => {
    const next = baseOf({ hero: "ref-a", motion: "ref-b" });
    const result = plan(A, { purpose: "sales", corrections: [MUTED_FIX], motion: "L0", contrast: "aa", density: "compact" }, next);
    expect(result.kept).toEqual([{ key: "density" }, { key: "contrast" }, { key: "purpose" }, { key: "correction", role: "muted" }]);
    expect(result.dropped).toEqual([{ key: "motion", reason: "board-changed" }]);
    expect(result.adjustments).toEqual({ density: "compact", contrast: "aa", purpose: "sales", corrections: [MUTED_FIX] });
    expect(adjustmentCount(result.adjustments)).toBe(result.kept.length);
  });

  it("조정이 없으면 빈 계획", () => {
    expect(plan(A, {}, baseOf({ hero: "ref-b" }))).toEqual({ kept: [], dropped: [], adjustments: {} });
  });
});
