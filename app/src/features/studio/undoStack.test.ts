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

  it("다시 실행(ER-AC-U1): undo → redo 목록 · redo → 다시 · peek = 다음 대상 · push는 redo를 비움 · clear는 양쪽(U5)", () => {
    const stack = createUndoStack();
    stack.push(entry(1));
    stack.push(entry(2));
    expect(stack.peek()?.label).toBe("연산 2");
    expect(stack.undo()?.label).toBe("연산 2");
    expect(stack.size()).toBe(1);
    expect(stack.peekRedo()?.label).toBe("연산 2");
    expect(stack.redo()?.label).toBe("연산 2");
    expect(stack.peekRedo()).toBeUndefined();
    expect(stack.size()).toBe(2);
    stack.undo();
    stack.push(entry(3));
    expect(stack.peekRedo()).toBeUndefined();
    expect(stack.redo()).toBeUndefined();
    const e3 = stack.undo()!;
    stack.clear();
    expect(stack.size()).toBe(0);
    expect(stack.peekRedo()).toBeUndefined();
    expect(stack.reachable(e3.before)).toEqual([]);
  });

  it("참조 집합(SPEC 3.5) = 지금 문서에서 실행 취소 · 다시 실행으로 닿는 문서만 — 끊긴 기록은 넣지 않는다", () => {
    const stack = createUndoStack();
    const [a, b, c] = [sampleDoc({ revision: 1 }), sampleDoc({ revision: 2 }), sampleDoc({ revision: 3 })];
    stack.push({ label: "1", before: a, after: b });
    stack.push({ label: "2", before: b, after: c });
    expect(stack.reachable(c)).toEqual([b, a]);
    stack.undo();
    expect(stack.reachable(b)).toEqual([a, c]);
    expect(stack.reachable(sampleDoc({ revision: 9 }))).toEqual([]);
  });
});

