import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { validatePageDoc } from "../engine/validate/validatePageDoc";
import { PageDocument } from "./PageDocument";
import { readParentMessage, type FrameRect, type KitTokenInput, type RenderMessage } from "./protocol";

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
 * render{doc, kitTokens}는 validatePageDoc으로 다시 검증하고 실패하면 그리지 않고 error{INVALID_DOC}. 킷 토큰이 없으면 error{NO_KIT_TOKENS} + 폴백만(M2A-2a K2). 그린 뒤·크기가 바뀌면 rects를 보고하고, 섹션 누름은 click.
 * 편집기 UI(선택·문제 표시)는 그리지 않는다 — 부모 오버레이(SPEC 5.7 r4.8).
 */
export function RenderApp({ host }: { readonly host: Window }) {
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<{ readonly doc: PageDoc; readonly kitTokens?: KitTokenInput }>();
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
        // 킷 토큰 없음(조회 전·실패) = 킷은 그리지 않고 error — 폴백 섹션은 중립 토큰으로 계속 그린다(MQ-1)
        if (!message.kitTokens) post({ type: "error", code: "NO_KIT_TOKENS" });
        setView({ doc: checked.value, ...(message.kitTokens && { kitTokens: message.kitTokens }) });
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
      {view && <PageDocument doc={view.doc} kitTokens={view.kitTokens} />}
    </div>
  );
}
