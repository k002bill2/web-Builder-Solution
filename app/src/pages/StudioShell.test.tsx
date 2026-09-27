import { act, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Project, ProjectRepository } from "../data/projectRepository";
import { sampleDoc } from "../engine/testing/sampleDoc";
import { renderApp } from "../test/renderApp";

/** 편집기 틀 (EDITOR-A2-SHELL S2~S6 — E-AC-03·04·05·13·14·15·16) */
const PROJECT: Project = {
  projectId: "project-1",
  name: "동네 치과 클리닉 프로젝트",
  revision: 1,
  profileId: "profile-1",
  baseReferenceId: "ref-1",
  createdAt: "2026-09-27T00:00:00.000Z",
  updatedAt: "2026-09-27T00:00:00.000Z",
};

/** 화면이 쓰는 조회·저장만 — 나머지 메서드는 이 테스트에서 부르지 않는다 */
function stubProjects() {
  const repository = {
    persistence: "memory",
    getProject: async (id: string) => (id === PROJECT.projectId ? PROJECT : undefined),
    getDoc: async (id: string) => (id === PROJECT.projectId ? sampleDoc() : undefined),
    saveDoc: async (_id: string, revision: number, doc: object) => ({ ...doc, revision: revision + 1 }),
  } as unknown as ProjectRepository;
  return () => Promise.resolve(repository);
}

const original = window.matchMedia;
/** Tailwind 기준 폭(rem)으로 matchMedia를 흉내 낸다 — jsdom에는 matchMedia가 없다(CompareBoardResponsive.test와 같은 방식) */
function setViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const min = Number(/min-width:\s*([\d.]+)rem/.exec(query)?.[1] ?? 0) * 16;
    return {
      matches: width >= min,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    };
  }) as typeof window.matchMedia;
}
afterEach(() => {
  window.matchMedia = original;
});

async function open(width?: number) {
  if (width !== undefined) setViewport(width);
  const { router } = renderApp("/catalog", undefined, undefined, undefined, undefined, stubProjects());
  act(() => void router.navigate("/studio/project-1"));
  await screen.findByRole("heading", { level: 1, name: PROJECT.name });
  return router;
}

describe("집중 모드 툴바 (S2 · E-AC-03)", () => {
  it("주 메뉴 nav 없음 · header 1개 · 돌아가기 → /projects · h1 = 이름 · document.title = '<이름> 편집'", async () => {
    await open();
    expect(screen.queryByRole("navigation", { name: "주 메뉴" })).toBeNull();
    expect(screen.getAllByRole("banner")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "프로젝트로 돌아가기" })).toHaveAttribute("href", "/projects");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(`${PROJECT.name} 편집`);
  });
});

/** a가 문서 순서상 b보다 앞 */
const before = (a: Element, b: Element) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
const inOrder = (...els: Element[]) => els.every((el, i) => i === 0 || before(els[i - 1]!, el));
const h2 = (name: string | RegExp) => screen.getByRole("heading", { level: 2, name });

describe("배치 · 제목 구조 (S3 · E-AC-04 · E-AC-13 · SPEC 4.1·4.3·6.1)", () => {
  it.each([1280, 1920])("%i = 3단: h1 1 + h2 섹션·테마·구조 미리보기·편집 · Hero·품질 게이트 + h3 내보내기, 탭·Select 없음", async (width) => {
    await open(width);
    for (const name of ["섹션", "테마", "구조 미리보기", "편집 · Hero", "품질 게이트"]) expect(h2(name)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "내보내기" })).toBeInTheDocument();
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(screen.queryByRole("combobox", { name: "섹션" })).toBeNull();
    // 4.3 ≥1280: 툴바 → 섹션 열 → 캔버스 → 편집 → 게이트
    expect(
      inOrder(
        screen.getByRole("banner"),
        screen.getByRole("navigation", { name: "섹션" }),
        screen.getByRole("region", { name: "구조 미리보기" }),
        screen.getByRole("region", { name: "편집 · Hero" }),
        screen.getByRole("region", { name: "품질 게이트" }),
      ),
    ).toBe(true);
    // 문서 Tag는 ≥1280 툴바에
    expect(screen.getByRole("banner")).toHaveTextContent("candidate-a안 · 프로필 v2");
  });

  it("1024 = 2단: 툴바 Select '섹션' + 오른쪽 details '섹션 목록 · 순서'(기본 접힘), 순서 = 툴바 → 캔버스 → 목록 → 편집 → 테마 → 게이트", async () => {
    await open(1024);
    const select = screen.getByRole("combobox", { name: "섹션" });
    expect(screen.getByRole("banner")).toContainElement(select);
    const details = screen.getByText("섹션 목록 · 순서").closest("details")!;
    expect(details).not.toHaveAttribute("open");
    expect(screen.queryByRole("tablist")).toBeNull();
    expect(
      inOrder(
        screen.getByRole("banner"),
        screen.getByRole("region", { name: "구조 미리보기" }),
        details,
        screen.getByRole("region", { name: "편집 · Hero" }),
        h2("테마"),
        screen.getByRole("region", { name: "품질 게이트" }),
      ),
    ).toBe(true);
    // 문서 Tag는 "테마" 영역으로
    expect(screen.getByRole("banner")).not.toHaveTextContent("프로필 v2");
  });

  it.each([768, 390])("%i = 탭 3개(섹션·편집·검사), 순서 = 툴바 → 탭 목록 → 탭 패널 → 캔버스", async (width) => {
    await open(width);
    const tablist = screen.getByRole("tablist", { name: "편집 도구" });
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["섹션", "편집", "검사"]);
    expect(screen.queryByRole("combobox", { name: "섹션" })).toBeNull();
    expect(inOrder(screen.getByRole("banner"), tablist, screen.getByRole("tabpanel"), screen.getByRole("region", { name: "구조 미리보기" }))).toBe(true);
    // 편집 알림은 탭 목록 아래 1개
    const notice = screen.getByRole("status", { name: "편집 알림" });
    expect(before(tablist, notice)).toBe(true);
    expect(screen.getAllByRole("status", { name: "편집 알림" })).toHaveLength(1);
  });

  it("3단에서도 편집 알림 영역은 1개(E-AC-33)", async () => {
    await open(1280);
    expect(screen.getAllByRole("status", { name: "편집 알림" })).toHaveLength(1);
  });
});
