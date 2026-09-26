/**
 * DS-2A-04 r6 P-S25 — 보드 진입 직후 캡션 개수(인라인 계산)가 판정 모듈의 개수 단위(6.1-3)와 같다.
 * 판정 모듈(profileAdjustments)은 테스트만 import한다 — 앱의 캡션 계산은 대비 계산을 받지 않는다.
 */
import { describe, expect, it } from "vitest";
import type { PaletteCorrection, ProfileAdjustments } from "../../domain/profile";
import { adjustmentCount } from "../../domain/profileAdjustments";
import { carryOverCount } from "./boardScreen";

const INK_FIX: PaletteCorrection = { role: "ink", from: "#C9A96E", to: "#7E622F", check: "C-4" };
const MUTED_FIX: PaletteCorrection = { role: "muted", from: "#9A7B63", to: "#8E715B", check: "C-5" };

describe("carryOverCount — P-S25 캡션 N (6.1-3 개수 단위: 조정 키 1 · 보정 항목 1)", () => {
  it.each<[string, ProfileAdjustments]>([
    ["조정 없음", {}],
    ["빈 보정 배열", { corrections: [] }],
    ["밀도만", { density: "compact" }],
    ["보정 2개만", { corrections: [INK_FIX, MUTED_FIX] }],
    ["키 4개 + 보정 2개", { density: "compact", contrast: "aa", motion: "L0", purpose: "none", corrections: [INK_FIX, MUTED_FIX] }],
    ["undefined 키는 세지 않음", { density: undefined, motion: "L1" }],
  ])("%s → adjustmentCount와 같다", (_, adjustments) => {
    expect(carryOverCount(adjustments)).toBe(adjustmentCount(adjustments));
  });

  it("보정 2개는 2로 센다(키 수가 아니라 항목 수) · 최신이 없으면 0", () => {
    expect(carryOverCount({ corrections: [INK_FIX, MUTED_FIX] })).toBe(2);
    expect(carryOverCount(undefined)).toBe(0);
  });
});
