import type { PageDoc } from "../../engine/contracts/pageDoc";
import type { RenderImages } from "./images/store/types";
import { RENDERED_VARIANTS } from "./renderedVariants";

/** 캔버스 캡션 등급 3상태 (m2a 3.4 — F1을 "시안"이라 부르지 않는다) */
export const CANVAS_CAPTIONS = {
  f0: "구조 미리보기 (F0) — 섹션 구성과 실제 문구만 보여 줍니다. 실제 모양으로 그린 섹션은 아직 없습니다.",
  partial: (total: number, fallback: number) =>
    `실제 렌더 (F1 · 일부) — 섹션 ${total}개 중 ${fallback}개는 아직 구조 미리보기입니다. 이 섹션이 있으면 HTML·zip으로 내보낼 수 없습니다.`,
  /** 모두 실렌더 = F2(M2c · MQ-C8 ★A — 키 이름은 기존 참조 유지). "최종"은 F3(게이트·발행)로 아껴 둔다 */
  f1: "시안 (F2) — 프로필의 색·글자·글꼴·모션과 고른 이미지 또는 자체 그래픽으로 그린 페이지입니다.",
} as const;

/** 문서 상태 → 캡션. 킷 토큰이 없으면(프로필 조회 전·실패) 렌더 문서가 전부 폴백으로 그리므로 F0. F2면 잃은 이미지(켜진 로컬 id가 images 맵에 없음) 수를 덧붙인다 */
export function canvasCaption(doc: PageDoc, hasKitTokens: boolean, images?: RenderImages): string {
  const total = doc.sections.length;
  const fallback = hasKitTokens ? doc.sections.filter((s) => !RENDERED_VARIANTS.includes(`${s.type}/${s.variant}`)).length : total;
  if (fallback === total) return CANVAS_CAPTIONS.f0;
  if (fallback) return CANVAS_CAPTIONS.partial(total, fallback);
  const lost = new Set(doc.sections.flatMap((s) => Object.values(s.slots).flatMap((v) => (typeof v === "object" && v.enabled && typeof v.source === "string" && !images?.[v.source] ? [v.source] : [])))).size;
  return lost ? `${CANVAS_CAPTIONS.f1} 다시 골라야 하는 이미지 ${lost}장은 자체 그래픽으로 보입니다.` : CANVAS_CAPTIONS.f1;
}
