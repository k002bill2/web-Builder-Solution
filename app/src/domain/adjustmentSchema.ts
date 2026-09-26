/**
 * 조정 저장 경계 검증 (DS-2A-04 3.4 · 6.3 · 6.4 `adjustmentSchema`). zod는 저장소 메모리 구현 청크에서만 쓴다(공통 청크 0).
 * 모양이 틀리면 SCHEMA_INVALID, 모양은 맞지만 테마 허용 범위 밖이면 RANGE_VIOLATION — 화면이 먼저 막아도 서버가 정본이다.
 */
import * as z from "zod/mini";
import type { AdjustmentRange, PaletteCorrection, ProfileAdjustments } from "./profile";

export { DEFAULT_ADJUSTMENT_RANGE } from "./profile";

const HEX_RRGGBB = /^#[0-9A-F]{6}$/i;
const hex = z.string().check(z.regex(HEX_RRGGBB));

// 보드 입력(boardInput)이 이미 쓰는 zod 구성(object·optional·enum·string·regex)만 쓴다 — 새 구성은 보드 진입 직후 합계의
// zod 공유 청크를 키운다(strictObject·array·refine 실측 +0.44KB, 2a-04b1). 모르는 키·배열·역할 중복은 아래에서 직접 거른다.
const correctionSchema = z.object({
  role: z.enum(["primary", "surface", "ink", "muted", "bg"]),
  from: hex,
  to: hex,
  check: z.enum(["C-1", "C-2", "C-3", "C-4", "C-5"]),
});

const adjustmentsSchema = z.object({
  density: z.optional(z.enum(["comfortable", "compact"])),
  contrast: z.optional(z.enum(["aa", "enhanced"])),
  motion: z.optional(z.enum(["L0", "L1", "L2"])),
  purpose: z.optional(z.enum(["booking", "inquiry", "sales", "none"])),
});

const ADJUSTMENT_KEYS = new Set(["density", "contrast", "motion", "purpose", "corrections"]);
const CORRECTION_KEYS = new Set(["role", "from", "to", "check"]);
const unknownKey = (value: object, known: ReadonlySet<string>) => Object.keys(value).find((key) => !known.has(key));

export type AdjustmentsParse = { readonly ok: true; readonly value: ProfileAdjustments } | { readonly ok: false; readonly message: string };

const fail = (message: string): AdjustmentsParse => ({ ok: false, message });
const issuesOf = (error: { readonly issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[] }, prefix: string) =>
  error.issues.map((issue) => `${[prefix, ...issue.path.map(String)].filter(Boolean).join(".") || "adjustments"}: ${issue.message}`).join(", ");

export function parseAdjustments(input: unknown): AdjustmentsParse {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return fail("adjustments: 객체가 아닙니다");
  const extra = unknownKey(input, ADJUSTMENT_KEYS);
  if (extra) return fail(`${extra}: 알 수 없는 조정`);
  const result = adjustmentsSchema.safeParse(input);
  if (!result.success) return fail(issuesOf(result.error, ""));
  const raw = (input as { readonly corrections?: unknown }).corrections;
  if (raw === undefined) return { ok: true, value: result.data };
  if (!Array.isArray(raw)) return fail("corrections: 배열이 아닙니다");
  const corrections: PaletteCorrection[] = [];
  for (const [i, item] of raw.entries()) {
    const extraField = typeof item === "object" && item !== null ? unknownKey(item, CORRECTION_KEYS) : undefined;
    if (extraField) return fail(`corrections.${i}.${extraField}: 알 수 없는 필드`);
    const parsed = correctionSchema.safeParse(item);
    if (!parsed.success) return fail(issuesOf(parsed.error, `corrections.${i}`));
    if (corrections.some((c) => c.role === parsed.data.role)) return fail(`corrections.${i}: 역할마다 보정은 하나입니다`);
    corrections.push(parsed.data);
  }
  return { ok: true, value: { ...result.data, corrections } };
}

/** 허용 범위 밖 값 목록 ("밀도 compact") — 비어 있으면 범위 안 */
export function rangeViolations(adjustments: ProfileAdjustments, range: AdjustmentRange): readonly string[] {
  const out: string[] = [];
  if (adjustments.density !== undefined && !range.density.includes(adjustments.density)) out.push(`밀도 ${adjustments.density}`);
  if (adjustments.contrast !== undefined && !range.contrast.includes(adjustments.contrast)) out.push(`대비 ${adjustments.contrast}`);
  if (adjustments.motion !== undefined && !range.motion.includes(adjustments.motion)) out.push(`모션 ${adjustments.motion}`);
  return out;
}
