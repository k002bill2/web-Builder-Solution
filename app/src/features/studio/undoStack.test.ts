import { renderHook } from "@testing-library/react";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { createUndoStack, UNDO_LIMIT, useUndoStack, type UndoEntry } from "./undoStack";

const entry = (n: number): UndoEntry => ({ label: `연산 ${n}`, before: sampleDoc({ revision: n }), after: sampleDoc({ revision: n + 1 }) });

describe("실행 취소 스택 (K2 · 5.14)", () => {
  it("넣은 역순으로 꺼낸다 · 비면 undefined", () => {
    const stack = createUndoStack();
    stack.push(entry(1));
    stack.push(entry(2));
    expect(stack.size()).toBe(2);
    expect(stack.pop()?.label).toBe("연산 2");
    expect(stack.pop()?.label).toBe("연산 1");
    expect(stack.pop()).toBeUndefined();
  });

  it(`상한 ${UNDO_LIMIT}개 — 넘으면 가장 오래된 기록부터 버린다`, () => {
    expect(UNDO_LIMIT).toBe(50);
    const stack = createUndoStack();
    for (let n = 1; n <= 53; n += 1) stack.push(entry(n));
    expect(stack.size()).toBe(50);
    const labels = Array.from({ length: 50 }, () => stack.pop()?.label);
    expect(labels.at(0)).toBe("연산 53");
    expect(labels.at(-1)).toBe("연산 4");
  });

  it("clear → 0개", () => {
    const stack = createUndoStack();
    stack.push(entry(1));
    stack.clear();
    expect(stack.size()).toBe(0);
  });

  it("useUndoStack: 편집기 언마운트 때 비운다", () => {
    const { result, unmount } = renderHook(() => useUndoStack());
    const stack = result.current;
    stack.push(entry(1));
    stack.push(entry(2));
    unmount();
    expect(stack.size()).toBe(0);
  });
});
