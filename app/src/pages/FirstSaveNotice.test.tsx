/**
 * P1C-D5 첫 저장 1회 안내 UI (P1C-SPEC 1.4 · AC-C11) — 보드 확정 성공 결과 문장(J-S11 "프로필 알림" status) 뒤에 이어 붙인다.
 * 새 라이브 영역 0 · status 문장 1개 · 확정 결과에 firstSave가 없으면(두 번째 확정·memory 강등) 추가 0.
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";

const SLOW = { timeout: 5_000 };
const NOTICE = "이 브라우저에 저장했습니다 — 공용 PC라면 다 쓴 뒤 '프로젝트' 화면의 '이 브라우저 데이터 지우기'로 지우세요";
const CREATED = "새 프로젝트 '모던 카페 브랜드 프로젝트'를 만들었습니다";

afterEach(() => {
  vi.restoreAllMocks();
});

async function confirmWith(firstSave: boolean) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  const confirm = board.confirmProfile.bind(board);
  vi.spyOn(board, "confirmProfile").mockImplementation(async (...args) => ({ ...(await confirm(...args)), ...(firstSave && { firstSave: true as const }) }));
  const view = renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, createMemoryProfileRepository({ store }));
  await userEvent.click(await screen.findByRole("button", { name: "프로필 확정 (v1)" }, SLOW));
  await waitFor(() => expect(view.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
  return view;
}

const region = () => screen.getByRole("status", { name: "프로필 알림" });

describe("AC-C11 첫 저장 안내 — 확정 결과 status 문장에 이어 붙임", () => {
  it("firstSave → \"새 프로젝트 '…'을 만들었습니다 · <안내>\" 한 문장 · 영역 안 문장 1개 · 새 라이브 영역 0", async () => {
    const liveBefore = document.querySelectorAll("[aria-live],[role=status],[role=alert]").length;
    await confirmWith(true);
    await waitFor(() => expect(region().textContent).toBe(`${CREATED} · ${NOTICE}`), SLOW);
    expect(within(region()).getAllByText(/./)).toHaveLength(1);
    expect(liveBefore).toBe(0);
    expect(screen.getAllByText(NOTICE, { exact: false })).toHaveLength(1);
  });

  it("firstSave 없음(두 번째 확정·memory 강등) → 확정 결과 문장만 · 안내 0", async () => {
    await confirmWith(false);
    await waitFor(() => expect(region().textContent).toBe(CREATED), SLOW);
    expect(screen.queryByText(NOTICE, { exact: false })).toBeNull();
  });
});
