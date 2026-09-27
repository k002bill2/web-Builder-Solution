/** `/projects` 프로젝트 목록 (DS-2A-05 SPEC 2.4 J-S01~J-S08 · J-AC-02·03·08) — 라우트 미연결, 목 저장소 주입 */
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RouteErrorBoundary } from "../components/layout/RouteErrorBoundary";
import { ProjectRepositoryError, type Project, type ProjectRepository, type ProjectSummary } from "../data/projectRepository";
import { deferred } from "../test/deferred";
import { ProjectsPage } from "./ProjectsPage";

const NOW = Date.parse("2026-09-27T12:00:00.000Z");
const now = () => new Date(NOW);

const summary = (over: Partial<ProjectSummary>): ProjectSummary =>
  Object.freeze({
    projectId: "p1",
    name: "이름",
    revision: 1,
    profileId: "prof-1",
    baseReferenceId: "ref-1",
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-27T11:00:00.000Z",
    latestProfileVersion: 3,
    hasDoc: false,
    ...over,
  });

const OLD = summary({ projectId: "old", name: "오래된 프로젝트", profileId: "prof-old", updatedAt: "2026-09-25T12:00:00.000Z" });
const NEW = summary({
  projectId: "new",
  name: "카페 온도 프로젝트",
  profileId: "prof-new",
  revision: 4,
  updatedAt: "2026-09-27T11:55:00.000Z",
  hasDoc: true,
  candidateId: "B",
  docProfileVersion: 3,
});
const STALE_THEME = summary({
  projectId: "mid",
  name: "빵집 프로젝트",
  profileId: "prof-mid",
  updatedAt: "2026-09-27T09:00:00.000Z",
  hasDoc: true,
  candidateId: "A",
  docProfileVersion: 2,
  latestProfileVersion: 4,
});
/** 저장소 순서를 믿지 않는다 — 일부러 오래된 것부터 */
const ITEMS = Object.freeze([OLD, NEW, STALE_THEME]);

const unused = () => {
  throw new Error("이 테스트에서 쓰지 않는 저장소 메서드");
};

function repositoryWith(over: Partial<ProjectRepository>): ProjectRepository {
  return {
    persistence: "memory",
    listProjects: vi.fn(async () => ITEMS),
    getProject: unused,
    renameProject: unused,
    getDoc: unused,
    saveDoc: unused,
    startDoc: unused,
    listSnapshots: unused,
    createSnapshot: unused,
    restoreSnapshot: unused,
    resolveConflict: unused,
    requestExport: unused,
    getExportJob: unused,
    ...over,
  };
}

function renderPage(repository: ProjectRepository) {
  return render(
    <MemoryRouter>
      <ProjectsPage repository={repository} now={now} />
    </MemoryRouter>,
  );
}

const notice = () => screen.getByRole("status", { name: "프로젝트 알림" });
const renamed = (from: Project, over: Partial<Project>): Project => Object.freeze({ ...from, ...over });

describe("ProjectsPage — J-S01 로딩", () => {
  it("불러오는 동안 제목 자리와 로딩 상태, 알림 영역을 둔다", () => {
    const pending = deferred<readonly ProjectSummary[]>();
    renderPage(repositoryWith({ listProjects: () => pending.promise }));
    expect(screen.getByRole("heading", { level: 1, name: "프로젝트" })).toBeInTheDocument();
    expect(screen.getByText("불러오는 중…")).toBeInTheDocument();
    expect(notice()).toBeInTheDocument();
  });
});

describe("ProjectsPage — J-S02 비어 있음 (J-AC-02)", () => {
  it("안내 문장 + 새로고침 캡션 + 보드·카탈로그 링크, role=alert 없음", async () => {
    renderPage(repositoryWith({ listProjects: async () => [] }));
    expect(await screen.findByText("프로젝트는 비교 보드에서 프로필을 확정하면 만들어집니다")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "프로젝트" })).toBeInTheDocument();
    expect(screen.getByText("새로고침하면 프로젝트가 사라집니다(서버 연결 전)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "비교 보드로" })).toHaveAttribute("href", "/compare");
    expect(screen.getByRole("link", { name: "카탈로그에서 고르기" })).toHaveAttribute("href", "/catalog");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(notice()).toBeInTheDocument();
  });
});

describe("ProjectsPage — J-S03 불러오기 오류", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("저장소 예외를 가장 가까운 오류 경계로 던진다", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <MemoryRouter>
        <RouteErrorBoundary resetKey="/projects">
          <ProjectsPage repository={repositoryWith({ listProjects: async () => Promise.reject(new Error("offline")) })} now={now} />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("화면을 불러오지 못했습니다");
  });
});

describe("ProjectsPage — J-S04 목록 (J-AC-03)", () => {
  it("마지막 변경 내림차순 · 머리 '새 프로젝트 시작' → /compare?new=1", async () => {
    renderPage(repositoryWith({}));
    const list = await screen.findByRole("list");
    const names = within(list).getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(names).toEqual(["카페 온도 프로젝트", "빵집 프로젝트", "오래된 프로젝트"]);
    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "새 프로젝트 시작" })).toHaveAttribute("href", "/compare?new=1");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("줄마다 이름(h2, 링크 아님) · 프로필 vN · 편집 상태 3종 · time · 행동", async () => {
    renderPage(repositoryWith({}));
    const rows = within(await screen.findByRole("list")).getAllByRole("listitem");
    expect(rows).toHaveLength(3);
    const [first, second, third] = rows as [HTMLElement, HTMLElement, HTMLElement];

    const title = within(first).getByRole("heading", { level: 2, name: "카페 온도 프로젝트" });
    expect(title.closest("a")).toBeNull();
    expect(within(first).getByText("프로필 v3")).toBeInTheDocument();
    expect(within(first).getByText("편집 중 · B안 · 프로필 v3")).toHaveClass("text-label-alternative");
    const time = within(first).getByText("5분 전");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-09-27T11:55:00.000Z");
    expect(within(first).getByRole("link", { name: "카페 온도 프로젝트 편집기 열기" })).toHaveAttribute("href", "/studio/new");
    expect(within(first).getByRole("link", { name: "카페 온도 프로젝트 프로필 보기" })).toHaveAttribute("href", "/profile/prof-new");
    expect(within(first).getByRole("button", { name: "카페 온도 프로젝트 이름 바꾸기" })).toBeInTheDocument();

    expect(within(second).getByText("프로필 v4")).toBeInTheDocument();
    expect(within(second).getByText("편집 중 · A안 · 프로필 v2 · 새 프로필 v4 있음")).toBeInTheDocument();
    expect(within(second).getByText("3시간 전")).toBeInTheDocument();

    expect(within(third).getByText("편집 전 — 프로필에서 3안을 고르면 시작합니다")).toHaveClass("text-label-alternative");
    expect(within(third).getByText("2일 전")).toBeInTheDocument();
    expect(within(third).queryByRole("link", { name: /편집기 열기/ })).not.toBeInTheDocument();
    expect(within(third).getByRole("link", { name: "오래된 프로젝트 프로필 보기" })).toHaveAttribute("href", "/profile/prof-old");
  });

  it("행동의 접근 이름은 줄마다 구분된다(이름 포함)", async () => {
    renderPage(repositoryWith({}));
    await screen.findByRole("list");
    const buttons = screen.getAllByRole("button", { name: /이름 바꾸기$/ });
    expect(new Set(buttons.map((b) => b.getAttribute("aria-label"))).size).toBe(3);
    expect(buttons.every((b) => b.textContent === "이름 바꾸기")).toBe(true);
  });

  it("알림 영역은 목록과 함께 늘 DOM에 있다(sr-only, display:none 아님)", async () => {
    renderPage(repositoryWith({}));
    await screen.findByRole("list");
    expect(notice()).toHaveClass("sr-only");
    expect(notice()).toBeVisible();
  });
});

describe("ProjectsPage — J-S08 긴 이름", () => {
  it("60자 이름을 자르지 않고 그대로 보인다(말줄임·줄바꿈 금지 클래스 없음)", async () => {
    const long = "가나다라마바사아자차".repeat(6);
    renderPage(repositoryWith({ listProjects: async () => [summary({ name: long })] }));
    const title = await screen.findByRole("heading", { level: 2 });
    expect(title).toHaveTextContent(long);
    expect(title.className).not.toMatch(/truncate|whitespace-nowrap|line-clamp|text-ellipsis/);
  });
});

async function openRenameOf(name: string) {
  const user = userEvent.setup();
  const button = await screen.findByRole("button", { name: `${name} 이름 바꾸기` });
  await user.click(button);
  return { user, input: screen.getByRole("textbox", { name: "프로젝트 이름" }) as HTMLInputElement };
}

describe("ProjectsPage — J-S05 이름 바꾸는 중 (J-AC-08)", () => {
  it("이름 자리가 입력으로 바뀌고 값 = 지금 이름, 전체 선택, 포커스", async () => {
    renderPage(repositoryWith({}));
    const { input } = await openRenameOf("카페 온도 프로젝트");
    expect(input).toHaveValue("카페 온도 프로젝트");
    expect(input).toHaveFocus();
    expect([input.selectionStart, input.selectionEnd]).toEqual([0, "카페 온도 프로젝트".length]);
    expect(screen.queryByRole("heading", { level: 2, name: "카페 온도 프로젝트" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "저장" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "취소" })).toBeInTheDocument();
  });

  it("Esc = 취소 → 이름 그대로, 포커스는 그 줄 '이름 바꾸기'", async () => {
    renderPage(repositoryWith({}));
    const { user } = await openRenameOf("빵집 프로젝트");
    await user.type(screen.getByRole("textbox", { name: "프로젝트 이름" }), "바꿈");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "빵집 프로젝트" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "빵집 프로젝트 이름 바꾸기" })).toHaveFocus();
  });

  it("'취소' 버튼 → 포커스는 그 줄 '이름 바꾸기'", async () => {
    renderPage(repositoryWith({}));
    const { user } = await openRenameOf("오래된 프로젝트");
    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "오래된 프로젝트 이름 바꾸기" })).toHaveFocus();
  });
});

describe("ProjectsPage — J-S06 이름 검증", () => {
  it("0자 → '이름을 입력하세요' + aria-invalid·describedby, 저장은 막지 않고 입력으로 포커스, 요청 없음", async () => {
    const renameProject = vi.fn();
    renderPage(repositoryWith({ renameProject }));
    const { user, input } = await openRenameOf("카페 온도 프로젝트");
    await user.clear(input);
    await user.type(input, "   ");
    const save = screen.getByRole("button", { name: "저장" });
    expect(save).toBeEnabled();
    await user.click(save);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("이름을 입력하세요");
    expect(input).toHaveFocus();
    expect(renameProject).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("43자 → '40자까지 쓸 수 있습니다 (43/40자)'", async () => {
    const renameProject = vi.fn();
    renderPage(repositoryWith({ renameProject }));
    const { user, input } = await openRenameOf("카페 온도 프로젝트");
    await user.clear(input);
    await user.type(input, "가".repeat(43));
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(input).toHaveAccessibleDescription("40자까지 쓸 수 있습니다 (43/40자)");
    expect(renameProject).not.toHaveBeenCalled();
  });
});

describe("ProjectsPage — J-S07 저장", () => {
  it("저장 중 aria-busy · 연타 무시 → 성공 알림, 새 이름, 맨 위로 옮긴 줄의 '이름 바꾸기'로 포커스", async () => {
    const pending = deferred<Project>();
    const renameProject = vi.fn(() => pending.promise);
    renderPage(repositoryWith({ renameProject }));
    const { user, input } = await openRenameOf("빵집 프로젝트");
    await user.clear(input);
    await user.type(input, "  빵집 리브랜딩  ");
    const save = screen.getByRole("button", { name: "저장" });
    await user.click(save);
    await user.click(save);
    expect(save).toHaveAttribute("aria-busy", "true");
    expect(renameProject).toHaveBeenCalledTimes(1);
    expect(renameProject).toHaveBeenCalledWith("mid", 1, "빵집 리브랜딩");

    pending.resolve(renamed(STALE_THEME, { name: "빵집 리브랜딩", revision: 2, updatedAt: "2026-09-27T11:59:50.000Z" }));
    const button = await screen.findByRole("button", { name: "빵집 리브랜딩 이름 바꾸기" });
    expect(notice()).toHaveTextContent("이름을 '빵집 리브랜딩'으로 바꿨습니다");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    const first = screen.getAllByRole("listitem")[0]!;
    expect(within(first).getByRole("heading", { level: 2 })).toHaveTextContent("빵집 리브랜딩");
    expect(within(first).getByText("편집 중 · A안 · 프로필 v2 · 새 프로필 v4 있음")).toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it("실패 → role=alert '다시 시도', 입력 유지, 다시 저장 가능", async () => {
    const renameProject = vi.fn(async (): Promise<Project> => Promise.reject(new Error("network")));
    renderPage(repositoryWith({ renameProject }));
    const { user, input } = await openRenameOf("카페 온도 프로젝트");
    await user.clear(input);
    await user.type(input, "내 입력");
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("이름을 바꾸지 못했습니다 · 다시 시도");
    expect(screen.getByRole("textbox", { name: "프로젝트 이름" })).toHaveValue("내 입력");
    expect(screen.getByRole("button", { name: "저장" })).not.toHaveAttribute("aria-busy", "true");
    expect(notice()).not.toHaveTextContent("바꿨습니다");
  });

  it("STALE_PROJECT → 최신 이름 문장, 입력 유지, 다음 저장은 최신 revision · 취소하면 최신 이름", async () => {
    const latest = renamed(NEW, { name: "다른 곳 이름", revision: 9 });
    const renameProject = vi.fn(async (): Promise<Project> => Promise.reject(new ProjectRepositoryError("STALE_PROJECT", "stale", { project: latest })));
    renderPage(repositoryWith({ renameProject }));
    const { user, input } = await openRenameOf("카페 온도 프로젝트");
    await user.clear(input);
    await user.type(input, "내 입력");
    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "다른 곳에서 이름이 '다른 곳 이름'로 바뀌었습니다. 입력은 남겨 두었습니다 — 확인 후 다시 저장하세요",
    );
    expect(screen.getByRole("textbox", { name: "프로젝트 이름" })).toHaveValue("내 입력");

    await user.click(screen.getByRole("button", { name: "저장" }));
    expect(renameProject).toHaveBeenNthCalledWith(1, "new", 4, "내 입력");
    expect(renameProject).toHaveBeenNthCalledWith(2, "new", 9, "내 입력");

    await user.click(screen.getByRole("button", { name: "취소" }));
    expect(screen.getByRole("heading", { level: 2, name: "다른 곳 이름" })).toBeInTheDocument();
  });
});
