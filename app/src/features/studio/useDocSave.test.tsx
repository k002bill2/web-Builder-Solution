import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository } from "../../data/memoryGenerationRepository";
import { createMemoryProjectRepository } from "../../data/memoryProjectRepository";
import { ProjectRepositoryError, type ProjectPersistence, type ProjectRepository } from "../../data/projectRepository";
import { createStudioStore } from "../../data/studioStore";
import { isTerminal } from "../../domain/generation";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { hashDoc } from "../../engine/ops/hash";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { boardOf, FIXTURE_CATALOG } from "../../test/compareFixtures";
import { useDocSave, type DocSaveRepository } from "./useDocSave";

const titled = (doc: PageDoc, title: string): PageDoc => ({ ...doc, meta: { ...doc.meta, title } });

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

/** 목 저장소 — revision 불일치는 STALE_DOC(최신 동봉), 성공이면 revision +1 */
function mockRepo(initial: PageDoc, persistence: ProjectPersistence = "memory") {
  let stored = initial;
  const calls: { expectedRevision: number; doc: PageDoc }[] = [];
  let gate: Promise<void> | undefined;
  let failNext: Error | undefined;
  const repo: DocSaveRepository & { persistence: ProjectPersistence } = {
    persistence,
    saveDoc: vi.fn(async (_projectId: string, expectedRevision: number, doc: PageDoc) => {
      calls.push({ expectedRevision, doc });
      if (gate) await gate;
      if (failNext) {
        const error = failNext;
        failNext = undefined;
        throw error;
      }
      if (expectedRevision !== stored.revision) throw new ProjectRepositoryError("STALE_DOC", "stale", { doc: stored });
      stored = { ...doc, revision: stored.revision + 1 };
      return stored;
    }),
  };
  return {
    repo,
    calls,
    hold: () => {
      const d = deferred<void>();
      gate = d.promise;
      return () => {
        gate = undefined;
        d.resolve();
      };
    },
    failOnce: (error: Error) => {
      failNext = error;
    },
    bumpElsewhere: (title: string) => {
      stored = { ...titled(stored, title), revision: stored.revision + 1 };
      return stored;
    },
  };
}

function renderDocSave(repo: DocSaveRepository & { persistence: ProjectPersistence }, initialDoc: PageDoc) {
  return renderHook(() => useDocSave({ repository: repo, projectId: initialDoc.projectId, initialDoc }));
}

function unloadBlocked(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("useDocSave — 자동 저장 타이밍 (E-AC-07)", () => {
  it("마지막 변경 2초 뒤 저장 1회 — 보고 있던 revision + hashDoc", async () => {
    const doc = sampleDoc();
    const m = mockRepo(doc);
    const { result } = renderDocSave(m.repo, doc);
    act(() => result.current.edit(titled(doc, "새 제목")));
    expect(result.current.doc.meta.title).toBe("새 제목");
    await act(() => vi.advanceTimersByTimeAsync(1999));
    expect(m.calls).toHaveLength(0);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(m.calls).toHaveLength(1);
    expect(m.calls[0]!.expectedRevision).toBe(3);
    expect(m.calls[0]!.doc.hash).toBe(hashDoc(titled(doc, "새 제목")));
    expect(result.current.state.phase).toBe("saved");
  });

  it("1초 간격 연속 입력 30초 → 30초 시점까지 저장 ≥ 1회(maxWait)", async () => {
    const doc = sampleDoc();
    const m = mockRepo(doc);
    const { result } = renderDocSave(m.repo, doc);
    for (let i = 0; i < 30; i++) {
      act(() => result.current.edit(titled(doc, `제목 ${i}`)));
      await act(() => vi.advanceTimersByTimeAsync(1000));
    }
    expect(m.calls.length).toBeGreaterThanOrEqual(1);
  });

  it("저장 중 변경 3개 → 끝난 뒤 저장 1회(최신 문서)", async () => {
    const doc = sampleDoc();
    const m = mockRepo(doc);
    const { result } = renderDocSave(m.repo, doc);
    const release = m.hold();
    act(() => result.current.edit(titled(doc, "하나")));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.state.phase).toBe("saving");
    for (const t of ["둘", "셋", "넷"]) act(() => result.current.edit(titled(doc, t)));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await act(async () => release());
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(m.calls.map((c) => c.doc.meta.title)).toEqual(["하나", "넷"]);
    expect(result.current.state.phase).toBe("saved");
  });

  it("연속 저장은 저장소가 돌려준 revision을 쓴다(STALE_DOC 없음)", async () => {
    const doc = sampleDoc();
    const m = mockRepo(doc);
    const { result } = renderDocSave(m.repo, doc);
    act(() => result.current.edit(titled(doc, "하나")));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    act(() => result.current.edit(titled(doc, "둘")));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(m.calls.map((c) => c.expectedRevision)).toEqual([3, 4]);
    expect(result.current.state.phase).toBe("saved");
  });
});

describe("useDocSave — 실제 메모리 저장소 연속 저장", () => {
  it("startDoc 문서 → 편집 2회 저장 → revision 3 · getDoc = 마지막 편집", async () => {
    vi.useRealTimers();
    const store = createStudioStore();
    const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
    await board.confirmProfile(1, 0);
    const gen = createMemoryGenerationRepository({ store });
    let job = await gen.requestGeneration("profile-1", 1);
    for (let i = 0; i < 10 && !isTerminal(job.state); i++) job = await gen.getJob(job.jobId);
    const repo = createMemoryProjectRepository({ store }) as unknown as ProjectRepository<PageDoc>;
    const { doc } = await repo.startDoc("project-1", 1, "B", "create");
    const { result } = renderHook(() => useDocSave({ repository: repo, projectId: "project-1", initialDoc: doc, debounceMs: 5 }));
    act(() => result.current.edit(titled(doc, "첫 편집")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("saved"));
    act(() => result.current.edit(titled(doc, "둘째 편집")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("saved"));
    const latest = (await repo.getDoc("project-1"))!;
    expect(latest.revision).toBe(3);
    expect(latest.meta.title).toBe("둘째 편집");
  });
});

describe("useDocSave — 떠나기 경고 (E-AC-12 · server 목)", () => {
  it("server: 변경 없음 미등록 · 실패 때 등록", async () => {
    const doc = sampleDoc();
    const m = mockRepo(doc, "server");
    const { result, unmount } = renderDocSave(m.repo, doc);
    expect(unloadBlocked()).toBe(false);
    m.failOnce(new ProjectRepositoryError("INFRA", "down"));
    act(() => result.current.edit(titled(doc, "하나")));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.state.phase).toBe("failed");
    expect(unloadBlocked()).toBe(true);
    unmount();
  });

  it("server: STALE_DOC 때 등록 · memory는 늘 등록", async () => {
    const doc = sampleDoc();
    const m = mockRepo(doc, "server");
    const { result, unmount } = renderDocSave(m.repo, doc);
    m.bumpElsewhere("다른 탭");
    act(() => result.current.edit(titled(doc, "내 편집")));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.state.phase).toBe("stale");
    expect(unloadBlocked()).toBe(true);
    unmount();
    const mem = renderDocSave(mockRepo(doc, "memory").repo, doc);
    expect(unloadBlocked()).toBe(true);
    mem.unmount();
  });
});
