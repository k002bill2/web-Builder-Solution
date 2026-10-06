import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import type { ConflictChoice, Project, ProjectRepository } from "../../data/projectRepository";
import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { PreviewView } from "../../features/detail/previewView";
import { useLayoutMode } from "../../features/studio/layoutMode";
import type { SectionType } from "../../engine/contracts/pageDoc";
import type { MoveDirection } from "../../engine/ops/rules";
// 편집 알림 문장은 연산 청크(docEngine)에서 받는다 — 연산이 끝났으면 이미 받은 청크라 바로 풀린다(S-B5)
import { loadDocEngine } from "../../features/studio/docOps";
import type { VariantChoice } from "../../features/studio/variantChoices";
import { canAdd, canMove, canRemove } from "../../features/studio/opPermissions";
import { docKitTokens, docPurpose } from "../../features/studio/docPurpose";
import { useFocusRequest } from "../../features/studio/useFocusRequest";
import { useSectionOps } from "../../features/studio/useSectionOps";
import { toDocSaveRepository } from "../../features/studio/studioRepository";
import { useDocSave } from "../../features/studio/useDocSave";
import { saveStatusText } from "../../features/studio/saveStatusText";
import type { AutosaveState } from "../../features/studio/useAutosaveScheduler";
import { ConflictCallout } from "./ConflictCallout";
import { EditFields } from "./EditFields";
import { SaveStatus } from "./SaveStatus";
import { docTagText, initialSelection, PAGE_INFO_ID, resolveSelection, sectionName, selectedSection, selectionName, variantName } from "../../features/studio/selection";
import { PreviewWidth } from "./PreviewWidth";
import { AddSectionButton } from "./AddSectionButton";
import { SectionOpControls } from "./SectionOpControls";
import { VariantSwitch } from "./VariantSwitch";
import { EditPanel, GatePanel, NoticeRegion, SectionNav, ThemePanel } from "./StudioPanels";
import { useThemeSwap } from "./useThemeSwap";
import { useSnapshots } from "./useSnapshots";
import { StudioTabs, type StudioTab } from "./StudioTabs";
import { StudioToolbar } from "./StudioToolbar";
import { StructureCanvas } from "./StructureCanvas";
import { GateList } from "./GateList";
import { Button } from "../ds/Button";
import type { GateRow } from "../../engine/contracts/records";
import { useGateReport } from "../../features/studio/useGateReport";
import { fallbackReason, fallbackSections, firstBlockRow, gateBlockReason, gateCounts, gateSummaryNotice } from "../../features/studio/gateView";
import { useExportFlow } from "../../features/studio/useExportFlow";
import { ExportButtons, type ExportReason } from "./ExportButtons";
import { ExportRetryAlert } from "./ExportRetryAlert";
import { PngSave } from "./PngSave";
import { emitEditorEvent } from "../../features/studio/editorEvents";
import type { RenderImages } from "../../features/studio/images/store/types";

const COLUMN = "flex min-h-0 flex-col gap-6 overflow-y-auto p-4";
/** 미저장 편집이 남은 채 멈춘 저장 상태 — PNG 준비 전 이유로 저장 상태 문장을 보인다(P2-a) */
const UNSAVED: ReadonlySet<AutosaveState["phase"]> = new Set(["failed", "offline", "stale"]);
/** 섹션 추가 대화상자 — "섹션 추가"를 눌렀을 때만 받는다(조작 뒤, S-B5) */
const AddSectionDialog = lazy(() => import("./AddSectionDialog"));
/** 내보내기 경고 확인 대화상자 · 결과(조작 뒤, S-B5) — 내보내기 버튼을 누른 뒤에만 받는다 */
const ExportConfirmDialog = lazy(() => import("./ExportAfter").then((m) => ({ default: m.ExportConfirmDialog })));
const ExportResultView = lazy(() => import("./ExportAfter").then((m) => ({ default: m.ExportResultView })));

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
  entryChanges = 0,
  focusHeading,
}: {
  readonly project: Project;
  readonly doc: PageDoc;
  readonly repository: ProjectRepository;
  readonly entryNotice: string | undefined;
  /** 바뀐 쌍 수(8.2.1 (a)) — 있으면 알림을 한 줄 요약 + 펼치기로 접는다(r4.7 A3-Q7) */
  readonly entryChanges?: number;
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
  // "이미지 편집" 펼침 — 배치마다 트리를 따로 그려 EditFields가 다시 마운트되므로 여기서 든다(B-M2C-04)
  const imagesOpen = useState(false);
  const [drawn, setDrawn] = useState(false);
  const selectedId = resolveSelection(doc, selected);
  const root = useRef<HTMLDivElement>(null);
  // 스냅샷(ER SPEC r1 3.2) — 미리보기 중 편집 입력 무시 · 복원은 저장 훅 경로
  const snaps = useSnapshots({ repository, projectId: project.projectId, save, root, heading, onNotice: setNotice });
  const ops = useSectionOps({ doc, edit: snaps.edit, profileId: project.profileId });
  const requestFocus = useFocusRequest(root);

  const entrySummary = entryChanges > 0 ? `바뀐 점 ${entryChanges}개` : undefined;
  // 영역을 먼저 비운 채 그린 뒤 글자를 넣는다 — 스크린 리더가 status 변화로 읽는다
  useEffect(() => {
    if (!entryNotice) return;
    const id = setTimeout(() => setNotice(entrySummary ?? entryNotice), 0);
    return () => clearTimeout(id);
  }, [entryNotice, entrySummary]);
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
        .then(snaps.refresh)
        .catch(() => setNotice("충돌을 해결하지 못했습니다 — 다시 골라 주세요"))
        .finally(() => setResolving(false));
    },
    [resolve, snaps.refresh],
  );

  // 앱 안 링크(돌아가기 · 프로필 보기)는 막지 않는다(E-S10) — 대신 떠나기 전에 저장 전 변경을 바로 저장한다.
  // 틀이 사라지면 스케줄러가 디바운스 타이머를 버려 편집을 잃는다(Codex r1 P2). 변경이 없거나 저장 중·충돌이면 retry는 아무것도 하지 않는다
  const { retry } = save;
  const flushBeforeLeave = useCallback(
    (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest("a[href]")) retry();
    },
    [retry],
  );

  const { run } = ops;
  const move = useCallback(
    async (instanceId: string, direction: MoveDirection, button: HTMLElement) => {
      const outcome = await run({ kind: "move", instanceId, direction }, "이동");
      if (!outcome.ok) return setNotice(outcome.reason);
      const notices = await loadDocEngine();
      const moved = outcome.result.doc.sections[outcome.result.index]!;
      setNotice(notices.movedNotice(moved.type, sectionName(moved), outcome.result.index));
      requestFocus({ element: button });
    },
    [run, requestFocus],
  );
  // 대상 줄로 포커스(6.4) — <1024는 "섹션" 탭으로 먼저 바꾼다(숨은 패널 안으로 포커스를 보내지 않는다)
  const focusRow = useCallback(
    (rowId: string) => {
      if (mode === "tabs") setTab("sections");
      requestFocus({ rowId });
    },
    [mode, requestFocus],
  );
  // 알림 줄 "되돌리기"(Q7)가 되살릴 섹션과 알림 문장 — 연산마다 새로 정한다
  // before = 되살릴 문서 — 이미지 참조 집합에 든다(2a-05 5.9)
  // instanceId 없음 = 문서 전체 연산(테마) — 되돌려도 선택·포커스를 옮기지 않는다(ER SPEC 7절)
  const [undoTarget, setUndoTarget] = useState<{ readonly instanceId?: string; readonly text: string; readonly before: PageDoc }>();
  const remove = useCallback(
    async (instanceId: string) => {
      const outcome = await run({ kind: "remove", instanceId }, "삭제", true);
      if (!outcome.ok) return setNotice(outcome.reason);
      const notices = await loadDocEngine();
      const { before, result } = outcome;
      const removed = before.sections[result.index]!;
      // 포커스·선택 = 다음 섹션 줄(없으면 이전) — resolveSelection(첫 본문)에 맡기지 않는다
      const next = result.doc.sections[result.index] ?? result.doc.sections[result.index - 1];
      if (next) setSelected(next.instanceId);
      setUndoTarget({ instanceId: removed.instanceId, text: notices.restoredNotice(removed.type, sectionName(removed)), before });
      setNotice(notices.removedNotice(removed.type, sectionName(removed)));
      if (next) focusRow(next.instanceId);
    },
    [run, focusRow],
  );
  // 변형 교체(5.5) — 바로 적용 + 알림 줄 "되돌리기", 포커스는 누른 라디오 그대로(6.4)
  const swap = useCallback(
    async (instanceId: string, choice: VariantChoice, radio: HTMLElement) => {
      const outcome = await run({ kind: "swap", instanceId, variant: choice.variant }, "변형 교체", true);
      if (!outcome.ok) return setNotice(outcome.reason);
      const notices = await loadDocEngine();
      const original = outcome.before.sections.find((s) => s.instanceId === instanceId)!;
      setUndoTarget({ instanceId, text: notices.swapRevertedNotice(variantName(original)), before: outcome.before });
      setNotice(notices.swappedNotice(choice.label, choice.lostLabels));
      requestFocus({ element: radio });
    },
    [run, requestFocus],
  );
  const { undoLast } = ops;
  const undo = useCallback(() => {
    if (!undoTarget || !undoLast()) return;
    setNotice(undoTarget.text);
    if (undoTarget.instanceId === undefined) return;
    setSelected(undoTarget.instanceId);
    focusRow(undoTarget.instanceId);
  }, [undoTarget, undoLast, focusRow]);

  // 섹션 추가(5.3) — 대화상자를 연 버튼으로 닫힘 포커스, 추가 뒤엔 새 줄
  const [adding, setAdding] = useState<HTMLElement>();
  const add = useCallback(
    async (type: SectionType, variant: string) => {
      const opener = adding;
      setAdding(undefined);
      const outcome = await run({ kind: "add", type, variant, afterInstanceId: selectedId === PAGE_INFO_ID ? null : selectedId }, "추가");
      if (!outcome.ok) {
        setNotice(outcome.reason);
        if (opener) requestFocus({ element: opener });
        return;
      }
      const notices = await loadDocEngine();
      const added = outcome.result.doc.sections[outcome.result.index]!;
      setSelected(added.instanceId);
      setNotice(notices.addedNotice(added.type, sectionName(added), outcome.result.index));
      focusRow(added.instanceId);
    },
    [adding, run, selectedId, requestFocus, focusRow],
  );
  const cancelAdd = useCallback(() => {
    if (adding) requestFocus({ element: adding });
    setAdding(undefined);
  }, [adding, requestFocus]);

  // 캔버스 문제 배지(부모 오버레이, 5.7) → 그 섹션 선택 + 문제 필드 포커스(<1024는 "편집" 탭 먼저). 필드는 다음 커밋 뒤에 생기므로 대기
  const pendingIssue = useRef<string>(undefined);
  const focusIssue = useCallback(
    (instanceId: string, issueId: string) => {
      // 이미 보이는 필드(같은 섹션 · 편집 패널 보임)면 바로 — 선택·탭이 그대로면 다시 그리지 않아 대기 포커스가 돌지 않는다(R5 회귀)
      const field = root.current?.querySelector<HTMLElement>(`[aria-describedby~="${CSS.escape(issueId)}"]`);
      if (field && (mode !== "tabs" || tab === "edit")) return field.focus();
      setSelected(instanceId);
      if (mode === "tabs") setTab("edit");
      pendingIssue.current = issueId;
    },
    [mode, tab],
  );
  useEffect(() => {
    const id = pendingIssue.current;
    const field = id && root.current?.querySelector<HTMLElement>(`[aria-describedby~="${CSS.escape(id)}"]`);
    if (!field) return;
    pendingIssue.current = undefined;
    field.focus();
  });

  // 게이트 줄·툴바 → 이동(E-S23 · E-S26 · 5.12 표 "이동 대상"). 선택·탭을 바꾼 뒤 다음 커밋에서 요소 id로 포커스(없으면 편집 패널 머리)
  const pendingGate = useRef<string>(undefined);
  const [gateMoves, setGateMoves] = useState(0);
  const goTo = useCallback(
    (elementId: string, target: { readonly select?: string; readonly tab: StudioTab }) => {
      if (target.select) setSelected(target.select);
      if (mode === "tabs") setTab(target.tab);
      pendingGate.current = elementId;
      setGateMoves((n) => n + 1);
    },
    [mode],
  );
  useEffect(() => {
    const id = pendingGate.current;
    if (!id) return;
    pendingGate.current = undefined;
    const target = document.getElementById(id) ?? document.getElementById("studio-edit-heading");
    // 2단 배치의 "섹션 추가"는 접힌 '섹션 목록 · 순서' 안 — 닫힌 details 안은 포커스가 가지 않으므로 먼저 펼친다(M2A-3a Codex P2-3)
    target?.closest("details")?.setAttribute("open", "");
    target?.focus();
  }, [gateMoves]);
  const gateState = useGateReport(doc, ops.series);
  const goToRow = useCallback(
    (row: GateRow) => {
      const issue = row.issues[0];
      if (row.id === "contrast") return goTo("studio-theme-heading", { tab: "sections" });
      if (row.id === "seo-meta") return goTo(`page-info-${issue?.slotKey ?? "title"}`, { select: PAGE_INFO_ID, tab: "edit" });
      if (issue?.instanceId) return goTo(issue.slotKey ? `field-${issue.instanceId}-${issue.slotKey}` : "studio-edit-heading", { select: issue.instanceId, tab: "edit" });
      // 없는 섹션(필수 섹션) → "섹션 추가" · 그 밖 문서 전체 문제(h1 없음) → 편집 패널 머리
      if (row.id === "required-sections") return goTo("studio-add-section", { tab: "sections" });
      goTo("studio-edit-heading", { tab: "edit" });
    },
    [goTo],
  );
  // 툴바 "검사 · 내보내기"(E-S26) — h2 "품질 게이트"로(<1024 "검사" 탭) + 요약 알림 1회 · gate_checked(9절, 누를 때만)
  const { report: gateReport } = gateState;
  const theme = useThemeSwap({
    doc,
    series: ops.series,
    profileId: project.profileId,
    contrastBlocked: gateReport?.rows.find((r) => r.id === "contrast")?.state === "block",
    requestFocus,
    focusTheme: () => goTo("studio-theme-swap", { tab: "sections" }),
    deps: { run, onNotice: setNotice, onUndoable: setUndoTarget },
  });
  const openGate = useCallback(() => {
    goTo("studio-gate-heading", { tab: "gate" });
    if (!gateReport) return;
    const counts = gateCounts(gateReport);
    emitEditorEvent({ name: "gate_checked", block_count: counts.block, warn_count: counts.warn });
    setNotice(gateSummaryNotice(gateReport));
  }, [goTo, gateReport]);
  const gateButton = (
    <Button variant="primary" size="sm" onClick={openGate} aria-label={mode === "tabs" ? "검사 · 내보내기" : undefined} className="flex-none">
      {mode === "tabs" ? "검사" : "검사 · 내보내기"}
    </Button>
  );

  // 캔버스 images 맵(SPEC m2c 5.1) — 패널 청크의 보관소가 채우고 비운다. 편집 틀이 사라지면 함께 놓인다
  const [images, setImages] = useState<RenderImages>();
  const undoDoc = ops.canUndoLast ? undoTarget?.before : undefined;
  // 참조 집합(문서 ∪ 되돌릴 문서) 밖 이미지는 패널이 닫혀 있어도 뺀다(2a-05 5.9 · Codex r1) — 렌더 중 상태 조정(effect 아님).
  // 로컬 id = UUID라 직렬화 문자열 포함으로 잰다(진입 바이트 절약)
  const [refs, setRefs] = useState<readonly unknown[]>([doc, undoDoc, snaps.held]);
  if (refs[0] !== doc || refs[1] !== undoDoc || refs[2] !== snaps.held) {
    setRefs([doc, undoDoc, snaps.held]);
    const held = JSON.stringify([doc, undoDoc, snaps.held]);
    const kept = images && Object.entries(images).filter(([id]) => held.includes(id));
    if (kept && kept.length < Object.keys(images).length) setImages(Object.fromEntries(kept));
  }

  const current = selectedSection(doc, selectedId);
  const purpose = docPurpose(ops.series, doc.profileVersion);
  // 캔버스 킷 토큰 입력(팔레트 포함, MQ-1) = 목적과 같은 조회 결과(ops.series)의 문서 버전 적용값 — 두 번 부르지 않는다
  const kitTokens = useMemo(() => docKitTokens(ops.series, doc.profileVersion), [ops.series, doc.profileVersion]);
  // 순서 부품(5.2) — 선택 섹션이 있을 때만(페이지 정보는 이동·삭제 없음). 같은 부품을 배치마다 그린다
  const opControls = current && (
    <SectionOpControls
      up={canMove(doc, current.instanceId, "up")}
      down={canMove(doc, current.instanceId, "down")}
      remove={canRemove(doc, current.instanceId, purpose)}
      onMove={(direction, button) => void move(current.instanceId, direction, button)}
      onRemove={() => void remove(current.instanceId)}
      profileHref={`/profile/${project.profileId}?v=${doc.profileVersion}`}
    />
  );

  const docTag = docTagText(doc);
  const saveStatus = <SaveStatus state={save.state} persistence={save.persistence} onRetry={save.retry} onAnnounce={setNotice} />;
  const conflict = (
    <>
      {snaps.layer}
      {save.conflict && <ConflictCallout latestRevision={save.conflict.latest?.revision} busy={resolving} onChoose={choose} />}
    </>
  );
  const shown = snaps.preview?.doc ?? doc;
  const noticeRegion = <NoticeRegion text={notice} detail={entrySummary && notice === entrySummary ? entryNotice : undefined} onUndo={ops.canUndoLast ? undo : snaps.onUndo} />;
  const nav = (
    <SectionNav
      doc={doc}
      selectedId={selectedId}
      onSelect={setSelected}
      selectedExtra={mode === "tabs" ? opControls : undefined}
      footer={<AddSectionButton permission={canAdd(doc)} onOpen={setAdding} />}
    />
  );
  const addDialog = adding && (
    <Suspense fallback={null}>
      <AddSectionDialog doc={doc} onAdd={(type, variant) => void add(type, variant)} onCancel={cancelAdd} />
    </Suspense>
  );
  const editHead = current && (
    <>
      {opControls}
      <VariantSwitch key={current.instanceId} doc={doc} section={current} purpose={purpose} onSwap={(choice, radio) => void swap(current.instanceId, choice, radio)} />
    </>
  );
  const edit = (
    <EditPanel name={selectionName(doc, selectedId)} head={editHead}>
      <EditFields doc={doc} selectedId={selectedId} onEdit={snaps.edit} images={[images, setImages, undoDoc, snaps.held]} imagesOpen={imagesOpen} />
    </EditPanel>
  );
  // 내보내기 사전 차단 이유(5.13 · m2a 3.2 A) — 순서 = 게이트 → 구조 미리보기(8.3.2 5 → 7)
  const exportFlow = useExportFlow({ repository, projectId: project.projectId, save, gate: gateState, images });
  const exportResult = exportFlow.result;
  // "내보내기 전" 스냅샷이 생겼을 수 있다 — 목록(참조 집합)을 다시 읽는다(ER-AC-S7)
  const { refresh: refreshSnapshots } = snaps;
  useEffect(() => {
    if (exportResult) refreshSnapshots();
  }, [exportResult, refreshSnapshots]);
  const blockRow = gateReport && firstBlockRow(gateReport);
  const blockText = gateReport && gateBlockReason(gateReport);
  const fallbacks = fallbackSections(doc);
  const fallbackText = fallbackReason(fallbacks);
  const goToSection = (instanceId: string) => goTo("studio-edit-heading", { select: instanceId, tab: "edit" });
  const reasons: readonly ExportReason[] = [
    ...(blockRow && blockText ? [{ id: "export-reason-gate", text: blockText, link: "첫 차단으로 이동", onLink: () => goToRow(blockRow) }] : []),
    ...(fallbackText ? [{ id: "export-reason-fallback", text: fallbackText, link: "첫 구조 미리보기 섹션으로 이동", onLink: () => goToSection(fallbacks[0]!.instanceId) }] : []),
  ];
  const gate = (
    <GatePanel
      exports={
        <>
          <ExportButtons reasons={reasons} busy={exportFlow.busy} onExport={(format) => void exportFlow.start(format)} />
          {exportResult?.kind === "retryable" && <ExportRetryAlert onRetry={exportFlow.retry} reason={exportResult.reason} />}
          {((exportResult && exportResult.kind !== "retryable") || exportFlow.confirming) && (
            <Suspense fallback={null}>
              {exportResult && exportResult.kind !== "retryable" && <ExportResultView result={exportResult} onFirstFallback={goToSection} />}
              {exportFlow.confirming && <ExportConfirmDialog report={exportFlow.confirming.report} onConfirm={exportFlow.confirm} onCancel={exportFlow.cancel} />}
            </Suspense>
          )}
          {/* 준비 = 캔버스를 그림 + 자동 저장 idle·saved(파일 이름 revision = 캡처한 문서 — 3c REPORT 8절 · M2A-CLOSE P2-a).
              저장 실패·오프라인·충돌이면 이유 = 저장 상태 문장 */}
          <PngSave
            ready={drawn && (save.state.phase === "idle" || save.state.phase === "saved")}
            reason={drawn && UNSAVED.has(save.state.phase) ? saveStatusText(save.state, save.persistence, 0) : undefined}
            view={view}
            fallbackCount={fallbacks.length}
            capture={() => ({ doc, view, name: project.name, revision: save.savedRevision(), ...(kitTokens && { kitTokens }), ...(images && { images }) })}
          />
        </>
      }
    >
      {snaps.preview && <p className="ds-caption1 px-2 text-label-alternative">스냅샷 보는 중 — 편집 문서 기준 결과</p>}
      <GateList report={gateState.report} stale={gateState.stale} failed={gateState.failed} onRow={goToRow} contrastAction={theme.contrastAction} />
    </GatePanel>
  );
  const widths = (
    <div data-preview-keep className="contents">
      <PreviewWidth value={view} onChange={setView} />
    </div>
  );

  if (mode === "tabs") {
    return (
      <div ref={root} onClickCapture={flushBeforeLeave} className="flex flex-col">
        <StudioToolbar projectName={project.name} headingRef={heading} subline={saveStatus}>
          {snaps.button}
          {gateButton}
        </StudioToolbar>
        {addDialog}
        {theme.dialog}
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
                  <ThemePanel doc={doc} docTag={docTag} profileId={project.profileId} {...theme.panel} />
                </div>
              ),
            },
            { id: "edit", label: "편집", panel: edit },
            { id: "gate", label: "검사", panel: gate },
          ]}
        />
        <StructureCanvas kitTokens={kitTokens} images={images} doc={shown} selectedId={selectedId} onSelect={setSelected} onIssue={focusIssue} onDrawn={setDrawn} view={view} scrollable={false} head={<>{conflict}{widths}</>} />
      </div>
    );
  }

  if (mode === "split") {
    return (
      <div ref={root} onClickCapture={flushBeforeLeave} className="flex h-dvh flex-col">
        {addDialog}
        {theme.dialog}
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
          {snaps.button}
          {gateButton}
        </StudioToolbar>
        <div className="flex min-h-0 flex-1">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <StructureCanvas kitTokens={kitTokens} images={images} doc={shown} selectedId={selectedId} onSelect={setSelected} onIssue={focusIssue} onDrawn={setDrawn} view={view} scrollable head={conflict} />
          </div>
          <div className={`${COLUMN} w-75 flex-none border-l border-line-normal`}>
            {noticeRegion}
            <details className="rounded-md border border-line-normal">
              <summary className="ds-label min-h-10 cursor-pointer px-3 py-2">섹션 목록 · 순서</summary>
              <div className="px-2 pb-2">{nav}</div>
            </details>
            {edit}
            <ThemePanel doc={doc} docTag={docTag} profileId={project.profileId} {...theme.panel} />
            {gate}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={root} onClickCapture={flushBeforeLeave} className="flex h-dvh flex-col">
      {addDialog}
      {theme.dialog}
      <StudioToolbar projectName={project.name} docTag={docTag} headingRef={heading}>
        {saveStatus}
        {widths}
        {snaps.button}
        {gateButton}
      </StudioToolbar>
      <div className="flex min-h-0 flex-1">
        <div className={`${COLUMN} w-55 flex-none border-r border-line-normal`}>
          {noticeRegion}
          {nav}
          <ThemePanel doc={doc} profileId={project.profileId} {...theme.panel} />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <StructureCanvas kitTokens={kitTokens} images={images} doc={shown} selectedId={selectedId} onSelect={setSelected} onIssue={focusIssue} onDrawn={setDrawn} view={view} scrollable head={conflict} />
        </div>
        <div className={`${COLUMN} w-75 flex-none border-l border-line-normal`}>
          {edit}
          {gate}
        </div>
      </div>
    </div>
  );
}
