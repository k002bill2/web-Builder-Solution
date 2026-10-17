/**
 * B-RS-15 경합 재현 — "저장 확인"을 누른 같은 틱에 기억이 풀린다(조작 뒤 청크 import가 끝나기 전).
 * 행 결과에 "다시 저장했습니다"(저장 0인데 성공 문구)가 나오지 않는다.
 */
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { discardAndReload, pendingOf, settle, ticketOf } from "../../features/pending/pendingWrites";
import { PROJECT, startedRig, ticks } from "../../features/studio/save/testRig";
import { ProjectsPage } from "../../pages/ProjectsPage";

afterEach(() => discardAndReload(() => undefined));

describe("클릭~청크 로드 경합 — B-RS-15", () => {
  it("미확인 기록 행 '저장 확인' 클릭 직후 기억이 풀림 → 성공 문구 0 · 행 = 일반 행", async () => {
    const { repo, doc } = await startedRig();
    settle(repo, PROJECT, ticketOf(repo, PROJECT), { kind: "record", projectId: PROJECT, cause: "start-not-applied", head: { candidateId: "B", profileVersion: 1, revision: doc.revision } as never });
    render(
      <MemoryRouter>
        <ProjectsPage repository={repo} />
      </MemoryRouter>,
    );
    const [heading] = await screen.findAllByRole("heading", { level: 2 });
    const row = heading!.closest("li")!;
    const name = heading!.textContent!;
    fireEvent.click(within(row).getByRole("button", { name: `${name} 저장 확인` }));
    settle(repo, PROJECT, ticketOf(repo, PROJECT), undefined, "confirmed");
    expect(pendingOf(repo, PROJECT)).toBeUndefined();
    await waitFor(() => expect(within(row).queryByText("확인하는 중…")).not.toBeInTheDocument());
    await ticks();
    expect(row).not.toHaveTextContent("다시 저장했습니다");
    expect(within(row).queryByRole("button", { name: `${name} 저장 확인` })).not.toBeInTheDocument();
    expect(within(row).getByRole("link", { name: `${name} 편집기 열기` })).toBeInTheDocument();
  });
});
