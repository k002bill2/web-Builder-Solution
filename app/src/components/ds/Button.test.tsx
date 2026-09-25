import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button, type ButtonVariant } from "./Button";

const borderColorClasses = (el: HTMLElement) =>
  [...el.classList].filter((c) => /^border-(transparent|line-|primary)/.test(c));

describe("Button", () => {
  it("outline 변형은 테두리 색 클래스가 line-normal 하나뿐이다 (transparent와 충돌 금지)", () => {
    render(<Button variant="outline">비교 추가</Button>);
    expect(borderColorClasses(screen.getByRole("button"))).toEqual(["border-line-normal"]);
  });

  it.each<ButtonVariant>(["primary", "secondary", "assistive"])("%s 변형은 투명 테두리 하나만 가진다", (variant) => {
    render(<Button variant={variant}>버튼</Button>);
    expect(borderColorClasses(screen.getByRole("button"))).toEqual(["border-transparent"]);
  });

  it("기본 type은 button이다", () => {
    render(<Button>버튼</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
