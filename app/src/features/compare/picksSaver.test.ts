import { describe, expect, it } from "vitest";
import { CompareBoardError } from "../../data/compareBoardRepository";
import { createMemoryCompareBoardRepository, type BoardCall } from "../../data/memoryCompareBoardRepository";
import { confirmAvailability } from "../../domain/confirmGate";
import { buildProfileDraft } from "../../domain/profileDraft";
import { FIXTURE_CATALOG, boardOf } from "../../test/compareFixtures";
import { deferred } from "../../test/deferred";
import { createPicksSaver } from "./picksSaver";

const IDS = ["ref-a", "ref-b", "ref-c"];
const NOW = () => "2026-09-25T00:00:00.000Z";

function setup(delay?: (call: BoardCall) => Promise<void> | undefined, fail?: (call: BoardCall) => Error | undefined) {
  const initial = boardOf(IDS, { hero: "ref-a" });
  const repo = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, now: NOW, initialBoard: initial, delay, fail });
  return { repo, saver: createPicksSaver(repo, initial) };
}

describe("AC-23 저장 직렬화 (클라이언트)", () => {
  it("AC-23: 저장이 끝나기 전에는 확정할 수 없고, 끝난 뒤 B가 반영된 revision으로 확정된다", async () => {
    const gate = deferred();
    const { repo, saver } = setup(({ method, phase }) => (method === "savePicks" && phase === "response" ? gate.promise : undefined));
    const saving = saver.save({ hero: "ref-b" }, {});
    expect(saver.getState().status).toBe("saving");
    const { libraryVersion, results } = await repo.getComparison(IDS);
    const draft = buildProfileDraft({ ...saver.getState().board, picks: { hero: "ref-b" } }, results, libraryVersion);
    expect(confirmAvailability(draft, saver.getState().status)).toEqual({ ok: false, reason: "선택을 저장하는 중입니다" });
    gate.resolve();
    await saving;
    const { board, status } = saver.getState();
    expect(status).toBe("saved");
    expect(board).toMatchObject({ picks: { hero: "ref-b" }, revision: 2 });
    const { profileId } = await repo.confirmProfile(board.revision);
    expect((await repo.getProfileVersions(profileId))[0]!.profile.component_choices.hero?.variant).toBe("split");
  });

  it("AC-23: 앞 저장 응답이 늦게 와도 연속 저장은 앞 요청이 끝난 뒤 최신 상태 한 번만 보내 최종 보드가 마지막 선택이다", async () => {
    const gate = deferred();
    const calls: string[] = [];
    const { repo, saver } = setup(({ method, seq, phase }) => {
      if (method === "savePicks" && phase === "request") calls.push(`save#${seq}`);
      return method === "savePicks" && seq === 1 && phase === "response" ? gate.promise : undefined;
    });
    const first = saver.save({ hero: "ref-c" }, {});
    const second = saver.save({ hero: "ref-a", card: "ref-c" }, {});
    const third = saver.save({ hero: "ref-b" }, {});
    gate.resolve();
    await Promise.all([first, second, third]);
    expect(calls).toHaveLength(2);
    expect(saver.getState()).toMatchObject({ status: "saved", board: { picks: { hero: "ref-b" }, revision: 3 } });
    expect((await repo.getBoard()).board).toMatchObject({ picks: { hero: "ref-b" }, revision: 3 });
  });

  it("실패하면 error 상태이고 다시 시도하면 마지막 선택을 저장한다", async () => {
    let failNext = true;
    const { saver } = setup(undefined, ({ method }) => {
      if (method !== "savePicks" || !failNext) return undefined;
      failNext = false;
      return new Error("네트워크");
    });
    await saver.save({ hero: "ref-c" }, {});
    expect(saver.getState().status).toBe("error");
    await saver.retry();
    expect(saver.getState()).toMatchObject({ status: "saved", board: { picks: { hero: "ref-c" } } });
  });

  it("저장 중에 바꾼 최신 선택은 앞 저장이 실패해도 버리지 않고 다시 시도에서 저장한다 (Codex R1)", async () => {
    const gate = deferred();
    const { repo, saver } = setup(
      ({ method, seq, phase }) => (method === "savePicks" && seq === 1 && phase === "request" ? gate.promise : undefined),
      ({ method, seq }) => (method === "savePicks" && seq === 1 ? new Error("네트워크") : undefined),
    );
    const first = saver.save({ hero: "ref-b" }, {});
    const second = saver.save({ hero: "ref-c" }, {});
    gate.resolve();
    await Promise.all([first, second]);
    expect(saver.getState().status).toBe("error");
    await saver.retry();
    expect(saver.getState()).toMatchObject({ status: "saved", board: { picks: { hero: "ref-c" } } });
    expect((await repo.getBoard()).board.picks).toEqual({ hero: "ref-c" });
  });

  it("STALE_BOARD 뒤 최신 보드 재조회까지 실패하면 error 상태로 두고 다시 시도할 수 있다 (Codex R2)", async () => {
    let saves = 0;
    const repo = {
      savePicks: async () => {
        saves += 1;
        throw new CompareBoardError("STALE_BOARD", "보드 없음");
      },
      getBoard: async () => {
        throw new Error("네트워크");
      },
    };
    const saver = createPicksSaver(repo, boardOf(IDS, { hero: "ref-a" }));
    await saver.save({ hero: "ref-b" }, {});
    expect(saver.getState()).toMatchObject({ status: "error", error: "STALE_BOARD" });
    await saver.retry();
    expect(saves).toBe(2);
    expect(saver.getState().status).toBe("error");
  });

  it("STALE_BOARD면 최신 보드로 맞추고 stale 표시를 남긴다 (S-14)", async () => {
    const { repo, saver } = setup();
    await repo.savePicks({ hero: "ref-c" }, {}, 1);
    await saver.save({ hero: "ref-b" }, {});
    // 최신 보드로 맞췄으므로 저장할 것이 남지 않았다 — 확정을 막지 않고 STALE 안내만 남긴다 (Codex R3)
    expect(saver.getState()).toMatchObject({ status: "saved", error: "STALE_BOARD", board: { picks: { hero: "ref-c" }, revision: 2 } });
  });
});

describe("P-8 확정 가능 조건", () => {
  it("Hero 선택 + 저장 완료일 때만 확정 가능, 아니면 이유 텍스트", async () => {
    const repo = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, now: NOW, initialBoard: boardOf(IDS) });
    const { libraryVersion, results } = await repo.getComparison(IDS);
    const noHero = buildProfileDraft(boardOf(IDS), results, libraryVersion);
    const withHero = buildProfileDraft(boardOf(IDS, { hero: "ref-a" }), results, libraryVersion);
    expect(confirmAvailability(noHero, "saved")).toEqual({ ok: false, reason: "Hero를 하나 고르면 확정할 수 있습니다" });
    expect(confirmAvailability(withHero, "error")).toEqual({ ok: false, reason: "저장하지 못한 선택이 있습니다 · 다시 시도" });
    expect(confirmAvailability(withHero, "saved")).toEqual({ ok: true });
    expect(confirmAvailability(withHero, "idle")).toEqual({ ok: true });
  });
});
