/**
 * 썸네일 문구 (B-M3P-01 · M3P-4 QA QB-01) — 썸네일 렌더 입력(`referenceDoc`)에서만 텍스트 슬롯을 덮는다. 빌드 도구 전용(앱 번들 밖 — thumbsImportGuard).
 * 표는 편집기 새 문서와 공용(`data/industryCopy`, B-M3P-06) — 같은 레퍼런스 = 같은 hero 문구. 표 밖 업종·레이아웃·톤은 throw — 조용한 폴백 0.
 */
import { industryCopyGap, industryCopyOf } from "../data/industryCopy";
import type { DesignReference } from "../domain/reference";

/** 레퍼런스 → 덮을 문구(키 = `섹션 유형/슬롯 키`, sampleCopy와 같은 키 모양) */
export function thumbCopyOf(reference: Pick<DesignReference, "id" | "industry" | "layoutType" | "visualTags">): Readonly<Record<string, string>> {
  const gap = industryCopyGap(reference);
  if (gap !== undefined) throw new Error(`썸네일 문구 ${reference.id}: ${gap}는 문구 표 밖입니다`);
  return industryCopyOf(reference)!;
}
