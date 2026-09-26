/**
 * 보드 입력 검증 (SPEC 3.5·8.2) — 사용자 대표색 `#RRGGBB`·폰트 허용 목록·선택 행 id.
 * zod는 이 모듈에서만 쓴다 — 조작 뒤 청크(BUNDLE-HEADROOM): 선택 저장(writeBodyLoader `loadBoardInput` ← savePicks)과
 * 대표색 검사(boardInputLoader ← 필드 포커스·blur·Enter)가 처음 부를 때 받는다. /compare·/profile 진입 직후 합계에 없다.
 * 공통 청크 모듈(compareBoard)은 타입만 import한다 — 값을 import하면 rolldown이 compareBoard를 공통 청크에서 떼어
 * 공통 JS가 는다(인벤토리 3절). 그래서 행 id 목록은 호출자가 넘긴다.
 */
import * as z from "zod/mini";
import type { CustomStyle, PickableRowId, Picks } from "./compareBoard";
import { FONT_OPTIONS, type AllowedFontId } from "./fonts";

export const PRIMARY_COLOR_ERROR = "대표색은 #RRGGBB 형식의 6자리 hex로 입력하세요 (예: #8B5E3C)";
export const FONT_ERROR = "허용 목록에서 사용할 수 있는 폰트를 고르세요";

const HEX_RRGGBB = /^#[0-9A-F]{6}$/i;
const ENABLED_FONT_IDS = FONT_OPTIONS.filter((f) => f.enabled).map((f) => f.id) as [AllowedFontId, ...AllowedFontId[]];

const customStyleSchema = z.object({
  primaryColor: z.optional(z.string({ error: PRIMARY_COLOR_ERROR }).check(z.regex(HEX_RRGGBB, { error: PRIMARY_COLOR_ERROR }))),
  fontFamily: z.optional(z.enum(ENABLED_FONT_IDS, { error: FONT_ERROR })),
});


export type CustomStyleErrors = Partial<Record<keyof CustomStyle, string>>;

export type ParseResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: Readonly<Record<string, string>> };

export function parseCustomStyle(input: unknown): ParseResult<CustomStyle> & ({ ok: true } | { errors: CustomStyleErrors }) {
  const result = customStyleSchema.safeParse(input);
  if (!result.success) {
    const errors = Object.fromEntries(result.error.issues.map((issue) => [String(issue.path[0] ?? "custom"), issue.message]));
    return { ok: false, errors };
  }
  const { primaryColor, fontFamily } = result.data;
  return {
    ok: true,
    value: {
      ...(primaryColor !== undefined && { primaryColor: primaryColor.toUpperCase() }),
      ...(fontFamily !== undefined && { fontFamily }),
    },
  };
}

/**
 * savePicks 입력 전체 — 행 id·레퍼런스 id 형식 + 사용자 스타일. 보드 열 소속·회수 여부는 저장소가 따로 본다.
 * `rowIds`는 선택 가능한 행 id(`PICKABLE_ROW_IDS`) — 호출자가 넘긴다(위 머리 주석).
 */
export function parseBoardInput(
  picks: unknown,
  custom: unknown,
  rowIds: readonly PickableRowId[],
): ParseResult<{ readonly picks: Picks; readonly custom: CustomStyle }> {
  const picksSchema = z.partialRecord(z.enum(rowIds as [PickableRowId, ...PickableRowId[]]), z.string().check(z.minLength(1)));
  const parsedPicks = picksSchema.safeParse(picks);
  const parsedCustom = parseCustomStyle(custom);
  if (!parsedPicks.success) return { ok: false, errors: { picks: parsedPicks.error.issues[0]?.message ?? "잘못된 선택" } };
  if (!parsedCustom.ok) return parsedCustom;
  return { ok: true, value: { picks: parsedPicks.data, custom: parsedCustom.value } };
}
