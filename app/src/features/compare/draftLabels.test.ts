import { describe, expect, it } from "vitest";
import { confirmLabel, statusLabel } from "./draftLabels";

describe("확정 버튼 문구 — 버전 계보 (DS-2A-04 6.1-1 · P-AC-11)", () => {
  it("latestVersion이 없으면 지금처럼 확정 버전 + 1", () => {
    expect(confirmLabel({ kind: "confirmed", version: 1 }, false)).toBe("새 버전으로 확정 (v2)");
    expect(confirmLabel({ kind: "changed", version: 1, nextVersion: 2 }, false)).toBe("새 버전으로 확정 (v2)");
  });

  it("계열 최신이 v2면 바뀐 게 없는 확정됨 상태도 (v3) — 비활성 버튼 라벨이 어긋나지 않는다", () => {
    expect(confirmLabel({ kind: "confirmed", version: 1, nextVersion: 3 }, false)).toBe("새 버전으로 확정 (v3)");
    expect(statusLabel({ kind: "confirmed", version: 1, nextVersion: 3 })).toBe("v1 확정됨");
  });
});
