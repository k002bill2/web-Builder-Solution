/**
 * DS-2A-04 2a-04a1 — 보드 화면의 버전 계보·STALE_PROFILE·확정 트랜잭션 (P-AC-11·40·42).
 * 보드·프로필 메모리 저장소가 store 하나를 쓰고, "다른 탭"의 쓰기는 프로필 저장소 revertTo를 직접 부른다.
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository, type BoardCall } from "../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const THREE = ["ref-a", "ref-b", "ref-c"];
const pick = (row: string, column: string) => screen.getByRole("button", { name: `${row}: ${column}의 요소 선택` });
const confirmButton = () => screen.getByRole("button", { name: /확정 \(v\d\)$/ });

async function openStudio(inject: { delay?: (call: BoardCall) => Promise<void> | undefined; fail?: (call: BoardCall) => Error | undefined } = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, { hero: "ref-a" }), store, ...inject });
  const profiles = createMemoryProfileRepository({ store });
  const view = renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board);
  await screen.findByRole("heading", { level: 1, name: "비교 보드" });
  const versionsOf = async () => (await profiles.getProfile("profile-1"))?.versions.map((v) => v.version) ?? [];
  return { ...view, board, profiles, versionsOf };
}

/** v1 확정 → 프로필 쪽 되돌리기로 v2 → 보드로 돌아와 Hero를 B로 바꾼다 */
async function boardSeesV2(studio: Awaited<ReturnType<typeof openStudio>>) {
  await userEvent.click(confirmButton());
  await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"));
  await studio.profiles.revertTo("profile-1", 1, 1);
  await act(() => studio.router.navigate("/compare"));
  expect(await screen.findByText("v1 확정됨")).toBeInTheDocument();
  expect(confirmButton()).toHaveAccessibleName("새 버전으로 확정 (v3)");
  await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
  await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v3)" })).not.toHaveAttribute("aria-disabled"));
}

afterEach(() => vi.restoreAllMocks());

describe("P-AC-11 버전 계보 — 보드 라벨 = 계열 최신 + 1", () => {
  it("프로필 쪽에서 v2를 만든 뒤 보드에서 선택을 바꾸면 '새 버전으로 확정 (v3)', 확정 결과도 v3", async () => {
    const studio = await openStudio();
    await boardSeesV2(studio);
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"));
    const series = await studio.profiles.getProfile("profile-1");
    expect(series?.versions.map((v) => [v.version, v.origin])).toEqual([[1, "board"], [2, "revert"], [3, "board-reconfirm"]]);
  });
});

describe("P-AC-40 보드 확정 경쟁 — STALE_PROFILE (P-S12)", () => {
  it("보드가 (v3)을 보인 뒤 다른 탭이 v3을 만들면 확정 0건 + '(v4)' + 안내, 선택 유지·이동 없음 → 다시 확정하면 v4", async () => {
    const studio = await openStudio();
    await boardSeesV2(studio);
    await studio.profiles.revertTo("profile-1", 1, 2);
    await userEvent.click(confirmButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("다른 곳에서 v3이 만들어졌습니다. 선택은 그대로입니다 — 확인 후 다시 확정하세요");
    expect(await studio.versionsOf()).toEqual([1, 2, 3]);
    expect(studio.router.state.location.pathname).toBe("/compare");
    expect(pick("Hero 구성", "B 프리미엄 헤어살롱")).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v4)" })).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"));
    expect(await studio.versionsOf()).toEqual([1, 2, 3, 4]);
  });
});

describe("P-AC-42 보드 확정 원자성·멱등 (6.3 r3)", () => {
  it("① commit 단계 실패 → 오류 알림, 계열·보드 확정 변화 0, 선택 유지 → 주입을 끄고 다시 확정하면 v1(id 건너뜀 0)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let failing = true;
    const studio = await openStudio({ fail: (call) => (failing && call.phase === "commit" ? new Error("커밋 실패") : undefined) });
    await userEvent.click(confirmButton());
    expect(await screen.findByRole("alert")).toHaveTextContent("확정하지 못했습니다");
    expect(await studio.profiles.listProfiles()).toEqual([]);
    const { board } = await studio.board.getBoard();
    expect(board.confirmed).toBeUndefined();
    expect(board.revision).toBe(1);
    expect(pick("Hero 구성", "A 모던 카페 브랜드")).toHaveAttribute("aria-pressed", "true");
    failing = false;
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"));
    expect(await studio.versionsOf()).toEqual([1]);
  });

  it("② 커밋 뒤 응답 실패 → 오류 알림이지만 v1은 커밋됨 → 같은 화면에서 다시 확정하면 STALE 없이 같은 결과, 새 버전 0", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const studio = await openStudio({
      delay: (call) => (call.method === "confirmProfile" && call.phase === "response" && call.seq === 1 ? Promise.reject(new Error("응답 끊김")) : undefined),
    });
    await userEvent.click(confirmButton());
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("확정하지 못했습니다");
    expect(await studio.versionsOf()).toEqual([1]);
    await userEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"));
    expect(await studio.versionsOf()).toEqual([1]);
  });
});
