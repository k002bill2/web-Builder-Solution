import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Callout } from "./Callout";

describe("Callout (SPEC 7.2 · A-9)", () => {
  it("role 없는 정적 영역에 h3 제목·본문·행동을 담는다", () => {
    render(
      <Callout tone="warning" title="대비 부족" action={<button type="button">보정값 쓰기</button>}>
        흰 글자 대비가 낮습니다
      </Callout>,
    );
    const heading = screen.getByRole("heading", { level: 3, name: "대비 부족" });
    const box = heading.closest("[data-tone]");
    expect(box).toHaveAttribute("data-tone", "warning");
    expect(box).not.toHaveAttribute("role");
    expect(box).toHaveTextContent("흰 글자 대비가 낮습니다");
    expect(screen.getByRole("button", { name: "보정값 쓰기" })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it.each(["info", "warning", "negative"] as const)("%s 톤은 아이콘이 장식이다", (tone) => {
    const { container } = render(<Callout tone={tone} title="제목">본문</Callout>);
    expect(container.querySelector("i.ds-icon")).toHaveAttribute("aria-hidden", "true");
  });
});
