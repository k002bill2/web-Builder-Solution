import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { BrowserStorageSection } from "../components/projects/BrowserStorageSection";
import { ProjectList } from "../components/projects/ProjectList";
import type { RenameHandlers } from "../components/projects/ProjectRow";
import type { RenameSubmitOutcome } from "../components/projects/RenameField";
import type { DeleteTarget } from "../components/projects/DeleteProjectDialogSlot";
import type { ExportDeps, ExportTarget } from "../components/projects/ExportProjectFileDialogSlot";
import { LoadingState } from "../components/layout/LoadingState";
import { ProjectRepositoryError, type Project, type ProjectPersistence, type ProjectRepository } from "../data/projectRepository";
import type { DeleteDeps } from "../features/projects/deleteProject";
import { projectRowView, sortProjects } from "../features/projects/projectListView";
import { editRename, failRename, openRename, renamedText, submitRename, type RenameDraft, type RenameRequest } from "../features/projects/renameDraft";
import { useProjectList } from "../features/projects/useProjectList";

const PAGE = "mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-4 px-4 py-8 md:px-7";
const BUTTON_LINK = "ds-label inline-flex h-10 items-center rounded-md bg-primary px-4 text-on-primary hover:bg-primary-hover";

const systemNow = () => new Date();

/** 삭제 대화상자 + 흐름 본문(P1D-SPEC 1.3) — 조작 뒤 청크(줄의 "삭제"를 눌러야 받는다) */
const DeleteDialogSlot = lazy(() => import("../components/projects/DeleteProjectDialogSlot"));
/** deleteProject.DELETED_KEY와 같은 값(조작 뒤 청크를 페이지에 싣지 않으려고 리터럴 — 테스트가 같음을 단언) */
export const DELETED_NOTICE_KEY = "design-studio-deleted";
const deletedText = (name: string) => `'${name}' 프로젝트를 지웠습니다`;
/** 프로젝트 파일 내보내기 대화상자 + 읽기·인코딩(P2-SPEC 3.6·4.1) — 조작 뒤 청크(줄의 "파일로 내보내기"를 눌러야 받는다) */
const ExportDialogSlot = lazy(() => import("../components/projects/ExportProjectFileDialogSlot"));
/** EX-9 — 성공은 기존 "프로젝트 알림"에 1회 */
const exportedText = (name: string) => `'${name}' 프로젝트 파일을 내려받았습니다`;

type Session = Pick<Storage, "getItem" | "removeItem">;
const defaultSession = (): Session | undefined => {
  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

interface Notice {
  readonly text: string;
  readonly key: number;
}

/** P1C-SPEC 1.2 W1 — 저장 위치 캡션(강등 사유는 저장소 영역) */
const EMPTY_CAPTION: Partial<Record<ProjectPersistence, string>> = {
  local: "프로젝트는 이 브라우저에 저장됩니다 — 다른 기기나 브라우저에서는 보이지 않습니다",
  memory: "이 브라우저에 저장할 수 없어 새로고침하면 프로젝트가 사라집니다",
};

/** J-S02 — 오류가 아니라 빈 상태(role=alert 아님) */
function ProjectsEmpty({ persistence }: { readonly persistence: ProjectPersistence }) {
  return (
    <>
      <p className="ds-body2">프로젝트는 비교 보드에서 프로필을 확정하면 만들어집니다</p>
      {EMPTY_CAPTION[persistence] && <p className="ds-caption1 text-label-alternative">{EMPTY_CAPTION[persistence]}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/compare" className={BUTTON_LINK}>
          비교 보드로
        </Link>
        <Link to="/catalog" className="ds-label text-primary hover:text-primary-hover">
          카탈로그에서 고르기
        </Link>
      </div>
    </>
  );
}

/** 이름 바꾸기 흐름(J-S05~J-S07) — 초안 · 연타 막기 · 저장 · 포커스 복귀 · 알림 */
function useRename(repository: ProjectRepository, replace: (project: Project) => void, announce: (text: string) => void) {
  const [draft, setDraft] = useState<RenameDraft | null>(null);
  const busy = useRef(false);
  const focusReturn = useRef<string | null>(null);
  const page = useRef<HTMLDivElement>(null);

  // 저장·취소로 닫히면 그 줄의 "이름 바꾸기"로 — 저장 뒤 줄이 맨 위로 옮겨 가도 projectId로 찾는다
  useEffect(() => {
    if (draft !== null) return;
    const id = focusReturn.current;
    focusReturn.current = null;
    if (id === null) return;
    const buttons = page.current?.querySelectorAll<HTMLElement>("[data-rename-for]") ?? [];
    Array.from(buttons).find((el) => el.dataset.renameFor === id)?.focus();
  }, [draft]);

  const save = useCallback(
    async (request: RenameRequest) => {
      try {
        const project = await repository.renameProject(request.projectId, request.revision, request.name);
        replace(project);
        focusReturn.current = project.projectId;
        setDraft((d) => (d?.projectId === request.projectId ? null : d));
        announce(renamedText(project.name));
      } catch (error: unknown) {
        if (error instanceof ProjectRepositoryError && error.code === "STALE_PROJECT" && error.project) replace(error.project);
        setDraft((d) => (d?.projectId === request.projectId ? failRename(d, error) : d));
      } finally {
        busy.current = false;
      }
    },
    [repository, replace, announce],
  );

  const close = (projectId: string) => {
    focusReturn.current = projectId;
    setDraft(null);
  };
  const submit = (): RenameSubmitOutcome => {
    if (draft === null || busy.current) return "ignored";
    const { draft: next, request } = submitRename(draft);
    setDraft(next);
    if (!request) return next.error !== undefined ? "invalid" : "ignored";
    busy.current = true;
    void save(request);
    return "sent";
  };
  return { draft, setDraft, page, close, submit };
}

/** 새로고침 뒤 1회(J-S16) — 키를 읽으면 바로 지우고 알림 · 포커스 = h1(지운 줄이 없어 복귀 대상이 없다) */
function useDeletedNotice(session: Session | undefined, announce: (text: string) => void) {
  const [name] = useState(() => {
    try {
      const found = session?.getItem(DELETED_NOTICE_KEY) ?? null;
      if (found !== null) session?.removeItem(DELETED_NOTICE_KEY);
      return found;
    } catch {
      return null;
    }
  });
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (name === null) return;
    announce(deletedText(name));
    heading.current?.focus();
    // 마운트 1회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { heading, focusable: name !== null };
}

/** DS-2A-05 `/projects` 프로젝트 목록 (SPEC 2.4 J-S01~J-S08). 라우트 연결은 a1-β */
export function ProjectsPage({
  repository,
  now = systemNow,
  session = defaultSession(),
  deleteDeps,
  exportDeps,
}: {
  readonly repository: ProjectRepository;
  readonly now?: () => Date;
  readonly session?: Session;
  /** 삭제 흐름 의존성 — 테스트 주입(없으면 대화상자 청크가 브라우저 기본값을 푼다) */
  readonly deleteDeps?: DeleteDeps;
  /** 내보내기 의존성 — 테스트 주입(없으면 대화상자 청크가 브라우저 기본값을 푼다) */
  readonly exportDeps?: ExportDeps;
}) {
  const { items, replace } = useProjectList(repository);
  const [notice, setNotice] = useState<Notice>({ text: "", key: 0 });
  const announce = useCallback((text: string) => setNotice((n) => ({ text, key: n.key + 1 })), []);
  const { draft, setDraft, page, close, submit } = useRename(repository, replace, announce);
  const { heading, focusable } = useDeletedNotice(session, announce);
  const [deleting, setDeleting] = useState<DeleteTarget | null>(null);
  const openDelete = (projectId: string) => {
    const found = items?.find((s) => s.projectId === projectId);
    if (!found) return;
    // 이름 초안만 취소(close()는 포커스를 "이름 바꾸기"로 끌어간다)
    setDraft(null);
    setDeleting({ projectId, name: found.name, hasDoc: found.hasDoc });
  };
  const closeDelete = () => {
    const id = deleting?.projectId;
    setDeleting(null);
    const buttons = page.current?.querySelectorAll<HTMLElement>("[data-delete-for]") ?? [];
    Array.from(buttons).find((el) => el.dataset.deleteFor === id)?.focus();
  };
  const [exporting, setExporting] = useState<ExportTarget | null>(null);
  const openExport = (projectId: string) => {
    const found = items?.find((s) => s.projectId === projectId);
    if (!found) return;
    setDraft(null);
    setExporting({ projectId, name: found.name, hasDoc: found.hasDoc });
  };
  const closeExport = (done: boolean) => {
    if (!exporting) return;
    setExporting(null);
    if (done) announce(exportedText(exporting.name));
    const buttons = page.current?.querySelectorAll<HTMLElement>("[data-export-for]") ?? [];
    Array.from(buttons).find((el) => el.dataset.exportFor === exporting.projectId)?.focus();
  };
  const at = now().getTime();
  const rename: RenameHandlers = {
    onOpen: (projectId) => {
      const found = items?.find((s) => s.projectId === projectId);
      if (found) setDraft(openRename(found));
    },
    onChange: (value) => setDraft((d) => d && editRename(d, value)),
    onSubmit: submit,
    onCancel: () => {
      if (draft) close(draft.projectId);
    },
  };
  return (
    <div ref={page} className={PAGE}>
      <header className="flex w-full flex-wrap items-center justify-between gap-3">
        <h1 ref={heading} tabIndex={focusable ? -1 : undefined} className="ds-title1">
          프로젝트
        </h1>
        {items !== null && items.length > 0 && (
          <Link to="/compare?new=1" className={BUTTON_LINK}>
            새 프로젝트 시작
          </Link>
        )}
      </header>
      {/* 알림 영역은 늘 DOM에 둔다(display:none 금지, D-QA06) — 실패는 줄 안의 role=alert */}
      <p role="status" aria-label="프로젝트 알림" className="sr-only">
        {notice.text && <span key={notice.key}>{notice.text}</span>}
      </p>
      {items === null && <LoadingState />}
      {items !== null && items.length === 0 && <ProjectsEmpty persistence={repository.persistence} />}
      {items !== null && items.length > 0 && (
        <ProjectList rows={sortProjects(items).map((s) => projectRowView(s, at))} draft={draft}
          rename={rename}
          onExport={repository.persistence === "local" ? openExport : undefined}
          onDelete={repository.persistence === "local" ? openDelete : undefined}
        />
      )}
      {deleting && (
        <Suspense fallback={null}>
          <DeleteDialogSlot target={deleting} deps={deleteDeps} onClose={closeDelete} />
        </Suspense>
      )}
      {exporting && (
        <Suspense fallback={null}>
          <ExportDialogSlot target={exporting} deps={exportDeps} onClose={closeExport} />
        </Suspense>
      )}
      {items !== null && <BrowserStorageSection persistence={repository.persistence} count={items.length} />}
    </div>
  );
}
