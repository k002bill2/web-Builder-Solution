import { describe, expect, it } from "vitest";
import { relativeTimeText, saveAnnouncement, saveStatusText } from "./saveStatusText";
import type { AutosaveState } from "./useAutosaveScheduler";

const NOW = 1_000_000;

describe("relativeTimeText — 상대 시각 규칙", () => {
  it("5초 미만은 '방금', 60초 미만은 초, 60분 미만은 분, 그 밖은 시간", () => {
    expect(relativeTimeText(0)).toBe("방금");
    expect(relativeTimeText(4_999)).toBe("방금");
    expect(relativeTimeText(5_000)).toBe("5초 전");
    expect(relativeTimeText(12_400)).toBe("12초 전");
    expect(relativeTimeText(59_999)).toBe("59초 전");
    expect(relativeTimeText(60_000)).toBe("1분 전");
    expect(relativeTimeText(59 * 60_000 + 59_999)).toBe("59분 전");
    expect(relativeTimeText(60 * 60_000)).toBe("1시간 전");
    expect(relativeTimeText(-3_000)).toBe("방금");
  });
});

describe("saveStatusText (E-S06~E-S09)", () => {
  it("단계별 문구", () => {
    expect(saveStatusText({ phase: "idle" }, "memory", NOW)).toBe("");
    expect(saveStatusText({ phase: "dirty" }, "memory", NOW)).toBe("저장 전 변경 있음");
    expect(saveStatusText({ phase: "saving" }, "server", NOW)).toBe("저장 중…");
    expect(saveStatusText({ phase: "failed", failure: "error" }, "memory", NOW)).toBe("저장하지 못했습니다");
    expect(saveStatusText({ phase: "offline", failure: "offline" }, "server", NOW)).toBe("오프라인 — 연결되면 저장합니다");
    expect(saveStatusText({ phase: "stale" }, "server", NOW)).toBe("다른 곳에서 이 문서가 바뀌었습니다");
  });

  it("저장됨 — 메모리는 '이 탭에 저장됨', 서버는 '저장됨' + 상대 시각", () => {
    const saved: AutosaveState = { phase: "saved", lastSavedAt: NOW - 12_000 };
    expect(saveStatusText(saved, "memory", NOW)).toBe("이 탭에 저장됨 · 12초 전");
    expect(saveStatusText(saved, "server", NOW)).toBe("저장됨 · 12초 전");
  });

  it("saved인데 lastSavedAt이 없으면 시각 없이 표시", () => {
    expect(saveStatusText({ phase: "saved" }, "memory", NOW)).toBe("이 탭에 저장됨");
  });
});

describe("saveAnnouncement — 단계가 바뀔 때만 (5.10 · 6.3)", () => {
  it("평상시 dirty → saving → saved 는 알리지 않는다", () => {
    expect(saveAnnouncement({ phase: "idle" }, { phase: "dirty" })).toBeUndefined();
    expect(saveAnnouncement({ phase: "dirty" }, { phase: "saving" })).toBeUndefined();
    expect(saveAnnouncement({ phase: "saving" }, { phase: "saved", lastSavedAt: NOW })).toBeUndefined();
    expect(saveAnnouncement({ phase: "saved", lastSavedAt: 1 }, { phase: "saved", lastSavedAt: 2 })).toBeUndefined();
  });

  it("실패가 시작될 때 alert 1회, 연속 실패(saving 경유)는 다시 알리지 않는다", () => {
    expect(saveAnnouncement({ phase: "saving" }, { phase: "failed", failure: "error" })).toEqual({
      kind: "alert",
      text: "저장하지 못했습니다",
    });
    expect(
      saveAnnouncement({ phase: "saving", failure: "error" }, { phase: "failed", failure: "error" }),
    ).toBeUndefined();
  });

  it("실패에서 회복하면 status '다시 저장했습니다'", () => {
    expect(
      saveAnnouncement({ phase: "saving", failure: "error" }, { phase: "saved", lastSavedAt: NOW, recovered: true }),
    ).toEqual({ kind: "status", text: "다시 저장했습니다" });
  });

  it("오프라인 진입은 status 1회, 이어지는 오프라인은 다시 알리지 않는다", () => {
    expect(saveAnnouncement({ phase: "dirty" }, { phase: "offline", failure: "offline" })).toEqual({
      kind: "status",
      text: "오프라인 — 연결되면 저장합니다",
    });
    expect(
      saveAnnouncement({ phase: "saving", failure: "offline" }, { phase: "offline", failure: "offline" }),
    ).toBeUndefined();
  });

  it("STALE_DOC 진입은 alert 1회", () => {
    expect(saveAnnouncement({ phase: "saving" }, { phase: "stale" })).toEqual({
      kind: "alert",
      text: "다른 곳에서 이 문서가 바뀌었습니다. 내 편집은 그대로 두었습니다",
    });
    expect(saveAnnouncement({ phase: "stale" }, { phase: "stale" })).toBeUndefined();
  });
});
