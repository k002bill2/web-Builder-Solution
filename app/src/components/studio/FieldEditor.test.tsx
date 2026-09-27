import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { heading, long } from "../../engine/sections/slots";
import { FieldEditor, type FieldSpec } from "./FieldEditor";

function Harness({ spec, initial = "", describedBy }: { spec: FieldSpec; initial?: string; describedBy?: string }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      {describedBy && <p id={describedBy}>3번 카드 제목이 권장 28자를 넘었습니다 (34/28자)</p>}
      <FieldEditor id="f-heading" spec={spec} value={value} onChange={setValue} describedBy={describedBy} />
    </>
  );
}

const title = heading("소개");
const describedIds = (el: HTMLElement) => (el.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);

describe("FieldEditor (E-AC-06)", () => {
  it("라벨 = 슬롯 이름표 + (필수) · 카운터가 aria-describedby · 카운터는 라이브 영역 밖", () => {
    render(<Harness spec={title} initial="안녕하세요" />);
    const input = screen.getByRole("textbox", { name: /섹션 제목/ });
    expect(screen.getByText("(필수)")).toBeInTheDocument();
    const counter = screen.getByText("5 / 28자");
    expect(describedIds(input)).toContain(counter.id);
    expect(counter.closest("[aria-live],[role=status],[role=alert]")).toBeNull();
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("권장 초과 → 경고 문장(describedby) · aria-invalid 없음", () => {
    render(<Harness spec={title} initial={"가".repeat(29)} />);
    const input = screen.getByRole("textbox", { name: /섹션 제목/ });
    const note = screen.getByText("권장 28자 — 넘으면 2줄이 될 수 있습니다");
    expect(describedIds(input)).toContain(note.id);
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("상한 초과 → aria-invalid + R-13 문장(describedby)", () => {
    render(<Harness spec={title} initial={"가".repeat(46)} />);
    const input = screen.getByRole("textbox", { name: /섹션 제목/ });
    expect(input).toHaveAttribute("aria-invalid", "true");
    const note = screen.getByText("상한 40자를 6자 넘었습니다 — 내보내기를 막습니다 (R-13)");
    expect(describedIds(input)).toContain(note.id);
  });

  it("입력은 막지 않는다 — 상한 + 10자까지 들어가고 그 뒤는 멈춘다", async () => {
    const user = userEvent.setup();
    render(<Harness spec={title} />);
    const input = screen.getByRole("textbox", { name: /섹션 제목/ });
    await user.type(input, "a".repeat(55));
    expect(input).toHaveValue("a".repeat(50));
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText("50 / 28자")).toBeInTheDocument();
  });

  it("입력 한도는 코드 포인트 기준 — 이모지도 상한 + 10자까지 들어간다(Codex r1 P2)", () => {
    render(<Harness spec={title} />);
    const input = screen.getByRole("textbox", { name: /섹션 제목/ });
    fireEvent.change(input, { target: { value: "😀".repeat(45) } });
    expect(input).toHaveValue("😀".repeat(45));
    fireEvent.change(input, { target: { value: "😀".repeat(55) } });
    expect(input).toHaveValue("😀".repeat(50));
    expect(input).not.toHaveAttribute("maxlength");
  });

  it("캔버스 문제 문장 id를 aria-describedby 맨 앞에 받는다", () => {
    render(<Harness spec={title} initial={"가".repeat(34)} describedBy="canvas-issue-1" />);
    const input = screen.getByRole("textbox", { name: /섹션 제목/ });
    expect(describedIds(input)[0]).toBe("canvas-issue-1");
    expect(describedIds(input)).toHaveLength(3);
  });

  it("필수 빈 값 — 입력 중에는 조용하고 포커스를 떠날 때 \"필수 입력입니다\" + aria-invalid", async () => {
    const user = userEvent.setup();
    render(<Harness spec={title} />);
    const input = screen.getByRole("textbox", { name: /섹션 제목/ });
    await user.click(input);
    expect(screen.queryByText("필수 입력입니다")).toBeNull();
    await user.tab();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(describedIds(input)).toContain(screen.getByText("필수 입력입니다").id);
    await user.type(input, "새 제목");
    expect(screen.queryByText("필수 입력입니다")).toBeNull();
  });

  it("긴 글 슬롯은 textarea · 선택 슬롯엔 (필수) 없음", () => {
    render(<Harness spec={long("body", "본문", 200, { recommended: 120 })} />);
    expect(screen.getByRole("textbox", { name: "본문" }).tagName).toBe("TEXTAREA");
    expect(screen.queryByText("(필수)")).toBeNull();
  });
});
