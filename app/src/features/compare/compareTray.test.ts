import { describe, expect, it } from "vitest";
import { COMPARE_LIMIT, addToTray, removeFromTray, type CompareTray } from "./compareTray";

const fill = (n: number): CompareTray => Array.from({ length: n }, (_, i) => `ref-${i + 1}`);

describe("비교 트레이", () => {
  it("최대 개수는 6개다 (FR-CMP-02)", () => {
    expect(COMPARE_LIMIT).toBe(6);
  });

  it("추가하면 끝에 담긴다", () => {
    const result = addToTray(["ref-a"], "ref-b");
    expect(result).toEqual({ ok: true, tray: ["ref-a", "ref-b"] });
  });

  it("이미 담긴 레퍼런스는 다시 담지 않는다", () => {
    const result = addToTray(["ref-a"], "ref-a");
    expect(result).toEqual({ ok: false, reason: "duplicate", tray: ["ref-a"] });
  });

  it("6개가 찬 상태에서 7번째 추가는 거부한다", () => {
    const full = fill(6);
    const result = addToTray(full, "ref-7");
    expect(result).toEqual({ ok: false, reason: "limit", tray: full });
  });

  it("6번째 추가까지는 허용한다", () => {
    expect(addToTray(fill(5), "ref-6").ok).toBe(true);
  });

  it("해제하면 해당 레퍼런스만 빠진다", () => {
    expect(removeFromTray(["ref-a", "ref-b", "ref-c"], "ref-b")).toEqual(["ref-a", "ref-c"]);
  });

  it("추가·해제는 입력 트레이를 변경하지 않는다", () => {
    const tray = ["ref-a"];
    addToTray(tray, "ref-b");
    removeFromTray(tray, "ref-a");
    expect(tray).toEqual(["ref-a"]);
  });
});
