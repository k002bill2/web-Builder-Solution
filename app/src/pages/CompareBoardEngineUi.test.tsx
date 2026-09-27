/**
 * COMPARE-HEADROOM-C8 — 초안 패널·요약 바는 보드 준비(엔진 로드) 뒤에만 그려지므로 엔진 청크에서 받는다(BUNDLE-01 C8).
 * 페이지는 두 컴포넌트를 값으로 정적 import하지 않는다(타입은 허용) → 첫 화면 정적 JS에서 빠진다.
 * 엔진 로드가 실패하면 패널 없이 기존 오류 화면(S-02)이다 — 이 파일은 엔진 import를 항상 실패시킨다.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

vi.mock("../features/compare/boardEngine", () => {
  throw new Error("Failed to fetch dynamically imported module");
});

const source = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");
const valueImportOf = (code: string, module: string) => new RegExp(`^import\\s+(?!type\\b)[^;]*from\\s+"[^"]*/${module}";`, "m").test(code);

describe("C8 번들 분류 근거 — 초안 패널·요약 바는 엔진 청크", () => {
  it("CompareBoardPage는 DraftPanel·DraftSummaryBar를 값으로 정적 import하지 않는다", () => {
    const page = source("./CompareBoardPage.tsx");
    expect(valueImportOf(page, "DraftPanel")).toBe(false);
    expect(valueImportOf(page, "DraftSummaryBar")).toBe(false);
  });

  it("boardEngine이 DraftPanel·DraftSummaryBar를 싣는다", () => {
    const engine = source("../features/compare/boardEngine.ts");
    expect(valueImportOf(engine, "DraftPanel")).toBe(true);
    expect(valueImportOf(engine, "DraftSummaryBar")).toBe(true);
  });
});

describe("엔진 로드 실패 (S-02)", () => {
  it("오류 alert, 초안 패널·요약 바는 그리지 않는다", async () => {
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"]) });
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board);
    expect(await screen.findByRole("alert")).toHaveTextContent("비교 보드를 불러오지 못했습니다");
    expect(screen.queryByRole("list", { name: "초안 항목" })).toBeNull();
    expect(screen.queryByRole("region", { name: "초안 요약" })).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
