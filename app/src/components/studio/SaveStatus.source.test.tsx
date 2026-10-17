/**
 * RS6-L4 CP1 — SaveStatus 판정 출처 결선(I6 8.1): 훅 `useDocSave().source`(코어 view + 마지막 결과 reason) → 상태 글자 ·
 * LV-1 `T_hang` alert 문구(`role=alert` `<p>` — aria-busy 붙는 상태 글자에는 넣지 않는다, L2 QA 7절 3).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError } from "../../data/projectRepository";
import { READ_ONLY_TAB } from "../../data/persistence/infra";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { useDocSave, type DocSaveRepository } from "../../features/studio/useDocSave";
import { SAVE_HANG_TEXT } from "../../features/studio/saveStatusText";
import { withSaveCore } from "../../features/studio/testing/coreFixture";
import { SaveStatus } from "./SaveStatus";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

function Harness({ repo, initialDoc }: { repo: DocSaveRepository; initialDoc: PageDoc }) {
  const save = useDocSave({ repository: repo, projectId: initialDoc.projectId, initialDoc });
  return (
    <>
      <input aria-label="제목" value={save.doc.meta.title} onChange={(e) => save.edit({ ...save.doc, meta: { ...save.doc.meta, title: e.target.value } })} />
      <SaveStatus state={save.state} persistence={save.persistence} source={save.source} onRetry={save.retry} />
    </>
  );
}

describe("RS6-L4 CP1 · SaveStatus 출처 결선", () => {
  it("포트 readonly 거절 → 상태 글자 = readonly 문구(문자열 '저장하지 못했습니다' 아님) · alert 같은 문구 1곳", async () => {
    const doc = sampleDoc();
    const saveDoc = vi.fn(async () => Promise.reject(new ProjectRepositoryError("INFRA", `저장 — ${READ_ONLY_TAB}`)));
    render(<Harness repo={withSaveCore({ persistence: "local" as const, saveDoc, resolveConflict: vi.fn() })} initialDoc={doc} />);
    fireEvent.change(screen.getByRole("textbox", { name: "제목" }), { target: { value: "하나" } });
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByText("다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다", { selector: "p:not([role])" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다");
  });

  it("POP 재진입(C5 T1) — 앞 lease 해제 save 진행 중이면 '저장 중…' · 끝나면 다시 그려 '저장 중…' 아님", async () => {
    const doc = sampleDoc();
    let finish: (() => void) | undefined;
    const saveDoc = vi.fn((_p: string, _r: number, next: PageDoc) => new Promise((done) => (finish = () => done({ ...next, revision: next.revision + 1 }))));
    const repo = withSaveCore({ persistence: "local" as const, saveDoc, resolveConflict: vi.fn() });
    const first = render(<Harness repo={repo} initialDoc={doc} />);
    fireEvent.change(screen.getByRole("textbox", { name: "제목" }), { target: { value: "떠나기 전" } });
    first.unmount();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(saveDoc).toHaveBeenCalledTimes(1);
    render(<Harness repo={repo} initialDoc={doc} />);
    expect(screen.getByText("저장 중…")).toBeInTheDocument();
    await act(async () => finish?.());
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.queryByText("저장 중…")).toBeNull();
  });

  it("T_hang → alert <p>에 hang 문구 · aria-busy 상태 글자에는 hang 문구 0", () => {
    const at = (hang?: number) => <SaveStatus state={{ phase: "saving", slow: true, ...(hang && { hang }) }} persistence="local" source={{ inflight: 1 }} onRetry={() => undefined} />;
    const { rerender } = render(at());
    rerender(at(1));
    expect(screen.getByRole("alert")).toHaveTextContent(SAVE_HANG_TEXT);
    expect(SAVE_HANG_TEXT).toBe("브라우저가 저장에 응답하지 않습니다 — 이 탭을 닫으면 확인되지 않은 변경이 사라질 수 있습니다");
    const busy = document.querySelector("[aria-busy=true]");
    expect(busy).not.toBeNull();
    expect(busy).not.toHaveTextContent("응답하지 않습니다");
  });
});
