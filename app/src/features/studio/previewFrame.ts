import type { PreviewView } from "../detail/previewView";

/**
 * 미리보기 폭 라벨 — 상세 미리보기 `PREVIEW_VIEWS`(previewView.ts)와 같은 값. 값 import 대신 타입만 쓴다:
 * 값을 import하면 previewView가 상세·편집기 공유 청크로 떨어져 `/references/:id` +0.17 · 공통 +0.03KB(S6 1차 빌드 실측 — PROGRESS, 다른 화면 ±0.03 규칙).
 * 같은 값인지는 `previewFrame.test.ts`가 `PREVIEW_VIEWS`와 대조한다(E-AC-15).
 */
export const PREVIEW_WIDTH_OPTIONS: readonly { readonly value: PreviewView; readonly label: string }[] = Object.freeze([
  { value: "desktop", label: "데스크톱" },
  { value: "tablet", label: "태블릿" },
  { value: "mobile", label: "모바일" },
]);

/**
 * 미리보기 폭 프레임 (DS-2A-05 E-S31 · 4.1 · E-AC-15).
 * 폭은 rem(데스크톱 1280 · 태블릿 768 · 모바일 390 기준) — SPEC r4.10: 데스크톱도 실제 1280 폭(80rem). 열보다 넓으면 축소 보기.
 */
export const FRAME_REM: Readonly<Record<PreviewView, number>> = Object.freeze({ desktop: 80, tablet: 48, mobile: 24.375 });

/** 프레임(px)이 캔버스(px)보다 넓으면 축소 비율, 아니면 1. 측정 전(0)·열 폭 프레임은 1 */
export function previewScale(framePx: number | undefined, availablePx: number): number {
  if (framePx === undefined || availablePx <= 0 || framePx <= availablePx) return 1;
  return availablePx / framePx;
}

/** "축소 보기 · 48%"(E-S31) — 비율은 내림(실제보다 크게 적지 않게) */
export const scaleCaption = (scale: number): string | undefined => (scale < 1 ? `축소 보기 · ${Math.floor(scale * 100)}%` : undefined);
