/** P1C-SPEC 1.3 사용량 표기 · AC-C07 — 1MB = 1024² 바이트 · toFixed(1) · "약" · 80% 문장 */
import { describe, expect, it } from "vitest";
import { QUOTA_HIGH_TEXT, usageText } from "./storageUsage";

const MB = 1024 ** 2;

describe("usageText (AC-C07)", () => {
  it("0.1MB 미만 경계: 0·104857 → 미만, 104858 → 약 0.1MB", () => {
    expect(usageText({ usage: 0 })).toBe("사용량 0.1MB 미만");
    expect(usageText({ usage: 104857 })).toBe("사용량 0.1MB 미만");
    expect(usageText({ usage: 104858 })).toBe("사용량 약 0.1MB");
  });

  it("소수 첫째 자리 반올림: 12.34MB → 약 12.3MB", () => {
    expect(usageText({ usage: 12.34 * MB })).toBe("사용량 약 12.3MB");
  });

  it("1024MB 경계도 GB로 바꾸지 않는다", () => {
    expect(usageText({ usage: 1023.96 * MB })).toBe("사용량 약 1024.0MB");
    expect(usageText({ usage: 1024 * MB })).toBe("사용량 약 1024.0MB");
  });

  it("usage/quota = 0.8 → 80% 문장, 0.79 → 없음", () => {
    expect(usageText({ usage: 80 * MB, quota: 100 * MB })).toBe(`사용량 약 80.0MB${QUOTA_HIGH_TEXT}`);
    expect(usageText({ usage: 79 * MB, quota: 100 * MB })).toBe("사용량 약 79.0MB");
    expect(QUOTA_HIGH_TEXT).toBe(" · 브라우저가 허용한 공간의 80% 이상");
  });

  it("quota가 0·없음이면 80% 판정을 하지 않는다", () => {
    expect(usageText({ usage: 5 * MB, quota: 0 })).toBe("사용량 약 5.0MB");
    expect(usageText({ usage: 5 * MB })).toBe("사용량 약 5.0MB");
  });

  it("usage를 모르면 줄 숨김(undefined)", () => {
    expect(usageText({})).toBeUndefined();
    expect(usageText(undefined)).toBeUndefined();
  });
});
