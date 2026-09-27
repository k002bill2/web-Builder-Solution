import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ConflictChoice, Project, ProjectRepository } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { PreviewView } from "../../features/detail/previewView";
import { useLayoutMode } from "../../features/studio/layoutMode";
import { toDocSaveRepository } from "../../features/studio/studioRepository";
import { useDocSave } from "../../features/studio/useDocSave";
import { ConflictCallout } from "./ConflictCallout";
import { EditFields } from "./EditFields";
import { SaveStatus } from "./SaveStatus";
import { docTagText, initialSelection, PAGE_INFO_ID, resolveSelection, sectionName, selectionName } from "../../features/studio/selection";
import { PreviewWidth } from "./PreviewWidth";
import { EditPanel, GatePanel, NoticeRegion, SectionNav, ThemePanel } from "./StudioPanels";
import { StudioTabs, type StudioTab } from "./StudioTabs";
import { StudioToolbar } from "./StudioToolbar";
import { StructureCanvas } from "./StructureCanvas";

const COLUMN = "flex min-h-0 flex-col gap-6 overflow-y-auto p-4";

/**
 * E-S05 기본 편집 틀 (DS-2A-05 3.1 · 4절). 배치(3단 · 2단 · 탭)마다 트리를 따로 그리고(4.3) 상태(선택·알림·탭)는 여기서 공유한다(4.1).
 * 편집 알림(6.3)은 `role=status` 1개 — 늘 그려 두고(비어 있어도) 이동 알림은 첫 표시 뒤 1회 넣는다.
 * `focusHeading` = "편집 시작"으로 도착(이동 state 있음) → h1로 포커스(QA D3).
 * 저장(S7 · 5.10): 화면 문서 = `useDocSave` 문서(내 편집). 저장 상태는 툴바(<1024 h1 아래 줄), 충돌 Callout은 캔버스 위, 오프라인·회복 문장은 편집 알림으로.
 * 이 모듈은 `StudioPage`가 문서가 있을 때 lazy로 받는다(진입 직후 청크 — `/studio` 첫 화면 ≤ 99.40, 번들 규칙).
 */
export function StudioLayout({
  project,
  doc: initialDoc,
  repository,
  entryNotice,
  focusHeading,
}: {
  readonly project: Project;
  readonly doc: PageDoc;
  readonly repository: ProjectRepository;
  readonly entryNotice: string | undefined;
  readonly focusHeading: boolean;
}) {
  const saveRepository = useMemo(() => toDocSaveRepository(repository), [repository]);
  const save = useDocSave({ repository: saveRepository, projectId: project.projectId, initialDoc });
  const doc = save.doc;
  const [resolving, setResolving] = useState(false);
  const mode = useLayoutMode();
  const heading = useRef<HTMLHeadingElement>(null);
  const focused = useRef(false);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(() => initialSelection(doc));
  const [tab, setTab] = useState<StudioTab>("sections");
  const [view, setView] = useState<PreviewView>("desktop");
  const selectedId = resolveSelection(doc, selected);

  // 영역을 먼저 비운 채 그린 뒤 글자를 넣는다 — 스크린 리더가 status 변화로 읽는다
  useEffect(() => {
    if (!entryNotice) return;
    const id = setTimeout(() => setNotice(entryNotice), 0);
    return () => clearTimeout(id);
  }, [entryNotice]);
  useEffect(() => {
    if (!focusHeading || focused.current) return;
    focused.current = true;
    heading.current?.focus();
  }, [focusHeading]);

  const { resolve } = save;
  const choose = useCallback(
    (choice: ConflictChoice) => {
      setResolving(true);
      // 해결 거부 → STALE 유지(훅) + 알림 1문장(유추 문장, REPORT)
      resolve(choice)
        .catch(() => setNotice("충돌을 해결하지 못했습니다 — 다시 골라 주세요"))
        .finally(() => setResolving(false));
    },
    [resolve],
  );

  const docTag = docTagText(doc);
  const saveStatus = <SaveStatus state={save.state} persistence={save.persistence} onRetry={save.retry} onAnnounce={setNotice} />;
  const conflict = save.conflict && <ConflictCallout latestRevision={save.conflict.latest?.revision} busy={resolving} onChoose={choose} />;
  const noticeRegion = <NoticeRegion text={notice} />;
  const nav = <SectionNav doc={doc} selectedId={selectedId} onSelect={setSelected} />;
  const edit = (
    <EditPanel name={selectionName(doc, selectedId)}>
      <EditFields doc={doc} selectedId={selectedId} onEdit={save.edit} />
    </EditPanel>
  );
  const gate = <GatePanel />;
  const widths = <PreviewWidth value={view} onChange={setView} />;

  if (mode === "tabs") {
    return (
      <div className="flex flex-col">
        <StudioToolbar projectName={project.name} headingRef={heading} subline={saveStatus} />
        <StudioTabs
          selected={tab}
          onSelect={setTab}
          between={noticeRegion}
          tabs={[
            {
              id: "sections",
              label: "섹션",
              panel: (
                <div className="flex flex-col gap-6">
                  {nav}
                  <ThemePanel doc={doc} docTag={docTag} profileId={project.profileId} />
                </div>
              ),
            },
            { id: "edit", label: "편집", panel: edit },
            { id: "gate", label: "검사", panel: gate },
          ]}
        />
        <StructureCanvas doc={doc} selectedId={selectedId} onSelect={setSelected} view={view} scrollable={false} head={<>{conflict}{widths}</>} />
      </div>
    );
  }

  if (mode === "split") {
    return (
      <div className="flex h-dvh flex-col">
        <StudioToolbar projectName={project.name} headingRef={heading}>
          {saveStatus}
          <label className="ds-label flex flex-none items-center gap-2">
            섹션
            <select
              value={selectedId}
              onChange={(e) => setSelected(e.target.value)}
              className="ds-body3 h-8 rounded-md border border-line-strong bg-background-normal px-2 text-label-normal"
            >
              <option value={PAGE_INFO_ID}>페이지 정보</option>
              {doc.sections.map((s) => (
                <option key={s.instanceId} value={s.instanceId}>
                  {sectionName(s)}
                </option>
              ))}
            </select>
          </label>
          {widths}
        </StudioToolbar>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <StructureCanvas doc={doc} selectedId={selectedId} onSelect={setSelected} view={view} scrollable head={conflict} />
          </div>
          <div className={`${COLUMN} w-75 flex-none border-l border-line-normal`}>
            {noticeRegion}
            <details className="rounded-md border border-line-normal">
              <summary className="ds-label min-h-10 cursor-pointer px-3 py-2">섹션 목록 · 순서</summary>
              <div className="px-2 pb-2">{nav}</div>
            </details>
            {edit}
            <ThemePanel doc={doc} docTag={docTag} profileId={project.profileId} />
            {gate}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <StudioToolbar projectName={project.name} docTag={docTag} headingRef={heading}>
        {saveStatus}
        {widths}
      </StudioToolbar>
      <div className="flex min-h-0 flex-1">
        <div className={`${COLUMN} w-55 flex-none border-r border-line-normal`}>
          {noticeRegion}
          {nav}
          <ThemePanel doc={doc} profileId={project.profileId} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <StructureCanvas doc={doc} selectedId={selectedId} onSelect={setSelected} view={view} scrollable head={conflict} />
        </div>
        <div className={`${COLUMN} w-75 flex-none border-l border-line-normal`}>
          {edit}
          {gate}
        </div>
      </div>
    </div>
  );
}
