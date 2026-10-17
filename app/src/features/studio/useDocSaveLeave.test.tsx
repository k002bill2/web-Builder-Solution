/**
 * RS6-L3b CP-C(PLAN 4절 L3 CP4 · MQ-6-7 A · INTEGRATE-6 3.1) — lease 해제 save 1회(링크·POP·재마운트 공통, 대기 없음) ·
 * 탭 수준 떠나기 경고 = 코어 레지스트리(저장소 인스턴스) · 레이아웃 재마운트 = 같은 코어(U7) — 실제 저장소(testRig) 위.
 */
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { imageRecordId } from "../../data/persistence/imageRecord";
import { IMAGE_READ } from "../../data/persistence/imageRestore";
import type { ImageKeeper, RenderImages } from "./images/store/types";
import { useDocSave } from "./useDocSave";
import { PROJECT, bindOf, edited, startedRig, uuid, withImage, type Repo } from "./save/testRig";

const hook = (props: Parameters<typeof useDocSave>[0]) => renderHook(() => useDocSave(props));
function unloadBlocked(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}
const originalRead = IMAGE_READ.read;
afterEach(() => {
  vi.restoreAllMocks();
  IMAGE_READ.read = originalRead;
});

describe("RS6-L3b CP-C · lease 해제 save · 탭 수준 경고", () => {
  it("U12: 디바운스 대기 중 POP 언마운트 → lease 해제 save 1회 · 편집기 밖에서도 탭 닫기 경고 on(레지스트리) · 저장 끝나면 off · IDB = 마지막 편집", async () => {
    const { db, repo, doc, core } = await startedRig();
    const save = vi.spyOn(core(), "save");
    const { result, unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    act(() => result.current.edit(edited(doc, "떠나기 직전")));
    const gate = db.hold();
    unmount();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(unloadBlocked()).toBe(true);
    gate.release();
    await vi.waitFor(async () => expect((await db.doc())?.doc.meta.title).toBe("떠나기 직전"));
    await vi.waitFor(() => expect(unloadBlocked()).toBe(false));
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("편집 없이 언마운트 = lease 해제 save 0 · 경고 0(로컬)", async () => {
    const { repo, doc, core } = await startedRig();
    const save = vi.spyOn(core(), "save");
    const { unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    unmount();
    await act(async () => undefined);
    expect(save).not.toHaveBeenCalled();
    expect(unloadBlocked()).toBe(false);
  });

  it("저장 진행 중 언마운트(마지막 편집이 이미 제출됨) = 해제 save 0 · 진행 중 저장이 끝나면 경고 off", async () => {
    const { db, repo, doc, core } = await startedRig();
    const save = vi.spyOn(core(), "save");
    const gate = db.hold();
    const { result, unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 5 });
    act(() => result.current.edit(edited(doc, "제출됨")));
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    unmount();
    await act(async () => undefined);
    expect(unloadBlocked()).toBe(true);
    gate.release();
    await vi.waitFor(() => expect(unloadBlocked()).toBe(false));
    expect(save).toHaveBeenCalledTimes(1);
    expect((await db.doc())?.doc.meta.title).toBe("제출됨");
  });

  it("U7: 재마운트(새 mountId) = 같은 코어 · 초안 이어짐 · lease 해제 save 최대 1회", async () => {
    const { db, repo, doc, core } = await startedRig();
    const save = vi.spyOn(core(), "save");
    const first = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    act(() => first.result.current.edit(edited(doc, "재마운트 전")));
    first.unmount();
    const again = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    expect(again.result.current.doc.meta.title).toBe("재마운트 전");
    await vi.waitFor(async () => expect((await db.doc())?.doc.meta.title).toBe("재마운트 전"));
    expect(save).toHaveBeenCalledTimes(1);
    again.unmount();
  });

  it("L3a 인계 2: 편집 → 디바운스 중 POP → 편집기 밖 restart = lease 해제 save 뒤라 STALE_DOC 0(코어 dirty 거절 사라짐)", async () => {
    const { repo, doc, core } = await startedRig();
    const { result, unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    act(() => result.current.edit(edited(doc, "뒤로 직전")));
    unmount();
    await act(async () => undefined);
    await core().idle();
    const now = (await repo.getDoc(PROJECT))!;
    expect(now.meta.title).toBe("뒤로 직전");
    await expect(repo.startDoc(PROJECT, 1, "A", "restart", now.revision)).resolves.toMatchObject({ doc: { candidateId: "A" } });
  });

  // 이전(useDocSave.test "떠나기 경고 · server 목" · 스케줄러 훅 beforeunload 3건): 변경 없음 0 · 실패·STALE 때 on — 편집기 안에서도 경고 = 레지스트리
  it("탭 수준 경고: 변경 없음 미등록 · 저장 실패 때 등록(편집기 안 · 언마운트 뒤 둘 다)", async () => {
    const { db, repo, doc } = await startedRig();
    const { result, unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 5 });
    expect(unloadBlocked()).toBe(false);
    db.failNext("AbortError");
    act(() => result.current.edit(edited(doc, "하나")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("failed"));
    expect(unloadBlocked()).toBe(true);
    unmount();
    expect(unloadBlocked()).toBe(true);
  });

  // RS6-L4 R2(I6 8.1): 포트 stale = `stale` 환경 행(failed + reason stale) — 이전 단계 "stale"(충돌)
  it("탭 수준 경고: 다른 탭 stale(stale 환경 행) 때 등록", async () => {
    const { repo, doc, core } = await startedRig();
    vi.spyOn(core(), "save").mockResolvedValue({ status: "failed", reason: "stale", newer: false });
    const { result, unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 5 });
    act(() => result.current.edit(edited(doc, "내 편집")));
    await vi.waitFor(() => expect(result.current.state.phase).toBe("failed"));
    expect(result.current.source.reason).toBe("stale");
    expect(unloadBlocked()).toBe(true);
    unmount();
  });

  it("memory 모드: 코어가 있으면 탭 닫기 경고 늘(편집기를 떠난 뒤에도 — needsUnloadGuard 메모리 승계)", async () => {
    const { repo, doc } = await startedRig({ memory: true });
    const { unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    unmount();
    await act(async () => undefined);
    expect(unloadBlocked()).toBe(true);
  });
});

/** 편집 틀 흉내(StudioLayout 이미지 effect) — 맵 등록 · `release` = 편집 틀 effect cleanup(언마운트와 같은 commit) */
function frame(repo: Repo, map: RenderImages | undefined) {
  let images = map;
  const publish = vi.fn((update: (prev: RenderImages | undefined) => RenderImages | undefined) => void (images = update(images)));
  const release = (repo as Repo & ImageKeeper).images!(PROJECT, map, publish);
  return { publish, release, images: () => images };
}

// FIX1(QA note 2 · 1절 #9) — 이미지 고른 직후(디바운스 안) 이탈: 편집 틀 cleanup이 맵을 지워도 해제·이탈 save가 이미지까지 커밋(commit 순서 무관)
describe("FIX1 · 이미지 고른 직후 이탈 = 해제 save가 이미지까지(맵 삭제 순서 무관)", () => {
  it("링크: ingest 직후 leave() + 같은 태스크에서 편집 틀 cleanup·언마운트 → IDB images 1 · 문서 참조 일치 · dirty 0", async () => {
    const { db, repo, doc, core } = await startedRig();
    const save = vi.spyOn(core(), "save");
    const { result, unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    const next = withImage(doc, uuid(1));
    act(() => result.current.edit(next));
    const view = frame(repo, bindOf(next, uuid(1)));
    void result.current.leave();
    view.release();
    unmount();
    await vi.waitFor(() => expect(save).toHaveBeenCalled());
    await core().idle();
    expect(await Promise.all(save.mock.results.map((r) => r.value))).toEqual([expect.objectContaining({ status: "saved" })]);
    expect(await db.persistence.keys("images")).toEqual([imageRecordId(PROJECT, uuid(1))]);
    expect((await db.doc())?.doc.hash).toBe(next.hash);
    expect(core().view().dirty).toBe(false);
  });

  it("POP: ingest 직후 편집 틀 cleanup·언마운트(저장 대기 없음) → 해제 save가 이미지까지 커밋 · 재진입 이미지 복원 · 글자 편집 saved(failed 고착 0)", async () => {
    const { db, repo, doc, core } = await startedRig();
    IMAGE_READ.read = (key) => db.persistence.get("images", key);
    const save = vi.spyOn(core(), "save");
    const first = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    const next = withImage(doc, uuid(1));
    act(() => first.result.current.edit(next));
    frame(repo, bindOf(next, uuid(1))).release();
    first.unmount();
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await core().idle();
    expect(await save.mock.results[0]!.value).toMatchObject({ status: "saved" });
    expect(await db.persistence.keys("images")).toEqual([imageRecordId(PROJECT, uuid(1))]);
    expect((await db.doc())?.doc.hash).toBe(next.hash);

    const view = frame(repo, undefined);
    await vi.waitFor(() => expect(view.images()?.[uuid(1)]).toBeDefined());
    const again = hook({ repository: repo, projectId: PROJECT, initialDoc: (await repo.getDoc(PROJECT))!, debounceMs: 5 });
    act(() => again.result.current.edit(edited(again.result.current.doc, "재진입 뒤 글자")));
    await vi.waitFor(() => expect(again.result.current.state.phase).toBe("saved"));
    expect((await db.doc())?.doc.meta.title).toBe("재진입 뒤 글자");
    again.unmount();
  });

  it("편집 틀 cleanup = 초안이 참조하는 Blob만 바인딩 · mark·dirty 변화 0(탭 수명 보유 = 다음 save가 묶을 집합 안)", async () => {
    const { repo, doc, core } = await startedRig();
    const next = withImage(doc, uuid(1));
    core().edit(next);
    const before = core().view();
    frame(repo, { ...bindOf(next, uuid(1)), ...bindOf(next, uuid(2)) }).release();
    expect(Object.keys(core().view().images)).toEqual([uuid(1)]);
    expect([core().view().mark, core().view().dirty]).toEqual([before.mark, before.dirty]);
  });

  it("순서 반대(언마운트 먼저 · 편집 틀 cleanup 나중, 같은 태스크)도 같다", async () => {
    const { db, repo, doc, core } = await startedRig();
    const { result, unmount } = hook({ repository: repo, projectId: PROJECT, initialDoc: doc, debounceMs: 60_000 });
    const next = withImage(doc, uuid(1));
    act(() => result.current.edit(next));
    const view = frame(repo, bindOf(next, uuid(1)));
    unmount();
    view.release();
    await vi.waitFor(async () => expect((await db.doc())?.doc.hash).toBe(next.hash));
    expect(await db.persistence.keys("images")).toEqual([imageRecordId(PROJECT, uuid(1))]);
    expect(core().view().dirty).toBe(false);
  });
});
