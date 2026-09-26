/**
 * DS-2A-04 2a-04b1 — 보드 초안 패널 P-S25 "이어지는 조정 N개 · 지워지는 조정 M개" (P-AC-38·39 ①~⑤ 화면 몫) ·
 * P-S12 개수 다시 계산 · P-AC-37 보드 확정 계측 · 버전 요약의 지운 조정 한 줄(P-AC-20·38).
 * 보드·프로필 메모리 저장소를 store 하나로 만들어 렌더에 함께 넘긴다 — 조정 버전은 saveAdjustments로 만든다(브리프 1절).
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import type { Picks } from "../domain/compareBoard";
import type { ProfileAdjustments } from "../domain/profile";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { PROFILE_EVENT, type ProfileEvent } from "../features/profile/profileEvents";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";
import { REF_B_INK_FIX as INK_FIX } from "../test/studioFixtures";

const THREE = ["ref-a", "ref-b", "ref-c"];
const SLOW = { timeout: 5_000 };
const pick = (row: string, column: string) => screen.getByRole("button", { name: `${row}: ${column}의 요소 선택` });
const confirmButton = () => screen.getByRole("button", { name: /확정 \(v\d\)$/ });
const draftPanel = () => screen.getByRole("region", { name: "프로필 초안" });
const caption = () => within(draftPanel()).queryByText(/^이어지는 조정/);
const rows = () => within(within(draftPanel()).getByText("조정 목록").closest("details")!).getAllByRole("listitem").map((li) => li.textContent);

async function openStudio(picks: Picks = { hero: "ref-a" }) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, picks), store });
  const profiles = createMemoryProfileRepository({ store });
  const events: ProfileEvent[] = [];
  const listener = (e: Event) => events.push((e as CustomEvent<ProfileEvent>).detail);
  window.addEventListener(PROFILE_EVENT, listener);
  const view = renderApp("/compare", createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, profiles);
  await screen.findByRole("heading", { level: 1, name: "비교 보드" }, SLOW);
  const versions = async () => (await profiles.getProfile("profile-1"))?.versions ?? [];
  /** 보드 확정 v1 → 프로필 화면에서(저장소로) 조정 저장 v2 → 보드로 돌아온다 */
  const confirmThenAdjust = async (adjustments: ProfileAdjustments) => {
    await userEvent.click(confirmButton());
    await waitFor(() => expect(view.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    await profiles.saveAdjustments("profile-1", 1, adjustments);
    await act(() => view.router.navigate("/compare"));
    expect(await screen.findByText("v1 확정됨", undefined, SLOW)).toBeInTheDocument();
  };
  const cleanup = () => window.removeEventListener(PROFILE_EVENT, listener);
  return { ...view, store, board, profiles, events, versions, confirmThenAdjust, cleanup };
}

afterEach(() => vi.restoreAllMocks());

describe("P-S25 보드 초안 패널 — 이어받을 조정 (P-AC-38·39)", () => {
  it("P-AC-38: v2 = 밀도 촘촘 + 모션 덮어쓰기, 보드에서 모션을 바꾸면 '이어지는 조정 1개 · 지워지는 조정 1개' + 목록 → 재확정 v3 = 목록대로 저장, 버전 요약에 지운 조정 한 줄", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact", motion: "L0" });
    expect(await within(draftPanel()).findByText("이어지는 조정 2개 · 지워지는 조정 0개", undefined, SLOW)).toBeInTheDocument();
    await userEvent.click(pick("모션", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(caption()).toHaveTextContent("이어지는 조정 1개 · 지워지는 조정 1개"));
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "모션 L0 — 지워짐 · 보드에서 모션을 바꿨습니다"]);
    // 캡션은 확정 버튼 앞(DOM 순서 = 보이는 순서)
    expect(caption()!.compareDocumentPosition(confirmButton()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v3)" })).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    const v3 = (await studio.versions()).at(-1)!;
    // P-AC-39 ①: 패널 "이어짐" 목록 = 저장된 adjustments
    expect(v3).toMatchObject({ version: 3, origin: "board-reconfirm", adjustments: { density: "compact" }, dropped: [{ key: "motion", reason: "board-changed" }] });
    expect(v3.adjustments.motion).toBeUndefined();
    expect(await screen.findByText(/보드에서 모션을 바꿔 모션 조정을 지웠습니다/, undefined, SLOW)).toBeInTheDocument();
    studio.cleanup();
  }, 30_000);

  it("P-AC-39 ②: 겹치지 않는 필드(Hero)만 바꾸면 '지워지는 조정 0개', 전부 '이어짐'", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact", motion: "L0", purpose: "booking" });
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    await waitFor(() => expect(caption()).toHaveTextContent("이어지는 조정 3개 · 지워지는 조정 0개"), SLOW);
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "모션 L0 — 이어짐", "사이트 목적 예약 — 이어짐"]);
    studio.cleanup();
  }, 30_000);

  it("P-AC-39 ③: ref-b 팔레트 + 밝은 카드의 ink 보정 → 어두운 카드로 바꾸면 '지워짐 · 새 카드 톤에서 대비가 맞지 않습니다', 확정 뒤 프로필 화면에 충돌(3.3) 표시", async () => {
    const studio = await openStudio({ hero: "ref-a", palette: "ref-b", card: "ref-a" });
    await studio.confirmThenAdjust({ corrections: [INK_FIX] });
    await userEvent.click(pick("카드 스타일", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(caption()).toHaveTextContent("이어지는 조정 0개 · 지워지는 조정 1개"), SLOW);
    expect(rows()).toEqual(["ink 보정 — 지워짐 · 새 카드 톤에서 대비가 맞지 않습니다"]);
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    expect(await screen.findByText(/한 값으로 둘 다 맞출 수 없습니다/, undefined, SLOW)).toBeInTheDocument();
    expect((await studio.versions()).at(-1)!.adjustments).toEqual({});
    studio.cleanup();
  }, 30_000);

  it("P-AC-39 ④⑤: 조정 0개면 캡션·목록 없음(확정 전·조정 없는 v1 확정 뒤 모두)", async () => {
    const studio = await openStudio();
    expect(caption()).toBeNull();
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    await act(() => studio.router.navigate("/compare"));
    expect(await screen.findByText("v1 확정됨", undefined, SLOW)).toBeInTheDocument();
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v2)" })).not.toHaveAttribute("aria-disabled"));
    expect(caption()).toBeNull();
    expect(within(draftPanel()).queryByText("조정 목록")).toBeNull();
    studio.cleanup();
  }, 30_000);

  it("P-S12: 패널이 보인 뒤 다른 곳에서 조정 버전이 생기면 확정 0건 + 안내, 최신 조정으로 개수를 다시 계산", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact" });
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    await waitFor(() => expect(caption()).toHaveTextContent("이어지는 조정 1개 · 지워지는 조정 0개"), SLOW);
    await studio.profiles.saveAdjustments("profile-1", 2, { density: "compact", contrast: "enhanced" });
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    expect(await screen.findByRole("alert", undefined, SLOW)).toHaveTextContent("다른 곳에서 v3이 만들어졌습니다");
    await waitFor(() => expect(caption()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 0개"));
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "대비 강화 — 이어짐"]);
    expect((await studio.versions()).map((v) => v.version)).toEqual([1, 2, 3]);
    studio.cleanup();
  }, 30_000);
});

describe("P-AC-37 보드 확정 계측 — profile_saved(origin board · board-reconfirm)", () => {
  it("첫 확정 = board v1, 재확정 = board-reconfirm v3 — 성공마다 1회, 색 값·입력 원문 없음", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact" });
    expect(studio.events).toEqual([{ name: "profile_saved", version: 1, origin: "board" }]);
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v3)" })).not.toHaveAttribute("aria-disabled"), SLOW);
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    expect(studio.events).toEqual([
      { name: "profile_saved", version: 1, origin: "board" },
      { name: "profile_saved", version: 3, origin: "board-reconfirm" },
    ]);
    studio.cleanup();
  }, 30_000);

  it("확정 실패(STALE_PROFILE)는 profile_saved 없이 profile_save_failed(reason = 오류 코드) 1회", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact" });
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    await studio.profiles.saveAdjustments("profile-1", 2, { density: "comfortable" });
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"), SLOW);
    await userEvent.click(confirmButton());
    await screen.findByRole("alert", undefined, SLOW);
    expect(studio.events).toEqual([
      { name: "profile_saved", version: 1, origin: "board" },
      { name: "profile_save_failed", reason: "STALE_PROFILE" },
    ]);
    studio.cleanup();
  }, 30_000);
});
