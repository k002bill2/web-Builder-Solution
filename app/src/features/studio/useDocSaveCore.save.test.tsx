/**
 * RS6-L3a CP2(PLAN 4절 L3 CP2 · INTEGRATE-6 5절 G1·G7 · RS6-AC-U3 · C5 T2) — 저장 대상 = `core.save()` · DocBook 반영은 saved 뒤 ·
 * 실패 시 DocBook revision 변화 0 · 재진입 seed = `view()`(거짓 STALE 0) · 결과 매핑(not-persistent = 저장됨 · readonly = 이탈 허용).
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createLockRegistry } from "../../data/persistence/fakeLocks";
import { useDocSave } from "./useDocSave";
import { PROJECT, edited, otherTab, startedRig } from "./save/testRig";

const hook = (props: Parameters<typeof useDocSave>[0]) => renderHook(() => useDocSave(props));

describe("RS6-L3a CP2 · 저장 대상 = core.save", () => {
  it("로컬: 스케줄러 저장 1회 = core.save 1회 · saveDoc 0 · IDB·DocBook = 편집 · savedRevision = 커밋 revision", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    const save = vi.spyOn(c, "save");
    const saveDoc = vi.spyOn(repo, "saveDoc");
    const { result } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 5 });
    act(() => result.current.edit(edited(doc, "편집")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("saved"));
    expect(save).toHaveBeenCalledTimes(1);
    expect(saveDoc).not.toHaveBeenCalled();
    const stored = await db.doc();
    expect([stored?.doc.meta.title, stored?.doc.revision]).toEqual(["편집", doc.revision + 1]);
    expect((await repo.getDoc(PROJECT))?.revision).toBe(doc.revision + 1);
    expect(result.current.savedRevision()).toBe(doc.revision + 1);
  });

  it("U3: 커밋 실패 → failed · DocBook revision·IDB 변화 0 · 코어 초안 dirty 보존", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    const { result } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 5 });
    db.failNext("AbortError");
    act(() => result.current.edit(edited(doc, "실패할 편집")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("failed"));
    expect((await repo.getDoc(PROJECT))?.revision).toBe(doc.revision);
    expect((await db.doc())?.doc.revision).toBe(doc.revision);
    expect(c.view()).toMatchObject({ dirty: true, doc: { meta: { title: "실패할 편집" } } });
    expect(result.current.savedRevision()).toBe(doc.revision);
  });

  it("memory 모드: core.save(not-persistent) = 저장됨 · savedRevision = DocBook revision", async () => {
    const { repo, doc, core } = await startedRig({ memory: true });
    const save = vi.spyOn(core(), "save");
    const { result } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 5 });
    act(() => result.current.edit(edited(doc, "메모리 편집")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("saved"));
    expect(save).toHaveBeenCalledTimes(1);
    const latest = await repo.getDoc(PROJECT);
    expect([latest?.meta.title, latest?.revision]).toEqual(["메모리 편집", doc.revision + 1]);
    expect(result.current.savedRevision()).toBe(doc.revision + 1);
  });

  it("C5 T2: 디바운스 중 언마운트 → 재진입(getDoc 문서) seed = 코어 초안 · 저장 1회 · STALE 0 · IDB = 초안", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    const first = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    act(() => first.result.current.edit(edited(doc, "초안")));
    first.unmount();
    const entered = (await repo.getDoc(PROJECT))!;
    expect(entered.meta.title).not.toBe("초안");
    const phases: string[] = [];
    const save = vi.spyOn(c, "save");
    const again = renderHook(() => {
      const s = useDocSave({ repository: repo, projectId: PROJECT, initialDoc: entered, debounceMs: 5 });
      phases.push(s.state.phase);
      return s;
    });
    expect(again.result.current.doc.meta.title).toBe("초안");
    await vi.waitFor(() => expect(again.result.current.state.phase).toBe("saved"));
    expect(save).toHaveBeenCalledTimes(1);
    expect(phases).not.toContain("stale");
    expect((await db.doc())?.doc.meta.title).toBe("초안");
  });

  it("readonly(다른 탭 writer): core.save failed{readonly} → failed · leave() = true(이탈 허용) · 쓰기 0", async () => {
    const locks = createLockRegistry();
    const { db } = await startedRig({ locks: locks.tab() });
    const b = await otherTab(db, { locks: locks.tab() });
    const save = vi.spyOn(b.core, "save");
    const { result } = hook({ repository: b.repo, projectId: PROJECT, initialDoc: b.seed, debounceMs: 5 });
    const start = db.ops.length;
    act(() => result.current.edit(edited(b.seed, "B")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("failed"));
    expect(save).toHaveBeenCalled();
    // act 밖에서 시작한 약속을 렌더를 흘려 가며 기다린다(snapshotRevision.test `settle`과 같은 방식)
    let left: Promise<boolean> | undefined;
    act(() => void (left = result.current.leave()));
    let done: boolean | undefined;
    void left!.then((v) => (done = v));
    while (done === undefined) await act(async () => void (await new Promise((r) => setTimeout(r, 0))));
    expect(done).toBe(true);
    expect(db.since(start)).toEqual([]);
  });

  it("reject 매핑(L2 QA 4절): core.save reject → failed · 거짓 saved 0 · DocBook 변화 0", async () => {
    const { repo, doc, core } = await startedRig();
    vi.spyOn(core(), "save").mockRejectedValueOnce(new Error("chunk"));
    const { result } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 5 });
    act(() => result.current.edit(edited(doc, "x")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("failed"));
    expect((await repo.getDoc(PROJECT))?.revision).toBe(doc.revision);
  });
});
