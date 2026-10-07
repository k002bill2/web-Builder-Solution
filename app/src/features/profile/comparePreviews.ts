/**
 * 3안 → 미리보기 문서 (M2B-5 SPEC 3.2) — 비교 청크 전용, 순수·동기. 편집 시작과 같은 변환(`writeStartDoc`)을 저장소 없이 부른다(쓰기 0).
 * 문구 = 편집 시작(memoryDocBook)과 같은 기준 레퍼런스 업종 문구(`industryCopyOf`, B-M3P-07) → 미리보기 hero = 편집 시작 뒤 편집기 hero.
 *  카드는 부르는 쪽(/profile이 이미 받은 출처 카드)이 넘긴다 — 이 청크가 픽스처를 import하면 카드 픽스처 청크가 갈라진다(빌드 실측). 카드 없음·표 밖 = 예시 문구.
 * 고정 projectId·시각 = 결정성(같은 안 → 같은 해시). 프로젝트가 없는 프로필도 문서를 만든다.
 * 킷 토큰 = 보는 버전에 편집기 `docKitTokens`(features/studio/docPurpose)와 같은 규칙 — 3안 공통, 제목 비율 덮어쓰기 0(MQ-M2B5-2 A).
 *  값 import 대신 복제한다: docPurpose를 import하면 편집기 StudioLayout 청크와 공유 청크로 갈라져 `/studio` 진입 +0.22KB(S1 1차 빌드 실측 — PROGRESS, 멈춤선 +0.03).
 *  같은 값인지는 comparePreviews.test가 docKitTokens와 대조한다(보정·촘촘·어두운 카드·부분 레코드).
 */
import { industryCopyOf, type CopyReference } from "../../data/industryCopy";
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

/** base = 보는 버전의 기준 레퍼런스 카드(viewed.baseReferenceId) */
export function comparePreviews(job: Pick<GenerationJob, "candidates" | "libraryVersion" | "generatorVersion">, viewed: ProfileVersion, base?: CopyReference): readonly ComparePreview[] {
  const copy = base && industryCopyOf(base);
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
      ...(copy && { copy }),
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
