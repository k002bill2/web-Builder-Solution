import { useCallback, useEffect, useRef, useState } from "react";
import type { ProfileSeries } from "../../domain/profile";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { GateReport } from "../../engine/contracts/records";
import { docPurpose } from "./docPurpose";

/** 편집 뒤 다시 계산하기까지(5.12) */
export const GATE_DEBOUNCE_MS = 500;
const loadGate = () => import("./gateCheck");

export interface GateState {
  readonly report: GateReport | undefined;
  /** 결과가 지금 문서로 계산된 것이 아님(E-S25 "편집 전 기준") — 계산한 문서 객체로 비교한다(편집은 저장 전까지 revision을 올리지 않는다) */
  readonly stale: boolean;
  /** 지금 문서로 바로 다시 계산(내보내기 시작 — 오래된 결과로 요청하지 않는다, E-AC-28). 테마(프로필 버전)가 없으면 undefined */
  readonly recheck: () => Promise<GateReport | undefined>;
  /** 마지막 계산이 던졌음 — 처리되지 않은 거부 대신 상태로 받는다(M2A-3a-fix F1) */
  readonly failed: boolean;
}

/**
 * 품질 게이트 결과 (DS-2A-05 5.12 · S-B4) — 진입 직후 1회 바로, 편집 뒤엔 500ms 디바운스로 `runGate(doc, theme)`.
 * 테마 = 문서가 가리키는 프로필 버전 + 그 버전의 목적(docPurpose). 엔진은 진입 직후 엔진 청크(gateCheck)에서만 받는다.
 */
export function useGateReport(doc: PageDoc, series: ProfileSeries | undefined): GateState {
  const version = series?.versions.find((v) => v.version === doc.profileVersion);
  const purpose = docPurpose(series, doc.profileVersion);
  const [checked, setChecked] = useState<{ readonly doc: PageDoc; readonly report: GateReport }>();
  const hasReport = useRef(false);
  const [failed, setFailed] = useState(false);

  const compute = useCallback(
    async (target: PageDoc) => {
      if (!version) return undefined;
      try {
        const report = (await loadGate()).runGate(target, { profile: version, purpose });
        hasReport.current = true;
        setFailed(false);
        return { doc: target, report };
      } catch {
        setFailed(true);
        return undefined;
      }
    },
    [version, purpose],
  );

  useEffect(() => {
    if (!version) return;
    let live = true;
    const run = () => void compute(doc).then((next) => live && next && setChecked(next));
    // 첫 계산은 바로(진입 직후 자동) — 편집 뒤에만 디바운스
    if (!hasReport.current) {
      run();
      return () => void (live = false);
    }
    const id = setTimeout(run, GATE_DEBOUNCE_MS);
    return () => {
      live = false;
      clearTimeout(id);
    };
  }, [doc, version, compute]);

  const recheck = useCallback(async () => {
    const next = await compute(doc);
    if (next) setChecked(next);
    return next?.report;
  }, [compute, doc]);

  return { report: checked?.report, stale: !!checked && checked.doc !== doc, recheck, failed };
}
