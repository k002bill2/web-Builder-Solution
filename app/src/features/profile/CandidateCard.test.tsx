/**
 * PROFILE-V2-COMPACT 4 — 3안 카드 기본 노출(와이어프레임·제목·축 요약·선택 상태·경고 Tag)과 "상세" 디스클로저 1개.
 * 로그 3줄·경고 상세·결과 해시·섹션 순서·전체 로그는 "상세" 안(기본 접힘). 경고가 있으면 접힌 상태에서도 "경고 N" 글자가 보인다.
 */
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { CandidatePlan } from "../../domain/generation";
import { CandidateCard, type WirePalette } from "./CandidateCard";

const PALETTE: WirePalette = { primary: "var(--x)", surface: "var(--x)", ink: "var(--x)", muted: "var(--x)", bg: "var(--x)" };
const PLAN: CandidatePlan = {
  id: "A",
  axes: { heroVariant: "fullbleed", grid: "grid-3", typeScale: 1.25 },
  sections: [
    { type: "header", variant: "standard", motion: "L0" },
    { type: "hero", variant: "fullbleed", motion: "L1" },
    { type: "footer", variant: "compact", motion: "L0" },
  ],
  summary: ["요약 줄 하나", "요약 줄 둘", "요약 줄 셋"],
  log: ["로그 첫 줄", "로그 둘째 줄"],
  lint: [
    { rule: "R-08", severity: "block", message: "대비 경고 문장" },
    { rule: "R-12", severity: "info", message: "정보 문장" },
  ],
  hash: "abcd1234",
};

function renderCard(plan: CandidatePlan = PLAN) {
  const { container } = render(
    <ul>
      <CandidateCard plan={plan} palette={PALETTE} profileScale={1.25} selected={false} busy={false} onSelect={vi.fn()} />
    </ul>,
  );
  return container.querySelector<HTMLElement>("ul > li")!;
}

describe("3안 카드 간결화 (PROFILE-V2-COMPACT 4)", () => {
  it("기본 노출: 제목 · 축 요약 · 경고 Tag · 선택 버튼(aria-pressed) — 모두 '상세' 밖", () => {
    const card = renderCard();
    const outside = (el: HTMLElement) => expect(el.closest("details")).toBeNull();
    outside(within(card).getByRole("heading", { level: 3, name: "A안" }));
    outside(within(card).getByText(/ · 비율 1\.25$/));
    outside(within(card).getByText("경고 1"));
    const select = within(card).getByRole("button", { name: "A안 선택" });
    expect(select).toHaveAttribute("aria-pressed", "false");
    outside(select);
  });

  it("디스클로저는 '상세' 1개, 기본 접힘 — 로그 3줄·경고 상세·정보·해시·섹션 순서·전체 로그가 그 안", async () => {
    const card = renderCard();
    const details = card.querySelectorAll("details");
    expect(details).toHaveLength(1);
    const detail = details[0]!;
    expect(detail).not.toHaveAttribute("open");
    expect(detail.querySelector("summary")).toHaveTextContent("상세");
    const inside = within(detail);
    expect(inside.getByRole("list", { name: "A안 로그" }).children).toHaveLength(3);
    expect(inside.getByText(/R-08 · 대비 경고 문장/)).toBeInTheDocument();
    expect(inside.getByText(/R-12 · 정보 문장/)).toBeInTheDocument();
    expect(inside.getByText("abcd1234")).toBeInTheDocument();
    expect(inside.getByText("로그 둘째 줄")).toBeInTheDocument();
    expect(inside.getByRole("link", { name: "팔레트와 대비 보기" })).toHaveClass("text-primary-text");
    await userEvent.click(detail.querySelector("summary")!);
    expect(detail).toHaveAttribute("open");
  });

  it("경고가 없으면 경고 Tag 없음", () => {
    const card = renderCard({ ...PLAN, lint: [] });
    expect(within(card).queryByText(/^경고 \d+$/)).not.toBeInTheDocument();
  });
});
