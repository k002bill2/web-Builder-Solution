import { Link } from "react-router";
import type { DesignReference } from "../../domain/reference";
import type { ReferenceDetail, SimilarGroup, SimilarKind } from "../../domain/referenceDetail";
import { formatDate } from "../catalog/referenceDisplay";
import { Button } from "../ds/Button";

const SIMILAR_LABELS: Readonly<Record<SimilarKind, string>> = {
  industry: "유사 업종",
  concept: "유사 콘셉트",
  layout: "유사 레이아웃",
};

/** Lighthouse 구간: 90 이상 양호, 50 이상 보통, 그 아래 미흡. */
const scoreTone = (score: number) =>
  score >= 90 ? "text-status-positive" : score >= 50 ? "text-status-cautionary" : "text-status-negative";

function ScoreTile({ label, score }: { readonly label: string; readonly score: number }) {
  return (
    <div className="rounded-md bg-background-alternative p-3">
      <div className="ds-caption1 text-label-alternative">{label}</div>
      <div className={`text-title1 font-bold ${scoreTone(score)}`}>{score}</div>
    </div>
  );
}

/** 점수·액션 카드 (목업 157~163행). */
export function ScoreActionsCard({
  reference: r,
  detail,
  saved,
  inTray,
  notice,
  onImportTemplate,
  onToggleSave,
  onToggleCompare,
}: {
  readonly reference: DesignReference;
  readonly detail: ReferenceDetail;
  readonly saved: boolean;
  readonly inTray: boolean;
  readonly notice: string | null;
  readonly onImportTemplate: () => void;
  readonly onToggleSave: () => void;
  readonly onToggleCompare: () => void;
}) {
  return (
    <section aria-label="점수" className="flex flex-col gap-2.5 rounded-lg border border-line-neutral p-5">
      <div className="grid grid-cols-2 gap-2.5">
        <ScoreTile label="접근성" score={r.scores.accessibility} />
        <ScoreTile label="성능" score={r.scores.performance} />
      </div>
      <div className="ds-caption2 text-label-assistive">
        측정 {formatDate(r.scores.measuredAt)} · {detail.measuredWith}
      </div>
      <Button variant="primary" size="lg" fullWidth onClick={onImportTemplate}>
        템플릿으로 가져오기
      </Button>
      <div className="flex gap-2">
        <Button
          variant="outline"
          leadingIcon={saved ? "bookmark-fill" : "bookmark"}
          fullWidth
          aria-pressed={saved}
          onClick={onToggleSave}
        >
          저장
        </Button>
        <Button
          variant={inTray ? "assistive" : "outline"}
          leadingIcon={inTray ? undefined : "plus"}
          fullWidth
          aria-label={inTray ? "비교 중, 비교에서 빼기" : undefined}
          onClick={onToggleCompare}
        >
          {inTray ? "비교 중" : "비교 추가"}
        </Button>
      </div>
      <p role="status" className="ds-caption1 text-label-alternative empty:hidden">
        {notice}
      </p>
    </section>
  );
}

/** 유사 레퍼런스 3그룹 (목업 165~171행). 각 항목은 해당 상세로 이동한다. */
export function SimilarReferences({ groups }: { readonly groups: readonly SimilarGroup[] }) {
  return (
    <section aria-labelledby="similar-heading" className="rounded-lg border border-line-neutral p-5">
      <h2 id="similar-heading" className="ds-heading2 mb-3">
        유사 레퍼런스
      </h2>
      <div className="flex flex-col gap-3.5">
        {groups.map((g) => (
          <div key={g.kind}>
            <h3 className="ds-caption1 mb-2 text-label-alternative">{SIMILAR_LABELS[g.kind]}</h3>
            {g.items.length === 0 ? (
              <p className="ds-caption2 text-label-assistive">추천할 레퍼런스가 없습니다</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {g.items.map((r) => (
                  <li key={r.id} className="min-w-0">
                    <Link
                      to={`/references/${r.id}`}
                      title={r.title}
                      className={
                        "block rounded-sm border border-line-alternative p-1.5 hover:border-line-strong " +
                        "focus-visible:outline-none focus-visible:shadow-(--focus-ring)"
                      }
                    >
                      <span className="block h-8 rounded-xs" style={{ backgroundColor: r.colorPalette.primary }} />
                      <span className="ds-caption2 mt-1.5 line-clamp-2">{r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
