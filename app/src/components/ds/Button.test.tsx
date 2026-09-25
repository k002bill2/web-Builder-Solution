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

  it("secondary는 역상 면용 변형이다 — 역상 토큰 쌍, aria-disabled 쌍 포함 (V2-AC-11 · A11Y-01 4.5)", () => {
    render(<Button variant="secondary">초안 보기</Button>);
    const classes = [...screen.getByRole("button").classList];
    expect(classes).toEqual(
      expect.arrayContaining([
        "bg-inverse-fill-normal",
        "text-on-surface-inverse",
        "enabled:hover:bg-inverse-fill-strong",
        "disabled:text-inverse-label-disable",
        "aria-disabled:bg-inverse-fill-normal",
        "aria-disabled:text-inverse-label-disable",
      ]),
    );
    expect(classes.filter((c) => /(^|:)(bg-fill-|text-label-|bg-surface-inverse)/.test(c))).toEqual([]);
  });

  it("assistive는 ghost다 — 투명 면, hover에 fill-normal (V2-AC-11)", () => {
    render(<Button variant="assistive">지우기</Button>);
    const classes = [...screen.getByRole("button").classList];
    expect(classes).toEqual(expect.arrayContaining(["bg-transparent", "text-label-normal", "enabled:hover:bg-fill-normal"]));
  });

  it("기본 type은 button이다", () => {
    render(<Button>버튼</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
