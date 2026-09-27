/**
 * PROFILE-VISUAL-ALIGN — 시안 잔여 차이: 페이지 머리를 왼쪽 열 안으로(오른쪽은 "생성된 3안"으로 바로 시작) · 역할 팔레트 한 줄 스와치 ·
 * 대비 보정 제안 정보 배너(버튼은 배너 안 텍스트 버튼). 동작·알림·포커스는 ProfileAdjust·ProfileCompact 테스트가 그대로 지킨다.
 */
import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

async function open() {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  await board.confirmProfile(1, 0);
  renderApp("/profile/profile-1", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, createMemoryProfileRepository({ store }), createMemoryGenerationRepository({ store }));
  await screen.findByRole("heading", { level: 1, name: "디자인 프로필" });
  return screen.findByRole("region", { name: "생성된 3안" });
}
const before = (a: Element, b: Element) => expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

describe("배치: 페이지 머리는 왼쪽 열 안 (PROFILE-VISUAL-ALIGN 1)", () => {
  it("h1·부제·'비교 보드에서 선택 바꾸기'와 프로필 패널이 한 열, 3안은 형제 열 · 오른쪽은 '생성된 3안' 제목으로 시작 · DOM 순서 = 머리 → 패널 → 3안", async () => {
    const candidates = await open();
    const h1 = screen.getByRole("heading", { level: 1, name: "디자인 프로필" });
    const values = screen.getByRole("region", { name: "프로필 값" });
    const left = h1.closest("header")!.parentElement!;
    expect(left).toContainElement(values);
    expect(left).toContainElement(screen.getByRole("link", { name: "비교 보드에서 선택 바꾸기" }));
    expect(left).toContainElement(screen.getByRole("region", { name: "버전" }));
    expect(left).not.toContainElement(candidates);
    expect(candidates.parentElement).toBe(left.parentElement);
    expect(candidates.querySelector("h2")).toHaveTextContent(/^생성된 3안$/);
    before(h1, values);
    before(values, candidates);
  });
});

describe("역할 팔레트 한 줄 스와치 (PROFILE-VISUAL-ALIGN 2)", () => {
  it("스와치 5칸 한 줄 · 역할 이름은 보이는 캡션(색 단독 금지) · hex·한글 이름은 '팔레트 값 보기'(기본 접힘) 안의 '역할 팔레트' 목록", async () => {
    await open();
    const palette = screen.getByRole("region", { name: "역할 팔레트와 대비" });
    const row = within(palette).getByRole("list", { name: "역할 스와치" });
    expect(row).toHaveClass("grid-cols-5");
    expect(within(row).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["primary", "surface", "ink", "muted", "bg"]);
    expect(row.closest("details")).toBeNull();
    const detail = within(palette).getByRole("list", { name: "역할 팔레트" }).closest("details")!;
    expect(detail).not.toBeNull();
    expect(detail).not.toHaveAttribute("open");
    expect(detail.querySelector(":scope > summary")).toHaveTextContent(/^팔레트 값 보기$/);
    expect(within(detail).getByText(/^보조 글자 \(muted\)/)).toBeInTheDocument();
  });
});

describe("대비 보정 제안 = 정보 배너 (PROFILE-VISUAL-ALIGN 3)", () => {
  it("제안 1개 = 정보 면 배너 한 덩어리, 문장 + 배너 안 텍스트 버튼 '보정값 쓰기' · 목록은 디스클로저 밖", async () => {
    await open();
    const palette = screen.getByRole("region", { name: "역할 팔레트와 대비" });
    const proposals = within(palette).getByRole("list", { name: "보정 제안" });
    expect(proposals.closest("details")).toBeNull();
    const button = within(proposals).getByRole("button", { name: "보정값 쓰기 (보조 글자 muted)" });
    const banner = button.closest("li")!;
    expect(banner).toHaveClass("bg-status-informative-bg");
    expect(banner).toHaveTextContent(/보조 글자\(muted\) 대비가/);
    expect(button).toHaveClass("bg-transparent", "text-primary-text");
    expect(button).not.toHaveClass("border-line-normal");
  });
});
