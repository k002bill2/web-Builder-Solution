import { describe, expect, it } from "vitest";
import { countField, FIELD_INPUT_SLACK } from "./fieldCounter";

const x = (n: number) => "가".repeat(n);

describe("fieldCounter (E-AC-06 · SPEC 5.6 · E-S19)", () => {
  it("분모 = 권장 → 없으면 상한 · 카운터 글자 \"18 / 24자\"", () => {
    expect(countField(x(18), { maxLength: 24 }).counterText).toBe("18 / 24자");
    expect(countField(x(34), { maxLength: 40, recommendedLength: 28 }).counterText).toBe("34 / 28자");
    expect(countField(x(3), {}).counterText).toBe("3자");
  });

  it("글자 수 = 코드 포인트(엔진 charCount와 같은 기준)", () => {
    expect(countField("😀😀", { maxLength: 10 }).length).toBe(2);
  });

  it("권장 이하 ok · 권장 초과 warn(권장 문장) · 상한 초과 block(R-13 문장)", () => {
    const limits = { maxLength: 40, recommendedLength: 28 };
    expect(countField(x(28), limits).level).toBe("ok");
    expect(countField(x(28), limits).message).toBeUndefined();
    expect(countField(x(29), limits)).toMatchObject({ level: "warn", message: "권장 28자 — 넘으면 2줄이 될 수 있습니다" });
    expect(countField(x(40), limits).level).toBe("warn");
    expect(countField(x(46), limits)).toMatchObject({ level: "block", message: "상한 40자를 6자 넘었습니다 — 내보내기를 막습니다 (R-13)" });
  });

  it("상한만 있으면 상한 초과만 block · 권장 문장은 주입 가능(페이지 정보)", () => {
    expect(countField(x(24), { maxLength: 24 }).level).toBe("ok");
    expect(countField(x(25), { maxLength: 24 }).level).toBe("block");
    expect(countField(x(61), { recommendedLength: 60 }, (r) => `권장 ${r}자`)).toMatchObject({ level: "warn", message: "권장 60자" });
  });

  it("입력 가능 길이 = 상한 + 10 (상한 없으면 제한 없음)", () => {
    expect(FIELD_INPUT_SLACK).toBe(10);
    expect(countField("", { maxLength: 40 }).inputMaxLength).toBe(50);
    expect(countField("", { recommendedLength: 60 }).inputMaxLength).toBeUndefined();
  });
});
