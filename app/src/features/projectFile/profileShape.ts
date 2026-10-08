/**
 * 가져오기 ④ 프로필 버전 모양 (Codex r1·r2 P2) — 외부 파일의 계열을 ProfileVersion으로 믿기 전에, 화면·생성·문서가 가드 없이 읽는 필드를 본다.
 * 근거(사용처 전수 표 = dev/active/p2-l1/REPORT.md 9절): ProfilePanel·comparePreviews·relativeLuminance(color_tokens[역할].$value #RRGGBB · corrections from/to) ·
 * profileFields·ProfileValues(base 전 필드 · component_choices 하위 · SECTION_TYPE_LABELS[section_plan[].type]) · useProfileDetail(source_reference_ids) ·
 * memoryGenerate·memoryDocBook(library_version·seed) · ProfilePage(selection_mode) · profileMessages(CONTRAST_TARGET[contrast].toFixed) ·
 * profileDiff·adjustmentText(DENSITY_LABELS·PURPOSE_LABELS·dropped.map) · VersionList(basedOn).
 * 열거는 화면이 인덱싱하는 그 Record의 키로 본다(내보내지 않은 표는 같은 키의 Record<T, true>). 선택 필드는 없어도 되지만 있으면 소비 모양이어야 한다.
 * zod 없음 — 가져오기 청크를 가볍게.
 */
import type { SectionType, SurfaceTone } from "../../domain/compareBoard";
import type { ContrastCheckId } from "../../domain/contrast";
import type { CarryOverItem, CarryOverKey, ContrastLevel, Density } from "../../domain/profile";
import type { PurposeId } from "../../domain/reference";
import type { PaletteRole } from "../../domain/referenceDetail";

/**
 * 화면 Record의 키 리터럴 복제 (P2-SPEC 6절) — 원천(profileFields·catalogFilters·palette·profileContrast·adjustmentText)을 값으로 import하면
 * 가져오기 청크와 /profile 첫 화면이 공유 청크를 나눠 /profile 예산을 넘는다(p2-l3 REPORT 1절 실측). 원천과 같은지는 profileShape.parity.test가 본다.
 */
export const PROFILE_SHAPE_KEYS = Object.freeze({
  sectionTypes: Object.freeze({
    header: true, hero: true, about: true, services: true, portfolio: true, statistics: true,
    testimonials: true, pricing: true, faq: true, contact: true, "cta-band": true, footer: true,
  } satisfies Record<SectionType, true>),
  purposes: Object.freeze({ booking: true, inquiry: true, sales: true } satisfies Record<PurposeId, true>),
  paletteRoles: Object.freeze(["primary", "surface", "ink", "muted", "bg"] as const satisfies readonly PaletteRole[]),
  contrastLevels: Object.freeze({ aa: true, enhanced: true } satisfies Record<ContrastLevel, true>),
  densities: Object.freeze({ comfortable: true, compact: true } satisfies Record<Density, true>),
});
const { sectionTypes: SECTION_TYPES, purposes: PURPOSES, paletteRoles: PALETTE_ROLES, contrastLevels: CONTRAST_LEVELS, densities: DENSITIES } = PROFILE_SHAPE_KEYS;

type Loose = Record<string, unknown>;
const isObject = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);
const isString = (v: unknown): v is string => typeof v === "string";
const isNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const oneOf = (values: readonly string[]) => (v: unknown) => isString(v) && values.includes(v);
const isOrigin = oneOf(["board", "board-reconfirm", "adjust", "revert"]);
const isMotion = oneOf(["L0", "L1", "L2"]);
const isMode = oneOf(["template", "mix"]);
const isRole = oneOf(PALETTE_ROLES);
const optional = (v: unknown, ok: (v: unknown) => boolean) => v === undefined || ok(v);
/** 화면이 `record[v]`로 바로 읽는 열거 — 자기 키만(프로토타입 키 "toString" 등 제외) */
const keyOf = (record: object) => (v: unknown) => isString(v) && Object.hasOwn(record, v);
const isInt = (v: unknown): v is number => Number.isSafeInteger(v);
/** domain/contrast.ts relativeLuminance와 같은 규칙 — 아니면 대비 검사가 throw */
const isHex = (v: unknown) => isString(v) && /^#[0-9a-f]{6}$/i.test(v);
const CHECK_IDS: Readonly<Record<ContrastCheckId, true>> = { "C-1": true, "C-2": true, "C-3": true, "C-4": true, "C-5": true };
const CARRY_KEYS: Readonly<Record<CarryOverKey, true>> = { density: true, contrast: true, motion: true, purpose: true, correction: true };
/** adjustmentText REASONS 키 */
const DROP_REASONS: Readonly<Record<NonNullable<CarryOverItem["reason"]>, true>> = { "board-changed": true, "palette-changed": true, "new-contrast-failure": true };
const TONES: Readonly<Record<SurfaceTone, true>> = { light: true, dark: true };
const isPurpose = (v: unknown) => v === "none" || keyOf(PURPOSES)(v);

const colorsOk = (tokens: unknown) => isObject(tokens) && PALETTE_ROLES.every((role) => isObject(tokens[role]) && isHex(tokens[role].$value));
const typographyOk = (t: unknown) => isObject(t) && isString(t.family) && [t.headingWeight, t.bodyWeight, t.scale].every(isNumber);
const spacingOk = (s: unknown) => isObject(s) && isString(s.grid) && isNumber(s.sectionGap);
const planOk = (plan: unknown) => Array.isArray(plan) && plan.every((s) => isObject(s) && keyOf(SECTION_TYPES)(s.type) && isString(s.variant));
/** profileFields choice·cardRow·librarySection — 문자열 아니면 FieldRow.value로 그대로 렌더링된다 */
const boundOk = (v: unknown) => isObject(v) && isString(v.variant);
const cardOk = (v: unknown) => isObject(v) && isString(v.style) && keyOf(TONES)(v.surfaceTone);
const choicesOk = (c: unknown) =>
  isObject(c) &&
  [c.hero, c.header, c.footer].every((v) => optional(v, boundOk)) &&
  [c.cta_placement, c.media_ratio, c.mobile_pattern].every((v) => optional(v, isString)) &&
  optional(c.card_style, cardOk);

function baseOk(base: unknown): boolean {
  if (!isObject(base)) return false;
  const texts = [base.visual_direction, base.layout_direction, base.library_version, base.seed].every(isString);
  const ids = Array.isArray(base.source_reference_ids) && base.source_reference_ids.every(isString);
  return texts && ids && colorsOk(base.color_tokens) && typographyOk(base.typography_tokens) && spacingOk(base.spacing_tokens) && isMotion(base.motion_preset) && choicesOk(base.component_choices) && planOk(base.section_plan) && isMode(base.selection_mode);
}

const correctionOk = (c: unknown) => isObject(c) && isRole(c.role) && isHex(c.from) && isHex(c.to) && keyOf(CHECK_IDS)(c.check);
const adjustmentsOk = (a: unknown) =>
  isObject(a) &&
  optional(a.density, keyOf(DENSITIES)) &&
  optional(a.contrast, keyOf(CONTRAST_LEVELS)) &&
  optional(a.motion, isMotion) &&
  optional(a.purpose, isPurpose) &&
  optional(a.corrections, (cs) => Array.isArray(cs) && cs.every(correctionOk));
/** 재확정 dropped — summarizeVersions·droppedSummary가 map하고 key·role·reason을 읽는다 */
const droppedOk = (d: unknown) =>
  Array.isArray(d) && d.every((item) => isObject(item) && keyOf(CARRY_KEYS)(item.key) && optional(item.role, isRole) && optional(item.reason, keyOf(DROP_REASONS)));

/** 버전 번호·계열 키는 호출부(seriesOk)가 본다 */
export const profileVersionShapeOk = (v: Loose): boolean =>
  isOrigin(v.origin) && isString(v.baseReferenceId) && isString(v.createdAt) && baseOk(v.base) && adjustmentsOk(v.adjustments) &&
  optional(v.basedOn, isInt) && optional(v.boardRevision, isInt) && optional(v.dropped, droppedOk);
