import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ProjectRepositoryError } from "../../data/projectRepository";
import type { ProfileSeries } from "../../domain/profile";
import { passingDoc, withPhoto } from "../../engine/testing/gateKit";
import { sampleDoc, section, withSections } from "../../engine/testing/sampleDoc";
import { sampleTheme } from "../../engine/testing/sampleTheme";
import type { PngRequest } from "../../features/studio/png/pngCapture";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";
import { PngSave } from "./PngSave";

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

/** 캡처 청크(조작 뒤) 흉내 — 실제 캡처는 pngCapture.test(단위)와 브라우저 판정(REPORT 6절) */
const png = vi.hoisted(() => ({
  savePng: vi.fn<(request: PngRequest) => Promise<string>>(),
  reportFailure: vi.fn<(error: unknown) => void>(),
}));
vi.mock("../../features/studio/png/pngCapture", () => png);
afterEach(() => {
  restoreViewport();
  png.savePng.mockReset();
  png.reportFailure.mockReset();
});

const REQUEST: PngRequest = { doc: sampleDoc(), view: "desktop", name: "가게", revision: 3 };
const button = () => screen.getByRole("button", { name: /PNG 내려받기|PNG 만드는 중…/ });
const deferred = () => {
  let resolve!: (text: string) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<string>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};

describe("PNG 버튼 4상태 (m2a 3.3 · K-AC-19)", () => {
  it("이름표 '이미지로 저장' · outline 버튼 'PNG 내려받기' · 캡션(폭 이름 · 폭) · 폴백 있으면 두 번째 문장 · aria-describedby = 캡션", () => {
    render(<PngSave ready view="mobile" fallbackCount={2} capture={() => REQUEST} />);
    expect(screen.getByRole("heading", { name: "이미지로 저장" })).toBeInTheDocument();
    expect(button()).not.toHaveAttribute("aria-disabled");
    const caption = document.getElementById(button().getAttribute("aria-describedby")!)!;
    expect(caption.textContent).toBe("지금 미리보기 폭(모바일 · 390)의 페이지 전체를 한 장으로 저장합니다. 구조 미리보기 섹션 2개는 표식과 함께 담깁니다.");
  });

  it("준비 전 → aria-disabled + 이유 '미리보기를 그리는 중입니다'(describedby = 이유 · 캡션) · 눌러도 캡처 0", () => {
    render(<PngSave ready={false} view="desktop" fallbackCount={0} capture={() => REQUEST} />);
    expect(button()).toHaveAttribute("aria-disabled", "true");
    const ids = button().getAttribute("aria-describedby")!.split(" ");
    expect(ids.map((id) => document.getElementById(id)!.textContent)).toEqual(["미리보기를 그리는 중입니다", "지금 미리보기 폭(데스크톱 · 1280)의 페이지 전체를 한 장으로 저장합니다."]);
    fireEvent.click(button());
    expect(png.savePng).not.toHaveBeenCalled();
  });

  it("진행 → aria-busy + 'PNG 만드는 중…' · 두 번 누름 무시 → 성공 role=status 문장 · 버튼 원래 글자", async () => {
    const run = deferred();
    png.savePng.mockReturnValue(run.promise);
    render(<PngSave ready view="desktop" fallbackCount={0} capture={() => REQUEST} />);
    fireEvent.click(button());
    await waitFor(() => expect(button()).toHaveAttribute("aria-busy", "true"));
    expect(button()).toHaveTextContent("PNG 만드는 중…");
    fireEvent.click(button());
    await act(async () => run.resolve("PNG를 내려받았습니다 · 가게_1280_r3.png"));
    expect(png.savePng).toHaveBeenCalledTimes(1);
    expect(png.savePng).toHaveBeenCalledWith(REQUEST);
    expect(screen.getByRole("status")).toHaveTextContent("PNG를 내려받았습니다 · 가게_1280_r3.png");
    expect(button()).toHaveTextContent("PNG 내려받기");
    expect(button()).not.toHaveAttribute("aria-busy");
  });

  it("실패 → role=alert 'PNG를 만들지 못했습니다 — 다시 눌러 주세요' · png_failed 보고 · 같은 버튼으로 다시 시도", async () => {
    png.savePng.mockRejectedValueOnce(new Error("x")).mockResolvedValueOnce("PNG를 내려받았습니다 · 가게_1280_r3.png");
    render(<PngSave ready view="desktop" fallbackCount={0} capture={() => REQUEST} />);
    fireEvent.click(button());
    expect(await screen.findByRole("alert")).toHaveTextContent("PNG를 만들지 못했습니다 — 다시 눌러 주세요");
    await waitFor(() => expect(png.reportFailure).toHaveBeenCalledTimes(1));
    fireEvent.click(button());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("PNG를 내려받았습니다"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("편집기 안 PNG 묶음 (K-AC-19 · E-AC-50 — 게이트 차단·폴백과 무관 · requestExport 0)", () => {
  const SERIES = { profileId: "profile-1", latestVersion: 2, versions: [sampleTheme().profile] } as unknown as ProfileSeries;
  it("게이트 차단 + 폴백 → 내보내기 두 버튼은 막혀도 PNG는 열림 · aria-describedby에 내보내기 이유 id 0 · 누르면 지금 문서·폭·이름·revision으로 캡처 · requestExport 0", async () => {
    await expectInjected();
    png.savePng.mockResolvedValue("PNG를 내려받았습니다 · x.png");
    const requestExport = vi.fn(async () => Promise.reject(new ProjectRepositoryError("GENERATOR_UNAVAILABLE", "x")));
    const doc = withSections(passingDoc(), passingDoc().sections.map((s) => (s.type === "hero" ? withPhoto(section("hero", "fullbleed-left", "s-hero")) : s)));
    const { saved } = await openStudio({ doc, series: SERIES, repository: { requestExport } });
    const gate = screen.getByRole("region", { name: "품질 게이트" });
    await waitFor(() => expect(within(gate).queryByText("검사하는 중입니다")).not.toBeInTheDocument());
    expect(within(gate).getByRole("button", { name: "정적 HTML 내보내기" })).toHaveAttribute("aria-disabled", "true");
    const pngButton = within(gate).getByRole("button", { name: "PNG 내려받기" });
    await waitFor(() => expect(pngButton).not.toHaveAttribute("aria-disabled"));
    expect(pngButton.getAttribute("aria-describedby")).not.toMatch(/export-reason/);
    expect(within(gate).getByText(/구조 미리보기 섹션 1개는 표식과 함께 담깁니다\.$/)).toBeInTheDocument();
    act(() => void fireEvent.click(pngButton));
    await waitFor(() => expect(png.savePng).toHaveBeenCalledTimes(1));
    const request = png.savePng.mock.calls[0]![0];
    expect(request.view).toBe("desktop");
    expect(request.name).toBe("동네 치과 클리닉 프로젝트");
    expect(request.revision).toBe(doc.revision + saved.length); // 마지막으로 저장된 revision(stub saveDoc은 +1)
    expect(request.doc.sections.map((s) => s.instanceId)).toEqual(doc.sections.map((s) => s.instanceId));
    expect(request.kitTokens?.palette.primary).toBeTruthy();
    expect(requestExport).not.toHaveBeenCalled();
  });
});
