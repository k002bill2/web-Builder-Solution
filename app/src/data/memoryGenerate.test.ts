/**
 * 2a-04c 계산 본문 결과 모양 검증 — 생성기가 A·B·C 3개를 순서대로 주지 않으면 SCHEMA_INVALID로 거부하고 잡을 만들지 않는다
 * (조회마다 한 안씩 공개하는 잡이 "만드는 중"에 고착되지 않게 — UI 수용 검토 Major 1).
 */
import { describe, expect, it, vi } from "vitest";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { createMemoryCompareBoardRepository } from "./memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "./memoryGenerationRepository";
import { createStudioStore } from "./studioStore";

const broken = vi.hoisted(() => ({ on: false }));
vi.mock("../domain/composeCandidates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../domain/composeCandidates")>();
  return { ...actual, composeCandidates: (input: Parameters<typeof actual.composeCandidates>[0]) => (broken.on ? actual.composeCandidates(input).slice(0, 1) : actual.composeCandidates(input)) };
});

describe("memoryGenerate 결과 모양 검증", () => {
  it("결과가 A 하나뿐이면 요청 거부(SCHEMA_INVALID) · 잡 0 → 정상 생성기면 같은 요청 성공", async () => {
    const store = createStudioStore();
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
    await board.confirmProfile(1, 0);
    const gen = createMemoryGenerationRepository({ store });
    broken.on = true;
    await expect(gen.requestGeneration("profile-1", 1)).rejects.toMatchObject({ code: "SCHEMA_INVALID" });
    expect(await gen.findJob("profile-1", 1)).toBeUndefined();
    broken.on = false;
    expect((await gen.requestGeneration("profile-1", 1)).candidates).toHaveLength(3);
  });
});
