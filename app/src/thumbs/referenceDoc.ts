/**
 * 레퍼런스 → 렌더 입력 (M3P SPEC 3절 공통 렌더 입력) — 비교 `sectionPlan` → `writeStartDoc`(앱 "편집 시작"과 같은 엔진 변형 대응·예시 문구) +
 * 상세 팔레트 5역할·글꼴·간격 + 비교 카드·이미지 비율 → KitTokenInput. 시각·난수 0(고정 상수) → 같은 레퍼런스 = 같은 문서.
 * 목록 밖 값(카드 모양·비율·역할 누락)은 throw — 조용한 폴백 0. 빌드 도구 전용(앱 번들 밖 — thumbsImportGuard).
 */
import { writeStartDoc, type StartDocWrite } from "../data/startDocWrite";
import { generatedReferenceComparisonAttributes, generatedReferenceDetailFixtures } from "../fixtures/generatedReferenceDetails";
import { referenceComparisonAttributes } from "../fixtures/referenceComparisons";
import { referenceDetailFixtures } from "../fixtures/referenceDetails";
import type { CanvasPalette, KitCardStyle, KitTokenInput } from "../render/protocol";

const CARD_STYLES: readonly KitCardStyle[] = ["bordered-lg", "bordered-md", "elevated", "flat"];
const RATIOS: readonly KitTokenInput["mediaRatio"][] = ["16:9", "4:5", "1:1"];
const ROLES = ["primary", "surface", "ink", "muted", "bg"] as const;
/** 썸네일 문서 고정값 — 저장소 값이 아니라 결정성용 상수 */
const THUMB_DOC = Object.freeze({ libraryVersion: "thumbs", generatorVersion: "thumbs-1", profileVersion: 1, updatedAt: "2026-10-06T00:00:00.000Z" });

function oneOf<T extends string>(list: readonly T[], value: string, what: string, id: string): T {
  const found = list.find((v) => v === value);
  if (!found) throw new Error(`썸네일 ${id}: ${what} "${value}"는 킷 목록 밖입니다`);
  return found;
}

/** 큐레이션 + 생성 레퍼런스(ADR-004 개정 7 결정 5) — 같은 상세·비교 형태라 렌더 입력 규칙은 그대로 */
const DETAILS = { ...referenceDetailFixtures, ...generatedReferenceDetailFixtures };
const ATTRIBUTES = { ...referenceComparisonAttributes, ...generatedReferenceComparisonAttributes };

export interface RenderInput {
  /** 엔진 문서(PageDoc) — engine 직접 import 없이 writeStartDoc 결과 타입에서(engineImportGuard) */
  readonly doc: Extract<StartDocWrite, { readonly ok: true }>["doc"];
  readonly kitTokens: KitTokenInput;
}

export function referenceRenderInput(id: string): RenderInput {
  const detail = DETAILS[id];
  const attributes = ATTRIBUTES[id];
  if (!detail || !attributes) throw new Error(`썸네일 렌더 입력 없음: ${id}`);
  const written = writeStartDoc({
    candidateId: `thumb-${id}`,
    sections: attributes.sectionPlan.map((s) => ({ ...s, motion: "L1" })),
    libraryVersion: THUMB_DOC.libraryVersion,
    generatorVersion: THUMB_DOC.generatorVersion,
    profileVersion: THUMB_DOC.profileVersion,
    projectId: `thumb-${id}`,
    updatedAt: THUMB_DOC.updatedAt,
  });
  if (!written.ok) throw new Error(`썸네일 ${id}: ${written.alert}`);
  const hexOf = (role: (typeof ROLES)[number]) => {
    const hex = detail.palette.find((p) => p.role === role)?.hex;
    if (!hex) throw new Error(`썸네일 ${id}: 팔레트 역할 ${role} 없음`);
    return hex;
  };
  const palette = Object.fromEntries(ROLES.map((role) => [role, hexOf(role)])) as CanvasPalette;
  const grid = Number.parseFloat(detail.spacing.grid);
  if (!Number.isFinite(grid) || grid <= 0) throw new Error(`썸네일 ${id}: 간격 grid "${detail.spacing.grid}"`);
  return {
    doc: written.doc,
    kitTokens: {
      palette,
      card: { tone: attributes.card.surfaceTone === "dark" ? "dark" : "light", style: oneOf(CARD_STYLES, attributes.card.style, "카드 모양", id) },
      type: detail.typography,
      space: { grid, sectionGap: detail.spacing.sectionGap, density: "comfortable" },
      mediaRatio: oneOf(RATIOS, attributes.imageRatio, "이미지 비율", id),
    },
  };
}
