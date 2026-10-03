import type { PageDoc } from "../../engine/contracts/pageDoc";
import { RENDERED_VARIANTS } from "./renderedVariants";

/** 캔버스 캡션 등급 3상태 (m2a 3.4 — F1을 "시안"이라 부르지 않는다) */
export const CANVAS_CAPTIONS = {
  f0: "구조 미리보기 (F0) — 섹션 구성과 실제 문구만 보여 줍니다. 실제 모양으로 그린 섹션은 아직 없습니다.",
  partial: (total: number, fallback: number) =>
    `실제 렌더 (F1 · 일부) — 섹션 ${total}개 중 ${fallback}개는 아직 구조 미리보기입니다. 이 섹션이 있으면 HTML·zip으로 내보낼 수 없습니다.`,
  f1: "실제 렌더 (F1) — 프로필의 색·글자로 그린 페이지입니다. 이미지는 고른 이미지 또는 자체 그래픽이고, 글꼴·모션은 아직 기본 설정입니다.",
} as const;

/** 문서 상태 → 캡션. 킷 토큰이 없으면(프로필 조회 전·실패) 렌더 문서가 전부 폴백으로 그리므로 F0 */
export function canvasCaption(doc: PageDoc, hasKitTokens: boolean): string {
  const total = doc.sections.length;
  const fallback = hasKitTokens ? doc.sections.filter((s) => !RENDERED_VARIANTS.includes(`${s.type}/${s.variant}`)).length : total;
  return fallback === total ? CANVAS_CAPTIONS.f0 : fallback ? CANVAS_CAPTIONS.partial(total, fallback) : CANVAS_CAPTIONS.f1;
}
