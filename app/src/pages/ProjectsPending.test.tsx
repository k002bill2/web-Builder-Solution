/**
 * RESTART SPEC-4 r0.3a 5.2 — `/projects` 행의 미확인 기억(P-U1~P-U5 · RS4-AC-07 · 08 · 14).
 * 미확인 행은 "편집기 열기"를 숨기고 "시작 다시 시도"(재생)·"저장 확인"(confirmDoc)을 둔다. 확인되면 링크를 되살리고 포커스를 옮긴다.
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type DocHead, type ProjectRepository, type ProjectSummary } from "../data/projectRepository";
import { discardAndReload, pendingOf, settle, ticketOf, type Pending } from "../features/pending/pendingWrites";
import { ProjectsPage } from "./ProjectsPage";

const now = () => new Date("2026-10-15T10:00:00.000Z");
const base = { revision: 1, baseReferenceId: "ref-a", createdAt: "2026-10-01T00:00:00.000Z" };
const ITEMS: readonly ProjectSummary[] = Object.freeze([
  Object.freeze({ ...base, projectId: "p1", name: "가게 홈페이지", profileId: "pf1", updatedAt: "2026-10-15T09:00:00.000Z", hasDoc: true, candidateId: "C", docProfileVersion: 4, latestProfileVersion: 4 }),
  Object.freeze({ ...base, projectId: "p2", name: "빵집", profileId: "pf2", updatedAt: "2026-10-15T08:00:00.000Z", hasDoc: true, candidateId: "A", docProfileVersion: 1, latestProfileVersion: 1 }),
]);
const head = (candidateId: string, revision: number, profileVersion = 4) => ({ projectId: "p1", candidateId, profileVersion, revision, hash: `h${revision}` }) as unknown as DocHead;
const unused = () => {
  throw new Error("이 테스트에서 쓰지 않는 저장소 메서드");
};
function repositoryWith(over: Partial<ProjectRepository>): ProjectRepository {
  return {
    persistence: "local",
    listProjects: async () => ITEMS,
    getProject: unused,
    renameProject: unused,
    getDoc: async () => head("C", 6),
    saveDoc: unused,
    startDoc: unused,
    listSnapshots: unused,
    createSnapshot: unused,
    deleteSnapshot: unused,
    restoreSnapshot: unused,
    resolveConflict: unused,
    requestExport: unused,
    getExportJob: unused,
    confirmDoc: unused,
    ...over,
  };
}
const hold = (repo: ProjectRepository, pending: Pending) => settle(repo, pending.projectId, ticketOf(repo, pending.projectId), pending);
const restartPending: Pending = { kind: "start", mode: "restart", projectId: "p1", version: 4, selected: "C", origin: { kind: "doc", head: head("B", 5, 3) }, held: "unconfirmed" };
const rowOf = (name: string) => screen.getByRole("heading", { level: 2, name }).closest("li")!;

afterEach(() => discardAndReload(() => undefined));

describe("미확인 행 (RS4-AC-07)", () => {
  it("PendingStart(restart) → P-U1 글자 · '편집기 열기' 0 · '시작 다시 시도' · P-U5 캡션 · 다른 행 그대로", async () => {
    const repo = repositoryWith({});
    hold(repo, restartPending);
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    await screen.findByRole("heading", { level: 2, name: "가게 홈페이지" });
    const row = rowOf("가게 홈페이지");
    expect(row).toHaveTextContent("새로 시작한 문서(C안 · v4)가 브라우저에 저장됐는지 확인하지 못했습니다");
    expect(within(row).queryByRole("link", { name: "가게 홈페이지 편집기 열기" })).not.toBeInTheDocument();
    expect(within(row).getByRole("button", { name: "가게 홈페이지 시작 다시 시도" })).toBeInTheDocument();
    expect(row).toHaveTextContent("확인 전에 새로고침하거나 탭을 닫으면 확인되지 않은 변경이 사라집니다");
    expect(within(rowOf("빵집")).getByRole("link", { name: "빵집 편집기 열기" })).toBeInTheDocument();
  });

  it("시작 다시 시도 = 같은 인자 재생 → 성공 → P-U2(role=status) · 링크 복원 · 포커스 = 링크 · 기억 0", async () => {
    const startDoc = vi.fn(async () => ({ doc: head("C", 6) }));
    const repo = repositoryWith({ startDoc: startDoc as unknown as ProjectRepository["startDoc"] });
    hold(repo, restartPending);
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    await u.click(await screen.findByRole("button", { name: "가게 홈페이지 시작 다시 시도" }));
    const link = await within(rowOf("가게 홈페이지")).findByRole("link", { name: "가게 홈페이지 편집기 열기" });
    expect(startDoc.mock.calls).toEqual([["p1", 4, "C", "restart", 5]]);
    expect(within(rowOf("가게 홈페이지")).getByRole("status")).toHaveTextContent("저장을 확인했습니다 — 편집기를 열 수 있습니다");
    await waitFor(() => expect(link).toHaveFocus());
    expect(pendingOf(repo, "p1")).toBeUndefined();
  });

  it("RS6-L5 CP2 · UX-5 4.1: '시작 다시 시도' 연타 = starter(같은 인자 재생) 1회 · 진행 중 aria-busy · '저장 확인' DOM 0(UX5-AC-11)", async () => {
    let finish = () => undefined as void;
    const startDoc = vi.fn(() => new Promise((done) => (finish = () => done({ doc: head("C", 6) }))));
    const repo = repositoryWith({ startDoc: startDoc as unknown as ProjectRepository["startDoc"] });
    hold(repo, restartPending);
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    const button = await screen.findByRole("button", { name: "가게 홈페이지 시작 다시 시도" });
    expect(within(rowOf("가게 홈페이지")).queryByRole("button", { name: "가게 홈페이지 저장 확인" })).not.toBeInTheDocument();
    await u.click(button);
    await waitFor(() => expect(button).toHaveAttribute("aria-busy", "true"));
    await u.click(button);
    expect(startDoc).toHaveBeenCalledTimes(1);
    finish();
    expect(await within(rowOf("가게 홈페이지")).findByRole("status")).toHaveTextContent("저장을 확인했습니다");
    expect(startDoc).toHaveBeenCalledTimes(1);
  });

  it("실패(flush 계속 실패) → P-U3(role=alert) · 버튼 유지 · 포커스 유지 · 기억 유지", async () => {
    const repo = repositoryWith({
      startDoc: (async () => {
        throw new ProjectRepositoryError("INFRA", "저장 — 브라우저 저장 공간이 부족합니다");
      }) as unknown as ProjectRepository["startDoc"],
      getDoc: async () => head("C", 6),
    });
    hold(repo, restartPending);
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    const button = await screen.findByRole("button", { name: "가게 홈페이지 시작 다시 시도" });
    await u.click(button);
    expect(await within(rowOf("가게 홈페이지")).findByRole("alert")).toHaveTextContent("아직 저장을 확인하지 못했습니다");
    expect(within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 시작 다시 시도" })).toHaveFocus();
    expect(pendingOf(repo, "p1")?.kind).toBe("start");
  });

  it("PendingRecord → '저장 확인' = confirmDoc 1회(startDoc 0) → 성공 → 링크 복원", async () => {
    const confirmDoc = vi.fn(async () => undefined);
    const repo = repositoryWith({ confirmDoc });
    hold(repo, { kind: "record", projectId: "p1", cause: "start-not-applied", head: head("C", 6) });
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    const row = await screen.findByRole("heading", { level: 2, name: "가게 홈페이지" }).then(() => rowOf("가게 홈페이지"));
    expect(row).toHaveTextContent("이 문서(C안 · v4)가 브라우저에 저장됐는지 확인하지 못했습니다");
    await u.click(within(row).getByRole("button", { name: "가게 홈페이지 저장 확인" }));
    await within(rowOf("가게 홈페이지")).findByRole("link", { name: "가게 홈페이지 편집기 열기" });
    expect(confirmDoc).toHaveBeenCalledTimes(1);
  });
});

describe("폐기 확인 (RS4-AC-08 · 14)", () => {
  it("local만 보조 버튼 → alertdialog · 첫 포커스 = 취소 · Esc = 취소(포커스 = 보조 버튼) · memory 영속엔 없음", async () => {
    const repo = repositoryWith({});
    hold(repo, restartPending);
    const u = userEvent.setup();
    const view = render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    await screen.findByRole("heading", { level: 2, name: "가게 홈페이지" });
    await u.click(within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 버리고 새로고침" }));
    const dialog = within(rowOf("가게 홈페이지")).getByRole("alertdialog", { name: "확인되지 않은 변경 버리기" });
    expect(within(dialog).getByRole("button", { name: "취소" })).toHaveFocus();
    await u.keyboard("{Escape}");
    await waitFor(() => expect(within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 버리고 새로고침" })).toHaveFocus());
    expect(pendingOf(repo, "p1")).toBeDefined();
    view.unmount();

    const memory = repositoryWith({ persistence: "memory" });
    hold(memory, { ...restartPending });
    render(<MemoryRouter><ProjectsPage repository={memory} now={now} /></MemoryRouter>);
    await screen.findByRole("heading", { level: 2, name: "가게 홈페이지" });
    expect(within(rowOf("가게 홈페이지")).queryByRole("button", { name: /버리고 새로고침/ })).not.toBeInTheDocument();
  });
});

describe("Codex review P2 반영", () => {
  it("재시도 성공 → 목록 다시 조회 → hasDoc false였던 행에 '편집기 열기'가 생긴다(create 미확인)", async () => {
    let created = false;
    const listProjects = vi.fn(async () => ITEMS.map((s) => (s.projectId === "p1" ? { ...s, hasDoc: created } : s)));
    const startDoc = vi.fn(async () => ((created = true), { doc: head("C", 1) }));
    const repo = repositoryWith({ listProjects, startDoc: startDoc as unknown as ProjectRepository["startDoc"], getDoc: async () => head("C", 1) });
    hold(repo, { kind: "start", mode: "create", projectId: "p1", version: 4, selected: "C", origin: { kind: "unknown" }, held: "unknown" });
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    await u.click(await screen.findByRole("button", { name: "가게 홈페이지 시작 다시 시도" }));
    const link = await within(rowOf("가게 홈페이지")).findByRole("link", { name: "가게 홈페이지 편집기 열기" });
    expect(listProjects).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(link).toHaveFocus());
  });

  it("목록이 그려진 뒤 생긴 기억 → 행이 다시 판정된다(구독)", async () => {
    const repo = repositoryWith({});
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    expect(await within(await screen.findByRole("heading", { level: 2, name: "가게 홈페이지" }).then(() => rowOf("가게 홈페이지"))).findByRole("link", { name: "가게 홈페이지 편집기 열기" })).toBeInTheDocument();
    await act(async () => void hold(repo, restartPending));
    expect(within(rowOf("가게 홈페이지")).queryByRole("link", { name: "가게 홈페이지 편집기 열기" })).not.toBeInTheDocument();
    expect(within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 시작 다시 시도" })).toBeInTheDocument();
  });

  it("저장 확인이 IMAGES_MISSING → 알림 · '저장 확인' 숨김 · 폐기만 · 기억 유지", async () => {
    const repo = repositoryWith({
      confirmDoc: async () => {
        throw new ProjectRepositoryError("IMAGES_MISSING", "p1");
      },
    });
    hold(repo, { kind: "record", projectId: "p1", cause: "start-not-applied", head: head("C", 6) });
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
    await u.click(await screen.findByRole("button", { name: "가게 홈페이지 저장 확인" }));
    expect(await within(rowOf("가게 홈페이지")).findByRole("alert")).toHaveTextContent("일부 이미지");
    expect(within(rowOf("가게 홈페이지")).queryByRole("button", { name: "가게 홈페이지 저장 확인" })).not.toBeInTheDocument();
    expect(within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 버리고 새로고침" })).toBeInTheDocument();
    expect(pendingOf(repo, "p1")?.kind).toBe("record");
  });
});

describe("Codex review r3 P2 — 더 확인할 수 없음(stuck)이면 포커스를 남은 행동으로", () => {
  const recordWith = (persistence: "local" | "memory") => {
    const confirmDoc = vi.fn(async () => {
      throw new ProjectRepositoryError("IMAGES_MISSING", "이미지가 저장되지 않았습니다");
    });
    const repo = repositoryWith({ persistence, confirmDoc: confirmDoc as unknown as ProjectRepository["confirmDoc"] });
    hold(repo, { kind: "record", projectId: "p1", cause: "start-not-applied", head: head("C", 6) });
    return repo;
  };

  it("local → '저장 확인' 버튼이 사라지면 포커스 = '버리고 새로고침'", async () => {
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={recordWith("local")} now={now} /></MemoryRouter>);
    await u.click(await screen.findByRole("button", { name: "가게 홈페이지 저장 확인" }));
    await within(rowOf("가게 홈페이지")).findByRole("alert");
    expect(within(rowOf("가게 홈페이지")).queryByRole("button", { name: "가게 홈페이지 저장 확인" })).not.toBeInTheDocument();
    await waitFor(() => expect(within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 버리고 새로고침" })).toHaveFocus());
  });

  it("memory(폐기 버튼 없음) → 포커스 = 행 안 결과 알림", async () => {
    const u = userEvent.setup();
    render(<MemoryRouter><ProjectsPage repository={recordWith("memory")} now={now} /></MemoryRouter>);
    await u.click(await screen.findByRole("button", { name: "가게 홈페이지 저장 확인" }));
    const alert = await within(rowOf("가게 홈페이지")).findByRole("alert");
    await waitFor(() => expect(alert).toHaveFocus());
  });
});
