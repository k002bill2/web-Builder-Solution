import { useMemo } from "react";
import { encodeProjectFile } from "../../features/projectFile/encode";
import { projectFileName, readProject } from "../../features/projectFile/readProject";
import ExportProjectFileDialog, { type MakeResult } from "./ExportProjectFileDialog";

export interface ExportTarget {
  readonly projectId: string;
  readonly name: string;
  readonly hasDoc: boolean;
}

export interface ExportDeps {
  readonly factory: IDBFactory;
  readonly now: () => Date;
  /** 내려받기 시작 — 테스트 주입(jsdom에 object URL 없음) */
  readonly download: (blob: Blob, fileName: string) => void;
  /** IDB 읽기 — 테스트 주입(기본 readProject) */
  readonly read?: typeof readProject;
}

/** 부모 문서 a[download] 클릭(렌더 내보내기 선례) → 내려받기 시작 뒤 object URL 해제(다음 틱) */
function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** 브라우저 기본 의존성 — 조작 뒤 청크에서만 푼다(`/projects` 페이지 바이트 0) */
const defaultDeps = (): ExportDeps => ({ factory: indexedDB, now: () => new Date(), download: downloadBlob });

/** 내보내기 대화상자 + 읽기·인코딩을 한 조작 뒤 청크로 묶는다(P2-SPEC 6절) */
export default function ExportProjectFileDialogSlot({
  target,
  deps,
  onClose,
}: {
  readonly target: ExportTarget;
  readonly deps?: ExportDeps;
  readonly onClose: (done: boolean) => void;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => deps ?? defaultDeps(), []);
  const make = async (): Promise<MakeResult> => {
    try {
      const read = await (resolved.read ?? readProject)(resolved.factory, target.projectId);
      if (read.status !== "ok") return { status: read.status };
      const encoded = await encodeProjectFile({ ...read.source, exportedAt: resolved.now().toISOString() });
      return encoded.ok ? { status: "ok", blob: encoded.blob } : { status: "too-large" };
    } catch {
      return { status: "failed" };
    }
  };
  return (
    <ExportProjectFileDialog
      name={target.name}
      hasDoc={target.hasDoc}
      make={make}
      save={(blob) => resolved.download(blob, projectFileName(target.name, resolved.now()))}
      onClose={onClose}
    />
  );
}
