import type { SegmentOption } from "../../components/ds/SegmentedControl";

/** 상세 미리보기 폭 (v2 SPEC 4.3). 선택 상태는 URL 쿼리 `view`에 둔다 — 기본값(desktop)은 생략. */
export type PreviewView = "desktop" | "tablet" | "mobile";

export const PREVIEW_VIEWS: readonly SegmentOption<PreviewView>[] = Object.freeze([
  { value: "desktop", label: "데스크톱" },
  { value: "tablet", label: "태블릿" },
  { value: "mobile", label: "모바일" },
]);

export const DEFAULT_PREVIEW_VIEW: PreviewView = "desktop";

const isView = (raw: string | null): raw is PreviewView => PREVIEW_VIEWS.some((v) => v.value === raw);

/** `view`가 유효하면 그 값, 아니면 옛 북마크 `?tab=mobile`(1a-02 탭)을 모바일로 해석한다. */
export function parsePreviewView(params: URLSearchParams): PreviewView {
  const view = params.get("view");
  if (isView(view)) return view;
  return params.get("tab") === "mobile" ? "mobile" : DEFAULT_PREVIEW_VIEW;
}

/** 옛 `tab`은 남기지 않는다. */
export function toPreviewViewParams(view: PreviewView): URLSearchParams {
  return new URLSearchParams(view === DEFAULT_PREVIEW_VIEW ? {} : { view });
}
