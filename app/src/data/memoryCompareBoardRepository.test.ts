import { describe, expect, it } from "vitest";
import { derivePalette } from "../domain/palette";
import { buildProfileDraft } from "../domain/profileDraft";
import { SECTION_LIBRARY, type SectionLibrary } from "../domain/sectionLibrary";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { FIXTURE_CATALOG, boardOf, catalogWithdrawing } from "../test/compareFixtures";
import { deferred } from "../test/deferred";
import { CompareBoardError } from "./compareBoardRepository";
import { createMemoryCompareBoardRepository, type BoardCall } from "./memoryCompareBoardRepository";

const IDS = ["ref-a", "ref-b", "ref-c"];
const NOW = () => "2026-09-25T00:00:00.000Z";
const repoWith = (picks = {}, extra: Parameters<typeof createMemoryCompareBoardRepository>[0] = { catalog: FIXTURE_CATALOG }) =>
  createMemoryCompareBoardRepository({ now: NOW, initialBoard: boardOf(IDS, picks), ...extra });

async function codeOf(promise: Promise<unknown>): Promise<string | undefined> {
  try {
    await promise;
    return undefined;
  } catch (error) {
    return error instanceof CompareBoardError ? error.code : String(error);
  }
}

describe("보드 조회·열 추가·빼기", () => {
  it("보드가 없으면 빈 보드", async () => {
    const repo = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, now: NOW });
    expect((await repo.getBoard()).board).toMatchObject({ columns: [], picks: {}, revision: 0 });
  });

  it("추가는 한도·중복·비노출을 거부하고, 빼기는 그 열 선택까지 한 번에 해제한다", async () => {
    const repo = repoWith({ card: "ref-b" });
    expect(await repo.addReference("ref-a")).toMatchObject({ ok: false, reason: "duplicate" });
    const withdrawn = createMemoryCompareBoardRepository({ catalog: catalogWithdrawing("ref-d"), now: NOW });
    expect(await withdrawn.addReference("ref-d")).toMatchObject({ ok: false, reason: "unavailable" });
    expect(await withdrawn.addReference("ref-nope")).toMatchObject({ ok: false, reason: "unavailable" });
    const removed = await repo.removeReference("ref-b");
    expect(removed.board.picks).toEqual({});
    expect(removed.released?.notice).toBe("B를 빼서 카드 선택 해제");
    const added = await repo.addReference("ref-d");
    expect(added.ok && added.board.columns.find((c) => c.referenceId === "ref-d")?.label).toBe("B");
  });
});

describe("AC-15(데이터) 회수·삭제 (S-08·S-09)", () => {
  it("AC-15: 회수된 B는 상태로 돌려주고, 진입 시 B의 선택을 해제해 한 번만 알린다. 열은 한도에 남는다", async () => {
    const repo = repoWith({ hero: "ref-b", footer: "ref-c" }, { catalog: catalogWithdrawing("ref-b") });
    const { results } = await repo.getComparison(IDS);
    expect(results.map((r) => r.status)).toEqual(["available", "withdrawn", "available"]);
    const first = await repo.getBoard();
    expect(first.board.picks).toEqual({ footer: "ref-c" });
    expect(first.board.columns).toHaveLength(3);
    expect(first.released.map((r) => r.notice)).toEqual(["B가 회수되어 Hero 선택을 해제했습니다"]);
    expect((await repo.getBoard()).released).toEqual([]);
  });

  it("회수된 열을 가리키는 저장은 LICENSE_BLOCKED", async () => {
    const repo = repoWith({}, { catalog: catalogWithdrawing("ref-b") });
    expect(await codeOf(repo.savePicks({ hero: "ref-b" }, {}, 1))).toBe("LICENSE_BLOCKED");
  });
});

describe("savePicks 검증 (SPEC 8.2)", () => {
  it("revision이 다르면 STALE_BOARD와 최신 보드", async () => {
    const repo = repoWith();
    const error = await repo.savePicks({ hero: "ref-a" }, {}, 0).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CompareBoardError);
    expect((error as CompareBoardError).board?.revision).toBe(1);
  });

  it("다른 곳에서 뺀 열을 옛 revision으로 저장하면 SCHEMA_INVALID가 아니라 STALE_BOARD + 최신 보드 (Codex R1)", async () => {
    const repo = repoWith();
    await repo.removeReference("ref-b");
    const error = await repo.savePicks({ hero: "ref-b" }, {}, 1).catch((e: unknown) => e);
    expect(error).toMatchObject({ code: "STALE_BOARD", board: { revision: 2 } });
  });

  it("AC-14(데이터): 잘못된 대표색·보드 밖 열은 SCHEMA_INVALID로 저장하지 않는다", async () => {
    const repo = repoWith();
    expect(await codeOf(repo.savePicks({ hero: "ref-a" }, { primaryColor: "abc" }, 1))).toBe("SCHEMA_INVALID");
    expect(await codeOf(repo.savePicks({ hero: "ref-d" }, {}, 1))).toBe("SCHEMA_INVALID");
    expect((await repo.getBoard()).board.revision).toBe(1);
  });

  it("저장하면 revision이 1 오르고 대표색은 대문자로 정규화된다", async () => {
    const board = await repoWith().savePicks({ hero: "ref-b" }, { primaryColor: "#c9a96e" }, 1);
    expect(board).toMatchObject({ picks: { hero: "ref-b" }, custom: { primaryColor: "#C9A96E" }, revision: 2 });
  });
});

describe("AC-23 저장 경합 — 저장소 revision 조건부", () => {
  it("AC-23: 같은 revision으로 보낸 두 저장이 역순으로 도착해도 최종 보드는 늦게 요청한 B다", async () => {
    const gate = deferred();
    const delay = ({ method, seq, phase }: BoardCall) => (method === "savePicks" && seq === 1 && phase === "request" ? gate.promise : undefined);
    const repo = repoWith({ hero: "ref-a" }, { catalog: FIXTURE_CATALOG, delay });
    const early = repo.savePicks({ hero: "ref-c" }, {}, 1);
    const late = await repo.savePicks({ hero: "ref-b" }, {}, 1);
    gate.resolve();
    expect(await codeOf(early)).toBe("STALE_BOARD");
    expect(late).toMatchObject({ picks: { hero: "ref-b" }, revision: 2 });
    expect((await repo.getBoard()).board).toMatchObject({ picks: { hero: "ref-b" }, revision: 2 });
  });
});

describe("확정 (SPEC 8.2 · AC-24·25·26)", () => {
  it("저장이 끝난 revision으로만 확정한다 — 다르면 STALE_BOARD, Hero가 없으면 UNSUPPORTED_COMBINATION", async () => {
    expect(await codeOf(repoWith({ hero: "ref-a" }).confirmProfile(0))).toBe("STALE_BOARD");
    expect(await codeOf(repoWith({ card: "ref-a" }).confirmProfile(1))).toBe("UNSUPPORTED_COMBINATION");
  });

  it("AC-24: 확정된 color_tokens는 역할 팔레트 전체이고 보드 대비 검사가 쓴 팔레트와 같다", async () => {
    const repo = repoWith();
    const board = await repo.savePicks({ hero: "ref-a" }, { primaryColor: "#C9A96E" }, 1);
    const { libraryVersion, results } = await repo.getComparison(board.columns.map((c) => c.referenceId));
    const draft = buildProfileDraft(board, results, libraryVersion);
    const { profileId } = await repo.confirmProfile(board.revision);
    const [v1] = await repo.getProfileVersions(profileId);
    const stored = v1!.profile.color_tokens;
    expect(Object.keys(stored).filter((k) => !k.startsWith("$"))).toEqual(["primary", "surface", "ink", "muted", "bg"]);
    expect(draft.status === "ready" && draft.palette).toEqual(derivePalette("#C9A96E", referenceDetailFixtures["ref-a"]!.palette));
    const checked = draft.status === "ready" ? draft.palette : [];
    expect(checked.map((p) => [p.role, p.hex])).toEqual(Object.entries(stored).filter(([k]) => !k.startsWith("$")).map(([k, v]) => [k, (v as { $value: string }).$value]));
  });

  it("AC-25: v1 확정 후 선택을 바꿔 다시 확정하면 같은 프로필의 v2가 생기고 v1은 바뀌지 않는다", async () => {
    const repo = repoWith({ hero: "ref-a" });
    const v1 = await repo.confirmProfile(1);
    expect(v1).toEqual({ profileId: "profile-1", version: 1 });
    const [record] = await repo.getProfileVersions("profile-1");
    const snapshot = structuredClone(record);
    const changed = await repo.savePicks({ hero: "ref-c" }, {}, 1);
    expect((await repo.getBoard()).board.confirmed).toEqual({ profileId: "profile-1", version: 1, revision: 1 });
    expect(await repo.confirmProfile(changed.revision)).toEqual({ profileId: "profile-1", version: 2 });
    const versions = await repo.getProfileVersions("profile-1");
    expect(versions.map((v) => v.version)).toEqual([1, 2]);
    expect(versions[0]).toEqual(snapshot);
    expect(Object.isFrozen(versions[0])).toBe(true);
    expect(versions[1]!.profile.component_choices.hero?.variant).toBe("center");
    expect(await repo.createProfileVersion("profile-1", changed.revision)).toEqual({ profileId: "profile-1", version: 3 });
    expect(await codeOf(repo.createProfileVersion("profile-9", changed.revision))).toBe("SCHEMA_INVALID");
  });

  it("R-12: 사업자정보 없는 Footer는 확정 시 같은 모양의 확장 변형으로 저장한다", async () => {
    const repo = repoWith({ hero: "ref-a", footer: "ref-b" });
    const { profileId } = await repo.confirmProfile(1);
    const [v1] = await repo.getProfileVersions(profileId);
    expect(v1!.profile.component_choices.footer).toEqual({ section: "footer", variant: "minimal-biz" });
    expect(v1!.profile.section_plan.at(-1)).toEqual({ type: "footer", variant: "minimal-biz" });
  });

  it("AC-26: 라이브러리에 없는 B Footer는 선택 불가 셀이고, 확정 library_version은 getComparison의 libraryVersion이다", async () => {
    const library: SectionLibrary = {
      ...SECTION_LIBRARY,
      version: "1.5",
      sections: { ...SECTION_LIBRARY.sections, footer: { "biz-extended": { label: "확장형 사업자정보", hasBusinessInfo: true } } },
    };
    const repo = repoWith({ hero: "ref-a" }, { catalog: FIXTURE_CATALOG, library });
    const { libraryVersion, results } = await repo.getComparison(IDS);
    expect(libraryVersion).toBe("1.5");
    expect(results[1]!.comparison!.cells.footer).toMatchObject({ label: "현재 라이브러리에 없는 변형", binding: null });
    expect(await codeOf(repo.savePicks({ hero: "ref-a", footer: "ref-b" }, {}, 1))).toBe("UNSUPPORTED_COMBINATION");
    const { profileId } = await repo.confirmProfile(1);
    expect((await repo.getProfileVersions(profileId))[0]!.profile.library_version).toBe(libraryVersion);
  });
});

describe("실패 주입", () => {
  it("지정한 호출을 실패시킬 수 있다", async () => {
    const repo = repoWith({}, { catalog: FIXTURE_CATALOG, fail: ({ method }) => (method === "getBoard" ? new Error("네트워크") : undefined) });
    await expect(repo.getBoard()).rejects.toThrow("네트워크");
  });
});
