import { describe, expect, it } from "vitest";
import { PREVIEW_VIEWS } from "../detail/previewView";
import { FRAME_REM, PREVIEW_WIDTH_OPTIONS, previewScale, scaleCaption } from "./previewFrame";

/** 미리보기 폭 프레임 · 축소 보기 (DS-2A-05 E-S31 · 4.1 · E-AC-15) */
describe("previewFrame", () => {
  it("라벨·값 = 상세 미리보기 PREVIEW_VIEWS와 같다(E-AC-15)", () => {
    expect(PREVIEW_WIDTH_OPTIONS).toEqual(PREVIEW_VIEWS);
  });

  it("프레임 폭 = 데스크톱 1280 · 태블릿 768 · 모바일 390(rem) — r4.10 데스크톱 프레임 = 실제 1280(열 폭 규칙 폐기)", () => {
    expect(FRAME_REM.desktop * 16).toBe(1280);
    expect(FRAME_REM.tablet * 16).toBe(768);
    expect(FRAME_REM.mobile * 16).toBe(390);
  });

  it("프레임이 캔버스보다 넓으면 축소 비율(내림 %) · 좁거나 같으면 1 · 측정 전(0)이면 1", () => {
    expect(previewScale(768, 500)).toBeCloseTo(500 / 768);
    expect(previewScale(390, 500)).toBe(1);
    expect(previewScale(768, 768)).toBe(1);
    expect(previewScale(768, 0)).toBe(1);
    expect(previewScale(undefined, 300)).toBe(1);
  });

  it("캡션 '축소 보기 · N%'(내림) — 축소가 아니면 없음", () => {
    expect(scaleCaption(500 / 768)).toBe("축소 보기 · 65%");
    expect(scaleCaption(1)).toBeUndefined();
  });
});
