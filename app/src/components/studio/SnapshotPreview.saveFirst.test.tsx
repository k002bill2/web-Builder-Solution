/**
 * RS6-L4 CP4(L3b 인계 — "저장 뒤 다시 복원") — 복원 전 저장 먼저가 실패하면 복원 0 · 전용 문장 alert 1곳(UX-5 · INTEGRATE-6 8.3).
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProjectRepository } from "../../data/projectRepository";
import type { Snapshot } from "./useSnapshots";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { UseDocSave } from "../../features/studio/useDocSave";
import SnapshotPreview from "./SnapshotPreview";

describe("RS6-L4 CP4 · 스냅샷 복원 저장 먼저 실패", () => {
  it("adopt = undefined(저장 먼저 실패) → '저장하지 못해 복원하지 않았습니다 · 저장한 뒤 다시 복원하세요' alert · restoreSnapshot 0 · onRestored 0", async () => {
    const restoreSnapshot = vi.fn();
    const onRestored = vi.fn();
    const save = { doc: {}, adopt: vi.fn(async () => undefined) } as unknown as UseDocSave;
    render(
      <SnapshotPreview
        snapshot={{ snapshotId: "s1", name: "수동 1" } as Snapshot}
        root={{ current: null }}
        save={save}
        repository={{ restoreSnapshot, listSnapshots: vi.fn() } as unknown as ProjectRepository}
        projectId="p1"
        isDoc={(doc): doc is PageDoc => doc !== undefined}
        onBack={vi.fn()}
        onRestored={onRestored}
      />,
    );
    await act(async () => void fireEvent.click(screen.getByRole("button", { name: "이 스냅샷으로 복원" })));
    expect(screen.getByRole("alert")).toHaveTextContent(/^저장하지 못해 복원하지 않았습니다 · 저장한 뒤 다시 복원하세요$/);
    expect(restoreSnapshot).not.toHaveBeenCalled();
    expect(onRestored).not.toHaveBeenCalled();
  });
});
