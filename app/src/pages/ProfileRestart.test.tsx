/**
 * RESTART SPEC r1 — 프로필 화면 "새로 시작"(EQ-2 A restart) 분기·대화상자·결과 문장 (RS-AC-02~07·09~12).
 * 분기는 누른 시점의 DOC_EXISTS 동봉 doc으로: 같은 안·같은 버전 = 이동(F2) · 같은 안·다른 버전 = 이동 + 테마 바꾸기 안내(F3) · 다른 안 = 대화상자(F4).
 * 조회 간격(1초)은 가짜 타이머로 진행한다(ProfileCandidates.test.tsx와 같은 모양).
 */
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryProjectRepository, type MemoryProjectOptions } from "../data/memoryProjectRepository";
import { READ_ONLY_TAB, STALE_TAB } from "../data/persistence/infra";
import { ProjectRepositoryError, type ProjectRepository, type StudioEntryState } from "../data/projectRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { hashDoc } from "../engine/ops/hash";
import { contrastText } from "../features/profile/restartText";
import { POLL_MS } from "../features/profile/useGeneration";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";
import { insertOtherVersion } from "../test/studioFixtures";

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const tick = () => act(() => vi.advanceTimersByTimeAsync(POLL_MS));
const edit = (doc: PageDoc, title: string): PageDoc => {
  const next = { ...doc, meta: { ...doc.meta, title } };
  return { ...next, hash: hashDoc(next) };
};

async function open(path = "/profile/profile-1", before?: (s: ReturnType<typeof createStudioStore>) => void, projectOptions: Omit<MemoryProjectOptions, "store"> = {}) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  const gen = createMemoryGenerationRepository({ store });
  await board.confirmProfile(1, 0);
  before?.(store);
  const repo = createMemoryProjectRepository({ ...projectOptions, store }) as ProjectRepository<PageDoc>;
  const view = renderApp(path, createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, profiles, gen, () => Promise.resolve(repo));
  await screen.findByRole("heading", { level: 1, name: "디자인 프로필" });
  const region = await screen.findByRole("region", { name: "생성된 3안" });
  return { ...view, repo, region, u: user() };
}

async function generate(u: ReturnType<typeof user>, region: HTMLElement) {
  await u.click(await within(region).findByRole("button", { name: /^3안 만들기 \(v\d+\)$/ }));
  for (let i = 0; i < 3; i += 1) await tick();
  await within(region).findByRole("table", { name: "3안 비교" });
}
async function pick(u: ReturnType<typeof user>, region: HTMLElement, id: string) {
  await u.click(within(region).getByRole("button", { name: `${id}안 선택` }));
  await within(region).findByRole("button", { name: `${id}안 선택`, pressed: true });
  return within(region).getByRole("button", { name: `${id}안으로 편집 시작` });
}

/** F4 — v1 3안 · 문서 A안(v1) · B안을 골라 편집 시작 → 대화상자 */
async function openDialog(projectOptions: Omit<MemoryProjectOptions, "store"> = {}) {
  const opened = await open("/profile/profile-1", undefined, projectOptions);
  await generate(opened.u, opened.region);
  await opened.repo.startDoc("project-1", 1, "A", "create");
  const button = await pick(opened.u, opened.region, "B");
  await opened.u.click(button);
  const dialog = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
  return { ...opened, button, dialog };
}
const primary = (dialog: HTMLElement) => within(dialog).getByRole("button", { name: /^B안으로 새로 시작$|^새로 시작하는 중…$/ });

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("F2·F3 분기 (RS-AC-01·02)", () => {
  it("F3 같은 안·다른 버전 → 이동 + 테마 바꾸기 안내(두 버전 숫자) · startDoc = create 1회뿐", async () => {
    const { u, region, router, repo } = await open("/profile/profile-1?v=1", (store) => insertOtherVersion(store));
    await generate(u, region);
    await repo.startDoc("project-1", 1, "B", "create");
    act(() => void router.navigate("/profile/profile-1"));
    const v2 = await screen.findByRole("region", { name: "생성된 3안" });
    await generate(u, v2);
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(await pick(u, v2, "B"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(router.state.location.state).toEqual({
      editNotice: "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v1) · v2를 쓰려면 '테마 바꾸기'를 누르세요 — 내용은 그대로입니다",
    });
    expect(spy.mock.calls.map((c) => c[3])).toEqual(["create"]);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("R-C1 상시 캡션 — 다른 안이면 새로 시작할지 묻는다", async () => {
    const { region } = await open();
    expect(
      within(region).getByText(/편집 시작을 누르면 고른 안으로 편집기를 엽니다\. 이미 편집 중인 문서가 있고 다른 안을 골랐으면 새로 시작할지 묻습니다\./),
    ).toBeInTheDocument();
  });
});

describe("F4 새로 시작 대화상자 (RS-AC-03·04·09·11)", () => {
  it("다른 안 → 이동 0 · 대화상자 · 포커스 = 제목 · R-D2 = 동봉 doc(안·버전·저장 시각) · R-D3·R-D3b·R-D4 · 같은 버전이면 대비 줄 없음", async () => {
    const { dialog, router, repo } = await openDialog();
    expect(router.state.location.pathname).toBe("/profile/profile-1");
    const title = within(dialog).getByRole("heading", { level: 2, name: "B안으로 새로 시작할까요?" });
    await waitFor(() => expect(title).toHaveFocus());
    const doc = (await repo.getDoc("project-1"))!;
    const saved = new Date(doc.updatedAt).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
    expect(dialog).toHaveTextContent(`지금 편집 중인 문서: A안 · 프로필 v1 · 마지막 저장 ${saved} — 이 저장 기준으로 스냅샷에 남습니다`);
    expect(dialog).toHaveTextContent("지금 문서는 스냅샷 '새로 시작 전'으로 남고, B안 · 프로필 v1로 새 문서를 만듭니다. 지금 문서의 문구·이미지는 새 문서로 옮겨지지 않습니다.");
    expect(dialog).toHaveTextContent("되돌리려면 편집기의 '스냅샷'에서 '새로 시작 전'을 복원하세요.");
    expect(dialog).toHaveTextContent("자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 편집기에서 '지금 상태 저장'으로 만드세요");
    expect(dialog).not.toHaveTextContent("대비 검사");
    expect(within(dialog).getAllByRole("button").map((b) => b.textContent)).toEqual(["취소", "편집기 열기 (A안 · v1 편집 중)", "B안으로 새로 시작"]);
  });

  it("'B안으로 새로 시작' → startDoc(restart, doc.revision) 1회 · /studio 이동 + R-N1 · 스냅샷 +1(restart)", async () => {
    const { dialog, router, repo, u } = await openDialog();
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(primary(dialog));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(spy.mock.calls).toEqual([["project-1", 1, "B", "restart", 1]]);
    const state = router.state.location.state as StudioEntryState;
    expect(state.editNotice).toMatch(/^B안 · 프로필 v1로 새로 시작했습니다 · 이전 문서\(A안 · v1\)는 스냅샷 '새로 시작 전'에 있습니다( · 구조안의 섹션 \d+개.*)?$/);
    expect(Array.isArray(state.changes)).toBe(true);
    expect((await repo.listSnapshots("project-1")).map((s) => [s.reason, s.name, s.candidateId])).toEqual([["restart", "새로 시작 전", "A"]]);
    expect(await repo.getDoc("project-1")).toMatchObject({ candidateId: "B", revision: 2 });
  });

  it("취소·Esc → 쓰기 0 · 포커스 = 'B안으로 편집 시작' / '편집기 열기' → F2와 같은 이동·알림", async () => {
    const { dialog, button, repo, u, router } = await openDialog();
    await u.click(within(dialog).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(button).toHaveFocus();
    await u.click(button);
    const again = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
    fireEvent(again, new Event("cancel", { cancelable: true }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(button).toHaveFocus();
    expect(await repo.listSnapshots("project-1")).toEqual([]);
    await u.click(button);
    const third = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
    await u.click(within(third).getByRole("button", { name: "편집기 열기 (A안 · v1 편집 중)" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(router.state.location.state).toEqual({ editNotice: "이미 편집 중인 문서를 엽니다 (A안 · 프로필 v1)" });
    expect(await repo.getDoc("project-1")).toMatchObject({ candidateId: "A", revision: 1 });
    expect(dialog).toBeDefined();
  });

  it("RS-AC-10 되돌리기: 새로 시작 뒤 '새로 시작 전' 복원 → 안·버전 = 옛 값 · '복원 전' 자동 +1", async () => {
    const { dialog, router, repo, u } = await openDialog();
    await u.click(primary(dialog));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    const [restart] = await repo.listSnapshots("project-1");
    const current = (await repo.getDoc("project-1"))!;
    const restored = await repo.restoreSnapshot("project-1", restart!.snapshotId, current.revision);
    expect(restored).toMatchObject({ candidateId: "A", profileVersion: 1 });
    expect((await repo.listSnapshots("project-1")).map((s) => s.reason)).toEqual(expect.arrayContaining(["restart", "restore"]));
  });
});

describe("진행 중·결과별 (RS-AC-05·06·07·08 화면)", () => {
  it("진행 중 두 번 누름·Esc → 요청 1회 · 대화상자 유지 · aria-busy + '새로 시작하는 중…'", async () => {
    const gate: { release?: () => void } = {};
    const { dialog, repo, u, router } = await openDialog({
      delay: (call) => (call.method === "startDoc" && call.seq === 3 && call.phase === "response" ? new Promise<void>((r) => (gate.release = r)) : undefined),
    });
    const spy = vi.spyOn(repo, "startDoc");
    const button = primary(dialog);
    await u.click(button);
    await waitFor(() => expect(gate.release).toBeDefined());
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("새로 시작하는 중…");
    expect(within(dialog).getByRole("button", { name: "취소" })).toHaveAttribute("aria-disabled", "true");
    await u.click(button);
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(spy).toHaveBeenCalledTimes(1);
    await act(async () => gate.release!());
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
  });

  it("STALE_DOC → 이동 0 · R-E1(r = 최신) · 대화상자 내용이 최신 doc으로 · 변화 0 → 다시 누르면 최신 revision으로 성공", async () => {
    const { dialog, repo, u, router } = await openDialog();
    const doc = (await repo.getDoc("project-1"))!;
    const saved = await repo.saveDoc("project-1", doc.revision, edit(doc, "다른 곳 편집"));
    await u.click(primary(dialog));
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(`다른 곳에서 편집 문서가 바뀌었습니다(r${saved.revision}). 새로 시작하지 않았습니다 — 편집기에서 확인한 뒤 다시 고르세요`);
    expect(within(alert).queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/profile/profile-1");
    expect(await repo.listSnapshots("project-1")).toEqual([]);
    expect(await repo.getDoc("project-1")).toEqual(saved);
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(primary(dialog));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(spy.mock.calls).toEqual([["project-1", 1, "B", "restart", saved.revision]]);
  });

  it("UNKNOWN_VARIANT → 저장소 alert 문장 · 다시 시도 없음 · 쓰기 0", async () => {
    const { dialog, repo, u, router } = await openDialog();
    const alertText = "이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다(서비스 · grid-9) — 다른 안을 고르세요";
    vi.spyOn(repo, "startDoc").mockRejectedValue(new ProjectRepositoryError("UNKNOWN_VARIANT", "services/grid-9", { alert: alertText }));
    await u.click(primary(dialog));
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent(alertText);
    expect(within(dialog).queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/profile/profile-1");
    expect(await repo.getDoc("project-1")).toMatchObject({ candidateId: "A", revision: 1 });
  });

  it("쓰기 전 실패(요청 단계) → R-E3 + 다시 시도(같은 인자) → 성공 이동", async () => {
    let failed = false;
    const { dialog, u, router, repo } = await openDialog({
      fail: (call) => {
        if (call.method !== "startDoc" || call.seq !== 3 || call.phase !== "request" || failed) return undefined;
        failed = true;
        return new Error("network");
      },
    });
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(primary(dialog));
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("새로 시작하지 못했습니다");
    await u.click(within(dialog).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(spy.mock.calls).toEqual([
      ["project-1", 1, "B", "restart", 1],
      ["project-1", 1, "B", "restart", 1],
    ]);
  });

  it("커밋 뒤 미확인(응답 실패) → R-E4 · '편집기 열기' 이름 = 새 문서·저장 확인 안 됨 → 다시 시도 = 멱등 재생 → 이동", async () => {
    let lost = false;
    const { dialog, u, router, repo } = await openDialog({
      fail: (call) => {
        if (call.method !== "startDoc" || call.seq !== 3 || call.phase !== "response" || lost) return undefined;
        lost = true;
        return new Error("response lost");
      },
    });
    await u.click(primary(dialog));
    const alert = await within(dialog).findByRole("alert");
    expect(alert).toHaveTextContent("새로 시작했지만 브라우저에 저장됐는지 확인하지 못했습니다 — 다시 시도하면 같은 요청으로 저장을 이어 갑니다");
    expect(within(dialog).getByRole("button", { name: "편집기 열기 (B안 · v1 — 저장 확인 안 됨)" })).toBeInTheDocument();
    expect(await repo.getDoc("project-1")).toMatchObject({ candidateId: "B", revision: 2 });
    await u.click(within(dialog).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect((router.state.location.state as StudioEntryState).editNotice).toMatch(/^B안 · 프로필 v1로 새로 시작했습니다 · 이전 문서\(A안 · v1\)/);
    expect((await repo.listSnapshots("project-1")).length).toBe(1);
  });

  it("다른 탭 잠금(readonly) → R-E2 + 다시 시도 / 다른 탭이 저장(stale) → R-E2b · 다시 시도 없음", async () => {
    const { dialog, repo, u } = await openDialog();
    const spy = vi.spyOn(repo, "startDoc").mockRejectedValueOnce(new ProjectRepositoryError("INFRA", `저장 — ${READ_ONLY_TAB}`));
    await u.click(primary(dialog));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("다른 탭에서 편집 중이라 새로 시작하지 않았습니다 — 그 탭을 닫은 뒤 다시 시도하세요");
    spy.mockRejectedValueOnce(new ProjectRepositoryError("INFRA", `저장 — ${STALE_TAB}`));
    await u.click(within(dialog).getByRole("button", { name: "다시 시도" }));
    await waitFor(() =>
      expect(within(dialog).getByRole("alert")).toHaveTextContent("다른 탭에서 바뀐 내용이 있어 새로 시작하지 않았습니다 — 새로고침한 뒤 다시 고르세요"),
    );
    expect(within(dialog).queryByRole("button", { name: "다시 시도" })).not.toBeInTheDocument();
    expect(await repo.listSnapshots("project-1")).toEqual([]);
  });
});

describe("R-D5 대비 한 줄 (RS-AC-12 · MQ-S3 ★A)", () => {
  it("결과가 다를 때만 · 글자로 통과/미달 · 둘 다 미달 문형", () => {
    expect(contrastText(3, 2, 4, 2)).toBeUndefined();
    expect(contrastText(3, 0, 4, 0)).toBeUndefined();
    expect(contrastText(3, 2, 4, 0)).toBe("대비 검사: 지금 v3 미달 2 · 새 v4 모두 통과");
    expect(contrastText(3, 2, 4, 1)).toBe("대비 검사: 새 v4도 미달 1 — 새로 시작해도 내보내기 전에 보정이 필요합니다");
    expect(contrastText(3, 0, 4, 1)).toBe("대비 검사: 지금 v3 모두 통과 · 새 v4 미달 1 — 새로 시작해도 내보내기 전에 보정이 필요합니다");
  });

  it("문서 버전과 보는 버전의 대비 결과가 다르면 대화상자에 한 줄(enhanced 대비 버전 → 미달 증가)", async () => {
    const { u, region, router, repo } = await open("/profile/profile-1?v=1", (store) =>
      store.transact((tx) => {
        const latest = tx.versions("profile-1").at(-1)!;
        tx.insert({ ...latest, version: 2, origin: "adjust", adjustments: { ...latest.adjustments, contrast: "enhanced" }, createdAt: "2026-09-26T00:00:00.000Z" });
      }),
    );
    await generate(u, region);
    await repo.startDoc("project-1", 1, "A", "create");
    act(() => void router.navigate("/profile/profile-1"));
    const v2 = await screen.findByRole("region", { name: "생성된 3안" });
    await generate(u, v2);
    await u.click(await pick(u, v2, "B"));
    const dialog = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
    await waitFor(() => expect(dialog).toHaveTextContent(/대비 검사: /));
    expect(dialog.textContent).toMatch(/대비 검사: (지금 v1 (미달 \d+|모두 통과) · 새 v2 (모두 통과|미달 \d+)|새 v2도 미달 \d+)/);
  });
});
