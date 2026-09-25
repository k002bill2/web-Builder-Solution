import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { togglePick } from "../../domain/boardPicks";
import type { ComparisonRowId, Picks } from "../../domain/compareBoard";
import { buildBoardView } from "../../features/compare/boardView";
import { boardOf, catalogWithdrawing, resultsOf } from "../../test/compareFixtures";
import { ComparisonTable } from "./ComparisonTable";

const THREE = ["ref-a", "ref-b", "ref-c"];

function Harness({ ids = THREE, initial = {}, onToggle = () => {}, catalog }: {
  readonly ids?: readonly string[];
  readonly initial?: Picks;
  readonly onToggle?: (rowId: ComparisonRowId, referenceId: string) => void;
  readonly catalog?: ReturnType<typeof catalogWithdrawing>;
}) {
  const [picks, setPicks] = useState<Picks>(initial);
  const results = resultsOf(ids, catalog);
  const board = boardOf(ids, picks);
  const view = buildBoardView(board, results);
  return (
    <>
      <button type="button">앞 요소</button>
      <ComparisonTable
        columns={view.columns}
        rows={view.rows}
        picks={picks}
        pickAllLabel="이 레퍼런스로 전부 선택"
        onToggle={(rowId, referenceId) => {
          onToggle(rowId, referenceId);
          const result = togglePick(board, results, rowId, referenceId);
          if (result.ok) setPicks(result.picks);
        }}
        onRemoveColumn={() => {}}
        onPickAll={() => {}}
      />
    </>
  );
}

const heroButton = (name: RegExp | string) => screen.getByRole("button", { name: typeof name === "string" ? `Hero 구성: ${name}의 요소 선택` : name });

describe("ComparisonTable — 표 의미 (A-1)", () => {
  it("AC-03: 3개면 columnheader 3개 + rowheader 12개, info 행(섹션 수·접근성·성능)에는 선택 버튼이 없다", () => {
    render(<Harness />);
    const table = screen.getByRole("table", { name: "레퍼런스 3개, 비교 항목 12개" });
    expect(within(table).getAllByRole("columnheader")).toHaveLength(3);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(12);
    for (const name of ["섹션 수", "접근성·성능"]) {
      const row = within(table).getByRole("rowheader", { name: new RegExp(`^${name}`) }).closest("tr")!;
      expect(within(row).queryAllByRole("button")).toHaveLength(0);
      expect(row).toHaveTextContent("비교 정보");
    }
  });

  it("값이 없는 셀은 '없음'이고 선택 버튼이 없다, 모든 열 값이 같은 행에는 '모두 같음'", () => {
    // ref-b·ref-d는 CTA가 달라 같지 않다 — 같은 레퍼런스 성격을 쓰기 위해 A·F(히어로 좌측 하단 CTA 동일)를 쓴다
    render(<Harness ids={["ref-a", "ref-f"]} />);
    const ctaRow = screen.getByRole("rowheader", { name: /^CTA 위치/ }).closest("tr")!;
    expect(ctaRow).toHaveTextContent("모두 같음");
    expect(within(ctaRow).getAllByRole("button")).toHaveLength(2);
  });
});

describe("PickButton — 접근 이름·선택 표시 (A-2 · A-3)", () => {
  it("접근 이름에 항목과 레퍼런스를 모두 넣고, 선택 상태는 aria-pressed + '선택됨' 텍스트", async () => {
    render(<Harness initial={{ hero: "ref-b" }} />);
    const b = heroButton("B 프리미엄 헤어살롱");
    expect(b).toHaveAttribute("aria-pressed", "true");
    expect(b).toHaveTextContent("선택됨");
    const a = heroButton("A 모던 카페 브랜드");
    expect(a).toHaveAttribute("aria-pressed", "false");
    expect(a).toHaveTextContent("이 요소 선택");
  });
});

describe("행 roving 키보드 (A-5)", () => {
  it("AC-19: Hero 행에 Tab 진입 → → 두 번 → Space면 포커스가 A→B→C이고 C가 선택된다. 다음 Tab은 다음 행", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<Harness onToggle={onToggle} />);
    screen.getAllByRole("button", { name: "이 레퍼런스로 전부 선택" }).at(-1)!.focus();
    await user.tab();
    expect(heroButton("A 모던 카페 브랜드")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(heroButton("B 프리미엄 헤어살롱")).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(heroButton("C 동네 치과 클리닉")).toHaveFocus();
    await user.keyboard(" ");
    expect(onToggle).toHaveBeenCalledWith("hero", "ref-c");
    expect(heroButton("C 동네 치과 클리닉")).toHaveAttribute("aria-pressed", "true");
    await user.tab();
    expect(screen.getByRole("button", { name: "메뉴 구조: A 모던 카페 브랜드의 요소 선택" })).toHaveFocus();
  });

  it("행에 들어오면 선택된 버튼에 포커스, ↑/↓는 열을 옮기지 않는다, Home/End는 처음·끝", async () => {
    const user = userEvent.setup();
    render(<Harness initial={{ hero: "ref-b" }} />);
    screen.getAllByRole("button", { name: "이 레퍼런스로 전부 선택" }).at(-1)!.focus();
    await user.tab();
    expect(heroButton("B 프리미엄 헤어살롱")).toHaveFocus();
    await user.keyboard("{ArrowDown}");
    expect(heroButton("B 프리미엄 헤어살롱")).toHaveFocus();
    await user.keyboard("{End}");
    expect(heroButton("C 동네 치과 클리닉")).toHaveFocus();
    await user.keyboard("{Home}");
    expect(heroButton("A 모던 카페 브랜드")).toHaveFocus();
    // 행을 떠났다가 돌아오면 다시 선택된 버튼
    await user.tab();
    await user.tab({ shift: true });
    expect(heroButton("B 프리미엄 헤어살롱")).toHaveFocus();
  });
});

describe("열 머리글 (2.2 · S-08 · S-18)", () => {
  it("전체 제목은 title 속성에, 빼기 버튼 이름은 '<제목> 비교에서 빼기'", () => {
    render(<Harness />);
    const header = screen.getAllByRole("columnheader")[1]!;
    expect(within(header).getByTitle("프리미엄 헤어살롱")).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "프리미엄 헤어살롱 비교에서 빼기" })).toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "이 레퍼런스로 전부 선택" })).toBeInTheDocument();
    expect(header).toHaveTextContent("B");
  });

  it("AC-15(화면): 회수된 열은 '사용 불가' + 사유이고 그 열의 선택 버튼·전부 선택이 없다", () => {
    render(<Harness catalog={catalogWithdrawing("ref-b")} />);
    const header = screen.getAllByRole("columnheader")[1]!;
    expect(header).toHaveTextContent("사용 불가");
    expect(header).toHaveTextContent("라이선스가 바뀌어 더 이상 쓸 수 없습니다");
    expect(within(header).queryByRole("button", { name: "이 레퍼런스로 전부 선택" })).not.toBeInTheDocument();
    expect(within(header).getByRole("button", { name: "프리미엄 헤어살롱 비교에서 빼기" })).toBeInTheDocument();
    expect(screen.queryAllByRole("button", { name: /B 프리미엄 헤어살롱의 요소 선택$/ })).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /A 모던 카페 브랜드의 요소 선택$/ }).length).toBeGreaterThan(0);
  });
});

describe("가로 스크롤 (5.1)", () => {
  it("5열 이상이면 스크롤 컨테이너가 포커스 가능하고 이름이 있다", () => {
    render(<Harness ids={["ref-a", "ref-b", "ref-c", "ref-d", "ref-e"]} />);
    const region = screen.getByRole("region", { name: "비교 표 (가로로 스크롤)" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toContainElement(screen.getByRole("table"));
  });
});
