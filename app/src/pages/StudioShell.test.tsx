import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Project, ProjectRepository } from "../data/projectRepository";
import { SAMPLE_SECTIONS, sampleDoc } from "../engine/testing/sampleDoc";
import { CANVAS_CAPTION } from "../components/studio/StructureCanvas";
import { PREVIEW_VIEWS } from "../features/detail/previewView";
import { variantName } from "../features/studio/selection";
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

const canvas = () => screen.getByRole("region", { name: "구조 미리보기" });
const row = (name: RegExp) => within(screen.getByRole("navigation", { name: "섹션" })).getByRole("button", { name });

describe("섹션 선택 (S4 · E-AC-05 · SPEC 5.1·6.4)", () => {
  it("섹션 줄 선택 → aria-current · 편집 h2 · 캔버스 라벨 칩이 같은 섹션, 포커스는 누른 줄 그대로", async () => {
    await open(1280);
    expect(row(/^Hero/)).toHaveAttribute("aria-current", "true");
    expect(within(canvas()).getByText(`Hero · ${variantName(SAMPLE_SECTIONS[1]!)}`)).toBeInTheDocument();
    const services = row(/^Services/);
    services.focus();
    act(() => services.click());
    expect(services).toHaveAttribute("aria-current", "true");
    expect(row(/^Hero/)).not.toHaveAttribute("aria-current");
    expect(h2("편집 · Services")).toBeInTheDocument();
    expect(within(canvas()).getByText(/^Services · /)).toBeInTheDocument();
    expect(within(canvas()).queryByText(/^Hero · /)).toBeNull();
    expect(document.activeElement).toBe(services);
  });

  it("캔버스 섹션은 Tab 정지가 아니다 — 캔버스 안 포커스 가능한 요소 0(스크롤 영역 자신 제외), 포인터로 누르면 같은 선택", async () => {
    await open(1280);
    expect(canvas().querySelectorAll("button, a[href], input, select, textarea, [tabindex]")).toHaveLength(0);
    act(() => void fireEvent.click(canvas().querySelector('[data-instance-id="s-about"]')!));
    expect(row(/^About/)).toHaveAttribute("aria-current", "true");
    expect(h2("편집 · About")).toBeInTheDocument();
  });

  it("'페이지 정보' 줄 → 편집 h2 '편집 · 페이지 정보', 캔버스 라벨 칩 없음", async () => {
    await open(1280);
    act(() => row(/^페이지 정보/).click());
    expect(row(/^페이지 정보/)).toHaveAttribute("aria-current", "true");
    expect(h2("편집 · 페이지 정보")).toBeInTheDocument();
  });

  it("1024 툴바 Select와 목록은 같은 선택 상태", async () => {
    await open(1024);
    act(() => void fireEvent.change(screen.getByRole("combobox", { name: "섹션" }), { target: { value: "s-faq" } }));
    expect(row(/^FAQ/)).toHaveAttribute("aria-current", "true");
    expect(h2("편집 · FAQ")).toBeInTheDocument();
  });
});

describe("탭 (S5 · E-AC-14 · SPEC 6.2)", () => {
  const tab = (name: string) => screen.getByRole("tab", { name });
  it("tablist/tab/tabpanel 속성 — 선택 탭만 aria-selected·tabIndex 0, 패널은 aria-labelledby·tabIndex 0", async () => {
    await open(390);
    expect(tab("섹션")).toHaveAttribute("aria-selected", "true");
    expect(tab("섹션")).toHaveAttribute("tabindex", "0");
    expect(tab("편집")).toHaveAttribute("aria-selected", "false");
    expect(tab("편집")).toHaveAttribute("tabindex", "-1");
    const panel = screen.getByRole("tabpanel", { name: "섹션" });
    expect(tab("섹션")).toHaveAttribute("aria-controls", panel.id);
    expect(panel).toHaveAttribute("tabindex", "0");
  });

  it("←/→ · Home/End = 포커스 이동과 동시에 활성(자동 활성), 양 끝 순환", async () => {
    await open(390);
    tab("섹션").focus();
    act(() => void fireEvent.keyDown(tab("섹션"), { key: "ArrowRight" }));
    expect(tab("편집")).toHaveAttribute("aria-selected", "true");
    expect(document.activeElement).toBe(tab("편집"));
    expect(screen.getByRole("tabpanel", { name: "편집" })).toBeVisible();
    act(() => void fireEvent.keyDown(tab("편집"), { key: "End" }));
    expect(document.activeElement).toBe(tab("검사"));
    act(() => void fireEvent.keyDown(tab("검사"), { key: "ArrowRight" }));
    expect(document.activeElement).toBe(tab("섹션"));
    act(() => void fireEvent.keyDown(tab("섹션"), { key: "ArrowLeft" }));
    expect(document.activeElement).toBe(tab("검사"));
    act(() => void fireEvent.keyDown(tab("검사"), { key: "Home" }));
    expect(tab("섹션")).toHaveAttribute("aria-selected", "true");
  });

  it("탭을 바꿔도 선택 섹션 유지", async () => {
    await open(390);
    act(() => row(/^Services/).click());
    act(() => tab("편집").click());
    expect(h2("편집 · Services")).toBeInTheDocument();
    act(() => tab("섹션").click());
    expect(row(/^Services/)).toHaveAttribute("aria-current", "true");
  });
});

describe("미리보기 폭 · 캔버스 (S6 · E-AC-15 · E-AC-16 · SPEC 5.7 · E-S31)", () => {
  const widths = () => screen.getByRole("group", { name: "미리보기 폭" });
  it("라벨 = previewView.ts 상수(데스크톱·태블릿·모바일), ≥1024는 툴바 · 전환 뒤 문서·선택 유지", async () => {
    await open(1280);
    expect(screen.getByRole("banner")).toContainElement(widths());
    const radios = within(widths()).getAllByRole("radio");
    expect(radios.map((r) => r.closest("label")!.textContent)).toEqual(PREVIEW_VIEWS.map((v) => v.label));
    expect(within(widths()).getByRole("radio", { name: "데스크톱" })).toBeChecked();
    act(() => row(/^Services/).click());
    const text = canvas().textContent;
    act(() => within(widths()).getByRole("radio", { name: "태블릿" }).click());
    expect(within(widths()).getByRole("radio", { name: "태블릿" })).toBeChecked();
    expect(row(/^Services/)).toHaveAttribute("aria-current", "true");
    expect(canvas().textContent).toBe(text);
  });

  it("<1024는 캔버스 머리에", async () => {
    await open(390);
    expect(canvas()).toContainElement(widths());
  });

  it.each([1280, 1024, 390])("%i: 캡션 늘 보임 · 이미지·외부 URL 0 · 불투명도 글자 0 · 선택 라벨 12px 토큰(caption2)", async (width) => {
    await open(width);
    expect(within(canvas()).getByText(CANVAS_CAPTION)).toBeVisible();
    expect(canvas().querySelectorAll("img, iframe, [src]")).toHaveLength(0);
    expect(canvas().innerHTML).not.toMatch(/https?:|url\(/);
    expect(canvas().innerHTML).not.toMatch(/opacity|text-[\w-]+\/\d+/);
    expect(within(canvas()).getByText(/^Hero · /)).toHaveClass("text-caption2", "font-bold", "text-on-primary", "bg-primary");
  });
});
