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
import { cachedChunkFailure } from "../test/chunkFailureCache";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const loads = vi.hoisted(() => ({ boardConfirm: vi.fn(), profileWrites: vi.fn(), actualBoardConfirm: undefined as unknown as () => Promise<unknown> }));
vi.mock("../data/writeBodyLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/writeBodyLoader")>();
  loads.actualBoardConfirm = actual.loadBoardConfirm;
  loads.boardConfirm.mockImplementation(actual.loadBoardConfirm);
  loads.profileWrites.mockImplementation(actual.loadProfileWrites);
  return { ...actual, loadBoardConfirm: loads.boardConfirm, loadProfileWrites: loads.profileWrites };
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

afterEach(() => {
  vi.restoreAllMocks();
  loads.boardConfirm.mockImplementation(loads.actualBoardConfirm);
});

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

  it("F1(D-2A4-01): 정적 import가 계속 실패(브라우저 실패 캐시·오류에 URL 없음) → '다시 시도'는 같은 청크를 새 URL로 — 두 번 연속 실패면 오류 유지, 세 번째에 v1", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { board, versionsOf } = studio();
    const chunk = cachedChunkFailure("memoryBoardConfirm-W1.js", () => import("../data/memoryBoardConfirm"), { failures: 1 });
    loads.boardConfirm.mockImplementation(chunk.loader);
    const view = renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board);
    await screen.findByRole("heading", { level: 1, name: "비교 보드" });
    await userEvent.click(confirmButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("확정하지 못했습니다");
    await userEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(chunk.retries).toHaveLength(1));
    expect(await screen.findByRole("alert")).toHaveTextContent("확정하지 못했습니다");
    expect(await versionsOf()).toEqual([]);
    await userEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(view.router.state.location.pathname).toBe("/profile/profile-1"));
    expect(await versionsOf()).toEqual([1]);
    expect(chunk.staticImport).toHaveBeenCalledTimes(1);
    expect(chunk.retries.map((url) => url.replace(/^.*\//, ""))).toEqual(["memoryBoardConfirm-W1.js?retry=1", "memoryBoardConfirm-W1.js?retry=2"]);
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

describe("2a-04b2 번들 분류 근거 — /profile 진입(범위 조회)은 쓰기 본문을 받지 않는다", () => {
  it("진입 때 getAdjustmentRange를 자동으로 불러도 본문 요청 0 → '조정 저장' 클릭 뒤에만 1회, 본문 로드 실패면 저장 0 + 다시 시도로 v2", async () => {
    const s = studio();
    await s.board.confirmProfile(1, 0);
    const range = vi.spyOn(s.profiles, "getAdjustmentRange");
    loads.profileWrites.mockClear();
    renderApp("/profile/profile-1", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), s.board, s.profiles);
    await screen.findByRole("radiogroup", { name: "밀도" });
    expect(range).toHaveBeenCalledWith("profile-1", 1);
    expect(loads.profileWrites).not.toHaveBeenCalled();
    loads.profileWrites.mockRejectedValueOnce(chunkError());
    await userEvent.click(within(screen.getByRole("radiogroup", { name: "밀도" })).getByRole("radio", { name: "촘촘" }));
    await userEvent.click(screen.getByRole("button", { name: "조정 저장 (v2)" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("저장하지 못했습니다");
    expect(await s.versionsOf()).toEqual([1]);
    await userEvent.click(screen.getByRole("button", { name: "다시 시도" }));
    expect(await screen.findByRole("status", { name: "프로필 알림" })).toHaveTextContent("v2로 저장했습니다");
    expect(loads.profileWrites).toHaveBeenCalledTimes(2);
    expect(await s.versionsOf()).toEqual([1, 2]);
  });
});
