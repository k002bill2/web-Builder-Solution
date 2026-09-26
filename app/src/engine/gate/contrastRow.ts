/**
 * 대비 AA 줄 (R-08 · SPEC 5.12) — 문서 테마(프로필 버전의 적용 값 = effectiveProfile)의 C-1~C-5를
 * `checkProfileContrast`로 **판정만** 한다. 보정 제안(`proposeCorrections` → `nearestCompliantColor`)은 부르지 않는다 —
 * 7:1이 불가능한 조합에서 throw하는 경로(QA D-2A4B2-01)를 게이트가 타지 않게. 대체안은 "프로필에서 보정".
 */
import { formatRatio, type ContrastCheckId } from "../../domain/contrast";
import { effectiveProfile } from "../../domain/effectiveProfile";
import { checkProfileContrast } from "../../domain/profileContrast";
import type { PaletteEntry, PaletteRole } from "../../domain/referenceDetail";
import type { GateTheme } from "../contracts/pending";
import type { GateIssue } from "../contracts/records";
import { GATE_TEXT } from "./gateText";
import { issue } from "./issue";

const ROLES: readonly PaletteRole[] = ["primary", "surface", "ink", "muted", "bg"];
/** contrast.ts relativeLuminance가 받는 모양 — 아니면 계산 전에 막는다(throw 0) */
const HEX = /^#[0-9A-Fa-f]{6}$/;

/** 2a-04 SPEC 3.3 검사 표의 이름 */
const PAIR: Readonly<Record<ContrastCheckId, string>> = {
  "C-1": "버튼 글자(흰 글자 / primary)",
  "C-2": "본문(ink / bg)",
  "C-3": "어두운 카드 글자(ink / primary)",
  "C-4": "교차 배경 글자(ink / surface)",
  "C-5": "보조 글자(muted / bg)",
};

const fail = (cause: string) => issue("R-08", "block", cause, GATE_TEXT.contrastAlternative);

export function contrastIssues(theme: GateTheme): readonly GateIssue[] {
  const { base, adjustments } = theme.profile;
  const applied = effectiveProfile(base, adjustments);
  const palette = ROLES.map((role) => ({ role, hex: applied.color_tokens[role]?.$value as unknown }));
  const unreadable = palette.filter((p) => typeof p.hex !== "string" || !HEX.test(p.hex));
  if (unreadable.length > 0) return unreadable.map((p) => fail(`${p.role}: ${GATE_TEXT.contrastUnreadable}`));
  const level = adjustments.contrast === "enhanced" ? "enhanced" : "aa";
  const checks = checkProfileContrast(palette as PaletteEntry[], applied.component_choices.card_style?.surfaceTone, level);
  return checks.filter((c) => !c.pass).map((c) => fail(GATE_TEXT.contrastFail(c.id, PAIR[c.id], formatRatio(c.ratio), formatRatio(c.target))));
}
