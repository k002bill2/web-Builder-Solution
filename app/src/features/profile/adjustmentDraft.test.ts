/** 2A-04b2 저장 안 된 조정(초안) — 기본값 선택 = 키 삭제, 개수 = 보이는 값 차이 (DS-2A-04 P-S10 · 6.1-3 개수 단위) */
import { describe, expect, it } from "vitest";
import type { DesignProfileInput } from "../../domain/compareBoard";
import type { AdjustmentRange } from "../../domain/profile";
import { NO_EDITS, applyEdits, fitValue, outOfRange, pendingCount, pickValue, valuesOf, writeCorrection } from "./adjustmentDraft";

const base = { motion_preset: "L1" } as DesignProfileInput;
const MUTED = { role: "muted", from: "#A0826D", to: "#8E715B", check: "C-5" } as const;

describe("adjustmentDraft", () => {
  it("보이는 값: 키가 없으면 여유 · 기본 AA · 보드 모션 · 정하지 않음", () => {
    expect(valuesOf({}, base)).toEqual({ density: "comfortable", contrast: "aa", motion: "L1", purpose: "none" });
    expect(valuesOf({ motion: "L0", purpose: "booking" }, base)).toMatchObject({ motion: "L0", purpose: "booking" });
  });

  it("기본값(보드 값)을 고르면 키를 지운다 · 저장된 값으로 되돌리면 편집이 사라진다", () => {
    const saved = { motion: "L0" } as const;
    const toBase = pickValue(NO_EDITS, saved, base, "motion", "L1");
    expect(applyEdits(saved, toBase, base)).toEqual({});
    expect(pendingCount(saved, applyEdits(saved, toBase, base), base)).toBe(1);
    expect(pickValue(toBase, saved, base, "motion", "L0")).toEqual(NO_EDITS);
  });

  it("개수 = 조정 키 차이 + 보정 항목 차이, 보정은 역할마다 하나(교체)", () => {
    let edits = pickValue(NO_EDITS, {}, base, "density", "compact");
    edits = writeCorrection(edits, {}, MUTED);
    edits = writeCorrection(edits, {}, { ...MUTED, to: "#6A5544" });
    const draft = applyEdits({}, edits, base);
    expect(draft).toEqual({ density: "compact", corrections: [{ ...MUTED, to: "#6A5544" }] });
    expect(pendingCount({}, draft, base)).toBe(2);
    expect(writeCorrection(NO_EDITS, { corrections: [MUTED] }, MUTED)).toEqual(NO_EDITS);
  });

  it("범위 밖 값과 맞출 값 — 기본값이 범위 안이면 기본값, 아니면 범위 첫 값", () => {
    const range: AdjustmentRange = { density: ["comfortable"], contrast: ["enhanced"], motion: ["L0", "L1", "L2"], source: "t" };
    expect(outOfRange(valuesOf({ density: "compact" }, base), range)).toEqual(["density", "contrast"]);
    expect(fitValue("density", range, base)).toBe("comfortable");
    expect(fitValue("contrast", range, base)).toBe("enhanced");
  });
});
