import { readFileSync } from "node:fs";
import { render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { SAMPLE_SECTIONS, section, sampleDoc, withSections } from "../../engine/testing/sampleDoc";
import { FallbackCanvas } from "./FallbackCanvas";

/**
 * 렌더 문서 와이어프레임 폴백 (ADR-004 개정 2 결정 3 · SPEC 5.7 r4.8) — 앱 캔버스(StructureCanvas)에서 옮긴 그리기 단언.
 * 출처는 각 describe 주석(REPORT "옮긴 단언 표"). 선택 칩·문제 표시는 부모 오버레이로 갔다(StructureCanvas.test).
 */
const draw = (doc: PageDoc, palette?: Parameters<typeof FallbackCanvas>[0]["palette"]) => render(<FallbackCanvas doc={doc} palette={palette} />).container;
const blockOf = (c: HTMLElement, id: string) => c.querySelector<HTMLElement>(`[data-instance-id="${id}"]`)!;

// 출처: components/studio/StructureCanvas.test.tsx "새 변형 3개를 슬롯 목록대로 그린다"
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
    const container = draw(doc);
    const block = (id: string) => within(container.querySelector<HTMLElement>(`[data-instance-id="${id}"]`)!);
    const texts = (id: string) => block(id).queryAllByText(/.+/, { selector: "p" }).map((p) => p.textContent);

    expect(texts("s-cards-2")).toEqual(["서비스", "이 섹션에서 전하려는 내용을 한두 문장으로 적습니다.", "항목 1", "항목을 짧게 설명합니다.", "항목 2", "항목을 짧게 설명합니다."]);
    expect(texts("s-cards-masonry")).toEqual([...texts("s-cards-2"), "항목 3", "항목을 짧게 설명합니다."]);
    expect(texts("s-masonry")).toEqual(["작업 사례", "이 섹션에서 전하려는 내용을 한두 문장으로 적습니다."]);
  });
});

// 출처: components/studio/StructureCanvas.test.tsx "변형별 모양 · 프로필 팔레트" 2건
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

  it("섹션마다 표의 모양(data-layout) · 카드 칸 수 = 카드 수 · 이미지 슬롯 = 줄무늬 aria-hidden", () => {
    const c = draw(doc, palette);
    expect(["s-header", "s-hero", "s-cards-3", "s-grid-2", "s-footer"].map((id) => blockOf(c, id).dataset.layout)).toEqual(["bar", "split", "cols3", "cols2", "dark"]);
    expect(blockOf(c, "s-cards-3").querySelectorAll("[data-cell]")).toHaveLength(3);
    expect(blockOf(c, "s-grid-2").querySelectorAll("[data-stripes]")).toHaveLength(2);
    expect(blockOf(c, "s-grid-3").querySelectorAll("[data-stripes]")).toHaveLength(3);
    expect(blockOf(c, "s-hero").querySelectorAll("[data-stripes]")).toHaveLength(1);
    for (const el of c.querySelectorAll("[data-stripes]")) expect(el).toHaveAttribute("aria-hidden", "true");
    // 실제 슬롯 글자는 그대로 (선택 칩은 부모 오버레이 — StructureCanvas.test)
    expect(within(blockOf(c, "s-header")).getByText("브랜드 이름")).toBeInTheDocument();
  });

  it("캔버스 루트 CSS 변수 = 팔레트 값 · 팔레트 없으면 중립 토큰 참조 · 모든 블록이 변수 색을 쓴다", () => {
    const root = (c: HTMLElement) => blockOf(c, "s-header").parentElement!;
    expect(root(draw(doc, palette)).style.getPropertyValue("--canvas-primary")).toBe("rgb(18, 52, 86)");
    const neutral = root(draw(doc));
    expect(neutral.style.getPropertyValue("--canvas-primary")).toMatch(/^var\(--/);
    for (const block of neutral.querySelectorAll<HTMLElement>("[data-instance-id]")) expect(block.className).toMatch(/--canvas-/);
  });
});

// 출처: components/studio/EmptySlot.test.tsx 2건(캔버스 쪽 단언) · StudioLayout.test.tsx "필드 입력 → 캔버스 글자 반영"(캔버스 쪽 단언)
describe("빈 슬롯 자리표시 · 글자 반영 (E-AC-24 · 5.7)", () => {
  const hero = SAMPLE_SECTIONS[1]!;
  const withHero = (slots: Record<string, string>) => withSections(sampleDoc(), SAMPLE_SECTIONS.map((s) => (s === hero ? { ...s, slots: { ...s.slots, ...slots } } : s)));

  it("글자를 모두 지우면 캔버스 자리표시 '제목을 입력하세요'(label-alternative) · 다시 채우면 실제 글자", () => {
    const canvas = within(draw(withHero({ title: "" })));
    expect(canvas.getByText("제목을 입력하세요")).toHaveClass("text-label-alternative");
    const filled = within(draw(withHero({ title: "새 제목" })));
    expect(filled.getByText("새 제목")).toBeInTheDocument();
  });

  it("선택 섹션이 아니어도 빈 글자 슬롯마다 자리표시 — 부제를 비우면 '부제를 입력하세요'", () => {
    expect(within(draw(withHero({ subtitle: "  " }))).getByText("부제를 입력하세요")).toBeInTheDocument();
  });
});

// 출처: pages/StudioShell.test.tsx "%i: 캡션 · 이미지·외부 URL 0 · 불투명도 0 …"(렌더 문서 DOM 쪽) · SPEC 5.7 r4.8 폴백 표식 · E-AC-49
describe("렌더 문서 DOM — 외부 자원 0 · 폴백 표식 · 편집기 UI 0 (5.7 r4.8 · E-AC-16 · E-AC-49)", () => {
  it("이미지·iframe·src 0 · 외부 URL 0 · 불투명도 글자 0", () => {
    const c = draw(sampleDoc());
    expect(c.querySelectorAll("img, iframe, [src]")).toHaveLength(0);
    expect(c.innerHTML).not.toMatch(/https?:|url\(/);
    expect(c.innerHTML).not.toMatch(/opacity|text-[\w-]+\/\d+/);
  });

  it("모든 섹션 머리에 '구조 미리보기' 표식(span — 글자 슬롯 p와 섞이지 않는다)", () => {
    const c = draw(sampleDoc());
    for (const block of c.querySelectorAll<HTMLElement>("[data-instance-id]")) {
      expect(block.querySelector('[data-kit-marker="fallback"]')).toHaveTextContent("구조 미리보기");
      expect(block.querySelector('[data-kit-marker="fallback"]')!.tagName).toBe("SPAN");
    }
  });

  it("권장 초과 글자가 있어도 문제 문장·배지·라벨 칩 0 — 글자 슬롯마다 data-slot(사각형 보고 대상)", () => {
    const c = draw(withSections(sampleDoc(), SAMPLE_SECTIONS.map((s, i) => (i === 1 ? { ...s, slots: { ...s.slots, title: "가".repeat(45) } } : s))));
    expect(c.textContent).not.toMatch(/권장|상한|경고 1|차단 1|Hero · /);
    expect(c.querySelector('[data-instance-id="s-hero"] [data-slot="title"]')).toHaveTextContent("가".repeat(45));
  });
});

// B-M2B-04 — 폴백은 [data-site-root] 안에서 사이트 글꼴 계열로 풀린다. 400·700 면 중 사이트가 안 쓰는 면을 받지 않게 굵기를 사이트 굵기에 맞춘다
describe("구조 미리보기 — 사이트 굵기만 쓴다(B-M2B-04 · siteWeight)", () => {
  const WEIGHT = /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/;
  it("글자·표식은 모두 사이트 굵기 클래스 하나를 쓰고 고정 굵기 유틸리티는 0", () => {
    const container = draw(sampleDoc({ sections: [section("hero", "center", "s-hero"), section("services", "cards-2", "s-cards"), section("faq", "accordion", "s-faq")] }));
    const nodes = [...container.querySelectorAll<HTMLElement>("[data-slot], [data-kit-marker='fallback'], [data-fallback] > p")];
    expect(nodes.length).toBeGreaterThan(3);
    for (const node of nodes) {
      const classes = node.className.split(/\s+/);
      expect(classes.filter((c) => WEIGHT.test(c))).toEqual([]);
      expect(classes.filter((c) => c === "font-(--fallback-strong)" || c === "font-(--fallback-regular)")).toHaveLength(1);
    }
    expect(within(blockOf(container, "s-hero")).getAllByText(/.+/, { selector: "[data-slot]" })[0]!.className).toContain("font-(--fallback-strong)");
  });
  it("render.css가 두 굵기 변수를 사이트 굵기(--site-weight-*)에 묶는다 — 킷 토큰 없으면 DS 굵기", () => {
    const css = readFileSync("src/render/render.css", "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).toMatch(/--fallback-strong:\s*var\(--site-weight-heading,\s*var\(--weight-bold\)\)/);
    expect(css).toMatch(/--fallback-regular:\s*var\(--site-weight-body,\s*var\(--weight-regular\)\)/);
  });
});
