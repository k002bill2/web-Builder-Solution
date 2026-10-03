import { render, screen } from "@testing-library/react";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { EditFields } from "./EditFields";

/** 사이트 주인용 안내 (M2A-2b B5 · m2a K2 문구 2) — contact 섹션 편집 패널, 필드 위 informative Callout. 렌더 문서에는 넣지 않는다(편집기 UI 0) */
const OWNER = "내보낸 페이지에서 이 문의 양식은 보내기가 꺼진 채로 나갑니다. 방문자에게는 '온라인 문의는 준비 중입니다' 안내가 보입니다. 받는 곳 연결은 다음 단계에서 다룹니다.";

describe("contact 편집 패널 — 사이트 주인용 안내 (K2)", () => {
  it("contact 선택 → 필드 위 Callout(info) 문구 · 첫 필드보다 앞", async () => {
    render(<EditFields doc={sampleDoc()} selectedId="s-contact" onEdit={() => {}} />);
    const note = await screen.findByText(OWNER);
    expect(note.closest("[data-tone]")).toHaveAttribute("data-tone", "info");
    const firstField = screen.getAllByRole("textbox")[0]!;
    expect(note.compareDocumentPosition(firstField) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("다른 섹션 선택 → 안내 없음", () => {
    render(<EditFields doc={sampleDoc()} selectedId="s-faq" onEdit={() => {}} />);
    expect(screen.queryByText(OWNER)).toBeNull();
  });
});
