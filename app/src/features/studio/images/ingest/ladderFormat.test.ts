import { describe, expect, it, vi } from "vitest";
import { chooseFormat, probeWebp } from "./format";
import { variantHeight, widthLadder } from "./ladder";

describe("폭 사다리 640·1280·1920 + 원본 폭 단 (IMG-AC-04)", () => {
  it.each([
    [3000, [640, 1280, 1920]],
    [1500, [640, 1280, 1500]],
    [500, [500]],
    [1920, [640, 1280, 1920]],
    [1280, [640, 1280]],
    [640, [640]],
    [1, [1]],
  ])("원본 폭 %i → %j (업스케일 0)", (width, expected) => {
    const ladder = widthLadder(width);
    expect(ladder).toEqual(expected);
    expect(Math.max(...ladder)).toBeLessThanOrEqual(width);
  });

  it("파생본 높이 = 비율 반올림", () => {
    expect(variantHeight(3000, 2000, 640)).toBe(427);
  });

  it("아주 납작한 원본도 높이 ≥ 1", () => {
    expect(variantHeight(16_384, 1, 640)).toBe(1);
  });
});

describe("포맷 결정 (IMG-AC-05)", () => {
  it.each([
    [false, true, { format: "webp", type: "image/webp", quality: 0.82 }],
    [true, true, { format: "webp", type: "image/webp", quality: 0.82 }],
    [false, false, { format: "jpeg", type: "image/jpeg", quality: 0.85 }],
    [true, false, { format: "png", type: "image/png" }],
  ])("투명 %s · WebP 인코딩 %s → %j", (alpha, webp, expected) => {
    expect(chooseFormat(alpha, webp)).toEqual(expected);
  });
});

describe("WebP 인코딩 감지 — blob.type으로 판정 · 인코더마다 1회", () => {
  it("결과 type이 image/webp면 지원", async () => {
    await expect(probeWebp({}, () => Promise.resolve(new Blob([], { type: "image/webp" })))).resolves.toBe(true);
  });

  it("image/png로 조용히 떨어지면 미지원", async () => {
    await expect(probeWebp({}, () => Promise.resolve(new Blob([], { type: "image/png" })))).resolves.toBe(false);
  });

  it("같은 키는 1번만 재고 기억한다 · 다른 키는 따로 잰다", async () => {
    const key = {};
    const run = vi.fn(() => Promise.resolve(new Blob([], { type: "image/webp" })));
    await probeWebp(key, run);
    await probeWebp(key, run);
    expect(run).toHaveBeenCalledTimes(1);
    await probeWebp({}, run);
    expect(run).toHaveBeenCalledTimes(2);
  });
});
