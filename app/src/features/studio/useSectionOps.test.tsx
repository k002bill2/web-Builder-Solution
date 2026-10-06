import { act, renderHook } from "@testing-library/react";
import { vi } from "vitest";
import type { ReactNode } from "react";
import { ProfileRepositoryProvider } from "../../data/ProfileRepositoryContext";
import type { GenerationRepository } from "../../data/generationRepository";
import type { ProfileRepository } from "../../data/profileRepository";
import type { ProjectRepository } from "../../data/projectRepository";
import type { HistoryKeys } from "./opAfter";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { useSectionOps } from "./useSectionOps";

/** 연산 훅 — 프로필 조회 실패가 연산 사슬을 끊지 않는다(Codex 전 자체 점검) */
const UNUSED = () => Promise.reject(new Error("쓰지 않는다"));

function wrapperFor(profiles: ProfileRepository) {
  return function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <ProfileRepositoryProvider repository={profiles} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
        {children}
      </ProfileRepositoryProvider>
    );
  };
}

describe("useSectionOps", () => {
  it("프로필 조회가 실패하면 연산은 거부(이유 문장)되고, 다음 연산은 다시 조회해 성공한다 — 사슬이 끊기지 않는다", async () => {
    let calls = 0;
    const profiles = {
      getProfile: async () => {
        calls += 1;
        // 1 = 마운트 조회 · 2 = 첫 연산의 다시 조회 — 둘 다 실패, 3 = 두 번째 연산
        if (calls <= 2) throw new Error("네트워크");
        return undefined;
      },
    } as unknown as ProfileRepository;
    const edits: PageDoc[] = [];
    const { result } = renderHook(() => useSectionOps({ doc: sampleDoc(), edit: (d) => void edits.push(d), profileId: "profile-1" }), { wrapper: wrapperFor(profiles) });
    let first: Awaited<ReturnType<typeof result.current.run>> | undefined;
    await act(async () => {
      first = await result.current.run({ kind: "remove", instanceId: "s-faq" }, "삭제", true);
    });
    expect(first).toEqual({ ok: false, reason: "프로필을 불러오지 못해 목적을 확인할 수 없습니다 — 다시 시도해 주세요" });
    expect(edits).toHaveLength(0);
    let second: Awaited<ReturnType<typeof result.current.run>> | undefined;
    await act(async () => {
      second = await result.current.run({ kind: "remove", instanceId: "s-faq" }, "삭제", true);
    });
    expect(second?.ok).toBe(true);
    expect(edits).toHaveLength(1);
    expect(calls).toBe(3);
  });

  it("첫 연산이 끝나기 전에 언마운트되면 단축키 리스너를 붙이지 않는다 — 떠난 편집기의 Ctrl+Z가 실행 취소를 부르지 않는다(Codex fix2 P2)", async () => {
    let release: (value: undefined) => void = () => undefined;
    const pending = new Promise<undefined>((resolve) => {
      release = resolve;
    });
    const profiles = { getProfile: () => pending } as unknown as ProfileRepository;
    const step = vi.fn();
    const keys = { current: { locked: false, tell: {} as HistoryKeys["tell"], step } as HistoryKeys | undefined };
    const { result, unmount } = renderHook(() => useSectionOps({ doc: sampleDoc(), edit: () => undefined, profileId: "profile-1", keys }), { wrapper: wrapperFor(profiles) });
    const outcome = result.current.run({ kind: "remove", instanceId: "s-faq" }, "삭제", true);
    unmount();
    await act(async () => {
      release(undefined);
      await outcome;
    });
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "z", ctrlKey: true, bubbles: true }));
    expect(step).not.toHaveBeenCalled();
  });
});
