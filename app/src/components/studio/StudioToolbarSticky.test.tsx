import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

afterEach(() => restoreViewport());

/** UX-POLISH-1 B-RS-12 · UXP-AC-08 — 탭 배치(<1024)는 문서 스크롤이라 툴바(h1·저장 상태 줄)를 위에 붙인다. 분할·3단은 h-dvh 고정이라 무변화 */
describe("탭 배치 툴바 sticky (UXP-AC-08)", () => {
  it("390(탭) → header에 sticky top-0 z-10", async () => {
    await openStudio({ width: 390 });
    expect(screen.getByRole("banner")).toHaveClass("sticky", "top-0", "z-10");
  });

  it.each([1024, 1280])("%i(분할·3단) → sticky 없음(배치 무변화)", async (width) => {
    await openStudio({ width });
    const banner = screen.getByRole("banner");
    expect(banner).not.toHaveClass("sticky");
    expect(banner).not.toHaveClass("top-0");
  });
});
