/**
 * DS-2A-04 2a-04b1 — 보드 초안 패널 P-S25 (r6: 진입 직후 개수 캡션 + "이어받기 확인"을 펼칠 때 이어짐/지워짐 목록)
 * (P-AC-38·39 ①~⑦ 화면 몫) · P-S12 개수 다시 계산 · P-AC-37 보드 확정 계측 · 버전 요약의 지운 조정 한 줄(P-AC-20·38).
 * 보드·프로필 메모리 저장소를 store 하나로 만들어 렌더에 함께 넘긴다 — 조정 버전은 saveAdjustments로 만든다(브리프 1절).
 * 패널 청크 로더는 실제 import를 그대로 부르는 mock이다 — 호출 수(펼치기 전 0)를 세고 지연·실패를 주입한다.
 */
import { act, cleanup as unmountAll, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import type { Picks } from "../domain/compareBoard";
import type { ProfileAdjustments, ProfileVersion } from "../domain/profile";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { loadCarryOverPanel } from "../features/compare/carryOverLoader";
import { PROFILE_EVENT, type ProfileEvent } from "../features/profile/profileEvents";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { deferred } from "../test/deferred";
import { renderApp } from "../test/renderApp";
import { REF_B_INK_FIX as INK_FIX } from "../test/studioFixtures";

vi.mock("../features/compare/carryOverLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../features/compare/carryOverLoader")>();
  return { loadCarryOverPanel: vi.fn(actual.loadCarryOverPanel) };
});
const panelLoads = vi.mocked(loadCarryOverPanel);
type PanelModule = Awaited<ReturnType<typeof loadCarryOverPanel>>;

const THREE = ["ref-a", "ref-b", "ref-c"];
const SLOW = { timeout: 5_000 };
const pick = (row: string, column: string) => screen.getByRole("button", { name: `${row}: ${column}의 요소 선택` });
const confirmButton = () => screen.getByRole("button", { name: /확정 \(v\d\)$/ });
const draftPanel = () => screen.getByRole("region", { name: "프로필 초안" });
/** 진입 직후 자동 — 개수 캡션 (r6) */
const caption = () => within(draftPanel()).queryByText(/^이 프로필에 조정/);
const summary = () => within(draftPanel()).getByText("이어받기 확인");
const checkDetails = () => summary().closest("details")!;
/** 펼친 뒤 — "이어지는 조정 N개 · 지워지는 조정 M개" */
const counts = () => within(draftPanel()).queryByText(/^이어지는 조정/);
const rows = () => within(checkDetails()).getAllByRole("listitem").map((li) => li.textContent);
const expand = () => userEvent.click(summary());
const profileNotice = () => screen.getByRole("status", { name: "프로필 알림" });
/** 두 번의 실행을 비교할 때 생성 시각만 뺀다 */
const withoutTime = (version: ProfileVersion) => ({ ...version, createdAt: "" });

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
    // 보드 화면이 실제로 내려간 뒤 돌아간다(위치는 렌더 중 기록)
    await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: "비교 보드" })).toBeNull(), SLOW);
    await profiles.saveAdjustments("profile-1", 1, adjustments);
    await act(() => view.router.navigate("/compare"));
    expect(await screen.findByText("v1 확정됨", undefined, SLOW)).toBeInTheDocument();
  };
  /** 확정 버튼이 풀리면 눌러 프로필 화면까지 간다 */
  const confirmNow = async (label: string) => {
    await waitFor(() => expect(screen.getByRole("button", { name: label })).not.toHaveAttribute("aria-disabled"), SLOW);
    await userEvent.click(confirmButton());
    await waitFor(() => expect(view.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
  };
  const cleanup = () => window.removeEventListener(PROFILE_EVENT, listener);
  return { ...view, store, board, profiles, events, versions, confirmThenAdjust, confirmNow, cleanup };
}

beforeEach(() => {
  panelLoads.mockReset();
});
afterEach(() => vi.restoreAllMocks());

describe("P-S25 보드 초안 패널 — 이어받을 조정 (P-AC-38·39)", () => {
  it("P-AC-38: v2 = 밀도 촘촘 + 모션 덮어쓰기 — 캡션 '조정 2개' → 펼치면 '이어지는 조정 2개 · 지워지는 조정 0개', 보드에서 모션을 바꾸면 '1개 · 1개' + 목록 → 재확정 v3 = 목록대로 저장, 버전 요약에 지운 조정 한 줄, 프로필 알림 '조정 1개를 지웠습니다'", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact", motion: "L0" });
    expect(await within(draftPanel()).findByText("이 프로필에 조정 2개가 있습니다", undefined, SLOW)).toBeInTheDocument();
    await expand();
    expect(await within(draftPanel()).findByText("이어지는 조정 2개 · 지워지는 조정 0개", undefined, SLOW)).toBeInTheDocument();
    await userEvent.click(pick("모션", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 1개 · 지워지는 조정 1개"));
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "모션 L0 — 지워짐 · 보드에서 모션을 바꿨습니다"]);
    // 캡션 개수는 보드 선택과 무관한 최신 조정 개수
    expect(caption()).toHaveTextContent("이 프로필에 조정 2개가 있습니다");
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
    await waitFor(() => expect(profileNotice()).toHaveTextContent("조정 1개를 지웠습니다"), SLOW);
    studio.cleanup();
  }, 30_000);

  it("P-AC-39 ②: 겹치지 않는 필드(Hero)만 바꾸면 '지워지는 조정 0개', 전부 '이어짐'", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact", motion: "L0", purpose: "booking" });
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    expect(await within(draftPanel()).findByText("이 프로필에 조정 3개가 있습니다", undefined, SLOW)).toBeInTheDocument();
    await expand();
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 3개 · 지워지는 조정 0개"), SLOW);
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "모션 L0 — 이어짐", "사이트 목적 예약 — 이어짐"]);
    studio.cleanup();
  }, 30_000);

  it("P-AC-39 ③: ref-b 팔레트 + 밝은 카드의 ink 보정 → 어두운 카드로 바꾸면 '지워짐 · 새 카드 톤에서 대비가 맞지 않습니다', 확정 뒤 프로필 화면에 충돌(3.3) 표시", async () => {
    const studio = await openStudio({ hero: "ref-a", palette: "ref-b", card: "ref-a" });
    await studio.confirmThenAdjust({ corrections: [INK_FIX] });
    await userEvent.click(pick("카드 스타일", "B 프리미엄 헤어살롱"));
    expect(await within(draftPanel()).findByText("이 프로필에 조정 1개가 있습니다", undefined, SLOW)).toBeInTheDocument();
    await expand();
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 0개 · 지워지는 조정 1개"), SLOW);
    expect(rows()).toEqual(["ink 보정 — 지워짐 · 새 카드 톤에서 대비가 맞지 않습니다"]);
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    expect(await screen.findByText(/한 값으로 둘 다 맞출 수 없습니다/, undefined, SLOW)).toBeInTheDocument();
    expect((await studio.versions()).at(-1)!.adjustments).toEqual({});
    studio.cleanup();
  }, 30_000);

  it("P-AC-39 ④⑤: 조정 0개면 캡션·'이어받기 확인'·목록 없음(확정 전·조정 없는 v1 확정 뒤 모두), 패널 청크 요청 0", async () => {
    const studio = await openStudio();
    expect(caption()).toBeNull();
    expect(counts()).toBeNull();
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: "비교 보드" })).toBeNull(), SLOW);
    await act(() => studio.router.navigate("/compare"));
    expect(await screen.findByText("v1 확정됨", undefined, SLOW)).toBeInTheDocument();
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v2)" })).not.toHaveAttribute("aria-disabled"));
    expect(caption()).toBeNull();
    expect(counts()).toBeNull();
    expect(within(draftPanel()).queryByText("이어받기 확인")).toBeNull();
    expect(within(draftPanel()).queryByText("조정 목록")).toBeNull();
    expect(panelLoads).not.toHaveBeenCalled();
    studio.cleanup();
  }, 30_000);

  it("P-S12: 목록을 펼친 뒤 다른 곳에서 조정 버전이 생기면 확정 0건 + 안내, 최신 조정으로 캡션·목록 개수를 다시 계산", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact" });
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    expect(await within(draftPanel()).findByText("이 프로필에 조정 1개가 있습니다", undefined, SLOW)).toBeInTheDocument();
    await expand();
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 1개 · 지워지는 조정 0개"), SLOW);
    await studio.profiles.saveAdjustments("profile-1", 2, { density: "compact", contrast: "enhanced" });
    await waitFor(() => expect(confirmButton()).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(confirmButton());
    expect(await screen.findByRole("alert", undefined, SLOW)).toHaveTextContent("다른 곳에서 v3이 만들어졌습니다");
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 0개"));
    expect(caption()).toHaveTextContent("이 프로필에 조정 2개가 있습니다");
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "대비 강화 — 이어짐"]);
    expect((await studio.versions()).map((v) => v.version)).toEqual([1, 2, 3]);
    studio.cleanup();
  }, 30_000);
});

describe("P-AC-39 ⑦ 펼침 로드 (r6) — 진입 직후 자동은 개수 캡션만, 판정·목록은 '이어받기 확인'을 펼칠 때", () => {
  it("펼치기 전 패널 청크 요청 0(보드 조작 뒤에도) · 캡션 N = 펼친 뒤 이어짐 + 지워짐 · '확인하는 중' → 목록 · 접었다 다시 펼쳐도 요청 1회", async () => {
    const studio = await openStudio({ hero: "ref-a", palette: "ref-b", card: "ref-a" });
    await studio.confirmThenAdjust({ density: "compact", motion: "L0", corrections: [INK_FIX] });
    expect(await within(draftPanel()).findByText("이 프로필에 조정 3개가 있습니다", undefined, SLOW)).toBeInTheDocument();
    await userEvent.click(pick("모션", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(screen.getByRole("button", { name: "새 버전으로 확정 (v3)" })).not.toHaveAttribute("aria-disabled"), SLOW);
    expect(panelLoads).not.toHaveBeenCalled();
    expect(counts()).toBeNull();
    expect(checkDetails().open).toBe(false);

    const gate = deferred<void>();
    const actual = await vi.importActual<PanelModule>("../features/compare/carryOverPanel");
    panelLoads.mockImplementationOnce(() => gate.promise.then(() => actual));
    await expand();
    expect(checkDetails().open).toBe(true);
    expect(await within(checkDetails()).findByText("이어받기를 확인하는 중입니다")).toBeInTheDocument();
    expect(panelLoads).toHaveBeenCalledTimes(1);
    await act(async () => gate.resolve());
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 1개"), SLOW);
    expect(within(checkDetails()).queryByText("이어받기를 확인하는 중입니다")).toBeNull();
    // 캡션 N(3) = 이어짐(2) + 지워짐(1)
    expect(caption()).toHaveTextContent("이 프로필에 조정 3개가 있습니다");
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "모션 L0 — 지워짐 · 보드에서 모션을 바꿨습니다", "ink 보정 — 이어짐"]);
    await userEvent.click(summary());
    await waitFor(() => expect(checkDetails().open).toBe(false));
    await expand();
    expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 1개");
    expect(panelLoads).toHaveBeenCalledTimes(1);
    studio.cleanup();
  }, 30_000);

  it("청크 요청 실패 → '불러오지 못했습니다' + '다시 시도' → 성공하면 목록, 포커스는 '이어받기 확인'에 남는다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact", motion: "L0" });
    await within(draftPanel()).findByText("이 프로필에 조정 2개가 있습니다", undefined, SLOW);
    panelLoads.mockRejectedValueOnce(new Error("청크 요청 실패"));
    await expand();
    expect(await within(checkDetails()).findByText("이어받기 목록을 불러오지 못했습니다", undefined, SLOW)).toBeInTheDocument();
    expect(counts()).toBeNull();
    await userEvent.click(within(checkDetails()).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 0개"), SLOW);
    expect(within(checkDetails()).queryByText("이어받기 목록을 불러오지 못했습니다")).toBeNull();
    expect(within(checkDetails()).queryByRole("button", { name: "다시 시도" })).toBeNull();
    expect(document.activeElement).toBe(summary());
    expect(checkDetails().open).toBe(true);
    expect(panelLoads).toHaveBeenCalledTimes(2);
    studio.cleanup();
  }, 30_000);

  it("실패 중에도 확정할 수 있다 — 저장은 저장소가 같은 함수로 계산, 프로필 알림 '조정 1개를 지웠습니다'", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact", motion: "L0" });
    await within(draftPanel()).findByText("이 프로필에 조정 2개가 있습니다", undefined, SLOW);
    panelLoads.mockImplementation(() => Promise.reject(new Error("청크 요청 실패")));
    await expand();
    await within(checkDetails()).findByText("이어받기 목록을 불러오지 못했습니다", undefined, SLOW);
    await userEvent.click(pick("모션", "B 프리미엄 헤어살롱"));
    await studio.confirmNow("새 버전으로 확정 (v3)");
    const v3 = (await studio.versions()).at(-1)!;
    expect(v3).toMatchObject({ version: 3, adjustments: { density: "compact" }, dropped: [{ key: "motion", reason: "board-changed" }] });
    await waitFor(() => expect(profileNotice()).toHaveTextContent("조정 1개를 지웠습니다"), SLOW);
    studio.cleanup();
  }, 30_000);

  it("펼치지 않고 확정한 저장값 = 펼치고 확정한 저장값 (둘 다 '조정 1개를 지웠습니다'), 펼치지 않은 쪽은 청크 요청 0", async () => {
    const run = async (open: boolean) => {
      const studio = await openStudio();
      await studio.confirmThenAdjust({ density: "compact", motion: "L0", purpose: "booking" });
      await within(draftPanel()).findByText("이 프로필에 조정 3개가 있습니다", undefined, SLOW);
      if (open) {
        await expand();
        await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 3개 · 지워지는 조정 0개"), SLOW);
      }
      await userEvent.click(pick("모션", "B 프리미엄 헤어살롱"));
      if (open) await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 1개"));
      await studio.confirmNow("새 버전으로 확정 (v3)");
      await waitFor(() => expect(profileNotice()).toHaveTextContent("조정 1개를 지웠습니다"), SLOW);
      const saved = (await studio.versions()).map(withoutTime);
      studio.cleanup();
      unmountAll();
      return saved;
    };
    const closed = await run(false);
    expect(panelLoads).not.toHaveBeenCalled();
    const opened = await run(true);
    expect(panelLoads).toHaveBeenCalledTimes(1);
    expect(opened).toEqual(closed);
    expect(closed.at(-1)).toMatchObject({ version: 3, adjustments: { density: "compact", purpose: "booking" } });
  }, 45_000);

  it("알린 뒤 history state의 droppedCount를 replace로 비운다 — 알림 문장은 남고, 같은 항목으로 돌아와도 다시 알리지 않는다(13.7)", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact", motion: "L0" });
    await userEvent.click(pick("모션", "B 프리미엄 헤어살롱"));
    await studio.confirmNow("새 버전으로 확정 (v3)");
    await waitFor(() => expect(profileNotice()).toHaveTextContent("조정 1개를 지웠습니다"), SLOW);
    await waitFor(() => expect(studio.router.state.location.state ?? {}).not.toHaveProperty("droppedCount"), SLOW);
    expect(studio.router.state.location.pathname).toBe("/profile/profile-1");
    expect(profileNotice()).toHaveTextContent("조정 1개를 지웠습니다");
    await act(() => studio.router.navigate("/compare"));
    await screen.findByRole("heading", { level: 1, name: "비교 보드" }, SLOW);
    await act(() => studio.router.navigate(-1));
    expect(await screen.findByRole("heading", { level: 1, name: "디자인 프로필" }, SLOW)).toBeInTheDocument();
    expect(studio.router.state.location.state ?? {}).not.toHaveProperty("droppedCount");
    expect(profileNotice()).not.toHaveTextContent(/지웠습니다/);
    studio.cleanup();
  }, 30_000);

  it("지운 조정이 0개(M = 0)면 확정 뒤 '지웠습니다' 알림 없음", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust({ density: "compact" });
    await userEvent.click(pick("Hero 구성", "C 동네 치과 클리닉"));
    await studio.confirmNow("새 버전으로 확정 (v3)");
    expect(await screen.findByRole("heading", { level: 1, name: "디자인 프로필" }, SLOW)).toBeInTheDocument();
    expect((await studio.versions()).at(-1)!.adjustments).toEqual({ density: "compact" });
    expect(profileNotice()).not.toHaveTextContent(/지웠습니다/);
    studio.cleanup();
  }, 30_000);
});

describe("FIX4 Hero 미선택 — 캡션은 확정 프로필 + 최신 조정 ≥ 1이면 항상, 판정·목록은 Hero를 고른 뒤 (P-S25 r6)", () => {
  const HERO_A = () => pick("Hero 구성", "A 모던 카페 브랜드");
  const heroHint = () => within(checkDetails()).queryByText("Hero를 고르면 이어받을 조정을 확인할 수 있습니다");
  const ADJUSTED = { density: "compact", motion: "L0" } as const;
  /** 조정 2개 캡션 + "이어받기 확인" 접힘 + 패널 청크 요청 0 (F4-1·F4-4 공통) */
  const expectCaptionOnly = async () => {
    expect(await within(draftPanel()).findByText("이 프로필에 조정 2개가 있습니다", undefined, SLOW)).toBeInTheDocument();
    expect(HERO_A()).toHaveAttribute("aria-pressed", "false");
    expect(summary()).toBeInTheDocument();
    expect(checkDetails().open).toBe(false);
    expect(counts()).toBeNull();
    expect(panelLoads).not.toHaveBeenCalled();
  };
  /** 확정 v1 → 프로필 화면에서 조정 저장 v2 + 저장소에서 Hero를 뺀 보드 → /compare 진입 */
  const enterWithoutHero = async (studio: Awaited<ReturnType<typeof openStudio>>) => {
    await userEvent.click(confirmButton());
    await waitFor(() => expect(studio.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: "비교 보드" })).toBeNull(), SLOW);
    await studio.profiles.saveAdjustments("profile-1", 1, ADJUSTED);
    const { board } = await studio.board.getBoard();
    await studio.board.savePicks(Object.fromEntries(Object.entries(board.picks).filter(([row]) => row !== "hero")), board.custom, board.revision);
    await act(() => studio.router.navigate("/compare"));
    await screen.findByRole("heading", { level: 1, name: "비교 보드" }, SLOW);
  };

  it("F4-1: Hero 해제 상태로 진입 → 캡션 '조정 2개' + '이어받기 확인', 패널 청크 요청 0", async () => {
    const studio = await openStudio();
    await enterWithoutHero(studio);
    await expectCaptionOnly();
    studio.cleanup();
  }, 30_000);

  it("F4-2: 같은 상태에서 펼치면 Hero 안내·요청 0 → Hero를 고르면 요청 1, ①과 같은 입력으로 '2개 · 0개' → 모션 B면 '1개 · 1개'", async () => {
    const studio = await openStudio();
    await enterWithoutHero(studio);
    await expectCaptionOnly();
    await expand();
    expect(checkDetails().open).toBe(true);
    expect(heroHint()).toBeInTheDocument();
    expect(counts()).toBeNull();
    expect(panelLoads).not.toHaveBeenCalled();
    await userEvent.click(HERO_A());
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 0개"), SLOW);
    expect(heroHint()).toBeNull();
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "모션 L0 — 이어짐"]);
    expect(panelLoads).toHaveBeenCalledTimes(1);
    await userEvent.click(pick("모션", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 1개 · 지워지는 조정 1개"));
    expect(rows()).toEqual(["밀도 촘촘 — 이어짐", "모션 L0 — 지워짐 · 보드에서 모션을 바꿨습니다"]);
    expect(caption()).toHaveTextContent("이 프로필에 조정 2개가 있습니다");
    expect(panelLoads).toHaveBeenCalledTimes(1);
    studio.cleanup();
  }, 30_000);

  it("F4-3: ready에서 펼쳐 목록을 받은 뒤 Hero 해제 → 캡션 N 유지, 펼친 영역은 안내, 재요청 0 → 다시 고르면 목록(재요청 0)", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust(ADJUSTED);
    await expand();
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 0개"), SLOW);
    expect(panelLoads).toHaveBeenCalledTimes(1);
    await userEvent.click(HERO_A());
    await waitFor(() => expect(heroHint()).toBeInTheDocument());
    expect(caption()).toHaveTextContent("이 프로필에 조정 2개가 있습니다");
    expect(checkDetails().open).toBe(true);
    expect(counts()).toBeNull();
    expect(within(checkDetails()).queryAllByRole("listitem")).toHaveLength(0);
    expect(panelLoads).toHaveBeenCalledTimes(1);
    await userEvent.click(HERO_A());
    await waitFor(() => expect(counts()).toHaveTextContent("이어지는 조정 2개 · 지워지는 조정 0개"));
    expect(heroHint()).toBeNull();
    expect(panelLoads).toHaveBeenCalledTimes(1);
    studio.cleanup();
  }, 30_000);

  it("F4-4: 재진입(보드 → 프로필 → 보드)에서도 Hero 해제 상태면 캡션 '조정 2개' + '이어받기 확인', 요청 0 · 펼치면 안내", async () => {
    const studio = await openStudio();
    await studio.confirmThenAdjust(ADJUSTED);
    await userEvent.click(HERO_A());
    await waitFor(async () => expect((await studio.board.getBoard()).board.picks.hero).toBeUndefined(), SLOW);
    await act(() => studio.router.navigate("/profile/profile-1"));
    await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: "비교 보드" })).toBeNull(), SLOW);
    await act(() => studio.router.navigate("/compare"));
    await screen.findByRole("heading", { level: 1, name: "비교 보드" }, SLOW);
    await expectCaptionOnly();
    await expand();
    expect(heroHint()).toBeInTheDocument();
    expect(panelLoads).not.toHaveBeenCalled();
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
