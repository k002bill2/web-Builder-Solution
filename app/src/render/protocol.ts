/**
 * 편집기(부모) ↔ 렌더 문서(iframe) 메시지 프로토콜 (M2A-1 · Opus R2 B-1-6 · SPEC 5.7 r4.8). 의존성 0 — 양쪽 번들에 들어간다.
 * 부모 → 렌더: render{doc, kitTokens?, images?} · viewport{width} · select{instanceId}  (M2A-2a K2 · MQ-1 — 팔레트는 kitTokens 안 · K4 images = 로컬 이미지 id → Blob 자체)
 * 렌더 → 부모: ready · rects{[instanceId, slotKey | null, x, y, w, h][]} · click{instanceId} · error{code}
 *   error INVALID_DOC = 그리지 않음 · NO_KIT_TOKENS = 킷 섹션은 그리지 않고 폴백 섹션은 중립 토큰으로 그림(사각형 보고 계속)
 * 받는 쪽은 `event.source`(부모 = iframe.contentWindow, 렌더 = window.parent)를 확인하고 아래 읽기 함수로 모양을 검사한다.
 * 문서 내용 검증은 렌더 쪽 validatePageDoc이 한다(여기서는 객체인지만).
 */

/** 캔버스 팔레트 5역할(문서 프로필 버전 색) — 값은 CSS 색 문자열 */
export type CanvasPalette = Readonly<Record<"primary" | "surface" | "ink" | "muted" | "bg", string>>;
/** 카드 모양(m2a 0.5 — `elementLibrary.ts` card_style 키) */
export type KitCardStyle = "bordered-lg" | "bordered-md" | "elevated" | "flat";
/**
 * 킷 토큰 입력 (M2A-2a K1 · m2a 0.2 · MQ-1) — 문서 프로필 버전의 적용값(base + 조정). 부모가 모으고, `--site-*` 변수는 렌더 문서의 생성기(kit/tokens)가 만든다.
 * sectionGap = base 값(촘촘 환산은 생성기 — effectiveProfile과 같은 규칙) · grid = "8pt"의 숫자.
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
export type RenderErrorCode = "INVALID_DOC" | "NO_KIT_TOKENS";

export type ParentMessage =
  | { readonly type: "render"; readonly doc: unknown; readonly kitTokens?: KitTokenInput; readonly images?: Readonly<Record<string, Blob>> }
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
/** CSS 값으로 들어가는 글자 — 선언을 끊는 문자(; { } < > 따옴표 \\) 0 */
const isCssValue = (v: unknown): v is string => isText(v, 128) && !/[;{}<>"'\\]/.test(v);
const isPalette = (v: unknown): v is CanvasPalette => isObject(v) && PALETTE_ROLES.every((role) => isCssValue(v[role]));
const inRange = (v: unknown, min: number, max: number) => isNumber(v) && v >= min && v <= max;
const isKitTokens = (v: unknown): v is KitTokenInput => {
  if (!isObject(v) || !isPalette(v.palette) || !isObject(v.card) || !isObject(v.type) || !isObject(v.space)) return false;
  const { card, type, space } = v;
  return (
    (card.tone === "light" || card.tone === "dark") &&
    ["bordered-lg", "bordered-md", "elevated", "flat"].includes(card.style as string) &&
    isText(type.family) &&
    /^[\w -]+$/.test(type.family) &&
    inRange(type.headingWeight, 100, 900) &&
    inRange(type.bodyWeight, 100, 900) &&
    inRange(type.scale, 1, 2) &&
    inRange(space.grid, 1, 64) &&
    inRange(space.sectionGap, 0, 512) &&
    (space.density === "comfortable" || space.density === "compact") &&
    ["16:9", "4:5", "1:1"].includes(v.mediaRatio as string)
  );
};
const isRect = (v: unknown): v is FrameRect =>
  Array.isArray(v) && v.length === 6 && isText(v[0]) && (v[1] === null || isText(v[1])) && v.slice(2).every(isNumber);

/** 로컬 이미지 id(UUID v4 소문자, engine/validate/localImageId와 같은 모양) → Blob. 64개 이하 */
const IMAGE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const isImages = (v: unknown): v is Readonly<Record<string, Blob>> =>
  isObject(v) && Object.keys(v).length <= 64 && Object.entries(v).every(([id, blob]) => IMAGE_ID.test(id) && typeof Blob !== "undefined" && blob instanceof Blob);

/** 렌더 문서가 받는 부모 메시지 — 모양이 틀리면 undefined */
export function readParentMessage(data: unknown): ParentMessage | undefined {
  if (!isObject(data)) return undefined;
  if (data.type === "render" && isObject(data.doc) && (data.kitTokens === undefined || isKitTokens(data.kitTokens)) && (data.images === undefined || isImages(data.images)))
    return { type: "render", doc: data.doc, ...(data.kitTokens !== undefined && { kitTokens: data.kitTokens }), ...(data.images !== undefined && { images: data.images }) };
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
  if (data.type === "error" && (data.code === "INVALID_DOC" || data.code === "NO_KIT_TOKENS")) return { type: "error", code: data.code };
  return undefined;
}
