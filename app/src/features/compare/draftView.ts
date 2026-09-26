/** 초안 목록 화면 모델 (SPEC 2.4 · ADR-005 D2). 도메인 초안 항목에 표시용 보조 정보만 붙인다. */
import type { ComparisonResult } from "../../domain/compareBoard";
import type { DraftItemData, ProfileDraft } from "../../domain/profileDraft";
import { SECTION_LIBRARY, resolveVariant } from "../../domain/sectionLibrary";

/** D2: 사업자정보 없는 Footer는 확정 시 확장 변형으로 바뀐다는 것을 미리 알린다 */
export const FOOTER_AUTO_NOTE = "확정 시 사업자정보 확장형으로 바뀝니다";

export interface DraftItemView extends DraftItemData {
  readonly note?: string;
  /** 팔레트 항목의 대표색 견본 (장식 — 값 텍스트에 hex가 함께 있다, A-12) */
  readonly swatch?: string;
  /** 출처 색 점 = 출처 레퍼런스 대표색 (v2 4.4, 장식 — 출처는 글자로도 있다). 레퍼런스 출처(pick·default)만 */
  readonly dot?: string;
}

function footerNote(item: DraftItemData, results: readonly ComparisonResult[]): string | undefined {
  if (!("referenceId" in item.source)) return undefined;
  const referenceId = item.source.referenceId;
  const cell = results.find((r) => r.referenceId === referenceId)?.comparison?.cells.footer;
  if (cell?.meta?.hasBusinessInfo !== false || cell.binding?.kind !== "section") return undefined;
  // 확정 시 교체(memoryCompareBoardRepository#withBusinessInfoFooter)와 같은 조건 — 확장 변형이 있을 때만
  return resolveVariant(SECTION_LIBRARY, "footer", cell.binding.variant)?.def.businessInfoVariant ? FOOTER_AUTO_NOTE : undefined;
}

export function draftItemsView(draft: ProfileDraft, results: readonly ComparisonResult[]): readonly DraftItemView[] {
  const primary = draft.status === "ready" ? draft.palette.find((p) => p.role === "primary")?.hex : undefined;
  return draft.items.map((item) => {
    const { source } = item;
    const dot = "referenceId" in source ? results.find((r) => r.referenceId === source.referenceId)?.reference?.colorPalette.primary : undefined;
    const view: DraftItemView = dot ? { ...item, dot } : item;
    if (item.rowId === "footer") {
      const note = footerNote(item, results);
      return note ? { ...view, note } : view;
    }
    return item.rowId === "palette" && primary ? { ...view, swatch: primary } : view;
  });
}

