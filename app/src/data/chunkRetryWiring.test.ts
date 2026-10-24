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

  it("P2-2 생성기 슬롯 로더(exportFlow)도 retryableImport로 싼다 — 받는 모듈 = 정적 HTML 생성기 청크 · React zip 생성기 청크(M4-b RZQ-02 A, 별도 슬롯) · 샘플 묶음 PNG 캡처 청크", async () => {
    const before = wrapped.length;
    await import("../features/studio/exportFlow");
    const added = wrapped.slice(before);
    expect(added).toHaveLength(3);
    // 3번째(PNG 캡처 청크)는 받지 않는다 — 받으면 그 청크가 끌어오는 로더 모듈이 캐시돼 아래 QA D1 계수가 어긋난다. 배선 = 샘플 묶음 테스트가 잰다
    const loaded = await Promise.all(added.slice(0, 2).map((load) => load()));
    expect(loaded.map((m) => ["createStaticHtmlGenerator", "createReactZipGenerator"].filter((name) => name in m))).toEqual([["createStaticHtmlGenerator"], ["createReactZipGenerator"]]);
  });

  it("영속 싱크 청크(localSync)도 retryableImport로 싼다 — Codex r2 P2(실패 뒤 재시도 = 새 URL)", async () => {
    await import("./memoryDocBook");
    const modules = await Promise.all(wrapped.map((load) => load()));
    expect(modules.filter((m) => "openLocalSync" in m && !("createDocBook" in m))).toHaveLength(1);
  });

  it("QA D1: 추천 적용 청크 2개(RecoApply·recoApplyFlow)도 각각 retryableImport로 싼다 — 실패 뒤 다시 시도 = 실패한 청크만 새 URL", async () => {
    const before = wrapped.length;
    await import("../components/reco/recoApplyLoader");
    const added = wrapped.slice(before);
    expect(added).toHaveLength(2);
    const [dialog, flow] = await Promise.all(added.map((load) => load()));
    expect(dialog!.default).toBe((await import("../components/reco/RecoApply")).default);
    expect("runApply" in flow! && !("default" in flow!)).toBe(true);
  });

  it("QA D1: 추천 화면 청크(RecoView)도 retryableImport로 싼다 — 실패 뒤 '다시 시도' = 새 URL", async () => {
    const before = wrapped.length;
    await import("../components/reco/recoLoader");
    const added = wrapped.slice(before);
    expect(added).toHaveLength(1);
    expect((await added[0]!()).default).toBe((await import("../components/reco/RecoView")).default);
  });
});
