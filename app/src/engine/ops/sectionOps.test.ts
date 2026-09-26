import type { PageDoc } from "../contracts/pageDoc";
import { getSectionDefinition } from "../sections/registry";
import { ids, sampleDoc, section, withSections } from "../testing/sampleDoc";
import { diffSlotValues, diffSlots } from "./diff";
import { hashDoc } from "./hash";
import { REASONS } from "./reasons";
import { addSection, moveSection, removeSection, restoreSection, swapVariant } from "./sectionOps";

const doc = sampleDoc();
const at = (d: PageDoc, id: string) => d.sections.find((s) => s.instanceId === id)!;
const opts = { instanceId: "s-new", motionPreset: "L2" as const };

describe("addSection (5.3)", () => {
  it("선택 섹션 바로 뒤에 넣고 새 instanceId·위치를 돌려준다", () => {
    const result = addSection(doc, "faq", "accordion", "s-services", opts);
    expect(ids(result.doc)).toEqual(["s-header", "s-hero", "s-about", "s-services", "s-new", "s-faq", "s-contact", "s-cta", "s-footer"]);
    expect(result.instanceId).toBe("s-new");
    expect(result.index).toBe(4);
    expect(ids(doc)).toHaveLength(8); // 입력 불변(deepFreeze 입력 — 바꾸면 throw)
  });

  it("선택이 Header·'페이지 정보'(null)면 Hero 뒤, Footer면 Footer 앞", () => {
    expect(ids(addSection(doc, "faq", "accordion", "s-header", opts).doc)[2]).toBe("s-new");
    expect(ids(addSection(doc, "faq", "accordion", null, opts).doc)[2]).toBe("s-new");
    expect(ids(addSection(doc, "faq", "accordion", "s-footer", opts).doc).slice(-2)).toEqual(["s-new", "s-footer"]);
  });

  it("기본 슬롯 콘텐츠 · 모션 = min(문서 프리셋, L1, 정의 상한)", () => {
    const added = at(addSection(doc, "services", "cards-3", null, opts).doc, "s-new");
    expect(Object.keys(added.slots)).toEqual(getSectionDefinition("services", "cards-3")!.slots.map((s) => s.key));
    expect(added.slots.heading).toBe("서비스");
    expect(added.motion).toBe("L1");
    expect(at(addSection(doc, "services", "cards-3", null, { ...opts, motionPreset: "L0" }).doc, "s-new").motion).toBe("L0");
  });

  it("본문 상한 9 · 이미 있는 Hero · 모르는 변형 · 겹치는 id · 없는 기준 id는 오류", () => {
    const nine = [section("faq", "accordion", "x1"), section("faq", "accordion", "x2"), section("faq", "accordion", "x3")];
    const full = withSections(doc, [...doc.sections.slice(0, -1), ...nine, doc.sections.at(-1)!]);
    expect(() => addSection(full, "faq", "accordion", null, opts)).toThrow(expect.objectContaining({ code: "NOT_ALLOWED" }));
    expect(() => addSection(doc, "hero", "split", null, opts)).toThrow(expect.objectContaining({ code: "NOT_ALLOWED" }));
    expect(() => addSection(doc, "faq", "nope", null, opts)).toThrow(expect.objectContaining({ code: "UNKNOWN_VARIANT" }));
    expect(() => addSection(doc, "faq", "accordion", null, { ...opts, instanceId: "s-hero" })).toThrow(expect.objectContaining({ code: "BAD_ID" }));
    expect(() => addSection(doc, "faq", "accordion", null, { ...opts, instanceId: "a/b" })).toThrow(expect.objectContaining({ code: "BAD_ID" }));
    expect(() => addSection(doc, "faq", "accordion", "nope", opts)).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});

describe("removeSection · restoreSection (5.4)", () => {
  it("지우고 되돌리기 정보(섹션·자리)를 돌려준다 · 되돌리면 원래 해시", () => {
    const { doc: removed, undo } = removeSection(doc, "s-services", "none");
    expect(ids(removed)).not.toContain("s-services");
    expect(undo).toEqual({ section: at(doc, "s-services"), index: 3 });
    const restored = restoreSection(removed, undo);
    expect(ids(restored)).toEqual(ids(doc));
    expect(hashDoc(restored)).toBe(hashDoc(doc));
  });

  it("본문 5개 부근: 6 → 5 → 4 모두 허용(게이트 몫)", () => {
    const five = removeSection(doc, "s-faq", "none").doc;
    expect(ids(removeSection(five, "s-about", "none").doc)).toHaveLength(6);
  });

  it("Header·Hero·Footer 삭제는 오류, 없는 id도 오류", () => {
    for (const id of ["s-header", "s-hero", "s-footer"]) {
      expect(() => removeSection(doc, id, "none")).toThrow(expect.objectContaining({ code: "NOT_ALLOWED" }));
    }
    expect(() => removeSection(doc, "nope", "none")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });

  it("목적 필수 조건을 canRemove 전체 판정으로 강제한다 — 예약 목적 마지막 예약 변형 (R-04)", () => {
    const booking = withSections(doc, doc.sections.map((s) => (s.instanceId === "s-contact" ? section("contact", "booking", "s-book") : s)));
    const denied = expect(() => removeSection(booking, "s-book", "booking"));
    denied.toThrow(expect.objectContaining({ code: "NOT_ALLOWED", message: REASONS.removeBooking }));
    expect(ids(removeSection(booking, "s-book", "inquiry").doc)).not.toContain("s-book"); // cta-band가 남아 R-03 충족
  });

  it("문의 목적 마지막 cta-band·contact 삭제 거부 (R-03) · 둘 중 하나는 지울 수 있다", () => {
    const onlyContact = removeSection(doc, "s-cta", "inquiry").doc;
    expect(() => removeSection(onlyContact, "s-contact", "inquiry")).toThrow(expect.objectContaining({ code: "NOT_ALLOWED", message: REASONS.removeInquiry }));
    const onlyCta = removeSection(doc, "s-contact", "inquiry").doc;
    expect(() => removeSection(onlyCta, "s-cta", "inquiry")).toThrow(expect.objectContaining({ code: "NOT_ALLOWED", message: REASONS.removeInquiry }));
  });

  it("목적 없음('none')이면 구조 규칙만 — 마지막 문의·예약 섹션도 지운다 · 목적 인자는 필수", () => {
    const onlyContact = removeSection(doc, "s-cta", "none").doc;
    expect(ids(removeSection(onlyContact, "s-contact", "none").doc)).not.toContain("s-contact");
    // @ts-expect-error — 목적 기본값 없음(필수 인자)
    expect(() => removeSection(doc, "s-services")).toThrow(expect.objectContaining({ code: "BAD_VALUE" }));
  });

  it("같은 id가 이미 있으면 되돌리기 오류", () => {
    const { undo } = removeSection(doc, "s-services", "none");
    expect(() => restoreSection(doc, undo)).toThrow(expect.objectContaining({ code: "BAD_ID" }));
  });
});

describe("moveSection (5.2)", () => {
  it("한 칸 옮기고 새 위치를 돌려준다 · instanceId·내용 보존", () => {
    const result = moveSection(doc, "s-services", "down");
    expect(ids(result.doc)).toEqual(["s-header", "s-hero", "s-about", "s-faq", "s-services", "s-contact", "s-cta", "s-footer"]);
    expect(result.index).toBe(4);
    expect(at(result.doc, "s-services")).toBe(at(doc, "s-services"));
    expect(ids(moveSection(doc, "s-services", "up").doc).slice(2, 4)).toEqual(["s-services", "s-about"]);
  });

  it("첫 본문 위로 · 마지막 본문 아래로 · 고정 섹션은 오류", () => {
    expect(() => moveSection(doc, "s-about", "up")).toThrow(expect.objectContaining({ code: "NOT_ALLOWED" }));
    expect(() => moveSection(doc, "s-cta", "down")).toThrow(expect.objectContaining({ code: "NOT_ALLOWED" }));
    expect(() => moveSection(doc, "s-hero", "down")).toThrow(expect.objectContaining({ code: "NOT_ALLOWED" }));
    expect(() => moveSection(doc, "s-footer", "up")).toThrow(expect.objectContaining({ code: "NOT_ALLOWED" }));
  });
});

describe("swapVariant (5.5)", () => {
  it("같은 키·종류 슬롯 값은 유지, 없는 키는 잃음, 새 키는 기본 값", () => {
    const edited = withSections(doc, doc.sections.map((s) => (s.instanceId === "s-hero" ? { ...s, slots: { ...s.slots, title: "우리 제목" } } : s)));
    const result = swapVariant(edited, "s-hero", "center");
    const hero = at(result.doc, "s-hero");
    expect(hero.variant).toBe("center");
    expect(hero.slots.title).toBe("우리 제목");
    expect(result.lostSlotKeys).toEqual(["image"]);
    expect(hero.slots).not.toHaveProperty("image");
    expect(hero.instanceId).toBe("s-hero");
    const back = at(swapVariant(result.doc, "s-hero", "split").doc, "s-hero");
    expect(back.slots.image).toMatchObject({ kind: "image", source: { kind: "placeholder" } });
  });

  it("잃은 키 = diffSlots의 잃음 (5.5 캡션과 실제 동작 일치)", () => {
    for (const variant of ["split", "center", "grid", "text", "image"]) {
      const a = getSectionDefinition("hero", "fullbleed-left")!.slots;
      const b = getSectionDefinition("hero", variant)!.slots;
      expect(swapVariant(doc, "s-hero", variant).lostSlotKeys).toEqual(diffSlots(a, b).lost.map((e) => e.key));
    }
  });

  it("다른 섹션 슬롯 값은 그대로", () => {
    const { doc: swapped } = swapVariant(doc, "s-hero", "split");
    expect(diffSlotValues(doc, swapped).changed.filter((c) => c.instanceId !== "s-hero")).toEqual([]);
  });

  it("모션은 새 변형 상한으로 낮춘다", () => {
    const l2 = withSections(doc, doc.sections.map((s) => (s.instanceId === "s-services" ? { ...s, motion: "L2" as const } : s)));
    expect(at(swapVariant(l2, "s-services", "list").doc, "s-services").motion).toBe("L1");
  });

  it("모르는 변형 · 없는 id는 오류", () => {
    expect(() => swapVariant(doc, "s-hero", "nope")).toThrow(expect.objectContaining({ code: "UNKNOWN_VARIANT" }));
    expect(() => swapVariant(doc, "nope", "split")).toThrow(expect.objectContaining({ code: "NOT_FOUND" }));
  });
});
