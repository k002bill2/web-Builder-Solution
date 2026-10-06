import { renderHook } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectRepository } from "../../data/projectRepository";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import type { UseDocSave } from "../../features/studio/useDocSave";
import { useSnapshots, type SnapshotContext } from "./useSnapshots";

const ctx = (edit: UseDocSave["edit"]): SnapshotContext => ({
  repository: { listSnapshots: async () => [] } as unknown as ProjectRepository,
  projectId: "p1",
  save: { doc: sampleDoc(), edit } as unknown as UseDocSave,
  root: createRef(),
  heading: createRef(),
  onNotice: () => undefined,
});

describe("useSnapshots.edit — 안정 참조(마감 수정 4차)", () => {
  it("미리보기가 바뀌지 않는 다시 그리기에서는 같은 함수 — useSectionOps 등 의존 콜백이 렌더마다 다시 만들어지지 않는다", () => {
    const write = vi.fn();
    const context = ctx(write);
    const { result, rerender } = renderHook(() => useSnapshots(context));
    const first = result.current.edit;
    rerender();
    expect(result.current.edit).toBe(first);
    expect(first(sampleDoc())).toBe(true);
    expect(write).toHaveBeenCalledTimes(1);
  });
});
