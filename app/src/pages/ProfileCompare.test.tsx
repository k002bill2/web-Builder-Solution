/**
 * M2B-5 3안 실렌더 비교 (SPEC-COMPARE3 1.1 · 3.1 · CMP-AC-U1·U2) — "3안 실제 화면으로 비교" 버튼의 보이는 조건 ·
 * 비교 청크는 누른 뒤에만 받는다(로더 이음새 spy — "번들 분류 근거") · 받는 동안 aria-busy · 청크 실패 → role=alert + 다시 시도 → 새 요청 · 저장소 쓰기 0.
 */
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository, type MemoryGenerationOptions } from "../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryProjectRepository } from "../data/memoryProjectRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { POLL_MS } from "../features/profile/useGeneration";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

type Compare = typeof import("../features/profile/CompareDialog");
const compare = vi.hoisted(() => ({ load: vi.fn(), actual: undefined as undefined | (() => Promise<Compare>) }));
vi.mock("../features/profile/compareLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/profile/compareLoader")>();
  compare.actual = actual.loadCompare;
  compare.load.mockImplementation(actual.loadCompare);
  return { loadCompare: compare.load };
});

async function open(options: Omit<MemoryGenerationOptions, "store"> = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  const gen = createMemoryGenerationRepository({ ...options, store });
  await board.confirmProfile(1, 0);
  const projectRepository = createMemoryProjectRepository({ store });
  renderApp("/profile/profile-1", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, profiles, gen, () =>
    Promise.resolve(projectRepository),
  );
  const region = await screen.findByRole("region", { name: "생성된 3안" });
  return { region, projectRepository };
}

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const tick = () => act(() => vi.advanceTimersByTimeAsync(POLL_MS));
const COMPARE = "3안 실제 화면으로 비교";

async function generate(u: ReturnType<typeof user>, region: HTMLElement) {
  await u.click(await within(region).findByRole("button", { name: /^3안 만들기 \(v\d+\)$/ }));
  for (let i = 0; i < 3; i += 1) await tick();
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  compare.load.mockReset();
  compare.load.mockImplementation(compare.actual!);
});

describe("비교 버튼 보이는 조건 (CMP-AC-U1)", () => {
  it("잡 없음·만드는 중 = DOM에 없음 → 종료 + 성공 안 있음 + 결과 청크 = 카드 목록 아래 · 편집 시작 위", async () => {
    const { region } = await open();
    await within(region).findByRole("button", { name: /^3안 만들기 \(v\d+\)$/ });
    expect(within(region).queryByRole("button", { name: COMPARE })).not.toBeInTheDocument();
    const u = user();
    await u.click(within(region).getByRole("button", { name: /^3안 만들기 \(v\d+\)$/ }));
    await within(region).findByRole("button", { name: "만드는 중…" });
    expect(within(region).queryByRole("button", { name: COMPARE })).not.toBeInTheDocument();
    for (let i = 0; i < 3; i += 1) await tick();
    const button = await within(region).findByRole("button", { name: COMPARE });
    const list = within(region).getByRole("list", { name: "3안" });
    const edit = within(region).getByRole("button", { name: "편집 시작" });
    expect(list.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(button.compareDocumentPosition(edit) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("전부 실패한 잡 = 버튼 없음", async () => {
    const { region } = await open({ outcome: ({ attempt }) => (attempt === 1 ? "INFRA" : undefined) });
    await generate(user(), region);
    expect(await within(region).findByText("3안을 만들지 못했습니다")).toBeInTheDocument();
    expect(within(region).queryByRole("button", { name: COMPARE })).not.toBeInTheDocument();
  });
});

describe("비교 청크는 누른 뒤에만 (CMP-AC-U2 · 번들 분류 근거)", () => {
  it("3안이 있어도 누르기 전 요청 0 → 누르면 받는 동안 aria-busy '불러오는 중…' → 받은 뒤 원래 이름 · 저장소 startDoc 0", async () => {
    const { region, projectRepository } = await open();
    const startDoc = vi.spyOn(projectRepository, "startDoc");
    const u = user();
    await generate(u, region);
    await within(region).findByRole("button", { name: COMPARE });
    expect(compare.load).not.toHaveBeenCalled();
    let resolve!: (m: Compare) => void;
    compare.load.mockImplementation(() => new Promise<Compare>((r) => (resolve = r)));
    await u.click(within(region).getByRole("button", { name: COMPARE }));
    expect(compare.load).toHaveBeenCalledTimes(1);
    const busy = within(region).getByRole("button", { name: "불러오는 중…" });
    expect(busy).toHaveAttribute("aria-busy", "true");
    await act(async () => resolve(await compare.actual!()));
    expect(within(region).queryByRole("button", { name: "불러오는 중…" })).not.toBeInTheDocument();
    expect(within(region).queryByRole("alert")).not.toBeInTheDocument();
    expect(startDoc).not.toHaveBeenCalled();
  });

  it("청크 실패 → 버튼 아래 role=alert '실제 화면 비교를 불러오지 못했습니다' + 다시 시도 → 새 요청", async () => {
    const { region } = await open();
    const u = user();
    await generate(u, region);
    compare.load.mockImplementation(() => Promise.reject(new Error("Failed to fetch dynamically imported module")));
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await u.click(await within(region).findByRole("button", { name: COMPARE }));
    const alert = await within(region).findByRole("alert");
    expect(alert).toHaveTextContent("실제 화면 비교를 불러오지 못했습니다");
    expect(within(region).getByRole("button", { name: COMPARE }).compareDocumentPosition(alert) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    compare.load.mockImplementation(compare.actual!);
    await u.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(compare.load).toHaveBeenCalledTimes(2);
    await act(async () => {});
    expect(within(region).queryByRole("alert")).not.toBeInTheDocument();
    spy.mockRestore();
  });
});
