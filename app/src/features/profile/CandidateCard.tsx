/**
 * 3안 카드 · 자체 와이어프레임 (DS-2A-04 4.6 · P-AC-24·25·29·30). 엔진 청크 전용.
 * 와이어프레임은 SectionPlan을 프로필 역할 팔레트로 칠한 블록·막대(글자 없음, aria-hidden) — 색은 데이터에서 CSS 변수로 넘긴다(컴포넌트 hex 0).
 * 선택 표시 = 주 색 테두리 + 버튼 글자 "선택됨" + Tag "선택"(색 외 단서 2개, 5.4). 경고는 접힌 상태에서도 Tag "경고 N"(글자).
 */
import type { CSSProperties } from "react";
import { Button } from "../../components/ds/Button";
import { cx } from "../../components/ds/cx";
import { Tag } from "../../components/ds/Tag";
import type { CandidateAxes, CandidatePlan, PlannedSection } from "../../domain/generation";
import type { PaletteRole } from "../../domain/referenceDetail";
import { GRID_LABELS } from "./generationText";
import { MOTION_PRESET_LABELS, sectionLabel } from "./profileFields";

export type WirePalette = Readonly<Record<PaletteRole, string>>;

const HERO_ALIGN: Readonly<Record<string, string>> = {
  center: "items-center justify-center",
  text: "items-start justify-start",
  image: "items-end justify-center",
  grid: "items-end justify-start",
};
const GRID_CELLS: Readonly<Record<CandidateAxes["grid"], string>> = { "grid-3": "grid-cols-3", "grid-2": "grid-cols-2", masonry: "grid-cols-3 grid-flow-dense" };
/** 제목 비율 → 제목 막대 폭 (사다리 밖 값은 가운데) */
const TITLE_WIDTH = (scale: number) => (scale <= 1.2 ? "w-2/5" : scale >= 1.333 ? "w-3/5" : "w-1/2");

function Block({ section, axes, first }: { readonly section: PlannedSection; readonly axes: CandidateAxes; readonly first: boolean }) {
  if (section.type === "header") return <span className="h-1.5 flex-none rounded-xs bg-(--wf-ink)" />;
  if (section.type === "footer") return <span className="h-3 flex-none rounded-xs bg-(--wf-ink)" />;
  if (section.type === "hero")
    return (
      <span className={cx("flex flex-[3] gap-1 rounded-sm bg-(--wf-primary) p-1.5", HERO_ALIGN[axes.heroVariant] ?? "items-center justify-start")}>
        <span className={cx("h-1.5 rounded-xs bg-(--wf-bg)", TITLE_WIDTH(axes.typeScale))} />
        {axes.heroVariant === "split" && <span className="ml-auto h-full w-2/5 rounded-xs bg-(--wf-muted)" />}
      </span>
    );
  if (first)
    return (
      <span className={cx("grid flex-[2] gap-0.5", GRID_CELLS[axes.grid])}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={cx("rounded-xs bg-(--wf-surface)", axes.grid === "masonry" && i % 4 === 0 && "row-span-2")} />
        ))}
      </span>
    );
  return <span className={cx("flex-1 rounded-xs", section.type === "cta-band" || section.type === "contact" ? "bg-(--wf-primary)" : "bg-(--wf-surface)")} />;
}

export function Wireframe({ plan, palette }: { readonly plan: CandidatePlan; readonly palette: WirePalette }) {
  const style = Object.fromEntries(Object.entries(palette).map(([role, hex]) => [`--wf-${role}`, hex])) as CSSProperties;
  const gridAt = plan.sections.findIndex((s) => s.type === "services" || s.type === "portfolio");
  return (
    <div aria-hidden="true" style={style} className="flex aspect-4/5 flex-col gap-1 overflow-hidden rounded-md border border-line-normal bg-(--wf-bg) p-2">
      {plan.sections.map((s, i) => (
        <Block key={i} section={s} axes={plan.axes} first={i === gridAt} />
      ))}
    </div>
  );
}

export const heroText = (axes: CandidateAxes) => sectionLabel("hero", axes.heroVariant);
export const scaleText = (plan: CandidatePlan, profileScale: number) =>
  `비율 ${plan.axes.typeScale}${plan.id === "A" && ![1.2, 1.25, 1.333].includes(profileScale) ? " (프로필)" : ""}`;

export function CandidateCard(props: {
  readonly plan: CandidatePlan;
  readonly palette: WirePalette;
  readonly profileScale: number;
  readonly selected: boolean;
  readonly busy: boolean;
  readonly onSelect: () => void;
}) {
  const { plan, selected } = props;
  const warnings = plan.lint.filter((l) => l.severity === "block");
  return (
    <li className={cx("flex min-w-0 flex-col gap-3 rounded-lg border border-line-normal p-3", selected && "ring-2 ring-primary")}>
      <Wireframe plan={plan} palette={props.palette} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="ds-label">{plan.id}안</h3>
        {selected && <Tag tone="blue">선택</Tag>}
        {warnings.length > 0 && <Tag tone="orange">경고 {warnings.length}</Tag>}
      </div>
      <p className="ds-caption1 text-label-alternative">
        {heroText(plan.axes)} · {GRID_LABELS[plan.axes.grid]} · {scaleText(plan, props.profileScale)}
      </p>
      <Button size="sm" variant={selected ? "primary" : "outline"} aria-pressed={selected} aria-label={`${plan.id}안 선택`} aria-busy={props.busy || undefined} onClick={props.onSelect}>
        {selected ? "선택됨" : "이 안 선택"}
      </Button>
      {/* 상세 1개(기본 접힘) — 로그 3줄 · 경고 상세 · 정보 · 해시 · 섹션 순서 · 전체 로그 (PROFILE-V2-COMPACT 4) */}
      <details className="ds-caption1">
        <summary className="cursor-pointer text-primary-text">상세</summary>
        <div className="mt-2 flex flex-col gap-2 text-label-normal">
          <ol aria-label={`${plan.id}안 로그`} className="flex flex-col gap-1">
            {plan.summary.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ol>
          {plan.lint.map((l) => (
            <p key={l.rule + l.message}>
              {l.rule} · {l.message}
              {l.rule === "R-08" && (
                <>
                  {" "}
                  <a href="#profile-palette" className="text-primary-text underline">
                    팔레트와 대비 보기
                  </a>
                </>
              )}
            </p>
          ))}
          <p className="text-label-alternative">
            결과 해시 <span className="ds-mono">{plan.hash}</span>
          </p>
          <ol className="flex list-decimal flex-col gap-1 pl-5">
            {plan.sections.map((s, i) => (
              <li key={i}>
                {sectionLabel(s.type, s.variant)} · {MOTION_PRESET_LABELS[s.motion]}
              </li>
            ))}
          </ol>
          <ol className="flex flex-col gap-1">
            {plan.log.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>
        </div>
      </details>
    </li>
  );
}
