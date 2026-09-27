import { useSyncExternalStore } from "react";

/**
 * 편집기 배치 (DS-2A-05 SPEC 4.1): ≥1280 3단 · 1024~1279 2단 · <1024 탭. Tailwind xl(80rem) · lg(64rem).
 * 배치마다 트리를 따로 그린다(4.3 — CSS `order` 금지) → `matchMedia`는 이 한 곳. matchMedia가 없으면(테스트 환경) 3단.
 * `features/compare/useViewport`와 같은 모양이지만 import하지 않는다 — 비교 보드 청크와 모듈을 나누지 않게.
 */
export type LayoutMode = "wide" | "split" | "tabs";

const WIDE = "(min-width: 80rem)";
const SPLIT = "(min-width: 64rem)";
const supported = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

function subscribe(onChange: () => void): () => void {
  if (!supported()) return () => {};
  const lists = [WIDE, SPLIT].map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

function snapshot(): LayoutMode {
  if (!supported() || window.matchMedia(WIDE).matches) return "wide";
  return window.matchMedia(SPLIT).matches ? "split" : "tabs";
}

export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, snapshot, () => "wide");
}
