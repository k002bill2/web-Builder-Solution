import type { ProjectRowView } from "../../features/projects/projectListView";
import type { RenameDraft } from "../../features/projects/renameDraft";
import { ProjectRow, type RenameHandlers } from "./ProjectRow";

/** J-S04 목록 — 정렬은 호출하는 쪽(rows 순서 그대로). 이름 바꾸는 줄은 한 번에 하나 */
export function ProjectList({
  rows,
  draft,
  rename,
  onDelete,
}: {
  readonly rows: readonly ProjectRowView[];
  readonly draft: RenameDraft | null;
  readonly rename: RenameHandlers;
  readonly onDelete?: (projectId: string) => void;
}) {
  return (
    <ul aria-label="프로젝트 목록" className="flex w-full flex-col">
      {rows.map((row) => (
        <ProjectRow key={row.projectId} row={row} draft={draft?.projectId === row.projectId ? draft : undefined} rename={rename} onDelete={onDelete} />
      ))}
    </ul>
  );
}
