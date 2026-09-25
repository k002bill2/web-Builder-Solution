/** 역할 팔레트 (SPEC 8.3) — 보드 대비 경고와 확정이 같은 결과를 쓴다(AC-24). */
import type { PaletteEntry, PaletteRole } from "./referenceDetail";

export const PALETTE_ROLES: readonly PaletteRole[] = Object.freeze(["primary", "surface", "ink", "muted", "bg"]);

/**
 * 사용자 대표색이 있으면 대표색만 바꾸고 surface·ink·muted·bg는 팔레트 행(선택/기본값)에서 가져온다.
 * 결과는 항상 역할 5개, 대문자 hex. 대표색 원값 검증(#RRGGBB)은 호출 전에 끝나 있어야 한다.
 */
export function derivePalette(primaryColor: string | undefined, base: readonly PaletteEntry[]): readonly PaletteEntry[] {
  return PALETTE_ROLES.map((role) => {
    if (role === "primary" && primaryColor !== undefined) return { role, hex: primaryColor.toUpperCase() };
    const entry = base.find((p) => p.role === role);
    if (!entry) throw new Error(`팔레트 행에 ${role} 역할이 없습니다`);
    return { role, hex: entry.hex.toUpperCase() };
  });
}
