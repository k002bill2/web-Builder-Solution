import { ids, sampleDoc, section, withSections } from "../testing/sampleDoc";
import { REASONS } from "./reasons";
import { canAdd, canMove, canRemove, canSwapVariant } from "./rules";

const doc = sampleDoc();
const denied = (reason: string) => ({ ok: false, reason });
const ALLOWED = { ok: true };

/** 본문(hero 포함) n개 문서 */
function bodyOf(n: number) {
  const [header, hero, ...rest] = doc.sections;
  const body = Array.from({ length: n - 1 }, (_, i) => section("faq", "accordion", `s-body-${i}`));
  return withSections(doc, [header!, hero!, ...body, rest.at(-1)!]);
}

describe("canAdd (E-S12 · 5.3)", () => {
  it("본문 8개면 추가 가능, 9개면 상한 이유", () => {
    expect(canAdd(bodyOf(8))).toEqual(ALLOWED);
    expect(canAdd(bodyOf(9))).toEqual(denied(REASONS.addBodyLimit));
    expect(canAdd(bodyOf(9), "faq")).toEqual(denied(REASONS.addBodyLimit));
  });

  it("header·hero·footer는 이미 있으면 하나만", () => {
    expect(canAdd(doc, "header")).toEqual(denied(REASONS.addHeaderOnce));
    expect(canAdd(doc, "hero")).toEqual(denied(REASONS.addHeroOnce));
    expect(canAdd(doc, "footer")).toEqual(denied(REASONS.addFooterOnce));
    expect(canAdd(doc, "faq")).toEqual(ALLOWED);
  });

  it("없는 footer는 본문 상한과 무관하게 추가 가능", () => {
    const noFooter = withSections(bodyOf(9), bodyOf(9).sections.slice(0, -1));
    expect(canAdd(noFooter, "footer")).toEqual(ALLOWED);
  });
});

describe("canMove (5.2 표)", () => {
  it("Header · Footer는 두 방향 모두 고정", () => {
    expect(canMove(doc, "s-header", "up")).toEqual(denied(REASONS.moveHeader));
    expect(canMove(doc, "s-header", "down")).toEqual(denied(REASONS.moveHeader));
    expect(canMove(doc, "s-footer", "up")).toEqual(denied(REASONS.moveFooter));
    expect(canMove(doc, "s-footer", "down")).toEqual(denied(REASONS.moveFooter));
  });

  it("Hero 자체는 두 방향 모두 고정", () => {
    expect(canMove(doc, "s-hero", "up")).toEqual(denied(REASONS.moveHero));
    expect(canMove(doc, "s-hero", "down")).toEqual(denied(REASONS.moveHero));
  });

  it("Hero 바로 아래(첫 본문) 위로 막힘 · 아래로 가능", () => {
    expect(canMove(doc, "s-about", "up")).toEqual(denied(REASONS.moveAboveHero));
    expect(canMove(doc, "s-about", "down")).toEqual(ALLOWED);
  });

  it("마지막 본문 아래로 막힘 · 위로 가능", () => {
    expect(canMove(doc, "s-cta", "down")).toEqual(denied(REASONS.moveBelowFooter));
    expect(canMove(doc, "s-cta", "up")).toEqual(ALLOWED);
  });

  it("가운데 본문은 두 방향 가능", () => {
    expect(canMove(doc, "s-services", "up")).toEqual(ALLOWED);
    expect(canMove(doc, "s-services", "down")).toEqual(ALLOWED);
  });

  it("Hero가 없는 문서: 첫 본문 위로는 Header 경계(유추 문장)", () => {
    const noHero = withSections(doc, doc.sections.filter((s) => s.type !== "hero"));
    expect(canMove(noHero, "s-about", "up")).toEqual(denied(REASONS.moveAboveHeader));
  });

  it("없는 id는 오류", () => {
    expect(() => canMove(doc, "nope", "up")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});

describe("canRemove (5.4 표)", () => {
  it("Header · Footer · Hero는 늘 막힘", () => {
    expect(canRemove(doc, "s-header", "none")).toEqual(denied(REASONS.removeHeader));
    expect(canRemove(doc, "s-footer", "none")).toEqual(denied(REASONS.removeFooter));
    expect(canRemove(doc, "s-hero", "none")).toEqual(denied(REASONS.removeHero));
  });

  it("목적 '예약' — 유일한 Contact(예약)만 막힘", () => {
    const booking = withSections(doc, doc.sections.map((s) => (s.type === "contact" ? { ...s, variant: "booking" } : s)));
    expect(canRemove(booking, "s-contact", "booking")).toEqual(denied(REASONS.removeBooking));
    expect(canRemove(booking, "s-contact", "inquiry")).toEqual(ALLOWED); // cta-band가 남는다
    expect(canRemove(booking, "s-contact", "none")).toEqual(ALLOWED);
    const two = withSections(booking, [...booking.sections.slice(0, -1), section("contact", "booking", "s-contact-2"), booking.sections.at(-1)!]);
    expect(canRemove(two, "s-contact", "booking")).toEqual(ALLOWED);
    // 예약 변형이 아닌 contact는 목적 '예약'이어도 막지 않는다
    expect(canRemove(doc, "s-contact", "booking")).toEqual(ALLOWED);
  });

  it("목적 '문의' — cta-band·contact 중 남은 하나만 막힘", () => {
    expect(canRemove(doc, "s-contact", "inquiry")).toEqual(ALLOWED);
    const onlyCta = withSections(doc, doc.sections.filter((s) => s.type !== "contact"));
    expect(canRemove(onlyCta, "s-cta", "inquiry")).toEqual(denied(REASONS.removeInquiry));
    expect(canRemove(onlyCta, "s-cta", "sales")).toEqual(ALLOWED);
  });

  it("본문 5개여도 막지 않는다(게이트가 알린다)", () => {
    const five = bodyOf(5);
    expect(ids(five)).toHaveLength(7);
    expect(canRemove(five, "s-body-0", "none")).toEqual(ALLOWED);
  });

  it("header가 둘이면 여분은 지울 수 있다", () => {
    const twoHeaders = withSections(doc, [section("header", "transparent", "s-header-2"), ...doc.sections]);
    expect(canRemove(twoHeaders, "s-header-2", "none")).toEqual(ALLOWED);
  });
});

describe("canSwapVariant (8.2 r3 Q-14 — 목적 필수 조건 R-03·R-04를 canRemove와 같은 판정으로)", () => {
  const booking = withSections(doc, doc.sections.map((s) => (s.type === "contact" ? { ...s, variant: "booking" } : s)));

  it("목적 '예약' — 유일한 예약 변형을 다른 변형으로 바꾸면 막힘(이유 = 5.4 R-04 문장)", () => {
    expect(canSwapVariant(booking, "s-contact", "form", "booking")).toEqual(denied(REASONS.removeBooking));
    expect(canSwapVariant(booking, "s-contact", "booking", "booking")).toEqual(ALLOWED); // 같은 변형 = 조건 유지
  });

  it("같은 목적에 예약 변형이 둘이면 하나는 바꿀 수 있다", () => {
    const two = withSections(booking, [...booking.sections.slice(0, -1), section("contact", "booking", "s-contact-2"), booking.sections.at(-1)!]);
    expect(canSwapVariant(two, "s-contact", "form", "booking")).toEqual(ALLOWED);
  });

  it("예약 변형으로 바꾸기 · 예약 변형이 원래 없는 문서의 교체 · 상관없는 섹션 교체는 막지 않는다", () => {
    expect(canSwapVariant(doc, "s-contact", "booking", "booking")).toEqual(ALLOWED);
    expect(canSwapVariant(doc, "s-hero", "split", "booking")).toEqual(ALLOWED);
    expect(canSwapVariant(booking, "s-hero", "split", "booking")).toEqual(ALLOWED);
  });

  it("목적 '문의' — 교체는 유형을 바꾸지 않아 R-03을 깨지 않는다(유일한 contact도 교체 허용)", () => {
    const onlyContact = withSections(doc, doc.sections.filter((s) => s.type !== "cta-band"));
    expect(canSwapVariant(onlyContact, "s-contact", "booking", "inquiry")).toEqual(ALLOWED);
    expect(canSwapVariant(booking, "s-contact", "form", "inquiry")).toEqual(ALLOWED);
  });

  it("목적 없음('none')·다른 목적이면 구조 규칙만 — 유일한 예약 변형도 바꾼다", () => {
    expect(canSwapVariant(booking, "s-contact", "form", "none")).toEqual(ALLOWED);
    expect(canSwapVariant(booking, "s-contact", "form", "sales")).toEqual(ALLOWED);
  });

  it("canRemove와 같은 판정 — 예약 변형이 원래 없는 문서에서 상관없는 섹션 삭제는 허용(전 ≥1 · 후 0일 때만 거부)", () => {
    expect(canRemove(doc, "s-about", "booking")).toEqual(ALLOWED);
    expect(canRemove(withSections(doc, doc.sections.filter((s) => s.type !== "contact" && s.type !== "cta-band")), "s-about", "inquiry")).toEqual(ALLOWED);
  });
});
