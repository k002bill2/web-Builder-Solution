import { resolveComparisons, type ComparisonCatalog } from "../domain/comparisonCells";
import { emptyBoard, type BoardColumn, type CompareBoard, type ComparisonResult, type Picks } from "../domain/compareBoard";
import { SECTION_LIBRARY } from "../domain/sectionLibrary";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import { referenceFixtures } from "../fixtures/references";
import type { DesignReference } from "../domain/reference";

export const FIXTURE_CATALOG: ComparisonCatalog = {
  references: referenceFixtures,
  details: referenceDetailFixtures,
  attributes: referenceComparisonAttributes,
};

/** 열 문자를 A부터 차례로 붙인 보드. */
export function boardOf(ids: readonly string[], picks: Picks = {}, extra: Partial<CompareBoard> = {}): CompareBoard {
  const labels = ["A", "B", "C", "D", "E", "F"] as const;
  const columns: BoardColumn[] = ids.map((referenceId, i) => ({ referenceId, label: labels[i]! }));
  return { ...emptyBoard("board-1", "2026-09-25T00:00:00.000Z"), columns, picks, revision: 1, ...extra };
}

/** ref-b를 회수(external_observed로 전환)한 카탈로그 */
export function catalogWithdrawing(id: string): ComparisonCatalog {
  const references: DesignReference[] = referenceFixtures.map((r) =>
    r.id === id ? { ...r, licenseStatus: "external_observed" } : r,
  );
  return { ...FIXTURE_CATALOG, references };
}

export function resultsOf(ids: readonly string[], catalog: ComparisonCatalog = FIXTURE_CATALOG): readonly ComparisonResult[] {
  return resolveComparisons(ids, catalog, SECTION_LIBRARY);
}
