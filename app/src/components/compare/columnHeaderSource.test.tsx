import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ComparisonCatalog } from "../../domain/comparisonCells";
import { buildBoardView } from "../../features/compare/boardView";
import { generatedReferenceComparisonAttributes, generatedReferenceDetailFixtures } from "../../fixtures/generatedReferenceDetails";
import { generatedReferenceFixtures } from "../../fixtures/generatedReferences";
import { boardOf, FIXTURE_CATALOG, resultsOf } from "../../test/compareFixtures";
import { ComparisonAccordion } from "./ComparisonAccordion";
import { ComparisonTable } from "./ComparisonTable";

/** 비교 열 머리 출처 표식 (SPEC gen-mark-2 3.1 · GM2-AC-U1~U3·U6) — 라이선스 한국어 Tag → "생성 조합" Tag 순서, 카드·상세와 같은 부품. */

const GEN = generatedReferenceFixtures[0]!;
const CATALOG: ComparisonCatalog = {
  references: [...FIXTURE_CATALOG.references, ...generatedReferenceFixtures],
  details: { ...FIXTURE_CATALOG.details, ...generatedReferenceDetailFixtures },
  attributes: { ...FIXTURE_CATALOG.attributes, ...generatedReferenceComparisonAttributes },
};
/** 생성 레퍼런스를 회수(external_observed)한 카탈로그 */
const WITHDRAWN_GEN: ComparisonCatalog = {
  ...CATALOG,
  references: CATALOG.references.map((r) => (r.id === GEN.id ? { ...r, licenseStatus: "external_observed" as const } : r)),
};

const IDS = ["ref-a", GEN.id, "missing-id"];

function viewOf(ids: readonly string[] = IDS, catalog: ComparisonCatalog = CATALOG) {
  return buildBoardView(boardOf(ids), resultsOf(ids, catalog));
}

function renderBoard(kind: "table" | "accordion", ids: readonly string[] = IDS, catalog: ComparisonCatalog = CATALOG) {
  const view = viewOf(ids, catalog);
  const Component = kind === "table" ? ComparisonTable : ComparisonAccordion;
  render(
    <Component
      columns={view.columns}
      rows={view.rows}
      picks={{}}
      pickAllLabel="이 레퍼런스로 전부 선택"
      onToggle={vi.fn()}
      onRemoveColumn={vi.fn()}
      onPickAll={vi.fn()}
    />,
  );
}

/** 열 문자 배지로 열 머리(th 또는 li)를 찾는다 */
function headerOf(label: string): HTMLElement {
  const badge = screen.getAllByText(label, { selector: "span" }).find((el) => el.classList.contains("bg-surface-inverse"))!;
  return (badge.closest("th") ?? badge.closest("li"))!;
}

const follows = (a: Node, b: Node) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

describe("GM2-AC-U3 boardView sourceKind", () => {
  it("생성 열 = library_composition, 큐레이션 열 = undefined, missing 열 = undefined", () => {
    const [curated, generated, missing] = viewOf().columns;
    expect(generated!.sourceKind).toBe("library_composition");
    expect(curated!.sourceKind).toBeUndefined();
    expect(missing!.status).toBe("missing");
    expect(missing!.sourceKind).toBeUndefined();
  });
});

describe.each(["table", "accordion"] as const)("비교 열 머리 출처 표식 (%s)", (kind) => {
  it("GM2-AC-U1: 생성 열 — 접두 '라이선스: ' → '자체 제작' → '생성 조합' DOM 순서, aria-hidden 조상 0", () => {
    renderBoard(kind);
    const header = within(headerOf("B"));
    const prefix = header.getByText("라이선스:");
    expect(prefix).toHaveClass("sr-only");
    const license = header.getByText("자체 제작");
    const gens = header.getAllByText("생성 조합");
    expect(gens).toHaveLength(1);
    expect(follows(prefix, license)).toBe(true);
    expect(follows(license, gens[0]!)).toBe(true);
    for (const el of [prefix, license, gens[0]!]) expect(el.closest('[aria-hidden="true"]')).toBeNull();
    // 라이선스·생성 조합 Tag는 업종과 같은 flex 줄의 직접 자식으로 녹아든다(래퍼 contents — SPEC-2 3.1 배치 계약)
    const row = header.getByText("뷰티", { selector: "span" }).parentElement!;
    expect(row).toContainElement(license);
    expect(license.parentElement === row || license.parentElement!.classList.contains("contents")).toBe(true);
  });

  it("GM2-AC-U2·U6: 큐레이션 열 — '생성 조합' 0, 라이선스 '자체 제작'(영문 0) · missing 열 — 라이선스·생성 조합 0", () => {
    renderBoard(kind);
    const curated = within(headerOf("A"));
    expect(curated.queryByText("생성 조합")).toBeNull();
    expect(curated.getByText("자체 제작")).toBeInTheDocument();
    expect(curated.queryByText("internal")).toBeNull();
    const missing = within(headerOf("C"));
    expect(missing.queryByText("라이선스:")).toBeNull();
    expect(missing.queryByText("생성 조합")).toBeNull();
    expect(missing.getByText("사용 불가")).toBeInTheDocument();
  });

  it("GM2-AC-U2: withdrawn 생성 열 — '외부 관찰' → '생성 조합' → '사용 불가' 공존", () => {
    renderBoard(kind, ["ref-a", GEN.id], WITHDRAWN_GEN);
    const header = within(headerOf("B"));
    const license = header.getByText("외부 관찰");
    const gen = header.getByText("생성 조합");
    const unavailable = header.getByText("사용 불가");
    expect(follows(license, gen)).toBe(true);
    expect(follows(gen, unavailable)).toBe(true);
    expect(header.queryByText("external_observed")).toBeNull();
  });
});
