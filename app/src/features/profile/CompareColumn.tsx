/**
 * 비교 대화상자의 안 열 하나 (M2B-5 SPEC 2.1 3) — 머리(h3) → 미리보기 프레임.
 * 프레임 폭 = 데스크톱 1280 · 모바일 390 rem, 열보다 넓으면 `zoom` 축소(캔버스와 같은 계산, 로컬 사본).
 */
import { useEffect, useRef, useState } from "react";
import type { KitTokenInput } from "../../render/protocol";
import { COMPARE_FRAME_REM, compareRemPx, compareScale, type CompareView } from "./compareFrame";
import { PreviewFrame, type FrameState } from "./PreviewFrame";
import type { ComparePreview } from "./comparePreviews";

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

export function CompareColumn({ preview, kitTokens, view }: { readonly preview: ComparePreview; readonly kitTokens?: KitTokenInput; readonly view: CompareView }) {
  const [area, available] = useWidth();
  const [, setState] = useState<FrameState>("drawing");
  const frameRem = COMPARE_FRAME_REM[view];
  const framePx = frameRem * compareRemPx();
  const scale = compareScale(framePx, available);
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <h3 className="ds-label">{preview.id}안</h3>
      <div ref={area} className="min-w-0">
        {preview.kind === "doc" && preview.write.ok && (
          <PreviewFrame id={preview.id} doc={preview.write.doc} kitTokens={kitTokens} frameRem={frameRem} framePx={framePx} scale={scale} onState={setState} />
        )}
      </div>
    </div>
  );
}
