import { render, screen } from "@testing-library/react";
import { sampleDoc, section } from "../../engine/testing/sampleDoc";
import { EditFields } from "./EditFields";

/** services/list `items` 필드 도움말 (SPEC-BODY MQ-B1 · B-M2B-02) — 나누기 규칙은 `·`만, 줄바꿈은 구분자가 아니다 */
const ITEMS_HINT = "가운뎃점(·)으로 나눕니다";

function docWith(variant: string) {
  return sampleDoc({ sections: [section("services", variant, "s-services")] });
}

describe("services 편집 패널 — items 필드 도움말 (MQ-B1)", () => {
  it("services/list → items 필드에 도움말 문구 · aria-describedby로 연결", () => {
    render(<EditFields doc={docWith("list")} selectedId="s-services" onEdit={() => {}} />);
    const hint = screen.getByText(ITEMS_HINT);
    const items = screen.getByLabelText(/서비스 목록/);
    expect(hint.id).not.toBe("");
    expect(items.getAttribute("aria-describedby")?.split(" ")).toContain(hint.id);
  });

  it("다른 필드·다른 변형 → 도움말 없음", () => {
    render(<EditFields doc={docWith("cards-3")} selectedId="s-services" onEdit={() => {}} />);
    expect(screen.queryByText(ITEMS_HINT)).toBeNull();
  });
});
