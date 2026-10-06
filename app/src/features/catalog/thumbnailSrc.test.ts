import { afterEach, vi } from "vitest";
import { thumbnailSrc } from "./thumbnailSrc";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("thumbnailSrc (M3P-3b · ADR-004 개정 7 결정 1)", () => {
  it("테스트·dev = 버전 빈 값 → undefined(img 0·와이어 유지) · 버전 있으면 같은 출처 고정 경로 /thumbs/{id}.svg?v=버전", () => {
    expect(__THUMBS_VERSION__).toBe("");
    expect(thumbnailSrc("ref-a")).toBeUndefined();
    vi.stubGlobal("__THUMBS_VERSION__", "0123abcd");
    expect(thumbnailSrc("ref-a")).toBe("/thumbs/ref-a.svg?v=0123abcd");
    expect(thumbnailSrc("gen-cafe-fnb-1")).toBe("/thumbs/gen-cafe-fnb-1.svg?v=0123abcd");
  });
});
