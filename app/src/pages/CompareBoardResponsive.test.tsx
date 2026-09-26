import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import type { Picks } from "../domain/compareBoard";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const THREE = ["ref-a", "ref-b", "ref-c"];
const original = window.matchMedia;

/** Tailwind 기준 폭(md 48rem · xl 80rem)으로 matchMedia를 흉내 낸다 — jsdom에는 matchMedia가 없다 */
function setViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*([\d.]+)rem/.exec(query)?.[1] ?? 0) * 16;
    return {
      matches: width >= min,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as MediaQueryList;
  }) as typeof window.matchMedia;
}

async function openAt(width: number, picks: Picks = {}) {
  setViewport(width);
  const repo = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, picks) });
  renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), repo);
  await screen.findByRole("heading", { level: 1, name: "비교 보드" });
}

afterEach(() => {
  window.matchMedia = original;
});

describe("<768 항목 아코디언 (SPEC 5.3 · A-11)", () => {
  it("표 의미를 쓰지 않고, 항목마다 h3 > button[aria-expanded]이며 처음에는 Hero만 펼친다", async () => {
    await openAt(390);
    const hero = await screen.findByRole("button", { name: /^Hero 구성 ·/ });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(hero.parentElement?.tagName).toBe("H3");
    expect(hero).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("button", { name: /^메뉴 구조 ·/ })).toHaveAttribute("aria-expanded", "false");
    const region = screen.getByRole("region", { name: /^Hero 구성/ });
    expect(hero).toHaveAttribute("aria-controls", region.id);
    expect(within(region).getAllByRole("button", { name: /의 요소 선택$/ })).toHaveLength(3);
  });

  it("접힌 머리글에 현재 선택을 보여 주고, 펼치면 모든 값과 선택 버튼이 보인다", async () => {
    await openAt(390, { menu: "ref-b" });
    const menu = await screen.findByRole("button", { name: /^메뉴 구조 ·/ });
    expect(menu).toHaveTextContent("B 선택됨");
    expect(screen.getByRole("button", { name: /^CTA 위치 ·/ })).toHaveTextContent("선택 안 함");
    expect(screen.getByRole("button", { name: /^섹션 수 ·/ })).toHaveTextContent("비교 정보");
    await userEvent.click(menu);
    expect(menu).toHaveAttribute("aria-expanded", "true");
    const region = screen.getByRole("region", { name: /^메뉴 구조/ });
    expect(region).toHaveTextContent("4개 · 모바일 햄버거");
    await userEvent.click(within(region).getByRole("button", { name: "메뉴 구조: C 동네 치과 클리닉의 요소 선택" }));
    expect(within(region).getByRole("button", { name: "메뉴 구조: C 동네 치과 클리닉의 요소 선택" })).toHaveAttribute("aria-pressed", "true");
    expect(menu).toHaveTextContent("C 선택됨");
  });

  it("info 행은 펼쳐도 선택 버튼이 없고, 열 목록에서 빼기·전부 선택을 할 수 있다", async () => {
    await openAt(390);
    await userEvent.click(await screen.findByRole("button", { name: /^섹션 수 ·/ }));
    expect(within(screen.getByRole("region", { name: /^섹션 수/ })).queryAllByRole("button")).toHaveLength(0);
    const list = screen.getByRole("list", { name: "비교 중인 레퍼런스" });
    expect(within(list).getAllByRole("button", { name: /비교에서 빼기$/ })).toHaveLength(3);
    expect(within(list).getAllByRole("button", { name: /^이 레퍼런스로 전부 선택/ })).toHaveLength(3);
  });

  it("하단 요약 바가 있다", async () => {
    await openAt(390, { hero: "ref-a" });
    const bar = await screen.findByRole("region", { name: "초안 요약" });
    expect(bar).toHaveTextContent("초안 1/10");
  });
});

describe("768~1279 표 + 하단 요약 바 (SPEC 5.2)", () => {
  it("표를 쓰고, 요약 바의 '초안 보기'는 패널 제목에 포커스한다", async () => {
    await openAt(768, { hero: "ref-a", footer: "ref-b" });
    expect(await screen.findByRole("table")).toBeInTheDocument();
    const bar = screen.getByRole("region", { name: "초안 요약" });
    expect(bar).toHaveTextContent("초안 2/10 · 경고 1");
    await userEvent.click(within(bar).getByRole("button", { name: "초안 보기" }));
    expect(screen.getByRole("heading", { level: 2, name: "프로필 초안" })).toHaveFocus();
  });

  it("요약 바의 확정도 같은 조건(aria-disabled + 이유)을 따른다", async () => {
    await openAt(1024);
    const bar = await screen.findByRole("region", { name: "초안 요약" });
    const confirm = within(bar).getByRole("button", { name: "프로필 확정" });
    expect(confirm).toHaveAttribute("aria-disabled", "true");
    expect(confirm).toHaveAccessibleDescription("Hero를 하나 고르면 확정할 수 있습니다");
    await userEvent.click(confirm);
    await waitFor(() => expect(screen.getByRole("status", { name: "선택 알림" })).toHaveTextContent("Hero를 하나 고르면 확정할 수 있습니다"));
  });
});

describe("≥1280 표 + 옆 패널 (SPEC 5.1)", () => {
  it("요약 바가 없다", async () => {
    await openAt(1280);
    expect(await screen.findByRole("table")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "초안 요약" })).not.toBeInTheDocument();
  });
});
