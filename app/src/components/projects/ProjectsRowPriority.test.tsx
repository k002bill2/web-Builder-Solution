/**
 * RS7-M1(B-RS-08) — RS6-L5 QA 2절 생존 변이 M1(행 우선순위)의 테스트 공백. 앱 코드 변경 0.
 * 우선순위 정본 = `pendingRows.describeRow`(시작 대기 > 저장 중 > 저장 실패 > 미확인 기록) · 클릭 = `pendingRetry.retryRow`(같은 우선순위).
 * 저장소·코어 = testRig(ProjectsCoreRows.test와 같은 조립). starter(`restartOnce`)만 mock으로 세어 실제 재생 IO는 하지 않는다.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { discardAndReload, settle, ticketOf, type Pending } from "../../features/pending/pendingWrites";
import { PROJECT, edited, startedRig } from "../../features/studio/save/testRig";
import { ProjectsPage } from "../../pages/ProjectsPage";

const restartOnce = vi.hoisted(() => vi.fn());
vi.mock("../../features/profile/restartFlow", async (importOriginal) => ({ ...(await importOriginal<object>()), restartOnce }));

afterEach(() => {
  restartOnce.mockReset();
  discardAndReload(() => undefined);
});

const head = (revision: number) => ({ projectId: PROJECT, candidateId: "B", profileVersion: 1, revision }) as never;
const hold = (repo: object, pending: Pending) => settle(repo, PROJECT, ticketOf(repo, PROJECT), pending);

const show = async (repo: Parameters<typeof ProjectsPage>[0]["repository"]) => {
  render(
    <MemoryRouter>
      <ProjectsPage repository={repo} />
    </MemoryRouter>,
  );
  const [heading] = await screen.findAllByRole("heading", { level: 2 });
  return { row: heading!.closest("li")!, name: heading!.textContent! };
};

describe("M1 — 시작 대기 + 코어 dirty(저장 실패) 조합 행", () => {
  it("라벨 = '시작 다시 시도'(다시 저장 0) · 클릭 = starter 1회 · core.save 0", async () => {
    restartOnce.mockResolvedValue({ held: "unconfirmed" });
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "실패한 편집"));
    db.failNext("AbortError");
    expect((await c.save()).status).toBe("failed");
    expect(c.view().dirty).toBe(true);
    hold(repo, { kind: "start", mode: "restart", projectId: PROJECT, version: 1, selected: "B", origin: { kind: "doc", head: head(1) }, held: "unconfirmed" });
    const { row, name } = await show(repo);
    const button = within(row).getByRole("button", { name: `${name} 시작 다시 시도` });
    expect(within(row).queryByRole("button", { name: `${name} 다시 저장` })).not.toBeInTheDocument();
    expect(row).not.toHaveTextContent("저장하지 못했습니다");
    const save = vi.spyOn(c, "save");
    await userEvent.setup().click(button);
    await waitFor(() => expect(restartOnce).toHaveBeenCalledTimes(1));
    expect(await within(row).findByRole("alert")).toBeInTheDocument();
    expect(restartOnce.mock.calls[0]?.[1]).toBe(PROJECT);
    expect(save).not.toHaveBeenCalled();
  });
});

describe("M1 — 저장 중 + 미확인 기록 조합 행", () => {
  it("상태 = '저장 중…' · '저장 확인' 버튼 0(저장 중이 미확인 기록보다 앞선다)", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "기록 뒤 저장"));
    hold(repo, { kind: "record", projectId: PROJECT, cause: "start-not-applied", head: head(1) });
    const held = db.hold(1);
    const saving = c.save();
    const { row, name } = await show(repo);
    expect(await within(row).findByText("저장 중…")).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: `${name} 저장 확인` })).not.toBeInTheDocument();
    held.release();
    expect((await saving).status).toBe("saved");
  });
});
