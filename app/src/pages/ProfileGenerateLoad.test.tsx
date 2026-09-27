/**
 * PROFILE-HEADROOM — 3안 잡 조립·실패 주입·재시도 판정은 계산 본문(memoryGenerate, "3안 만들기"·"다시 시도" 조작 뒤 청크)에 둔다.
 * 저장소(memoryGenerationRepository, memoryStudio = /profile 진입 직후 청크)에는 조회·폴링·선택과 요청 멱등 판정만 남긴다.
 * 옮긴 경로의 로딩·실패 상태(SPEC P-S17·S20): 본문을 받는 동안 버튼 aria-busy("만드는 중…")·카드 없음, 받기 실패면 role=alert 문구 · 잡 0,
 * 다시 누르면 다시 받는다. 동작 테스트는 옮기기 전에도 통과하는 특성 테스트다(로더 호출 지점은 그대로).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository, type MemoryGenerationOptions } from "../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { POLL_MS } from "../features/profile/useGeneration";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const loads = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("../data/writeBodyLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/writeBodyLoader")>();
  loads.generate.mockImplementation(actual.loadGenerate);
  return { ...actual, loadGenerate: loads.generate };
});

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

async function open(options: Omit<MemoryGenerationOptions, "store"> = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  const gen = createMemoryGenerationRepository({ ...options, store });
  await board.confirmProfile(1, 0);
  renderApp("/profile/profile-1", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, createMemoryProfileRepository({ store }), gen);
  await screen.findByRole("heading", { level: 1, name: "디자인 프로필" });
  return { store, region: await screen.findByRole("region", { name: "생성된 3안" }) };
}

/** 다음 한 번의 본문 받기를 붙잡는다 — release로 진짜 모듈을 넘기거나 fail로 거부한다 */
function holdNextLoad() {
  const actual = loads.generate.getMockImplementation()!;
  let settle!: { release: () => void; fail: () => void };
  loads.generate.mockImplementationOnce(
    () =>
      new Promise((resolve, reject) => {
        settle = { release: () => resolve(actual()), fail: () => reject(new Error("Failed to fetch dynamically imported module")) };
      }),
  );
  return () => settle;
}

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const tick = () => act(() => vi.advanceTimersByTimeAsync(POLL_MS));

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => {
  vi.useRealTimers();
  loads.generate.mockClear();
});

describe("번들 분류 근거 — 잡 조립·실패 주입·재시도 판정은 조작 뒤 청크(memoryGenerate)", () => {
  it("저장소는 실패 문구·재시도 판정·계산 호출을 싣지 않는다", () => {
    const repository = source("../data/memoryGenerationRepository.ts");
    expect(repository).not.toMatch(/FAILURE_TEXT|RETRYABLE|composeFor\(/);
    expect(repository).not.toContain("제한 시간 안에 만들지 못했습니다");
    expect(repository).not.toContain("다시 시도할 수 있는 안이 없습니다");
  });

  it("memoryGenerate가 새 잡·재시도 잡을 만든다(newJob·retryJob)", () => {
    const body = source("../data/memoryGenerate.ts");
    expect(body).toMatch(/export function newJob\(/);
    expect(body).toMatch(/export function retryJob\(/);
  });
});

describe("3안 만들기 — 본문 받기 로딩·실패 (P-S17 · S20)", () => {
  it("받는 동안 버튼 aria-busy '만드는 중…' · 카드 없음 · 잡 0 → 받은 뒤 3안 + 비교 표", async () => {
    const { store, region } = await open();
    const settle = holdNextLoad();
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    const busy = within(region).getByRole("button", { name: "만드는 중…" });
    expect(busy).toHaveAttribute("aria-busy", "true");
    expect(within(region).queryByRole("heading", { level: 3 })).not.toBeInTheDocument();
    expect(store.jobCount()).toBe(0);
    await act(async () => settle().release());
    await waitFor(() => expect(store.jobCount()).toBe(1));
    for (let i = 0; i < 3; i += 1) await tick();
    expect(await within(region).findByRole("table", { name: "3안 비교" })).toBeInTheDocument();
  });

  it("받기 실패: role=alert '3안 만들기를 요청하지 못했습니다' · 잡 0 → 다시 누르면 다시 받아 3안", async () => {
    const { store, region } = await open();
    const settle = holdNextLoad();
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    await act(async () => settle().fail());
    expect(await within(region).findByRole("alert")).toHaveTextContent("3안 만들기를 요청하지 못했습니다 · 다시 시도하세요");
    expect(store.jobCount()).toBe(0);
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    await waitFor(() => expect(store.jobCount()).toBe(1));
    for (let i = 0; i < 3; i += 1) await tick();
    expect(await within(region).findByRole("table", { name: "3안 비교" })).toBeInTheDocument();
    expect(loads.generate).toHaveBeenCalledTimes(2);
  });
});

describe("C안 다시 시도 — 본문 받기 로딩·실패 (P-S20)", () => {
  it("받는 동안 aria-busy → 받기 실패면 '다시 시도를 요청하지 못했습니다' · C 실패 그대로 → 다시 받으면 C만 다시 → 3안", async () => {
    const { store, region } = await open({ outcome: ({ id, attempt }) => (id === "C" && attempt === 1 ? "JOB_TIMEOUT" : undefined) });
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    await waitFor(() => expect(store.jobCount()).toBe(1));
    for (let i = 0; i < 3; i += 1) await tick();
    const retry = await within(region).findByRole("button", { name: "C안 다시 시도" });
    const settle = holdNextLoad();
    await u.click(retry);
    expect(within(region).getByRole("button", { name: "C안 다시 시도" })).toHaveAttribute("aria-busy", "true");
    await act(async () => settle().fail());
    await within(region).findByText("다시 시도를 요청하지 못했습니다 · 다시 시도하세요");
    expect(store.job("job-1")?.attempts.C).toBe(1);
    expect(store.job("job-1")?.job.candidates[2]).toMatchObject({ status: "failed", errorCode: "JOB_TIMEOUT" });
    await u.click(within(region).getByRole("button", { name: "C안 다시 시도" }));
    await waitFor(() => expect(store.job("job-1")?.attempts.C).toBe(2));
    await tick();
    expect(await within(region).findByRole("heading", { level: 3, name: "C안" })).toBeInTheDocument();
    await waitFor(() => expect(within(region).getAllByRole("button", { name: /^[ABC]안 선택$/ })).toHaveLength(3));
  });
});
