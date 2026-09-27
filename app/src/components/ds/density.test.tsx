import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, type ButtonSize } from "./Button";
import { Checkbox } from "./Checkbox";
import { TextField } from "./TextField";

/** v2 밀도 기준 (VISUAL-V2-APPLY 브리프 2) — lg 버튼·필드 40, 체크 상자 16·행 최소 24, UI 기본 글자 body3. px 복제 아님. */
const heightStep = (el: HTMLElement) => {
  const cls = [...el.classList].find((c) => /^h-\d+(\.\d+)?$/.test(c));
  return cls ? Number(cls.slice(2)) : NaN;
};

describe("DS 밀도 (v2)", () => {
  const sizeOf = (size: ButtonSize) => {
    const { unmount } = render(<Button size={size}>{size}</Button>);
    const button = screen.getByRole("button", { name: size });
    const out = { h: heightStep(button), classes: [...button.classList] };
    unmount();
    return out;
  };

  it("Button lg는 40(h-10)·body3 글자이고 size 계층이 역전되지 않는다 (lg ≥ md ≥ sm)", () => {
    const sm = sizeOf("sm");
    const md = sizeOf("md");
    const lg = sizeOf("lg");
    expect(lg.h).toBe(10);
    expect(lg.classes).toContain("text-body3");
    expect(lg.classes).not.toContain("text-body1");
    expect(lg.h).toBeGreaterThanOrEqual(md.h);
    expect(md.h).toBeGreaterThanOrEqual(sm.h);
    // 대화형 최소 24(h-6) 이상 유지
    expect(sm.h).toBeGreaterThanOrEqual(6);
  });

  it("TextField는 40(h-10)·body3 입력 글자이고 접근 이름을 유지한다", () => {
    render(<TextField label="레퍼런스 검색" leadingIcon="search" />);
    const input = screen.getByRole("textbox", { name: "레퍼런스 검색" });
    const box = input.closest("label") as HTMLElement;
    expect(heightStep(box)).toBe(10);
    expect(input).toHaveClass("text-body3");
    expect(input).not.toHaveClass("text-body1");
  });

  it("Checkbox 상자는 16(size-4), 행은 최소 24(min-h-6)·body3 글자이고 이름·설명을 유지한다", () => {
    render(<Checkbox label="병원" checked={false} onChange={() => {}} count={3} />);
    const input = screen.getByRole("checkbox", { name: "병원" });
    expect(input).toHaveAccessibleDescription("3개");
    const row = input.closest("label") as HTMLElement;
    expect(row).toHaveClass("min-h-6", "text-body3");
    expect(row).not.toHaveClass("text-body2");
    const box = input.nextElementSibling as HTMLElement;
    expect(box).toHaveClass("size-4");
    expect(box).not.toHaveClass("size-5");
  });

  it("base.css body가 UI 기본 글자 body3 토큰을 쓴다", () => {
    const css = readFileSync(join(__dirname, "../../styles/tokens/base.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
    const body = /(^|\n)body\s*\{([^}]*)\}/.exec(css)?.[2] ?? "";
    expect(body).toMatch(/font-size:\s*var\(--font-size-body3\)/);
    expect(body).toMatch(/line-height:\s*var\(--line-height-body3\)/);
  });
});
