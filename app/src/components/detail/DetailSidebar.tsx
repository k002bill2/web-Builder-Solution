import { Link } from "react-router";
import type { DesignReference } from "../../domain/reference";
import type { ReferenceDetail, SimilarGroup, SimilarKind } from "../../domain/referenceDetail";
import { COMPARE_LIMIT_NOTICE } from "../../features/compare/compareTray";
import { MOTION_LABELS } from "../../fixtures/catalogFilters";
import { formatDate } from "../catalog/referenceDisplay";
import { Button } from "../ds/Button";

const SIMILAR_LABELS: Readonly<Record<SimilarKind, string>> = {
  industry: "유사 업종",
  concept: "유사 콘셉트",
  layout: "유사 레이아웃",
};

/** 정보 패널 알림 종류 — "보드 열기" 링크는 담기 성공·가득 참에만 (A11Y-01 8절 D-QA06). */
export type DetailNotice = "template" | "added" | "limit" | "removed";

const NOTICE_TEXT: Readonly<Record<DetailNotice, string>> = {
  template: "템플릿으로 가져오기는 다음 단계(디자인 프로필)에서 제공됩니다.",
  added: "비교 보드에 담았습니다",
  limit: COMPARE_LIMIT_NOTICE,
  removed: "비교 보드에서 뺐습니다",
};

const NOTICE_WITH_BOARD_LINK: ReadonlySet<DetailNotice> = new Set(["added", "limit"]);

/** Lighthouse 구간: 90 이상 양호, 50 이상 보통, 그 아래 미흡. */
const scoreTone = (score: number) =>
  score >= 90 ? "text-status-positive-text" : score >= 50 ? "text-status-cautionary-text" : "text-status-negative-text";

function ScoreTile({ label, value, tone }: { readonly label: string; readonly value: string; readonly tone?: string }) {
  return (
    <div>
      <div className="ds-label text-label-neutral">{label}</div>
      <div className={`ds-title2 font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
    </div>
  );
}

/** 점수 3칸 — 접근성·성능·모션 (목업 2a-02). 숫자 색 status-*-text (D-A11Y-N1). */
export function ScoreTiles({ reference: r, detail }: { readonly reference: DesignReference; readonly detail: ReferenceDetail }) {
  const s = r.scores;
  const measured = !("status" in s);
  return (
    <section aria-label="점수">
      <div className="grid grid-cols-3 gap-2.5">
        <ScoreTile label="접근성" value={measured ? String(s.accessibility) : "미측정"} tone={measured ? scoreTone(s.accessibility) : undefined} />
        <ScoreTile label="성능" value={measured ? String(s.performance) : "미측정"} tone={measured ? scoreTone(s.performance) : undefined} />
        <ScoreTile label="모션" value={MOTION_LABELS[r.motionLevel]} />
      </div>
      <div className="ds-caption2 mt-1.5 text-label-alternative">
        {measured ? `측정 ${formatDate(s.measuredAt)} · ${detail.measuredWith}` : "접근성·성능 미측정"}
      </div>
    </section>
  );
}

/** 저장·비교·템플릿 (정보 패널 하단). "비교 중"도 outline 유지 + check + 글자 (SPEC 4.3). */
export function DetailActions({
  saved,
  inTray,
  notice,
  onImportTemplate,
  onToggleSave,
  onToggleCompare,
}: {
  readonly saved: boolean;
  readonly inTray: boolean;
  readonly notice: DetailNotice | null;
  readonly onImportTemplate: () => void;
  readonly onToggleSave: () => void;
  readonly onToggleCompare: () => void;
}) {
  // lg 2단에서 정보 패널(flex-col, 그리드 행 높이로 늘어남) 바닥에 붙인다. 모바일은 흐름 그대로.
  return (
    <div className="flex flex-col gap-2 lg:mt-auto">
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
          variant="outline"
          leadingIcon={inTray ? "check" : "plus"}
          fullWidth
          aria-label={inTray ? "비교 중, 비교에서 빼기" : undefined}
          onClick={onToggleCompare}
        >
          {inTray ? "비교 중" : "비교 추가"}
        </Button>
      </div>
      {/* 알림 영역은 비어도 접근성 트리에 남긴다(display:none 금지). 링크는 라이브 영역 밖 형제 (A11Y-01 8절) */}
      <div className="ds-caption1 min-h-4.5 text-label-alternative">
        <p role="status" className="inline">
          {notice && NOTICE_TEXT[notice]}
        </p>
        {notice && NOTICE_WITH_BOARD_LINK.has(notice) && (
          <>
            <span aria-hidden="true"> · </span>
            <Link to="/compare" className="rounded-xs text-primary-text underline focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
              보드 열기
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

/** 유사 레퍼런스 3그룹 — 아래 영역 전폭 (C-07). 각 항목은 해당 상세로 이동한다. */
export function SimilarReferences({ groups }: { readonly groups: readonly SimilarGroup[] }) {
  return (
    <section aria-labelledby="similar-heading">
      <h2 id="similar-heading" className="ds-heading2 mb-3">
        유사 레퍼런스
      </h2>
      <div className="grid gap-5 md:grid-cols-3">
        {groups.map((g) => (
          <div key={g.kind} className="min-w-0">
            <h3 className="ds-label mb-2 text-label-neutral">{SIMILAR_LABELS[g.kind]}</h3>
            {g.items.length === 0 ? (
              <p className="ds-caption2 text-label-alternative">추천할 레퍼런스가 없습니다</p>
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
