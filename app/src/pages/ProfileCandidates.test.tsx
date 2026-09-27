/**
 * 2a-04c 3안 화면 (DS-2A-04 P-S17~S24 · P-AC-24~31·37) — 생성 흐름(버튼 aria-busy · 자리 고정 · 단계 알림) · 카드·비교 표 · 선택·편집 시작 경계 ·
 * 저장 안 된 조정 차단 · 부분/전체 실패 · 늦은 응답 차단 · 이전 버전 선택 복원 · 번들 분류 근거(계산 청크는 생성 클릭 뒤에만).
 * 조회 간격(1초)은 가짜 타이머로 진행한다.
 */
import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryCompareBoardRepository } from "../data/memoryCompareBoardRepository";
import { createMemoryGenerationRepository, type MemoryGenerationOptions } from "../data/memoryGenerationRepository";
import { createMemoryProfileRepository } from "../data/memoryProfileRepository";
import { createMemoryProjectRepository, type MemoryProjectOptions } from "../data/memoryProjectRepository";
import { ProjectRepositoryError, type StudioEntryState } from "../data/projectRepository";
import { createMemoryReferenceRepository } from "../data/referenceRepository";
import { createStudioStore } from "../data/studioStore";
import { PROFILE_EVENT, type ProfileEvent } from "../features/profile/profileEvents";
import { POLL_MS } from "../features/profile/useGeneration";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import { FIXTURE_CATALOG, boardOf } from "../test/compareFixtures";
import { renderApp } from "../test/renderApp";
import { insertOtherVersion } from "../test/studioFixtures";

const loads = vi.hoisted(() => ({ generate: vi.fn() }));
vi.mock("../data/writeBodyLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../data/writeBodyLoader")>();
  loads.generate.mockImplementation(actual.loadGenerate);
  return { ...actual, loadGenerate: loads.generate };
});

async function open(
  options: Omit<MemoryGenerationOptions, "store"> = {},
  path = "/profile/profile-1",
  before?: (s: ReturnType<typeof createStudioStore>) => void,
  projectOptions: Omit<MemoryProjectOptions, "store"> = {},
) {
  const store = createStudioStore();
  const board = createMemoryCompareBoardRepository({ catalog: FIXTURE_CATALOG, initialBoard: boardOf(["ref-a", "ref-b", "ref-c"], { hero: "ref-a" }), store });
  const profiles = createMemoryProfileRepository({ store });
  const gen = createMemoryGenerationRepository({ ...options, store });
  await board.confirmProfile(1, 0);
  before?.(store);
  const projectRepository = createMemoryProjectRepository({ ...projectOptions, store });
  const projects = () => Promise.resolve(projectRepository);
  const view = renderApp(path, createMemoryReferenceRepository(referenceFixtures, referenceDetailFixtures), board, profiles, gen, projects);
  await screen.findByRole("heading", { level: 1, name: "디자인 프로필" });
  const region = await screen.findByRole("region", { name: "생성된 3안" });
  return { ...view, gen, store, region, projectRepository };
}

const user = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
const tick = () => act(() => vi.advanceTimersByTimeAsync(POLL_MS));
const status = () => screen.getByRole("status", { name: "프로필 알림" });
const events: ProfileEvent[] = [];
const listen = (e: Event) => events.push((e as CustomEvent<ProfileEvent>).detail);

async function generate(u: ReturnType<typeof user>, region: HTMLElement) {
  await u.click(await within(region).findByRole("button", { name: /^3안 만들기 \(v\d+\)$/ }));
  for (let i = 0; i < 3; i += 1) await tick();
  await within(region).findByRole("table", { name: "3안 비교" });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  events.length = 0;
  window.addEventListener(PROFILE_EVENT, listen);
});
afterEach(() => {
  vi.useRealTimers();
  window.removeEventListener(PROFILE_EVENT, listen);
  loads.generate.mockClear();
});

describe("3안 생성 흐름 (P-S17 → S18 → S19)", () => {
  it("캡션 상시 · 버튼 aria-busy · 카드 자리 고정 · 단계 알림(시작·1/3·2/3·완료) · 카드 3 + 비교 표 · 다시 생성 없음", async () => {
    const { region } = await open();
    expect(within(region).getByText(/^프로필 v1 · 라이브러리 1\.4 · seed [0-9a-f]{8} · 생성기 preview-1 → 같은 입력이면 같은 결과$/)).toBeInTheDocument();
    expect(within(region).getByText(/^구조 미리보기 — 섹션 구성·비율·모션 배정입니다/)).toBeInTheDocument();
    expect(within(region).getByText("같은 버전으로 다시 만들면 같은 결과가 나옵니다")).toBeInTheDocument();
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    const busy = await within(region).findByRole("button", { name: "만드는 중…" });
    expect(busy).toHaveAttribute("aria-busy", "true");
    // busy 는 생성 청크 로드·요청 응답(잡) 전에 먼저 렌더된다 — 자리 카드는 잡이 도착한 뒤라 비동기로 기다린다(첫 조회 전 0/3 단계 그대로)
    expect(await within(region).findAllByText("A안 만드는 중 · 0/3 완료")).toHaveLength(1);
    expect(within(within(region).getByRole("list", { name: "3안" })).getAllByRole("listitem", { name: undefined }).length).toBeGreaterThanOrEqual(3);
    expect(status()).toHaveTextContent("3안을 만드는 중입니다");
    const seen: string[] = [status().textContent ?? ""];
    for (let i = 0; i < 3; i += 1) {
      await tick();
      seen.push(status().textContent ?? "");
    }
    expect(seen).toEqual(["3안을 만드는 중입니다", "3안을 만드는 중입니다 · 1/3 완료", "3안을 만드는 중입니다 · 2/3 완료", "3안을 만들었습니다"]);
    for (const id of ["A", "B", "C"]) expect(within(region).getByRole("heading", { level: 3, name: `${id}안` })).toBeInTheDocument();
    const table = within(region).getByRole("table", { name: "3안 비교" });
    expect(within(table).getAllByText("A와 다름").length).toBeGreaterThanOrEqual(6);
    expect(within(region).getAllByText(/^[0-9a-f]{8}$/).length).toBeGreaterThanOrEqual(3);
    for (const id of ["A", "B", "C"]) expect(within(region).getByRole("list", { name: `${id}안 로그` }).children).toHaveLength(3);
    expect(within(region).queryByRole("button", { name: /다시 생성|3안 만들기/ })).not.toBeInTheDocument();
    expect(region.querySelectorAll("[aria-hidden='true'].aspect-4\\/5")).toHaveLength(3);
    expect(events.map((e) => e.name)).toEqual(["generation_requested", "generation_succeeded"]);
  });

  it("선택: 선택 전 편집 시작 aria-disabled + 이유 → 'B안 선택' aria-pressed · 선택됨 · Tag → 'B안으로 편집 시작' → /studio/:projectId, 다시 들어와도 유지", async () => {
    const { region, router } = await open();
    const u = user();
    await generate(u, region);
    const edit = within(region).getByRole("button", { name: "편집 시작" });
    expect(edit).toHaveAttribute("aria-disabled", "true");
    expect(edit).toHaveAccessibleDescription(/안을 고르면 편집을 시작할 수 있습니다/);
    expect(edit).toHaveAccessibleDescription(/편집기는 다음 단계\(2a-05\)에서 연결됩니다/);
    await u.click(edit);
    expect(router.state.location.pathname).toBe("/profile/profile-1");
    await u.click(within(region).getByRole("button", { name: "B안 선택" }));
    const pressed = await within(region).findByRole("button", { name: "B안 선택", pressed: true });
    expect(pressed).toHaveTextContent("선택됨");
    expect(within(region).getByText("선택")).toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "A안 선택", pressed: false })).toHaveTextContent("이 안 선택");
    expect(status()).toHaveTextContent("B안을 선택했습니다");
    expect(events.at(-1)).toEqual({ name: "candidate_selected", id: "B" });
    act(() => void router.navigate("/compare"));
    await screen.findByRole("heading", { level: 1, name: "비교 보드" });
    act(() => void router.navigate("/profile/profile-1"));
    const back = await screen.findByRole("region", { name: "생성된 3안" });
    expect(await within(back).findByRole("button", { name: "B안 선택", pressed: true })).toBeInTheDocument();
    await u.click(within(back).getByRole("button", { name: "B안으로 편집 시작" }));
    // DS-2A-05 12.3 — startDoc(create)로 문서를 만든 뒤 프로젝트 편집기로 이동(h1 = 프로젝트 이름, 셸 분기 표시는 A2-S)
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(await screen.findByRole("heading", { level: 1, name: "모던 카페 브랜드 프로젝트" })).toBeInTheDocument();
  });

  it("저장 안 된 조정이 있으면 3안 만들기 aria-disabled + 이유, 눌러도 요청 0 · 취소하면 다시 가능", async () => {
    const { region, gen } = await open();
    const u = user();
    await u.click(within(screen.getByRole("radiogroup", { name: "밀도" })).getByRole("radio", { name: /촘촘/ }));
    const button = within(region).getByRole("button", { name: "3안 만들기 (v1)" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).toHaveAccessibleDescription("저장하지 않은 조정이 있습니다 — 저장하면 새 버전으로 만듭니다");
    await u.click(button);
    expect(await gen.findJob("profile-1", 1)).toBeUndefined();
    await u.click(screen.getByRole("button", { name: "조정 취소" }));
    expect(within(region).getByRole("button", { name: "3안 만들기 (v1)" })).not.toHaveAttribute("aria-disabled");
  });
});

describe("실패 · 경쟁 (P-S20 · S21)", () => {
  it("부분 실패: role=alert 'C안을 만들지 못했습니다' + 'C안 다시 시도' → C만 다시 → 3안", async () => {
    const { region } = await open({ outcome: ({ id, attempt }) => (id === "C" && attempt === 1 ? "JOB_TIMEOUT" : undefined) });
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    for (let i = 0; i < 3; i += 1) await tick();
    const alert = await within(region).findByRole("alert");
    expect(alert).toHaveTextContent("C안을 만들지 못했습니다 · 제한 시간 안에 만들지 못했습니다");
    expect(events.map((e) => e.name)).toEqual(["generation_requested", "generation_succeeded", "generation_failed"]);
    await u.click(within(alert).getByRole("button", { name: "C안 다시 시도" }));
    await tick();
    expect(await within(region).findByRole("heading", { level: 3, name: "C안" })).toBeInTheDocument();
    await waitFor(() => expect(within(region).queryByRole("alert")).not.toBeInTheDocument());
    expect(within(region).getAllByRole("button", { name: /^[ABC]안 선택$/ })).toHaveLength(3);
  });

  it("전체 결정적 실패(라이브러리 없음): 원인 문장 + role=alert, 다시 시도 없음, 비교 표 없음", async () => {
    const { region } = await open({ libraries: {} });
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    for (let i = 0; i < 3; i += 1) await tick();
    const alert = await within(region).findByRole("alert");
    expect(alert).toHaveTextContent("3안을 만들지 못했습니다");
    expect(alert).toHaveTextContent(/라이브러리/);
    expect(within(alert).queryByRole("button")).not.toBeInTheDocument();
    expect(within(region).queryByRole("table")).not.toBeInTheDocument();
  });

  it("늦은 응답 차단: v2 요청 응답 전에 ?v=1로 옮기면 v1 화면에 v2 결과가 나타나지 않음 · 이전 버전 선택 복원", async () => {
    const gate: { release?: () => void } = {};
    const { region, router, gen } = await open(
      { delay: (call) => (call.method === "requestGeneration" && call.phase === "response" && call.seq === 2 ? new Promise<void>((r) => (gate.release = r)) : undefined) },
      "/profile/profile-1?v=1",
      (store) => insertOtherVersion(store),
    );
    const u = user();
    await generate(u, region);
    await u.click(within(region).getByRole("button", { name: "A안 선택" }));
    await within(region).findByRole("button", { name: "A안 선택", pressed: true });
    act(() => void router.navigate("/profile/profile-1"));
    const latest = await screen.findByRole("button", { name: "3안 만들기 (v2)" });
    await u.click(latest);
    // v2 요청이 저장소에서 커밋되고 응답만 지연된 시점까지 기다린다(그 전에 옮기면 공회전 — 1차 Red-Green에서 확인)
    await waitFor(() => expect(gate.release).toBeDefined());
    act(() => void router.navigate("/profile/profile-1?v=1"));
    const v1 = await screen.findByRole("region", { name: "생성된 3안" });
    expect(await within(v1).findByRole("button", { name: "A안 선택", pressed: true })).toBeInTheDocument();
    await act(async () => gate.release!());
    for (let i = 0; i < 3; i += 1) await tick();
    expect((await gen.findJob("profile-1", 2))?.state).toBe("queued");
    expect(within(screen.getByRole("region", { name: "생성된 3안" })).getByText(/^프로필 v1 · /)).toBeInTheDocument();
    expect(screen.queryByText("A안 만드는 중 · 0/3 완료")).not.toBeInTheDocument();
    expect(status()).not.toHaveTextContent("3안을 만드는 중입니다");
  });
});

describe("잡 조회 중 클릭 (findJob 지연 — HTTP 대비)", () => {
  it("진입 findJob 응답 전에 3안 만들기 → 늦은 findJob 결과를 버려 폴러 1개: 조회마다 한 안씩, 1/3·2/3 알림 유지", async () => {
    const gate: { release?: () => void } = {};
    const { region } = await open({ delay: (call) => (call.method === "findJob" && call.phase === "request" && call.seq === 1 ? new Promise<void>((r) => (gate.release = r)) : undefined) });
    const u = user();
    await waitFor(() => expect(gate.release).toBeDefined());
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    await within(region).findByText("A안 만드는 중 · 0/3 완료");
    await act(async () => gate.release!());
    const seen = [status().textContent ?? ""];
    for (let i = 0; i < 3; i += 1) {
      await tick();
      seen.push(status().textContent ?? "");
    }
    expect(seen).toEqual(["3안을 만드는 중입니다", "3안을 만드는 중입니다 · 1/3 완료", "3안을 만드는 중입니다 · 2/3 완료", "3안을 만들었습니다"]);
  });
});

describe("리뷰 회귀 (선택·조회 순서 · 멱등 요청)", () => {
  it("선택 응답이 폴링 종료 뒤에 와도 안 상태를 되돌리지 않음 — 3안 유지 + 선택 유지", async () => {
    const gate: { release?: () => void } = {};
    const { region } = await open({ delay: (call) => (call.method === "selectCandidate" && call.phase === "response" ? new Promise<void>((r) => (gate.release = r)) : undefined) });
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    await tick();
    await u.click(await within(region).findByRole("button", { name: "A안 선택" }));
    await waitFor(() => expect(gate.release).toBeDefined());
    for (let i = 0; i < 2; i += 1) await tick();
    await within(region).findByRole("table", { name: "3안 비교" });
    await act(async () => gate.release!());
    expect(await within(region).findByRole("button", { name: "A안 선택", pressed: true })).toBeInTheDocument();
    for (let i = 0; i < 2; i += 1) await tick();
    expect(within(region).getByRole("table", { name: "3안 비교" })).toBeInTheDocument();
    expect(within(region).queryByText(/만드는 중/)).not.toBeInTheDocument();
    expect(within(region).getByRole("button", { name: "A안으로 편집 시작" })).not.toHaveAttribute("aria-disabled");
  });

  it("잡 조회 중 누른 요청이 이미 끝난 잡을 돌려받으면 요청·완료 계측과 완료 알림을 다시 내지 않음", async () => {
    const gate: { release?: () => void } = {};
    const { region, gen } = await open({ delay: (call) => (call.method === "findJob" && call.phase === "request" && call.seq === 1 ? new Promise<void>((r) => (gate.release = r)) : undefined) });
    await waitFor(() => expect(gate.release).toBeDefined());
    // 다른 탭이 같은 버전 잡을 끝까지 만든 상태
    const { jobId } = await gen.requestGeneration("profile-1", 1);
    for (let i = 0; i < 3; i += 1) await gen.getJob(jobId);
    events.length = 0;
    const u = user();
    await u.click(within(region).getByRole("button", { name: "3안 만들기 (v1)" }));
    await within(region).findByRole("table", { name: "3안 비교" });
    await act(async () => gate.release!());
    await tick();
    expect(events).toEqual([]);
    expect(status()).not.toHaveTextContent("3안을 만들었습니다");
  });
});

describe("번들 분류 근거 (check-bundle-size /profile afterAction memoryGenerate)", () => {
  it("진입 findJob·폴링·선택은 계산 청크 요청 0 — '3안 만들기' 클릭에서만 1회, 기존 잡 재진입도 0", async () => {
    const { region, router } = await open();
    expect(loads.generate).not.toHaveBeenCalled();
    const u = user();
    await generate(u, region);
    await u.click(within(region).getByRole("button", { name: "A안 선택" }));
    expect(loads.generate).toHaveBeenCalledTimes(1);
    act(() => void router.navigate("/compare"));
    await screen.findByRole("heading", { level: 1, name: "비교 보드" });
    act(() => void router.navigate("/profile/profile-1"));
    await within(await screen.findByRole("region", { name: "생성된 3안" })).findByRole("table", { name: "3안 비교" });
    expect(loads.generate).toHaveBeenCalledTimes(1);
  });
});

describe("편집 시작 연결 (DS-2A-05 12.3 · 8.3.1 · 8.2.1 — a2 C5)", () => {
  async function pickB() {
    const opened = await open();
    const u = user();
    await generate(u, opened.region);
    await u.click(within(opened.region).getByRole("button", { name: "B안 선택" }));
    await within(opened.region).findByRole("button", { name: "B안 선택", pressed: true });
    return { ...opened, u, edit: () => within(opened.region).getByRole("button", { name: "B안으로 편집 시작" }) };
  }

  it("성공 → startDoc(create) 문서 생성 · /studio/:projectId 이동 · state = 바뀐 쌍 목록(+ 알림 1문장)", async () => {
    const { u, edit, router, projectRepository } = await pickB();
    await u.click(edit());
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    const doc = await projectRepository.getDoc("project-1");
    expect(doc).toMatchObject({ candidateId: "B", profileVersion: 1, revision: 1 });
    const state = router.state.location.state as StudioEntryState;
    expect(Array.isArray(state.changes)).toBe(true);
    if (state.changes!.length > 0) expect(state.editNotice).toMatch(/^구조안의 섹션 \d+개를 편집기 변형으로 바꿔 열었습니다/);
  });

  it("DOC_EXISTS → 이동 + '이미 편집 중인 문서를 엽니다 (A안 · 프로필 v1)' · 자동 restart 없음", async () => {
    const { u, edit, router, projectRepository } = await pickB();
    await projectRepository.startDoc("project-1", 1, "A", "create");
    await u.click(edit());
    await waitFor(() => expect(router.state.location.pathname).toBe("/studio/project-1"));
    expect(router.state.location.state).toEqual({ editNotice: "이미 편집 중인 문서를 엽니다 (A안 · 프로필 v1)" });
    expect(await projectRepository.getDoc("project-1")).toMatchObject({ candidateId: "A", revision: 1 });
  });

  it("실패(요청 실패) → role=alert '편집을 시작하지 못했습니다' · 이동 없음 → '다시 시도' = 같은 인자 → 이동", async () => {
    let failed = false;
    const opened = await open({}, "/profile/profile-1", undefined, {
      fail: (call) => {
        if (call.method !== "startDoc" || call.phase !== "request" || failed) return undefined;
        failed = true;
        return new Error("network");
      },
    });
    const u = user();
    await generate(u, opened.region);
    await u.click(within(opened.region).getByRole("button", { name: "B안 선택" }));
    await u.click(await within(opened.region).findByRole("button", { name: "B안으로 편집 시작" }));
    const alert = await within(opened.region).findByRole("alert");
    expect(alert).toHaveTextContent("편집을 시작하지 못했습니다");
    expect(opened.router.state.location.pathname).toBe("/profile/profile-1");
    await u.click(within(alert).getByRole("button", { name: "다시 시도" }));
    await waitFor(() => expect(opened.router.state.location.pathname).toBe("/studio/project-1"));
    expect(await opened.projectRepository.getDoc("project-1")).toMatchObject({ candidateId: "B" });
  });

  it("UNKNOWN_VARIANT → role=alert (b) 문장 · 다시 시도 없음 · 이동 없음 · 버튼 상태 그대로", async () => {
    const { u, edit, router, region, projectRepository } = await pickB();
    const alertText = "이 안에는 편집기가 아직 열 수 없는 섹션이 있습니다(서비스 · grid-9) — 다른 안을 고르세요";
    const spy = vi.spyOn(projectRepository, "startDoc").mockRejectedValue(new ProjectRepositoryError("UNKNOWN_VARIANT", "services/grid-9", { alert: alertText }));
    await u.click(edit());
    const alert = await within(region).findByRole("alert");
    expect(alert).toHaveTextContent(alertText);
    expect(within(alert).queryByRole("button")).toBeNull();
    expect(spy).toHaveBeenCalledWith("project-1", 1, "B", "create");
    expect(router.state.location.pathname).toBe("/profile/profile-1");
    expect(edit()).not.toHaveAttribute("aria-disabled");
  });
});
