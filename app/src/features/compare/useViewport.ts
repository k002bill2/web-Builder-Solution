import { useSyncExternalStore } from "react";

/** 비교 보드 반응형 구간 (SPEC 5) — Tailwind md(48rem=768) · xl(80rem=1280) */
export type Viewport = "wide" | "medium" | "narrow";

const WIDE = "(min-width: 80rem)";
const MEDIUM = "(min-width: 48rem)";
const supported = () => typeof window !== "undefined" && typeof window.matchMedia === "function";

function subscribe(onChange: () => void): () => void {
  if (!supported()) return () => {};
  const lists = [WIDE, MEDIUM].map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener("change", onChange));
  return () => lists.forEach((list) => list.removeEventListener("change", onChange));
}

function snapshot(): Viewport {
  if (!supported() || window.matchMedia(WIDE).matches) return "wide";
  return window.matchMedia(MEDIUM).matches ? "medium" : "narrow";
}

/**
 * 표와 아코디언을 CSS로 숨기지 않고 하나만 그린다 — 둘 다 그리면 같은 선택 버튼이 두 벌 생겨
 * 보조기기·Tab 순서에 중복으로 잡힌다. matchMedia가 없으면(테스트 환경) 넓은 화면으로 본다.
 */
export function useViewport(): Viewport {
  return useSyncExternalStore(subscribe, snapshot, () => "wide");
}
