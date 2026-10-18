import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../../data/memoryCompareBoardRepository";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { CompareTrayProvider, useCompareTray } from "./CompareTrayContext";

const setup = (ids: readonly string[] = []) => {
  const repository = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(ids) });
  const wrapper = ({ children }: { readonly children: ReactNode }) => <CompareTrayProvider repository={repository}>{children}</CompareTrayProvider>;
  const hook = renderHook(() => useCompareTray(), { wrapper });
  return { repository, hook };
};

describe("트레이 통로 runQueued (RECO-SPEC 3.3 C2 · RQ-11)", () => {
  it("요청을 트레이 큐 순서대로 실행하고, 끝난 보드를 트레이에 반영한다", async () => {
    const { repository, hook } = setup(["ref-a"]);
    await waitFor(() => expect(hook.result.current.loaded).toBe(true));
    const order: string[] = [];
    await act(async () => {
      hook.result.current.add("ref-b");
      await hook.result.current.runQueued(async () => {
        order.push(`run:${(await repository.getBoard()).board.columns.length}`);
        return (await repository.addReference("ref-c")).board;
      });
    });
    expect(order).toEqual(["run:2"]);
    expect(hook.result.current.tray).toEqual(["ref-a", "ref-b", "ref-c"]);
  });

  it("요청이 실패해도 큐는 이어지고 트레이는 저장소 보드로 다시 맞춘다 — 결과 판정은 호출자 몫", async () => {
    const { hook } = setup(["ref-a"]);
    await waitFor(() => expect(hook.result.current.loaded).toBe(true));
    await act(async () => {
      await hook.result.current.runQueued(() => Promise.reject(new Error("저장 실패")));
    });
    expect(hook.result.current.tray).toEqual(["ref-a"]);
  });
});
