/**
 * 비교 프레임 다리 — 수신 판정 (M2B-5 SPEC 5). 그 프레임의 contentWindow에서 온 메시지만 + 모양 검사.
 * 다른 열·다른 창의 메시지로 상태가 바뀌지 않는다(CMP-AC-U3).
 * 모양 검사는 `render/protocol.ts`의 `readRenderMessage`·헬퍼 **로컬 사본**이다(결정 A — dev/active/m2b-5/DECISION-A.md):
 *  값 import하면 편집기 StudioLayout 청크와 공유 청크로 갈라져 `/studio` 진입 +0.16KB(S1 실측, 멈춤선 +0.03).
 *  원본과 같은 소스 텍스트·같은 동작인지는 compareFrameGuard.test가 대조한다 — 원본을 바꾸면 그 테스트가 실패한다(사본도 같이 바꾼다).
 */
import type { FrameRect, RenderMessage } from "../../render/protocol";

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown, max = 64): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isRect = (v: unknown): v is FrameRect =>
  Array.isArray(v) && v.length === 6 && isText(v[0]) && (v[1] === null || isText(v[1])) && v.slice(2).every(isNumber);

/** 부모가 받는 렌더 메시지 — 모양이 틀리면 undefined */
export function readRenderMessage(data: unknown): RenderMessage | undefined {
  if (!isObject(data)) return undefined;
  if (data.type === "ready") return { type: "ready" };
  if (data.type === "rects" && Array.isArray(data.rects) && data.rects.length <= 1024 && data.rects.every(isRect)) return { type: "rects", rects: data.rects };
  if (data.type === "click" && isText(data.instanceId)) return { type: "click", instanceId: data.instanceId };
  if (data.type === "error" && (data.code === "INVALID_DOC" || data.code === "NO_KIT_TOKENS" || data.code === "IMAGE_DECODE_FAILED")) return { type: "error", code: data.code };
  return undefined;
}

export function frameMessage(event: MessageEvent, frame: HTMLIFrameElement | null): RenderMessage | undefined {
  if (!frame || event.source !== frame.contentWindow) return undefined;
  return readRenderMessage(event.data);
}

/**
 * 편집기 캔버스와 같은 값의 로컬 상수 (SPEC 2.3 · 5 · CMP-AC-G3) — `StructureCanvas`·`previewFrame` 값 import 금지
 * (공유 청크 분할로 `/studio`·`/references/:id`가 는다 — previewFrame.ts 머리 주석). 같은 값인지는 compareGuard.test가 대조한다.
 */
export const COMPARE_RENDER_SRC = "/render.html";
export type CompareView = "desktop" | "mobile";
/** 데스크톱 1280 · 모바일 390(rem) — 태블릿은 비교에 두지 않는다(SPEC 2.3 ★MQ-3 A) */
export const COMPARE_FRAME_REM: Readonly<Record<CompareView, number>> = Object.freeze({ desktop: 80, mobile: 24.375 });
export const COMPARE_WIDTH_OPTIONS: readonly { readonly value: CompareView; readonly label: string }[] = Object.freeze([
  { value: "desktop", label: "데스크톱" },
  { value: "mobile", label: "모바일" },
]);
/** 지금 루트 글꼴 px(1rem) — previewFrame remPx와 같은 식 */
export const compareRemPx = () => Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
/** previewScale과 같은 식 — 프레임이 열보다 넓으면 축소 비율, 아니면 1. 측정 전(0)은 1 */
export function compareScale(framePx: number | undefined, availablePx: number): number {
  if (framePx === undefined || availablePx <= 0 || framePx <= availablePx) return 1;
  return availablePx / framePx;
}
/** scaleCaption과 같은 문형 — "축소 보기 · N%"(내림) */
export const compareScaleCaption = (scale: number): string | undefined => (scale < 1 ? `축소 보기 · ${Math.floor(scale * 100)}%` : undefined);
