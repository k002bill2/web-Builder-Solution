import type { ExportFormat } from "../../data/projectRepository";
import { REACT_ZIP_FORMAT_LABEL } from "../../features/studio/reactZip/reactZipLabel";

export interface ExportReason {
  readonly id: string;
  readonly text: string;
  readonly link: string;
  readonly onLink: () => void;
}

const FORMATS: readonly { readonly format: ExportFormat; readonly label: string }[] = [
  { format: "sample-zip", label: "디자인 샘플 내려받기" },
  { format: "static-html", label: "HTML 파일 1개 내보내기" },
  { format: "static-zip", label: "HTML 샘플 묶음(zip) 내보내기" },
  { format: "react-zip", label: REACT_ZIP_FORMAT_LABEL },
];

/**
 * 내보내기 버튼 네 개(MQ-SMP-03 A — 샘플 묶음 → HTML 1개 → 정적 zip → React zip, PNG는 그 위 StudioLayout) · 사전 차단 이유 (DS-2A-05 5.13 · m2a 3.2 A · E-AC-29·50 · K-AC-18). outline, 아이콘 없음(S-B7).
 * 이유 ≥ 1 → 모든 버튼 `aria-disabled` + `aria-describedby` = 이유 id들(목록 순서 = 게이트 → 구조 미리보기, 8.3.2 5 → 7). 누르면 아무 요청도 하지 않는다.
 */
export function ExportButtons({ reasons, busy, onExport }: { readonly reasons: readonly ExportReason[]; readonly busy: ExportFormat | undefined; readonly onExport: (format: ExportFormat) => void }) {
  const blocked = reasons.length > 0;
  return (
    <div className="flex flex-col gap-2">
      {FORMATS.map(({ format, label }) => (
        <button
          key={format}
          type="button"
          aria-disabled={blocked || busy !== undefined || undefined}
          aria-busy={busy === format || undefined}
          aria-describedby={blocked ? reasons.map((r) => r.id).join(" ") : undefined}
          onClick={() => !blocked && busy === undefined && onExport(format)}
          className="ds-label min-h-10 rounded-md border border-line-normal px-4 text-label-normal hover:bg-fill-normal aria-disabled:cursor-not-allowed aria-disabled:text-label-disable"
        >
          {busy === format ? "내보내는 중…" : label}
        </button>
      ))}
      {blocked && (
        <ul aria-label="내보낼 수 없는 이유" className="flex flex-col gap-2">
          {reasons.map((reason) => (
            <li key={reason.id} className="flex flex-col items-start gap-1">
              <p id={reason.id} className="ds-caption1 text-label-neutral">
                {reason.text}
              </p>
              <button type="button" onClick={reason.onLink} className="ds-label min-h-8 text-primary hover:text-primary-hover">
                {reason.link}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
