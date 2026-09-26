/**
 * FIX3-2A04b1 1안 — 저장소 쓰기 본문(보드 확정·되돌리기)은 처음 부를 때 받는다. 본문 청크 로드가 실패하면
 * 저장 0·오류 표시, 같은 인자로 다시 부르면 성공(번호 건너뜀 0). 로더 모듈을 감싸 실패를 주입한다(기본 = 실제 import).
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const loads = vi.hoisted(() => ({ boardConfirm: vi.fn(), profileWrites: vi.fn() }));
vi.mock("../data/writeBodyLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/writeBodyLoader")>();
  loads.boardConfirm.mockImplementation(actual.loadBoardConfirm);
  loads.profileWrites.mockImplementation(actual.loadProfileWrites);
  return { loadBoardConfirm: loads.boardConfirm, loadProfileWrites: loads.profileWrites };
});

const THREE = ["ref-a", "ref-b", "ref-c"];
const confirmButton = () => screen.getByRole("button", { name: /확정 \(v\d\)$/ });
const chunkError = () => new Error("Failed to fetch dynamically imported module");

function studio() {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  const versionsOf = async () => (await profiles.getProfile("profile-1"))?.versions.map((v) => v.version) ?? [];
  return { store, board, profiles, versionsOf };
}

afterEach(() => vi.restoreAllMocks());

describe("FIX3 1안 쓰기 본문 로드 실패 — 저장 0·오류 표시·다시 시도", () => {
  it("보드 확정: 본문 청크 로드 실패 → '확정하지 못했습니다' + '다시 시도', 계열·보드 확정 변화 0 → 다시 시도하면 v1(id 건너뜀 0)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { board, profiles, versionsOf } = studio();
    const view = renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board);
    await screen.findByRole("heading", { level: 1, name: "비교 보드" });
    loads.boardConfirm.mockRejectedValueOnce(chunkError());
    await userEvent.click(confirmButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("확정하지 못했습니다");
    expect(await profiles.listProfiles()).toEqual([]);
    const { board: untouched } = await board.getBoard();
    expect(untouched.confirmed).toBeUndefined();
    expect(untouched.revision).toBe(1);
    expect(view.router.state.location.pathname).toBe("/compare");
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(view.router.state.location.pathname).toBe("/profile/profile-1"));
    expect(await versionsOf()).toEqual([1]);
  });

  it("되돌리기(저장소): 본문 청크 로드 실패 → 같은 오류로 거부, 새 버전 0 → 같은 인자로 다시 부르면 v3(번호 건너뜀 0)", async () => {
    const { board, profiles, versionsOf } = studio();
    await board.confirmProfile(1, 0);
    const changed = await board.savePicks({ hero: "ref-c" }, {}, 1);
    await board.createProfileVersion("profile-1", changed.revision, 1);
    loads.profileWrites.mockRejectedValueOnce(chunkError());
    await expect(profiles.revertTo("profile-1", 1, 2)).rejects.toThrow("Failed to fetch dynamically imported module");
    expect(await versionsOf()).toEqual([1, 2]);
    expect(await profiles.revertTo("profile-1", 1, 2)).toMatchObject({ version: 3, origin: "revert", basedOn: 1 });
    expect(await versionsOf()).toEqual([1, 2, 3]);
  });
});
