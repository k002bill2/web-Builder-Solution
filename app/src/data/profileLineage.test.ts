/**
 * DS-2A-04 2a-04a1 — 공유 저장 모듈 위 버전 계보·expectedLatest·보드 확정 트랜잭션 (SPEC 6.1~6.3 r3).
 * 보드·프로필 메모리 저장소를 store 하나로 만들어 "다른 탭"의 쓰기를 재현한다.
 */
import { describe, expect, it } from "vitest";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { deferred } from "../test/deferred";
import { CompareBoardError, type CompareBoardRepository } from "./compareBoardRepository";
import { createMemoryCompareBoardRepository, type BoardCall } from "./memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "./memoryProfileRepository";
import { ProfileError, type ProfileRepository } from "./profileRepository";
import { createStudioStore } from "./studioStore";
import { insertOtherVersion } from "../test/studioFixtures";

const IDS = ["ref-a", "ref-b", "ref-c"];
const NOW = () => "2026-09-26T00:00:00.000Z";

function setup(extra: { delay?: (call: BoardCall) => Promise<void> | undefined; fail?: (call: BoardCall) => Error | undefined } = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, now: NOW, initialBoard: boardOf(IDS, { hero: "ref-a" }), store, ...extra });
  const profiles = createMemoryProfileRepository({ store, now: NOW });
  const versionsOf = async (id = "profile-1") => (await profiles.getProfile(id))?.versions.map((v) => v.version) ?? [];
  return { store, board, profiles, versionsOf };
}

async function errorOf(promise: Promise<unknown>): Promise<CompareBoardError | ProfileError | Error | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error as Error;
  }
}

/** v1 보드 확정 → 선택 변경(revision 2) */
async function confirmedThenChanged(board: CompareBoardRepository) {
  await board.confirmProfile(1, 0);
  return board.savePicks({ hero: "ref-c" }, {}, 1);
}

describe("P-AC-10(저장소) 되돌리기 = 새 버전, 이전 레코드 불변", () => {
  it("v1(ref-a)·v2(ref-c) 뒤 v1로 되돌리면 v3(origin revert, basedOn 1) = v1 내용, v1·v2는 그대로·동결", async () => {
    const { board, profiles } = setup();
    const changed = await confirmedThenChanged(board);
    await board.createProfileVersion("profile-1", changed.revision, 1);
    const before = (await profiles.getProfile("profile-1"))!.versions;
    const snapshot = structuredClone(before);
    const v3 = await profiles.revertTo("profile-1", 1, 2);
    expect(v3).toMatchObject({ profileId: "profile-1", version: 3, origin: "revert", basedOn: 1, createdAt: NOW() });
    expect(v3.base).toEqual(before[0]!.base);
    expect(v3.adjustments).toEqual(before[0]!.adjustments);
    const after = (await profiles.getProfile("profile-1"))!;
    expect(after.latestVersion).toBe(3);
    expect(after.versions.slice(0, 2)).toEqual(snapshot);
    expect(after.versions.every((v) => Object.isFrozen(v) && Object.isFrozen(v.base))).toBe(true);
    expect(Object.isFrozen(v3)).toBe(true);
  });

  it("계열 조회·목록: 없으면 undefined·빈 목록, 있으면 최신 버전·기준 레퍼런스·갱신 시각", async () => {
    const { board, profiles } = setup();
    expect(await profiles.getProfile("profile-1")).toBeUndefined();
    expect(await profiles.listProfiles()).toEqual([]);
    await board.confirmProfile(1, 0);
    expect(await profiles.getProfile("profile-1")).toMatchObject({ profileId: "profile-1", latestVersion: 1, versions: [{ version: 1, origin: "board", boardRevision: 1, adjustments: {} }] });
    expect(await profiles.listProfiles()).toEqual([{ profileId: "profile-1", latestVersion: 1, baseReferenceId: "ref-a", updatedAt: NOW() }]);
  });

  it("A-Q3: 최신 버전으로 되돌리기는 SCHEMA_INVALID '이미 최신 버전입니다', 새 버전 0 — 최신이 낡았으면 STALE_PROFILE이 먼저", async () => {
    const { board, profiles, versionsOf } = setup();
    const changed = await confirmedThenChanged(board);
    await board.createProfileVersion("profile-1", changed.revision, 1);
    const error = await errorOf(profiles.revertTo("profile-1", 2, 2));
    expect(error).toBeInstanceOf(ProfileError);
    expect(error).toMatchObject({ code: "SCHEMA_INVALID", message: "SCHEMA_INVALID: 이미 최신 버전입니다" });
    expect(await errorOf(profiles.revertTo("profile-1", 2, 1))).toMatchObject({ code: "STALE_PROFILE", series: { latestVersion: 2 } });
    expect(await versionsOf()).toEqual([1, 2]);
  });

  it("없는 프로필·버전 되돌리기는 NOT_FOUND, 새 버전 0", async () => {
    const { board, profiles, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    expect(await errorOf(profiles.revertTo("profile-9", 1, 1))).toMatchObject({ code: "NOT_FOUND" });
    expect(await errorOf(profiles.revertTo("profile-1", 7, 1))).toMatchObject({ code: "NOT_FOUND" });
    expect(await versionsOf()).toEqual([1]);
  });
});

describe("A-Q1 ProfileVersion.baseReferenceId 필드", () => {
  it("보드 확정 = 초안의 기준 레퍼런스, 되돌리기 = 대상 버전 값 복사, 목록은 최신 버전 필드에서 읽는다", async () => {
    const { board, profiles } = setup();
    const changed = await confirmedThenChanged(board);
    await board.createProfileVersion("profile-1", changed.revision, 1);
    expect((await profiles.listProfiles())[0]?.baseReferenceId).toBe("ref-c");
    const v3 = await profiles.revertTo("profile-1", 1, 2);
    expect(v3.baseReferenceId).toBe("ref-a");
    const series = (await profiles.getProfile("profile-1"))!;
    expect(series.versions.map((v) => [v.version, v.baseReferenceId])).toEqual([[1, "ref-a"], [2, "ref-c"], [3, "ref-a"]]);
    expect((await profiles.listProfiles())[0]?.baseReferenceId).toBe("ref-a");
  });
});

describe("P-AC-11(저장소) 버전 계보 — 보드는 계열 최신을 읽는다", () => {
  it("프로필 쪽 v2 뒤 보드가 돌려주는 모든 보드에 latestVersion·latest·confirmedBase, 재확정 결과 v3", async () => {
    const { store, board, profiles } = setup();
    await board.confirmProfile(1, 0);
    const v1 = (await profiles.getProfile("profile-1"))!.versions[0]!;
    insertOtherVersion(store);
    const { board: loaded } = await board.getBoard();
    expect(loaded.confirmed).toMatchObject({ profileId: "profile-1", version: 1, latestVersion: 2, latest: { version: 2, base: v1.base, adjustments: {} } });
    expect(loaded.confirmed?.confirmedBase).toBe(v1.base);
    const saved = await board.savePicks({ hero: "ref-c" }, {}, loaded.revision);
    expect(saved.confirmed?.latestVersion).toBe(2);
    expect(await board.createProfileVersion("profile-1", saved.revision, 2)).toEqual({ profileId: "profile-1", version: 3 });
    expect((await profiles.getProfile("profile-1"))!.versions.map((v) => [v.version, v.origin])).toEqual([[1, "board"], [2, "adjust"], [3, "board-reconfirm"]]);
  });
});

describe("P-AC-40(저장소) 보드 확정 경쟁 — STALE_PROFILE", () => {
  it("보드가 v2를 본 뒤 다른 쓰기가 v3을 만들면 확정은 STALE_PROFILE(최신 동봉), 새 버전 0 → 최신으로 다시 확정하면 v4", async () => {
    const { store, board, profiles, versionsOf } = setup();
    const changed = await confirmedThenChanged(board);
    insertOtherVersion(store);
    await profiles.revertTo("profile-1", 1, 2);
    const error = await errorOf(board.createProfileVersion("profile-1", changed.revision, 2));
    expect(error).toBeInstanceOf(CompareBoardError);
    expect(error).toMatchObject({ code: "STALE_PROFILE", profileHead: { version: 3 } });
    expect(await versionsOf()).toEqual([1, 2, 3]);
    expect((await board.getBoard()).board.confirmed).toMatchObject({ version: 1, revision: 1 });
    expect(await board.confirmProfile(changed.revision, 3)).toEqual({ profileId: "profile-1", version: 4 });
  });

  it("판정 순서: 보드도 낡고 계열도 낡으면 STALE_BOARD가 먼저, 동봉한 최신 보드에는 latestVersion이 채워져 있다", async () => {
    const { store, board } = setup();
    const changed = await confirmedThenChanged(board);
    insertOtherVersion(store);
    const error = await errorOf(board.createProfileVersion("profile-1", changed.revision - 1, 1));
    expect(error).toMatchObject({ code: "STALE_BOARD", board: { revision: changed.revision, confirmed: { latestVersion: 2 } } });
  });

  it("되돌리기도 expectedLatest가 다르면 STALE_PROFILE(최신 계열 동봉), 새 버전 0", async () => {
    const { store, board, profiles, versionsOf } = setup();
    await board.confirmProfile(1, 0);
    insertOtherVersion(store);
    const error = await errorOf(profiles.revertTo("profile-1", 1, 1));
    expect(error).toBeInstanceOf(ProfileError);
    expect(error).toMatchObject({ code: "STALE_PROFILE", series: { profileId: "profile-1", latestVersion: 2 } });
    expect(await versionsOf()).toEqual([1, 2]);
  });
});

describe("P-AC-41 동시 쓰기 원자성", () => {
  it.each([
    ["보드 확정이 먼저 도착", ["board", "revert"]],
    ["되돌리기가 먼저 도착", ["revert", "board"]],
  ] as const)("같은 expectedLatest로 보드 확정 + 되돌리기를 동시에(응답 지연) → 정확히 1개 성공·1개 STALE_PROFILE, 번호 연속 (%s)", async (_, order) => {
    const gate = deferred();
    const { store, board, profiles, versionsOf } = setup({ delay: (call) => (call.method === "createProfileVersion" && call.phase === "response" ? gate.promise : undefined) });
    const changed = await confirmedThenChanged(board);
    insertOtherVersion(store);
    const writes = { board: () => board.createProfileVersion("profile-1", changed.revision, 2), revert: () => profiles.revertTo("profile-1", 1, 2) };
    const pending = order.map((w) => writes[w]());
    gate.resolve();
    const settled = await Promise.allSettled(pending);
    expect(settled.filter((s) => s.status === "fulfilled")).toHaveLength(1);
    const rejected = settled.flatMap((s) => (s.status === "rejected" ? [s.reason as { code?: string }] : []));
    expect(rejected.map((e) => e.code)).toEqual(["STALE_PROFILE"]);
    expect(await versionsOf()).toEqual([1, 2, 3]);
  });

  it("네 쓰기 모두 expectedLatest가 필수 인자다 (빠지면 typecheck 실패)", () => {
    const typeOnly = (b: CompareBoardRepository, p: ProfileRepository) => {
      // @ts-expect-error expectedLatest 필수
      void b.confirmProfile(1);
      // @ts-expect-error expectedLatest 필수
      void b.createProfileVersion("profile-1", 1);
      // @ts-expect-error expectedLatest 필수
      void p.revertTo("profile-1", 1);
      // @ts-expect-error expectedLatest 필수
      void p.saveAdjustments("profile-1", {});
    };
    expect(typeOnly).toBeTypeOf("function");
  });
});

describe("P-AC-42 보드 확정 원자성·멱등 (6.3 r3)", () => {
  it("① commit 단계 실패 → 계열·보드 변화 0, 같은 인자로 다시 확정하면 성공(번호·id 건너뜀 0)", async () => {
    let failing = true;
    const { board, profiles, versionsOf } = setup({ fail: (call) => (failing && call.phase === "commit" ? new Error("커밋 실패") : undefined) });
    expect(await errorOf(board.confirmProfile(1, 0))).toMatchObject({ message: "커밋 실패" });
    expect(await profiles.listProfiles()).toEqual([]);
    const untouched = (await board.getBoard()).board;
    expect(untouched.confirmed).toBeUndefined();
    expect(untouched.revision).toBe(1);
    failing = false;
    expect(await board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
    const changed = await board.savePicks({ hero: "ref-c" }, {}, 1);
    failing = true;
    expect(await errorOf(board.createProfileVersion("profile-1", changed.revision, 1))).toMatchObject({ message: "커밋 실패" });
    expect(await versionsOf()).toEqual([1]);
    expect((await board.getBoard()).board.confirmed).toMatchObject({ version: 1, revision: 1, latestVersion: 1 });
    failing = false;
    expect(await board.createProfileVersion("profile-1", changed.revision, 1)).toEqual({ profileId: "profile-1", version: 2 });
  });

  it("② 커밋 뒤 응답 실패 → 저장은 끝남, 같은 키로 다시 부르면 STALE 없이 같은 결과·새 버전 0 (첫 확정 재시도는 confirmProfile 그대로)", async () => {
    const { board, versionsOf } = setup({
      delay: (call) => (call.phase === "response" && call.seq === 1 && call.method !== "getBoard" && call.method !== "savePicks" ? Promise.reject(new Error("응답 끊김")) : undefined),
    });
    expect(await errorOf(board.confirmProfile(1, 0))).toMatchObject({ message: "응답 끊김" });
    expect(await versionsOf()).toEqual([1]);
    expect(await board.confirmProfile(1, 0)).toEqual({ profileId: "profile-1", version: 1 });
    expect(await versionsOf()).toEqual([1]);
    const changed = await board.savePicks({ hero: "ref-c" }, {}, 1);
    expect(await errorOf(board.createProfileVersion("profile-1", changed.revision, 1))).toMatchObject({ message: "응답 끊김" });
    expect(await board.createProfileVersion("profile-1", changed.revision, 1)).toEqual({ profileId: "profile-1", version: 2 });
    expect(await versionsOf()).toEqual([1, 2]);
  });

  it("③ 다른 revision·다른 expectedLatest면 멱등 결과가 아니라 기존 판정(STALE_BOARD / STALE_PROFILE)", async () => {
    const { board, versionsOf } = setup({
      delay: (call) => (call.method === "confirmProfile" && call.phase === "response" && call.seq === 1 ? Promise.reject(new Error("응답 끊김")) : undefined),
    });
    await errorOf(board.confirmProfile(1, 0));
    expect(await errorOf(board.confirmProfile(0, 0))).toMatchObject({ code: "STALE_BOARD" });
    expect(await errorOf(board.confirmProfile(1, 5))).toMatchObject({ code: "STALE_PROFILE", profileHead: { version: 1 } });
    expect(await versionsOf()).toEqual([1]);
  });
});
