/**
 * RS6-L3a CP1(PLAN 4절 L3 CP1 · INTEGRATE-6 5절 G2·G7 · RS6-AC-U6) — 편집기 훅 ↔ 저장 코어 배선: `change`마다 `core.edit` 1회 ·
 * dispose 뒤 디바운스 편집 보존(F9) · StrictMode 같은 토큰 · acquire/release effect. 저장소 = 앱 조립(로컬 영속 · createMemoryPersistence).
 */
import { act, renderHook } from "@testing-library/react";
import { Activity, StrictMode, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useDocSave } from "./useDocSave";
import { PROJECT, edited, startedRig, ticks } from "./save/testRig";

const strict = ({ children }: { readonly children: ReactNode }) => <StrictMode>{children}</StrictMode>;

describe("RS6-L3a CP1 · 편집 경로 = core.edit (G2)", () => {
  it("change마다 core.edit 동기 1회 · 코어 초안 = 마지막 편집", async () => {
    const { repo, doc, core } = await startedRig();
    const c = core();
    const edit = vi.spyOn(c, "edit");
    const { result } = renderHook(() => useDocSave({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 }));
    act(() => result.current.edit(edited(doc, "1")));
    expect(edit).toHaveBeenCalledTimes(1);
    act(() => result.current.edit(edited(doc, "2")));
    expect(edit).toHaveBeenCalledTimes(2);
    expect(c.view()).toMatchObject({ dirty: true, doc: { meta: { title: "2" } } });
  });

  // RS6-L3b(MQ-6-7 A · I6 3.1-1): 언마운트 저장 주체 = lease 해제 save 1회(스케줄러 dispose 저장은 그대로 0) — "저장 0" → "해제 save 1 · 커밋 전 초안 보존"
  it("F9: 디바운스 대기 중 언마운트 → 스케줄러 저장 0 · lease 해제 save 1회 · 커밋 전까지 코어 초안·dirty 보존", async () => {
    const { db, repo, doc, core } = await startedRig();
    const c = core();
    const save = vi.spyOn(c, "save");
    const gate = db.hold();
    const { result, unmount } = renderHook(() => useDocSave({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 20 }));
    act(() => result.current.edit(edited(doc, "pending")));
    unmount();
    await ticks(10);
    await new Promise((r) => setTimeout(r, 40));
    expect(save).toHaveBeenCalledTimes(1);
    expect(c.view()).toMatchObject({ dirty: true, doc: { meta: { title: "pending" } } });
    gate.release();
  });
});

describe("RS6-L3a CP1 · lease (G7 · RS6-AC-U6)", () => {
  it("StrictMode mount→cleanup→mount: 같은 토큰 · 코어 새로 열기 0 · 편집 없으면 mark 변화 0 · 언마운트 뒤 release", async () => {
    const { repo, doc, core } = await startedRig();
    const c = core();
    const opened = vi.spyOn(repo, "core");
    const acquire = vi.spyOn(c, "acquire");
    const release = vi.spyOn(c, "release");
    // 이 테스트 환경(React 19.3 · NODE_ENV=test)은 StrictMode에서 렌더만 2회, effect는 1회(실측 2/1) → effect 재마운트는 Activity로 같은 인스턴스를 숨겼다 보이며
    // 같은 동기 구간(StrictMode와 같이 microtask 전)에서 재현한다
    let visible = true;
    const { rerender, unmount } = renderHook(() => useDocSave({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 }), {
      wrapper: ({ children }: { readonly children: ReactNode }) => strict({ children: <Activity mode={visible ? "visible" : "hidden"}>{children}</Activity> }),
    });
    expect(opened.mock.calls.length).toBeGreaterThanOrEqual(2);
    expect(opened.mock.results.every((r) => r.value === c)).toBe(true);
    visible = false;
    act(() => rerender());
    visible = true;
    act(() => rerender());
    await ticks(2);
    expect(acquire.mock.calls.length).toBeGreaterThanOrEqual(2);
    const tokens = new Set(acquire.mock.results.map((r) => r.value as number));
    expect(tokens.size).toBe(1);
    expect(release).not.toHaveBeenCalled();
    expect(c.view().mark).toBe(0);
    unmount();
    await ticks(2);
    expect(release).toHaveBeenCalledTimes(1);
    expect(release).toHaveBeenCalledWith([...tokens][0]);
  });
});
