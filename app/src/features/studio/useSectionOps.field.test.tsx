import { act, renderHook } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRepositoryProvider } from "../../data/ProfileRepositoryContext";
import type { GenerationRepository } from "../../data/generationRepository";
import type { ProfileRepository } from "../../data/profileRepository";
import type { ProjectRepository } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { setSlot } from "../../engine/ops/slotOps";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { loadDocEngine } from "./docOps";
import { useSectionOps } from "./useSectionOps";

/** 필드 편집 묶음 실행 취소 (FIELD-UNDO SPEC r0 4.1 · 4.6 · FU-AC-1 · 4 · 7 · 10 · 11) — 훅 단위, 가짜 타이머 */
const UNUSED = () => Promise.reject(new Error("쓰지 않는다"));
const profiles = { getProfile: async () => undefined } as unknown as ProfileRepository;
function Wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <ProfileRepositoryProvider repository={profiles} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
      {children}
    </ProfileRepositoryProvider>
  );
}

const TITLE = "s-hero-title";
function setup(locked = () => false) {
  const start = sampleDoc();
  return renderHook(
    () => {
      const [doc, setDoc] = useState(start);
      const ops = useSectionOps({ doc, edit: (next) => (locked() ? false : void setDoc(next)), profileId: "profile-1" });
      return { doc, ops, start };
    },
    { wrapper: Wrapper },
  );
}
type View = ReturnType<typeof setup>["result"];
const title = (doc: PageDoc) => doc.sections.find((s) => s.instanceId === "s-hero")!.slots.title;
/** 칸 1번 입력 — 청크 응답(마이크로태스크)까지 흘린다 */
const type = async (result: View, value: string, composing = false, key = TITLE, label = "Hero 제목 편집", slot = "title") =>
  act(async () => result.current.ops.field(key, label, setSlot(result.current.doc, "s-hero", slot, value), composing));
/** 칸 blur = 문서 focusout(조작 뒤 청크가 묶음 첫 입력에 단 1회 리스너) */
const blur = () => act(() => void document.dispatchEvent(new FocusEvent("focusout")));
const wait = (ms: number) => act(async () => void vi.advanceTimersByTime(ms));

beforeEach(async () => {
  await loadDocEngine();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
});
afterEach(() => vi.useRealTimers());

describe("묶음 경계 — FU-AC-1 · 11", () => {
  it("같은 칸 10자(간격 < 600ms) + 599ms = 기록 0 · 600ms = 1건 · 실행 취소 = 입력 전 문서", async () => {
    const { result } = setup();
    for (let i = 1; i <= 10; i++) {
      await type(result, "봄 신메뉴 출시".slice(0, i) || `x${i}`);
      await wait(500);
    }
    await wait(99);
    expect(result.current.ops.peekStep(false)).toBeUndefined();
    await wait(1);
    expect(result.current.ops.peekStep(false)).toBe("Hero 제목 편집");
    await act(async () => void (await result.current.ops.step(false, { setNotice: () => undefined, goTo: () => undefined })));
    expect(result.current.doc).toBe(result.current.start);
    expect(result.current.ops.peekStep(false)).toBeUndefined();
    expect(result.current.ops.peekStep(true)).toBe("Hero 제목 편집");
  });

  it("조합 중 입력(isComposing) 뒤 600ms = 닫지 않음 · 조합 끝 입력 뒤 600ms = 닫음 · 조합 중 닫기(blur) = 닫음", async () => {
    const { result } = setup();
    await type(result, "ㅂ", true);
    await wait(1000);
    expect(result.current.ops.peekStep(false)).toBeUndefined();
    await type(result, "봄", false);
    await wait(600);
    expect(result.current.ops.peekStep(false)).toBe("Hero 제목 편집");
    await type(result, "봄 ㅅ", true);
    blur();
    await wait(1000);
    await act(async () => void (await result.current.ops.step(false, { setNotice: () => undefined, goTo: () => undefined })));
    expect(title(result.current.doc)).toBe("봄");
  });

  it("다른 칸 입력 = 앞 묶음이 그 직전 문서로 닫힌다(blur 없이도) — FU-AC-2", async () => {
    const { result } = setup();
    await type(result, "새 제목");
    await type(result, "새 부제", false, "s-hero-subtitle", "Hero 부제 편집", "subtitle");
    blur();
    expect(result.current.ops.peekStep(false)).toBe("Hero 부제 편집");
    await act(async () => void (await result.current.ops.step(false, { setNotice: () => undefined, goTo: () => undefined })));
    expect(title(result.current.doc)).toBe("새 제목");
    expect(result.current.ops.peekStep(false)).toBe("Hero 제목 편집");
  });
});

describe("기록 0 · 다시 실행 잘림 · 거절 — FU-AC-4 · 7 · 10", () => {
  it("쳤다 지워 원래 값 = 기록 0 · 문서는 입력 전 문서 그대로(사슬 유지)", async () => {
    const { result } = setup();
    const before = title(result.current.start);
    await type(result, `${before as string}x`);
    await type(result, before as string);
    await wait(600);
    expect(result.current.ops.peekStep(false)).toBeUndefined();
    expect(result.current.doc).toBe(result.current.start);
  });

  it("실행 취소 뒤 필드 입력 = 다시 실행 목록 버림", async () => {
    const { result } = setup();
    await type(result, "하나");
    await wait(600);
    await act(async () => void (await result.current.ops.step(false, { setNotice: () => undefined, goTo: () => undefined })));
    expect(result.current.ops.peekStep(true)).toBe("Hero 제목 편집");
    await type(result, "둘");
    await wait(600);
    expect(result.current.ops.peekStep(true)).toBeUndefined();
    expect(result.current.ops.peekStep(false)).toBe("Hero 제목 편집");
  });

  it("편집 경계 거절(미리보기 중) = 기록 0 · 문서·기록 그대로(B-ER-05)", async () => {
    let locked = false;
    const { result } = setup(() => locked);
    await type(result, "하나");
    await wait(600);
    locked = true;
    await type(result, "둘");
    await wait(600);
    expect(title(result.current.doc)).toBe("하나");
    expect(result.current.ops.peekStep(false)).toBe("Hero 제목 편집");
    expect(result.current.ops.held).toContain(result.current.start);
  });

  it("묶음이 열린 동안 참조 집합 = 시작 문서 + 그 기록 사슬(600ms 전에도) — FU-AC-8 단위", async () => {
    const { result } = setup();
    await type(result, "하나");
    await wait(600);
    const afterFirst = result.current.doc;
    await type(result, "하나 둘", false, "s-hero-subtitle", "Hero 부제 편집", "subtitle");
    expect(result.current.ops.held).toEqual(expect.arrayContaining([afterFirst, result.current.start]));
  });
});
