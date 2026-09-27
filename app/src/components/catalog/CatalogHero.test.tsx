import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Button } from "../ds/Button";
import { CatalogHero } from "./CatalogHero";

describe("CatalogHero", () => {
  it("추천 받기는 outline md — 검색창과 같은 밀도 (VISUAL-V2-APPLY 4, REPORT 1.2)", () => {
    // DS 레인이 size별 높이를 바꿔도 깨지지 않도록 같은 props의 md·lg 기준 버튼과 클래스를 비교한다
    render(
      <>
        <CatalogHero title="전체" onRecommend={vi.fn()} />
        <Button variant="outline" size="md" leadingIcon="sparkle">
          기준 md
        </Button>
        <Button variant="outline" size="lg" leadingIcon="sparkle">
          기준 lg
        </Button>
      </>,
    );
    const recommend = screen.getByRole("button", { name: "추천 받기" });
    const md = screen.getByRole("button", { name: "기준 md" });
    const lg = screen.getByRole("button", { name: "기준 lg" });
    expect(recommend.className).toBe(md.className);
    expect(recommend.className).not.toBe(lg.className);
  });
});
