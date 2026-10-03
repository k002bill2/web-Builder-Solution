import { useCallback, useEffect, useState } from "react";
import type { ExportFormat, ProjectRepository } from "../../data/projectRepository";
import type { GateReport } from "../../engine/contracts/records";
import type { ExportResult } from "./exportFlow";
import { gateCounts } from "./gateView";
import type { GateState } from "./useGateReport";
import type { UseDocSave } from "./useDocSave";

const loadFlow = () => import("./exportFlow");

/**
 * 내보내기 시작 (DS-2A-05 5.13 시작 문장 · E-S24 · E-AC-28·29·30) — 결과가 오래됐으면 먼저 다시 계산 → 차단이면 멈춤 → 경고만이면 확인 대화상자 →
 * 저장 전 변경이 있으면 저장 먼저(실패·충돌·오프라인이면 요청 0 — E-S07·E-S09 표시는 저장 흐름이 한다) → `requestExport` 1회(조작 뒤 청크).
 */
export function useExportFlow({ repository, projectId, save, gate }: { readonly repository: ProjectRepository; readonly projectId: string; readonly save: UseDocSave; readonly gate: GateState }) {
  const [running, setRunning] = useState<ExportFormat>();
  const [waitingSave, setWaitingSave] = useState<ExportFormat>();
  const [confirming, setConfirming] = useState<{ readonly format: ExportFormat; readonly report: GateReport }>();
  const [result, setResult] = useState<ExportResult>();
  /** 마지막 요청의 revision — "다시 시도"가 같은 잡일지(같은 revision · 저장 전 변경 없음) 가른다 */
  const [requested, setRequested] = useState<number>();

  const { savedRevision, retry: flushSave } = save;
  const request = useCallback(
    async (format: ExportFormat) => {
      setRunning(format);
      setResult(undefined);
      const revision = savedRevision();
      setRequested(revision);
      const next = await (await loadFlow()).requestExportOnce(repository, projectId, format, revision);
      setResult(next);
      setRunning(undefined);
    },
    [repository, projectId, savedRevision],
  );

  const phase = save.state.phase;
  const proceed = useCallback(
    (format: ExportFormat) => {
      if (phase === "idle" || phase === "saved") return void request(format);
      setWaitingSave(format);
      flushSave();
    },
    [phase, request, flushSave],
  );
  // 저장 먼저 — 저장되면 요청, 실패·충돌·오프라인이면 요청하지 않는다. 저장 중 생긴 변경(dirty)은 다시 바로 저장.
  // 상태 정리는 effect 밖(다음 마이크로태스크)에서 — 렌더 중 연쇄 갱신을 만들지 않는다
  useEffect(() => {
    if (!waitingSave) return;
    if (phase === "dirty") return flushSave();
    if (phase !== "saved" && phase !== "failed" && phase !== "stale" && phase !== "offline") return;
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      setWaitingSave(undefined);
      if (phase === "saved") void request(waitingSave);
    });
    return () => void (live = false);
  }, [phase, waitingSave, request, flushSave]);

  const { report, stale, recheck } = gate;
  const start = useCallback(
    async (format: ExportFormat) => {
      // 오래된 결과로 내보내지 않는다(E-AC-28) — 지금 문서로 다시 계산한 뒤 판정
      const fresh = stale || !report ? await recheck() : report;
      if (!fresh) return;
      const counts = gateCounts(fresh);
      if (counts.block > 0) return;
      if (counts.warn > 0) return setConfirming({ format, report: fresh });
      proceed(format);
    },
    [report, stale, recheck, proceed],
  );
  const confirm = useCallback(() => {
    if (!confirming) return;
    setConfirming(undefined);
    proceed(confirming.format);
  }, [confirming, proceed]);
  const cancel = useCallback(() => setConfirming(undefined), []);
  // 같은 revision · 저장 전 변경 없음 = 같은 잡 다시(멱등). 문서가 달라졌으면 일반 시작 흐름(다시 검사 → 경고 확인 → 저장 먼저)
  const retryExport = useCallback(() => {
    if (!result) return;
    const same = requested === savedRevision() && (phase === "idle" || phase === "saved");
    void (same ? request(result.format) : start(result.format));
  }, [result, requested, savedRevision, phase, request, start]);

  return { busy: running ?? waitingSave, confirming, result, start, confirm, cancel, retry: retryExport };
}
