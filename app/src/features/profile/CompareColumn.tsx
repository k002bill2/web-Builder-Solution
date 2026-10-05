/**
 * 비교 대화상자의 안 열 하나 (M2B-5 SPEC 2.1 3 · 2.5 · 2.6 · 3.3) — 머리(h3 · Tag) → 차이 요약 → 바뀐 쌍 → 상태 줄 → 미리보기 프레임.
 * 프레임 폭 = 데스크톱 1280 · 모바일 390 rem, 열보다 넓으면 `zoom` 축소(캔버스와 같은 계산, 로컬 사본).
 * 그리지 못함·변환 불가 = 프레임 자리에 그 안의 Wireframe(이미 받은 결과 청크 부품) · 만들지 못한 안 = 문장만. 시간 초과 = "다시 그리기"(이 열 프레임만 재마운트).
 */
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../../components/ds/Button";
import { Tag } from "../../components/ds/Tag";
import type { CandidateId } from "../../domain/generation";
import type { KitTokenInput } from "../../render/protocol";
import type { WirePalette } from "./CandidateCard";
import type { CandidateParts } from "./CompareDialog";
import { COMPARE_FRAME_REM, compareRemPx, compareScale, compareScaleCaption, type CompareView } from "./compareFrame";
import type { ComparePreview } from "./comparePreviews";
import { COMPARE_TEXT, type FrameCategory } from "./compareText";
import { failureText, GRID_LABELS } from "./generationText";
import { PreviewFrame, type FrameState } from "./PreviewFrame";

/** 열 안쪽 폭(px) — ResizeObserver가 없으면(jsdom) 0 = 측정 전(축소 1) */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

const CATEGORY: Readonly<Record<FrameState, FrameCategory | undefined>> = { drawing: undefined, drawn: "drawn", nokit: "plain", invalid: "structure", timeout: "delay" };

export function CompareColumn({
  preview,
  kitTokens,
  view,
  parts,
  palette,
  profileScale,
  onCategory,
}: {
  readonly preview: ComparePreview;
  readonly kitTokens?: KitTokenInput;
  readonly view: CompareView;
  readonly parts: CandidateParts;
  readonly palette: WirePalette;
  readonly profileScale: number;
  readonly onCategory: (id: CandidateId, category: FrameCategory | undefined) => void;
}) {
  const headingId = useId();
  const [area, available] = useWidth();
  const [state, setState] = useState<FrameState>("drawing");
  const [attempt, setAttempt] = useState(0);
  const frameRem = COMPARE_FRAME_REM[view];
  const framePx = frameRem * compareRemPx();
  const scale = compareScale(framePx, available);
  const plan = preview.kind === "doc" ? preview.plan : undefined;
  const write = preview.kind === "doc" ? preview.write : undefined;
  const category: FrameCategory | undefined =
    preview.kind === "failed" ? "failed" : preview.kind === "pending" ? undefined : write?.ok === false ? "structure" : CATEGORY[state];
  useEffect(() => onCategory(preview.id, category), [onCategory, preview.id, category]);

  const line =
    preview.kind === "failed"
      ? failureText(preview.failure)
      : preview.kind === "pending"
        ? COMPARE_TEXT.pending
        : write?.ok === false
          ? write.alert
          : { drawing: COMPARE_TEXT.drawing, drawn: compareScaleCaption(scale), nokit: COMPARE_TEXT.noKit, invalid: COMPARE_TEXT.invalid, timeout: COMPARE_TEXT.timeout }[state];
  const warnings = plan?.lint.filter((l) => l.severity === "block").length ?? 0;
  const fallback = plan && (write?.ok === false || state === "invalid");
  return (
    <section aria-labelledby={headingId} className="flex min-w-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <h3 id={headingId} className="ds-label">
          {preview.id}안
        </h3>
        {warnings > 0 && <Tag tone="orange">경고 {warnings}</Tag>}
      </div>
      {plan && (
        <p className="ds-caption1 text-label-alternative">
          {parts.heroText(plan.axes)} · {GRID_LABELS[plan.axes.grid]} · {parts.scaleText(plan, profileScale)} (구조안)
        </p>
      )}
      {write?.ok && write.changeNotice && <p className="ds-caption1 text-label-alternative">{write.changeNotice}</p>}
      {line && <p className="ds-caption1 text-label-alternative">{line}</p>}
      {state === "timeout" && (
        <Button
          size="sm"
          variant="outline"
          className="self-start"
          onClick={() => {
            setState("drawing");
            setAttempt((n) => n + 1);
          }}
        >
          {COMPARE_TEXT.redraw}
        </Button>
      )}
      <div ref={area} className="min-w-0">
        {fallback ? (
          <parts.Wireframe plan={plan} palette={palette} />
        ) : (
          write?.ok && (
            <PreviewFrame key={attempt} id={preview.id} doc={write.doc} kitTokens={kitTokens} frameRem={frameRem} framePx={framePx} scale={scale} onState={setState} />
          )
        )}
      </div>
    </section>
  );
}
