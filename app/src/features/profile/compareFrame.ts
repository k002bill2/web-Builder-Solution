/**
 * 비교 프레임 다리 — 수신 판정 (M2B-5 SPEC 5). 그 프레임의 contentWindow에서 온 메시지만 + 모양 검사(`readRenderMessage` 재사용).
 * 다른 열·다른 창의 메시지로 상태가 바뀌지 않는다(CMP-AC-U3).
 */
import { readRenderMessage, type RenderMessage } from "../../render/protocol";

export function frameMessage(event: MessageEvent, frame: HTMLIFrameElement | null): RenderMessage | undefined {
  if (!frame || event.source !== frame.contentWindow) return undefined;
  return readRenderMessage(event.data);
}
