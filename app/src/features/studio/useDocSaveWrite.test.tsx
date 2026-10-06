import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError, type ProjectPersistence } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { useDocSave, type DocSaveRepository } from "./useDocSave";

/** ER-AC-S9 · S10 (EDITOR-REST SPEC r1 3.2) — 스냅샷·복원은 저장 먼저, 복원 결과는 저장 훅 경로로(revision·스케줄러 동기화) */
const titled = (doc: PageDoc, title: string): PageDoc => ({ ...doc, meta: { ...doc.meta, title } });

function repo(initial: PageDoc) {
  let stored = initial;
  let gate: Promise<void> | undefined;
  let open = () => {};
  let failNext = false;
  const order: string[] = [];
  const repository: DocSaveRepository & { persistence: ProjectPersistence } = {
    persistence: "memory",
    saveDoc: vi.fn(async (_p: string, expectedRevision: number, doc: PageDoc) => {
      order.push(`save:${expectedRevision}`);
      if (gate) await gate;
      if (failNext) {
        failNext = false;
        throw new ProjectRepositoryError("INFRA", "fail");
      }
      if (expectedRevision !== stored.revision) throw new ProjectRepositoryError("STALE_DOC", "stale", { doc: stored });
      stored = { ...doc, revision: stored.revision + 1 };
      order.push(`saved:${stored.revision}`);
      return stored;
    }),
    resolveConflict: vi.fn(async () => stored),
  };
  /** 저장소 쪽 복원 흉내 — expectedRevision 확인 뒤 revision +1 */
  const restore = vi.fn(async (expectedRevision: number) => {
    order.push(`restore:${expectedRevision}`);
    if (expectedRevision !== stored.revision) throw new ProjectRepositoryError("STALE_DOC", "stale", { doc: stored });
    stored = { ...titled(stored, "복원본"), revision: stored.revision + 1 };
    return stored;
  });
  return {
    repository,
    restore,
    order,
    stored: () => stored,
    hold: () => {
      gate = new Promise((res) => (open = () => ((gate = undefined), res())));
      return () => open();
    },
    failOnce: () => void (failNext = true),
  };
}

/** act 밖에서 시작한 약속을 렌더를 흘려 가며 기다린다 — act 콜백 안에서 기다리면 저장 상태 렌더가 막힌다 */
async function settle<T>(start: () => Promise<T>): Promise<T> {
  let promise!: Promise<T>;
  act(() => void (promise = start()));
  let done = false;
  void promise.finally(() => (done = true));
  while (!done) await act(async () => void (await new Promise((res) => setTimeout(res, 0))));
  return promise;
}

const mount = (r: ReturnType<typeof repo>, doc: PageDoc) => renderHook(() => useDocSave({ repository: r.repository, projectId: "p", initialDoc: doc, debounceMs: 60_000 }));

describe("useDocSave 저장 먼저 · 쓰기 채택 — ER-AC-S9 · S10", () => {
  it("진행 중 저장이 끝난 뒤에만 쓰기 1회(저장 revision으로) · 입력 직후여도 최신 입력이 먼저 저장된다", async () => {
    const doc = sampleDoc();
    const r = repo(doc);
    const { result } = mount(r, doc);
    const release = r.hold();
    act(() => result.current.edit(titled(doc, "첫 입력")));
    act(() => result.current.retry());
    act(() => result.current.edit(titled(doc, "둘째 입력")));
    const adopted = settle(() => result.current.adopt(r.restore));
    await act(async () => release());
    await adopted;
    expect(r.order).toEqual([`save:${doc.revision}`, `saved:${doc.revision + 1}`, `save:${doc.revision + 1}`, `saved:${doc.revision + 2}`, `restore:${doc.revision + 2}`]);
    expect(r.repository.saveDoc).toHaveBeenLastCalledWith("p", doc.revision + 1, expect.objectContaining({ meta: expect.objectContaining({ title: "둘째 입력" }) }));
  });

  it("저장 실패 · 충돌이면 쓰기 0 · undefined", async () => {
    const doc = sampleDoc();
    const r = repo(doc);
    const { result } = mount(r, doc);
    act(() => result.current.edit(titled(doc, "입력")));
    r.failOnce();
    expect(await settle(() => result.current.adopt(r.restore))).toBeUndefined();
    expect(r.restore).not.toHaveBeenCalled();
    expect(result.current.state.phase).toBe("failed");
  });

  it("채택 = 화면 문서·revision·스케줄러(saved, 추가 저장 0) 동기화 → 다음 편집 저장 STALE_DOC 0 · revision 연속", async () => {
    const doc = sampleDoc();
    const r = repo(doc);
    const { result } = mount(r, doc);
    await settle(() => result.current.adopt(r.restore));
    expect(result.current.doc.meta.title).toBe("복원본");
    expect(result.current.state.phase).toBe("saved");
    expect(result.current.savedRevision()).toBe(doc.revision + 1);
    expect(r.repository.saveDoc).not.toHaveBeenCalled();
    act(() => result.current.edit(titled(result.current.doc, "복원 뒤 편집")));
    expect(await settle(() => result.current.flushed())).toBe(true);
    expect(r.repository.saveDoc).toHaveBeenCalledWith("p", doc.revision + 1, expect.anything());
    expect(result.current.state.phase).toBe("saved");
    expect(result.current.savedRevision()).toBe(doc.revision + 2);
  });
});
