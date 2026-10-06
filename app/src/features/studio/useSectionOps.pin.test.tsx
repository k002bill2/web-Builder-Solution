import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { ProfileRepositoryProvider } from "../../data/ProfileRepositoryContext";
import type { GenerationRepository } from "../../data/generationRepository";
import type { ProfileRepository } from "../../data/profileRepository";
import type { ProjectRepository } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import type { UndoStack } from "./undoStack";
import { useSectionOps, type OpOutcome } from "./useSectionOps";

/** 동작 고정(ER-OFF2) — run의 연산 뒤 꼬리(docRef · 기록 스택 · 되돌리기 대상 · edit)를 청크로 옮기기 전후 같은지 */
const stacks: UndoStack[] = [];
vi.mock("./undoStack", async (importOriginal) => {
  const original = await importOriginal<typeof import("./undoStack")>();
  return {
    ...original,
    useUndoStack: () => {
      const stack = original.useUndoStack();
      if (!stacks.includes(stack)) stacks.push(stack);
      return stack;
    },
  };
});

const UNUSED = () => Promise.reject(new Error("쓰지 않는다"));
const profiles = { getProfile: async () => undefined } as unknown as ProfileRepository;
function Wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <ProfileRepositoryProvider repository={profiles} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
      {children}
    </ProfileRepositoryProvider>
  );
}

function setup(accept = true) {
  stacks.length = 0;
  const edits: PageDoc[] = [];
  const edit = (next: PageDoc) => {
    edits.push(next);
    return accept;
  };
  const view = renderHook(({ doc }) => useSectionOps({ doc, edit, profileId: "profile-1" }), { wrapper: Wrapper, initialProps: { doc: sampleDoc() } });
  const run = async (...args: Parameters<typeof view.result.current.run>) => {
    let outcome: OpOutcome | undefined;
    await act(async () => {
      outcome = await view.result.current.run(...args);
    });
    return outcome!;
  };
  return { ...view, edits, run, stack: () => stacks[0]! };
}

describe("useSectionOps.run 꼬리 동작 고정 (ER-OFF2 A2)", () => {
  it("undoable 연산: edit 1회 = 결과 문서 · outcome {ok, result, before} · 기록 스택 {label, before, after} · 되돌리기 대상 → undoLast = 이전 문서", async () => {
    const { run, edits, stack, result, rerender } = setup();
    const before = result.current.canUndoLast;
    const doc = sampleDoc();
    const outcome = await run({ kind: "remove", instanceId: "s-faq" }, "삭제", true);
    expect(before).toBe(false);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.before).toEqual(doc);
    expect(outcome.result.instanceId).toBe("s-faq");
    expect(edits).toEqual([outcome.result.doc]);
    expect(stack().size()).toBe(1);
    rerender({ doc: outcome.result.doc });
    expect(result.current.canUndoLast).toBe(true);
    let undone: PageDoc | undefined;
    act(() => {
      undone = result.current.undoLast();
    });
    expect(undone).toBe(outcome.before);
    expect(edits.at(-1)).toBe(outcome.before);
    expect(stack().size()).toBe(0);
  });

  it("기록 스택 항목 = {label, before, after} 그대로(pop으로 확인)", async () => {
    const { run, stack } = setup();
    const outcome = await run({ kind: "move", instanceId: "s-faq", direction: "up" }, "이동");
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(stack().pop()).toEqual({ label: "이동", before: outcome.before, after: outcome.result.doc });
  });

  it("undoable 아님(이동): 스택에는 쌓지만 되돌리기 대상 없음 — canUndoLast false · undoLast undefined", async () => {
    const { run, result, rerender, stack } = setup();
    const outcome = await run({ kind: "move", instanceId: "s-faq", direction: "up" }, "이동");
    if (!outcome.ok) throw new Error("이동 실패");
    rerender({ doc: outcome.result.doc });
    expect(stack().size()).toBe(1);
    expect(result.current.canUndoLast).toBe(false);
    let undone: PageDoc | undefined = sampleDoc();
    act(() => {
      undone = result.current.undoLast();
    });
    expect(undone).toBeUndefined();
  });

  it("edit가 거절(false, 미리보기 편집 경계)해도 현재 run은 ok · 스택에 쌓고 다음 연산은 결과 문서 기준(docRef) — 현재 동작 그대로 고정", async () => {
    const { run, edits, stack } = setup(false);
    const first = await run({ kind: "remove", instanceId: "s-faq" }, "삭제", true);
    expect(first.ok).toBe(true);
    expect(edits).toHaveLength(1);
    expect(stack().size()).toBe(1);
    const second = await run({ kind: "remove", instanceId: "s-faq" }, "삭제", true);
    expect(second.ok).toBe(false);
    expect(edits).toHaveLength(1);
    expect(stack().size()).toBe(1);
  });

  it("테마 연산: 문서 전체(instanceId '' · index -1) · 값 비교 결과 · edit 1회 · 되돌리기 대상", async () => {
    const { run, edits, result, rerender, stack } = setup();
    const outcome = await run({ kind: "theme", profileVersion: 3 }, "테마 바꾸기", true);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.result).toMatchObject({ instanceId: "", index: -1, lostSlotKeys: [] });
    expect(outcome.result.values?.changed).toEqual([]);
    expect(outcome.result.doc.profileVersion).toBe(3);
    expect(edits).toEqual([outcome.result.doc]);
    expect(stack().size()).toBe(1);
    rerender({ doc: outcome.result.doc });
    expect(result.current.canUndoLast).toBe(true);
  });

  it("엔진 거부: ok false + 엔진 문장 · edit 0 · 스택 0 · 되돌리기 대상 그대로", async () => {
    const { run, edits, stack, result } = setup();
    const outcome = await run({ kind: "remove", instanceId: "s-header" }, "삭제", true);
    expect(outcome.ok).toBe(false);
    if (outcome.ok) return;
    expect(outcome.reason.length).toBeGreaterThan(0);
    expect(edits).toHaveLength(0);
    expect(stack().size()).toBe(0);
    expect(result.current.canUndoLast).toBe(false);
  });
});
