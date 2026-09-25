import { describe, expect, it } from "vitest";
import { rovingRowTargetIndex, rovingTargetIndex } from "./rovingFocus";

describe("rovingRowTargetIndex — 가로 전용 (SPEC A-5)", () => {
  it("←/→로 이전·다음(양 끝 순환), Home/End로 처음·끝", () => {
    expect(rovingRowTargetIndex("ArrowRight", 0, 3)).toBe(1);
    expect(rovingRowTargetIndex("ArrowRight", 2, 3)).toBe(0);
    expect(rovingRowTargetIndex("ArrowLeft", 0, 3)).toBe(2);
    expect(rovingRowTargetIndex("Home", 2, 3)).toBe(0);
    expect(rovingRowTargetIndex("End", 0, 3)).toBe(2);
  });

  it("↑/↓는 무시한다 — 스크린리더 표 탐색과 충돌하지 않게", () => {
    expect(rovingRowTargetIndex("ArrowUp", 1, 3)).toBeNull();
    expect(rovingRowTargetIndex("ArrowDown", 1, 3)).toBeNull();
    // 기존 변형은 그대로 ↑/↓를 이동으로 본다
    expect(rovingTargetIndex("ArrowDown", 1, 3)).toBe(2);
  });
});
