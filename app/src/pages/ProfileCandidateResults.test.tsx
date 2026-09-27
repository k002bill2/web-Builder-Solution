/**
 * PROFILE-HEADROOM-2 — 3안 카드·표 지연 청크(CandidateResults). "3안 만들기" 클릭에 미리 받기 · 청크 도착 전 로딩 표현 ·
 * 도착 뒤 카드 3 + 비교 표 · 청크 실패 → role=alert + 다시 시도 → 카드 3. 조회 간격(1초)은 가짜 타이머로 진행한다.
 */
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryProjectRepository } from "../data/memoryProjectRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { POLL_MS } from "../features/profile/useGeneration";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

type Results = typeof import("../features/profile/CandidateResults");
const results = vi.hoisted(() => ({ load: vi.fn(), actual: undefined as undefined | (() => Promise<Results>) }));
vi.mock("../features/profile/candidateResultsLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/profile/candidateResultsLoader")>();
  results.actual = actual.loadCandidateResults;
  results.load.mockImplementation(actual.loadCandidateResults);
  return { loadCandidateResults: results.load };
});

async function open() {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  const gen = createMemoryGenerationRepository({ store });
  await board.confirmProfile(1, 0);
  const projectRepository = createMemoryProjectRepository({ store });
  renderApp("/profile/profile-1", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, profiles, gen, () =>
    Promise.resolve(projectRepository),
  );
  return screen.findByRole("region", { name: "생성된 3안" });
}

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const tick = () => act(() => vi.advanceTimersByTimeAsync(POLL_MS));
const selectButtons = (region: HTMLElement) => within(region).queryAllByRole("button", { name: /^[ABC]안 선택$/ });

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  results.load.mockReset();
  results.load.mockImplementation(results.actual!);
});

describe("3안 결과 지연 청크 (PROFILE-HEADROOM-2)", () => {
  it("진입만으로는 받지 않음 · '3안 만들기' 클릭에 미리 받기 · 청크 도착 전 로딩 표현(카드 목록 없음) → 도착 뒤 카드 3 + 비교 표", async () => {
    const region = await open();
    await within(region).findByRole("button", { name: /^3안 만들기 \(v\d+\)$/ });
    expect(results.load).not.toHaveBeenCalled();
    let resolve!: (m: Results) => void;
    const pending = new Promise<Results>((r) => (resolve = r));
    results.load.mockImplementation(() => pending);
    const u = user();
    await u.click(within(region).getByRole("button", { name: /^3안 만들기 \(v\d+\)$/ }));
    expect(results.load).toHaveBeenCalled();
    for (let i = 0; i < 3; i += 1) await tick();
    expect(await within(region).findByRole("status")).toHaveTextContent("3안을 불러오는 중…");
    expect(within(region).queryByRole("list", { name: "3안" })).not.toBeInTheDocument();
    expect(within(region).queryByRole("table", { name: "3안 비교" })).not.toBeInTheDocument();
    await act(async () => resolve(await results.actual!()));
    expect(await within(region).findByRole("list", { name: "3안" })).toBeInTheDocument();
    for (let i = 0; i < 3; i += 1) await tick();
    expect(await within(region).findByRole("table", { name: "3안 비교" })).toBeInTheDocument();
    expect(selectButtons(region)).toHaveLength(3);
    expect(within(region).queryByText("3안을 불러오는 중…")).not.toBeInTheDocument();
  });

  it("청크 실패 → role=alert '3안 결과를 불러오지 못했습니다' + 다시 시도 → 다시 받아 카드 3 + 비교 표", async () => {
    const region = await open();
    results.load.mockImplementation(() => Promise.reject(new Error("Failed to fetch dynamically imported module")));
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const u = user();
    await u.click(await within(region).findByRole("button", { name: /^3안 만들기 \(v\d+\)$/ }));
    for (let i = 0; i < 3; i += 1) await tick();
    const alert = await within(region).findByRole("alert");
    expect(alert).toHaveTextContent("3안 결과를 불러오지 못했습니다");
    expect(selectButtons(region)).toHaveLength(0);
    results.load.mockImplementation(results.actual!);
    const calls = results.load.mock.calls.length;
    await u.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(results.load.mock.calls.length).toBeGreaterThan(calls);
    expect(await within(region).findByRole("list", { name: "3안" })).toBeInTheDocument();
    for (let i = 0; i < 3; i += 1) await tick();
    expect(await within(region).findByRole("table", { name: "3안 비교" })).toBeInTheDocument();
    expect(selectButtons(region)).toHaveLength(3);
    expect(within(region).queryByText("3안 결과를 불러오지 못했습니다")).not.toBeInTheDocument();
    spy.mockRestore();
  });
});
