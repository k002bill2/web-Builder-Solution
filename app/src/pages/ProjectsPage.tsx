import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ProjectList } from "../components/projects/ProjectList";
import type { RenameHandlers } from "../components/projects/ProjectRow";
import type { RenameSubmitOutcome } from "../components/projects/RenameField";
import { LoadingState } from "../components/layout/LoadingState";
import { ProjectRepositoryError, type Project, type ProjectRepository } from "../data/projectRepository";
import { projectRowView, sortProjects } from "../features/projects/projectListView";
import { editRename, failRename, openRename, renamedText, submitRename, type RenameDraft, type RenameRequest } from "../features/projects/renameDraft";
import { useProjectList } from "../features/projects/useProjectList";

const PAGE = "mx-auto flex max-w-(--layout-max-width) flex-col items-start gap-4 px-4 py-8 md:px-7";
const BUTTON_LINK = "ds-label inline-flex h-10 items-center rounded-md bg-primary px-4 text-on-primary hover:bg-primary-hover";

const systemNow = () => new Date();

interface Notice {
  readonly text: string;
  readonly key: number;
}

/** J-S02 — 오류가 아니라 빈 상태(role=alert 아님) */
function ProjectsEmpty() {
  return (
    <>
      <p className="ds-body2">프로젝트는 비교 보드에서 프로필을 확정하면 만들어집니다</p>
      <p className="ds-caption1 text-label-alternative">새로고침하면 프로젝트가 사라집니다(서버 연결 전)</p>
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
function useRename(repository: ProjectRepository, replace: (project: Project) => void) {
  const [draft, setDraft] = useState<RenameDraft | null>(null);
  const [notice, setNotice] = useState<Notice>({ text: "", key: 0 });
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
        setNotice((n) => ({ text: renamedText(project.name), key: n.key + 1 }));
      } catch (error: unknown) {
        if (error instanceof ProjectRepositoryError && error.code === "STALE_PROJECT" && error.project) replace(error.project);
        setDraft((d) => (d?.projectId === request.projectId ? failRename(d, error) : d));
      } finally {
        busy.current = false;
      }
    },
    [repository, replace],
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
  return { draft, setDraft, notice, page, close, submit };
}

/** DS-2A-05 `/projects` 프로젝트 목록 (SPEC 2.4 J-S01~J-S08). 라우트 연결은 a1-β */
export function ProjectsPage({ repository, now = systemNow }: { readonly repository: ProjectRepository; readonly now?: () => Date }) {
  const { items, replace } = useProjectList(repository);
  const { draft, setDraft, notice, page, close, submit } = useRename(repository, replace);
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
        <h1 className="ds-title1">프로젝트</h1>
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
      {items !== null && items.length === 0 && <ProjectsEmpty />}
      {items !== null && items.length > 0 && (
        <ProjectList rows={sortProjects(items).map((s) => projectRowView(s, at))} draft={draft} rename={rename} />
      )}
    </div>
  );
}
