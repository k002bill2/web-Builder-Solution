/** 보드에서 미리 알리는 규칙 R-07·R-08·R-12 + R-15 안내 (SPEC 3.3·3.4). 확정은 막지 않는다. */
import type { ColumnLabel, CompareBoard, ComparisonResult, PickableRowId } from "./compareBoard";
import { COLUMN_LABELS } from "./compareBoard";
import { AA_BODY_RATIO, ON_PRIMARY, checkPaletteContrast, formatRatio, nearestCompliantColor, type ContrastCheck, type ContrastCheckId } from "./contrast";
import type { ReadyDraft } from "./profileDraft";
import { SECTION_LIBRARY, resolveVariant } from "./sectionLibrary";

export type WarningFix =
  | { readonly kind: "use-corrected-primary"; readonly from: string; readonly hex: string; readonly ratio: string; readonly actionLabel: string }
  | { readonly kind: "pick-column"; readonly rowId: PickableRowId; readonly referenceId: string; readonly columnLabel: ColumnLabel; readonly actionLabel: string }
  | { readonly kind: "auto-business-variant"; readonly variant: string; readonly message: string }
  | { readonly kind: "defer-to-profile"; readonly message: string };

export interface BoardWarning {
  readonly rule: "R-07" | "R-08" | "R-12" | "R-15";
  readonly check?: ContrastCheckId;
  readonly tone: "info" | "warning";
  readonly title: string;
  /** 원인 · 수치 */
  readonly message: string;
  readonly ratio?: string;
  /** 대체안 */
  readonly fixes: readonly WarningFix[];
}

const BELOW = `기준 ${AA_BODY_RATIO}:1보다 낮습니다`;

/** 보드 열 중 행 조건을 만족하는 사용 가능 열 (열 문자 순) */
function columnsWhere(board: CompareBoard, results: readonly ComparisonResult[], rowId: PickableRowId, test: (r: ComparisonResult) => boolean, noun: string): WarningFix[] {
  return [...board.columns]
    .sort((a, b) => COLUMN_LABELS.indexOf(a.label) - COLUMN_LABELS.indexOf(b.label))
    .flatMap((column) => {
      const result = results.find((r) => r.referenceId === column.referenceId);
      if (!result || result.status !== "available" || !result.comparison?.cells[rowId].binding || !test(result)) return [];
      return [{ kind: "pick-column", rowId, referenceId: column.referenceId, columnLabel: column.label, actionLabel: `${column.label}의 ${noun}로 바꾸기` } as const];
    });
}

function correctedPrimary(primary: string, against: string): WarningFix {
  const fix = nearestCompliantColor(primary, against);
  return { kind: "use-corrected-primary", from: primary, hex: fix.hex, ratio: formatRatio(fix.ratio), actionLabel: "보정값 쓰기" };
}

function contrastWarning(check: ContrastCheck, board: CompareBoard, results: readonly ComparisonResult[], draft: ReadyDraft): BoardWarning {
  const ratio = formatRatio(check.ratio);
  const base = { rule: "R-08", check: check.id, tone: "warning", title: "대비 부족", ratio } as const;
  if (check.id === "C-1") {
    const source = draft.items.find((i) => i.rowId === "palette")?.source;
    const subject = source && "columnLabel" in source ? `${source.columnLabel} 팔레트 대표색` : "사용자 대표색";
    return { ...base, message: `${subject} 위 흰 글자 대비가 ${ratio}로 ${BELOW}(버튼·어두운 카드).`, fixes: [correctedPrimary(check.background, ON_PRIMARY)] };
  }
  if (check.id === "C-2") {
    return { ...base, message: `본문 잉크와 배경 대비가 ${ratio}로 ${BELOW}.`, fixes: [{ kind: "defer-to-profile", message: "프로필 단계에서 보정을 제안합니다" }] };
  }
  const lightCards = columnsWhere(board, results, "card", (r) => r.comparison?.cells.card.binding?.kind === "card" && r.comparison.cells.card.binding.surfaceTone === "light", "카드");
  return {
    ...base,
    message: `어두운 카드의 글자(잉크)와 카드 표면(대표색) 대비가 ${ratio}로 ${BELOW}.`,
    // 밝은 카드 열이 없으면 카드 표면(대표색)을 잉크 대비 4.5:1로 보정 — 흰 글자 기준(C-1) 보정은 어두운 잉크와의 대비를 더 낮출 수 있다
    fixes: lightCards.length > 0 ? lightCards : [correctedPrimary(check.background, check.foreground)],
  };
}

function footerWarning(board: CompareBoard, results: readonly ComparisonResult[], draft: ReadyDraft): BoardWarning | undefined {
  const source = draft.items.find((i) => i.rowId === "footer")?.source;
  if (!source || !("referenceId" in source)) return undefined;
  const cell = results.find((r) => r.referenceId === source.referenceId)?.comparison?.cells.footer;
  if (cell?.meta?.hasBusinessInfo !== false || cell.binding?.kind !== "section") return undefined;
  const alternatives = columnsWhere(board, results, "footer", (r) => r.comparison?.cells.footer.meta?.hasBusinessInfo === true, "Footer");
  const variant = resolveVariant(SECTION_LIBRARY, "footer", cell.binding.variant)?.def.businessInfoVariant;
  const auto: WarningFix[] = variant ? [{ kind: "auto-business-variant", variant, message: "확정 시 같은 모양의 사업자정보 확장 변형으로 바꿉니다" }] : [];
  return { rule: "R-12", tone: "warning", title: "사업자정보 푸터 필요", message: "발행 전에 사업자정보가 있는 푸터가 필요합니다", fixes: alternatives.length > 0 ? alternatives : auto };
}

export function evaluateBoardWarnings(board: CompareBoard, results: readonly ComparisonResult[], draft: ReadyDraft): readonly BoardWarning[] {
  const motion: BoardWarning[] = draft.notices.motionCapped
    ? [{ rule: "R-07", tone: "info", title: "모션 상한 적용", message: "생성 상한이 L2라 '중간'으로 적용됩니다", fixes: [] }]
    : [];
  const contrast = checkPaletteContrast(draft.palette, draft.cardTone).filter((c) => !c.pass).map((c) => contrastWarning(c, board, results, draft));
  const footer = footerWarning(board, results, draft);
  const rebinding: BoardWarning[] = draft.notices.rebinding
    ? [{ rule: "R-15", tone: "info", title: "팔레트·폰트 재적용", message: "고른 요소는 모두 초안의 팔레트·폰트로 다시 칠해집니다", fixes: [] }]
    : [];
  return [...motion, ...contrast, ...(footer ? [footer] : []), ...rebinding];
}
