import { SECTION_LIBRARY } from "../../domain/sectionLibrary";
import { SECTION_TYPES } from "../contracts/pageDoc";
import { SECTION_DEFINITIONS, SECTION_TYPE_INFO, getSectionDefinition, listSectionTypes } from "./registry";

const BOUND = ["header", "hero", "footer"] as const;
const BODY = SECTION_TYPES.filter((t) => t !== "header" && t !== "footer" && t !== "hero");
const HANGUL = /[가-힣]/;

describe("섹션 정의 레지스트리 (TRD 4.4 · SPEC 8.1)", () => {
  it("12 type 모두 정의되어 있고 라이브러리 순서로 나열된다", () => {
    expect(listSectionTypes().map((t) => t.type)).toEqual([...SECTION_TYPES]);
    for (const type of SECTION_TYPES) {
      expect(SECTION_TYPE_INFO[type].variants.length).toBeGreaterThan(0);
    }
  });

  it.each(BOUND)("%s 변형 키 = domain/sectionLibrary 키 (가드)", (type) => {
    expect(SECTION_TYPE_INFO[type].variants).toEqual(Object.keys(SECTION_LIBRARY.sections[type]));
  });

  it.each(BOUND)("%s 변형 이름표는 sectionLibrary 이름표와 같다", (type) => {
    for (const [variant, def] of Object.entries(SECTION_LIBRARY.sections[type])) {
      expect(getSectionDefinition(type, variant)?.label).toBe(def.label);
    }
  });

  it("본문 9 type은 변형 1~2개씩", () => {
    expect(BODY).toHaveLength(9);
    for (const type of BODY) {
      const n = SECTION_TYPE_INFO[type].variants.length;
      expect(n >= 1 && n <= 2).toBe(true);
    }
  });

  it("유형 목록의 변형마다 정의가 있고, 정의마다 유형 목록에 있다", () => {
    const listed = SECTION_TYPES.flatMap((type) => SECTION_TYPE_INFO[type].variants.map((v) => `${type}/${v}`));
    expect(SECTION_DEFINITIONS.map((d) => `${d.type}/${d.variant}`).sort()).toEqual([...listed].sort());
  });

  it("헤딩 수준(R-10): hero 1 · 본문 2 · header·footer 없음", () => {
    for (const def of SECTION_DEFINITIONS) {
      const expected = def.type === "hero" ? 1 : def.type === "header" || def.type === "footer" ? null : 2;
      expect(def.a11y.headingLevel, `${def.type}/${def.variant}`).toBe(expected);
    }
  });

  it("footer 사업자정보 여부(R-12)는 sectionLibrary 값과 같다", () => {
    for (const [variant, def] of Object.entries(SECTION_LIBRARY.sections.footer)) {
      expect(getSectionDefinition("footer", variant)?.hasBusinessInfo).toBe(def.hasBusinessInfo === true);
    }
  });

  it("contact에 예약 변형(R-04)이 정확히 하나 있다", () => {
    const reservation = SECTION_DEFINITIONS.filter((d) => d.reservation === true);
    expect(reservation.map((d) => d.type)).toEqual(["contact"]);
  });

  it("슬롯 스키마: 키 유일 · maxLength 양수(R-13) · 권장 ≤ 상한 · 기본 글자 ≤ 상한 · 이름표 한국어", () => {
    for (const def of SECTION_DEFINITIONS) {
      const at = `${def.type}/${def.variant}`;
      const keys = def.slots.map((s) => s.key);
      expect(new Set(keys).size, at).toBe(keys.length);
      expect(def.slots.length, at).toBeGreaterThan(0);
      for (const slot of def.slots) {
        expect(slot.maxLength, `${at}.${slot.key}`).toBeGreaterThan(0);
        if (slot.recommendedLength !== undefined) expect(slot.recommendedLength).toBeLessThanOrEqual(slot.maxLength);
        if (slot.defaultText !== undefined) expect([...slot.defaultText].length).toBeLessThanOrEqual(slot.maxLength);
        expect(HANGUL.test(slot.label), `${at}.${slot.key}`).toBe(true);
      }
      expect(HANGUL.test(def.label), at).toBe(true);
    }
  });

  it("모든 type 설명은 한국어이고, 이미지 슬롯이 있으면 altRequired", () => {
    for (const info of listSectionTypes()) expect(HANGUL.test(info.description)).toBe(true);
    for (const def of SECTION_DEFINITIONS) {
      expect(def.a11y.altRequired).toBe(def.slots.some((s) => s.kind === "image"));
    }
  });

  it("외부 URL·도메인 패턴 0 (PRD 원칙 4)", () => {
    const text = JSON.stringify({ SECTION_DEFINITIONS, SECTION_TYPE_INFO });
    expect(text).not.toMatch(/https?:|\/\/|www\.|\.(com|net|io|co\.kr|kr)\b/i);
  });

  it("모르는 type·variant는 undefined", () => {
    expect(getSectionDefinition("hero", "no-such")).toBeUndefined();
    expect(getSectionDefinition("nope" as never, "split")).toBeUndefined();
  });

  it("정의는 얼어 있다", () => {
    expect(Object.isFrozen(SECTION_DEFINITIONS)).toBe(true);
    expect(Object.isFrozen(SECTION_DEFINITIONS[0]?.slots)).toBe(true);
  });
});
