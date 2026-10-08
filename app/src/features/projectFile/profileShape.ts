/**
 * 가져오기 ④ 프로필 버전 모양 (Codex r1 P2) — 외부 파일의 계열을 ProfileVersion으로 믿기 전에, 화면·생성·문서가 가드 없이 읽는 필드만 본다.
 * 근거(사용처): ProfilePanel·comparePreviews(color_tokens[역할].$value · adjustments.corrections[].to) · profileFields·ProfileValues(base 전 필드 ·
 * section_plan[].type·variant) · useProfileDetail(source_reference_ids) · memoryGenerate·memoryDocBook(library_version·seed) · ProfilePage(selection_mode).
 * 선택 필드(basedOn·boardRevision·dropped·component_choices 하위·$extensions)는 요구하지 않는다. zod 없음 — 가져오기 청크를 가볍게.
 */
import { PALETTE_ROLES } from "../../domain/palette";

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

const colorsOk = (tokens: unknown) => isObject(tokens) && PALETTE_ROLES.every((role) => isObject(tokens[role]) && isString(tokens[role].$value));
const typographyOk = (t: unknown) => isObject(t) && isString(t.family) && [t.headingWeight, t.bodyWeight, t.scale].every(isNumber);
const spacingOk = (s: unknown) => isObject(s) && isString(s.grid) && isNumber(s.sectionGap);
const planOk = (plan: unknown) => Array.isArray(plan) && plan.every((s) => isObject(s) && isString(s.type) && isString(s.variant));

function baseOk(base: unknown): boolean {
  if (!isObject(base)) return false;
  const texts = [base.visual_direction, base.layout_direction, base.library_version, base.seed].every(isString);
  const ids = Array.isArray(base.source_reference_ids) && base.source_reference_ids.every(isString);
  return texts && ids && colorsOk(base.color_tokens) && typographyOk(base.typography_tokens) && spacingOk(base.spacing_tokens) && isMotion(base.motion_preset) && isObject(base.component_choices) && planOk(base.section_plan) && isMode(base.selection_mode);
}

const correctionOk = (c: unknown) => isObject(c) && isRole(c.role) && isString(c.from) && isString(c.to) && isString(c.check);
const adjustmentsOk = (a: unknown) =>
  isObject(a) &&
  [a.density, a.contrast, a.motion, a.purpose].every((v) => optional(v, isString)) &&
  optional(a.motion, isMotion) &&
  optional(a.corrections, (cs) => Array.isArray(cs) && cs.every(correctionOk));

/** 버전 번호·계열 키는 호출부(seriesOk)가 본다 */
export const profileVersionShapeOk = (v: Loose): boolean => isOrigin(v.origin) && isString(v.baseReferenceId) && isString(v.createdAt) && baseOk(v.base) && adjustmentsOk(v.adjustments);
