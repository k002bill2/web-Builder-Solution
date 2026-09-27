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

describe("구조 미리보기 — 변형별 모양 · 프로필 팔레트 (SPEC r4.7 A3-Q7 · 5.7)", () => {
  const doc = sampleDoc({
    sections: [
      section("header", "sticky-right-cta", "s-header"),
      section("hero", "split", "s-hero"),
      section("services", "cards-3", "s-cards-3"),
      section("portfolio", "grid-2", "s-grid-2"),
      section("portfolio", "grid-3", "s-grid-3"),
      section("footer", "biz-extended", "s-footer"),
    ],
  });
  const palette = { primary: "rgb(18, 52, 86)", surface: "rgb(238, 238, 238)", ink: "rgb(17, 17, 17)", muted: "rgb(153, 153, 153)", bg: "rgb(255, 255, 255)" };
  const draw = (p?: typeof palette) => render(<StructureCanvas doc={doc} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} palette={p} />).container;
  const blockOf = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-instance-id="${id}"]`)!;

  it("섹션마다 표의 모양(data-layout) · 카드 칸 수 = 카드 수 · 이미지 슬롯 = 줄무늬 aria-hidden", () => {
    const c = draw(palette);
    expect(["s-header", "s-hero", "s-cards-3", "s-grid-2", "s-footer"].map((id) => blockOf(c, id).dataset.layout)).toEqual(["bar", "split", "cols3", "cols2", "dark"]);
    expect(blockOf(c, "s-cards-3").querySelectorAll("[data-cell]")).toHaveLength(3);
    expect(blockOf(c, "s-grid-2").querySelectorAll("[data-stripes]")).toHaveLength(2);
    expect(blockOf(c, "s-grid-3").querySelectorAll("[data-stripes]")).toHaveLength(3);
    expect(blockOf(c, "s-hero").querySelectorAll("[data-stripes]")).toHaveLength(1);
    for (const el of c.querySelectorAll("[data-stripes]")) expect(el).toHaveAttribute("aria-hidden", "true");
    // 실제 슬롯 글자 · 선택 칩은 그대로
    expect(within(blockOf(c, "s-hero")).getByText("Hero · 스플릿 (카피 / 이미지)")).toBeInTheDocument();
    expect(within(blockOf(c, "s-header")).getByText("브랜드 이름")).toBeInTheDocument();
  });

  it("캔버스 루트 CSS 변수 = 팔레트 값 · 팔레트 없으면 중립 토큰 참조 · 모든 블록이 변수 색을 쓴다", () => {
    const root = (c: HTMLElement) => blockOf(c, "s-header").parentElement!;
    expect(root(draw(palette)).style.getPropertyValue("--canvas-primary")).toBe("rgb(18, 52, 86)");
    const neutral = root(draw());
    expect(neutral.style.getPropertyValue("--canvas-primary")).toMatch(/^var\(--/);
    for (const block of neutral.querySelectorAll<HTMLElement>("[data-instance-id]")) expect(block.className).toMatch(/--canvas-/);
  });
});
