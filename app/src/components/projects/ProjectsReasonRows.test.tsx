/**
 * B-RS-09 — `/projects` 행이 코어 환경(stale·cleared·readonly)을 **첫 표시부터** 읽는다(UX-5 2.2 우선순위 · 2.3 상태표 `/projects` 행 "같음").
 * 일반 "저장하지 못했습니다" + "다시 저장"이 먼저 보였다가 누른 뒤에야 사유가 나오던 결함(RS6 L4 QA N2)의 회귀.
 * stale·cleared = 다시 저장해도 같은 결과 → 버튼 숨김 · readonly = 그 탭을 닫은 뒤 다시 저장(버튼 유지).
 */
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { createLinkNetwork } from "../../data/persistence/fakeTabLink";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { discardAndReload } from "../../features/pending/pendingWrites";
import { edited, otherTab, startedRig, ticks } from "../../features/studio/save/testRig";
import { ProjectsPage } from "../../pages/ProjectsPage";

afterEach(() => discardAndReload(() => undefined));

const STALE = "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요";
const CLEARED = "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요";
const READONLY = "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다";

/** 목록이 처음 그려진 그 순간의 행(그 뒤 갱신을 기다리지 않는다) */
const firstRow = async (repo: Parameters<typeof ProjectsPage>[0]["repository"]) => {
  render(
    <MemoryRouter>
      <ProjectsPage repository={repo} />
    </MemoryRouter>,
  );
  const [heading] = await screen.findAllByRole("heading", { level: 2 });
  return { row: heading!.closest("li")!, name: heading!.textContent! };
};

describe("코어 환경 사유 행 — 첫 표시 (B-RS-09)", () => {
  it("다른 탭 stale → 첫 표시 = UX-5 stale 문구 · '다시 저장' 0 · 일반 실패 문구 0 · 편집기 열기 유지", async () => {
    const locks = createLockRegistry();
    const a = locks.tab();
    const { db, core, doc } = await startedRig({ locks: a });
    const b = await otherTab(db, { locks: locks.tab() });
    core().edit(edited(doc, "A"));
    expect(await core().save()).toMatchObject({ status: "saved" });
    a.close();
    b.core.edit(edited(b.seed, "B"));
    expect(await b.core.save()).toMatchObject({ status: "failed", reason: "stale" });
    const { row, name } = await firstRow(b.repo);
    expect(within(row).queryByText("저장하지 못했습니다")).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: `${name} 다시 저장` })).not.toBeInTheDocument();
    expect(within(row).getByText(STALE)).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: `${name} 편집기 열기` })).toBeInTheDocument();
    await ticks();
    expect(within(row).getByText(STALE)).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: `${name} 다시 저장` })).not.toBeInTheDocument();
  });

  it("cleared → 첫 표시 = UX-5 cleared 문구 · 저장 버튼 0", async () => {
    const net = createLinkNetwork();
    const { repo, core, doc } = await startedRig({ link: net.tab() });
    const c = core();
    net.tab().post({ type: "cleared" });
    await ticks();
    c.edit(edited(doc, "지운 뒤 편집"));
    expect(await c.save()).toMatchObject({ status: "failed", reason: "cleared" });
    const { row, name } = await firstRow(repo);
    expect(within(row).queryByText("저장하지 못했습니다")).not.toBeInTheDocument();
    expect(within(row).getByText(CLEARED)).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: `${name} 다시 저장` })).not.toBeInTheDocument();
  });

  it("다른 탭이 writer(readonly) → 첫 표시 = UX-5 readonly 문구 + '다시 저장' 유지(그 탭을 닫은 뒤 재시도)", async () => {
    const locks = createLockRegistry();
    const { db } = await startedRig({ locks: locks.tab() });
    const b = await otherTab(db, { locks: locks.tab() });
    b.core.edit(edited(b.seed, "B"));
    expect(await b.core.save()).toMatchObject({ status: "failed", reason: "readonly" });
    const { row, name } = await firstRow(b.repo);
    expect(within(row).queryByText("저장하지 못했습니다")).not.toBeInTheDocument();
    expect(within(row).getByText(READONLY)).toBeInTheDocument();
    expect(within(row).getByRole("button", { name: `${name} 다시 저장` })).toBeInTheDocument();
  });
});
