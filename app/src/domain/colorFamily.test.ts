import { describe, expect, it } from "vitest";
import { referenceFixtures } from "../fixtures/references";
import { COLOR_FAMILY_RULES, colorFamilyOf, colorFamilyOfHsl, hexToHsl } from "./colorFamily";

describe("대표색 계열 분류", () => {
  it("경계값 상수를 고정한다", () => {
    expect(COLOR_FAMILY_RULES).toEqual({
      minSaturation: 15,
      minLightness: 8,
      maxLightness: 95,
      warmUntilHue: 70,
      greenUntilHue: 170,
      coolUntilHue: 330,
    });
  });

  it("hex를 HSL(도·%·%)로 바꾼다", () => {
    const d = hexToHsl(referenceFixtures[3]!.colorPalette.primary);
    expect(d.h).toBeCloseTo(167.1, 1);
    expect(d.s).toBeCloseTo(100, 1);
    expect(d.l).toBeCloseTo(32.9, 1);
    expect(hexToHsl("#FFF")).toEqual({ h: 0, s: 0, l: 100 });
  });

  it("잘못된 hex는 거부한다", () => {
    expect(() => hexToHsl("8B5E3C")).toThrow();
    expect(() => hexToHsl("#12345")).toThrow();
  });

  it("목업 레퍼런스 6개의 대표색(c1)을 결정적으로 분류한다", () => {
    expect(referenceFixtures.map((r) => [r.key, colorFamilyOf(r.colorPalette.primary)])).toEqual([
      ["A", "warm"],
      ["B", "neutral"],
      ["C", "cool"],
      ["D", "green"],
      ["E", "neutral"],
      ["F", "warm"],
    ]);
  });

  it("채도 15% 미만은 색상각과 무관하게 무채색이다", () => {
    expect(colorFamilyOfHsl({ h: 216, s: 14.9, l: 50 })).toBe("neutral");
    expect(colorFamilyOfHsl({ h: 216, s: 15, l: 50 })).toBe("cool");
  });

  it("명도 8% 미만·95% 초과는 채도가 높아도 무채색이다", () => {
    expect(colorFamilyOfHsl({ h: 0, s: 100, l: 7.9 })).toBe("neutral");
    expect(colorFamilyOfHsl({ h: 0, s: 100, l: 8 })).toBe("warm");
    expect(colorFamilyOfHsl({ h: 0, s: 100, l: 95 })).toBe("warm");
    expect(colorFamilyOfHsl({ h: 0, s: 100, l: 95.1 })).toBe("neutral");
  });

  it("색상각 경계: 70° 그린, 170° 차가운, 330° 따뜻한 (하한 포함)", () => {
    const at = (h: number) => colorFamilyOfHsl({ h, s: 60, l: 50 });
    expect([at(0), at(69.9), at(70), at(169.9), at(170), at(329.9), at(330), at(359.9)]).toEqual([
      "warm",
      "warm",
      "green",
      "green",
      "cool",
      "cool",
      "warm",
      "warm",
    ]);
  });
});
