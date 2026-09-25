import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { PRIMARY_COLOR_ERROR } from "../../domain/boardInput";
import { evaluateBoardWarnings } from "../../domain/boardWarnings";
import type { CustomStyle, Picks } from "../../domain/compareBoard";
import { FONT_OPTIONS } from "../../domain/fonts";
import { buildProfileDraft } from "../../domain/profileDraft";
import { SECTION_LIBRARY } from "../../domain/sectionLibrary";
import { boardEngine } from "../../features/compare/boardEngine";
import { FOOTER_AUTO_NOTE, draftItemsView } from "../../features/compare/draftView";
import { LOW_CONTRAST_PRIMARY, boardOf, resultsOf } from "../../test/compareFixtures";
import { CustomStyleFields } from "./CustomStyleFields";
import { DraftPanel } from "./DraftPanel";

// D는 모션 "높음"(AC-11), Footer "미니멀"(사업자정보 없음)
const IDS = ["ref-a", "ref-b", "ref-c", "ref-d"];
const results = resultsOf(IDS);

function panelProps(picks: Picks, custom: CustomStyle = {}, overrides: Partial<ComponentProps<typeof DraftPanel>> = {}) {
  const board = boardOf(IDS, picks, { custom });
  const draft = buildProfileDraft(board, results, SECTION_LIBRARY.version);
  return {
    items: draftItemsView(draft, results),
    status: { kind: "unconfirmed", nextVersion: 1 } as const,
    hasPicks: Object.keys(picks).length > 0,
    warnings: draft.status === "ready" ? evaluateBoardWarnings(board, results, draft) : [],
    notices: [],
    custom,
    fonts: FONT_OPTIONS,
    checkPrimaryColor: boardEngine.checkPrimaryColor,
    canConfirm: { ok: true } as const,
    confirming: false,
    announcement: { text: "", key: 0 },
    undo: null,
    onConfirm: vi.fn(),
    onClear: vi.fn(),
    onUndo: vi.fn(),
    onCustomChange: vi.fn(),
    onApplyFix: vi.fn(),
    ...overrides,
  } satisfies ComponentProps<typeof DraftPanel>;
}

const item = (label: string) => screen.getByRole("listitem", { name: label });

describe("DraftPanel — 초안 목록 (2.4)", () => {
  it("AC-04(화면): 고른 항목의 출처는 열 문자 + 제목", () => {
    render(<DraftPanel {...panelProps({ hero: "ref-b" })} />);
    expect(item("Hero 구성")).toHaveTextContent("B · 프리미엄 헤어살롱");
  });

  it("AC-09: Hero=A만 고르면 나머지 9개 항목이 A 값 + '기본값' 텍스트", () => {
    render(<DraftPanel {...panelProps({ hero: "ref-a" })} />);
    const items = within(screen.getByRole("list", { name: "초안 항목" })).getAllByRole("listitem");
    expect(items).toHaveLength(10);
    expect(items.filter((li) => /기본값 · A/.test(li.textContent ?? ""))).toHaveLength(9);
  });

  it("AC-06(화면): Hero가 없으면 초안 Hero가 'Hero를 먼저 고르세요', 확정은 aria-disabled + 이유 연결 (A-8)", () => {
    render(<DraftPanel {...panelProps({ card: "ref-b" }, {}, { canConfirm: { ok: false, reason: "Hero를 하나 고르면 확정할 수 있습니다" } })} />);
    expect(item("Hero 구성")).toHaveTextContent("Hero를 먼저 고르세요");
    const confirm = screen.getByRole("button", { name: "프로필 확정 (v1)" });
    expect(confirm).toHaveAttribute("aria-disabled", "true");
    expect(confirm).toHaveAccessibleDescription("Hero를 하나 고르면 확정할 수 있습니다");
    expect(confirm).not.toBeDisabled();
  });

  it("S-10: 선택이 없으면 목록 대신 안내", () => {
    render(<DraftPanel {...panelProps({})} />);
    expect(screen.getByText("항목에서 '이 요소 선택'을 누르면 여기에 담깁니다")).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "초안 항목" })).not.toBeInTheDocument();
  });

  it("D2: 사업자정보 없는 Footer(B)가 적용되면 Footer 항목에 '확정 시 사업자정보 확장형으로 바뀝니다'", () => {
    render(<DraftPanel {...panelProps({ hero: "ref-a", footer: "ref-b" })} />);
    expect(item("Footer")).toHaveTextContent(FOOTER_AUTO_NOTE);
    expect(item("Hero 구성")).not.toHaveTextContent(FOOTER_AUTO_NOTE);
  });

  it("S-16: v1 이후 변경되면 태그와 버튼이 v2 기준", () => {
    render(<DraftPanel {...panelProps({ hero: "ref-a" }, {}, { status: { kind: "changed", version: 1, nextVersion: 2 } })} />);
    expect(screen.getByText("v1 이후 변경됨")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새 버전으로 확정 (v2)" })).toBeInTheDocument();
  });

  it("S-13: 확정 중이면 aria-busy + '확정 중…'", () => {
    render(<DraftPanel {...panelProps({ hero: "ref-a" }, {}, { confirming: true })} />);
    const button = screen.getByRole("button", { name: "확정 중…" });
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveAttribute("aria-disabled", "true");
  });

  it("S-17: 되돌리기 안내가 있으면 되돌리기 버튼에 포커스", () => {
    const onUndo = vi.fn();
    render(<DraftPanel {...panelProps({}, {}, { undo: { message: "선택 5개를 비웠습니다", focus: true }, onUndo })} />);
    expect(screen.getByText("선택 5개를 비웠습니다")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "되돌리기" })).toHaveFocus();
  });

  it("A-4: 알림 영역은 이름 있는 polite status", () => {
    render(<DraftPanel {...panelProps({ hero: "ref-a" }, {}, { announcement: { text: "Hero 구성: A 선택", key: 1 } })} />);
    expect(screen.getByRole("status", { name: "선택 알림" })).toHaveTextContent("Hero 구성: A 선택");
  });
});

describe("DraftPanel — 경고 Callout (3.3·3.4)", () => {
  it("AC-12(화면): 낮은 대비 대표색이면 수치·보정 hex·'보정값 쓰기'가 보이고 확정은 가능", async () => {
    const onApplyFix = vi.fn();
    render(<DraftPanel {...panelProps({ hero: "ref-a" }, { primaryColor: LOW_CONTRAST_PRIMARY }, { onApplyFix })} />);
    const callout = screen.getByRole("heading", { level: 3, name: "대비 부족" }).closest("[data-tone]") as HTMLElement;
    expect(callout).toHaveTextContent(/\d\.\d:1/);
    expect(callout).toHaveTextContent(/보정값 #[0-9A-F]{6}/);
    await userEvent.click(within(callout).getByRole("button", { name: "보정값 쓰기" }));
    expect(onApplyFix).toHaveBeenCalledWith(expect.objectContaining({ kind: "use-corrected-primary" }));
    expect(screen.getByRole("button", { name: "프로필 확정 (v1)" })).not.toHaveAttribute("aria-disabled");
  });

  it("AC-13(화면): 사업자정보 없는 Footer면 R-12 경고와 'C의 Footer로 바꾸기'", async () => {
    const onApplyFix = vi.fn();
    render(<DraftPanel {...panelProps({ hero: "ref-a", footer: "ref-b" }, {}, { onApplyFix })} />);
    await userEvent.click(screen.getByRole("button", { name: "C의 Footer로 바꾸기" }));
    expect(onApplyFix).toHaveBeenCalledWith(expect.objectContaining({ kind: "pick-column", rowId: "footer", referenceId: "ref-c" }));
  });

  it("AC-11(화면): 모션 '높음'이면 정보 Callout", () => {
    render(<DraftPanel {...panelProps({ hero: "ref-a", motion: "ref-d" })} />);
    const callout = screen.getByRole("heading", { level: 3, name: "모션 상한 적용" }).closest("[data-tone]");
    expect(callout).toHaveAttribute("data-tone", "info");
    expect(callout).toHaveTextContent("생성 상한이 L2라 '중간'으로 적용됩니다");
  });
});

function Fields({ onChange }: { readonly onChange: (value: CustomStyle) => void }) {
  const [value, setValue] = useState<CustomStyle>({});
  return (
    <CustomStyleFields
      value={value}
      fonts={FONT_OPTIONS}
      checkPrimaryColor={boardEngine.checkPrimaryColor}
      onChange={(next) => {
        onChange(next);
        setValue(next);
      }}
    />
  );
}

describe("CustomStyleFields (3.5)", () => {
  it("AC-14: 'abc'를 입력하고 포커스를 옮기면 저장하지 않고 aria-invalid + 오류 텍스트", async () => {
    const onChange = vi.fn();
    render(<Fields onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "대표색" });
    await userEvent.type(input, "abc");
    await userEvent.tab();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription(PRIMARY_COLOR_ERROR);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("올바른 hex는 대문자로 저장하고 견본 옆에 hex 텍스트가 있다 (A-12), 지우기로 뺀다", async () => {
    const onChange = vi.fn();
    render(<Fields onChange={onChange} />);
    const input = screen.getByRole("textbox", { name: "대표색" });
    await userEvent.type(input, LOW_CONTRAST_PRIMARY.toLowerCase());
    await userEvent.tab();
    expect(onChange).toHaveBeenLastCalledWith({ primaryColor: LOW_CONTRAST_PRIMARY });
    expect(input).toHaveAttribute("aria-invalid", "false");
    await userEvent.click(screen.getByRole("button", { name: "사용자 스타일 지우기" }));
    expect(onChange).toHaveBeenLastCalledWith({});
    expect(input).toHaveValue("");
  });

  it("폰트는 허용 목록 Select(3종 활성)이고 고르면 이름과 견본 텍스트를 보여 준다", async () => {
    const onChange = vi.fn();
    render(<Fields onChange={onChange} />);
    const select = screen.getByRole("combobox", { name: "폰트" });
    expect(within(select).getAllByRole("option").map((o) => o.textContent)).toEqual(["선택 안 함", "Pretendard", "Noto Sans KR", "Noto Serif KR"]);
    await userEvent.selectOptions(select, "noto-serif-kr");
    expect(onChange).toHaveBeenLastCalledWith({ fontFamily: "noto-serif-kr" });
    expect(screen.getByTestId("font-sample")).toHaveTextContent("Noto Serif KR");
  });
});
