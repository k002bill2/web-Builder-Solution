import { useCallback, useEffect, useRef, useState } from "react";
import type { ExportFormat, ProjectRepository } from "../../data/projectRepository";
import type { GateReport } from "../../engine/contracts/records";
import type { ExportResult } from "./exportFlow";
import type { RenderImages } from "./images/store/types";
import { loadExportFlow } from "./exportFlowLoader";
import { gateCounts } from "./gateView";
import type { GateState } from "./useGateReport";
import type { UseDocSave } from "./useDocSave";

/**
 * 내보내기 시작 (DS-2A-05 5.13 시작 문장 · E-S24 · E-AC-28·29·30) — 결과가 오래됐으면 먼저 다시 계산 → 차단이면 멈춤 → 경고만이면 확인 대화상자 →
 * 저장 전 변경이 있으면 저장 먼저(실패·충돌·오프라인이면 요청 0 — E-S07·E-S09 표시는 저장 흐름이 한다) → `requestExport` 1회(조작 뒤 청크).
 */
export function useExportFlow({
  repository,
  projectId,
  save,
  gate,
  images,
  onSnapshot,
}: {
  readonly repository: ProjectRepository;
  readonly projectId: string;
  readonly save: UseDocSave;
  readonly gate: GateState;
  /** 편집 틀 images 맵 — 생성기가 이번 요청에서 읽는다(SPEC m2c 5.1) */
  readonly images?: RenderImages;
  /** "내보내기 전" 스냅샷 생성 응답 직후 — 참조 집합(스냅샷 목록)을 다시 읽는다(B-ER-06) */
  readonly onSnapshot?: () => void;
}) {
  const [running, setRunning] = useState<ExportFormat>();
  const [waitingSave, setWaitingSave] = useState<ExportFormat>();
  const [confirming, setConfirming] = useState<{ readonly format: ExportFormat; readonly report: GateReport }>();
  const [result, setResult] = useState<ExportResult>();
  /** 마지막 요청의 revision — "다시 시도"가 같은 잡일지(같은 revision · 저장 전 변경 없음) 가른다 */
  const [requested, setRequested] = useState<number>();

  const { savedRevision, retry: flushSave, doc } = save;
  const request = useCallback(
    async (format: ExportFormat) => {
      setRunning(format);
      setResult(undefined);
      const revision = savedRevision();
      setRequested(revision);
      // 청크 로드 실패(오프라인·청크 교체)도 재시도 가능 결과로 — 실행 상태를 남기지 않는다(M2A-3a Codex P2-1)
      const next = await loadExportFlow().then(
        (flow) => flow.requestExportOnce(repository, projectId, format, revision, images, onSnapshot),
        (): ExportResult => ({ kind: "retryable", format }),
      );
      setResult(next);
      setRunning(undefined);
    },
    [repository, projectId, savedRevision, images, onSnapshot],
  );

  const phase = save.state.phase;
  /** 검사·확인을 거친 문서 — 저장을 기다리는 동안 편집되면 저장 뒤 다시 검사한다(M2A-3a Codex P2-2) */
  const checkedDoc = useRef(doc);
  const proceed = useCallback(
    (format: ExportFormat) => {
      if (phase === "idle" || phase === "saved") return void request(format);
      checkedDoc.current = doc;
      setWaitingSave(format);
      flushSave();
    },
    [phase, doc, request, flushSave],
  );

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
  // 저장 먼저 — 저장되면 요청(그사이 문서가 바뀌었으면 시작 흐름부터 다시: 검사 → 경고 확인), 실패·충돌·오프라인이면 요청하지 않는다.
  // 저장 중 생긴 변경(dirty)은 다시 바로 저장. 상태 정리는 effect 밖(다음 마이크로태스크)에서 — 렌더 중 연쇄 갱신을 만들지 않는다
  useEffect(() => {
    if (!waitingSave) return;
    if (phase === "dirty") return flushSave();
    if (phase !== "saved" && phase !== "failed" && phase !== "stale" && phase !== "offline") return;
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      setWaitingSave(undefined);
      if (phase === "saved") void (doc === checkedDoc.current ? request : start)(waitingSave);
    });
    return () => void (live = false);
  }, [phase, waitingSave, doc, request, start, flushSave]);
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
