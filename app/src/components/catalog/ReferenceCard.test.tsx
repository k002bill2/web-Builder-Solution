import { render, screen, within } from "@testing-library/react";
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
  it("목업 카드 필드를 빠짐없이 표시한다 (FR-CAT-02)", () => {
    const { card } = renderCard();
    const q = within(card);
    expect(q.getByRole("img", { name: "모던 카페 브랜드 썸네일 (자체 렌더 플레이스홀더)" })).toBeInTheDocument();
    expect(q.getByRole("heading", { name: "모던 카페 브랜드" })).toBeInTheDocument();
    expect(q.getByText("카페·F&B · 풀블리드 히어로")).toBeInTheDocument();
    expect(q.getByText("미니멀")).toBeInTheDocument();
    expect(q.getByText("따뜻한")).toBeInTheDocument();
    const { primary, surface, ink } = cafe.colorPalette;
    expect(q.getByRole("img", { name: `대표 색상 ${primary} · ${surface} · ${ink}` })).toBeInTheDocument();
    expect(q.getByText(/접근성/)).toHaveTextContent("접근성 96 · 성능 92 · 모션 낮음");
    expect(q.getByText("internal")).toBeInTheDocument();
    expect(q.getByText("점수 측정 2026.09.20 · 반응형 지원")).toBeInTheDocument();
  });

  it("이름은 레퍼런스 상세로 연결된다", () => {
    const { card } = renderCard();
    expect(within(card).getByRole("link", { name: "모던 카페 브랜드" })).toHaveAttribute("href", "/references/ref-a");
  });

  it("저장 버튼은 이름을 포함한 aria-label과 눌림 상태를 가진다", async () => {
    const { card, onToggleSave } = renderCard({ saved: true });
    const save = within(card).getByRole("button", { name: "모던 카페 브랜드 저장" });
    expect(save).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(save);
    expect(onToggleSave).toHaveBeenCalledWith("ref-a");
  });

  it("비교 버튼은 이름을 포함한 aria-label을 갖는다", async () => {
    const { card, onToggleCompare } = renderCard();
    const compare = within(card).getByRole("button", { name: "모던 카페 브랜드 비교 추가" });
    expect(compare).toHaveTextContent("비교 추가");
    await userEvent.click(compare);
    expect(onToggleCompare).toHaveBeenCalledWith("ref-a");
  });

  it("트레이에 담긴 카드는 '비교 중'으로 표시되고, 접근성 이름이 보이는 문구와 빼기 동작을 담는다", async () => {
    const { card, onToggleCompare } = renderCard({ inTray: true });
    const compare = within(card).getByRole("button", { name: "모던 카페 브랜드 비교 중, 비교에서 빼기" });
    expect(compare).toHaveTextContent("비교 중");
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
