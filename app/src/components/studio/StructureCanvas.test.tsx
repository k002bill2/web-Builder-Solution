import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { section, sampleDoc } from "../../engine/testing/sampleDoc";
import { canvasFrame, connectRenderFrame, frameSays } from "../../features/studio/testing/renderFrame";
import { SAMPLE_KIT_TOKENS } from "../../render/testing/sampleKitTokens";
import { StructureCanvas } from "./StructureCanvas";

/**
 * 캔버스 호스트 · 부모 오버레이 (M2A-1 R4 · SPEC 5.7 r4.8 · E-AC-49). 블록 그리기 단언은 렌더 문서로 옮겼다(render/fallback/FallbackCanvas.test.tsx).
 * 이 파일에 남은 것: 선택 라벨 칩(부모 오버레이) · 문제 표시(부모) · iframe.
 */
const region = () => screen.getByRole("region", { name: "구조 미리보기" });

describe("구조 미리보기 — 선택 라벨 칩은 부모 오버레이 (5.7 · B-12)", () => {
  it("cards-2 선택 → 칩 'Services · 카드 2열' · region '구조 미리보기'", () => {
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
    const badge = within(region()).getByText("경고 1");
    for (const el of [sentence, badge]) {
      expect(el.className).not.toMatch(/--canvas-/);
      expect(el).toHaveClass("bg-background-normal");
    }
    const ring = sentence.parentElement!.querySelector('[aria-hidden="true"]')!;
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
    expect(within(region()).queryByText("경고 1")).toBeNull();
    expect(within(region()).queryByText(/^Hero · /)).toBeNull();
    expect(region().querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it("사각형 뒤 배지를 누르면 onIssue(섹션, 문장 id) — 테두리는 포인터 통과 · iframe은 allow-scripts만", () => {
    const onIssue = vi.fn();
    render(<StructureCanvas doc={over()} selectedId="s-about" onSelect={() => {}} onIssue={onIssue} view="desktop" scrollable={false} />);
    connectRenderFrame();
    act(() => void fireEvent.click(within(region()).getByText("경고 1")));
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
