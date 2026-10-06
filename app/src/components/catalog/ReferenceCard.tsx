import { Link } from "react-router";
import type { DesignReference } from "../../domain/reference";
import { INDUSTRY_LABELS, LAYOUT_LABELS, MOTION_LABELS, VISUAL_TAG_LABELS } from "../../fixtures/catalogFilters";
import { Icon, type IconName } from "../ds/Icon";
import { Tag } from "../ds/Tag";
import { LICENSE_TONE } from "./referenceDisplay";

export interface ReferenceCardProps {
  readonly reference: DesignReference;
  readonly saved: boolean;
  readonly inTray: boolean;
  readonly onToggleSave: (id: string) => void;
  readonly onToggleCompare: (id: string) => void;
}

/** 자체 렌더 와이어프레임 썸네일 — 외부 캡처를 쓰지 않는다. 색은 레퍼런스 팔레트 데이터에서 온다. */
function Thumbnail({ reference: r }: { readonly reference: DesignReference }) {
  const p = r.colorPalette;
  return (
    <div
      role="img"
      aria-label={`${r.title} 썸네일 (자체 렌더 플레이스홀더)`}
      className="relative flex aspect-video flex-col gap-1.5 rounded-lg bg-background-alternative px-3.5 py-3 sm:aspect-[4/3]"
    >
      <div className="flex h-1.25 w-full justify-between">
        <span className="h-1.25 w-7 rounded-[--spacing(0.5)]" style={{ backgroundColor: p.ink }} />
        <span className="h-1.25 w-12 rounded-[--spacing(0.5)] bg-line-normal" />
      </div>
      <div className="flex flex-1 items-end rounded-[--spacing(1.5)] p-2.5" style={{ backgroundColor: p.primary }}>
        <span className="h-2 w-[44%] rounded-[--spacing(0.5)] opacity-90" style={{ backgroundColor: p.surface }} />
      </div>
      <div className="flex h-5.5 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex-1 rounded-xs border border-line-alternative bg-surface-elevated" />
        ))}
      </div>
      <div className="absolute top-2.5 right-2.5">
        <Tag tone={LICENSE_TONE[r.licenseStatus]} size="sm">
          {r.licenseStatus}
        </Tag>
      </div>
    </div>
  );
}

function Palette({ reference: r }: { readonly reference: DesignReference }) {
  const colors = [r.colorPalette.primary, r.colorPalette.surface, r.colorPalette.ink];
  return (
    <span role="img" aria-label={`대표 색상 ${colors.join(" · ")}`} className="inline-flex gap-1">
      {colors.map((c) => (
        <span key={c} className="size-3 rounded-full border border-line-alternative" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

/**
 * 32px ghost 아이콘 버튼 (v2 SPEC 4.2 "카드 버튼", WCAG 2.5.8).
 * 이름은 aria-label 대신 화면에 안 보이는 본문으로 준다 — 상태 글자("비교 중")가 버튼 글자로 남는다.
 */
function CardIconButton({
  label,
  icon,
  active,
  pressed,
  onClick,
}: {
  readonly label: string;
  readonly icon: IconName;
  readonly active: boolean;
  readonly pressed?: boolean;
  readonly onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        "inline-flex size-8 flex-none cursor-pointer items-center justify-center rounded-sm " +
        "transition-colors duration-(--duration-fast) ease-standard hover:bg-fill-normal " +
        "focus-visible:outline-none focus-visible:shadow-(--focus-ring) " +
        (active ? "text-primary" : "text-label-alternative hover:text-label-normal")
      }
    >
      <Icon name={icon} size={20} />
      <span className="sr-only">{label}</span>
    </button>
  );
}

/** ISO 날짜(YYYY-MM-DD) → 카드 표기(MM.DD). 연도는 `<time dateTime>`에 남긴다. */
const monthDay = (iso: string) => iso.slice(5).replace("-", ".");

/** 2a-01 카탈로그 카드 v2 (SPEC 4.2 "카드 FR-CAT-02"·"카드 버튼", C-03·C-04). */
export function ReferenceCard({ reference: r, saved, inTray, onToggleSave, onToggleCompare }: ReferenceCardProps) {
  const titleId = `${r.id}-title`;
  const tags = r.visualTags.map((t) => VISUAL_TAG_LABELS[t]);
  return (
    <article aria-labelledby={titleId} className="relative flex flex-col gap-2">
      <Thumbnail reference={r} />
      {r.sourceKind === "library_composition" && (
        <Tag size="sm" className="absolute top-9 right-2.5">
          생성 조합
        </Tag>
      )}
      <div className="min-w-0">
        <h3 id={titleId} className="ds-body2 font-semibold text-label-normal">
          <Link to={`/references/${r.id}`} className="line-clamp-2 rounded-xs hover:text-primary focus-visible:shadow-(--focus-ring) focus-visible:outline-none">
            {r.title}
          </Link>
        </h3>
        <p className="ds-caption1 mt-0.5 text-label-alternative">
          {INDUSTRY_LABELS[r.industry]} · {LAYOUT_LABELS[r.layoutType]} · 모션 {MOTION_LABELS[r.motionLevel]}
        </p>
        <p className="ds-caption2 text-label-alternative">
          {[...tags, r.responsive ? "반응형 지원" : "반응형 미지원"].join(" · ")}
        </p>
        <p className="ds-caption2 mt-1 text-label-alternative tabular-nums">
          {!("status" in r.scores) ? (
            <>
              접근성 <b className="font-semibold text-label-neutral">{r.scores.accessibility}</b> · 성능{" "}
              <b className="font-semibold text-label-neutral">{r.scores.performance}</b> ·{" "}
              <time dateTime={r.scores.measuredAt}>{monthDay(r.scores.measuredAt)}</time> 측정
            </>
          ) : (
            "접근성·성능 미측정"
          )}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2">
        <Palette reference={r} />
        <span className="inline-flex gap-1">
          <CardIconButton
            label={`${r.title} 저장`}
            icon={saved ? "bookmark-fill" : "bookmark"}
            active={saved}
            pressed={saved}
            onClick={() => onToggleSave(r.id)}
          />
          <CardIconButton
            label={inTray ? `${r.title} 비교 중, 비교에서 빼기` : `${r.title} 비교 추가`}
            icon={inTray ? "check" : "plus"}
            active={inTray}
            onClick={() => onToggleCompare(r.id)}
          />
        </span>
      </div>
    </article>
  );
}
