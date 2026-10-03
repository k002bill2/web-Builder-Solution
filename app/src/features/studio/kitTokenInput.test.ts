import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileAdjustments, ProfileSeries, ProfileVersion } from "../../domain/profile";
import { docKitTokens } from "./docPurpose";

const color = (v: string) => ({ $type: "color" as const, $value: v });
const BASE = {
  color_tokens: { primary: color("rgb(1 1 1)"), surface: color("rgb(2 2 2)"), ink: color("rgb(3 3 3)"), muted: color("rgb(4 4 4)"), bg: color("rgb(5 5 5)") },
  typography_tokens: { family: "Noto Serif KR", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
  spacing_tokens: { grid: "8pt", sectionGap: 96 },
  motion_preset: "L1",
  component_choices: { card_style: { style: "bordered-lg", surfaceTone: "dark" }, media_ratio: "16:9" },
} as unknown as DesignProfileInput;
const version = (n: number, adjustments: ProfileAdjustments, base: DesignProfileInput = BASE): ProfileVersion => ({
  profileId: "p",
  version: n,
  origin: "adjust",
  baseReferenceId: "ref-a",
  base,
  adjustments,
  createdAt: "2026-10-03T00:00:00.000Z",
});
const series = (...versions: ProfileVersion[]): ProfileSeries => ({ profileId: "p", versions, latestVersion: versions.at(-1)!.version });

describe("docKitTokens — 킷 토큰 입력 (M2A-2a K1 · m2a 0.2 · MQ-1)", () => {
  it("문서 버전의 값 + 조정에서 팔레트 5역할 · 카드 · 글꼴 · 간격 · 이미지 비율을 모은다", () => {
    const s = series(version(1, {}), version(2, { density: "compact", corrections: [{ role: "ink", from: "rgb(3 3 3)", to: "rgb(9 9 9)", check: "C-2" }] }));
    expect(docKitTokens(s, 1)).toEqual({
      palette: { primary: "rgb(1 1 1)", surface: "rgb(2 2 2)", ink: "rgb(3 3 3)", muted: "rgb(4 4 4)", bg: "rgb(5 5 5)" },
      card: { tone: "dark", style: "bordered-lg" },
      type: { family: "Noto Serif KR", headingWeight: 700, bodyWeight: 400, scale: 1.25 },
      space: { grid: 8, sectionGap: 96, density: "comfortable" },
      mediaRatio: "16:9",
    });
    // v2: 보정이 팔레트에 · 촘촘 = base sectionGap + density(환산 96 → 72는 렌더 문서 생성기 — kit/tokens.test · src/test/kitTokens.test)
    const v2 = docKitTokens(s, 2)!;
    expect(v2.palette.ink).toBe("rgb(9 9 9)");
    expect(v2.space).toEqual({ grid: 8, sectionGap: 96, density: "compact" });
  });

  it("선택 값이 없으면 기본(카드 light·bordered-md · 비율 4:5 · grid 8) — 모르는 값도 기본", () => {
    const bare = { ...BASE, spacing_tokens: { grid: "?", sectionGap: 64 }, component_choices: { card_style: { style: "glass", surfaceTone: "light" }, media_ratio: "3:2" } } as unknown as DesignProfileInput;
    const t = docKitTokens(series(version(1, {}, bare)), 1)!;
    expect(t.card).toEqual({ tone: "light", style: "bordered-md" });
    expect(t.mediaRatio).toBe("4:5");
    expect(t.space.grid).toBe(8);
    const none = { ...BASE, component_choices: {} } as unknown as DesignProfileInput;
    expect(docKitTokens(series(version(1, {}, none)), 1)!.card).toEqual({ tone: "light", style: "bordered-md" });
  });

  it("버전 없음 · 프로필 없음 · 팔레트·글꼴 없는 부분 레코드 → undefined (킷은 그리지 않는다)", () => {
    expect(docKitTokens(undefined, 1)).toBeUndefined();
    expect(docKitTokens(series(version(1, {})), 9)).toBeUndefined();
    const noType = { ...BASE, typography_tokens: undefined } as unknown as DesignProfileInput;
    expect(docKitTokens(series(version(1, {}, noType)), 1)).toBeUndefined();
    const noColor = { ...BASE, color_tokens: {} } as unknown as DesignProfileInput;
    expect(docKitTokens(series(version(1, {}, noColor)), 1)).toBeUndefined();
  });
});
