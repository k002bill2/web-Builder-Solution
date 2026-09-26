import { describe, expect, it } from "vitest";
import {
  AA_BODY_RATIO,
  checkPaletteContrast,
  contrastRatio,
  formatRatio,
  nearestCompliantColor,
  relativeLuminance,
  shiftLightness,
} from "./contrast";
import { derivePalette } from "./palette";
import type { PaletteEntry } from "./referenceDetail";

const WHITE = "#FFFFFF";
const palette = (primary: string, ink = "#2C2C2C", surface = "#F3E9DD"): readonly PaletteEntry[] => [
  { role: "primary", hex: primary },
  { role: "surface", hex: surface },
  { role: "ink", hex: ink },
  { role: "muted", hex: "#9A7B63" },
  { role: "bg", hex: "#FFFFFF" },
];

describe("WCAG 상대 휘도·대비 (SPEC 3.4)", () => {
  it("흰색 1, 검정 0, 흑백 대비 21:1", () => {
    expect(relativeLuminance(WHITE)).toBe(1);
    expect(relativeLuminance("#000000")).toBe(0);
    expect(contrastRatio(WHITE, "#000000")).toBeCloseTo(21, 5);
  });

  it("픽스처 실측: F #D47800 3.24:1 · D #00A884 3.03:1 · A #8B5E3C 5.58:1 (흰 글자)", () => {
    expect(contrastRatio(WHITE, "#D47800")).toBeCloseTo(3.24, 2);
    expect(contrastRatio(WHITE, "#00A884")).toBeCloseTo(3.03, 2);
    expect(contrastRatio(WHITE, "#8B5E3C")).toBeCloseTo(5.58, 2);
  });

  it("대비는 순서와 무관하다", () => {
    expect(contrastRatio("#D47800", WHITE)).toBe(contrastRatio(WHITE, "#D47800"));
  });

  it("x.x:1 표시는 버림 — 기준 미달 값(4.47)이 4.5:1로 보이지 않는다", () => {
    expect(formatRatio(4.47)).toBe("4.4:1");
    expect(formatRatio(3.238)).toBe("3.2:1");
    expect(formatRatio(21)).toBe("21.0:1");
  });
});

/** 도달한 보정 — 불가면 테스트 실패 */
const reached = (hex: string, against: string, target?: number) => {
  const result = nearestCompliantColor(hex, against, target);
  if (!result.reached) throw new Error(`도달 불가: ${hex} / ${against}`);
  return result.fix;
};

describe("4.5:1이 되는 가장 가까운 명도 보정 (AC-12 계산)", () => {
  it.each(["#D47800", "#00A884", "#C9A96E"])("%s: 보정값은 기준을 넘고, 한 단계 더 가까우면 기준 미만이다", (hex) => {
    const fix = reached(hex, WHITE);
    expect(fix.hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(fix.ratio).toBe(contrastRatio(fix.hex, WHITE));
    expect(fix.ratio).toBeGreaterThanOrEqual(AA_BODY_RATIO);
    const closer = shiftLightness(hex, fix.lightnessDelta - Math.sign(fix.lightnessDelta) * 0.1);
    expect(contrastRatio(closer, WHITE)).toBeLessThan(AA_BODY_RATIO);
  });

  it("흰 글자 대비 보정은 대표색을 어둡게 한다", () => {
    expect(reached("#D47800", WHITE).lightnessDelta).toBeLessThan(0);
  });

  it("이미 기준을 넘으면 그대로", () => {
    expect(nearestCompliantColor("#8B5E3C", WHITE)).toEqual({ reached: true, fix: { hex: "#8B5E3C", ratio: contrastRatio("#8B5E3C", WHITE), lightnessDelta: 0 } });
  });

  it("4.5는 어떤 배경에서도 도달한다 — 흑·백 중 큰 대비의 최솟값 ≈ 4.58 (중간 명도 회색 스윕)", () => {
    for (let g = 0; g <= 255; g += 5) {
      const gray = `#${g.toString(16).padStart(2, "0").repeat(3)}`.toUpperCase();
      expect(nearestCompliantColor("#2C2C2C", gray).reached, gray).toBe(true);
    }
  });
});

describe("7:1 불가 조합 (D-2A4B2-01) — throw 대신 값", () => {
  const BLACK = "#000000";
  // 상대 휘도 0.10~0.30 배경은 흰색·검정 모두 7:1 미만. 경계: #595959(흰 7.005) 가능 · #5A5A5A(흰 6.90) 불가 · #949494(검 6.92) 불가 · #959595(검 7.01) 가능
  it.each(["#8B5E3C", "#1F5FBF", "#5A5A5A", "#777777", "#949494"])("%s 위 7:1: throw 0, reached=false, best = 흑·백 중 큰 대비(7 미만)", (against) => {
    const result = nearestCompliantColor("#2C2C2C", against, 7);
    expect(result.reached).toBe(false);
    if (result.reached) return;
    const best = Math.max(contrastRatio(WHITE, against), contrastRatio(BLACK, against));
    expect(result.best.ratio).toBeCloseTo(best, 10);
    expect(result.best.ratio).toBeLessThan(7);
    expect(result.best.ratio).toBe(contrastRatio(result.best.hex, against));
  });

  it("#8B5E3C: 흰 5.58 · 검 3.76 — best는 흰색", () => {
    const result = nearestCompliantColor("#2C2C2C", "#8B5E3C", 7);
    expect(result).toMatchObject({ reached: false, best: { hex: WHITE } });
    expect(formatRatio(contrastRatio(WHITE, "#8B5E3C"))).toBe("5.5:1");
    expect(formatRatio(contrastRatio(BLACK, "#8B5E3C"))).toBe("3.7:1");
  });

  it.each(["#595959", "#959595"])("경계 %s 위 7:1은 가능 — 기존처럼 제안", (against) => {
    const fix = reached("#2C2C2C", against, 7);
    expect(fix.ratio).toBeGreaterThanOrEqual(7);
  });

  it("7:1 가능 조합은 기존 제안 그대로 (ref-a primary → #775033)", () => {
    expect(reached("#8B5E3C", WHITE, 7).hex).toBe("#775033");
  });
});

describe("C-1~C-3 검사", () => {
  it("C-1 흰 글자 vs 대표색 · C-2 잉크 vs 배경 · 밝은 카드면 C-3 없음", () => {
    const checks = checkPaletteContrast(palette("#D47800"), "light");
    expect(checks.map((c) => c.id)).toEqual(["C-1", "C-2"]);
    expect(checks[0]).toMatchObject({ id: "C-1", foreground: WHITE, background: "#D47800", pass: false });
    expect(checks[0]!.ratio).toBeCloseTo(3.24, 2);
    expect(checks[1]).toMatchObject({ id: "C-2", foreground: "#2C2C2C", background: "#FFFFFF", pass: true });
  });

  it("C-3 어두운 카드: 카드 표면=대표색, 카드 글자=잉크로 해석한다", () => {
    const b = checkPaletteContrast(palette("#1F1F1F", "#C9A96E"), "dark").find((c) => c.id === "C-3");
    expect(b).toMatchObject({ foreground: "#C9A96E", background: "#1F1F1F", pass: true });
    const a = checkPaletteContrast(palette("#8B5E3C"), "dark").find((c) => c.id === "C-3");
    expect(a).toMatchObject({ pass: false });
    expect(a!.ratio).toBeCloseTo(2.5, 1);
  });
});

describe("derivePalette (SPEC 8.3)", () => {
  const base = palette("#8B5E3C");

  it("대표색만 바꾸고 나머지 역할은 팔레트 행에서 가져온다 (대문자 정규화)", () => {
    expect(derivePalette("#c9a96e", base)).toEqual([{ role: "primary", hex: "#C9A96E" }, ...base.slice(1)]);
  });

  it("사용자 대표색이 없으면 팔레트 행 그대로", () => {
    expect(derivePalette(undefined, base)).toEqual(base);
  });

  it("역할 5개(primary·surface·ink·muted·bg)를 항상 이 순서로 돌려준다", () => {
    expect(derivePalette("#123456", [...base].reverse()).map((p) => p.role)).toEqual(["primary", "surface", "ink", "muted", "bg"]);
  });

  it("입력을 변경하지 않는다", () => {
    const input = palette("#8B5E3C");
    derivePalette("#000000", input);
    expect(input[0]!.hex).toBe("#8B5E3C");
  });
});
