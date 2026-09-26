/** 2A-04b2 배선 — deferred 프로필 래퍼가 ProfileRepository 전체(조정 범위·저장 포함)를 위임한다 (SPEC 7 P-B2) */
import { describe, expect, it, vi } from "vitest";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createDeferredProfileRepository } from "./deferredProfileRepository";
import { createMemoryStudio } from "./memoryStudio";
import type { ProfileRepository } from "./profileRepository";

describe("deferred 프로필 저장소 — ProfileRepository 위임 (2a-04b2 배선)", () => {
  it("처음 부를 때만 불러오고, getAdjustmentRange·saveAdjustments·revertTo를 구현에 위임한다", async () => {
    const studio = createMemoryStudio({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b"], { hero: "ref-a" }) });
    await studio.board.confirmProfile(1, 0);
    const load = vi.fn(async (): Promise<ProfileRepository> => studio.profiles);
    const repo: ProfileRepository = createDeferredProfileRepository(load);
    expect(load).not.toHaveBeenCalled();
    expect((await repo.getAdjustmentRange("profile-1", 1)).density).toEqual(["comfortable", "compact"]);
    const saved = await repo.saveAdjustments("profile-1", 1, { density: "compact" });
    expect(saved).toMatchObject({ version: 2, origin: "adjust", adjustments: { density: "compact" } });
    expect((await repo.revertTo("profile-1", 1, 2)).version).toBe(3);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
