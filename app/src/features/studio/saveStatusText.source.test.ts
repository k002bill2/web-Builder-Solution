/**
 * RS6-L4 CP1 — 상태 판정 출처(INTEGRATE-6 8.1) 출처별 1행. 입력 = 스케줄러 단계 + persistence + 코어 `view()`(inflight·dirty) + 마지막 저장 결과 reason(포트 `mode()`·결과).
 * 문구 원문 = UX-5 2.3(★ = 기존 문구 재사용).
 */
import { describe, expect, it } from "vitest";
import { DISCARD_TIMEOUT_TEXT, SAVE_HANG_TEXT, SAVE_SLOW_TAIL, saveAnnouncement, saveStatusText } from "./saveStatusText";
import { reasonText } from "./save/reasonText";

const NOW = 1_000_000;

describe("RS6-L4 CP1 · 상태 판정 출처 (I6 8.1)", () => {
  it.each([
    // [I6 8.1 행, 단계, persistence, 출처, 기대 문구]
    ["memory-only = persistence memory(not-persistent 저장 = 메모리 커밋)", "saved", "memory", {}, "이 탭에 저장됨"],
    ["unsupported = 결과 reason unsupported(포트 mode)", "failed", "local", { reason: "unsupported" }, "이 브라우저는 저장소를 쓸 수 없어 이 탭에만 저장합니다"],
    ["readonly = 결과 reason readonly(포트 mode)", "failed", "local", { reason: "readonly" }, "다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다"],
    ["cleared = 결과 reason cleared(포트 mode)", "failed", "local", { reason: "cleared" }, "이 브라우저 데이터가 지워졌습니다 — 새로고침하세요"],
    ["image-missing = 결과 reason image-missing", "failed", "local", { reason: "image-missing" }, "이미지를 저장하지 못했습니다"],
    ["dirty = view().dirty && !inflight (스케줄러 단계가 아직 idle이어도)", "idle", "local", { dirty: true, inflight: 0 }, "저장 전 변경 있음"],
    ["saving = view().inflight (POP 재진입 — 해제 save 진행 중, 스케줄러 idle)", "idle", "local", { dirty: true, inflight: 1 }, "저장 중…"],
    ["failed(그 밖 사유 not-committed) = ★저장하지 못했습니다", "failed", "local", { reason: "not-committed" }, "저장하지 못했습니다"],
    ["영구 확인 = local saved", "saved", "local", { inflight: 0 }, "이 브라우저에 저장됨"],
    ["offline = 스케줄러 offline(navigator.onLine)", "offline", "local", { inflight: 0 }, "오프라인 — 연결되면 저장합니다"],
    // 다른 탭 stale(포트 mode·다른 탭 커밋) = I6 8.1 `stale` 환경 행(failed + 새로고침 안내) — 충돌 영역으로 보내지 않는다(RS6-L4 R2 Jarvis 결정 ①)
    ["stale = 결과 reason stale(포트 mode — 다른 탭 커밋)", "failed", "local", { reason: "stale" }, "다른 탭에서 바뀐 내용이 있습니다 — 새로고침한 뒤 편집하세요"],
  ] as const)("%s", (_, phase, persistence, source, text) => {
    // reason 문구 = 조작 뒤 청크(`save/reasonText.ts`) — 훅이 실패 결과와 함께 source.text로 싣는다
    const withText = "reason" in source ? { ...source, text: reasonText(source.reason) } : source;
    expect(saveStatusText({ phase }, persistence, NOW, withText)).toBe(text);
  });

  it("saving-slow(LV-1) = saving 문구 뒤 꼬리 · 꼬리 없는 saving과 구별", () => {
    expect(saveStatusText({ phase: "saving", slow: true }, "local", NOW, { inflight: 1 })).toBe(`저장 중…${SAVE_SLOW_TAIL}`);
    expect(SAVE_SLOW_TAIL).toBe(" · 브라우저 응답이 늦습니다");
  });

  it("환경 reason이 단계 재시도(saving)보다 이긴다(UX-5 2.2 readonly > saving) · 저장 성공 뒤 reason이 지워지면 보통 문구", () => {
    expect(saveStatusText({ phase: "saving" }, "local", NOW, { reason: "readonly", text: reasonText("readonly"), inflight: 1 })).toBe("다른 탭에서 편집 중이라 이 탭은 저장하지 않습니다");
    expect(saveStatusText({ phase: "saving" }, "local", NOW, { inflight: 1 })).toBe("저장 중…");
  });

  it("memory 모드 어떤 출처에서도 '브라우저에 저장됨' 0 (UX5-AC-09 · U9)", () => {
    for (const source of [{}, { inflight: 0 }, { reason: "not-persistent" }])
      expect(saveStatusText({ phase: "saved", lastSavedAt: NOW }, "memory", NOW, source)).not.toContain("브라우저에 저장됨");
  });
});

describe("RS6-L4 CP4 · LV-1 slow 진입 알림(I6 3절·8.4)", () => {
  it("saving → saving-slow 진입 = status 1회(꼬리 문구) · 이미 slow면 다시 알리지 않음", () => {
    expect(saveAnnouncement({ phase: "saving" }, { phase: "saving", slow: true })).toEqual({ kind: "status", text: `저장 중…${SAVE_SLOW_TAIL}` });
    expect(saveAnnouncement({ phase: "saving", slow: true }, { phase: "saving", slow: true })).toBeUndefined();
  });

  it("문구 원문(UX-5 · I6 3절) — discard 시간 초과 · hang", () => {
    expect(DISCARD_TIMEOUT_TEXT).toBe("버리지 못했습니다 — 변경은 그대로 있습니다");
    expect(SAVE_HANG_TEXT).toBe("브라우저가 저장에 응답하지 않습니다 — 이 탭을 닫으면 확인되지 않은 변경이 사라질 수 있습니다");
  });
});
