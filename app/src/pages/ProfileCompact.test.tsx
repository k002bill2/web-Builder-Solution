/**
 * PROFILE-V2-COMPACT — 프로필 화면을 시안 밀도로: 정보는 지우지 않고 네이티브 <details>로 접는다(기본 접힘, summary 클릭·Enter로 열림 —
 * 네이티브 summary가 펼침 상태를 보조기술에 알린다 = aria-expanded 대응). 편집 시작은 카드 바로 아래, 비교 표는 그 아래 디스클로저(≥768).
 */
import { act, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { POLL_MS } from "../features/profile/useGeneration";
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
  return screen.findByRole("region", { name: "3안" });
}
const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const detailsOf = (region: HTMLElement, summary: string) => [...region.querySelectorAll("details")].find((d) => d.querySelector(":scope > summary")?.textContent === summary);
const before = (a: Element, b: Element) => expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("왼쪽 패널 요약 우선 (PROFILE-V2-COMPACT 2·3)", () => {
  it("프로필 값: 요약(시각·레이아웃 Tag)은 보이고, 13줄 전체는 '값 전체 보기'(기본 접힘) 안 — 클릭하면 열림", async () => {
    await open();
    const values = screen.getByRole("region", { name: "프로필 값" });
    const all = detailsOf(values, "값 전체 보기")!;
    expect(all).toBeDefined();
    expect(all).not.toHaveAttribute("open");
    for (const label of ["Hero", "메뉴", "CTA 위치", "카드 스타일", "Footer", "모션", "섹션 구성"]) expect(within(all).getByText(label).closest("details")).toBe(all);
    expect(within(values).getByText("시각 방향").closest("details")).toBeNull();
    await user().click(all.querySelector("summary")!);
    expect(all).toHaveAttribute("open");
  });

  it("대비 검사: 요약 1줄(통과 N · 미달 M, 글자 — 접힌 디스클로저의 summary로 늘 보임) · 5줄 상세는 기본 접힘 안, 보정 제안은 밖", async () => {
    await open();
    const palette = screen.getByRole("region", { name: "역할 팔레트와 대비" });
    expect(within(palette).getByRole("heading", { level: 3, name: /^대비 검사 · 목표 / }).closest("details")).toBeNull();
    const detail = [...palette.querySelectorAll("details")].find((d) => /^통과 \d+ · 미달 \d+ · 대비 상세$/.test(d.querySelector("summary")?.textContent ?? ""))!;
    expect(detail).toBeDefined();
    expect(detail).not.toHaveAttribute("open");
    expect(within(palette).getByRole("list", { name: "대비 검사" }).closest("details")).toBe(detail);
    expect(within(palette).getByRole("list", { name: "보정 제안" }).closest("details")).toBeNull();
  });

  it("패널 제목 h2 = ds-heading1 · 현재 버전 배지 violet(글자 '현재')", async () => {
    const region = await open();
    for (const name of ["프로필 값", "역할 팔레트와 대비", "버전", "3안"]) expect(screen.getByRole("heading", { level: 2, name })).toHaveClass("ds-heading1");
    expect(within(region).getByRole("heading", { level: 2, name: "3안" })).toHaveClass("ds-heading1");
    expect(screen.getByText("v1 · 현재")).toHaveClass("text-accent-violet");
  });
});

describe("편집 시작 위치 · 비교 표 디스클로저 (PROFILE-V2-COMPACT 5)", () => {
  it("DOM 순서: 카드 목록 → 편집 시작 → '3안 비교 표 보기'(기본 접힘, <768 숨김)", async () => {
    const region = await open();
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    await within(region).findByRole("button", { name: "만드는 중…" });
    for (let i = 0; i < 3; i += 1) await act(() => vi.advanceTimersByTimeAsync(POLL_MS));
    const table = await within(region).findByRole("table", { name: "3안 비교" });
    const detail = detailsOf(region, "3안 비교 표 보기")!;
    expect(detail).not.toHaveAttribute("open");
    expect(detail).toHaveClass("hidden", "md:block");
    expect(table.closest("details")).toBe(detail);
    const cards = within(region).getByRole("list", { name: "3안" });
    const edit = within(region).getByRole("button", { name: "편집 시작" });
    before(cards, edit);
    before(edit, detail);
  });
});
