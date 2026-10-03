import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GateList } from "./GateList";

describe("GateList — 계산 실패 (M2A-3a-fix F1)", () => {
  it("결과 없음 + failed → '검사하지 못했습니다' 문구('검사하는 중' 아님)", () => {
    render(<GateList report={undefined} stale={false} failed onRow={() => {}} />);
    expect(screen.getByText("검사하지 못했습니다")).toBeInTheDocument();
    expect(screen.queryByText("검사하는 중입니다")).not.toBeInTheDocument();
  });
});
