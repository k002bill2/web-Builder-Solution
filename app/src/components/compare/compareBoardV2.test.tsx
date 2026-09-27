import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Picks } from "../../domain/compareBoard";
import { FONT_OPTIONS } from "../../domain/fonts";
import { buildProfileDraft } from "../../domain/profileDraft";
import { SECTION_LIBRARY } from "../../domain/sectionLibrary";
import { boardEngine } from "../../features/compare/boardEngine";
import { buildBoardView } from "../../features/compare/boardView";
import { draftItemsView } from "../../features/compare/draftView";
import { referenceFixtures } from "../../fixtures/references";
import { boardOf, resultsOf } from "../../test/compareFixtures";
import { ComparisonTable } from "./ComparisonTable";
import { DraftPanel } from "./DraftPanel";

/** 디자인 v2 비교 보드 (SPEC v2 4.4 · V2-AC-33~36). 흐름·접근 이름은 기존 테스트가 지키고, 여기서는 표면·표시 방식만 본다. */

const THREE = ["ref-a", "ref-b", "ref-c"];
// 픽스처 대표색 (fixtures/references.ts)
const COLOR = { a: "rgb(139, 94, 60)", b: "rgb(31, 31, 31)" } as const;

function renderTable(picks: Picks = {}, ids: readonly string[] = THREE, pickAllLabel = "이 레퍼런스로 전부 선택") {
  const results = resultsOf(ids);
  const view = buildBoardView(boardOf(ids, picks), results);
  return render(
    <ComparisonTable
      columns={view.columns}
      rows={view.rows}
      picks={picks}
      pickAllLabel={pickAllLabel}
      onToggle={vi.fn()}
      onRemoveColumn={vi.fn()}
      onPickAll={vi.fn()}
    />,
  );
}

function renderPanel(picks: Picks, status: Parameters<typeof DraftPanel>[0]["status"] = { kind: "unconfirmed", nextVersion: 1 }) {
  const results = resultsOf(THREE);
  const draft = buildProfileDraft(boardOf(THREE, picks), results, SECTION_LIBRARY.version);
  return render(
    <DraftPanel
      items={draftItemsView(draft, results)}
      status={status}
      hasPicks={Object.keys(picks).length > 0}
      warnings={[]}
      notices={[]}
      custom={{}}
      fonts={FONT_OPTIONS}
      checkPrimaryColor={boardEngine.checkPrimaryColor}
      canConfirm={{ ok: true }}
      confirming={false}
      announcement={{ text: "", key: 0 }}
      undo={null}
      onConfirm={vi.fn()}
      onClear={vi.fn()}
      onUndo={vi.fn()}
      onCustomChange={vi.fn()}
      onApplyFix={vi.fn()}
    />,
  );
}

const heroButton = (column: string) => screen.getByRole("button", { name: `Hero 구성: ${column}의 요소 선택` });
/** 채운 체크 원 = circle-check 아이콘(주 색) · 빈 원 = CSS 링 */
const filledCircle = (button: HTMLElement) => button.querySelector<HTMLElement>('i[style*="circle-check"]');
const emptyCircle = (button: HTMLElement) => button.querySelector<HTMLElement>("span.rounded-full[aria-hidden='true']");

describe("표 표면 (V2 4.4 표 · A-1 유지)", () => {
  it("머리글 회색 면이 없고, 고정 열(모서리·행 머리글)은 흰 불투명 면이다", () => {
    const { container } = renderTable();
    const thead = container.querySelector("thead")!;
    expect(thead.className).not.toMatch(/bg-background-alternative/);
    const corner = thead.querySelector("td")!;
    expect(corner).toHaveClass("sticky", "bg-background-normal");
    for (const header of screen.getAllByRole("rowheader")) {
      expect(header).toHaveClass("sticky", "bg-background-normal");
      expect(header).not.toHaveClass("bg-background-alternative");
    }
  });

  it("행 구분선은 line-neutral", () => {
    renderTable();
    const row = screen.getByRole("rowheader", { name: /^Hero 구성/ }).closest("tr")!;
    expect(row).toHaveClass("border-line-neutral");
  });

  it("표 바깥 테두리·반경이 없고(행 윗선만), 스크롤 영역의 포커스 링은 남는다 (REPORT 1.4)", () => {
    renderTable();
    const region = screen.getByRole("region", { name: "비교 표 (가로로 스크롤)" });
    expect(region).not.toHaveClass("border");
    expect(region).not.toHaveClass("rounded-lg");
    expect(region).not.toHaveClass("border-line-neutral");
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toHaveClass("focus-visible:shadow-(--focus-ring)");
  });

  it("값 셀과 행 머리글 여백은 py-2.5 px-3.5 (REPORT 1.4 선택 셀 밀도)", () => {
    renderTable({ hero: "ref-b" });
    const row = screen.getByRole("rowheader", { name: /^Hero 구성/ }).closest("tr")!;
    expect(screen.getByRole("rowheader", { name: /^Hero 구성/ })).toHaveClass("px-3.5", "py-2.5");
    for (const cell of row.querySelectorAll("td")) {
      expect(cell).toHaveClass("px-3.5", "py-2.5");
      expect(cell).not.toHaveClass("p-3");
    }
  });
});

describe("선택 셀 (V2-AC-34 · A-2·A-3 대체)", () => {
  it("고른 셀 = primary-container 면 + 채운 체크 원(주 색) + '선택됨', 접근 이름·aria-pressed 그대로", () => {
    renderTable({ hero: "ref-b" });
    const b = heroButton("B 프리미엄 헤어살롱");
    expect(b).toHaveAttribute("aria-pressed", "true");
    expect(b).toHaveTextContent("선택됨");
    expect(b.closest("td")).toHaveClass("bg-primary-container");
    expect(filledCircle(b)).toHaveClass("text-primary");
    expect(emptyCircle(b)).toBeNull();
  });

  it("안 고른 셀 = 빈 원 + '이 요소 선택', 셀 면 없음", () => {
    renderTable({ hero: "ref-b" });
    const a = heroButton("A 모던 카페 브랜드");
    expect(a).toHaveAttribute("aria-pressed", "false");
    expect(a).toHaveTextContent("이 요소 선택");
    expect(a.closest("td")).not.toHaveClass("bg-primary-container");
    expect(filledCircle(a)).toBeNull();
    // 원 모양 단서는 3:1 경계(line-strong) — line-normal은 흰 면에서 모양이 안 보인다
    expect(emptyCircle(a)).toHaveClass("border-line-strong");
  });

  it("선택 버튼은 테두리 없는 h-8 — aria-pressed·접근 이름·'선택됨' 글자·포커스 링 유지 (REPORT 1.4)", () => {
    renderTable({ hero: "ref-b" });
    const hasBorder = (el: HTMLElement) => [...el.classList].some((c) => c.startsWith("border"));
    for (const [column, pressed] of [["B 프리미엄 헤어살롱", "true"], ["A 모던 카페 브랜드", "false"]] as const) {
      const button = heroButton(column);
      expect(button).toHaveAttribute("aria-pressed", pressed);
      expect(button).toHaveClass("h-8", "focus-visible:shadow-(--focus-ring)");
      expect(button).not.toHaveClass("h-9");
      expect(hasBorder(button)).toBe(false);
    }
    expect(heroButton("B 프리미엄 헤어살롱")).toHaveTextContent("선택됨");
  });
});

describe("열 머리글 (V2-AC-35 · C-10)", () => {
  it("역상 문자 배지 + 대표색 견본(장식) + 라이선스 Tag + 빼기(×)", () => {
    renderTable();
    const header = screen.getAllByRole("columnheader")[0]!;
    const badge = within(header).getByText("A");
    expect(badge).toHaveClass("bg-surface-inverse", "text-on-surface-inverse");
    const swatch = header.querySelector<HTMLElement>("span[aria-hidden='true'].rounded-full")!;
    expect(swatch.style.backgroundColor).toBe(COLOR.a);
    expect(within(header).getByText("internal")).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "모던 카페 브랜드 비교에서 빼기" })).toBeInTheDocument();
  });

  it("D-QA04: '전부 선택' 접근 이름은 보이는 문구로 시작하고 열 문자 + 제목을 붙여 열마다 다르다 (A11Y-AC-16 · 2.5.3)", () => {
    renderTable();
    const names = screen.getAllByRole("button", { name: /^이 레퍼런스로 전부 선택/ }).map((b) => b.getAttribute("aria-label"));
    expect(names).toEqual(["이 레퍼런스로 전부 선택: A 모던 카페 브랜드", "이 레퍼런스로 전부 선택: B 프리미엄 헤어살롱", "이 레퍼런스로 전부 선택: C 동네 치과 클리닉"]);
    for (const name of names) expect(screen.getByRole("button", { name: name! })).toHaveTextContent(/^이 레퍼런스로 전부 선택$/);
  });

  it("D-QA04 1열 변형: '이 레퍼런스로 프로필 만들기: A <제목>'", () => {
    renderTable({}, ["ref-a"], "이 레퍼런스로 프로필 만들기");
    expect(screen.getByRole("button", { name: "이 레퍼런스로 프로필 만들기: A 모던 카페 브랜드" })).toHaveTextContent(/^이 레퍼런스로 프로필 만들기$/);
  });

  it("'전부 선택'은 ghost(assistive) sm — 테두리 있는 outline이 아니다", () => {
    renderTable();
    const header = screen.getAllByRole("columnheader")[0]!;
    const pickAll = within(header).getByRole("button", { name: /^이 레퍼런스로 전부 선택/ });
    expect(pickAll).toHaveClass("bg-transparent", "h-8");
    expect(pickAll).not.toHaveClass("border-line-normal");
  });
});

describe("초안 패널 (V2-AC-36 · D-8·D-9·D-10 유지)", () => {
  it("회색 면이 없고 넓은 화면에서 왼쪽 line-neutral 선", () => {
    renderPanel({});
    const panel = screen.getByRole("region", { name: "프로필 초안" });
    expect(panel).not.toHaveClass("bg-background-alternative");
    expect(panel).toHaveClass("xl:border-l", "border-line-neutral");
  });

  it("항목 앞 출처 색 점(aria-hidden) — 고른 항목·'기본값 · A' 모두 출처 레퍼런스 대표색", () => {
    renderPanel({ hero: "ref-a", card: "ref-b" });
    const dotOf = (label: string) => screen.getByRole("listitem", { name: label }).querySelector<HTMLElement>(":scope > span[aria-hidden='true']");
    expect(dotOf("Hero 구성")!.style.backgroundColor).toBe(COLOR.a);
    expect(dotOf("카드 스타일")!.style.backgroundColor).toBe(COLOR.b);
    expect(screen.getByRole("listitem", { name: "메뉴 구조" })).toHaveTextContent("기본값 · A");
    expect(dotOf("메뉴 구조")!.style.backgroundColor).toBe(COLOR.a);
  });

  it("'초안 비우기'는 ghost(assistive) — outline 아님", () => {
    renderPanel({ hero: "ref-a" });
    const clear = screen.getByRole("button", { name: "초안 비우기" });
    expect(clear).toHaveClass("bg-transparent");
    expect(clear).not.toHaveClass("border-line-normal");
  });

  it.each([
    [{ kind: "unconfirmed", nextVersion: 1 } as const, "확정 전", "text-label-neutral"],
    [{ kind: "confirmed", version: 1 } as const, "v1 확정됨", "text-accent-green"],
    [{ kind: "changed", version: 1, nextVersion: 2 } as const, "v1 이후 변경됨", "text-accent-orange"],
  ])("상태 태그 톤: %j → '%s' (neutral · positive · cautionary 별칭)", (status, text, tone) => {
    renderPanel({ hero: "ref-a" }, status);
    expect(screen.getByText(text)).toHaveClass(tone);
  });
});

describe("draftItemsView — 출처 색 점 (엔진 청크에서 계산)", () => {
  it("pick·default는 출처 레퍼런스 대표색, 출처가 없는 항목(pending)은 없음", () => {
    const results = resultsOf(THREE);
    const primaryOf = (id: string) => referenceFixtures.find((r) => r.id === id)!.colorPalette.primary;
    const withHero = draftItemsView(buildProfileDraft(boardOf(THREE, { hero: "ref-a", card: "ref-b" }), results, SECTION_LIBRARY.version), results);
    expect(withHero.find((i) => i.rowId === "hero")!.dot).toBe(primaryOf("ref-a"));
    expect(withHero.find((i) => i.rowId === "card")!.dot).toBe(primaryOf("ref-b"));
    expect(withHero.find((i) => i.rowId === "menu")!.dot).toBe(primaryOf("ref-a"));
    const pending = draftItemsView(buildProfileDraft(boardOf(THREE, { card: "ref-b" }), results, SECTION_LIBRARY.version), results);
    expect(pending.find((i) => i.rowId === "hero")!.dot).toBeUndefined();
  });
});
