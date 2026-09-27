/**
 * DS-2A-05 2.5 · S-B9 — 보드 확정 대상 (J-S09 첫 확정 캡션 · J-S10 "확정할 곳" 라디오 · J-S11 새 프로젝트 확정 이동).
 * J-AC-04(캡션) · J-AC-05(라디오 · 기본값 · ?new=1 · 버튼 이름 · P-S25 캡션 숨김) · J-AC-06(화면 몫).
 */
import { act, screen, waitFor, within } from "@testing-library/react";
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

const THREE = ["ref-a", "ref-b", "ref-c"];
const SLOW = { timeout: 5_000 };
const pick = (row: string, column: string) => screen.getByRole("button", { name: `${row}: ${column}의 요소 선택` });
const draftPanel = () => screen.getByRole("region", { name: "프로필 초안" });
const targetGroup = () => within(draftPanel()).queryByRole("group", { name: "확정할 곳" });

afterEach(() => {
  vi.restoreAllMocks();
});

async function openBoard(path = "/compare") {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(THREE, { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  const view = renderApp(path, createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, profiles);
  await screen.findByRole("heading", { level: 1, name: "비교 보드" }, SLOW);
  /** 첫 확정 → 프로필 → 보드로 돌아와 선택을 바꾼다(재확정 가능 상태) */
  const confirmFirstThenChange = async (back = "/compare", beforeBack?: () => Promise<unknown>) => {
    await userEvent.click(await screen.findByRole("button", { name: "프로필 확정 (v1)" }, SLOW));
    await waitFor(() => expect(view.router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: "비교 보드" })).toBeNull(), SLOW);
    await beforeBack?.();
    await act(() => view.router.navigate(back));
    expect(await screen.findByText("v1 확정됨", undefined, SLOW)).toBeInTheDocument();
    await userEvent.click(pick("Hero 구성", "B 프리미엄 헤어살롱"));
    await waitFor(() => expect(screen.getByText("v1 이후 변경됨")).toBeInTheDocument());
  };
  return { ...view, board, profiles, store, confirmFirstThenChange };
}

describe("J-S09 첫 확정 — 새 프로젝트 캡션, 라디오 없음", () => {
  it("확정 버튼 위 캡션 \"새 프로젝트 '<기준 레퍼런스 제목> 프로젝트'를 만듭니다 · …\"", async () => {
    await openBoard();
    expect(
      await within(draftPanel()).findByText("새 프로젝트 '모던 카페 브랜드 프로젝트'를 만듭니다 · 이름은 프로젝트 목록에서 바꿀 수 있습니다", undefined, SLOW),
    ).toBeInTheDocument();
    expect(targetGroup()).toBeNull();
    expect(screen.getByRole("button", { name: "프로필 확정 (v1)" })).toBeInTheDocument();
  });

  it("첫 확정도 projectCreated 상태로 이동 → 프로필 알림 \"새 프로젝트 '…'을 만들었습니다\" (J-S11 확장 · SPEC r4.3)", async () => {
    const { router } = await openBoard();
    await userEvent.click(await screen.findByRole("button", { name: "프로필 확정 (v1)" }, SLOW));
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    expect(router.state.location.state).toMatchObject({ projectCreated: true });
    await waitFor(() => expect(screen.getByRole("status", { name: "프로필 알림" })).toHaveTextContent("새 프로젝트 '모던 카페 브랜드 프로젝트'를 만들었습니다"), SLOW);
  });
});

describe("프로필 머리 '프로젝트: <이름>' 링크 (12.1 3.1 · 5.2)", () => {
  it("h1 뒤 링크 → /projects", async () => {
    const { router } = await openBoard();
    await userEvent.click(await screen.findByRole("button", { name: "프로필 확정 (v1)" }, SLOW));
    const h1 = await screen.findByRole("heading", { level: 1, name: "디자인 프로필" }, SLOW);
    const link = await screen.findByRole("link", { name: "프로젝트: 모던 카페 브랜드 프로젝트" }, SLOW);
    expect(link).toHaveAttribute("href", "/projects");
    expect(h1.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe("/projects"));
  });
});

describe("J-S10 확정된 프로젝트가 있으면 '확정할 곳' 라디오", () => {
  it("기본 = 현재 프로젝트 새 버전, 버튼 '새 버전으로 확정 (v2)' → 같은 계열 v2", async () => {
    const { board, confirmFirstThenChange, router } = await openBoard();
    await confirmFirstThenChange();
    const group = targetGroup()!;
    expect(group.tagName).toBe("FIELDSET");
    expect(within(group).getByRole("radio", { name: "모던 카페 브랜드 프로젝트 새 버전" })).toBeChecked();
    expect(within(group).getByRole("radio", { name: "새 프로젝트" })).not.toBeChecked();
    const create = vi.spyOn(board, "createProfileVersion");
    const button = within(draftPanel()).getByRole("button", { name: "새 버전으로 확정 (v2)" });
    await waitFor(() => expect(button).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(button);
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-1"), SLOW);
    expect(create).toHaveBeenCalledWith("profile-1", expect.any(Number), 1, "current");
  });

  it("'새 프로젝트'를 고르면 버튼 '새 프로젝트로 확정' → 새 계열 v1로 이동 + projectCreated 상태 (J-S11)", async () => {
    const { board, confirmFirstThenChange, router } = await openBoard();
    await confirmFirstThenChange();
    await userEvent.click(within(targetGroup()!).getByRole("radio", { name: "새 프로젝트" }));
    const create = vi.spyOn(board, "createProfileVersion");
    const button = within(draftPanel()).getByRole("button", { name: "새 프로젝트로 확정" });
    await waitFor(() => expect(button).not.toHaveAttribute("aria-disabled"));
    await userEvent.click(button);
    await waitFor(() => expect(router.state.location.pathname).toBe("/profile/profile-2"), SLOW);
    expect(create).toHaveBeenCalledWith("profile-1", expect.any(Number), 0, "new");
    await waitFor(() => expect(screen.getByRole("status", { name: "프로필 알림" })).toHaveTextContent("새 프로젝트 '프리미엄 헤어살롱 프로젝트'를 만들었습니다"), SLOW);
    expect((await board.getBoard()).board.confirmed).toMatchObject({ profileId: "profile-2", projectName: "프리미엄 헤어살롱 프로젝트" }); // 기준 레퍼런스 = 바꾼 Hero(B)
  });

  it("?new=1로 오면 기본값 = 새 프로젝트", async () => {
    const { confirmFirstThenChange } = await openBoard();
    await confirmFirstThenChange("/compare?new=1");
    expect(within(targetGroup()!).getByRole("radio", { name: "새 프로젝트" })).toBeChecked();
    expect(within(draftPanel()).getByRole("button", { name: "새 프로젝트로 확정" })).toBeInTheDocument();
  });

  it("'새 프로젝트'면 P-S25 이어받기 캡션을 숨긴다", async () => {
    const { profiles, confirmFirstThenChange } = await openBoard();
    await confirmFirstThenChange("/compare", () => profiles.saveAdjustments("profile-1", 1, { density: "compact", motion: "L0" }));
    const caption = () => within(draftPanel()).queryByText(/^이 프로필에 조정/);
    expect(await within(draftPanel()).findByText(/^이 프로필에 조정/, undefined, SLOW)).toBeInTheDocument();
    await userEvent.click(within(targetGroup()!).getByRole("radio", { name: "새 프로젝트" }));
    expect(caption()).toBeNull();
    await userEvent.click(within(targetGroup()!).getByRole("radio", { name: "모던 카페 브랜드 프로젝트 새 버전" }));
    expect(caption()).not.toBeNull();
  });
});
