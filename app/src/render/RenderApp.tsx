import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { PageDoc } from "../engine/contracts/pageDoc";
import { validatePageDoc } from "../engine/validate/validatePageDoc";
import { createObjectUrlCache, docImageIds } from "./objectUrls";
import { PageDocument } from "./PageDocument";
import { readParentMessage, type FrameRect, type HtmlMessage, type KitTokenInput, type RenderMessage } from "./protocol";
import { serializeSite } from "./serializeSite";
import { awaitSiteFonts } from "./siteFontLoad";

/** 섹션·글자 슬롯 사각형 — 문서 좌표(스크롤 포함). 섹션 줄(slotKey null) 다음에 그 섹션의 글자 슬롯 */
function measure(root: HTMLElement, host: Window): readonly FrameRect[] {
  const rect = (el: Element, id: string, key: string | null): FrameRect => {
    const r = el.getBoundingClientRect();
    return [id, key, r.left + host.scrollX, r.top + host.scrollY, r.width, r.height];
  };
  return [...root.querySelectorAll<HTMLElement>("[data-instance-id]")].flatMap((section) => {
    const id = section.dataset.instanceId!;
    // 보이지 않는 슬롯(폭에 따라 숨는 메뉴 두 벌 중 하나 등 — checkVisibility false)은 보고하지 않는다
    const slots = [...section.querySelectorAll<HTMLElement>("[data-slot]")].filter((slot) => slot.checkVisibility?.() !== false);
    return [rect(section, id, null), ...slots.map((slot) => rect(slot, id, slot.dataset.slot!))];
  });
}

/**
 * 렌더 문서 본체 (M2A-1 R3) — 부모(편집기)의 메시지만 받는다(`event.source === host.parent` + 모양 검사).
 * render{doc, kitTokens}는 validatePageDoc으로 다시 검증하고 실패하면 그리지 않고 error{INVALID_DOC}. 킷 토큰이 없으면 error{NO_KIT_TOKENS} + 폴백만(M2A-2a K2). 그린 뒤·크기가 바뀌면 rects를 보고하고, 섹션 누름은 click.
 * 편집기 UI(선택·문제 표시)는 그리지 않는다 — 부모 오버레이(SPEC 5.7 r4.8).
 */
export function RenderApp({ host }: { readonly host: Window }) {
  const root = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<{ readonly doc: PageDoc; readonly kitTokens?: KitTokenInput; readonly images: Readonly<Record<string, string>> }>();
  const [measureTick, setMeasureTick] = useState(0);
  // 글꼴이 준비된 문서(그 view 객체) — 첫 rects는 이 문서의 글꼴 대기가 끝난 뒤(M2B-4a B7)
  const [fontsFor, setFontsFor] = useState<object>();
  const post = useCallback((message: RenderMessage | HtmlMessage) => host.parent.postMessage(message, "*"), [host]);

  useEffect(() => {
    // 로컬 이미지 object URL — 렌더 문서가 만들고 문서에서 빠지면 해제, 내릴 때 전부 해제(K4)
    const urls = createObjectUrlCache();
    let cancelFonts = () => {};
    const receive = (event: MessageEvent) => {
      if (event.source !== host.parent) return;
      const message = readParentMessage(event.data);
      if (!message) return;
      // 내보내기(M2A-3b) — 지금 그린 사이트 루트를 돌려준다. 그리기 전이면 답하지 않는다(부모 시간 초과)
      if (message.type === "serialize") {
        if (root.current) void serializeSite(root.current).then((markup) => markup && post({ type: "html", markup }));
        return;
      }
      if (message.type === "render") {
        const checked = validatePageDoc(message.doc);
        if (!checked.ok) {
          setView(undefined);
          post({ type: "error", code: "INVALID_DOC" });
          return;
        }
        // 킷 토큰 없음(조회 전·실패) = 킷은 그리지 않고 error — 폴백 섹션은 중립 토큰으로 계속 그린다(MQ-1)
        if (!message.kitTokens) post({ type: "error", code: "NO_KIT_TOKENS" });
        const blobs = Object.fromEntries(Object.entries(message.images ?? {}).map(([id, image]) => [id, image.blob]));
        const images = urls.sync(blobs, docImageIds(checked.value));
        const next = { doc: checked.value, images, ...(message.kitTokens && { kitTokens: message.kitTokens }) };
        setView(next);
        cancelFonts();
        cancelFonts = awaitSiteFonts(host, message.kitTokens, message.fonts, () => setFontsFor(next), () => setMeasureTick((n) => n + 1));
      }
      // viewport·select: 폭이 바뀌었거나 선택이 바뀐 뒤 부모가 최신 사각형을 쓰게 다시 잰다
      setMeasureTick((n) => n + 1);
    };
    host.addEventListener("message", receive);
    post({ type: "ready" });
    return () => {
      host.removeEventListener("message", receive);
      cancelFonts();
      urls.clear();
    };
  }, [host, post]);

  // 글꼴 준비 뒤 사각형 보고 + 크기 변화(폭 변경) · 늦은 글꼴 로드(measureTick) 때 다시
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || !view || fontsFor !== view) return undefined;
    const report = () => post({ type: "rects", rects: measure(el, host) });
    report();
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [view, fontsFor, measureTick, host, post]);

  const click = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as Element;
    // 편집 캔버스에서는 킷 링크 이동을 막고 섹션 선택으로 바꾼다(K1-1 6) · 메뉴 시트 안 앵커 → 시트 닫기(킷 공용 조작 1개)
    const anchor = target.closest("a[href]");
    if (anchor) {
      event.preventDefault();
      anchor.closest<HTMLElement>("[popover]")?.hidePopover?.();
    }
    const id = target.closest("[data-instance-id]")?.getAttribute("data-instance-id");
    if (id) post({ type: "click", instanceId: id });
  };
  return (
    <div ref={root} onClick={click}>
      {view && <PageDocument doc={view.doc} kitTokens={view.kitTokens} images={view.images} />}
    </div>
  );
}
