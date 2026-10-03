/**
 * 편집기(부모) ↔ 렌더 문서(iframe) 메시지 프로토콜 (M2A-1 · Opus R2 B-1-6 · SPEC 5.7 r4.8). 의존성 0 — 양쪽 번들에 들어간다.
 * 부모 → 렌더: render{doc, palette?} · viewport{width} · select{instanceId}
 * 렌더 → 부모: ready · rects{[instanceId, slotKey | null, x, y, w, h][]} · click{instanceId} · error{code}
 * 받는 쪽은 `event.source`(부모 = iframe.contentWindow, 렌더 = window.parent)를 확인하고 아래 읽기 함수로 모양을 검사한다.
 * 문서 내용 검증은 렌더 쪽 validatePageDoc이 한다(여기서는 객체인지만).
 */

/** 캔버스 팔레트 5역할(문서 프로필 버전 색) — 값은 CSS 색 문자열 */
export type CanvasPalette = Readonly<Record<"primary" | "surface" | "ink" | "muted" | "bg", string>>;
/** 카드 모양(m2a 0.5 — `elementLibrary.ts` card_style 키) */
export type KitCardStyle = "bordered-lg" | "bordered-md" | "elevated" | "flat";
/**
 * 킷 토큰 입력 (M2A-2a K1 · m2a 0.2 · MQ-1) — 문서 프로필 버전의 적용값(base + 조정). 부모가 모으고, `--site-*` 변수는 렌더 문서의 생성기(kit/tokens)가 만든다.
 * sectionGap = 적용값(촘촘이면 이미 줄어든 값, effectiveProfile) · grid = "8pt"의 숫자.
 */
export interface KitTokenInput {
  readonly palette: CanvasPalette;
  readonly card: { readonly tone: "light" | "dark"; readonly style: KitCardStyle };
  readonly type: { readonly family: string; readonly headingWeight: number; readonly bodyWeight: number; readonly scale: number };
  readonly space: { readonly grid: number; readonly sectionGap: number; readonly density: "comfortable" | "compact" };
  readonly mediaRatio: "16:9" | "4:5" | "1:1";
}
/** 섹션(slotKey null) 또는 글자 슬롯의 사각형 — 렌더 문서 좌표(CSS px, 문서 맨 위 기준) */
export type FrameRect = readonly [instanceId: string, slotKey: string | null, x: number, y: number, w: number, h: number];
export type RenderErrorCode = "INVALID_DOC";

export type ParentMessage =
  | { readonly type: "render"; readonly doc: unknown; readonly palette?: CanvasPalette }
  | { readonly type: "viewport"; readonly width: number }
  | { readonly type: "select"; readonly instanceId: string };
export type RenderMessage =
  | { readonly type: "ready" }
  | { readonly type: "rects"; readonly rects: readonly FrameRect[] }
  | { readonly type: "click"; readonly instanceId: string }
  | { readonly type: "error"; readonly code: RenderErrorCode };

const PALETTE_ROLES = ["primary", "surface", "ink", "muted", "bg"] as const;
const isObject = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const isText = (v: unknown, max = 64): v is string => typeof v === "string" && v.length > 0 && v.length <= max;
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isPalette = (v: unknown): v is CanvasPalette => isObject(v) && PALETTE_ROLES.every((role) => isText(v[role], 128));
const isRect = (v: unknown): v is FrameRect =>
  Array.isArray(v) && v.length === 6 && isText(v[0]) && (v[1] === null || isText(v[1])) && v.slice(2).every(isNumber);

/** 렌더 문서가 받는 부모 메시지 — 모양이 틀리면 undefined */
export function readParentMessage(data: unknown): ParentMessage | undefined {
  if (!isObject(data)) return undefined;
  if (data.type === "render" && isObject(data.doc) && (data.palette === undefined || isPalette(data.palette)))
    return data.palette === undefined ? { type: "render", doc: data.doc } : { type: "render", doc: data.doc, palette: data.palette };
  if (data.type === "viewport" && isNumber(data.width)) return { type: "viewport", width: data.width };
  if (data.type === "select" && typeof data.instanceId === "string") return { type: "select", instanceId: data.instanceId };
  return undefined;
}

/** 부모가 받는 렌더 메시지 — 모양이 틀리면 undefined */
export function readRenderMessage(data: unknown): RenderMessage | undefined {
  if (!isObject(data)) return undefined;
  if (data.type === "ready") return { type: "ready" };
  if (data.type === "rects" && Array.isArray(data.rects) && data.rects.length <= 1024 && data.rects.every(isRect)) return { type: "rects", rects: data.rects };
  if (data.type === "click" && isText(data.instanceId)) return { type: "click", instanceId: data.instanceId };
  if (data.type === "error" && data.code === "INVALID_DOC") return { type: "error", code: data.code };
  return undefined;
}
