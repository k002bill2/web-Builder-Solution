import { Link } from "react-router";
import type { DesignReference, LicenseStatus } from "../../domain/reference";
import { INDUSTRY_LABELS, LAYOUT_LABELS, MOTION_LABELS, VISUAL_TAG_LABELS } from "../../fixtures/catalogFilters";
import { Button } from "../ds/Button";
import { Icon } from "../ds/Icon";
import { Tag, type TagTone } from "../ds/Tag";

export interface ReferenceCardProps {
  readonly reference: DesignReference;
  readonly saved: boolean;
  readonly inTray: boolean;
  readonly onToggleSave: (id: string) => void;
  readonly onToggleCompare: (id: string) => void;
}

const LICENSE_TONE: Record<LicenseStatus, TagTone> = {
  internal: "green",
  licensed: "violet",
  external_observed: "neutral",
};

const formatDate = (iso: string) => iso.replaceAll("-", ".");

/** 자체 렌더 와이어프레임 썸네일 — 외부 캡처를 쓰지 않는다. 색은 레퍼런스 팔레트 데이터에서 온다. */
function Thumbnail({ reference: r }: { readonly reference: DesignReference }) {
  const p = r.colorPalette;
  return (
    <div
      role="img"
      aria-label={`${r.title} 썸네일 (자체 렌더 플레이스홀더)`}
      className="relative flex aspect-[16/10] flex-col gap-1.5 bg-background-alternative px-3.5 py-3"
    >
      <div className="flex h-1.25 w-full justify-between">
        <span className="h-1.25 w-7 rounded-[--spacing(0.5)]" style={{ backgroundColor: p.ink }} />
        <span className="h-1.25 w-12 rounded-[--spacing(0.5)] bg-cool-neutral-90" />
      </div>
      <div className="flex flex-1 items-end rounded-[--spacing(1.5)] p-2.5" style={{ backgroundColor: p.primary }}>
        <span className="h-2 w-[44%] rounded-[--spacing(0.5)] opacity-90" style={{ backgroundColor: p.surface }} />
      </div>
      <div className="flex h-5.5 gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="flex-1 rounded-xs border border-line-alternative bg-common-100" />
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
    <span role="img" aria-label={`대표 색상 ${colors.join(" · ")}`} className="ml-auto inline-flex gap-0.75">
      {colors.map((c) => (
        <span key={c} className="size-3.5 rounded-full border border-line-alternative" style={{ backgroundColor: c }} />
      ))}
    </span>
  );
}

/** 1a-01 카탈로그 카드 (목업 93~111행). */
export function ReferenceCard({ reference: r, saved, inTray, onToggleSave, onToggleCompare }: ReferenceCardProps) {
  const titleId = `${r.id}-title`;
  return (
    <article aria-labelledby={titleId} className="overflow-hidden rounded-lg border border-line-neutral bg-surface-elevated">
      <Thumbnail reference={r} />
      <div className="px-4 pt-3.5 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 id={titleId} className="ds-heading2 text-label-normal">
              <Link to={`/references/${r.id}`} className="hover:text-primary focus-visible:underline focus-visible:outline-none">
                {r.title}
              </Link>
            </h3>
            <div className="ds-caption1 mt-0.5 text-label-alternative">
              {INDUSTRY_LABELS[r.industry]} · {LAYOUT_LABELS[r.layoutType]}
            </div>
          </div>
          <button
            type="button"
            aria-label={`${r.title} 저장`}
            aria-pressed={saved}
            onClick={() => onToggleSave(r.id)}
            className={
              "-m-1 flex-none cursor-pointer rounded-sm p-1 transition-colors duration-(--duration-fast) ease-standard " +
              "focus-visible:outline-none focus-visible:shadow-(--focus-ring) " +
              (saved ? "text-primary" : "text-label-alternative hover:text-label-normal")
            }
          >
            <Icon name={saved ? "bookmark-fill" : "bookmark"} size={20} />
          </button>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {r.visualTags.map((t) => (
            <Tag key={t} tone="neutral" size="sm">
              {VISUAL_TAG_LABELS[t]}
            </Tag>
          ))}
          <Palette reference={r} />
        </div>
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line-alternative pt-2.5">
          <span className="ds-caption1 text-label-alternative">
            접근성 <b className="text-label-normal">{r.scores.accessibility}</b> · 성능{" "}
            <b className="text-label-normal">{r.scores.performance}</b> · 모션 {MOTION_LABELS[r.motionLevel]}
          </span>
          <Button
            variant={inTray ? "assistive" : "outline"}
            size="sm"
            aria-label={`${r.title} 비교 추가`}
            aria-pressed={inTray}
            onClick={() => onToggleCompare(r.id)}
          >
            {inTray ? "비교 중" : "비교 추가"}
          </Button>
        </div>
        <div className="ds-caption2 mt-1.5 text-label-assistive">
          점수 측정 {formatDate(r.scores.measuredAt)} · {r.responsive ? "반응형 지원" : "반응형 미지원"}
        </div>
      </div>
    </article>
  );
}
