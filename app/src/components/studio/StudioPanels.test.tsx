/**
 * BUDGET-TRIM-1 — GatePanel 내보내기 묶음은 받은 그대로 그린다. 편집 틀(StudioLayout)은 늘 버튼 묶음을 넘기므로
 * M2 이전 "생성기 안내" 폴백 문장은 도달 불가 — 편집기 진입 청크에서 뺐다.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GatePanel } from "./StudioPanels";

describe("GatePanel 내보내기 묶음", () => {
  it("받은 묶음을 내보내기 제목 아래에 그린다", () => {
    render(<GatePanel exports={<button type="button">내보내기 버튼</button>}>게이트</GatePanel>);
    expect(screen.getByRole("heading", { level: 3, name: "내보내기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "내보내기 버튼" })).toBeInTheDocument();
  });

  it("빈 묶음이어도 생성기 안내 폴백 문장을 만들지 않는다", () => {
    render(<GatePanel exports={null}>게이트</GatePanel>);
    expect(screen.queryByText(/코드 생성기 연결 후/)).toBeNull();
  });
});
