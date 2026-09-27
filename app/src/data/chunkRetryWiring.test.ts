/**
 * F1 배선 — 조작 뒤 로더 전부가 retryableImport로 싸여 있다: 보드 확정 본문 · 프로필 쓰기 본문 · 보드 입력 검증(저장소·대표색 둘) ·
 * P-S25 패널 · 재확정 이어받기 규칙 · 3안 계산 본문(2a-04c memoryGenerate). 자동 로더(boardEngine·profileEngine·memoryStudio·픽스처)는 싸지 않는다 — 실패하면 경계로 간다(범위 밖).
 */
import { describe, expect, it, vi } from "vitest";

const wrapped = vi.hoisted(() => [] as Array<() => Promise<Record<string, unknown>>>);
vi.mock("./chunkRetry", () => ({
  retryableImport: (load: () => Promise<Record<string, unknown>>) => {
    wrapped.push(load);
    return load;
  },
}));

describe("조작 뒤 로더 배선", () => {
  it("싼 로더 7개가 각각 받는 모듈 = 확정 본문·쓰기 본문·boardInput×2·P-S25 패널·이어받기 규칙·3안 계산 본문", async () => {
    await import("./writeBodyLoader");
    await import("../features/compare/boardInputLoader");
    await import("../features/compare/carryOverLoader");
    await import("./memoryBoardConfirm");
    const modules = await Promise.all(wrapped.map((load) => load()));
    const marker = (m: Record<string, unknown>) =>
      ["createBoardConfirmer", "revertIn", "parseBoardInput", "CarryOverNotice", "carryOverAdjustments", "composeFor"].find((name) => name in m);
    expect(modules.map(marker).sort()).toEqual(["CarryOverNotice", "carryOverAdjustments", "composeFor", "createBoardConfirmer", "parseBoardInput", "parseBoardInput", "revertIn"]);
  });
});
