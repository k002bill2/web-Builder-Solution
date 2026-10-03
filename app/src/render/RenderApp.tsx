import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { validatePageDoc } from "../engine/validate/validatePageDoc";
import { FallbackCanvas } from "./fallback/FallbackCanvas";
import { readParentMessage, type CanvasPalette, type FrameRect, type RenderMessage } from "./protocol";

/** 섹션·글자 슬롯 사각형 — 문서 좌표(스크롤 포함). 섹션 줄(slotKey null) 다음에 그 섹션의 글자 슬롯 */
function measure(root: HTMLElement, host: Window): readonly FrameRect[] {
  const rect = (el: Element, id: string, key: string | null): FrameRect => {
    const r = el.getBoundingClientRect();
    return [id, key, r.left + host.scrollX, r.top + host.scrollY, r.width, r.height];
  };
  return [...root.querySelectorAll<HTMLElement>("[data-instance-id]")].flatMap((section) => {
    const id = section.dataset.instanceId!;
    return [rect(section, id, null), ...[...section.querySelectorAll<HTMLElement>("[data-slot]")].map((slot) => rect(slot, id, slot.dataset.slot!))];
  });
}

/**
 * 렌더 문서 본체 (M2A-1 R3) — 부모(편집기)의 메시지만 받는다(`event.source === host.parent` + 모양 검사).
 * render{doc}는 validatePageDoc으로 다시 검증하고 실패하면 그리지 않고 error{INVALID_DOC}. 그린 뒤·크기가 바뀌면 rects를 보고하고, 섹션 누름은 click.
 * 편집기 UI(선택·문제 표시)는 그리지 않는다 — 부모 오버레이(SPEC 5.7 r4.8).
 */
export function RenderApp({ host }: { readonly host: Window }) {
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<{ readonly doc: PageDoc; readonly palette?: CanvasPalette }>();
  const [measureTick, setMeasureTick] = useState(0);
  const post = useCallback((message: RenderMessage) => host.parent.postMessage(message, "*"), [host]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== host.parent) return;
      const message = readParentMessage(event.data);
      if (!message) return;
      if (message.type === "render") {
        const checked = validatePageDoc(message.doc);
        if (!checked.ok) {
          setView(undefined);
          post({ type: "error", code: "INVALID_DOC" });
          return;
        }
        setView({ doc: checked.value, ...(message.palette && { palette: message.palette }) });
      }
      // viewport·select: 폭이 바뀌었거나 선택이 바뀐 뒤 부모가 최신 사각형을 쓰게 다시 잰다
      setMeasureTick((n) => n + 1);
    };
    host.addEventListener("message", receive);
    post({ type: "ready" });
    return () => host.removeEventListener("message", receive);
  }, [host, post]);

  // 그린 직후 사각형 보고 + 크기 변화(글꼴 로드·폭 변경) 때 다시
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !view) return undefined;
    const report = () => post({ type: "rects", rects: measure(el, host) });
    report();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [view, measureTick, host, post]);

  const click = (event: MouseEvent<HTMLDivElement>) => {
    const id = (event.target as Element).closest("[data-instance-id]")?.getAttribute("data-instance-id");
    if (id) post({ type: "click", instanceId: id });
  };
  return (
    <div ref={root} onClick={click}>
      {view && <FallbackCanvas doc={view.doc} palette={view.palette} />}
    </div>
  );
}
