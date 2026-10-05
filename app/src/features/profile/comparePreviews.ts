/**
 * 3안 → 미리보기 문서 (M2B-5 SPEC 3.2) — 비교 청크 전용, 순수·동기. 편집 시작과 같은 변환(`writeStartDoc`)을 저장소 없이 부른다(쓰기 0).
 * 고정 projectId·시각 = 결정성(같은 안 → 같은 해시). 프로젝트가 없는 프로필도 문서를 만든다.
 * 킷 토큰 = 보는 버전에 편집기 `docKitTokens`(features/studio/docPurpose)와 같은 규칙 — 3안 공통, 제목 비율 덮어쓰기 0(MQ-M2B5-2 A).
 *  값 import 대신 복제한다: docPurpose를 import하면 편집기 StudioLayout 청크와 공유 청크로 갈라져 `/studio` 진입 +0.22KB(S1 1차 빌드 실측 — PROGRESS, 멈춤선 +0.03).
 *  같은 값인지는 comparePreviews.test가 docKitTokens와 대조한다(보정·촘촘·어두운 카드·부분 레코드).
 */
import { writeStartDoc, type StartDocWrite } from "../../data/startDocWrite";
import type { CandidateFailure, CandidateId, CandidatePlan, GenerationJob } from "../../domain/generation";
import type { ProfileVersion } from "../../domain/profile";
import type { CanvasPalette, KitCardStyle, KitTokenInput } from "../../render/protocol";

export const PREVIEW_PROJECT_ID = "preview";
export const PREVIEW_UPDATED_AT = "1970-01-01T00:00:00.000Z";

export type ComparePreview =
  | { readonly id: CandidateId; readonly kind: "doc"; readonly plan: CandidatePlan; readonly write: StartDocWrite }
  | { readonly id: CandidateId; readonly kind: "failed"; readonly failure: CandidateFailure }
  | { readonly id: CandidateId; readonly kind: "pending" };

export function comparePreviews(job: Pick<GenerationJob, "candidates" | "libraryVersion" | "generatorVersion">, viewed: ProfileVersion): readonly ComparePreview[] {
  return job.candidates.map((c): ComparePreview => {
    if (c.status === "failed") return { id: c.id, kind: "failed", failure: c };
    if (c.status === "pending") return { id: c.id, kind: "pending" };
    const write = writeStartDoc({
      candidateId: c.id,
      sections: c.plan.sections,
      libraryVersion: job.libraryVersion,
      generatorVersion: job.generatorVersion,
      profileVersion: viewed.version,
      projectId: PREVIEW_PROJECT_ID,
      updatedAt: PREVIEW_UPDATED_AT,
    });
    return { id: c.id, kind: "doc", plan: c.plan, write };
  });
}

const CARD_STYLES: readonly KitCardStyle[] = ["bordered-lg", "bordered-md", "elevated", "flat"];
const RATIOS: readonly KitTokenInput["mediaRatio"][] = ["16:9", "4:5", "1:1"];
const pick = <T extends string>(list: readonly T[], value: string | undefined, fallback: T): T => list.find((v) => v === value) ?? fallback;

/** docPalette와 같은 규칙 — 팔레트 역할 5개, 보정은 나중 것이 이긴다. 팔레트 없는 부분 레코드 = undefined */
function palette(version: ProfileVersion): CanvasPalette | undefined {
  const tokens = version.base.color_tokens as Partial<ProfileVersion["base"]["color_tokens"]> | undefined;
  if (!tokens?.primary) return undefined;
  const fixed = (role: keyof CanvasPalette) => version.adjustments.corrections?.findLast((c) => c.role === role)?.to ?? tokens[role]?.$value ?? "";
  return { primary: fixed("primary"), surface: fixed("surface"), ink: fixed("ink"), muted: fixed("muted"), bg: fixed("bg") };
}

/** docKitTokens(계열, 보는 버전)과 같은 값 — 팔레트·글꼴 없는 부분 레코드 = undefined(렌더 문서는 킷 대신 폴백) */
export function compareKitTokens(viewed: ProfileVersion): KitTokenInput | undefined {
  const colors = palette(viewed);
  if (!colors || !viewed.base.typography_tokens) return undefined;
  const { typography_tokens, spacing_tokens, component_choices: choices = {} } = viewed.base;
  const { family, headingWeight, bodyWeight, scale } = typography_tokens;
  const grid = Number.parseFloat(spacing_tokens.grid);
  return {
    palette: colors,
    card: { tone: choices.card_style?.surfaceTone === "dark" ? "dark" : "light", style: pick(CARD_STYLES, choices.card_style?.style, "bordered-md") },
    type: { family, headingWeight, bodyWeight, scale },
    space: { grid: Number.isFinite(grid) && grid > 0 ? grid : 8, sectionGap: spacing_tokens.sectionGap, density: viewed.adjustments.density ?? "comfortable" },
    mediaRatio: pick(RATIOS, choices.media_ratio, "4:5"),
  };
}
