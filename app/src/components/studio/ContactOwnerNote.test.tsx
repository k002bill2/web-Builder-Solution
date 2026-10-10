import { render, screen } from "@testing-library/react";
import { sampleDoc, section } from "../../engine/testing/sampleDoc";
import { EditFields } from "./EditFields";

/** 사이트 주인용 안내 (M2A-2b B5 · m2a K2 문구 2) — contact 섹션 편집 패널, 필드 위 informative Callout. 렌더 문서에는 넣지 않는다(편집기 UI 0) */
const OWNER = "내보낸 페이지에서 이 문의 양식은 보내기가 꺼진 채로 나갑니다. 방문자에게는 '온라인 문의는 준비 중입니다' 안내가 보입니다. 받는 곳 연결은 다음 단계에서 다룹니다.";

/** 예약 섹션 문구 (SPEC-BODY B1-11 · MQ-B4 · B-M2B-03) — K2 문구 2의 "문의"를 "예약"으로 */
const BOOKING = "내보낸 페이지에서 이 예약 양식은 보내기가 꺼진 채로 나갑니다. 방문자에게는 '온라인 예약은 준비 중입니다' 안내가 보입니다. 받는 곳 연결은 다음 단계에서 다룹니다.";

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

describe("contact/booking 편집 패널 — 예약 안내 (MQ-B4)", () => {
  it("booking 선택 → 예약 문구 Callout(info) · 문의 문구 없음", async () => {
    const doc = sampleDoc({ sections: [section("contact", "booking", "s-booking")] });
    render(<EditFields doc={doc} selectedId="s-booking" onEdit={() => {}} />);
    const note = await screen.findByText(BOOKING);
    expect(note.closest("[data-tone]")).toHaveAttribute("data-tone", "info");
    expect(screen.getByText("내보낸 페이지의 예약 양식")).toBeInTheDocument();
    expect(screen.queryByText(OWNER)).toBeNull();
  });

  it("form 선택 → 문의 문구 · 예약 문구 없음", async () => {
    render(<EditFields doc={sampleDoc()} selectedId="s-contact" onEdit={() => {}} />);
    await screen.findByText(OWNER);
    expect(screen.getByText("내보낸 페이지의 문의 양식")).toBeInTheDocument();
    expect(screen.queryByText(BOOKING)).toBeNull();
  });
});
