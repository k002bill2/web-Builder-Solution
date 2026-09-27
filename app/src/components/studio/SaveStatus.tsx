import { useEffect, useReducer, useRef } from "react";
import type { ProjectPersistence } from "../../data/projectRepository";
import { SAVE_FAILED_TEXT, SAVE_STALE_ALERT, saveAnnouncement, saveStatusText } from "../../features/studio/saveStatusText";
import type { AutosaveState } from "../../features/studio/useAutosaveScheduler";
import { Button } from "../ds/Button";

/** 상대 시각 갱신 주기 — 표시 단위가 초라서 1초 */
const TICK_MS = 1000;

/** 저장 실패 alert 문장(SPEC 6.3) — 실패가 풀릴 때까지 같은 글자라 연속 실패에 다시 낭독되지 않는다 */
function alertText(state: AutosaveState): string {
  if (state.phase === "stale") return SAVE_STALE_ALERT;
  return state.failure === "error" ? SAVE_FAILED_TEXT : "";
}

/**
 * 저장 상태 (SPEC E-S06~E-S09 · 6.3 · E-AC-08·09). 상태 글자는 라이브 영역 **밖**(상대 시각 낭독 금지).
 * - 실패·STALE = 자체 `role=alert` 1곳(6.3 "저장 실패" 행). 오프라인·회복 status 문장은 `onAnnounce`로 올린다 —
 *   `role=status` "편집 알림" 영역은 화면에 1개(E-AC-33, 셸 소유)라 여기서 만들지 않는다. 평상시 저장은 알리지 않는다.
 * - "다시 저장"은 실패 때만(E-S07). 오프라인은 `online` 이벤트가 저장한다(E-S08). 상태 글자는 자르지 않는다(E-S33 — 말줄임은 툴바 이름만).
 */
export function SaveStatus({
  state,
  persistence,
  onRetry,
  onAnnounce,
  now = Date.now,
}: {
  readonly state: AutosaveState;
  readonly persistence: ProjectPersistence;
  readonly onRetry: () => void;
  readonly onAnnounce?: (text: string) => void;
  readonly now?: () => number;
}) {
  const [, tick] = useReducer((n: number) => n + 1, 0);
  const ticking = state.phase === "saved" && state.lastSavedAt !== undefined;
  useEffect(() => {
    if (!ticking) return undefined;
    const timer = setInterval(tick, TICK_MS);
    return () => clearInterval(timer);
  }, [ticking]);

  const prevRef = useRef(state);
  const announceRef = useRef(onAnnounce);
  useEffect(() => {
    announceRef.current = onAnnounce;
  }, [onAnnounce]);
  useEffect(() => {
    const announcement = saveAnnouncement(prevRef.current, state);
    prevRef.current = state;
    if (announcement?.kind === "status") announceRef.current?.(announcement.text);
  }, [state]);

  return (
    <div className="flex min-w-0 items-center gap-2">
      <p className="text-caption1 text-label-alternative">{saveStatusText(state, persistence, now())}</p>
      {state.phase === "failed" && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          다시 저장
        </Button>
      )}
      <p role="alert" className="sr-only">
        {alertText(state)}
      </p>
    </div>
  );
}
