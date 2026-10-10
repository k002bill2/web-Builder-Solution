import type { Callout as CalloutType } from "../ds/Callout";

/** 사이트 주인용 안내 (m2a K2 문구 2) — 문의 폼은 보내기가 꺼진 채 나간다(A안). 렌더 문서에는 넣지 않는다(편집기 UI 0, 5.7 r4.8) */
export const CONTACT_OWNER_NOTE = "내보낸 페이지에서 이 문의 양식은 보내기가 꺼진 채로 나갑니다. 방문자에게는 '온라인 문의는 준비 중입니다' 안내가 보입니다. 받는 곳 연결은 다음 단계에서 다룹니다.";
/** 예약 섹션(contact/booking) 문구 — K2 문구 2의 "문의"를 "예약"으로(SPEC-BODY B1-11 · MQ-B4) */
export const BOOKING_OWNER_NOTE = "내보낸 페이지에서 이 예약 양식은 보내기가 꺼진 채로 나갑니다. 방문자에게는 '온라인 예약은 준비 중입니다' 안내가 보입니다. 받는 곳 연결은 다음 단계에서 다룹니다.";

/**
 * contact 섹션(form · booking) 편집 패널 맨 위 informative Callout — 조작 뒤 청크(contact 섹션을 고를 때만 받는다, /studio 진입 예산 M2A-2b B6 실측).
 * DS `Callout`은 부르는 쪽이 넘긴다 — 이 청크가 DS를 import하면 Callout이 공유 청크로 갈라져 진입 합계가 오히려 는다(실측 125.10KB).
 */
export default function ContactOwnerNote({ Callout, booking = false }: { readonly Callout: typeof CalloutType; readonly booking?: boolean }) {
  return (
    <Callout tone="info" title={booking ? "내보낸 페이지의 예약 양식" : "내보낸 페이지의 문의 양식"}>
      {booking ? BOOKING_OWNER_NOTE : CONTACT_OWNER_NOTE}
    </Callout>
  );
}
