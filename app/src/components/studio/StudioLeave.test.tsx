import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProfileRepositoryProvider } from "../../data/ProfileRepositoryContext";
import type { GenerationRepository } from "../../data/generationRepository";
import type { ProfileRepository } from "../../data/profileRepository";
import type { Project, ProjectRepository } from "../../data/projectRepository";
import { READ_ONLY_TAB, toInfra } from "../../data/persistence/infra";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { connectRenderFrame } from "../../features/studio/testing/renderFrame";
import { StudioLayout } from "./StudioLayout";

/**
 * 편집기 이탈 저장 (B-RS-01 · MQ-S5) — 앱 안 링크로 떠날 때 마지막 화면 편집이 저장소에 반영된 뒤 이동한다.
 * 반영 실패면 이동을 보류하고 기존 저장 실패 안내("저장하지 못했습니다" · "다시 저장")를 쓴다. 읽기 전용 탭(저장 0이 정상)은 막지 않는다.
 */
const PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};
const NO_PROFILE = { getProfile: async () => undefined } as unknown as ProfileRepository;
const UNUSED = () => Promise.reject(new Error("이 테스트는 쓰지 않는다"));

type Outcome = "ok" | Error;
/** 저장 요청마다 `release(결과)`를 기다리는 저장소 — `stored` = 저장소에 반영된 마지막 문서 */
function heldRepository(persistence: "memory" | "local" = "memory") {
  const held: ((outcome: Outcome) => void)[] = [];
  let stored: PageDoc | undefined;
  const save = vi.fn(
    (_id: string, revision: number, doc: PageDoc) =>
      new Promise((resolve, reject) =>
        held.push((outcome) => {
          if (outcome !== "ok") return reject(outcome);
          stored = doc;
          resolve({ ...doc, revision: revision + 1 });
        }),
      ),
  );
  const repository = { persistence, saveDoc: save, resolveConflict: vi.fn() } as unknown as ProjectRepository;
  const release = async (outcome: Outcome = "ok") => {
    await act(async () => held.shift()!(outcome));
    await act(() => vi.advanceTimersByTimeAsync(0));
  };
  return { repository, save, release, stored: () => stored, waiting: () => held.length };
}

function draw(repository: ProjectRepository) {
  const arrivals: string[] = [];
  function Probe() {
    const location = useLocation();
    useEffect(() => {
      if (location.pathname === "/projects") arrivals.push(location.key);
    }, [location]);
    return null;
  }
  render(
    <ProfileRepositoryProvider repository={NO_PROFILE} generations={UNUSED as () => Promise<GenerationRepository>} projects={UNUSED as () => Promise<ProjectRepository>}>
      <MemoryRouter initialEntries={["/studio/project-1"]}>
        <Probe />
        <Routes>
          <Route path="/studio/:projectId" element={<StudioLayout project={PROJECT} doc={sampleDoc()} repository={repository} entryNotice={undefined} focusHeading={false} />} />
          <Route path="/projects" element={<p>프로젝트 목록</p>} />
        </Routes>
      </MemoryRouter>
    </ProfileRepositoryProvider>,
  );
  connectRenderFrame();
  return { arrivals };
}

const editRegion = () => screen.getByRole("region", { name: /^편집 · / });
const type = (value: string) => act(() => void fireEvent.change(within(editRegion()).getByRole("textbox", { name: /^제목/ }), { target: { value } }));
const backLink = () => screen.getByRole("link", { name: "프로젝트로 돌아가기" });
const leave = () => act(() => void fireEvent.click(backLink()));
const titleOf = (doc: PageDoc | undefined) => doc?.sections.find((s) => s.instanceId === "s-hero")?.slots.title;

/** 실제 브라우저(보안 컨텍스트)는 Web Locks가 있다 — 없으면 읽기 전용 폴백으로 본다(jsdom은 없음) */
const withLocks = () => Object.defineProperty(navigator, "locks", { value: {}, configurable: true });
const withoutLocks = () => Reflect.deleteProperty(navigator, "locks");

beforeEach(() => {
  vi.useFakeTimers();
  withLocks();
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  withoutLocks();
});

describe("편집기 이탈 저장 (B-RS-01)", () => {
  it("저장 진행 중 추가 편집 → 앱 안 이동 = 마지막 편집까지 저장소에 반영된 뒤 이동 1회", async () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    type("첫 편집");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(repo.save).toHaveBeenCalledTimes(1);
    type("마지막 편집");
    leave();
    await repo.release();
    while (repo.waiting()) await repo.release();
    expect(titleOf(repo.stored())).toBe("마지막 편집");
    expect(screen.getByText("프로젝트 목록")).toBeInTheDocument();
    expect(arrivals).toHaveLength(1);
  });

  it("저장 전 변경 → 이동은 저장이 끝날 때까지 기다린다(그동안 편집기 유지)", async () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    type("떠나기 전 편집");
    leave();
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("프로젝트 목록")).toBeNull();
    await repo.release();
    expect(titleOf(repo.stored())).toBe("떠나기 전 편집");
    expect(screen.getByText("프로젝트 목록")).toBeInTheDocument();
    expect(arrivals).toHaveLength(1);
  });

  it("저장 실패 → 이동 보류 · 기존 실패 안내('저장하지 못했습니다' · '다시 저장') · 다음 클릭은 다시 저장해 보고 성공하면 이동", async () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    type("실패할 편집");
    leave();
    await repo.release(new Error("boom"));
    expect(screen.queryByText("프로젝트 목록")).toBeNull();
    expect(screen.getByRole("banner")).toHaveTextContent("저장하지 못했습니다");
    expect(screen.getByRole("button", { name: "다시 저장" })).toBeInTheDocument();
    expect(arrivals).toHaveLength(0);
    leave();
    expect(repo.save).toHaveBeenCalledTimes(2);
    await repo.release();
    expect(titleOf(repo.stored())).toBe("실패할 편집");
    expect(arrivals).toHaveLength(1);
  });

  it("저장을 기다리는 동안 링크 연타 = 저장 1회 · 이동 1회", async () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    type("연타 편집");
    leave();
    leave();
    leave();
    expect(repo.save).toHaveBeenCalledTimes(1);
    await repo.release();
    await act(() => vi.advanceTimersByTimeAsync(2000));
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(arrivals).toHaveLength(1);
  });

  it("읽기 전용 탭(저장 거절 READ_ONLY_TAB) = 다시 저장해 보고 또 거절이면 이동을 막지 않는다 · 저장소 반영 0", async () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    type("읽기 전용 편집");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await repo.release(toInfra(undefined, "저장", READ_ONLY_TAB));
    expect(screen.getByRole("banner")).toHaveTextContent("저장하지 못했습니다");
    leave();
    expect(repo.save).toHaveBeenCalledTimes(2);
    await repo.release(toInfra(undefined, "저장", READ_ONLY_TAB));
    expect(screen.getByText("프로젝트 목록")).toBeInTheDocument();
    expect(repo.stored()).toBeUndefined();
    expect(arrivals).toHaveLength(1);
  });

  it("읽기 전용 탭에서 저장 전 변경 채로 떠나도 거절 뒤 이동한다", async () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    type("바로 떠남");
    leave();
    await repo.release(toInfra(undefined, "저장", READ_ONLY_TAB));
    expect(screen.getByText("프로젝트 목록")).toBeInTheDocument();
    expect(repo.stored()).toBeUndefined();
    expect(arrivals).toHaveLength(1);
  });

  it("읽기 전용 거절 뒤 쓰기 가능해진 탭(다른 탭 닫힘) = 지난 거절로 건너뛰지 않고 저장 뒤 이동(Codex r1 P1)", async () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    type("거절된 편집");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await repo.release(toInfra(undefined, "저장", READ_ONLY_TAB));
    type("쓰기 가능해진 뒤 편집");
    leave();
    expect(repo.save).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("프로젝트 목록")).toBeNull();
    await repo.release();
    expect(titleOf(repo.stored())).toBe("쓰기 가능해진 뒤 편집");
    expect(arrivals).toHaveLength(1);
  });

  it("Web Locks 없는 로컬 저장(영구 읽기 전용 폴백 — 일반 INFRA 문장) = 거절 뒤 이동을 막지 않는다(Codex r1 P2)", async () => {
    withoutLocks();
    expect(navigator.locks).toBeUndefined();
    const repo = heldRepository("local");
    const { arrivals } = draw(repo.repository);
    type("잠금 없는 편집");
    leave();
    await repo.release(toInfra(undefined, "저장"));
    expect(screen.getByText("프로젝트 목록")).toBeInTheDocument();
    expect(arrivals).toHaveLength(1);
  });

  it("읽기 전용 거절 뒤 오프라인 = 이번 이탈에서 거절을 받지 않았으므로 보류(Codex r2 P1)", async () => {
    const repo = heldRepository();
    draw(repo.repository);
    type("거절된 편집");
    await act(() => vi.advanceTimersByTimeAsync(2000));
    await repo.release(toInfra(undefined, "저장", READ_ONLY_TAB));
    type("오프라인 중 편집");
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    leave();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("프로젝트 목록")).toBeNull();
  });

  it("Web Locks 없어도 메모리 저장 실패는 보류(잠금 폴백은 로컬 저장만, Codex r2 P2)", async () => {
    withoutLocks();
    const repo = heldRepository("memory");
    draw(repo.repository);
    type("메모리 편집");
    leave();
    await repo.release(new Error("청크 로드 실패"));
    expect(screen.queryByText("프로젝트 목록")).toBeNull();
  });

  it("Web Locks 있는 브라우저의 일반 저장 실패는 그대로 보류", async () => {
    const repo = heldRepository();
    draw(repo.repository);
    type("메모리 편집");
    leave();
    await repo.release(toInfra(undefined, "저장"));
    expect(screen.queryByText("프로젝트 목록")).toBeNull();
  });

  it("수정 키(Ctrl·Meta·Shift·Alt) 클릭은 이 탭을 떠나지 않으므로 가로채지 않는다(Codex r1 P2)", () => {
    const repo = heldRepository();
    draw(repo.repository);
    type("새 탭으로 열기 전 편집");
    for (const key of ["ctrlKey", "metaKey", "shiftKey", "altKey"]) expect(fireEvent.click(backLink(), { [key]: true })).toBe(true);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it("저장 실패 중에도 내려받기 링크(a[download] — 내보내기 결과)는 가로채지 않는다 · 저장 대기 0(RESUME-1)", async () => {
    const repo = heldRepository();
    draw(repo.repository);
    type("실패할 편집");
    leave();
    await repo.release(new Error("boom"));
    expect(screen.getByRole("banner")).toHaveTextContent("저장하지 못했습니다");
    const download = Object.assign(document.createElement("a"), { href: "blob:site", download: "site.zip", textContent: "내려받기" });
    screen.getByRole("banner").append(download);
    expect(fireEvent.click(download)).toBe(true);
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.waiting()).toBe(0);
  });

  it("바뀐 것이 없으면 바로 이동 · 저장 0", () => {
    const repo = heldRepository();
    const { arrivals } = draw(repo.repository);
    leave();
    expect(screen.getByText("프로젝트 목록")).toBeInTheDocument();
    expect(repo.save).not.toHaveBeenCalled();
    expect(arrivals).toHaveLength(1);
  });
});
