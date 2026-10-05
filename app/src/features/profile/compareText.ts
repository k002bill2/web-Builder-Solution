/**
 * 3안 실제 화면 비교 문구 (M2B-5 SPEC 2.4 · 3.3 · 3.4) — 비교 청크 전용. 규칙에서 만든 문장만.
 */
import type { CandidateId } from "../../domain/generation";

export const COMPARE_TEXT = Object.freeze({
  /** 캡션 1 — 동일성은 새 문서에만(Codex R1 P1). 기존 문서 여부는 조회하지 않는다(진입 예산) → 두 문장을 함께 */
  same: "실제 화면 미리보기 — 3안 모두 예시 문구로 그렸습니다. 이 프로젝트에 편집 문서가 없으면 편집 시작이 이 문서로 시작합니다. 이미 편집 중인 문서가 있으면 편집 시작은 그 문서를 엽니다.",
  drawing: "그리는 중…",
  noKit: "프로필 색·글꼴이 없어 기본 모양으로 그렸습니다",
  invalid: "이 안을 그리지 못했습니다 — 구조 미리보기로 표시합니다",
  timeout: "그리는 데 시간이 오래 걸립니다",
  redraw: "다시 그리기",
  pending: "만드는 중",
});

/** 캡션 2 (★MQ-M2B5-2 A) — 비율 축은 편집 문서에 전달되지 않는다(F10) */
export const scaleNotice = (scale: number) => `제목 비율 축은 아직 편집 문서에 반영되지 않아 3안 모두 프로필 비율 ${scale}로 그렸습니다 — 비율 차이는 카드의 구조 미리보기에서 보세요.`;

/** 종결 범주 (3.4) — 그림 · 그림(기본 모양) · 구조 미리보기 · 지연 · 생성 실패 */
export type FrameCategory = "drawn" | "plain" | "structure" | "delay" | "failed";

/** 1안씩 모드·복구 문장 (3.4 표) */
export function categoryText(id: CandidateId, category: FrameCategory): string {
  if (category === "drawn") return `${id}안을 그렸습니다`;
  if (category === "plain") return `${id}안을 그렸습니다 · 기본 모양`;
  if (category === "structure") return `${id}안을 그리지 못해 구조 미리보기로 표시합니다`;
  if (category === "delay") return `${id}안이 아직 그려지지 않았습니다 — 다시 그리기를 누를 수 있습니다`;
  return `${id}안은 만들지 못했습니다`;
}

/** 3열 총계 (3.4) — 그린 수 + 0이 아닌 범주만 */
export function totalText(categories: readonly FrameCategory[]): string {
  const count = (...of: FrameCategory[]) => categories.filter((c) => of.includes(c)).length;
  const [structure, delay, failed] = [count("structure"), count("delay"), count("failed")];
  return [
    `3안 중 ${count("drawn", "plain")}개를 그렸습니다`,
    structure > 0 && `${structure}개는 구조 미리보기로 표시`,
    delay > 0 && `${delay}개는 아직 그려지지 않음`,
    failed > 0 && `${failed}개는 만들지 못했습니다`,
  ]
    .filter(Boolean)
    .join(" · ");
}
