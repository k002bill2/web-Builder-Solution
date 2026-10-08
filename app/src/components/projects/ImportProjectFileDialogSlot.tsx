import { useMemo } from "react";
import { tabLink } from "../../data/persistence/tabLink";
import { checkFile } from "../../features/projectFile/checkFile";
import { importerFor, type ImportDeps } from "../../features/projectFile/writeImport";
import ImportProjectFileDialog from "./ImportProjectFileDialog";

const session = () => {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

/** 브라우저 기본 의존성 — 조작 뒤 청크에서만 푼다(`/projects` 페이지 바이트 0) */
const defaultDeps = (): ImportDeps => ({
  locks: typeof navigator === "undefined" ? undefined : navigator.locks,
  factory: indexedDB,
  link: tabLink(),
  session: session(),
  go: (path) => window.location.assign(path),
});

/** 기본 검증(3.3 ①~⑤ — 브라우저 디코더·인코더) */
const browserCheck = (file: Pick<Blob, "size" | "text">) => checkFile(file);

/** 가져오기 대화상자 + 검증·재매김·쓰기 본문을 한 조작 뒤 청크로 묶는다(P2-SPEC 6절) — 가져오기는 탭당 1개(보유 잠금·멈춤 공유) */
export default function ImportProjectFileDialogSlot({
  file,
  deps,
  onPickAgain,
  onClose,
}: {
  readonly file: Pick<Blob, "size" | "text">;
  readonly deps?: ImportDeps;
  readonly onPickAgain: () => void;
  readonly onClose: () => void;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resolved = useMemo(() => deps ?? defaultDeps(), []);
  const importer = useMemo(() => importerFor(resolved), [resolved]);
  return (
    <ImportProjectFileDialog
      file={file}
      check={browserCheck}
      write={(checked) => importer.importFile(checked)}
      onPickAgain={onPickAgain}
      onClose={(reload) => (reload ? resolved.go("/projects") : onClose())}
    />
  );
}
