/**
 * DS-2A-04 10.0.2 Q7 — <1280 하단 요약 바에 조정 개수 "조정 N개" (P-S25 캡션과 같은 carryOverCount, 확정 프로필 + 조정 ≥ 1일 때만).
 * 판정·목록은 넣지 않는다(펼침 로드는 초안 패널의 P-S25 그대로).
 */
import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryStudio } from "../data/memoryStudio";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import type { ProfileAdjustments } from "../domain/profile";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const original = window.matchMedia;

/** Tailwind 기준 폭(md 48rem · xl 80rem)으로 matchMedia를 흉내 낸다 (CompareBoardResponsive와 같은 방식) */
function setViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*([\d.]+)rem/.exec(query)?.[1] ?? 0) * 16;
    return { matches: width >= min, media: query, onchange: null, addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false } as MediaQueryList;
  }) as typeof window.matchMedia;
}

async function openBoard(width: number, adjustments?: ProfileAdjustments) {
  setViewport(width);
  const studio = createMemoryStudio({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }) });
  await studio.board.confirmProfile(1, 0);
  if (adjustments) await studio.profiles.saveAdjustments("profile-1", 1, adjustments);
  renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), studio.board, studio.profiles);
  await screen.findByRole("heading", { level: 1, name: "비교 보드" });
}

afterEach(() => {
  window.matchMedia = original;
});

describe("Q7 보드 요약 바 조정 개수", () => {
  it.each([1024, 390])("%ipx: 확정 프로필에 조정 2개 → 요약 바 '조정 2개'", async (width) => {
    await openBoard(width, { density: "compact", motion: "L0" });
    const bar = await screen.findByRole("region", { name: "초안 요약" });
    expect(await within(bar).findByText(/ · 조정 2개$/)).toBeInTheDocument();
  });

  it("조정 0개면 요약 바에 조정 글자 없음", async () => {
    await openBoard(1024);
    const bar = await screen.findByRole("region", { name: "초안 요약" });
    expect(within(bar).getByText(/^초안 \d+\/\d+/)).not.toHaveTextContent("조정");
  });
});
