/**
 * RS6-L5 — `/projects` 행이 저장 코어 상태를 읽는다(INTEGRATE-6 r1 8.1 · 12절 · RS6-AC-U11 나머지 · U16 · B2 단위판 · UX5-AC-08 · L3b QA note 1).
 * 저장소 = 앱 조립(createDeferredStudio) + 제품 LocalSync 포트 + 메모리 영속(testRig). 코어는 편집기가 만든 것처럼 레지스트리에서 연다.
 */
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { imageRecordId } from "../../data/persistence/imageRecord";
import { discardAndReload, pendingOf, settle, ticketOf } from "../../features/pending/pendingWrites";
import { PROJECT, bindOf, edited, startedRig, ticks, uuid, withImage } from "../../features/studio/save/testRig";
import { ProjectsPage } from "../../pages/ProjectsPage";

afterEach(() => discardAndReload(() => undefined));

const show = async (repo: Parameters<typeof ProjectsPage>[0]["repository"]) => {
  render(
    <MemoryRouter>
      <ProjectsPage repository={repo} />
    </MemoryRouter>,
  );
  const [heading] = await screen.findAllByRole("heading", { level: 2 });
  return { row: heading!.closest("li")!, name: heading!.textContent! };
};

describe("코어 inflight 행 — RS6-AC-U11 나머지", () => {
  it("편집기를 떠난 뒤 저장 중 → 행 '저장 중…' → 커밋이 끝나면 다른 이벤트 없이 일반 행으로", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "떠나며 저장"));
    const held = db.hold(1);
    const saving = c.save();
    const { row, name } = await show(repo);
    expect(await within(row).findByText("저장 중…")).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: `${name} 다시 저장` })).not.toBeInTheDocument();
    held.release();
    expect((await saving).status).toBe("saved");
    await waitFor(() => expect(within(row).queryByText("저장 중…")).not.toBeInTheDocument());
    expect(within(row).getByRole("link", { name: `${name} 편집기 열기` })).toBeInTheDocument();
    expect(within(row).queryByText("저장하지 못했습니다")).not.toBeInTheDocument();
  });
});

describe("해제 save 실패 행 — L3b QA note 1 · I6 12절", () => {
  it("실패 = '저장하지 못했습니다' + '다시 저장'(= core.save 1회) → 성공 → 일반 행 · status · 포커스 = 편집기 열기 · IDB = 마지막 편집", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "실패한 편집"));
    db.failNext("AbortError");
    expect((await c.save()).status).toBe("failed");
    const { row, name } = await show(repo);
    expect(within(row).getByText("저장하지 못했습니다")).toBeInTheDocument();
    const save = vi.spyOn(c, "save");
    const u = userEvent.setup();
    const button = within(row).getByRole("button", { name: `${name} 다시 저장` });
    await u.click(button);
    await u.click(button);
    expect(await within(row).findByRole("status")).toHaveTextContent("다시 저장했습니다");
    expect(save).toHaveBeenCalledTimes(1);
    expect(within(row).queryByText("저장하지 못했습니다")).not.toBeInTheDocument();
    await waitFor(() => expect(within(row).getByRole("link", { name: `${name} 편집기 열기` })).toHaveFocus());
    expect((await db.doc())?.doc.meta.title).toBe("실패한 편집");
  });

  it("다시 저장도 실패(readonly) → alert = UX-5 원문 · 버튼·포커스 유지 · 거짓 saved 0", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "다른 탭 잠금"));
    db.failNext("AbortError");
    await c.save();
    const { row, name } = await show(repo);
    vi.spyOn(c, "save").mockResolvedValueOnce({ status: "failed", reason: "readonly", newer: false });
    const u = userEvent.setup();
    await u.click(within(row).getByRole("button", { name: `${name} 다시 저장` }));
    expect(await within(row).findByRole("alert")).toHaveTextContent("다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다");
    const button = within(row).getByRole("button", { name: `${name} 다시 저장` });
    expect(button).toHaveFocus();
    expect(button).not.toHaveAttribute("aria-busy");
    expect(row).not.toHaveTextContent("다시 저장했습니다");
  });

  it("다시 저장 reject → 실패 결과로 매핑 · 진행 표시 해제 · 거짓 saved 0", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "reject"));
    db.failNext("AbortError");
    await c.save();
    const { row, name } = await show(repo);
    vi.spyOn(c, "save").mockRejectedValueOnce(new Error("청크"));
    const u = userEvent.setup();
    await u.click(within(row).getByRole("button", { name: `${name} 다시 저장` }));
    expect(await within(row).findByRole("alert")).toHaveTextContent("저장하지 못했습니다");
    const button = within(row).getByRole("button", { name: `${name} 다시 저장` });
    expect(button).not.toHaveAttribute("aria-busy");
    expect(row).not.toHaveTextContent("다시 저장했습니다");
  });
});

describe("편집기 밖 이미지 — C5 T5 · RS6-AC-B2 단위판(CP3)", () => {
  it("새 이미지 편집 → 해제 save 실패 → 편집 틀 맵 없음 → 행 '다시 저장' → 코어 바인딩으로 이미지 레코드까지 커밋", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    const id = uuid(7);
    const next = withImage(doc, id);
    c.edit(next, bindOf(next, id));
    db.failNext("AbortError");
    expect((await c.save()).status).toBe("failed");
    const { row, name } = await show(repo);
    await userEvent.setup().click(within(row).getByRole("button", { name: `${name} 다시 저장` }));
    expect(await within(row).findByRole("status")).toHaveTextContent("다시 저장했습니다");
    expect(JSON.stringify((await db.doc())?.doc)).toContain(id);
    expect(await db.persistence.get("images", imageRecordId(PROJECT, id))).toBeDefined();
  });
});

describe("PendingRecord + 코어 — CP1 · UX5-AC-08 · RS6-AC-U16", () => {
  const record = (repo: object, revision: number) => settle(repo, PROJECT, ticketOf(repo, PROJECT), { kind: "record", projectId: PROJECT, cause: "start-not-applied", head: { candidateId: "B", profileVersion: 1, revision } as never });

  it("'저장 확인' = 코어 confirm 1회(confirmDoc 0) · clean·커밋된 초안 = 재읽기만(쓰기 0, C5 T13) → 기억 0 · status · 포커스 = 편집기 열기(UX5-AC-08)", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "기억된 문서"));
    expect((await c.save()).status).toBe("saved");
    record(repo, c.view().confirmed!.revision);
    const { row, name } = await show(repo);
    const link = vi.spyOn(c, "link");
    const confirmDoc = vi.spyOn(repo, "confirmDoc");
    const writes = db.ops.length;
    const u = userEvent.setup();
    const button = within(row).getByRole("button", { name: `${name} 저장 확인` });
    await u.click(button);
    await u.click(button);
    expect(await within(row).findByRole("status")).toHaveTextContent("저장을 확인했습니다");
    expect(link).toHaveBeenCalledTimes(1);
    expect(confirmDoc).not.toHaveBeenCalled();
    expect(db.ops.length).toBe(writes);
    expect(pendingOf(repo, PROJECT)).toBeUndefined();
    await waitFor(() => expect(within(row).getByRole("link", { name: `${name} 편집기 열기` })).toHaveFocus());
  });

  it("'저장 확인' — 마지막 receipt가 IDB에 없으면(어댑터 거짓 성공) 재읽기 실패 → 쓰기 탭에서 초안을 다시 써서 확인(거짓 확인 0 · confirmDoc 0)", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    c.edit(edited(doc, "닿지 않은 문서"));
    db.dropNext();
    expect((await c.save()).status).toBe("saved");
    record(repo, c.view().confirmed!.revision);
    const { row, name } = await show(repo);
    const confirmDoc = vi.spyOn(repo, "confirmDoc");
    await userEvent.setup().click(within(row).getByRole("button", { name: `${name} 저장 확인` }));
    expect(await within(row).findByRole("status")).toHaveTextContent("저장을 확인했습니다");
    expect(confirmDoc).not.toHaveBeenCalled();
    expect(pendingOf(repo, PROJECT)).toBeUndefined();
    expect((await db.doc())?.doc.meta.title).toBe("닿지 않은 문서");
  });

  it("U16: 기억 뒤 편집기 저장 성공(local 커밋) → 행 기억 0(1클릭 확인 불필요)", async () => {
    const { repo, doc, core } = await startedRig();
    const c = core();
    record(repo, c.view().confirmed!.revision);
    c.edit(edited(doc, "저장 성공"));
    expect((await c.save()).status).toBe("saved");
    const { row, name } = await show(repo);
    await waitFor(() => expect(pendingOf(repo, PROJECT)).toBeUndefined());
    expect(within(row).queryByRole("button", { name: `${name} 저장 확인` })).not.toBeInTheDocument();
    expect(within(row).getByRole("link", { name: `${name} 편집기 열기` })).toBeInTheDocument();
  });

  it("U16 반대: 기억 뒤 저장 없음 → 기억 유지 · '저장 확인' 그대로", async () => {
    const { repo, core } = await startedRig();
    const c = core();
    record(repo, c.view().confirmed!.revision);
    const { row, name } = await show(repo);
    await ticks();
    expect(pendingOf(repo, PROJECT)).toBeDefined();
    expect(within(row).getByRole("button", { name: `${name} 저장 확인` })).toBeInTheDocument();
  });

  it("PendingStart 유지: 코어 저장 성공이 있어도 시작 대기 기억은 풀지 않는다 · '시작 다시 시도'만", async () => {
    const { repo, doc, core } = await startedRig();
    const c = core();
    settle(repo, PROJECT, ticketOf(repo, PROJECT), { kind: "start", mode: "restart", projectId: PROJECT, version: 1, selected: "A", origin: { kind: "doc", head: doc }, held: "unconfirmed" });
    c.edit(edited(doc, "저장 성공"));
    await c.save();
    const { row, name } = await show(repo);
    await ticks();
    expect(pendingOf(repo, PROJECT)?.kind).toBe("start");
    expect(within(row).getByRole("button", { name: `${name} 시작 다시 시도` })).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: `${name} 저장 확인` })).not.toBeInTheDocument();
  });
});
