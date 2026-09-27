/**
 * COMPARE-HEADROOM-C8 — 엔진(초안 패널·요약 바 포함)이 오기 전에는 로딩 표시만, 온 뒤에 보드·패널 + h1 포커스(A-7).
 * 엔진 import를 수동 Promise로 붙잡아 로딩 구간을 결정적으로 만든다.
 */
import { screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { deferred } from "../test/deferred";
import { renderApp } from "../test/renderApp";

const gate = vi.hoisted(() => {
  let release!: () => void;
  const ready = new Promise<void>((resolve) => (release = resolve));
  return { ready, release: () => release() };
});
vi.mock("../features/compare/boardEngine", async (importOriginal) => {
  await gate.ready;
  return importOriginal();
});

describe("로딩 구간 (C8)", () => {
  it("엔진이 오기 전: 로딩 표시만(표·초안 패널 없음) → 온 뒤: 표·초안 패널, h1 포커스", async () => {
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"]) });
    renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board);
    expect(await screen.findByText("비교 보드를 불러오는 중…")).toBeInTheDocument();
    // 보드 조회가 끝날 시간을 준다 — 엔진만 붙잡혀 있어도 화면은 로딩이어야 한다
    const tick = deferred();
    setTimeout(tick.resolve, 50);
    await tick.promise;
    expect(screen.getByText("비교 보드를 불러오는 중…")).toBeInTheDocument();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("heading", { name: "프로필 초안" })).toBeNull();

    gate.release();
    expect(await screen.findByRole("heading", { name: "프로필 초안" })).toBeInTheDocument();
    expect(screen.getByRole("table")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "비교 보드" })).toHaveFocus());
  });
});
