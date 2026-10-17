/**
 * RS6 T16(L3b QA 조건 Q1 · rs6-qa REPORT 4절 4) — 편집기 안 탭 닫기 경고 상시 회귀. 경고 소유 = 저장소 코어 레지스트리
 * (`memoryProjectRepository.ts:148` — 로컬 = 코어 중 dirty·inflight가 있으면, memory = 코어가 있으면 늘). 편집기(StudioLayout) 마운트 ·
 * 실제 저장소·싱크(testRig `startedRig` — 영속 경계만 가짜 `harnessDb`) 위에서 디바운스 대기 → 저장 중 → 커밋 → 실패 → memory를 잰다.
 * 레지스트리 리스너는 window에 남는다(저장소 인스턴스마다 1개) — 앞 테스트가 dirty 코어를 남기지 않게 끝에서 커밋까지 흘린다(memory는 마지막).
 */
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProfileRepositoryProvider } from "../../data/ProfileRepositoryContext";
import type { GenerationRepository } from "../../data/generationRepository";
import type { ProfileRepository } from "../../data/profileRepository";
import type { ProjectRepository } from "../../data/projectRepository";
import { connectRenderFrame } from "../../features/studio/testing/renderFrame";
import { PROJECT, startedRig, type TabOptions } from "../../features/studio/save/testRig";
import { AUTOSAVE_DEBOUNCE_MS } from "../../features/studio/useAutosaveScheduler";
import { StudioLayout } from "./StudioLayout";

const NO_PROFILE = { getProfile: async () => undefined } as unknown as ProfileRepository;
const UNUSED = () => Promise.reject(new Error("이 테스트는 쓰지 않는다"));

function unloadBlocked(): boolean {
  const event = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(event);
  return event.defaultPrevented;
}

/** 실제 저장소로 편집기 마운트 — 코어 생성(= 레지스트리 리스너 등록)은 편집기 첫 마운트 때 */
async function mounted(options: TabOptions = {}) {
  const rig = await startedRig(options);
  const project = (await rig.repo.getProject(PROJECT))!;
  render(
    <ProfileRepositoryProvider repository={NO_PROFILE} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
      <MemoryRouter initialEntries={[`/studio/${PROJECT}`]}>
        <Routes>
          <Route path="/studio/:projectId" element={<StudioLayout project={project} doc={rig.doc} repository={rig.repo as ProjectRepository} entryNotice={undefined} focusHeading={false} />} />
          <Route path="/projects" element={<p>프로젝트 목록</p>} />
        </Routes>
      </MemoryRouter>
    </ProfileRepositoryProvider>,
  );
  connectRenderFrame();
  // 디바운스만 가짜 시계로 민다(저장소 준비는 진짜 시계로 끝난 뒤)
  vi.useFakeTimers();
  return rig;
}

const type = (value: string) => act(() => void fireEvent.change(within(screen.getByRole("region", { name: /^편집 · / })).getByRole("textbox", { name: /^제목/ }), { target: { value } }));
const flush = () => act(() => vi.advanceTimersByTimeAsync(0));

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("RS6 T16 · 편집기 안 탭 닫기 경고(코어 레지스트리 · 실제 저장소)", () => {
  it("편집 직후 디바운스 대기(저장 시작 전) = 경고 on → 저장 진행 중(commit 대기) = on → 커밋 완료 = off", async () => {
    const { db, core } = await mounted();
    expect(unloadBlocked()).toBe(false);
    const gate = db.hold();
    type("디바운스 중 편집");
    await flush();
    expect(core().view()).toMatchObject({ dirty: true, inflight: 0 });
    expect(unloadBlocked()).toBe(true);

    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS));
    await vi.waitFor(() => expect(core().view().inflight).toBe(1));
    expect(unloadBlocked()).toBe(true);

    gate.release();
    await vi.waitFor(() => expect(core().view()).toMatchObject({ dirty: false, inflight: 0 }));
    expect(JSON.stringify((await db.doc())?.doc)).toContain("디바운스 중 편집");
    expect(unloadBlocked()).toBe(false);
  });

  // inflight 조건 단독 — 위 흐름의 저장 중은 dirty도 함께 참이라, 변경 없는 초안의 저장 1회(commit 대기)로 inflight만 세운다
  it("저장 진행 중 · 초안 변경 없음(dirty 0 · inflight 1) = 경고 on → 커밋 완료 = off", async () => {
    const { db, core } = await mounted();
    const gate = db.hold();
    const run = core().save();
    await flush();
    expect(core().view()).toMatchObject({ dirty: false, inflight: 1 });
    expect(unloadBlocked()).toBe(true);
    gate.release();
    await act(async () => void (await run));
    expect(core().view().inflight).toBe(0);
    expect(unloadBlocked()).toBe(false);
  });

  // L3b CP-C — 훅 수준 경로는 useDocSaveLeave.test "U12"(언마운트 = POP). 여기는 편집기 링크 이탈(lease 해제 save) 직후
  it("편집기 링크 이탈 직후(디바운스 미완) = 편집기 밖에서도 경고 on → 해제 save 커밋 = off", async () => {
    const { db, core } = await mounted();
    const gate = db.hold();
    type("떠나기 직전");
    act(() => void fireEvent.click(screen.getByRole("link", { name: "프로젝트로 돌아가기" })));
    expect(screen.getByText("프로젝트 목록")).toBeInTheDocument();
    expect(unloadBlocked()).toBe(true);
    gate.release();
    await vi.waitFor(() => expect(core().view()).toMatchObject({ dirty: false, inflight: 0 }));
    expect(JSON.stringify((await db.doc())?.doc)).toContain("떠나기 직전");
    expect(unloadBlocked()).toBe(false);
  });

  it("저장 실패(failed · 코어 dirty) = 경고 on → 다시 저장 성공 = off", async () => {
    const { db, core } = await mounted();
    db.failNext("AbortError");
    type("실패할 편집");
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS));
    await vi.waitFor(() => expect(screen.getAllByText("저장하지 못했습니다").length).toBeGreaterThan(0));
    expect(core().view()).toMatchObject({ dirty: true, inflight: 0 });
    expect(unloadBlocked()).toBe(true);
    await act(async () => void (await core().save()));
    expect(core().view().dirty).toBe(false);
    expect(unloadBlocked()).toBe(false);
  });

  // memory(not-persistent) = 코어가 있으면 늘(`!local` — memoryProjectRepository.ts:148) · 편집 0 · 저장 끝난 뒤에도. 리스너가 window에 남으므로 마지막
  it("memory 모드: 편집기 마운트(코어 있음)만으로 경고 on · 편집 → 저장(not-persistent) 뒤에도 on", async () => {
    const { core } = await mounted({ memory: true });
    expect(core().view()).toMatchObject({ dirty: false, inflight: 0 });
    expect(unloadBlocked()).toBe(true);
    type("메모리 편집");
    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS));
    await vi.waitFor(() => expect(core().view()).toMatchObject({ dirty: false, inflight: 0 }));
    expect(unloadBlocked()).toBe(true);
  });
});
