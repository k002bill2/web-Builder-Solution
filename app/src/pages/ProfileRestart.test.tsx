/**
 * RESTART SPEC r2 — 프로필 화면 "새로 시작"(EQ-2 A restart) 분기·대화상자·결과 문장 (RS-AC-02~12 · 17 · 18 — r2: 3.3.1 커밋 확인 · 미확인 기억 · STALE 재판정 · create 재생 재판정).
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
import { CLEARED_TAB, READ_ONLY_TAB, STALE_TAB } from "../data/persistence/infra";
import { ProjectRepositoryError, type ProjectRepository, type StudioEntryState } from "../data/projectRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { hashDoc } from "../engine/ops/hash";
import { contrastIssues } from "../engine/gate/contrastRow";
import { contrastFails } from "../features/profile/restartFlow";
import { TAB_REASON, contrastText } from "../features/profile/restartText";
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
  it("다른 안 → 이동 0 · 대화상자 · 포커스 = 제목 · R-D2 = 동봉 doc(안·버전·변경 시각) · R-D3·R-D3b·R-D4 · 같은 버전이면 대비 줄 없음", async () => {
    const { dialog, router, repo } = await openDialog();
    expect(router.state.location.pathname).toBe("/profile/profile-1");
    const title = within(dialog).getByRole("heading", { level: 2, name: "B안으로 새로 시작할까요?" });
    await waitFor(() => expect(title).toHaveFocus());
    const doc = (await repo.getDoc("project-1"))!;
    const saved = new Date(doc.updatedAt).toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false });
    // r2 R-D2(Codex P2-5) — "저장"이 아니라 이 탭 저장소 문서의 "마지막 변경"
    expect(dialog).toHaveTextContent(`지금 편집 중인 문서: A안 · 프로필 v1 · 마지막 변경 ${saved} — 이 탭에 있는 이 상태 그대로 스냅샷에 남습니다`);
    expect(dialog).toHaveTextContent("지금 문서는 스냅샷 '새로 시작 전'으로 남고, B안 · 프로필 v1로 새 문서를 만듭니다. 지금 문서의 문구·이미지는 새 문서로 옮겨지지 않습니다.");
    expect(dialog).toHaveTextContent("되돌리려면 편집기의 '스냅샷'에서 '새로 시작 전'을 복원하세요.");
    expect(dialog).toHaveTextContent("자동 스냅샷은 최근 20개만 보관합니다 — 오래 남기려면 편집기에서 '지금 상태 저장'으로 만드세요");
    expect(dialog).not.toHaveTextContent("대비 검사");
    expect(within(dialog).getAllByRole("button").map((b) => b.textContent)).toEqual(["취소", "편집기 열기 (A안 · v1 편집 중)", "B안으로 새로 시작"]);
  });

  it("'B안으로 새로 시작' → startDoc(restart, doc.revision) 1회 · /studio 이동 + R-N1 · state = editNotice만 · 신규 스냅샷 = restart 1개(id 집합 차이)", async () => {
    const { dialog, router, repo, u } = await openDialog();
    const before = (await repo.getDoc("project-1"))!;
    const ids = new Set((await repo.listSnapshots("project-1")).map((x) => x.snapshotId));
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(primary(dialog));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(spy.mock.calls).toEqual([["project-1", 1, "B", "restart", 1]]);
    const state = router.state.location.state as StudioEntryState;
    expect(state.editNotice).toMatch(/^B안 · 프로필 v1로 새로 시작했습니다 · 이전 문서\(A안 · v1\)는 스냅샷 '새로 시작 전'에 있습니다( · 구조안의 섹션 \d+개.*)?$/);
    // r2 RS-D9 — changes 키 없음(편집기가 R-N1을 접지 않게)
    expect(Object.keys(state)).toEqual(["editNotice"]);
    const fresh = (await repo.listSnapshots("project-1")).filter((x) => !ids.has(x.snapshotId));
    expect(fresh.map((x) => [x.reason, x.name, x.doc.revision, x.doc.hash])).toEqual([["restart", "새로 시작 전", before.revision, before.hash]]);
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

  it("커밋 뒤 미확인(응답 실패) → R-E4(두 문장) · 버튼 = [취소][다시 시도] · 포커스 = 제목 → 다시 시도 = 멱등 재생 → 이동 + R-N1 · 신규 스냅샷 1개뿐", async () => {
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
    expect(alert).toHaveTextContent(
      "새로 시작했지만 브라우저에 저장됐는지 확인하지 못했습니다 — 다시 시도하면 같은 요청으로 저장을 이어 갑니다. 지금 닫으면 새로고침 때 이전 문서(A안 · v1)로 돌아갈 수 있습니다",
    );
    // r2 Codex P2-2 — 편집기 열기·새로 시작 숨김
    expect(within(dialog).getAllByRole("button").map((b) => b.textContent)).toEqual(["취소", "다시 시도"]);
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveFocus();
    expect(await repo.getDoc("project-1")).toMatchObject({ candidateId: "B", revision: 2 });
    await u.click(within(dialog).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect((router.state.location.state as StudioEntryState).editNotice).toMatch(/^B안 · 프로필 v1로 새로 시작했습니다 · 이전 문서\(A안 · v1\)/);
    expect((await repo.listSnapshots("project-1")).filter((x) => x.reason === "restart")).toHaveLength(1);
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

/** 주입 단계별(RS-AC-07b) — seq 3 = restart(셋업 create 1 · UI create 2) */
const failOnce = (match: (call: { method: string; seq: number; phase: string }) => boolean, error: () => Error) => {
  let done = false;
  return (call: { method: string; seq: number; phase: string }) => {
    if (done || !match(call)) return undefined;
    done = true;
    return error();
  };
};
const restartAt = (phase: string) => (call: { method: string; seq: number; phase: string }) => call.method === "startDoc" && call.seq === 3 && call.phase === phase;
const buttonsOf = (dialog: HTMLElement) => within(dialog).getAllByRole("button").map((b) => b.textContent);
const R_E4 = /^새로 시작했지만 브라우저에 저장됐는지 확인하지 못했습니다/;

describe("3.3.1 실패 판정 순서 — 커밋 확인 먼저 (RS-AC-07·07b·07c · MQ-S6 ★A)", () => {
  it("commit 단계 실패(커밋 함수 안) → 변화 0 · R-E3 + 다시 시도", async () => {
    const { dialog, u, repo } = await openDialog({ fail: failOnce(restartAt("commit"), () => new Error("commit")) });
    await u.click(primary(dialog));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/^새로 시작하지 못했습니다다시 시도$/);
    expect(await repo.getDoc("project-1")).toMatchObject({ candidateId: "A", revision: 1 });
    expect(await repo.listSnapshots("project-1")).toEqual([]);
  });

  it.each([
    ["UNKNOWN_VARIANT", () => new ProjectRepositoryError("UNKNOWN_VARIANT", "services/grid-9", { alert: "다른 안을 고르세요" })],
    ["STALE_DOC", () => new ProjectRepositoryError("STALE_DOC", "stale")],
    ["INFRA READ_ONLY_TAB(07c)", () => new ProjectRepositoryError("INFRA", `저장 — ${READ_ONLY_TAB}`)],
  ])("response 단계(커밋 뒤) %s 모양 오류 → 커밋 확인 양성 → R-E4 (코드·사유 문장 아님)", async (_name, error) => {
    const { dialog, u, repo } = await openDialog({ fail: failOnce(restartAt("response"), error) });
    await u.click(primary(dialog));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(R_E4);
    expect(buttonsOf(dialog)).toEqual(["취소", "다시 시도"]);
    expect(await repo.getDoc("project-1")).toMatchObject({ candidateId: "B", revision: 2 });
  });

  it("요청 실패 + 커밋 확인 getDoc도 실패 → R-E5 · [취소][다시 시도] → 다시 시도 = 성공(신규 restart 스냅샷 총 1개)", async () => {
    let armed = false;
    const { dialog, u, repo, router } = await openDialog({
      fail: (call) => {
        if (restartAt("request")(call) && !armed) return ((armed = true), new Error("network"));
        if (call.method === "getDoc" && armed) return ((armed = false), new Error("read"));
        return undefined;
      },
    });
    await u.click(primary(dialog));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("새로 시작됐는지 확인하지 못했습니다 — 다시 시도해도 같은 요청이라 두 번 바뀌지 않습니다");
    expect(buttonsOf(dialog)).toEqual(["취소", "다시 시도"]);
    await u.click(within(dialog).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect((await repo.listSnapshots("project-1")).filter((x) => x.reason === "restart")).toHaveLength(1);
  });

  it("커밋 확인 음성 INFRA 그 밖 사유 → R-E3 + ' · ' + 첫 ' — ' 뒤 사유 · 사유 상수 = infra.ts 값(RS-R8)", async () => {
    expect(TAB_REASON).toEqual({ readonly: READ_ONLY_TAB, stale: STALE_TAB });
    const { dialog, repo, u } = await openDialog();
    const spy = vi.spyOn(repo, "startDoc").mockRejectedValueOnce(new ProjectRepositoryError("INFRA", "저장 — 브라우저 저장 공간이 부족합니다"));
    await u.click(primary(dialog));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/^새로 시작하지 못했습니다 · 브라우저 저장 공간이 부족합니다다시 시도$/);
    spy.mockRejectedValueOnce(new ProjectRepositoryError("INFRA", `저장 — ${CLEARED_TAB}`));
    await u.click(within(dialog).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(within(dialog).getByRole("alert")).toHaveTextContent(`새로 시작하지 못했습니다 · ${CLEARED_TAB}`));
  });
});

describe("STALE_DOC 재판정 (RS-AC-06b · R-E1b)", () => {
  it("최신이 고른 안과 같음 → 주 버튼 없음 · R-E1b · [취소][편집기 열기 (B안 · v1 편집 중)] · 포커스 = 제목 → F2 이동 · restart 추가 0 · 변화 0", async () => {
    const { dialog, repo, u, router } = await openDialog();
    const doc = (await repo.getDoc("project-1"))!;
    const saved = await repo.saveDoc("project-1", doc.revision, edit(doc, "다른 곳 편집"));
    await repo.startDoc("project-1", 1, "B", "restart", saved.revision);
    const latest = (await repo.getDoc("project-1"))!;
    const snapshots = await repo.listSnapshots("project-1");
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(primary(dialog));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      `다른 곳에서 편집 문서가 이미 B안 · 프로필 v1(r${latest.revision})로 바뀌었습니다. 새로 시작하지 않았습니다 — 편집기에서 여세요`,
    );
    expect(buttonsOf(dialog)).toEqual(["취소", "편집기 열기 (B안 · v1 편집 중)"]);
    expect(within(dialog).getByRole("heading", { level: 2 })).toHaveFocus();
    expect(await repo.listSnapshots("project-1")).toEqual(snapshots);
    await u.click(within(dialog).getByRole("button", { name: "편집기 열기 (B안 · v1 편집 중)" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(router.state.location.state).toEqual({ editNotice: "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v1)" });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(await repo.getDoc("project-1")).toEqual(latest);
  });
});

describe("미확인 기억 (RS-AC-08d)", () => {
  it("R-E4 → 취소 → 같은 안 다시 편집 시작 = create 0 · 이동 0 · R-E4 대화상자 / 다른 안(C)도 같은 대화상자 → 다시 시도 → 이동 + R-N1", async () => {
    const { dialog, u, repo, region, button, router } = await openDialog({ fail: failOnce(restartAt("response"), () => new Error("lost")) });
    await u.click(primary(dialog));
    await within(dialog).findByRole("alert");
    await u.click(within(dialog).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(button).toHaveFocus();
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(button);
    const again = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
    expect(within(again).getByRole("alert")).toHaveTextContent(R_E4);
    expect(buttonsOf(again)).toEqual(["취소", "다시 시도"]);
    expect(spy).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/profile/profile-1");
    await u.click(within(again).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await u.click(await pick(u, region, "C"));
    const third = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
    expect(within(third).getByRole("alert")).toHaveTextContent(R_E4);
    expect(spy).not.toHaveBeenCalled();
    await u.click(within(third).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(spy.mock.calls).toEqual([["project-1", 1, "B", "restart", 1]]);
    expect((router.state.location.state as StudioEntryState).editNotice).toMatch(/^B안 · 프로필 v1로 새로 시작했습니다/);
  });

  it("R-E5 → 취소 → 다시 편집 시작 → 다시 시도에서 커밋 확인 음성 → 기억 삭제 + F4 흐름(R-E3 · 다음 편집 시작은 create)", async () => {
    let step = 0;
    const { dialog, u, repo, button } = await openDialog({
      fail: (call) => {
        if (call.method === "startDoc" && call.seq >= 3 && call.phase === "request" && step < 2) return ((step += 1), new Error("network"));
        if (call.method === "getDoc" && step === 1) return ((step = 1.5), new Error("read"));
        return undefined;
      },
    });
    await u.click(primary(dialog));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent(/^새로 시작됐는지 확인하지 못했습니다/);
    await u.click(within(dialog).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await u.click(button);
    const again = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
    expect(within(again).getByRole("alert")).toHaveTextContent(/^새로 시작됐는지 확인하지 못했습니다/);
    await u.click(within(again).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(within(again).getByRole("alert")).toHaveTextContent(/^새로 시작하지 못했습니다/));
    expect(buttonsOf(again)).toEqual(["다시 시도", "취소", "편집기 열기 (A안 · v1 편집 중)", "B안으로 새로 시작"]);
    await u.click(within(again).getByRole("button", { name: "취소" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(button);
    const fresh = await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" });
    expect(within(fresh).queryByRole("alert")).not.toBeInTheDocument();
    expect(spy.mock.calls.map((c) => c[3])).toEqual(["create"]);
  });
});

describe("create 재생 재판정 (RS-AC-17 · R-C3)", () => {
  async function replayed(fail?: MemoryProjectOptions["fail"]) {
    const opened = await open("/profile/profile-1?v=1", (store) => insertOtherVersion(store), { fail });
    await generate(opened.u, opened.region);
    await opened.repo.startDoc("project-1", 1, "B", "create");
    const doc = (await opened.repo.getDoc("project-1"))!;
    const themed = { ...doc, profileVersion: 2 };
    await opened.repo.saveDoc("project-1", doc.revision, { ...themed, hash: hashDoc(themed) });
    return opened;
  }
  it("B v1 create → 테마 v2 저장(r2) → 프로필 v1에서 B 편집 시작 → create 재생 → getDoc r2로 재판정 → F3(R-C3 + 'v1를 쓰려면…')", async () => {
    const { u, region, router, repo } = await replayed();
    const spy = vi.spyOn(repo, "startDoc");
    await u.click(await pick(u, region, "B"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(router.state.location.state).toEqual({
      editNotice: "이미 편집 중인 문서를 엽니다 (B안 · 프로필 v2) · v1를 쓰려면 '테마 바꾸기'를 누르세요 — 내용은 그대로입니다",
    });
    expect(spy.mock.calls.map((c) => c[3])).toEqual(["create"]);
  });

  it("재생 뒤 getDoc 실패 → F1 이동(F2·F3 알림 없음)", async () => {
    let armed = false;
    const { u, region, router } = await replayed((call) => (call.method === "getDoc" && armed ? ((armed = false), new Error("read")) : undefined));
    const button = await pick(u, region, "B");
    armed = true;
    await u.click(button);
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    // F1 = 지금 그대로 {changes, editNotice: changeNotice} — F2·F3 편집 알림(R-C3·R-C2) 없음
    const state = router.state.location.state as StudioEntryState;
    expect(Object.keys(state)).toEqual(["changes", "editNotice"]);
    expect(state.editNotice ?? "").not.toMatch(/이미 편집 중인 문서를 엽니다|테마 바꾸기/);
  });

  it("다른 안 문서로 바뀐 재생 → F4 대화상자(이동 0)", async () => {
    const { u, region, router, repo } = await replayed();
    const doc = (await repo.getDoc("project-1"))!;
    await repo.startDoc("project-1", 1, "A", "restart", doc.revision);
    await u.click(await pick(u, region, "B"));
    expect(await screen.findByRole("dialog", { name: "B안으로 새로 시작할까요?" })).toHaveTextContent("지금 편집 중인 문서: A안 · 프로필 v1");
    expect(router.state.location.pathname).toBe("/profile/profile-1");
  });
});

describe("R-N1 낭독 (RS-AC-18)", () => {
  it("changeNotice가 있는 안으로 새로 시작 → /studio 편집 알림 = R-N1 + ' · ' + changeNotice 전체 · details 0 · '바뀐 점' 0", async () => {
    const opened = await open();
    await generate(opened.u, opened.region);
    await opened.repo.startDoc("project-1", 1, "A", "create");
    let notice: string | undefined;
    const real = opened.repo.startDoc.bind(opened.repo);
    vi.spyOn(opened.repo, "startDoc").mockImplementation(async (...args) => {
      const result = await real(...args);
      notice = result.changeNotice;
      return result;
    });
    await opened.u.click(await pick(opened.u, opened.region, "C"));
    const dialog = await screen.findByRole("dialog", { name: "C안으로 새로 시작할까요?" });
    await opened.u.click(within(dialog).getByRole("button", { name: "C안으로 새로 시작" }));
    await waitFor(() => expect(opened.router.state.location.pathname).toBe("/studio/project-1"));
    expect(notice).toMatch(/^구조안의 섹션 \d+개/);
    const region = await screen.findByRole("status", { name: "편집 알림" });
    await waitFor(() => expect(region).toHaveTextContent(`C안 · 프로필 v1로 새로 시작했습니다 · 이전 문서(A안 · v1)는 스냅샷 '새로 시작 전'에 있습니다 · ${notice}`));
    expect(region.querySelectorAll("details")).toHaveLength(0);
    expect(region).not.toHaveTextContent("바뀐 점");
  });
});

describe("R-D5 판정 = 편집기 게이트 대비 줄 판정 (RS-AC-12 · RS-D6)", () => {
  it("픽스처 3개(기본 · enhanced · 색 못 읽음) — 미달 수 일치 · 판정 불가 = undefined(줄 생략)", async () => {
    const store = createStudioStore();
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
    const profiles = createMemoryProfileRepository({ store });
    await board.confirmProfile(1, 0);
    store.transact((tx) => {
      const latest = tx.versions("profile-1").at(-1)!;
      tx.insert({ ...latest, version: 2, origin: "adjust", adjustments: { ...latest.adjustments, contrast: "enhanced" }, createdAt: "2026-09-26T00:00:00.000Z" });
      const colors = latest.base.color_tokens;
      tx.insert({ ...latest, version: 3, origin: "adjust", base: { ...latest.base, color_tokens: { ...colors, ink: { ...colors.ink, $value: "ink" } } }, createdAt: "2026-09-27T00:00:00.000Z" });
    });
    const versions = (await profiles.getProfile("profile-1"))!.versions;
    expect(versions).toHaveLength(3);
    const gate = versions.map((v) => contrastIssues({ profile: v, purpose: "none" }));
    expect(versions.map(contrastFails)).toEqual([gate[0]!.length, gate[1]!.length, undefined]);
    expect(gate[2]!.length).toBeGreaterThan(0);
    expect(contrastText(1, contrastFails(versions[0]!), 3, contrastFails(versions[2]!))).toBeUndefined();
  });
});
