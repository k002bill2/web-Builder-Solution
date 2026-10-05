/**
 * 비교 전용 렌더 문서 프레임 (M2B-5 SPEC 2.2 · 3.1 · 3.3 · 4 · 5) — 캔버스 `useRenderFrame`과 같은 다리를 비교용으로 새로 쓴다(StructureCanvas 수정 0).
 * ready → render{doc, kitTokens?} 1회 · 폭 = viewport만(문서 재전송 0) · 첫 rects로 높이(섹션 사각형 맨 아래) · select·click 없음(click은 와도 무시).
 * 상태는 부모 열에 알린다: 그림 · 킷 없이 그림(NO_KIT_TOKENS 뒤 rects) · 그리지 못함(INVALID_DOC) · 시간 초과(마운트 후 8000ms 안에 rects 없음, 늦게 오면 그림).
 * 감싸개 `inert` — 렌더 문서 안 메뉴·링크로 Tab이 들어가지 않게(미리보기는 비대화형, 정보는 iframe 밖 글자가 가진다).
 */
import { useEffect, useRef, useState } from "react";
import type { StartDocWrite } from "../../data/startDocWrite";
import type { KitTokenInput, ParentMessage } from "../../render/protocol";
import { COMPARE_RENDER_SRC, frameMessage } from "./compareFrame";

export type FrameState = "drawing" | "drawn" | "nokit" | "invalid" | "timeout";
/** 정적 HTML 내보내기 숨은 iframe 상한과 같은 값(staticHtml TIMEOUT_MS · SPEC 3.3) */
export const FRAME_TIMEOUT_MS = 8000;
type PreviewDoc = Extract<StartDocWrite, { ok: true }>["doc"];

export function PreviewFrame({
  id,
  doc,
  kitTokens,
  frameRem,
  framePx,
  scale,
  onState,
}: {
  readonly id: string;
  readonly doc: PreviewDoc;
  readonly kitTokens?: KitTokenInput;
  readonly frameRem: number;
  readonly framePx: number;
  readonly scale: number;
  readonly onState: (state: FrameState) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [ready, setReady] = useState(false);
  const [height, setHeight] = useState<number>();
  const report = useRef(onState);
  useEffect(() => {
    report.current = onState;
  }, [onState]);
  useEffect(() => {
    let noKit = false;
    let settled = false;
    const timer = setTimeout(() => settled || report.current("timeout"), FRAME_TIMEOUT_MS);
    const receive = (event: MessageEvent) => {
      const message = frameMessage(event, frame.current);
      if (!message) return;
      if (message.type === "ready") setReady(true);
      else if (message.type === "rects") {
        settled = true;
        const bottom = message.rects.filter((r) => r[1] === null).reduce((max, r) => Math.max(max, r[3] + r[5]), 0);
        if (bottom > 0) setHeight(bottom);
        report.current(noKit ? "nokit" : "drawn");
      } else if (message.type === "error") {
        if (message.code === "NO_KIT_TOKENS") noKit = true;
        else {
          settled = true;
          report.current("invalid");
        }
      }
    };
    window.addEventListener("message", receive);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
    };
  }, []);
  const send = (message: ParentMessage) => frame.current?.contentWindow?.postMessage(message, "*");
  useEffect(() => {
    if (ready) send({ type: "render", doc, ...(kitTokens && { kitTokens }) });
  }, [ready, doc, kitTokens]);
  useEffect(() => {
    if (ready) send({ type: "viewport", width: framePx });
  }, [ready, framePx]);
  return (
    <div inert className="relative mx-auto w-fit">
      <div style={{ width: `${frameRem}rem`, zoom: scale < 1 ? scale : undefined }} className="max-w-none overflow-hidden rounded-md bg-background-normal outline outline-line-normal">
        <iframe
          ref={frame}
          src={COMPARE_RENDER_SRC}
          sandbox="allow-scripts"
          title={`${id}안 실제 화면 미리보기`}
          style={{ height: height === undefined ? undefined : `${height}px` }}
          className="block min-h-40 w-full border-0"
        />
      </div>
    </div>
  );
}
