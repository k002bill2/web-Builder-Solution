import { useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { brand } from "../brand/brand.config";
import { ComparisonAccordion } from "../components/compare/ComparisonAccordion";
import { ComparisonTable } from "../components/compare/ComparisonTable";
import { DraftPanel } from "../components/compare/DraftPanel";
import { DraftSummaryBar } from "../components/compare/DraftSummaryBar";
import { Button } from "../components/ds/Button";
import { Callout } from "../components/ds/Callout";
import { Icon } from "../components/ds/Icon";
import { LoadingState } from "../components/layout/LoadingState";
import type { SaveStatus } from "../domain/compareBoard";
import { COMPARE_LIMIT, COMPARE_LIMIT_NOTICE } from "../features/compare/compareTray";
import { useCompareBoard } from "../features/compare/useCompareBoard";
import { useViewport } from "../features/compare/useViewport";
import { useSavedReferences } from "../features/saved/SavedReferencesContext";


const PAGE = "mx-auto flex max-w-(--layout-max-width) flex-col gap-6 px-4 py-8 md:px-7";
/** 열을 뺀 뒤 포커스 대상이 없을 때 — "레퍼런스 추가"(또는 빈 상태의 "카탈로그에서 고르기") (A-6) */
const FALLBACK = "[data-focus-fallback]";

/** S-12 자동 저장 상태 — 실패일 때만 alert */
function SaveCaption({ status, onRetry }: { readonly status: SaveStatus; readonly onRetry: () => void }) {
  if (status === "saving") return <span className="ds-caption1 text-label-alternative">저장 중…</span>;
  if (status === "saved") {
    return (
      <span className="ds-caption1 inline-flex items-center gap-1 text-label-alternative">
        <Icon name="circle-check" size={16} className="text-status-positive" />
        저장됨
      </span>
    );
  }
  if (status !== "error") return null;
  return (
    <div role="alert" className="ds-caption1 flex items-center gap-2 text-status-negative-text">
      저장하지 못했습니다
      <Button variant="outline" size="sm" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}

/** 비교 보드 `/compare` (SPEC 1a-03). 상태 분기 S-01~S-18, 확정 흐름 S-13~S-16, 진입 시 제목·h1 포커스(A-7). */
export function CompareBoardPage() {
  const board = useCompareBoard();
  const { saved } = useSavedReferences();
  const navigate = useNavigate();
  const viewport = useViewport();
  const heading = useRef<HTMLHeadingElement>(null);
  const draftHeading = useRef<HTMLHeadingElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const focused = useRef(false);

  useEffect(() => {
    document.title = `비교 보드 · ${brand.name}`;
  }, []);

  useEffect(() => {
    if (board.phase !== "ready" || focused.current) return;
    focused.current = true;
    heading.current?.focus();
  }, [board.phase]);

  const columns = board.board?.columns ?? [];
  const columnKey = columns.map((c) => c.referenceId).join("\n");
  useEffect(() => {
    const target = pendingFocus.current;
    if (target === null) return;
    const element = root.current?.querySelector<HTMLElement>(target === FALLBACK ? FALLBACK : `[data-remove-column="${CSS.escape(target)}"]`);
    if (!element) return;
    pendingFocus.current = null;
    element.focus();
  }, [columnKey]);

  if (board.phase === "loading") return <LoadingState label="비교 보드를 불러오는 중…" />;
  if (board.phase === "error") {
    return (
      <div role="alert" className={PAGE}>
        <h1 className="ds-title1">비교 보드를 불러오지 못했습니다</h1>
        <p className="ds-body2 text-label-alternative">네트워크 연결을 확인한 뒤 다시 시도해 주세요.</p>
        <div className="flex gap-2">
          <Button onClick={board.reload}>다시 시도</Button>
          <Button variant="outline" onClick={() => navigate("/catalog")}>
            카탈로그로
          </Button>
        </div>
      </div>
    );
  }

  const full = columns.length >= COMPARE_LIMIT;
  const addReference = () => {
    if (full) return board.announce(COMPARE_LIMIT_NOTICE);
    navigate(saved.size > 0 ? "/catalog?tab=saved" : "/catalog");
  };
  const removeColumn = (referenceId: string) => {
    const i = columns.findIndex((c) => c.referenceId === referenceId);
    pendingFocus.current = (columns[i + 1] ?? columns[i - 1])?.referenceId ?? FALLBACK;
    void board.removeColumn(referenceId);
  };

  const comparisonProps = {
    columns: board.view?.columns ?? [],
    rows: board.view?.rows ?? [],
    picks: board.board?.picks ?? {},
    pickAllLabel: columns.length === 1 ? "이 레퍼런스로 프로필 만들기" : "이 레퍼런스로 전부 선택",
    disabled: board.locked,
    onToggle: board.toggle,
    onRemoveColumn: removeColumn,
    onPickAll: board.pickAll,
  };

  return (
    <div ref={root} className={PAGE}>
      <header className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 ref={heading} tabIndex={-1} className="ds-title1 focus:outline-none">
            비교 보드
          </h1>
          <p className="ds-body2 text-label-alternative">
            {full ? `${columns.length} / ${COMPARE_LIMIT}개 · 가득 참` : `${columns.length} / ${COMPARE_LIMIT}개 비교 중`} · 항목마다 원하는 요소를 고르면 프로필 초안에 담깁니다
          </p>
        </div>
        <div className="flex flex-none items-center gap-3">
          <SaveCaption status={board.saveStatus} onRetry={board.retrySave} />
          {columns.length > 0 && (
            <Button
              variant="outline"
              leadingIcon="plus"
              data-focus-fallback
              aria-disabled={full || undefined}
              onClick={addReference}
              className="aria-disabled:cursor-not-allowed aria-disabled:bg-fill-strong aria-disabled:text-label-disable"
            >
              레퍼런스 추가
            </Button>
          )}
        </div>
      </header>

      {columns.length === 0 || !board.view ? (
        <section aria-labelledby="empty-board" className="flex flex-col items-start gap-3 rounded-lg border border-line-neutral p-8">
          <h2 id="empty-board" className="ds-heading1">
            비교할 레퍼런스가 없습니다
          </h2>
          <p className="ds-body2 text-label-alternative">카탈로그에서 ‘비교 추가’로 2~6개를 담으면 항목별로 비교할 수 있습니다</p>
          <div className="flex flex-wrap gap-2">
            <Button data-focus-fallback onClick={() => navigate("/catalog")}>
              카탈로그에서 고르기
            </Button>
            {saved.size > 0 && (
              <Button variant="outline" onClick={() => navigate("/catalog?tab=saved")}>
                저장한 레퍼런스 {saved.size}개 보기
              </Button>
            )}
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_calc(var(--spacing)*90)] xl:items-start">
          <div className="flex min-w-0 flex-col gap-4">
            {columns.length === 1 && (
              <Callout tone="info" title="비교할 레퍼런스가 1개입니다">
                하나 더 담으면 항목별로 골라 조합할 수 있습니다. 지금은 열의 ‘이 레퍼런스로 프로필 만들기’로 이 레퍼런스 구성을 그대로 쓸 수 있습니다.
              </Callout>
            )}
            {viewport === "narrow" ? (
              <ComparisonAccordion {...comparisonProps} />
            ) : (
              <ComparisonTable {...comparisonProps} />
            )}
          </div>
          <DraftPanel
            headingRef={draftHeading}
            className="xl:sticky xl:top-5 xl:max-h-[calc(100dvh-var(--spacing)*10)] xl:overflow-y-auto"
            items={board.items}
            status={board.draftStatus}
            hasPicks={Object.keys(board.board?.picks ?? {}).length > 0 || Object.keys(board.board?.custom ?? {}).length > 0}
            warnings={board.warnings}
            notices={board.notices}
            custom={board.board?.custom ?? {}}
            fonts={board.fonts}
            checkPrimaryColor={board.checkPrimaryColor}
            canConfirm={board.availability}
            confirming={board.confirming}
            announcement={board.announcement}
            undo={board.undo}
            onConfirm={() => void board.confirm()}
            onClear={board.clear}
            onUndo={board.undoLast}
            onCustomChange={board.changeCustom}
            onApplyFix={board.applyFix}
            CustomStyleFields={board.CustomStyleFields}
          />
          {viewport !== "wide" && (
            <DraftSummaryBar
              pickedCount={board.items.filter((i) => i.source.kind === "pick" || i.source.kind === "custom").length}
              total={board.items.length}
              warningCount={board.warnings.filter((w) => w.tone === "warning").length}
              canConfirm={board.availability}
              confirming={board.confirming}
              onShowDraft={() => draftHeading.current?.focus()}
              onConfirm={() => void board.confirm()}
            />
          )}
        </div>
      )}
    </div>
  );
}
