import { screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { DesignProfileInput } from "../../domain/compareBoard";
import type { ProfileSeries } from "../../domain/profile";
import { sampleDoc } from "../../engine/testing/sampleDoc";
import { openStudio, restoreViewport } from "../../features/studio/testing/openStudio";

/** V2 — 편집 틀이 문서 프로필 버전 팔레트를 캔버스로 넘긴다(목적 파생과 같은 조회 1회 · A3-Q7) */
afterEach(restoreViewport);

const color = (value: string) => ({ $type: "color", $value: value }) as const;
const seriesOf = (primary: string): ProfileSeries => ({
  profileId: "profile-1",
  latestVersion: 1,
  versions: [
    {
      profileId: "profile-1",
      version: 1,
      origin: "board",
      baseReferenceId: "ref-1",
      base: { motion_preset: "L1", color_tokens: { primary: color(primary), surface: color("rgb(244, 244, 244)"), ink: color("rgb(26, 26, 26)"), muted: color("rgb(138, 138, 138)"), bg: color("rgb(255, 255, 255)") } } as unknown as DesignProfileInput,
      adjustments: {},
      createdAt: "2026-09-27T00:00:00.000Z",
    },
  ],
});

describe("캔버스 팔레트 연결 (SPEC 5.7 · r4.7 A3-Q7)", () => {
  it("문서 profileVersion의 팔레트 → --canvas-* 변수", async () => {
    const { frame } = await openStudio({ doc: sampleDoc({ profileVersion: 1 }), series: seriesOf("rgb(10, 92, 54)") });
    // 팔레트 → --canvas-* 변수는 렌더 문서(render/fallback/FallbackCanvas.test.tsx). 부모는 문서 버전 팔레트를 render로 보낸다
    await waitFor(() => expect(frame.lastPalette()?.primary).toBe("rgb(10, 92, 54)"));
    expect(frame.lastPalette()?.bg).toBe("rgb(255, 255, 255)");
  });

  it("프로필 없음(조회 결과 없음) → 중립 토큰으로 그리고 편집은 계속", async () => {
    const { frame } = await openStudio({ series: undefined });
    // 팔레트 없음 → 렌더 문서가 중립 토큰(FallbackCanvas.test "팔레트 없으면 중립 토큰 참조")
    expect(frame.lastPalette()).toBeUndefined();
    expect(screen.getByRole("region", { name: /^편집 · / })).toBeInTheDocument();
  });
});
