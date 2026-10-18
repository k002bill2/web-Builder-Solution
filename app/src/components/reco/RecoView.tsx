/**
 * 추천 화면 — `tab=rec`일 때만 받는 청크(RECO-SPEC 3절 · 5절). 점수·근거·카드·상태. 적용 본문은 조작 뒤 청크(RecoApply).
 * 후보 = 라이선스 필터만 건 노출 목록(RQ-04 A — 업종 불일치도 점수로만 밀린다). 알림은 페이지 status 공유(RQ-09 A), alert는 이 영역 1자리.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { parseRecoBrief, recommend, type RecoReason, type RecoResult } from "../../domain/recommend";
import { RECO_SECTION_FIT } from "../../domain/recommendSectionFit";
import type { DesignReference, ReferenceQuery } from "../../domain/reference";
import { useReferenceList } from "../../features/catalog/useReferenceList";
import { COMPARE_LIMIT, COMPARE_LIMIT_NOTICE } from "../../features/compare/compareTray";
import { useCompareTray } from "../../features/compare/CompareTrayContext";
import { ALL_FILTER_GROUPS, FILTER_GROUPS, INDUSTRY_LABELS, PURPOSE_LABELS, VISUAL_TAG_LABELS } from "../../fixtures/catalogFilters";
import type { CatalogFilters } from "../../features/catalog/catalogSearchParams";
import { Button } from "../ds/Button";
import { ReferenceCard } from "../catalog/ReferenceCard";
import { loadRecoApply } from "./recoApplyLoader";
import type { ApplyPlan, ApplyProgress, UndoTicket } from "./recoApplyFlow";
import { recoText } from "./recoText";

type ApplyModule = Awaited<ReturnType<typeof loadRecoApply>>;
const FIRST = 3;

const LABELS: Readonly<Record<string, string>> = {
  ...INDUSTRY_LABELS,
  ...VISUAL_TAG_LABELS,
  ...PURPOSE_LABELS,
  ...Object.fromEntries(FILTER_GROUPS.flatMap((g) => g.options.map((o) => [o.id, o.label]))),
};

function reasonText(r: RecoReason): string {
  return recoText(r.key, { label: r.matched.map((id) => LABELS[id] ?? id).join("·"), points: r.points, max: r.max, value: r.value ?? "" });
}

type Phase =
  | { readonly id: string; readonly kind: "pending" }
  | { readonly id: string; readonly kind: "applied" | "undoing"; readonly ticket: UndoTicket };

interface Alert {
  readonly text: string;
  readonly retry?: () => void;
  readonly key: number;
}

export default function RecoView({
  filters,
  saved,
  onToggleSave,
  onToggleCompare,
  announce,
  openRail,
  known,
}: {
  readonly filters: CatalogFilters;
  readonly saved: ReadonlySet<string>;
  readonly onToggleSave: (id: string) => void;
  readonly onToggleCompare: (id: string) => void;
  readonly announce: (text: string) => void;
  readonly openRail: () => void;
  /** 미리보기 "지금 값" 제목 — 트레이 레퍼런스 */
  readonly known: readonly DesignReference[];
}) {
  const { tray, board, repository, whenIdle, runQueued } = useCompareTray();
  const query = useMemo<ReferenceQuery>(() => (filters.license ? { license: filters.license } : {}), [filters.license]);
  const { items, loaded } = useReferenceList(query);
  const [attempt, setAttempt] = useState(0);
  const computed = useMemo<{ readonly results: readonly RecoResult[] } | { readonly failed: true }>(() => {
    void attempt;
    try {
      return { results: recommend(parseRecoBrief(filters), items, RECO_SECTION_FIT) };
    } catch {
      return { failed: true };
    }
  }, [filters, items, attempt]);
  const [more, setMore] = useState(false);
  const [phase, setPhase] = useState<Phase | null>(null);
  const [alert, setAlert] = useState<Alert | null>(null);
  const [dialog, setDialog] = useState<{ readonly mod: ApplyModule; readonly plan: ApplyPlan } | null>(null);
  const focusNext = useRef<string | null>(null);
  const alertKey = useRef(0);
  const say = (text: string, retry?: () => void) => setAlert({ text, retry, key: (alertKey.current += 1) });

  const byId = useMemo(() => new Map([...known, ...items].map((r) => [r.id, r])), [known, items]);
  const titleOf = (id: string) => byId.get(id)?.title ?? id;

  // 필터 변경으로 결과가 바뀐 경우에만 1회 알림(첫 계산·같은 순위면 0 — 3.6-5)
  const resultKey = loaded && "results" in computed ? computed.results.map((r) => r.referenceId).join(" ") : null;
  const lastKey = useRef<string | null>(null);
  useEffect(() => {
    if (resultKey === null) return;
    if (lastKey.current !== null && lastKey.current !== resultKey && "results" in computed) {
      announce(recoText("reco.status.updated", { n: computed.results.length }));
    }
    lastKey.current = resultKey;
  }, [resultKey, computed, announce]);

  useEffect(() => {
    const target = focusNext.current;
    if (target === null) return;
    focusNext.current = null;
    document.querySelector<HTMLElement>(`[data-reco-focus="${target}"]`)?.focus();
  });

  const focusLater = (id: string) => {
    focusNext.current = id;
  };

  const openPreview = async (id: string) => {
    try {
      const mod = await loadRecoApply();
      setDialog({ mod, plan: await mod.previewApply(repository, whenIdle, id) });
      setAlert(null);
    } catch {
      say(recoText("reco.apply.error"), () => void openPreview(id));
    }
  };

  const apply = async (mod: ApplyModule, plan: ApplyPlan, progress?: ApplyProgress) => {
    const id = plan.referenceId;
    setPhase({ id, kind: "pending" });
    const outcome = await mod.runApply(runQueued, repository, plan, progress);
    if (outcome.kind === "applied") {
      setPhase({ id, kind: "applied", ticket: { referenceId: id, before: plan.before, added: outcome.added, revision: outcome.revision } });
      setAlert(null);
      announce(recoText("reco.status.applied", { title: titleOf(id) }));
      focusLater(`undo:${id}`);
      return;
    }
    setPhase(null);
    if (outcome.kind === "conflict") say(recoText("reco.apply.conflict"), () => void openPreview(id));
    else say(recoText("reco.apply.error"), () => void apply(mod, plan, outcome.progress));
  };

  const undo = async (mod: ApplyModule, ticket: UndoTicket) => {
    const id = ticket.referenceId;
    setPhase({ id, kind: "undoing", ticket });
    const outcome = await mod.runUndo(runQueued, repository, ticket);
    if (outcome.kind === "undone") {
      setPhase(null);
      setAlert(null);
      announce(recoText("reco.status.undone", { title: titleOf(id) }));
      focusLater(`apply:${id}`);
      return;
    }
    if (outcome.kind === "stale") {
      setPhase({ id, kind: "applied", ticket });
      say(recoText("reco.undo.stale"));
      return;
    }
    setPhase({ id, kind: "applied", ticket: outcome.ticket });
    say(recoText("reco.undo.error"), () => void undo(mod, outcome.ticket));
  };

  const alertLine = alert && (
    <div key={alert.key} role="alert" className="mb-4 flex flex-wrap items-center gap-2 rounded-md bg-fill-normal px-4 py-3">
      <p className="ds-body3 text-status-negative-text">{alert.text}</p>
      {alert.retry && (
        <Button size="sm" variant="outline" onClick={alert.retry}>
          {recoText("reco.retry")}
        </Button>
      )}
    </div>
  );

  if ("failed" in computed) {
    return (
      <div key={attempt} role="alert" className="flex flex-wrap items-center gap-2 py-8">
        <p className="ds-body3 text-status-negative-text">{recoText("reco.error")}</p>
        <Button size="sm" variant="outline" onClick={() => setAttempt((n) => n + 1)}>
          {recoText("reco.retry")}
        </Button>
      </div>
    );
  }

  if (!loaded) {
    return (
      <div aria-busy="true" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((n) => (
          <div key={n} className="aspect-4/3 animate-pulse rounded-lg bg-fill-normal" />
        ))}
      </div>
    );
  }

  const { results } = computed;
  if (results.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="ds-body1 text-label-normal">{recoText("reco.empty.noBrief")}</p>
        <div className="mt-3 flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => document.querySelector<HTMLElement>('[role="group"][aria-label="업종"] button')?.focus()}>
            {recoText("reco.empty.pickIndustry")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              openRail();
              setTimeout(() => {
                const name = ALL_FILTER_GROUPS.find((g) => g.key === "purpose")?.name;
                const legend = [...document.querySelectorAll("legend")].find((l) => l.textContent === name);
                legend?.parentElement?.querySelector<HTMLElement>("input")?.focus();
              });
            }}
          >
            {recoText("reco.empty.pickPurpose")}
          </Button>
        </div>
      </div>
    );
  }

  const shown = more ? results : results.slice(0, FIRST);
  return (
    <>
      {alertLine}
      {results.length < FIRST && <p className="ds-body3 mb-3 text-label-alternative">{recoText("reco.few", { n: results.length })}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((result, index) => {
          const reference = byId.get(result.referenceId);
          if (!reference) return null;
          const mine = phase?.id === result.referenceId ? phase : null;
          return (
            <ReferenceCard
              key={result.referenceId}
              reference={reference}
              saved={saved.has(result.referenceId)}
              inTray={tray.includes(result.referenceId)}
              onToggleSave={onToggleSave}
              onToggleCompare={onToggleCompare}
            >
              <RecoLines
                rank={index + 1}
                result={result}
                phase={mine}
                blocked={tray.length >= COMPARE_LIMIT && !tray.includes(result.referenceId)}
                undoStale={mine?.kind === "applied" && board.revision !== mine.ticket.revision}
                onApply={() => void openPreview(result.referenceId)}
                onUndo={() => {
                  if (mine?.kind !== "applied") return;
                  void loadRecoApply().then(
                    (mod) => undo(mod, mine.ticket),
                    () => say(recoText("reco.undo.error")),
                  );
                }}
              />
            </ReferenceCard>
          );
        })}
      </div>
      {!more && results.length > FIRST && (
        <Button variant="assistive" size="sm" className="mt-4" onClick={() => setMore(true)}>
          {recoText("reco.more", { n: results.length - FIRST })}
        </Button>
      )}
      {dialog && (
        <dialog.mod.default
          title={titleOf(dialog.plan.referenceId)}
          plan={dialog.plan}
          titleOf={titleOf}
          text={recoText}
          onCancel={() => {
            focusLater(`apply:${dialog.plan.referenceId}`);
            setDialog(null);
          }}
          onConfirm={() => {
            setDialog(null);
            void apply(dialog.mod, dialog.plan);
          }}
        />
      )}
    </>
  );
}

function RecoLines({
  rank,
  result,
  phase,
  blocked,
  undoStale,
  onApply,
  onUndo,
}: {
  readonly rank: number;
  readonly result: RecoResult;
  readonly phase: Phase | null;
  readonly blocked: boolean;
  readonly undoStale: boolean;
  readonly onApply: () => void;
  readonly onUndo: () => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = `${result.referenceId}-reasons`;
  const id = result.referenceId;
  const pending = phase?.kind === "pending";
  const applied = phase?.kind === "applied" || phase?.kind === "undoing";
  return (
    <div className="mt-2 flex flex-col gap-2 border-t border-line-alternative pt-2">
      <p className="ds-label flex items-center gap-2 text-label-normal tabular-nums">
        <span>{recoText("reco.rank", { rank })}</span>
        <span className="text-primary-text">{recoText("reco.total", { points: result.total })}</span>
      </p>
      <p className="ds-caption1 text-label-alternative">{result.reasons.map(reasonText).join(" · ")}</p>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="ds-caption1 self-start rounded-xs text-primary-text hover:underline focus-visible:shadow-(--focus-ring) focus-visible:outline-none"
      >
        {recoText("reco.reasons.toggle")}
      </button>
      <ul id={listId} aria-label={recoText("reco.reasons.label")} hidden={!open} className="ds-caption1 flex flex-col gap-0.5 text-label-alternative">
        {result.breakdown.map((r) => (
          <li key={r.item} className="flex justify-between gap-2">
            <span className="min-w-0 break-words">{reasonText(r)}</span>
            <span className="flex-none tabular-nums">{recoText("reco.item.points", { points: r.points, max: r.max })}</span>
          </li>
        ))}
      </ul>
      {applied ? (
        <div className="flex flex-col gap-1">
          <p className="ds-caption1 font-semibold text-label-normal">{recoText("reco.apply.done")}</p>
          <Button
            data-reco-focus={`undo:${id}`}
            variant="outline"
            size="sm"
            fullWidth
            aria-busy={phase?.kind === "undoing" || undefined}
            aria-disabled={undoStale || phase?.kind === "undoing" || undefined}
            onClick={() => {
              if (!undoStale && phase?.kind === "applied") onUndo();
            }}
          >
            {recoText("reco.undo")}
          </Button>
          {undoStale && <p className="ds-caption2 text-label-alternative">{recoText("reco.undo.stale")}</p>}
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <Button
            data-reco-focus={`apply:${id}`}
            size="sm"
            fullWidth
            aria-busy={pending || undefined}
            aria-disabled={blocked || pending || undefined}
            onClick={() => {
              if (!blocked && !pending) onApply();
            }}
          >
            {pending ? recoText("reco.apply.pending") : recoText("reco.apply")}
          </Button>
          {blocked && <p className="ds-caption2 text-label-alternative">{COMPARE_LIMIT_NOTICE}</p>}
        </div>
      )}
    </div>
  );
}
