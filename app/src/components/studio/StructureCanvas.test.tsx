import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { section, sampleDoc } from "../../engine/testing/sampleDoc";
import { StructureCanvas } from "./StructureCanvas";

describe("구조 미리보기 — 그리드 축 변형(SPEC r4.6 A3-Q3 · 5.7)", () => {
  it("새 변형 3개를 슬롯 목록대로 그린다 — cards-2 카드 2개 · cards-masonry 카드 3개 · portfolio/masonry 글자 슬롯만", () => {
    const doc = sampleDoc({
      sections: [
        section("header", "sticky-right-cta", "s-header"),
        section("hero", "fullbleed-left", "s-hero"),
        section("services", "cards-2", "s-cards-2"),
        section("services", "cards-masonry", "s-cards-masonry"),
        section("portfolio", "masonry", "s-masonry"),
        section("footer", "biz-extended", "s-footer"),
      ],
    });
    const { container } = render(<StructureCanvas doc={doc} selectedId="s-cards-2" onSelect={() => {}} view="desktop" scrollable={false} />);
    const block = (id: string) => within(container.querySelector<HTMLElement>(`[data-instance-id="${id}"]`)!);
    const texts = (id: string) => block(id).queryAllByText(/.+/, { selector: "p" }).map((p) => p.textContent);

    expect(texts("s-cards-2")).toEqual(["서비스", "이 섹션에서 전하려는 내용을 한두 문장으로 적습니다.", "항목 1", "항목을 짧게 설명합니다.", "항목 2", "항목을 짧게 설명합니다."]);
    expect(block("s-cards-2").getByText("Services · 카드 2열")).toBeInTheDocument();
    expect(texts("s-cards-masonry")).toEqual([...texts("s-cards-2"), "항목 3", "항목을 짧게 설명합니다."]);
    expect(texts("s-masonry")).toEqual(["작업 사례", "이 섹션에서 전하려는 내용을 한두 문장으로 적습니다."]);
    expect(screen.getByRole("region", { name: "구조 미리보기" })).toBeInTheDocument();
  });
});
