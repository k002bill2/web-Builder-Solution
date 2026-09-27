import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileAdjustments, ProfileSeries, ProfileVersion } from "../../domain/profile";
import { docMotionPreset, docPurpose } from "./docPurpose";

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
