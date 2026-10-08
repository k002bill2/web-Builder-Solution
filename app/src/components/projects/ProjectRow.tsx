import { Link } from "react-router";
import type { ProjectRowView } from "../../features/projects/projectListView";
import type { RenameDraft } from "../../features/projects/renameDraft";
import { Button } from "../ds/Button";
import { RenameField, type RenameSubmitOutcome } from "./RenameField";

const ACTION_LINK = "ds-label inline-flex h-8 items-center text-primary hover:text-primary-hover";

export interface RenameHandlers {
  readonly onOpen: (projectId: string) => void;
  readonly onChange: (value: string) => void;
  readonly onSubmit: () => RenameSubmitOutcome;
  readonly onCancel: () => void;
}

/**
 * J-S04 한 줄: 이름(h2, 링크 아님) · 프로필 vN · 편집 상태 글자 · 마지막 변경 · 행동.
 * 행동의 접근 이름에 프로젝트 이름을 붙여 줄마다 구분한다(aria-label, 보이는 글자로 끝남).
 * 긴 이름은 자르지 않는다(J-S08 — base.css의 keep-all + overflow-wrap:anywhere).
 */
export function ProjectRow({
  row,
  draft,
  rename,
  onExport,
  onDelete,
}: {
  readonly row: ProjectRowView;
  readonly draft?: RenameDraft;
  readonly rename: RenameHandlers;
  /** 있을 때만 "파일로 내보내기"(P2-SPEC 1.2·1.4 — local만, "삭제" 앞) */
  readonly onExport?: (projectId: string) => void;
  /** 있을 때만 "삭제"(P1D-SPEC J-S12 — local만) */
  readonly onDelete?: (projectId: string) => void;
}) {
  return (
    <li className="flex flex-col gap-2 border-b border-line-neutral py-4">
      {draft ? (
        <RenameField draft={draft} onChange={rename.onChange} onSubmit={rename.onSubmit} onCancel={rename.onCancel} />
      ) : (
        <h2 className="ds-heading2">{row.name}</h2>
      )}
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="ds-body3">{row.profileLabel}</span>
        <span className="ds-caption1 text-label-alternative">{row.editStatus}</span>
        <time dateTime={row.dateTime} className="ds-caption1 text-label-alternative">
          {row.timeText}
        </time>
      </p>
      <div className="flex flex-wrap items-center gap-3">
        {row.editorHref && (
          <Link to={row.editorHref} aria-label={`${row.name} 편집기 열기`} className={ACTION_LINK}>
            편집기 열기
          </Link>
        )}
        <Link to={row.profileHref} aria-label={`${row.name} 프로필 보기`} className={ACTION_LINK}>
          프로필 보기
        </Link>
        <Button variant="outline" size="sm" data-rename-for={row.projectId} aria-label={`${row.name} 이름 바꾸기`} onClick={() => rename.onOpen(row.projectId)}>
          이름 바꾸기
        </Button>
        {onExport && (
          <Button variant="outline" size="sm" data-export-for={row.projectId} aria-label={`${row.name} 파일로 내보내기`} onClick={() => onExport(row.projectId)}>
            파일로 내보내기
          </Button>
        )}
        {onDelete && (
          <Button variant="outline" size="sm" data-delete-for={row.projectId} aria-label={`${row.name} 삭제`} onClick={() => onDelete(row.projectId)}>
            삭제
          </Button>
        )}
      </div>
    </li>
  );
}
