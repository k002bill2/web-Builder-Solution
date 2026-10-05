import { useState } from "react";
import { retryableImport } from "../../data/chunkRetry";
import type { PreviewView } from "../../features/detail/previewView";
import type { PngRequest } from "../../features/studio/png/pngCapture";
import { FRAME_REM, PREVIEW_WIDTH_OPTIONS } from "../../features/studio/previewFrame";

/** 캡처 청크(조작 뒤 — m2a 3.3 "캡처 라이브러리는 누른 뒤에만") */
const loadPng = retryableImport(() => import("../../features/studio/png/pngCapture"));

/**
 * PNG 내려받기 (m2a 3.3 · K-AC-19) — 내보내기 묶음 다음. `requestExport` 밖, 게이트·폴백 차단과 무관하게 열림(이유 목록과 describedby 분리).
 * 성공 문장·계측은 캡처 청크가 만든다. 실패 문장은 여기 — 캡처 청크를 받지 못해도 떠야 한다(M2A-3a Codex P2-1 r2).
 */
export function PngSave({
  ready,
  reason = "미리보기를 그리는 중입니다",
  view,
  fallbackCount,
  capture,
}: {
  readonly ready: boolean;
  /** 준비 전 이유 — 기본 = 캔버스·저장 대기 문장 */
  readonly reason?: string;
  readonly view: PreviewView;
  readonly fallbackCount: number;
  readonly capture: () => PngRequest;
}) {
  const [state, setState] = useState<{ readonly busy?: true; readonly done?: string; readonly failed?: string }>({});
  const press = () => {
    if (!ready || state.busy) return;
    setState({ busy: true });
    loadPng()
      .then((png) => png.savePng(capture()))
      .then(
        (done) => setState({ done }),
        (error: unknown) => {
          void loadPng().then((png) => png.reportFailure(error), () => undefined);
          // 이미지 decode 실패(SPEC m2c 5.3-3)만 문구가 다르다 — 캡처 청크를 받지 못해도 떠야 하므로 코드 글자로 가른다
          setState({ failed: (error as { readonly code?: unknown } | null)?.code === "IMAGE_DECODE_FAILED" ? "이미지를 그리지" : "PNG를 만들지" });
        },
      );
  };
  return (
    <div className="flex flex-col items-start gap-2 border-t border-line-normal pt-3">
      <h3 className="ds-caption1 text-label-alternative">이미지로 저장</h3>
      <button
        type="button"
        aria-disabled={!ready || state.busy || undefined}
        aria-busy={state.busy}
        aria-describedby={ready ? "png-caption" : "png-wait png-caption"}
        onClick={press}
        className="ds-label min-h-10 rounded-md border border-line-normal px-4 text-label-normal hover:bg-fill-normal aria-disabled:cursor-not-allowed aria-disabled:text-label-disable"
      >
        {state.busy ? "PNG 만드는 중…" : "PNG 내려받기"}
      </button>
      {!ready && (
        <p id="png-wait" className="ds-caption1 text-label-neutral">
          {reason}
        </p>
      )}
      <p id="png-caption" className="ds-caption1 text-label-alternative">
        지금 미리보기 폭({PREVIEW_WIDTH_OPTIONS.find((o) => o.value === view)?.label} · {FRAME_REM[view] * 16})의 페이지 전체를 한 장으로 저장합니다.
        {fallbackCount > 0 && ` 구조 미리보기 섹션 ${fallbackCount}개는 표식과 함께 담깁니다.`}
      </p>
      <p role="status" className="ds-caption1">
        {state.done}
      </p>
      {state.failed && (
        <p role="alert" className="ds-caption1 text-status-negative-text">
          {state.failed} 못했습니다 — 다시 눌러 주세요
        </p>
      )}
    </div>
  );
}
