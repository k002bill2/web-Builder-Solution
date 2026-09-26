/** 2A-04b2 SegmentedControl 확장 — 옵션별 disabled + 그룹 설명 캡션 (DS-2A-04 3.4 · 5.2 예외 · P-AC-13·33) */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl, type SegmentOption } from "./SegmentedControl";

type V = "a" | "b" | "c" | "d";
const OPTIONS: readonly SegmentOption<V>[] = [
  { value: "a", label: "가" },
  { value: "b", label: "나", disabled: true },
  { value: "c", label: "다" },
  { value: "d", label: "라", disabled: true },
];

function Harness({ initial = "a", options = OPTIONS, onChange }: { readonly initial?: V; readonly options?: readonly SegmentOption<V>[]; readonly onChange?: (v: V) => void }) {
  const [value, setValue] = useState<V>(initial);
  return (
    <SegmentedControl
      label="그룹"
      options={options}
      value={value}
      description="나·라: 이 테마에서 쓸 수 없음"
      onChange={(v) => {
        onChange?.(v);
        setValue(v);
      }}
    />
  );
}

describe("SegmentedControl 옵션 disabled + 설명 캡션", () => {
  it("비활성 옵션은 aria-disabled(속성 disabled 아님), 누르면 값이 바뀌지 않는다", async () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    const b = screen.getByRole("radio", { name: "나" });
    expect(b).toHaveAttribute("aria-disabled", "true");
    expect(b).not.toHaveAttribute("disabled");
    await userEvent.click(b);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "가" })).toHaveAttribute("aria-checked", "true");
  });

  it("방향키·Home/End는 비활성 옵션을 건너뛴다 (APG radio group)", async () => {
    render(<Harness />);
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "가" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "다" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "다" })).toHaveAttribute("aria-checked", "true");
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("radio", { name: "가" })).toHaveFocus();
    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("radio", { name: "다" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    expect(screen.getByRole("radio", { name: "가" })).toHaveFocus();
    await userEvent.keyboard("{End}");
    expect(screen.getByRole("radio", { name: "다" })).toHaveFocus();
  });

  it("그룹 설명 캡션이 보이고 radiogroup의 aria-describedby가 가리킨다", () => {
    render(<Harness />);
    const group = screen.getByRole("radiogroup", { name: "그룹" });
    const caption = screen.getByText("나·라: 이 테마에서 쓸 수 없음");
    expect(group).toHaveAttribute("aria-describedby", caption.id);
    expect(group).toHaveAccessibleDescription("나·라: 이 테마에서 쓸 수 없음");
  });

  it("선택값이 비활성(이어받은 범위 밖 값)이면 Tab 정지점은 첫 활성 옵션", async () => {
    render(<Harness initial="b" />);
    expect(screen.getByRole("radio", { name: "나" })).toHaveAttribute("aria-checked", "true");
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "가" })).toHaveFocus();
    expect(screen.getAllByRole("radio").filter((r) => r.tabIndex === 0)).toHaveLength(1);
  });

  it("모든 옵션이 비활성(이전 버전 보기)이면 선택값이 Tab 정지점, 그룹 aria-disabled, 방향키로 바뀌지 않는다", async () => {
    const onChange = vi.fn();
    render(<Harness initial="c" options={OPTIONS.map((o) => ({ ...o, disabled: true }))} onChange={onChange} />);
    expect(screen.getByRole("radiogroup", { name: "그룹" })).toHaveAttribute("aria-disabled", "true");
    await userEvent.tab();
    expect(screen.getByRole("radio", { name: "다" })).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}{End}");
    expect(screen.getByRole("radio", { name: "다" })).toHaveFocus();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("disabled·설명이 없으면 지금과 같다(순환 이동, describedby 없음)", async () => {
    render(<SegmentedControl label="정렬" options={[{ value: "x", label: "X" }, { value: "y", label: "Y" }]} value="x" onChange={() => {}} />);
    expect(screen.getByRole("radiogroup", { name: "정렬" })).not.toHaveAttribute("aria-describedby");
    expect(screen.getByRole("radiogroup", { name: "정렬" })).not.toHaveAttribute("aria-disabled");
  });
});
