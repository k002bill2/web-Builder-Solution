import { lazy, Suspense, type ComponentProps, useEffect, useReducer, useRef, useState } from "react";
import type { ProjectPersistence } from "../../data/projectRepository";
import { isSaving, SAVE_FAILED_TEXT, SAVE_HANG_TEXT, SAVE_STALE_ALERT, saveAnnouncement, saveStatusText, type SaveSource } from "../../features/studio/saveStatusText";
import { SAVE_HANG_ALERT } from "../../features/studio/save/alertKeys";
import type { AutosaveState } from "../../features/studio/useAutosaveScheduler";
import { Button } from "../ds/Button";

/** 환경 reason 버튼·폐기 확인 = reason이 있을 때만 받는다(조작 뒤 · RS6-L4 M2a) */
const SaveActions = lazy(() => import("./SaveActions"));
const ENV: ReadonlySet<string> = new Set(["readonly", "stale", "cleared"]);

/** 상대 시각 갱신 주기 — 표시 단위가 초라서 1초 */
const TICK_MS = 1000;

/** 저장 실패 alert 문장(SPEC 6.3) — 실패가 풀릴 때까지 같은 글자라 연속 실패에 다시 낭독되지 않는다 */
function alertText(state: AutosaveState, source: SaveSource, hang: boolean): string {
  if (state.phase === "stale") return SAVE_STALE_ALERT;
  // LV-1 T_hang 문구 = alert `<p>`에만(aria-busy 상태 글자에 넣지 않는다 — L2 QA 7절 3)
  if (hang) return SAVE_HANG_TEXT;
  return state.failure === "error" ? (source.text ?? SAVE_FAILED_TEXT) : "";
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
  source = {},
  onRetry,
  actions,
  onAnnounce,
  now = Date.now,
}: {
  readonly state: AutosaveState;
  readonly persistence: ProjectPersistence;
  /** 판정 출처(I6 8.1) — `useDocSave().source` */
  readonly source?: SaveSource;
  readonly onRetry: () => void;
  /** "저장 확인"(I6 8.2 `confirm`) · "버리고 새로고침"(`discard` + reload) 재료 — 없으면 환경 reason 버튼 0 */
  readonly actions?: Pick<ComponentProps<typeof SaveActions>, "core" | "report">;
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

  // LV-1 T_hang alert 1회 — 마운트 때 이미 같은 정지(차례)였으면 다시 알리지 않는다(레이아웃 재마운트 · UX5-AC-01). 문구 본문은 L4(키만)
  const [mountedHang] = useState(state.hang);
  const hang = state.hang !== undefined && state.hang !== mountedHang;

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

  const busy = isSaving(state, source);
  return (
    <div className="flex min-w-0 items-center gap-2">
      <p className="text-caption1 text-label-alternative" aria-busy={busy || undefined}>
        {saveStatusText(state, persistence, now(), source)}
      </p>
      {/* 버튼 1개 규칙(UX-5 2.2) — 환경 reason(readonly·stale·cleared) = 조작 뒤 SaveActions · 그 밖 실패 = "다시 저장" */}
      {source.reason && ENV.has(source.reason) ? (
        actions && (
          <Suspense fallback={null}>
            <SaveActions reason={source.reason} dirty={source.dirty} persistence={persistence} {...actions} />
          </Suspense>
        )
      ) : (
        state.phase === "failed" && (
          <Button variant="outline" size="sm" aria-busy={busy || undefined} aria-disabled={busy || undefined} onClick={() => !busy && onRetry()}>
            다시 저장
          </Button>
        )
      )}
      <p role="alert" className="sr-only" data-alert-key={hang ? SAVE_HANG_ALERT : undefined}>
        {alertText(state, source, hang)}
      </p>
    </div>
  );
}
