/**
 * liveness 시간 값(INTEGRATE-6 3절 LV-1·LV-2 · MQ-6-3b) — LV-1 2개는 여기, LV-2 1개는 `coreIo.ts`(청크 경계 · 아래 주석). 시간 제한은 표시 전환·포기 판정에만 쓴다 — 취소 0 · 자동 재시도 0.
 * 잠정 — QA 실측 뒤 Jarvis 결정(MQ-6-3b). 근거는 `dev/active/rs6-l2-liveness/REPORT.md` 시간 값 절.
 */
import type { AutosaveState } from "../useAutosaveScheduler";

/** 저장 시작 뒤 이 시간 안에 끝나지 않으면 `saving` + `slow` 표지(LV-1) */
export const SAVE_SLOW_MS = 2000;
/** 저장 시작 뒤 이 시간 안에 끝나지 않으면 alert 1회 표지 `hang`(LV-1 · 문구 본문은 L4) */
export const SAVE_HANG_MS = 10_000;
/* LV-2 포기 시간 `DISCARD_GIVE_UP_MS`는 `coreIo.ts`(조작 뒤 청크)에 둔다 — 이 모듈은 편집기 진입(스케줄러 감시)이 import한다. io가 여기서 값을 받으면
 * 진입·DocBook 청크 공유 모듈이라 별도 청크가 생긴다(RS6-L3a 실측 정규화 +0.26KB). */

/**
 * LV-1 저장 감시 — 스케줄러 `onChange`를 감싼다(스케줄러 본문 변경 0 · 진입 증분은 붙이는 레인이 진다). 스케줄러는 저장 1회마다
 * `saving`을 1번만 알리므로(단일 비행) 그 알림이 저장 시작 시각이다. `SAVE_SLOW_MS` 뒤 `slow`, `SAVE_HANG_MS` 뒤 `hang`(차례 번호)을 붙여 다시 알린다.
 * 표시 전환만이다 — 저장 제출·편집 수용·phase(`saving`)는 스케줄러 그대로. 다음 알림(끝남)이 오거나 `stop()`(dispose)이면 타이머를 풀어 끝난 상태 위에 덮지 않는다.
 */
export function watchSaving(onChange: (state: AutosaveState) => void) {
  let timers: ReturnType<typeof setTimeout>[] = [];
  let turn = 0;
  const stop = () => {
    for (const timer of timers) clearTimeout(timer);
    timers = [];
  };
  return {
    /** 스케줄러 `onChange` 자리 */
    onChange(state: AutosaveState) {
      stop();
      onChange(state);
      if (state.phase !== "saving") return;
      const hang = (turn += 1);
      timers = [setTimeout(() => onChange({ ...state, slow: true }), SAVE_SLOW_MS), setTimeout(() => onChange({ ...state, slow: true, hang }), SAVE_HANG_MS)];
    },
    /** 스케줄러 dispose와 함께 — 남은 감시 발화 0 */
    stop,
  };
}
