import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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

describe("비교 보드 v2 — <768 아코디언 고른 셀 (V2-AC-34)", () => {
  const original = window.matchMedia;
  afterEach(() => {
    window.matchMedia = original;
  });

  it("고른 셀(li) 전체가 primary-container 면이고 안 고른 셀은 아니다", async () => {
    // jsdom에는 matchMedia가 없다 — 390px(모든 min-width 쿼리 불일치)로 흉내
    window.matchMedia = ((query: string) => ({ matches: false, media: query, addEventListener: () => {}, removeEventListener: () => {} }) as unknown as MediaQueryList) as typeof window.matchMedia;
    renderApp(
      "/compare",
      createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures),
      createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-b" }) }),
    );
    const region = await screen.findByRole("region", { name: /^Hero 구성/ });
    const cellOf = (column: string) => within(region).getByRole("button", { name: `Hero 구성: ${column}의 요소 선택` }).closest("li");
    expect(cellOf("B 프리미엄 헤어살롱")).toHaveClass("bg-primary-container");
    expect(cellOf("A 모던 카페 브랜드")).not.toHaveClass("bg-primary-container");
  });
});
