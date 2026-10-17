/**
 * RS7-C(B-RS-08) — RS6-L5 QA 2절 생존 변이 M3(페이지 `state.busy` guard 단독)·M4b(페이지 `.catch`)의 테스트 공백.
 * `retryRow`를 모듈 mock으로 막거나 reject시켜 페이지 판정만 본다. 앱 코드 변경 0.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { DocHead, ProjectRepository, ProjectSummary } from "../data/projectRepository";
import { discardAndReload, settle, ticketOf, type Pending } from "../features/pending/pendingWrites";
import { ProjectsPage } from "./ProjectsPage";

const retryRow = vi.hoisted(() => vi.fn());
vi.mock("../features/projects/pendingRetry", () => ({ retryRow }));

const now = () => new Date("2026-10-15T10:00:00.000Z");
const base = { revision: 1, baseReferenceId: "ref-a", createdAt: "2026-10-01T00:00:00.000Z" };
const ITEMS: readonly ProjectSummary[] = Object.freeze([
  Object.freeze({ ...base, projectId: "p1", name: "가게 홈페이지", profileId: "pf1", updatedAt: "2026-10-15T09:00:00.000Z", hasDoc: true, candidateId: "C", docProfileVersion: 4, latestProfileVersion: 4 }),
  Object.freeze({ ...base, projectId: "p2", name: "빵집", profileId: "pf2", updatedAt: "2026-10-15T08:00:00.000Z", hasDoc: true, candidateId: "A", docProfileVersion: 4, latestProfileVersion: 4 }),
]);
const head = (projectId: string, candidateId: string, revision: number, profileVersion = 4) => ({ projectId, candidateId, profileVersion, revision, hash: `h${revision}` }) as unknown as DocHead;
const unused = () => {
  throw new Error("이 테스트에서 쓰지 않는 저장소 메서드");
};
const repositoryWith = (): ProjectRepository => ({
  persistence: "local",
  listProjects: async () => ITEMS,
  getProject: unused,
  renameProject: unused,
  getDoc: async (projectId) => head(projectId, "C", 6),
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
});
const restartOf = (projectId: string): Pending => ({ kind: "start", mode: "restart", projectId, version: 4, selected: "C", origin: { kind: "doc", head: head(projectId, "B", 5, 3) }, held: "unconfirmed" });
const hold = (repo: ProjectRepository, pending: Pending) => settle(repo, pending.projectId, ticketOf(repo, pending.projectId), pending);
const rowOf = (name: string) => screen.getByRole("heading", { level: 2, name }).closest("li")!;

async function pendingPage(...ids: readonly string[]) {
  const repo = repositoryWith();
  ids.forEach((id) => hold(repo, restartOf(id)));
  render(<MemoryRouter><ProjectsPage repository={repo} now={now} /></MemoryRouter>);
  await screen.findByRole("button", { name: "가게 홈페이지 시작 다시 시도" });
  return repo;
}

afterEach(() => {
  retryRow.mockReset();
  discardAndReload(() => undefined);
});

describe("RS7-C · L5 M4b 페이지 retry reject = 실패 결과", () => {
  it("retryRow reject → alert 실패 문구 · busy 해제(aria-busy 0) · 포커스 = 그 버튼 · 기억 유지", async () => {
    retryRow.mockRejectedValueOnce(new Error("chunk"));
    await pendingPage("p1");
    const button = within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 시작 다시 시도" });
    await userEvent.click(button);
    expect(await within(rowOf("가게 홈페이지")).findByRole("alert")).toHaveTextContent("저장을 확인하지 못했습니다 — 잠시 뒤 다시 시도하세요");
    const after = within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 시작 다시 시도" });
    expect(after).not.toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(after).toHaveFocus());
    expect(within(rowOf("가게 홈페이지")).queryByRole("link", { name: "가게 홈페이지 편집기 열기" })).not.toBeInTheDocument();
  });
});

describe("RS7-C · L5 M3 페이지 busy guard = 한 번에 한 행", () => {
  it("p1 재시도 진행 중 p2 재시도 클릭 → retryRow 1회(p1)만 · p1 끝난 뒤 p2 재시도 가능", async () => {
    let finish: (out: { ok: boolean; text: string }) => void = () => undefined;
    retryRow.mockImplementationOnce(() => new Promise((done) => (finish = done)));
    await pendingPage("p1", "p2");
    await userEvent.click(within(rowOf("가게 홈페이지")).getByRole("button", { name: "가게 홈페이지 시작 다시 시도" }));
    await waitFor(() => expect(retryRow).toHaveBeenCalledTimes(1));
    await userEvent.click(within(rowOf("빵집")).getByRole("button", { name: "빵집 시작 다시 시도" }));
    expect(retryRow).toHaveBeenCalledTimes(1);
    expect(retryRow.mock.calls[0]?.[1]).toBe("p1");
    finish({ ok: false, text: "다시 시도하지 못했습니다" });
    expect(await within(rowOf("가게 홈페이지")).findByRole("alert")).toHaveTextContent("다시 시도하지 못했습니다");
    retryRow.mockResolvedValueOnce({ ok: false, text: "두 번째" });
    await userEvent.click(within(rowOf("빵집")).getByRole("button", { name: "빵집 시작 다시 시도" }));
    await waitFor(() => expect(retryRow).toHaveBeenCalledTimes(2));
    expect(retryRow.mock.calls[1]?.[1]).toBe("p2");
  });
});
