import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

describe("비교 보드 v2 — 두지 않는 것 (V2-AC-33 · C-08·C-09)", () => {
  it("모드 토글('템플릿 / 스타일 조합')·조직 공유가 없고 비교 항목은 12행", async () => {
    renderApp(
      "/compare",
      createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures),
      createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"]) }),
    );
    await screen.findByRole("heading", { level: 1, name: "비교 보드" });
    expect(screen.queryAllByRole("radiogroup")).toHaveLength(0);
    expect(screen.queryAllByRole("tablist")).toHaveLength(0);
    expect(screen.queryByText(/템플릿|스타일 조합/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /조직 공유/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole("rowheader")).toHaveLength(12);
  });
});
