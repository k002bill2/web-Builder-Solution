import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileAdjustments, ProfileSeries, ProfileVersion } from "../../domain/profile";
import { docMotionPreset, docPalette, docPurpose } from "./docPurpose";

const BASE = { motion_preset: "L2" } as DesignProfileInput;
const version = (n: number, adjustments: ProfileAdjustments): ProfileVersion => ({
  profileId: "profile-1",
  version: n,
  origin: "adjust",
  baseReferenceId: "ref-1",
  base: BASE,
  adjustments,
  createdAt: "2026-09-27T00:00:00.000Z",
});
const series = (...versions: ProfileVersion[]): ProfileSeries => ({ profileId: "profile-1", versions, latestVersion: versions.at(-1)!.version });

describe("docPurpose (K1 · A3-Q2 A)", () => {
  it("문서 버전의 목적을 읽는다 — 최신 버전(v3 문의)이 아니라 문서 v2(예약)", () => {
    const s = series(version(1, {}), version(2, { purpose: "booking" }), version(3, { purpose: "inquiry" }));
    expect(docPurpose(s, 2)).toBe("booking");
    expect(docPurpose(s, 3)).toBe("inquiry");
  });

  it("목적 조정 없음 · 버전 없음 · 프로필 없음 → 'none'", () => {
    const s = series(version(1, {}), version(2, { purpose: "sales" }));
    expect(docPurpose(s, 1)).toBe("none");
    expect(docPurpose(s, 9)).toBe("none");
    expect(docPurpose(undefined, 1)).toBe("none");
  });
});

describe("docMotionPreset (5.3 새 섹션 모션)", () => {
  it("문서 버전의 조정 motion → 없으면 base.motion_preset → 버전이 없으면 L1", () => {
    const s = series(version(1, {}), version(2, { motion: "L0" }));
    expect(docMotionPreset(s, 2)).toBe("L0");
    expect(docMotionPreset(s, 1)).toBe("L2");
    expect(docMotionPreset(s, 7)).toBe("L1");
    expect(docMotionPreset(undefined, 1)).toBe("L1");
  });
});

describe("docPalette (A3-Q7 — 캔버스 색 = 문서 프로필 버전 팔레트)", () => {
  const tokens = (primary: string) =>
    ({ primary: { $type: "color", $value: primary }, surface: { $type: "color", $value: "#f5f5f5" }, ink: { $type: "color", $value: "#222222" }, muted: { $type: "color", $value: "#888888" }, bg: { $type: "color", $value: "#ffffff" }, $extensions: { seed: "1" } }) as DesignProfileInput["color_tokens"];
  const withTokens = (n: number, primary: string, adjustments: ProfileAdjustments = {}): ProfileVersion => ({ ...version(n, adjustments), base: { ...BASE, color_tokens: tokens(primary) } });

  it("문서 버전의 역할 5개 · 보정(corrections) 적용 값 · 최신 버전이 아니다", () => {
    const fix = { role: "primary", from: "#aa0000", to: "#880000", check: "primary-on-bg" } as never;
    const s = series(withTokens(1, "#aa0000", { corrections: [fix] }), withTokens(2, "#0000aa"));
    expect(docPalette(s, 1)).toEqual({ primary: "#880000", surface: "#f5f5f5", ink: "#222222", muted: "#888888", bg: "#ffffff" });
    expect(docPalette(s, 2)?.primary).toBe("#0000aa");
  });

  it("버전·프로필 없음 → undefined(중립 토큰으로 그린다)", () => {
    expect(docPalette(series(withTokens(1, "#aa0000")), 5)).toBeUndefined();
    expect(docPalette(undefined, 1)).toBeUndefined();
  });
});
