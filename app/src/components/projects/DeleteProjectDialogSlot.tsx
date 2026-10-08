import { useMemo } from "react";
import { tabLink } from "../../data/persistence/tabLink";
import { deleterFor, type DeleteDeps } from "../../features/projects/deleteProject";
import DeleteProjectDialog from "./DeleteProjectDialog";

export interface DeleteTarget {
  readonly projectId: string;
  readonly name: string;
  readonly hasDoc: boolean;
}

const session = () => {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

/** 브라우저 기본 의존성 — 조작 뒤 청크에서만 푼다(`/projects` 페이지 바이트 0) */
const defaultDeps = (): DeleteDeps => ({
  locks: typeof navigator === "undefined" ? undefined : navigator.locks,
  factory: indexedDB,
  link: tabLink(),
  session: session(),
  go: (path) => window.location.assign(path),
});

/** 삭제 대화상자 + 흐름 본문을 한 조작 뒤 청크로 묶는다(P1D-SPEC 4절) — 삭제는 탭당 1개(다시 열어도 보유 잠금·멈춤을 공유) */
export default function DeleteProjectDialogSlot({ target, deps, onClose }: { readonly target: DeleteTarget; readonly deps?: DeleteDeps; readonly onClose: () => void }) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => deps ?? defaultDeps(), []);
  const deleter = useMemo(() => deleterFor(resolved), [resolved]);
  return (
    <DeleteProjectDialog
      name={target.name}
      hasDoc={target.hasDoc}
      remove={() => deleter.remove(target.projectId, target.name)}
      onClose={(reload) => (reload ? resolved.go("/projects") : onClose())}
    />
  );
}
