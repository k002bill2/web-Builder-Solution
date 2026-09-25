import { describe, expect, it, vi } from "vitest";
import { emptyBoard } from "../domain/compareBoard";
import { FIXTURE_CATALOG } from "../test/compareFixtures";
import { createDeferredCompareBoardRepository } from "./deferredCompareBoardRepository";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";

describe("보드 저장소 지연 로드 (ADR-004 첫 화면 JS — Codex R1)", () => {
  const initial = { board: emptyBoard("board-current", ""), released: [] };

  it("로드 전 보드 조회는 구현을 불러오지 않고 초기 보드를 돌려준다", async () => {
    const load = vi.fn(async () => createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG }));
    const repo = createDeferredCompareBoardRepository(load, initial);
    expect(await repo.getBoard()).toEqual(initial);
    expect(load).not.toHaveBeenCalled();
  });

  it("한 번 불러온 뒤에는 조회도 구현에 위임한다", async () => {
    const load = vi.fn(async () => createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG }));
    const repo = createDeferredCompareBoardRepository(load, initial);
    await repo.addReference("ref-a");
    expect((await repo.getBoard()).board.columns).toEqual([{ referenceId: "ref-a", label: "A" }]);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
