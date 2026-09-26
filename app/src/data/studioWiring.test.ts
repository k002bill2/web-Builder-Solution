/**
 * DS-2A-04 2a-04a2 앱 배선 (SPEC 6.3 이음새 · P-B2): main의 deferred 로더가 store 하나로 보드·프로필 메모리 구현을 만든다.
 */
import { describe, expect, it, vi } from "vitest";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createDeferredProfileRepository } from "./deferredProfileRepository";
import { createMemoryStudio } from "./memoryStudio";
import { createSharedLoader } from "./sharedLoader";

const NOW = () => "2026-09-26T00:00:00.000Z";
const studioOf = () => createMemoryStudio({ catalog: FIXTURE_CATALOG, now: NOW, initialBoard: boardOf(["ref-a", "ref-c"], { hero: "ref-a" }) }, { now: NOW });

describe("createMemoryStudio — 보드·프로필이 store 하나를 쓴다", () => {
  it("보드 확정한 버전을 프로필 저장소가 읽고, 프로필 쪽 되돌리기를 보드가 계열 최신으로 읽는다", async () => {
    const { board, profiles } = studioOf();
    expect(await board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
    expect(await profiles.listProfiles()).toEqual([{ profileId: "profile-1", latestVersion: 1, baseReferenceId: "ref-a", updatedAt: NOW() }]);
    const changed = await board.savePicks({ hero: "ref-c" }, {}, 1);
    await board.createProfileVersion("profile-1", changed.revision, 1);
    await profiles.revertTo("profile-1", 1, 2);
    expect((await board.getBoard()).board.confirmed?.latestVersion).toBe(3);
  });

  it("스튜디오마다 store가 따로라 id가 늘 profile-1부터", async () => {
    const first = studioOf();
    const second = studioOf();
    await first.board.confirmProfile(1, 0);
    expect(await second.board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
    expect(await second.profiles.listProfiles()).toHaveLength(1);
  });
});

describe("createSharedLoader — 보드·프로필 래퍼가 같은 로드 결과를 받는다", () => {
  it("동시에 불러도 한 번만 불러온다", async () => {
    const load = vi.fn(async () => ({}));
    const shared = createSharedLoader(load);
    const [a, b] = await Promise.all([shared(), shared()]);
    expect(a).toBe(b);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("실패하면 캐시하지 않고 다음 호출에서 다시 불러온다", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("청크 실패")).mockResolvedValueOnce("ok");
    const shared = createSharedLoader(load as () => Promise<string>);
    await expect(shared()).rejects.toThrow("청크 실패");
    expect(await shared()).toBe("ok");
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe("createDeferredProfileRepository — 첫 호출 때 구현을 불러온다", () => {
  it("만들 때는 불러오지 않고, 조회·되돌리기를 구현에 위임한다", async () => {
    const studio = studioOf();
    const load = vi.fn(async () => studio.profiles);
    const repo = createDeferredProfileRepository(load);
    expect(load).not.toHaveBeenCalled();
    expect(await repo.listProfiles()).toEqual([]);
    await studio.board.confirmProfile(1, 0);
    const changed = await studio.board.savePicks({ hero: "ref-c" }, {}, 1);
    await studio.board.createProfileVersion("profile-1", changed.revision, 1);
    expect((await repo.getProfile("profile-1"))?.latestVersion).toBe(2);
    expect(await repo.revertTo("profile-1", 1, 2)).toMatchObject({ version: 3, origin: "revert" });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("불러오기에 실패하면 다음 호출에서 다시 시도한다", async () => {
    const studio = studioOf();
    const load = vi.fn().mockRejectedValueOnce(new Error("청크 실패")).mockResolvedValue(studio.profiles);
    const repo = createDeferredProfileRepository(load);
    await expect(repo.listProfiles()).rejects.toThrow("청크 실패");
    expect(await repo.listProfiles()).toEqual([]);
  });
});
