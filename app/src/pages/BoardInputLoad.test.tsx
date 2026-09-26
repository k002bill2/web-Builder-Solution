/**
 * BUNDLE-HEADROOM H — 보드 입력 검증(boardInput, zod)은 조작 뒤 청크다. 진입 직후(/compare·/profile) 요청 0,
 * 선택 저장(savePicks ← 조작 핸들러)과 대표색 검사(포커스·blur·Enter) 때만 받는다. 로드 실패면 저장 0 + 다시 시도.
 * 두 로더(저장소 writeBodyLoader · 화면 boardInputLoader)를 감싸 호출 수를 세고 실패를 주입한다(기본 = 실제 import).
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { PRIMARY_COLOR_ERROR } from "../domain/boardInput";
import { PRIMARY_COLOR_CHECK_FAILED } from "../features/compare/boardMessages";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, LOW_CONTRAST_PRIMARY, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const loads = vi.hoisted(() => ({ repo: vi.fn(), field: vi.fn() }));
vi.mock("../data/writeBodyLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/writeBodyLoader")>();
  loads.repo.mockImplementation(actual.loadBoardInput);
  return { ...actual, loadBoardInput: loads.repo };
});
vi.mock("../features/compare/boardInputLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/compare/boardInputLoader")>();
  loads.field.mockImplementation(actual.loadBoardInput);
  return { loadBoardInput: loads.field };
});

const THREE = ["ref-a", "ref-b", "ref-c"];
const chunkError = () => new Error("Failed to fetch dynamically imported module");
const references = () => createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures);
const primaryField = () => screen.findByRole("textbox", { name: "대표색" });
const unpressedPick = () => screen.getAllByRole("button", { name: /의 요소 선택$/ }).find((b) => b.getAttribute("aria-pressed") === "false")!;

function studio() {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  return { board, profiles };
}

beforeEach(() => {
  loads.repo.mockClear();
  loads.field.mockClear();
});
afterEach(() => vi.restoreAllMocks());

describe("BUNDLE-HEADROOM 번들 분류 근거 — 진입 직후 boardInput 요청 0", () => {
  it("/compare: 진입(보드·엔진·입력 틀까지)에 요청 0 → 선택 클릭 뒤 저장소 로더, 대표색 포커스 뒤 화면 로더", async () => {
    const { board } = studio();
    renderApp("/compare", references(), board);
    const field = await primaryField();
    expect(loads.repo).not.toHaveBeenCalled();
    expect(loads.field).not.toHaveBeenCalled();

    await userEvent.click(unpressedPick());
    await waitFor(() => expect(screen.getByText("저장됨")).toBeInTheDocument());
    expect(loads.repo).toHaveBeenCalledTimes(1);
    expect(loads.field).not.toHaveBeenCalled();

    await userEvent.click(field);
    expect(loads.field).toHaveBeenCalledTimes(1);
    await userEvent.type(field, "abc");
    await userEvent.tab();
    await waitFor(() => expect(field).toHaveAccessibleDescription(PRIMARY_COLOR_ERROR));
    expect(field).toHaveAttribute("aria-invalid", "true");
  });

  it("/profile: 진입(조회·범위 조회)에 요청 0", async () => {
    const { board, profiles } = studio();
    await board.confirmProfile(1, 0);
    renderApp("/profile/profile-1", references(), board, profiles);
    await screen.findByRole("radiogroup", { name: "밀도" });
    expect(loads.repo).not.toHaveBeenCalled();
    expect(loads.field).not.toHaveBeenCalled();
  });
});

describe("BUNDLE-HEADROOM 검증 청크 로드 실패 — 저장 0·다시 시도", () => {
  it("선택 저장: 로드 실패 → '저장하지 못했습니다' + 다시 시도, 보드 변화 0 → 다시 시도하면 저장됨", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { board } = studio();
    renderApp("/compare", references(), board);
    await primaryField();
    loads.repo.mockRejectedValueOnce(chunkError());
    await userEvent.click(unpressedPick());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("저장하지 못했습니다");
    expect((await board.getBoard()).board).toMatchObject({ picks: { hero: "ref-a" }, revision: 1 });
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(screen.getByText("저장됨")).toBeInTheDocument());
    expect((await board.getBoard()).board.revision).toBe(2);
    expect(loads.repo).toHaveBeenCalledTimes(2);
  });

  it("대표색: 로드 실패 → 필드 오류(확인 실패 문구)·저장 0 → 다시 포커스를 옮기면 검사해 저장", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { board } = studio();
    renderApp("/compare", references(), board);
    const field = await primaryField();
    loads.field.mockRejectedValueOnce(chunkError()).mockRejectedValueOnce(chunkError());
    await userEvent.type(field, LOW_CONTRAST_PRIMARY.toLowerCase());
    await userEvent.tab();
    await waitFor(() => expect(field).toHaveAccessibleDescription(PRIMARY_COLOR_CHECK_FAILED));
    expect(loads.repo).not.toHaveBeenCalled();
    expect((await board.getBoard()).board.custom).toEqual({});

    await userEvent.click(field);
    await userEvent.tab();
    await waitFor(() => expect(screen.getByText("저장됨")).toBeInTheDocument());
    expect(field).toHaveAttribute("aria-invalid", "false");
    expect((await board.getBoard()).board.custom).toEqual({ primaryColor: LOW_CONTRAST_PRIMARY });
  });
});
