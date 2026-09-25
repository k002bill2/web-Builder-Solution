import type { Option } from "../../fixtures/catalogFilters";

/** 상세 탭 (목업 renderVals().detailTabs). 선택 상태는 URL 쿼리 `tab`에 둔다 — 기본값(sections)은 생략. */
export type DetailTab = "sections" | "tokens" | "mobile" | "scores";

export const DETAIL_TABS: readonly Option<DetailTab>[] = Object.freeze([
  { id: "sections", label: "섹션 구성" },
  { id: "tokens", label: "토큰" },
  { id: "mobile", label: "모바일" },
  { id: "scores", label: "점수 이력" },
]);

export const DEFAULT_DETAIL_TAB: DetailTab = "sections";

export function parseDetailTab(raw: string | null): DetailTab {
  return DETAIL_TABS.find((t) => t.id === raw)?.id ?? DEFAULT_DETAIL_TAB;
}

export function toDetailTabParams(tab: DetailTab): URLSearchParams {
  return new URLSearchParams(tab === DEFAULT_DETAIL_TAB ? {} : { tab });
}
