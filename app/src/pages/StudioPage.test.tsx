import { act, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Project, ProjectRepository, StudioEntryState } from "../data/projectRepository";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { renderApp } from "../test/renderApp";

/** 편집기 문서 분기 · 편집 알림 · 진입 포커스 (EDITOR-A2-SHELL S1 — QA D1~D3, E-AC-02·33) */
const PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};
const NOTICE = "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v1)";

/** 화면이 쓰는 조회 2개만 — 나머지 메서드는 이 테스트에서 부르지 않는다 */
function stubProjects(withDoc: boolean) {
  const repository = {
    getProject: async (id: string) => (id === PROJECT.projectId ? PROJECT : undefined),
    getDoc: async (id: string) => (withDoc && id === PROJECT.projectId ? sampleDoc() : undefined),
  } as unknown as ProjectRepository;
  return () => Promise.resolve(repository);
}

function open(withDoc: boolean, state?: StudioEntryState) {
  const { router } = renderApp("/catalog", undefined, undefined, undefined, undefined, stubProjects(withDoc));
  act(() => void router.navigate("/studio/project-1", state ? { state } : undefined));
  return router;
}

const h1 = () => screen.findByRole("heading", { level: 1, name: PROJECT.name });
const noticeRegion = () => screen.getByRole("status", { name: "편집 알림" });

describe("StudioPage 문서 분기 (D1)", () => {
  it("문서 있음 → E-S03 안내가 아니라 편집 틀(h1 · 섹션 목록)", async () => {
    open(true);
    await h1();
    expect(screen.queryByText(/아직 편집할 페이지가 없습니다/)).toBeNull();
    expect(screen.queryByRole("link", { name: "프로필에서 3안 고르기" })).toBeNull();
    expect(await screen.findByRole("button", { name: /^Hero/ })).toBeInTheDocument();
  });

  it("문서 없음 → E-S03 그대로(E-AC-02)", async () => {
    open(false);
    await h1();
    expect(screen.getByText("아직 편집할 페이지가 없습니다 — 프로필에서 3안을 만들고 하나를 고르세요")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "프로필에서 3안 고르기" })).toHaveAttribute("href", "/profile/profile-1");
    expect(screen.queryByRole("status", { name: "편집 알림" })).toBeNull();
  });
});

describe("편집 알림 (D2 · E-AC-33 · SPEC 8.2.1 (a) · 8.3.1)", () => {
  it("이동 state editNotice → '편집 알림' status 영역 1개에 1회, 다시 그려도 1회", async () => {
    const router = open(true, { editNotice: NOTICE, changes: [] });
    await h1();
    await waitFor(() => expect(noticeRegion()).toHaveTextContent(NOTICE));
    expect(screen.getAllByRole("status", { name: "편집 알림" })).toHaveLength(1);
    expect(screen.getAllByText(NOTICE)).toHaveLength(1);
    expect(noticeRegion()).toBeVisible();
    // 같은 화면을 다시 그린다(섹션 줄 선택) — 알림은 그대로 1개
    act(() => screen.getAllByRole("button", { name: /^About/ })[0]!.click());
    expect(screen.getAllByText(NOTICE)).toHaveLength(1);
    expect(router.state.location.pathname).toBe("/studio/project-1");
  });

  it("다시 열기(state 없음)에는 알리지 않는다 — 영역은 비어 있다", async () => {
    const router = open(true, { editNotice: NOTICE, changes: [] });
    await h1();
    await waitFor(() => expect(noticeRegion()).toHaveTextContent(NOTICE));
    act(() => void router.navigate("/catalog"));
    await waitFor(() => expect(screen.queryByRole("heading", { level: 1, name: PROJECT.name })).toBeNull());
    act(() => void router.navigate("/studio/project-1"));
    await h1();
    expect(noticeRegion().textContent).toBe("");
    expect(screen.queryByText(NOTICE)).toBeNull();
  });

  it("알림 state를 비울 때 navigate(replace)를 쓰지 않는다 — 위치 key·state 그대로", async () => {
    const router = open(true, { editNotice: NOTICE, changes: [] });
    const before = router.state.location.key;
    await h1();
    await waitFor(() => expect(noticeRegion()).toHaveTextContent(NOTICE));
    expect(router.state.location.key).toBe(before);
  });
});

describe("편집 알림 접기 (SPEC r4.7 A3-Q7 — 8.2.1 (a) 한 줄 요약 + 펼치기)", () => {
  const CHANGED = "구조안의 섹션 3개를 편집기 변형으로 바꿔 열었습니다 — About 2단 소개 → 이야기 + 이미지 · Services 2열 → 카드 2열";
  const CHANGES = [
    { type: "about", from: "split", to: "story" },
    { type: "services", from: "grid-2", to: "cards-2" },
  ] as const;

  it("바뀐 쌍이 있으면 한 줄 요약 '편집 문서를 만들며 바뀐 점 N개'(N = 원문의 바뀐 섹션 수 — 같은 쌍 여러 섹션 포함, Codex r1 P2) + 닫힌 details 안에 원문 · 영역 1개 · 1회", async () => {
    const router = open(true, { editNotice: CHANGED, changes: CHANGES });
    const before = router.state.location.key;
    await h1();
    await waitFor(() => expect(noticeRegion()).toHaveTextContent("편집 문서를 만들며 바뀐 점 3개"));
    const details = noticeRegion().querySelector("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(details.querySelector("summary")).toHaveTextContent("편집 문서를 만들며 바뀐 점 3개");
    expect(details).toHaveTextContent(CHANGED);
    expect(screen.getAllByRole("status", { name: "편집 알림" })).toHaveLength(1);
    expect(screen.getAllByText(CHANGED)).toHaveLength(1);
    expect(router.state.location.key).toBe(before);
  });

  it("원문은 접힌 details 안에 DOM으로 남는다(펼치면 보임 · 문장 불변)", async () => {
    open(true, { editNotice: CHANGED, changes: CHANGES });
    await h1();
    await waitFor(() => expect(noticeRegion().querySelector("details")).not.toBeNull());
    expect(screen.getByText(CHANGED)).toBeInTheDocument();
    // DOC_EXISTS 같은 바뀐 쌍 없는 알림은 접지 않는다 — 위 D2 테스트(changes: [])가 원문 그대로를 본다
  });
});

describe("진입 포커스 (D3)", () => {
  it("편집 시작으로 도착 → 포커스 = h1(tabIndex -1), body 아님", async () => {
    open(true, { editNotice: NOTICE, changes: [] });
    const heading = await h1();
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(heading).toHaveAttribute("tabindex", "-1");
  });

  it("바뀐 쌍 0개(알림 없음)로 도착해도 포커스 = h1", async () => {
    open(true, { changes: [] });
    const heading = await h1();
    await waitFor(() => expect(document.activeElement).toBe(heading));
  });
});
