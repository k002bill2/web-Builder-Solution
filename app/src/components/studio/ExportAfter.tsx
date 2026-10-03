import { useEffect, useId, useRef } from "react";
import type { ExportFormat } from "../../data/projectRepository";
import type { GateReport } from "../../engine/contracts/records";
import { releaseDownloads, type ExportResult } from "../../features/studio/exportFlow";
import { GATE_ROW_NAMES } from "../../features/studio/gateView";
import { Button } from "../ds/Button";
import { Callout } from "../ds/Callout";

/**
 * 내보내기 조작 뒤 부품 (DS-2A-05 S-B5 — 내보내기 버튼을 눌렀을 때만 받는다): 경고 확인 대화상자(E-S24) · 결과(E-S27 · m2a 3.2 B).
 */

/** E-S24 · Q8=A — 경고 목록 + "경고를 확인했습니다 · 내보내기" / "취소". 체크박스 확인 없음. 모달(`showModal`) · Esc = 취소 · 닫히면 연 버튼으로 포커스 */
export function ExportConfirmDialog({ report, onConfirm, onCancel }: { readonly report: GateReport; readonly onConfirm: () => void; readonly onCancel: () => void }) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // 연 버튼 — 닫히면(언마운트) 포커스를 돌려준다(모달을 DOM에서 빼면 브라우저가 돌려주지 않는다)
    const opener = document.activeElement as HTMLElement | null;
    const el = dialog.current;
    if (el && !el.open) el.showModal();
    el?.querySelector<HTMLButtonElement>("[data-confirm]")?.focus();
    return () => opener?.focus();
  }, []);
  const warnings = report.rows.flatMap((row) => row.issues.filter((i) => i.severity === "warn").map((issue) => ({ row: GATE_ROW_NAMES[row.id], issue })));
  return (
    <dialog
      ref={dialog}
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-full max-w-lg rounded-lg border border-line-normal bg-background-normal p-6 text-label-normal"
    >
      <div className="flex flex-col gap-4">
        <h2 id={`${id}-title`} className="ds-heading2">
          경고 {warnings.length}건이 있습니다
        </h2>
        <ul className="ds-body3 flex flex-col gap-1">
          {warnings.map(({ row, issue }, n) => (
            <li key={n}>
              {row} · {issue.cause}
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button data-confirm variant="primary" size="sm" onClick={onConfirm}>
            경고를 확인했습니다 · 내보내기
          </Button>
        </div>
      </div>
    </dialog>
  );
}

const NEXT: Readonly<Record<ExportFormat, string>> = {
  "react-zip": "React 프로젝트(zip)는 코드 생성기 연결 후(M4) 내보낼 수 있습니다",
  "static-html": "정적 HTML은 생성기 연결 후(다음 단계) 내보낼 수 있습니다",
};
const KEEP = "지금 문서는 이 탭에 저장돼 있습니다 — 따로 남기려면 '스냅샷'에서 저장하세요";
const NAME: Readonly<Record<ExportFormat, string>> = { "react-zip": "zip", "static-html": "정적 HTML" };

/**
 * 내려받기 링크(E-S27 · M2A-3b G4) — 부모 문서의 a download(렌더 iframe은 내려받기 권한 없음).
 * 편집기를 떠나 내려지면(경로가 바뀜) 이 탭의 내려받기 object URL을 해제한다. 새 요청·탭 전환으로 내려질 때는 같은 경로라 두고 쓴다(같은 잡 = 같은 URL).
 */
function DownloadLink({ href, fileName }: { readonly href: string; readonly fileName: string }) {
  useEffect(() => {
    const here = location.pathname;
    return () => void setTimeout(() => location.pathname !== here && releaseDownloads());
  }, []);
  return (
    <a href={href} download={fileName} className="ds-label inline-flex min-h-8 items-center text-primary hover:text-primary-hover">
      내려받기
    </a>
  );
}

/** E-S27 결과 — 생성기 없음 = informative(오류 아님, alert 아님) · 구조 미리보기 = cautionary `role=status` + 이동 · 재시도 가능 실패 = alert + 다시 시도 */
export function ExportResultView({ result, onRetry, onFirstFallback }: { readonly result: ExportResult; readonly onRetry: () => void; readonly onFirstFallback: (instanceId: string) => void }) {
  if (result.kind === "unavailable") return <Callout tone="info" title={`${NEXT[result.format]}. ${KEEP}`} />;
  if (result.kind === "unrendered") {
    const first = result.sections[0];
    return (
      <div role="status">
        <Callout
          tone="warning"
          title={`구조 미리보기 섹션 ${result.sections.length}개가 있어 내보내지 않았습니다 — 실제 렌더가 있는 변형으로 바꾸거나 지운 뒤 다시 내보내세요`}
          action={
            first && (
              <button type="button" onClick={() => onFirstFallback(first)} className="ds-label min-h-8 text-primary hover:text-primary-hover">
                첫 구조 미리보기 섹션으로 이동
              </button>
            )
          }
        />
      </div>
    );
  }
  if (result.kind === "done") {
    const { download } = result;
    return (
      <div role="status">
        <Callout
          tone="info"
          title={`${NAME[result.format]}을 만들었습니다 · 내보내기 전 상태는 스냅샷 '${result.snapshotName}'에 있습니다`}
          action={download && <DownloadLink href={download.href} fileName={download.fileName} />}
        >
          {download && <span className="text-label-alternative">결과 해시 {download.hash}</span>}
        </Callout>
      </div>
    );
  }
  if (result.kind === "retryable")
    return (
      <div role="alert">
        <Callout
          tone="negative"
          title="내보내지 못했습니다"
          action={
            <Button variant="outline" size="sm" onClick={onRetry}>
              다시 시도
            </Button>
          }
        />
      </div>
    );
  return (
    <div role="alert">
      <Callout tone="negative" title={result.code === "STALE_DOC" ? "다른 곳에서 문서가 바뀌어 내보내지 않았습니다" : "품질 게이트 차단이 있어 내보내지 않았습니다 — 차단을 고친 뒤 다시 내보내세요"} />
    </div>
  );
}
