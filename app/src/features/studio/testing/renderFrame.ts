import { act, screen } from "@testing-library/react";
import { vi } from "vitest";
import type { PageDoc } from "../../../engine/contracts/pageDoc";
import type { FrameRect, ParentMessage, RenderMessage } from "../../../render/protocol";

/**
 * 테스트 전용(제품 코드가 import하지 않는다) — 렌더 문서 흉내 (M2A-1 R4). jsdom은 `/render.html`을 싣지 않으므로
 * 캔버스 iframe의 `contentWindow.postMessage`를 감시해 부모가 보낸 메시지를 모으고, render마다 가짜 사각형(rects)으로 바로 답한다.
 * 렌더 문서 쪽 그리기 단언은 `src/render/**` 단위 테스트에 있다(REPORT "옮긴 단언 표").
 */
export const canvasFrame = () => screen.getByTitle<HTMLIFrameElement>("구조 미리보기 화면");

/** 렌더 문서 → 부모 메시지(출처 = 캔버스 iframe) */
export function frameSays(data: RenderMessage, frame: HTMLIFrameElement = canvasFrame()) {
  window.dispatchEvent(new MessageEvent("message", { data, origin: "null", source: frame.contentWindow }));
}

/** 섹션 i = 세로 100px 칸, 글자 슬롯마다 작은 사각형 — 값은 의미 없고 오버레이가 그려질 만큼만 */
export function fakeRects(doc: PageDoc): readonly FrameRect[] {
  return doc.sections.flatMap((section, i): FrameRect[] => [
    [section.instanceId, null, 0, i * 100, 800, 96],
    ...Object.entries(section.slots)
      .filter(([, value]) => typeof value === "string")
      .map(([key], n): FrameRect => [section.instanceId, key, 8, i * 100 + 8 + n * 12, 400, 10]),
  ]);
}

/** 캔버스 iframe에 렌더 문서 흉내를 붙이고 ready를 보낸다 — 부모가 보낸 메시지 목록을 돌려준다 */
export function connectRenderFrame() {
  const frame = canvasFrame();
  const sent: ParentMessage[] = [];
  vi.spyOn(frame.contentWindow!, "postMessage").mockImplementation((data: unknown) => {
    const message = data as ParentMessage;
    sent.push(message);
    if (message.type === "render") frameSays({ type: "rects", rects: fakeRects(message.doc as PageDoc) }, frame);
  });
  act(() => frameSays({ type: "ready" }, frame));
  const renders = () => sent.filter((m): m is Extract<ParentMessage, { type: "render" }> => m.type === "render");
  return {
    sent,
    /** 마지막으로 보낸 render 메시지의 문서·킷 토큰 입력(팔레트 포함, MQ-1) */
    lastDoc: () => renders().at(-1)!.doc as PageDoc,
    lastKitTokens: () => renders().at(-1)!.kitTokens,
  };
}
