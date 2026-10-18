/**
 * `src/site.json` v1 (REACTZIP-SPEC 2.3 · 2.3.1 RZQ-13 A) — PageDoc 모양 유지 + 내부 필드 중립 상수 · 필드 허용 목록으로 새 객체 · 이미지 source = 내보내기 키.
 * 실효 모션·main 변수는 생성 시점에 계산한다(산출물에 엔진 0). 직렬화 전에 런타임 검증한다(타입 단언으로 대신하지 않는다).
 */
import type { ImageSlotValue, ImageSource, PageDoc, SectionInstance, SectionMotion, SlotValue } from "../../../engine/contracts/pageDoc";
import { canvasVars } from "../../../render/fallback/canvasLayouts";
import type { KitTokenInput } from "../../../render/protocol";
import { firstScreenIds, motionOf } from "../../../render/sectionMotion";

export interface SiteImage {
  readonly file: string;
  readonly width: number;
  readonly height: number;
}
export interface SiteJsonV1 {
  readonly schema: 1;
  readonly doc: PageDoc;
  readonly kitTokens: KitTokenInput;
  readonly motion: Readonly<Record<string, SectionMotion>>;
  readonly mainStyle: Readonly<Record<string, string>>;
  readonly images: Readonly<Record<string, SiteImage>>;
}

/** 2.3.1-2 내부 필드 중립 상수 */
export const NEUTRAL = Object.freeze({ projectId: "site", revision: 0, hash: "", profileVersion: 0, candidateId: "", libraryVersion: "", generatorVersion: "", updatedAt: "" });
/** exportDoc가 만드는 필드 순서(중립 상수 → meta → sections) = PageDoc 필드 집합 */
export const DOC_KEYS: readonly string[] = [...Object.keys(NEUTRAL), "meta", "sections"];
export const SECTION_KEYS = ["instanceId", "type", "variant", "motion", "tone", "slots"] as const;
export const IMAGE_SLOT_KEYS = ["kind", "enabled", "source", "alt", "decorative"] as const;
const PLACEHOLDER = Object.freeze({ kind: "placeholder", patternId: "diagonal" });

/** 2.3.1-3.1 — 바이트를 고른 id = 키 · 잃은·끈 로컬 이미지 = placeholder(diagonal) · placeholder = 그대로(새 객체) */
function exportSource(slot: ImageSlotValue, keys: ReadonlyMap<string, string>): ImageSource {
  if (typeof slot.source !== "string") return { kind: "placeholder", patternId: slot.source.patternId };
  const key = slot.enabled ? keys.get(slot.source) : undefined;
  return (key ?? PLACEHOLDER) as ImageSource;
}
const exportSlot = (value: SlotValue, keys: ReadonlyMap<string, string>): SlotValue =>
  typeof value === "string" ? value : { kind: "image", enabled: value.enabled, source: exportSource(value, keys), alt: value.alt, decorative: value.decorative };
const exportSection = (s: SectionInstance, keys: ReadonlyMap<string, string>): SectionInstance => ({
  instanceId: s.instanceId,
  type: s.type,
  variant: s.variant,
  motion: s.motion,
  tone: s.tone,
  slots: Object.fromEntries(Object.entries(s.slots).map(([k, v]) => [k, exportSlot(v, keys)])),
});

/** 2.3.1 ExportDoc — 원문을 펼치지 않고 허용 목록 필드만 새로 만든다 */
export const exportDoc = (doc: PageDoc, keys: ReadonlyMap<string, string>): PageDoc => ({
  ...NEUTRAL,
  meta: { title: doc.meta.title, description: doc.meta.description },
  sections: doc.sections.map((s) => exportSection(s, keys)),
});

/** 앱 렌더 문서와 같은 실효 모션 — main = header·footer 밖(내보낼 수 있는 문서는 모든 섹션이 킷 — 게이트 UNRENDERED_SECTIONS) */
export function effectiveMotion(doc: PageDoc): Record<string, SectionMotion> {
  const body = doc.sections.filter((s) => s.type !== "header" && s.type !== "footer");
  const first = firstScreenIds(body);
  return Object.fromEntries(doc.sections.flatMap((s) => {
    const level = motionOf(s, first.has(s.instanceId));
    return level ? [[s.instanceId, level]] : [];
  }));
}

export function siteJson(doc: PageDoc, kitTokens: KitTokenInput, keys: ReadonlyMap<string, string>, images: Readonly<Record<string, SiteImage>>): SiteJsonV1 {
  return { schema: 1, doc: exportDoc(doc, keys), kitTokens, motion: effectiveMotion(doc), mainStyle: canvasVars(kitTokens.palette), images };
}

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const KEY = /^img-\d{2,3}$/;
const sameKeys = (value: object, keys: readonly string[]) => Object.keys(value).join() === keys.join();
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/** 이미지 슬롯 source 목록(doc 안 참조) */
export const imageSources = (doc: PageDoc): ImageSource[] =>
  doc.sections.flatMap((s) => Object.values(s.slots).flatMap((v) => (typeof v === "object" ? [v.source] : [])));

/** 2.3 스키마 · 2.3.1 중립 상수·허용 목록 · 이미지 source(키 또는 placeholder, UUID 0) · 키 ↔ images 무결성 — 실패 = 이유 문자열 */
export function siteJsonProblems(value: unknown): string[] {
  if (!isRecord(value) || !sameKeys(value, ["schema", "doc", "kitTokens", "motion", "mainStyle", "images"]) || value.schema !== 1) return ["site.json 최상위 필드"];
  const { doc, images, motion, mainStyle } = value as unknown as SiteJsonV1;
  const problems: string[] = [];
  if (!isRecord(doc) || !sameKeys(doc, DOC_KEYS)) return ["doc 필드 허용 목록"];
  for (const [k, v] of Object.entries(NEUTRAL)) if (doc[k as keyof typeof NEUTRAL] !== v) problems.push(`doc.${k} 중립 상수 아님`);
  if (!isRecord(doc.meta) || !sameKeys(doc.meta, ["title", "description"])) problems.push("doc.meta 필드");
  if (!Array.isArray(doc.sections) || doc.sections.some((s) => !isRecord(s) || !sameKeys(s, [...SECTION_KEYS]))) return [...problems, "섹션 필드 허용 목록"];
  const slots = doc.sections.flatMap((s) => Object.values(s.slots));
  if (slots.some((v) => typeof v !== "string" && (!isRecord(v) || !sameKeys(v, [...IMAGE_SLOT_KEYS])))) problems.push("이미지 슬롯 필드 허용 목록");
  const sources = imageSources(doc);
  const refs = new Set(sources.filter((s): s is ImageSource & string => typeof s === "string"));
  if ([...refs].some((ref) => !KEY.test(ref) || UUID.test(ref))) problems.push("이미지 source가 키 모양이 아님");
  if (sources.some((s) => typeof s !== "string" && (!isRecord(s) || !sameKeys(s, ["kind", "patternId"]) || s.kind !== "placeholder"))) problems.push("placeholder 모양");
  if (!isRecord(images) || Object.entries(images).some(([key, v]) => !KEY.test(key) || !isRecord(v) || !sameKeys(v, ["file", "width", "height"]) || !new RegExp(`^${key}\\.(webp|jpg|png)$`).test(String(v.file)) || !Number.isInteger(v.width) || !Number.isInteger(v.height)))
    problems.push("images 모양");
  else if ([...refs].sort().join() !== Object.keys(images).sort().join()) problems.push("doc 이미지 참조 ≠ images 키");
  if (!isRecord(motion) || Object.values(motion).some((m) => m !== "L1" && m !== "L2")) problems.push("motion 값");
  if (!isRecord(mainStyle) || Object.entries(mainStyle).some(([k, v]) => !k.startsWith("--") || typeof v !== "string")) problems.push("mainStyle 값");
  return problems;
}
