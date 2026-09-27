import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import type { AutosaveState } from "../../features/studio/useAutosaveScheduler";
import { useDocSave, type DocSaveRepository } from "../../features/studio/useDocSave";
import { SaveStatus } from "./SaveStatus";

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

const liveAncestor = (el: HTMLElement) => el.closest("[aria-live],[role=status],[role=alert],[role=log]");

describe("SaveStatus — 전이 (E-AC-08)", () => {
  it("저장 전 변경 있음 → 저장 중… → 이 탭에 저장됨 · N초 전 · 라이브 영역 밖 · 알림 0", async () => {
    const onAnnounce = vi.fn();
    const onRetry = vi.fn();
    const at = (state: AutosaveState) => <SaveStatus state={state} persistence="memory" onRetry={onRetry} onAnnounce={onAnnounce} />;
    const { rerender } = render(at({ phase: "idle" }));
    rerender(at({ phase: "dirty" }));
    expect(screen.getByText("저장 전 변경 있음")).toBeInTheDocument();
    rerender(at({ phase: "saving" }));
    expect(screen.getByText("저장 중…")).toBeInTheDocument();
    rerender(at({ phase: "saved", lastSavedAt: Date.now() }));
    const text = screen.getByText("이 탭에 저장됨 · 방금");
    expect(liveAncestor(text)).toBeNull();
    await act(() => vi.advanceTimersByTimeAsync(12_000));
    expect(screen.getByText("이 탭에 저장됨 · 12초 전")).toBe(text);
    expect(onAnnounce).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("");
    expect(screen.queryByRole("button", { name: "다시 저장" })).toBeNull();
  });

  it("server 저장소는 \"저장됨 · …\"", () => {
    render(<SaveStatus state={{ phase: "saved", lastSavedAt: Date.now() }} persistence="server" onRetry={() => undefined} />);
    expect(screen.getByText("저장됨 · 방금")).toBeInTheDocument();
  });
});

describe("SaveStatus — 실패·오프라인 (E-AC-09)", () => {
  it("실패 alert 1회(연속 실패에도 글자 그대로) · \"다시 저장\" · 회복 status \"다시 저장했습니다\"", () => {
    const onAnnounce = vi.fn();
    const onRetry = vi.fn();
    const at = (state: AutosaveState) => <SaveStatus state={state} persistence="memory" onRetry={onRetry} onAnnounce={onAnnounce} />;
    const { rerender } = render(at({ phase: "saving" }));
    rerender(at({ phase: "failed", failure: "error" }));
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("저장하지 못했습니다");
    const firstNode = alert.firstChild;
    screen.getByRole("button", { name: "다시 저장" }).click();
    expect(onRetry).toHaveBeenCalledTimes(1);
    rerender(at({ phase: "saving", failure: "error" }));
    rerender(at({ phase: "failed", failure: "error" }));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(alert.firstChild).toBe(firstNode);
    expect(onAnnounce).not.toHaveBeenCalled();
    rerender(at({ phase: "saved", lastSavedAt: Date.now(), recovered: true }));
    expect(onAnnounce).toHaveBeenCalledTimes(1);
    expect(onAnnounce).toHaveBeenCalledWith("다시 저장했습니다");
    expect(alert).toHaveTextContent("");
  });

  it("오프라인 → 글자 + status 알림 1회", () => {
    const onAnnounce = vi.fn();
    const at = (state: AutosaveState) => <SaveStatus state={state} persistence="memory" onRetry={() => undefined} onAnnounce={onAnnounce} />;
    const { rerender } = render(at({ phase: "dirty" }));
    rerender(at({ phase: "offline", failure: "offline" }));
    rerender(at({ phase: "offline", failure: "offline" }));
    expect(screen.getByText("오프라인 — 연결되면 저장합니다")).toBeInTheDocument();
    expect(onAnnounce).toHaveBeenCalledTimes(1);
    expect(onAnnounce).toHaveBeenCalledWith("오프라인 — 연결되면 저장합니다");
  });
});

function Harness({ repo, initialDoc, onAnnounce }: { repo: DocSaveRepository; initialDoc: PageDoc; onAnnounce: (text: string) => void }) {
  const save = useDocSave({ repository: repo, projectId: initialDoc.projectId, initialDoc });
  return (
    <>
      <input aria-label="제목" value={save.doc.meta.title} onChange={(e) => save.edit({ ...save.doc, meta: { ...save.doc.meta, title: e.target.value } })} />
      <SaveStatus state={save.state} persistence={save.persistence} onRetry={save.retry} onAnnounce={onAnnounce} />
    </>
  );
}

describe("SaveStatus + useDocSave (E-AC-09 흐름)", () => {
  it("연속 2회 실패 → alert 1회 · 입력 유지 · 다시 저장 성공 → \"다시 저장했습니다\" · offline → online 저장 1회", async () => {
    const doc = sampleDoc();
    let failures = 2;
    let revision = doc.revision;
    const saveDoc = vi.fn(async (_p: string, _r: number, next: PageDoc) => {
      if (failures-- > 0) throw new ProjectRepositoryError("INFRA", "down");
      revision += 1;
      return { ...next, revision };
    });
    const onAnnounce = vi.fn();
    render(<Harness repo={{ persistence: "memory", saveDoc }} initialDoc={doc} onAnnounce={onAnnounce} />);
    const input = screen.getByRole("textbox", { name: "제목" });
    const type = (value: string) => fireEvent.change(input, { target: { value } });
    type("하나");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByRole("alert")).toHaveTextContent("저장하지 못했습니다");
    type("하나둘");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(saveDoc).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("alert")).toHaveTextContent("저장하지 못했습니다");
    expect(input).toHaveValue("하나둘");
    await act(async () => screen.getByRole("button", { name: "다시 저장" }).click());
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(saveDoc).toHaveBeenCalledTimes(3);
    expect(onAnnounce.mock.calls).toEqual([["다시 저장했습니다"]]);
    expect(input).toHaveValue("하나둘");

    act(() => window.dispatchEvent(new Event("offline")));
    type("하나둘셋");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(screen.getByText("오프라인 — 연결되면 저장합니다")).toBeInTheDocument();
    expect(saveDoc).toHaveBeenCalledTimes(3);
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    await act(async () => window.dispatchEvent(new Event("online")));
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(saveDoc).toHaveBeenCalledTimes(4);
  });
});
