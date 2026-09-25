import { describe, expect, it } from "vitest";
import { COMPARE_LIMIT } from "./compareTray";

describe("비교 트레이", () => {
  it("최대 개수는 6개다 (FR-CMP-02)", () => {
    expect(COMPARE_LIMIT).toBe(6);
  });
});
