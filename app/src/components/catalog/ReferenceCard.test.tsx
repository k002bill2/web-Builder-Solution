import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { referenceFixtures } from "../../fixtures/references";
import { ReferenceCard } from "./ReferenceCard";

const cafe = referenceFixtures[0]!;

function renderCard(overrides: Partial<Parameters<typeof ReferenceCard>[0]> = {}) {
  const props = {
    reference: cafe,
    saved: false,
    inTray: false,
    onToggleSave: vi.fn(),
    onToggleCompare: vi.fn(),
    ...overrides,
  };
  render(
    <MemoryRouter>
      <ReferenceCard {...props} />
    </MemoryRouter>,
  );
  return { ...props, card: screen.getByRole("article", { name: "모던 카페 브랜드" }) };
}

describe("ReferenceCard", () => {
  it("FR-CAT-02 필드를 빠짐없이 표시하고, 점수에는 라벨과 측정일이 붙는다 (V2-AC-22 · C-04)", () => {
    const { card } = renderCard();
    const q = within(card);
    expect(q.getByRole("img", { name: "모던 카페 브랜드 썸네일 (자체 렌더 플레이스홀더)" })).toBeInTheDocument();
    expect(q.getByRole("heading", { name: "모던 카페 브랜드" })).toBeInTheDocument();
    expect(q.getByText("카페·F&B · 풀블리드 히어로 · 모션 낮음")).toBeInTheDocument();
    expect(q.getByText("미니멀 · 따뜻한 · 반응형 지원")).toBeInTheDocument();
    const { primary, surface, ink } = cafe.colorPalette;
    expect(q.getByRole("img", { name: `대표 색상 ${primary} · ${surface} · ${ink}` })).toBeInTheDocument();
    const score = q.getByText(/^접근성/);
    expect(score).toHaveTextContent("접근성 96 · 성능 92 · 09.20 측정");
    expect(score.querySelector("time")).toHaveAttribute("datetime", "2026-09-20");
    expect(q.getByText("internal")).toBeInTheDocument();
  });

  it("반응형 미지원이면 캡션 2에 그렇게 적는다", () => {
    const { card } = renderCard({ reference: { ...cafe, responsive: false } });
    expect(within(card).getByText("미니멀 · 따뜻한 · 반응형 미지원")).toBeInTheDocument();
  });

  it("v2 카드: 보더 없음, 썸네일만 muted 면, 제목 2줄까지 (V2-AC-22 · C-03)", () => {
    const { card } = renderCard();
    expect(card.className).not.toMatch(/\bborder\b/);
    expect(card.className).not.toMatch(/\bbg-/);
    expect(within(card).getByRole("img", { name: /썸네일/ })).toHaveClass("bg-background-alternative");
    // clamp(overflow:hidden)는 링크 자신에 — h3에 걸면 링크 바깥 포커스 링(2중 링)이 잘린다
    expect(within(card).getByRole("link", { name: "모던 카페 브랜드" })).toHaveClass("line-clamp-2");
    expect(within(card).getByRole("heading", { name: "모던 카페 브랜드" }).className).not.toMatch(/line-clamp|overflow|truncate/);
  });

  it("v2 카드 제목: ds-body2 + semibold, 2줄 clamp는 링크에 유지, 링크 hover·URL 불변 (VISUAL-V2-APPLY 4, REPORT 1.2)", () => {
    const { card } = renderCard();
    const title = within(card).getByRole("heading", { name: "모던 카페 브랜드" });
    expect(title).toHaveClass("ds-body2", "font-semibold");
    expect(title).not.toHaveClass("ds-heading2");
    const link = within(card).getByRole("link", { name: "모던 카페 브랜드" });
    expect(link).toHaveClass("line-clamp-2", "hover:text-primary");
    expect(link).toHaveAttribute("href", "/references/ref-a");
  });

  it("상태가 바뀌면 아이콘 모양도 바뀐다 — 색 말고 모양 단서 (저장 bookmark → bookmark-fill, 비교 plus → check)", () => {
    const iconOf = (button: HTMLElement) => button.querySelector("i")?.getAttribute("style");
    const off = within(renderCard().card);
    const offSave = iconOf(off.getByRole("button", { name: "모던 카페 브랜드 저장" }));
    const offCompare = iconOf(off.getByRole("button", { name: "모던 카페 브랜드 비교 추가" }));
    cleanup();
    const on = within(renderCard({ saved: true, inTray: true }).card);
    expect(iconOf(on.getByRole("button", { name: "모던 카페 브랜드 저장" }))).not.toBe(offSave);
    expect(iconOf(on.getByRole("button", { name: "모던 카페 브랜드 비교 중, 비교에서 빼기" }))).not.toBe(offCompare);
  });

  it("이름은 레퍼런스 상세로 연결된다", () => {
    const { card } = renderCard();
    expect(within(card).getByRole("link", { name: "모던 카페 브랜드" })).toHaveAttribute("href", "/references/ref-a");
  });

  it("저장은 32px ghost 아이콘 버튼 — 이름·aria-pressed 유지, 저장됨은 채운 북마크 + primary (V2-AC-23)", async () => {
    const { card, onToggleSave } = renderCard({ saved: true });
    const save = within(card).getByRole("button", { name: "모던 카페 브랜드 저장" });
    expect(save).toHaveAttribute("aria-pressed", "true");
    expect(save).toHaveClass("size-8", "text-primary");
    await userEvent.click(save);
    expect(onToggleSave).toHaveBeenCalledWith("ref-a");
  });

  it("저장 전에는 aria-pressed=false, 빈 북마크", () => {
    const { card } = renderCard();
    const save = within(card).getByRole("button", { name: "모던 카페 브랜드 저장" });
    expect(save).toHaveAttribute("aria-pressed", "false");
  });

  it("비교는 32px ghost 아이콘 버튼 — 이름에 상태 글자를 담고 aria-pressed는 없다 (V2-AC-23)", async () => {
    const { card, onToggleCompare } = renderCard();
    const compare = within(card).getByRole("button", { name: "모던 카페 브랜드 비교 추가" });
    expect(compare).toHaveClass("size-8");
    expect(compare).toHaveTextContent("비교 추가");
    expect(compare).not.toHaveAttribute("aria-pressed");
    await userEvent.click(compare);
    expect(onToggleCompare).toHaveBeenCalledWith("ref-a");
  });

  it("트레이에 담긴 카드는 check 아이콘 + primary, 이름은 '비교 중, 비교에서 빼기'", async () => {
    const { card, onToggleCompare } = renderCard({ inTray: true });
    const compare = within(card).getByRole("button", { name: "모던 카페 브랜드 비교 중, 비교에서 빼기" });
    expect(compare).toHaveTextContent("비교 중");
    expect(compare).toHaveClass("text-primary");
    expect(compare).not.toHaveAttribute("aria-pressed");
    await userEvent.click(compare);
    expect(onToggleCompare).toHaveBeenCalledWith("ref-a");
  });

  it("licensed 레퍼런스는 licensed 배지를 표시한다", () => {
    render(
      <MemoryRouter>
        <ReferenceCard
          reference={referenceFixtures[1]!}
          saved={false}
          inTray={false}
          onToggleSave={vi.fn()}
          onToggleCompare={vi.fn()}
        />
      </MemoryRouter>,
    );
    expect(within(screen.getByRole("article", { name: "프리미엄 헤어살롱" })).getByText("licensed")).toBeInTheDocument();
  });
});
