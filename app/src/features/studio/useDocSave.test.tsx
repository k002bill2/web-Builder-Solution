import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { READ_ONLY_TAB } from "../../data/persistence/infra";
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
import { withSaveCore } from "./testing/coreFixture";
import type { CoreKeeper } from "./save/saveCore";

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
  // 코어 있는 저장소(RS6-L3b CP-A) — 저장 = 제품 코어 경유 · 가짜 포트 commit이 이 saveDoc을 부른다
  const repo = withSaveCore({
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
  });
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
    const repo = createMemoryProjectRepository({ store }) as unknown as ProjectRepository<PageDoc> & Required<CoreKeeper>;
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

// RS6-L3b(I6 3.1-2 · D6-11): "떠나기 경고(E-AC-12 · server 목)" 2건은 경고 소유가 코어 레지스트리로 옮겨 `useDocSaveLeave.test.tsx`(실제 저장소)로 이전

describe("useDocSave — STALE_DOC 충돌 (E-AC-10)", () => {
  async function staleSetup() {
    const doc = sampleDoc();
    const m = mockRepo(doc);
    const hook = renderDocSave(m.repo, doc);
    const theirs = m.bumpElsewhere("다른 탭 편집");
    act(() => hook.result.current.edit(titled(doc, "내 편집")));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    return { doc, m, hook, theirs };
  }

  // RS6-L4 R2(I6 8.1 · Jarvis 결정 ①): 다른 탭 커밋(포트 stale) = `stale` 환경 행 — 충돌 영역(conflict) 대신 failed + 출처 reason stale
  it("다른 탭 stale(포트) = failed + 출처 reason stale(문구) · 충돌 영역 없음 · 화면 문서 = 내 편집 · 다른 탭 문서로 덮지 않음", async () => {
    const { m, hook, theirs } = await staleSetup();
    const { result } = hook;
    expect(result.current.state.phase).toBe("failed");
    expect(result.current.source).toMatchObject({ reason: "stale", text: "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요" });
    expect(result.current.doc.meta.title).toBe("내 편집");
    // RS7-A(B-RS-07): 충돌 영역·해결 경로 제거 — 이전 `conflict` toBeUndefined → 이후 키 자체 0(resolve 포함, 단언 강화)
    expect(result.current).not.toHaveProperty("conflict");
    expect(result.current).not.toHaveProperty("resolve");
    expect(result.current.doc).not.toEqual(theirs);
    // 이전: stale 단계 = 고르기 전 자동 저장 0 · 이후(failed 행): 편집·retry는 저장을 내지만 포트가 모두 거절 — 다른 탭 커밋을 덮지 않고 stale 행 그대로
    act(() => result.current.edit(titled(result.current.doc, "내 편집 2")));
    act(() => result.current.retry());
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    const settled = await Promise.allSettled(vi.mocked(m.repo.saveDoc).mock.results.map((r) => r.value));
    expect(settled.length).toBeGreaterThan(1);
    expect(settled.every((r) => r.status === "rejected")).toBe(true);
    expect(result.current.doc.meta.title).toBe("내 편집 2");
    expect(result.current.state.phase).toBe("failed");
    expect(result.current.source.reason).toBe("stale");
  });

  // RS7-A(B-RS-07): "내 편집으로 저장"·"다른 편집 불러오기"·"해결 실패" 3건 삭제 — `resolve` 제거(제품 도달 0, REPORT CP0·CP1 표)
});

describe("RS6-L4 CP2 · report(저장 확인 결과 → 출처)", () => {
  it("readonly 실패 → report() = reason 지움 · 스케줄러 settle(추가 저장 0) · report(reason) = 그 reason", async () => {
    const doc = sampleDoc();
    const m = mockRepo(doc, "local");
    const { result } = renderDocSave(m.repo, doc);
    m.failOnce(new ProjectRepositoryError("INFRA", `저장 — ${READ_ONLY_TAB}`));
    act(() => result.current.edit(titled(doc, "읽기 전용")));
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(result.current.source.reason).toBe("readonly");
    act(() => result.current.report({ reason: "newer", text: "x" }));
    expect(result.current.source).toMatchObject({ reason: "newer", text: "x" });
    act(() => result.current.report());
    expect(result.current.source.reason).toBeUndefined();
    expect(result.current.state.phase).toBe("saved");
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(m.repo.saveDoc).toHaveBeenCalledTimes(1);
  });
});
