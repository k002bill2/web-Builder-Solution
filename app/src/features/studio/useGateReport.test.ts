import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProfileSeries } from "../../domain/profile";
import { passingDoc } from "../../engine/testing/gateKit";
import { sampleTheme } from "../../engine/testing/sampleTheme";
import { useGateReport } from "./useGateReport";

// M2A-3a-fix F1: 계산이 던지면 처리되지 않은 거부를 남기지 않고 실패를 상태로 받는다
vi.mock("./gateCheck", () => ({
  runGate: () => {
    throw new TypeError("계산 실패");
  },
}));

const SERIES = { profileId: "profile-1", latestVersion: 2, versions: [sampleTheme().profile] } as unknown as ProfileSeries;

describe("useGateReport — 계산 실패 (F1)", () => {
  it("runGate가 던지면 report 없음 · failed true · recheck는 undefined로 끝난다(거부 0)", async () => {
    const doc = { ...passingDoc(), profileVersion: 2 };
    const { result } = renderHook(() => useGateReport(doc, SERIES));
    await waitFor(() => expect(result.current.failed).toBe(true));
    expect(result.current.report).toBeUndefined();
    let again: unknown = "안 끝남";
    await act(async () => void (again = await result.current.recheck()));
    expect(again).toBeUndefined();
    expect(result.current.failed).toBe(true);
  });
});
