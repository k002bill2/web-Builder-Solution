import { SECTION_DEFINITIONS } from "../engine/sections/registry";
import { SAMPLE_COPY, sampleCopyOf } from "./sampleCopy";

/** V4 예시 문구 표 (SPEC r4.7 A3-Q8) — 섹션 유형 × 슬롯 키, 중립 한국어, 각 정의의 권장(없으면 상한) 이하 */
describe("예시 문구 표", () => {
  const textSlots = SECTION_DEFINITIONS.flatMap((def) => def.slots.filter((s) => s.kind !== "image").map((slot) => ({ def, slot })));

  it("모든 예시 문구 ≤ 그 슬롯을 쓰는 모든 정의의 권장 글자 수(없으면 상한) · 빈 문구 0", () => {
    const over = textSlots.flatMap(({ def, slot }) => {
      const text = sampleCopyOf(def.type, slot.key);
      if (text === undefined) return [];
      const limit = slot.recommendedLength ?? slot.maxLength;
      return text.trim() === "" || [...text].length > limit ? [`${def.type}/${def.variant}.${slot.key} ${[...text].length}/${limit}`] : [];
    });
    expect(over).toEqual([]);
  });

  it("모든 (유형, 텍스트 슬롯 키)에 예시 문구 — 변형마다 다른 contact 제목·제출 버튼(문의/예약)만 엔진 기본값", () => {
    const keys = [...new Set(textSlots.map(({ def, slot }) => `${def.type}/${slot.key}`))];
    expect(keys.filter((key) => SAMPLE_COPY[key] === undefined)).toEqual(["contact/heading", "contact/submit"]);
  });

  it("표의 키는 모두 레지스트리에 있는 (유형, 슬롯 키) — 낡은 행 0", () => {
    const known = new Set(textSlots.map(({ def, slot }) => `${def.type}/${slot.key}`));
    expect(Object.keys(SAMPLE_COPY).filter((key) => !known.has(key))).toEqual([]);
  });

  it("엔진 기본 문구와 다르다(예시 문구 = 새 문서 전용) · 픽스처 브랜드 이름 0", () => {
    const same = textSlots.filter(({ def, slot }) => sampleCopyOf(def.type, slot.key) === slot.defaultText && slot.defaultText !== undefined).map(({ def, slot }) => `${def.type}.${slot.key}`);
    expect(same).toEqual([]);
    expect(Object.values(SAMPLE_COPY).join(" ")).not.toMatch(/카페|헤어|치과|살롱|클리닉/);
  });
});
