import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { section, sampleDoc } from "../../engine/testing/sampleDoc";
import { canvasFrame, connectRenderFrame, frameSays } from "../../features/studio/testing/renderFrame";
import { SAMPLE_KIT_TOKENS } from "../../render/testing/sampleKitTokens";
import { StructureCanvas } from "./StructureCanvas";

/**
 * M2B-2c 이관: 이 파일의 폴백 예시 = 샘플의 cta-band/banner(30/30 전 미구현). 실렌더가 된 뒤에도 같은 문서·같은 단언을 유지하려고
 * 부모 렌더러 목록에서 그 키만 뺀 목록을 주입한다(편집기 폴백 판정 = RENDERED_VARIANTS). 저장·편집 경로는 엔진에 없는 변형을 쓸 수 없다
 */
const UNRENDERED = vi.hoisted(() => "cta-band/banner");
vi.mock("../../features/studio/renderedVariants", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../features/studio/renderedVariants")>();
  return { RENDERED_VARIANTS: Object.freeze(actual.RENDERED_VARIANTS.filter((key) => key !== UNRENDERED)) };
});
/** 이관 전제 — 주입 목록에만 없고 실제 목록에는 있다 */
const expectInjected = async () => {
  const actual = (await vi.importActual<typeof import("../../features/studio/renderedVariants")>("../../features/studio/renderedVariants")).RENDERED_VARIANTS;
  expect(actual).toContain(UNRENDERED);
  expect((await import("../../features/studio/renderedVariants")).RENDERED_VARIANTS).not.toContain(UNRENDERED);
};

/**
 * 캔버스 호스트 · 부모 오버레이 (M2A-1 R4 · SPEC 5.7 r4.8 · E-AC-49). 블록 그리기 단언은 렌더 문서로 옮겼다(render/fallback/FallbackCanvas.test.tsx).
 * 이 파일에 남은 것: 선택 라벨 칩(부모 오버레이) · 문제 표시(부모) · iframe.
 */
const region = () => screen.getByRole("region", { name: "페이지 미리보기" });

describe("페이지 미리보기 — 선택 라벨 칩은 부모 오버레이 (5.7 · B-12)", () => {
  it("cards-2 선택 → 칩 'Services · 카드 2열' · region '페이지 미리보기'", () => {
    const doc = sampleDoc({ sections: [section("header", "sticky-right-cta", "s-header"), section("hero", "fullbleed-left", "s-hero"), section("services", "cards-2", "s-cards-2"), section("footer", "biz-extended", "s-footer")] });
    render(<StructureCanvas doc={doc} selectedId="s-cards-2" onSelect={() => {}} view="desktop" scrollable={false} />);
    connectRenderFrame();
    expect(within(region()).getByText("Services · 카드 2열")).toBeInTheDocument();
  });

  it("split 선택 → 칩 'Hero · 스플릿 (카피 / 이미지)' · 테두리 aria-hidden", () => {
    const doc = sampleDoc({ sections: [section("header", "sticky-right-cta", "s-header"), section("hero", "split", "s-hero"), section("footer", "biz-extended", "s-footer")] });
    render(<StructureCanvas doc={doc} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    connectRenderFrame();
    const chip = within(region()).getByText("Hero · 스플릿 (카피 / 이미지)");
    expect(chip.previousElementSibling).toHaveAttribute("aria-hidden", "true");
    expect(chip.previousElementSibling).toHaveClass("border-primary");
  });
});

describe("문제 표시는 데이터 색과 무관 (5.7 B-03 · FIX2 — r4.8부터 부모 오버레이)", () => {
  it("어두운 Footer 권장 초과 — 문장·배지는 흰 앱 면(background-normal) 위 · 프로필 색 변수 아님 · 2중 테두리 = 흰 간격 + 상태 글자 토큰", () => {
    const footer = section("footer", "biz-extended", "s-footer");
    const doc = sampleDoc({ sections: [section("header", "sticky-right-cta", "s-header"), section("hero", "fullbleed-left", "s-hero"), { ...footer, slots: { ...footer.slots, links: "가".repeat(65) } }] });
    render(<StructureCanvas doc={doc} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    connectRenderFrame();
    const sentence = within(region()).getByText(/넘었습니다/);
    const badge = region().querySelector<HTMLElement>("[data-issue-badge]")!;
    expect(badge).toHaveTextContent("경고 1");
    for (const el of [sentence, badge]) {
      expect(el.className).not.toMatch(/--canvas-/);
      expect(el).toHaveClass("bg-background-normal");
    }
    const ring = badge.parentElement!.querySelector('[aria-hidden="true"]')!;
    expect(ring).toHaveClass("border-2", "border-background-normal", "outline-2", "outline-status-cautionary-text");
  });
});

describe("문제 표시 문서 위치 (E-AC-49 · 5.7 r4.8)", () => {
  const over = () => {
    const doc = sampleDoc();
    return { ...doc, sections: doc.sections.map((s) => (s.instanceId === "s-hero" ? { ...s, slots: { ...s.slots, title: "가".repeat(30) } } : s)) };
  };

  it("렌더 문서 준비 전에도 문제 문장은 부모 DOM에 있다 · 사각형 전에는 테두리·배지·칩 0", () => {
    render(<StructureCanvas doc={over()} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    const sentence = document.getElementById("canvas-issue-s-hero-title")!;
    expect(sentence).toHaveTextContent("제목이 권장 28자를 넘었습니다 (30/28자)");
    expect(region()).toContainElement(sentence);
    expect(region().querySelector("[data-issue-badge]")).toBeNull();
    expect(within(region()).queryByText(/^Hero · /)).toBeNull();
    expect(region().querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it("문제 목록(r4.13 (1)) — 캔버스 머리(제목·캡션 뒤 · 프레임 앞) `ol` 한 줄 = '경고 N' + 문장 · 문장 id는 목록 안 · 오버레이에 문장 0 · 사각형 전에도 있다", () => {
    const doc = over();
    const two = { ...doc, sections: doc.sections.map((s) => (s.instanceId === "s-hero" ? { ...s, slots: { ...s.slots, subtitle: "나".repeat(96) } } : s)) };
    render(<StructureCanvas doc={two} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    const list = region().querySelector("ol[data-canvas-issues]")!;
    expect(list).toHaveAccessibleName("문제 목록");
    const items = within(list as HTMLElement).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual(["경고 1제목이 권장 28자를 넘었습니다 (30/28자)", "경고 2부제가 권장 80자를 넘었습니다 (96/80자)"]);
    expect(list).toContainElement(document.getElementById("canvas-issue-s-hero-title"));
    expect(list).toContainElement(document.getElementById("canvas-issue-s-hero-subtitle"));
    expect(screen.getByRole("heading", { name: "페이지 미리보기" }).compareDocumentPosition(list) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(list.compareDocumentPosition(canvasFrame()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    connectRenderFrame();
    expect(region().querySelector("[data-canvas-overlay]")!.querySelectorAll("p")).toHaveLength(0);
    expect(document.querySelectorAll("[id^=canvas-issue-]")).toHaveLength(2);
  });

  it("배지(r4.13 (2)) — 글자 = 목록과 같은 '경고 N' · aria-hidden(문장이 읽힘) · 슬롯 사각형 안쪽 모서리(위 슬롯을 덮지 않음, Q6) · 누르면 그 문장 id", () => {
    const onIssue = vi.fn();
    const doc = over();
    const two = { ...doc, sections: doc.sections.map((s) => (s.instanceId === "s-hero" ? { ...s, slots: { ...s.slots, subtitle: "나".repeat(96) } } : s)) };
    render(<StructureCanvas doc={two} selectedId="s-about" onSelect={() => {}} onIssue={onIssue} view="desktop" scrollable={false} />);
    connectRenderFrame();
    const badges = [...region().querySelectorAll<HTMLElement>("[data-issue-badge]")];
    expect(badges.map((b) => b.textContent)).toEqual(["경고 1", "경고 2"]);
    for (const b of badges) {
      expect(b).toHaveAttribute("aria-hidden", "true");
      expect(b.className).not.toMatch(/(^|\s)-(top|bottom|left|right)-/);
    }
    act(() => void fireEvent.click(badges[1]!));
    expect(onIssue).toHaveBeenCalledWith("s-hero", "canvas-issue-s-hero-subtitle");
  });

  it("빈 필수 칸(r4.13 (3)) — 목록 '차단 N' 줄 + 그 섹션 사각형에 2중 테두리 1개 · 배지 나란히(같은 섹션 2건도 번호 구분) · 렌더 문서에는 보내지 않는다", () => {
    const doc = sampleDoc();
    const empty = { ...doc, sections: doc.sections.map((s) => (s.instanceId === "s-hero" ? { ...s, slots: { ...s.slots, title: "", cta: "" } } : s)) };
    render(<StructureCanvas doc={empty} selectedId="s-about" onSelect={() => {}} view="desktop" scrollable={false} />);
    const list = region().querySelector<HTMLElement>("[data-canvas-issues]")!;
    expect(within(list).getAllByRole("listitem").map((li) => li.textContent)).toEqual(["차단 1제목 — 필수 입력입니다", "차단 2버튼 문구 — 필수 입력입니다"]);
    const { sent } = connectRenderFrame();
    expect(JSON.stringify(sent)).not.toContain("필수 입력입니다");
    const badges = [...region().querySelectorAll<HTMLElement>("[data-issue-badge]")];
    expect(badges.map((b) => b.textContent)).toEqual(["차단 1", "차단 2"]);
    const ring = badges[0]!.parentElement!;
    expect(badges[1]!.parentElement).toBe(ring);
    const i = empty.sections.findIndex((s) => s.instanceId === "s-hero");
    // 섹션 사각형 (0, i×100, 800, 96) + 바깥 여백 4px — 렌더 문서는 빈 필수 슬롯을 그리지 않으므로(MQ-4) 슬롯 사각형이 아니라 섹션
    expect([ring.style.left, ring.style.top, ring.style.width, ring.style.height]).toEqual(["-4px", `${i * 100 - 4}px`, "808px", "104px"]);
    expect(ring.querySelectorAll('[aria-hidden="true"].outline-status-negative-text:not([data-issue-badge])')).toHaveLength(1);
  });

  it("문제 0이면 문제 목록을 그리지 않는다(r4.13 (1))", () => {
    render(<StructureCanvas doc={sampleDoc()} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    connectRenderFrame();
    expect(region().querySelector("[data-canvas-issues]")).toBeNull();
  });

  it("사각형 뒤 배지를 누르면 onIssue(섹션, 문장 id) — 테두리는 포인터 통과 · iframe은 allow-scripts만", () => {
    const onIssue = vi.fn();
    render(<StructureCanvas doc={over()} selectedId="s-about" onSelect={() => {}} onIssue={onIssue} view="desktop" scrollable={false} />);
    connectRenderFrame();
    act(() => void fireEvent.click(region().querySelector("[data-issue-badge]")!));
    expect(onIssue).toHaveBeenCalledWith("s-hero", "canvas-issue-s-hero-title");
    expect(region().querySelector("[data-canvas-overlay]")).toHaveClass("pointer-events-none");
    expect(canvasFrame()).toHaveAttribute("sandbox", "allow-scripts");
  });

  it("render 메시지에는 문서·킷 토큰만 — 문제 문장·선택은 보내지 않는다(렌더 문서 편집기 UI 0)", () => {
    const { unmount } = render(<StructureCanvas doc={over()} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    const { sent } = connectRenderFrame();
    const render0 = sent.find((m) => m.type === "render")!;
    expect(Object.keys(render0).sort()).toEqual(["doc", "type"]);
    expect(sent).toContainEqual({ type: "select", instanceId: "s-hero" });
    unmount();
    render(<StructureCanvas doc={over()} kitTokens={SAMPLE_KIT_TOKENS} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    const withTokens = connectRenderFrame().sent.find((m) => m.type === "render")!;
    expect(Object.keys(withTokens).sort()).toEqual(["doc", "kitTokens", "type"]);
  });

  it("로컬 이미지 Blob → render 메시지 images로 Blob 자체를 보낸다(부모 blob: URL 아님, K4) · 없으면 키 없음", () => {
    const blob = new Blob(["x"], { type: "image/png" });
    const id = "11111111-1111-4111-8111-111111111111";
    render(<StructureCanvas doc={over()} kitTokens={SAMPLE_KIT_TOKENS} images={{ [id]: blob }} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    const msg = connectRenderFrame().sent.find((m) => m.type === "render") as { images?: Record<string, Blob> };
    expect(msg.images?.[id]).toBe(blob);
  });

  it("렌더 문서 error{NO_KIT_TOKENS}(폴백은 그림)는 오버레이 사각형을 지우지 않는다 · INVALID_DOC은 지운다 (MQ-1)", () => {
    render(<StructureCanvas doc={over()} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    connectRenderFrame();
    expect(within(region()).getByText(/^Hero · /)).toBeInTheDocument();
    act(() => frameSays({ type: "error", code: "NO_KIT_TOKENS" }));
    expect(within(region()).getByText(/^Hero · /)).toBeInTheDocument();
    act(() => frameSays({ type: "error", code: "INVALID_DOC" }));
    expect(within(region()).queryByText(/^Hero · /)).toBeNull();
  });

  it("미리보기 폭 = iframe 폭 — 태블릿 48rem · 모바일 24.375rem 프레임 안 iframe 100%", () => {
    const { rerender } = render(<StructureCanvas doc={over()} selectedId="s-hero" onSelect={() => {}} view="tablet" scrollable={false} />);
    expect(canvasFrame().parentElement!.style.width).toBe("48rem");
    expect(canvasFrame()).toHaveClass("w-full");
    rerender(<StructureCanvas doc={over()} selectedId="s-hero" onSelect={() => {}} view="mobile" scrollable={false} />);
    expect(canvasFrame().parentElement!.style.width).toBe("24.375rem");
  });
});

describe("데스크톱 프레임 1280 · 축소 보기 오버레이 정렬 (r4.10 · E-AC-15)", () => {
  /** 캔버스 안쪽 폭을 정해 주는 ResizeObserver 흉내(jsdom에는 없다) */
  const observeWidth = (width: number) =>
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private readonly callback: (entries: { contentRect: { width: number } }[]) => void) {}
        observe() {
          this.callback([{ contentRect: { width } }]);
        }
        disconnect() {}
      },
    );

  it("데스크톱 = 80rem 프레임 → 열 640px이면 50% 축소 · 캡션 '축소 보기 · 50%' · viewport 1280 · 가로 스크롤 0(열 폭 안)", () => {
    observeWidth(640);
    render(<StructureCanvas doc={sampleDoc()} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    const { sent } = connectRenderFrame();
    const zoomed = canvasFrame().parentElement!;
    expect(zoomed.style.width).toBe("80rem");
    expect(zoomed.style.zoom).toBe("0.5");
    expect(within(region()).getByText("축소 보기 · 50%")).toBeInTheDocument();
    expect(sent).toContainEqual({ type: "viewport", width: 1280 });
    vi.unstubAllGlobals();
  });

  it("오버레이는 축소 층 밖(글자 원래 크기) · 선택 테두리·문제 테두리 = 렌더 사각형 × 축소 비율", () => {
    observeWidth(640);
    const doc = sampleDoc();
    const over = { ...doc, sections: doc.sections.map((s) => (s.instanceId === "s-hero" ? { ...s, slots: { ...s.slots, title: "가".repeat(30) } } : s)) };
    render(<StructureCanvas doc={over} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    connectRenderFrame();
    const i = over.sections.findIndex((s) => s.instanceId === "s-hero");
    const overlay = region().querySelector<HTMLElement>("[data-canvas-overlay]")!;
    const zoomed = canvasFrame().parentElement!;
    expect(zoomed).not.toContainElement(overlay);
    const chip = within(region()).getByText(/^Hero · /);
    const box = chip.parentElement!;
    // fakeRects: 섹션 i = (0, i×100, 800, 96) → × 0.5
    expect([box.style.left, box.style.top, box.style.width, box.style.height]).toEqual(["0px", `${i * 50}px`, "400px", "48px"]);
    // 글자 슬롯 사각형(문제 테두리, 바깥 여백 4px은 축소하지 않는다)
    const badge = region().querySelector("[data-issue-badge]")!;
    const slotIndex = Object.entries(over.sections[i]!.slots).filter(([, v]) => typeof v === "string").findIndex(([k]) => k === "title");
    const ring = badge.parentElement!;
    expect([ring.style.left, ring.style.top, ring.style.width, ring.style.height]).toEqual(["0px", `${(i * 100 + 8 + slotIndex * 12) * 0.5 - 4}px`, `${400 * 0.5 + 8}px`, `${10 * 0.5 + 8}px`]);
    vi.unstubAllGlobals();
  });
});

describe("캔버스 이름 · 캡션 3상태 (m2a 3.4 · K-AC-33 · r4.9)", () => {
  it("스크롤 영역 접근 이름 = h2 '페이지 미리보기'(등급과 무관 고정) · iframe 이름 '페이지 미리보기 화면'", () => {
    render(<StructureCanvas doc={sampleDoc()} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable />);
    expect(screen.getByRole("heading", { level: 2, name: "페이지 미리보기" })).toBeInTheDocument();
    expect(region()).toHaveAttribute("tabindex", "0");
    expect(canvasFrame()).toHaveAttribute("title", "페이지 미리보기 화면");
  });

  it("캡션 = 문서 상태: 킷 토큰 있음 + cta-band 폴백 → '일부' · 킷 토큰 없음 → F0 · 라이브 영역 아님", async () => {
    await expectInjected();
    const { unmount } = render(<StructureCanvas doc={sampleDoc()} kitTokens={SAMPLE_KIT_TOKENS} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    const partial = within(region()).getByText(/^실제 렌더 \(F1 · 일부\) — 섹션 8개 중 1개는/);
    expect(partial.closest("[aria-live], [role=status]")).toBeNull();
    unmount();
    render(<StructureCanvas doc={sampleDoc()} selectedId="s-hero" onSelect={() => {}} view="desktop" scrollable={false} />);
    expect(within(region()).getByText(/^구조 미리보기 \(F0\)/)).toBeInTheDocument();
  });
});
